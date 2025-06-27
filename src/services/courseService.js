// web/src/services/courseService.js - 성능 최적화 + 올바른 데이터 구조 + 에러 처리 강화
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    addDoc,
    documentId
} from 'firebase/firestore'
import { db } from './firebase'
import { FIREBASE_COLLECTIONS, FLASK_SUBCOLLECTIONS } from '@/utils/constants'

class CourseService {
    // 캐시 설정
    static CACHE_KEY = 'courses_cache'
    static CACHE_DURATION = 5 * 60 * 1000 // 5분
    static PAGE_SIZE = 20

    // 메모리 캐시
    static memoryCache = new Map()

    /**
     * 메모리 캐시 관리
     */
    static getFromMemoryCache(key) {
        const cached = this.memoryCache.get(key)
        if (!cached) return null

        if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
            this.memoryCache.delete(key)
            return null
        }

        return cached.data
    }

    static setMemoryCache(key, data) {
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now()
        })
    }

    /**
     * uploads 데이터를 courses 형식으로 변환 (올바른 데이터 구조 + hasVideo 필드 추가)
     */
    static convertUploadToCourse(uploadDoc) {
        const data = uploadDoc.data()

        // 원본 데이터 로깅 (디버깅용)
        console.log('📄 원본 uploads 데이터:', {
            id: uploadDoc.id,
            group_name: data.group_name,
            video_url: data.video_url,
            videoUrl: data.videoUrl,
            hasVideo: data.hasVideo,
            data_keys: Object.keys(data).slice(0, 10) // 처음 10개 키만
        })

        // 비디오 URL 체크 - 여러 필드명 지원
        const videoUrl = data.video_url || data.videoUrl || data.video_link || ''
        const hasVideo = !!videoUrl && videoUrl.trim() !== ''

        return {
            id: uploadDoc.id,
            // 기본 정보 (올바른 필드명 사용)
            title: data.group_name || data.title || '제목 없음',
            description: data.content_description || data.description || '',

            // 카테고리 정보
            category: {
                main: data.main_category || '',
                middle: data.sub_category || '',
                leaf: data.sub_sub_category || ''
            },

            // 미디어 정보 (hasVideo 필드 추가)
            videoUrl: videoUrl,
            hasVideo: hasVideo, // hasVideo 필드 명시적 추가
            thumbnailUrl: data.thumbnail_url || data.thumbnailUrl || '/default-thumbnail.jpg',
            qrUrl: data.qr_url || data.qrUrl || '',

            // 학습 정보
            duration: data.duration_string || data.duration || '30분',
            difficulty: data.difficulty || 'intermediate',

            // 메타데이터
            uploadedAt: data.upload_date || new Date(),
            createdAt: data.createdAt || data.upload_date || new Date(),
            updatedAt: data.updatedAt || new Date(),

            // 통계 정보
            enrolledCount: data.enrolled_count || data.enrolledCount || 0,
            completedCount: data.completed_count || data.completedCount || 0,
            completionRate: data.completion_rate || 0,
            rating: data.rating || 0,
            reviewCount: data.review_count || data.reviewCount || 0,

            // 언어 정보
            languageVideos: data.language_videos || {},
            hasMultipleLanguages: Object.keys(data.language_videos || {}).length > 1,
            availableLanguages: data.languages || Object.keys(data.language_videos || {}) || ['ko'],
            hasLanguageVideos: false, // 나중에 로드

            // Railway 프록시 정보
            railwayProxyEnabled: data.railway_proxy_enabled !== false,
            originalS3Key: data.s3_key || '',

            // 태그 (카테고리 기반 자동 생성)
            tags: [data.main_category, data.sub_category, data.sub_sub_category].filter(Boolean),

            // 원본 데이터 참조 (디버깅용)
            _originalData: data
        }
    }

    /**
     * Flask API에서 강의 목록 가져오기
     */
    static async getCoursesFromFlask() {
        try {
            console.log('🔄 Flask API에서 강의 목록 로드 시작...')

            const response = await fetch('/api/courses', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`Flask API 오류: ${response.status}`)
            }

            const data = await response.json()
            console.log(`✅ Flask API에서 ${data.courses?.length || 0}개 강의 로드`)

            return data.courses || []
        } catch (error) {
            console.error('Flask API 강의 로드 실패:', error)
            return []
        }
    }

    /**
     * 사용자의 수강 정보와 관련 강의를 최적화된 방식으로 가져오기
     */
    static async getUserEnrollmentsWithCourses(userId) {
        try {
            // 1. 메모리 캐시 확인
            const cacheKey = `enrollments_${userId}`
            const cached = this.getFromMemoryCache(cacheKey)
            if (cached) {
                console.log('📦 메모리 캐시에서 enrollment 데이터 사용')
                return cached
            }

            console.log('🔄 최적화된 enrollment 로드 시작...')

            // 2. 수강 정보 먼저 가져오기
            const enrollmentsQuery = query(
                collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS),
                where('userId', '==', userId),
                orderBy('enrolledAt', 'desc')
            )

            const enrollmentSnapshot = await getDocs(enrollmentsQuery)

            if (enrollmentSnapshot.empty) {
                return []
            }

            // 3. courseId 목록 추출
            const courseIds = []
            const enrollmentMap = new Map()

            enrollmentSnapshot.forEach(doc => {
                const data = doc.data()
                courseIds.push(data.courseId)
                enrollmentMap.set(data.courseId, {
                    id: doc.id,
                    ...data,
                    enrolledAt: data.enrolledAt?.toDate() || new Date(),
                    completedAt: data.completedAt?.toDate() || null
                })
            })

            // 4. 필요한 강의만 배치로 가져오기 (최대 10개씩)
            const courses = []
            const batchSize = 10

            for (let i = 0; i < courseIds.length; i += batchSize) {
                const batch = courseIds.slice(i, i + batchSize)
                const coursesQuery = query(
                    collection(db, FIREBASE_COLLECTIONS.UPLOADS),
                    where(documentId(), 'in', batch)
                )

                const coursesSnapshot = await getDocs(coursesQuery)
                coursesSnapshot.forEach(doc => {
                    courses.push(this.convertUploadToCourse(doc))
                })
            }

            // 5. enrollment와 course 데이터 병합
            const enrollmentsWithCourses = courseIds.map(courseId => {
                const enrollment = enrollmentMap.get(courseId)
                const course = courses.find(c => c.id === courseId)

                return {
                    ...enrollment,
                    course: course || null
                }
            }).filter(e => e.course !== null)

            // 6. 캐시 저장
            this.setMemoryCache(cacheKey, enrollmentsWithCourses)

            // 로컬스토리지에도 저장
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: enrollmentsWithCourses,
                    timestamp: Date.now()
                }))
            } catch (e) {
                console.warn('로컬스토리지 저장 실패:', e)
            }

            console.log(`✅ ${enrollmentsWithCourses.length}개 enrollment 최적화 로드 완료`)
            return enrollmentsWithCourses
        } catch (error) {
            console.error('❌ 최적화된 enrollment 로드 실패:', error)
            throw error
        }
    }

    /**
     * 필요한 강의만 선택적으로 로드 (언어 정보 제외)
     */
    static async getCoursesLight(courseIds) {
        try {
            if (!courseIds || courseIds.length === 0) return []

            const courses = []
            const batchSize = 10

            // Firestore의 'in' 쿼리는 최대 10개까지만 지원
            for (let i = 0; i < courseIds.length; i += batchSize) {
                const batch = courseIds.slice(i, i + batchSize)
                const coursesQuery = query(
                    collection(db, FIREBASE_COLLECTIONS.UPLOADS),
                    where(documentId(), 'in', batch)
                )

                const snapshot = await getDocs(coursesQuery)
                snapshot.forEach(doc => {
                    courses.push(this.convertUploadToCourse(doc))
                })
            }

            return courses
        } catch (error) {
            console.error('강의 선택 로드 오류:', error)
            return []
        }
    }

    /**
     * 단일 강의의 언어 정보 로드 (필요시에만)
     */
    static async loadLanguageVideos(courseId) {
        try {
            const cacheKey = `lang_videos_${courseId}`
            const cached = this.getFromMemoryCache(cacheKey)
            if (cached) return cached

            const courseRef = doc(db, FIREBASE_COLLECTIONS.UPLOADS, courseId)
            const langVideosRef = collection(courseRef, FLASK_SUBCOLLECTIONS.LANGUAGE_VIDEOS)
            const langVideosSnapshot = await getDocs(langVideosRef)

            const languageVideos = {}
            langVideosSnapshot.forEach(langDoc => {
                languageVideos[langDoc.id] = langDoc.data()
            })

            this.setMemoryCache(cacheKey, languageVideos)
            return languageVideos
        } catch (error) {
            console.error('언어 비디오 로드 실패:', error)
            return {}
        }
    }

    /**
     * Firebase uploads 컬렉션에서 전체 강의 목록 가져오기
     */
    static async getCoursesFromUploads() {
        try {
            console.log('🔄 Firebase uploads에서 강의 로드 시작...')

            const uploadsRef = collection(db, FIREBASE_COLLECTIONS.UPLOADS)
            const q = query(uploadsRef, orderBy('upload_date', 'desc'))
            const snapshot = await getDocs(q)

            console.log(`📊 uploads 컬렉션에서 ${snapshot.size}개 문서 발견`)

            const courses = []

            for (const doc of snapshot.docs) {
                try {
                    const course = this.convertUploadToCourse(doc)

                    // language_videos 서브컬렉션 로드
                    try {
                        const langVideosRef = collection(doc.ref, FLASK_SUBCOLLECTIONS.LANGUAGE_VIDEOS)
                        const langVideosSnapshot = await getDocs(langVideosRef)

                        const languageVideos = {}
                        langVideosSnapshot.forEach(langDoc => {
                            languageVideos[langDoc.id] = langDoc.data()
                        })

                        course.languageVideos = languageVideos
                        course.availableLanguages = Object.keys(languageVideos).length > 0
                            ? Object.keys(languageVideos)
                            : ['ko'] // 기본값으로 한국어 설정
                        course.hasMultipleLanguages = course.availableLanguages.length > 1
                    } catch (error) {
                        console.warn(`언어별 비디오 로드 실패 (${doc.id}):`, error)
                        // 서브컬렉션 로드 실패해도 기본값 설정
                        course.availableLanguages = ['ko']
                    }

                    courses.push(course)
                } catch (error) {
                    console.error(`강의 변환 실패 (${doc.id}):`, error)
                }
            }

            console.log(`✅ uploads에서 ${courses.length}개 강의 로드 완료`)
            return courses
        } catch (error) {
            console.error('uploads 강의 목록 조회 오류:', error)
            throw error
        }
    }

    /**
     * Firestore에서 전체 강의 목록 가져오기 (캐싱 적용)
     */
    static async getCoursesFromFirestore() {
        try {
            // 1. 먼저 캐시 확인
            const cachedCourses = this.getCachedCourses()
            if (cachedCourses) {
                return { courses: cachedCourses, fromCache: true }
            }

            // 2. uploads 컬렉션에서 데이터 로드
            const courses = await this.getCoursesFromUploads()

            // 3. 캐시에 저장
            this.setCachedCourses(courses)

            return { courses, fromCache: false }
        } catch (error) {
            console.error('Firestore 강의 목록 조회 오류:', error)

            if (error.code === 'permission-denied') {
                console.warn('Firestore 권한이 거부되었습니다. Flask API로 대체 시도...')
                // Flask API로 대체
                const flaskCourses = await this.getCoursesFromFlask()
                return { courses: flaskCourses, fromCache: false, error: 'permission-denied' }
            }

            throw error
        }
    }

    /**
     * 캐시에서 강의 목록 가져오기
     */
    static getCachedCourses() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY)
            if (!cached) return null

            const { courses, timestamp } = JSON.parse(cached)
            const now = Date.now()

            // 캐시 만료 확인
            if (now - timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(this.CACHE_KEY)
                return null
            }

            console.log('📦 캐시에서 강의 로드:', courses.length)
            return courses
        } catch (error) {
            console.error('캐시 로드 오류:', error)
            return null
        }
    }

    /**
     * 캐시에 강의 목록 저장
     */
    static setCachedCourses(courses) {
        try {
            const cacheData = {
                courses,
                timestamp: Date.now()
            }
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
        } catch (error) {
            console.error('캐시 저장 오류:', error)
        }
    }

    /**
     * 페이지네이션으로 전체 강의 로드 (언어 정보 제외)
     */
    static async getCoursesWithPaginationOptimized(lastDoc = null, pageSize = this.PAGE_SIZE) {
        try {
            console.log('📄 최적화된 페이지 로드...')
            const uploadsRef = collection(db, FIREBASE_COLLECTIONS.UPLOADS)

            let q
            if (lastDoc) {
                q = query(
                    uploadsRef,
                    orderBy('upload_date', 'desc'),
                    startAfter(lastDoc),
                    limit(pageSize)
                )
            } else {
                q = query(
                    uploadsRef,
                    orderBy('upload_date', 'desc'),
                    limit(pageSize)
                )
            }

            const snapshot = await getDocs(q)
            const courses = []
            let lastDocument = null

            // 언어 정보 로드 없이 기본 정보만
            snapshot.forEach(doc => {
                const course = this.convertUploadToCourse(doc)
                course.hasLanguageVideos = true // 플래그만 설정
                courses.push(course)
                lastDocument = doc
            })

            console.log(`✅ ${courses.length}개 강의 빠른 로드`)

            return {
                courses,
                lastDoc: lastDocument,
                hasMore: courses.length === pageSize
            }
        } catch (error) {
            console.error('페이지네이션 조회 오류:', error)
            throw error
        }
    }

    /**
     * 페이지네이션으로 강의 로드 (기존 메서드 - 호환성)
     */
    static async getCoursesWithPagination(lastDoc = null) {
        return this.getCoursesWithPaginationOptimized(lastDoc, this.PAGE_SIZE)
    }

    /**
     * 강의 상세 정보 가져오기 (캐싱 적용 + 에러 처리 강화)
     */
    static async getCourseById(courseId) {
        try {
            console.log(`🔍 강의 상세 조회 시작: ${courseId}`)

            // 캐시 확인
            const cacheKey = `course_${courseId}`
            const cached = this.getFromMemoryCache(cacheKey)
            if (cached) {
                console.log(`📦 메모리 캐시에서 강의 상세 로드: ${courseId}`)
                return cached
            }

            // Firestore 조회
            const courseDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.UPLOADS, courseId))

            if (courseDoc.exists()) {
                console.log(`✅ Firestore에서 강의 발견: ${courseId}`)
                const course = this.convertUploadToCourse(courseDoc)

                // language_videos 서브컬렉션 로드
                try {
                    const langVideosRef = collection(courseDoc.ref, FLASK_SUBCOLLECTIONS.LANGUAGE_VIDEOS)
                    const langVideosSnapshot = await getDocs(langVideosRef)

                    const languageVideos = {}
                    langVideosSnapshot.forEach(langDoc => {
                        languageVideos[langDoc.id] = langDoc.data()
                    })

                    course.languageVideos = languageVideos
                    course.availableLanguages = Object.keys(languageVideos).length > 0
                        ? Object.keys(languageVideos)
                        : ['ko']
                    course.hasMultipleLanguages = course.availableLanguages.length > 1
                } catch (error) {
                    console.warn(`언어별 비디오 로드 실패 (${courseId}):`, error)
                    course.availableLanguages = ['ko']
                }

                // 추가 메타데이터 설정
                course.detailsLoaded = true

                // 캐시 저장
                this.setMemoryCache(cacheKey, course)

                return course
            } else {
                console.warn(`❌ Firestore에서 강의를 찾을 수 없음: ${courseId}`)

                // Flask API에서 시도
                const flaskCourses = await this.getCoursesFromFlask()
                const flaskCourse = flaskCourses.find(c => c.id === courseId)

                if (flaskCourse) {
                    console.log(`✅ Flask API에서 강의 발견: ${courseId}`)
                    return flaskCourse
                }

                return null
            }
        } catch (error) {
            console.error(`강의 상세 조회 오류 (${courseId}):`, error)

            // 오류 발생 시 Flask API 시도
            try {
                const flaskCourses = await this.getCoursesFromFlask()
                const flaskCourse = flaskCourses.find(c => c.id === courseId)
                if (flaskCourse) {
                    return flaskCourse
                }
            } catch (flaskError) {
                console.error('Flask API 대체 조회도 실패:', flaskError)
            }

            throw error
        }
    }

    /**
     * 카테고리별 강의 조회
     */
    static async getCoursesByCategory(category) {
        try {
            // 캐시 확인
            const cacheKey = `courses_category_${category}`
            const cached = localStorage.getItem(cacheKey)

            if (cached) {
                const { courses, timestamp } = JSON.parse(cached)
                if (Date.now() - timestamp < this.CACHE_DURATION) {
                    return courses
                }
            }

            const uploadsRef = collection(db, FIREBASE_COLLECTIONS.UPLOADS)
            const q = query(
                uploadsRef,
                where('sub_sub_category', '==', category),
                orderBy('upload_date', 'desc'),
                limit(50)
            )

            const snapshot = await getDocs(q)
            const courses = []

            snapshot.forEach(doc => {
                courses.push(this.convertUploadToCourse(doc))
            })

            // 캐시 저장
            localStorage.setItem(cacheKey, JSON.stringify({
                courses,
                timestamp: Date.now()
            }))

            return courses
        } catch (error) {
            console.error('카테고리별 강의 조회 오류:', error)
            return []
        }
    }

    /**
     * 강의 검색
     */
    static async searchCourses(searchTerm) {
        try {
            const uploadsRef = collection(db, FIREBASE_COLLECTIONS.UPLOADS)
            const courses = []

            // 제목으로 검색 (Firestore는 부분 문자열 검색을 지원하지 않음)
            const titleQuery = query(
                uploadsRef,
                where('group_name', '>=', searchTerm),
                where('group_name', '<=', searchTerm + '\uf8ff'),
                limit(20)
            )

            const titleSnapshot = await getDocs(titleQuery)
            titleSnapshot.forEach(doc => {
                courses.push(this.convertUploadToCourse(doc))
            })

            // 중복 제거
            const uniqueCourses = courses.filter((course, index, self) =>
                index === self.findIndex(c => c.id === course.id)
            )

            return uniqueCourses
        } catch (error) {
            console.error('강의 검색 오류:', error)
            return []
        }
    }

    /**
     * 사용자별 수강 정보 가져오기
     */
    static async getUserEnrollments(userId) {
        // 최적화된 메서드로 리다이렉트
        const enrollmentsWithCourses = await this.getUserEnrollmentsWithCourses(userId)
        return enrollmentsWithCourses
    }

    /**
     * 수강 신청
     */
    static async enrollCourse(courseId, userId, isQRAccess = false) {
        try {
            const enrollmentData = {
                courseId,
                userId,
                status: 'enrolled',
                progress: 0,
                enrolledAt: serverTimestamp(),
                lastAccessedAt: serverTimestamp(),
                isQRAccess,
                completedAt: null
            }

            const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
            const docRef = await addDoc(enrollmentsRef, enrollmentData)

            return {
                success: true,
                enrollmentId: docRef.id
            }
        } catch (error) {
            console.error('수강 신청 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * 진도 업데이트
     */
    static async updateProgress(courseId, userId, progress, currentTime = 0) {
        try {
            const progressRef = doc(
                db,
                FIREBASE_COLLECTIONS.PROGRESS,
                `${userId}_${courseId}`
            )

            await setDoc(progressRef, {
                courseId,
                userId,
                progress,
                currentTime,
                lastUpdatedAt: serverTimestamp()
            }, { merge: true })

            // 100% 완료 시 수강 정보 업데이트
            if (progress === 100) {
                const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
                const q = query(
                    enrollmentsRef,
                    where('userId', '==', userId),
                    where('courseId', '==', courseId),
                    limit(1)
                )

                const snapshot = await getDocs(q)
                if (!snapshot.empty) {
                    const enrollmentDoc = snapshot.docs[0]
                    await updateDoc(enrollmentDoc.ref, {
                        status: 'completed',
                        progress: 100,
                        completedAt: serverTimestamp()
                    })
                }
            }

            return { success: true }
        } catch (error) {
            console.error('진도 업데이트 오류:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * 비디오 URL 가져오기
     */
    static async getVideoUrl(videoId, language = 'ko') {
        try {
            // Railway 프록시 URL 반환
            const baseUrl = import.meta.env.VITE_API_URL || ''
            const videoUrl = `${baseUrl}/api/videos/${videoId}/stream?lang=${language}`

            return {
                videoUrl,
                metadata: {
                    language,
                    videoId
                }
            }
        } catch (error) {
            console.error('비디오 URL 조회 오류:', error)
            throw error
        }
    }

    /**
     * 사용 가능한 언어 조회
     */
    static async getAvailableLanguages(courseId) {
        try {
            const courseDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.UPLOADS, courseId))

            if (courseDoc.exists()) {
                const data = courseDoc.data()
                const languages = data.languages || data.availableLanguages || ['ko']

                return { languages }
            }

            return { languages: ['ko'] }
        } catch (error) {
            console.error('언어 목록 조회 오류:', error)
            return { languages: ['ko'] }
        }
    }

    /**
     * QR 코드 접근 로그
     */
    static async logQRAccess(courseId, userId = null) {
        try {
            const logData = {
                courseId,
                userId,
                accessedAt: serverTimestamp(),
                userAgent: navigator.userAgent,
                isGuest: !userId
            }

            await addDoc(collection(db, FIREBASE_COLLECTIONS.QR_ACCESS_LOGS), logData)
        } catch (error) {
            console.error('QR 접근 로그 오류:', error)
        }
    }

    /**
     * 캐시 초기화 (선택적)
     */
    static clearCache(type = 'all') {
        try {
            if (type === 'all' || type === 'memory') {
                this.memoryCache.clear()
                console.log('🗑️ 메모리 캐시 초기화')
            }

            if (type === 'all' || type === 'local') {
                const keys = Object.keys(localStorage)
                keys.forEach(key => {
                    if (key.startsWith('course') || key.startsWith('enrollment') || key === this.CACHE_KEY) {
                        localStorage.removeItem(key)
                    }
                })
                console.log('🗑️ 로컬스토리지 캐시 초기화')
            }
        } catch (error) {
            console.error('캐시 초기화 오류:', error)
        }
    }
}

export default CourseService