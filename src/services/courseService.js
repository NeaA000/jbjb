// web/src/services/courseService.js
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
    addDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { FIREBASE_COLLECTIONS, FLASK_SUBCOLLECTIONS } from '@/utils/constants'

class CourseService {
    // 캐시 설정
    static CACHE_KEY = 'courses_cache'
    static CACHE_DURATION = 5 * 60 * 1000 // 5분
    static PAGE_SIZE = 20

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
     * uploads 데이터를 courses 형식으로 변환
     */
    static convertUploadToCourse(uploadDoc) {
        const data = uploadDoc.data()

        return {
            id: uploadDoc.id,
            // 기본 정보
            title: data.group_name || '제목 없음',
            description: data.content_description || '',

            // 카테고리 정보
            category: {
                main: data.main_category || '',
                middle: data.sub_category || '',
                leaf: data.sub_sub_category || ''
            },

            // 미디어 정보
            videoUrl: data.video_url || '',
            thumbnailUrl: data.thumbnail_url || '',
            qrUrl: data.qr_url || '',

            // 학습 정보
            duration: data.duration_string || '30분',
            difficulty: 'intermediate', // 기본값

            // 메타데이터
            uploadedAt: data.upload_date || new Date(),
            createdAt: data.createdAt || data.upload_date || new Date(),
            updatedAt: data.updatedAt || new Date(),

            // 통계 정보 (초기값)
            enrolledCount: 0,
            completedCount: 0,
            rating: 0,
            reviewCount: 0,

            // 기타 정보
            languageVideos: data.language_videos || {},
            hasMultipleLanguages: Object.keys(data.language_videos || {}).length > 1,
            availableLanguages: Object.keys(data.language_videos || {}),

            // Railway 프록시 정보
            railwayProxyEnabled: data.railway_proxy_enabled || true,
            originalS3Key: data.s3_key || '',

            // 태그 (카테고리 기반 자동 생성)
            tags: [data.main_category, data.sub_category, data.sub_sub_category].filter(Boolean)
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

            const courses = []

            for (const doc of snapshot.docs) {
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
                    course.availableLanguages = Object.keys(languageVideos)
                    course.hasMultipleLanguages = course.availableLanguages.length > 1
                } catch (error) {
                    console.warn(`언어별 비디오 로드 실패 (${doc.id}):`, error)
                }

                courses.push(course)
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
                console.warn('Firestore 권한이 거부되었습니다.')
                return { courses: [], fromCache: false }
            }

            throw error
        }
    }

    /**
     * 페이지네이션으로 강의 목록 가져오기
     */
    static async getCoursesWithPagination(lastDoc = null, pageSize = this.PAGE_SIZE) {
        try {
            console.log('📄 페이지 로드 시작...')
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

            for (const doc of snapshot.docs) {
                courses.push(this.convertUploadToCourse(doc))
                lastDocument = doc
            }

            console.log(`✅ ${courses.length}개 강의 로드`)

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
     * 카테고리별 강의 조회 (캐싱 적용)
     */
    static async getCoursesByCategory(category) {
        try {
            // 캐시 키 생성
            const cacheKey = `courses_category_${category}`
            const cached = localStorage.getItem(cacheKey)

            if (cached) {
                const { courses, timestamp } = JSON.parse(cached)
                if (Date.now() - timestamp < this.CACHE_DURATION) {
                    console.log(`📦 캐시에서 ${category} 카테고리 로드`)
                    return courses
                }
            }

            // Firestore 조회
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
     * 강의 상세 정보 가져오기 (캐싱 적용)
     */
    static async getCourseById(courseId) {
        try {
            // 캐시 확인
            const cacheKey = `course_${courseId}`
            const cached = localStorage.getItem(cacheKey)

            if (cached) {
                const { course, timestamp } = JSON.parse(cached)
                if (Date.now() - timestamp < this.CACHE_DURATION) {
                    console.log(`📦 캐시에서 강의 상세 로드: ${courseId}`)
                    return course
                }
            }

            // Firestore 조회
            const courseDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.UPLOADS, courseId))

            if (courseDoc.exists()) {
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
                    course.availableLanguages = Object.keys(languageVideos)
                } catch (error) {
                    console.warn('언어별 비디오 로드 실패:', error)
                }

                // 캐시 저장
                localStorage.setItem(cacheKey, JSON.stringify({
                    course,
                    timestamp: Date.now()
                }))

                return course
            }

            return null
        } catch (error) {
            console.error('강의 조회 오류:', error)
            return null
        }
    }

    /**
     * 캐시 초기화
     */
    static clearCache() {
        try {
            // 강의 관련 캐시 제거
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
                if (key.startsWith('course') || key === this.CACHE_KEY) {
                    localStorage.removeItem(key)
                }
            })
            console.log('🗑️ 캐시 초기화 완료')
        } catch (error) {
            console.error('캐시 초기화 오류:', error)
        }
    }

    /**
     * 사용자의 수강 정보 가져오기
     */
    static async getUserEnrollments(userId) {
        try {
            const enrollmentsQuery = query(
                collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS),
                where('userId', '==', userId),
                orderBy('enrolledAt', 'desc')
            )

            const snapshot = await getDocs(enrollmentsQuery)
            const enrollments = []

            snapshot.forEach(doc => {
                enrollments.push({
                    id: doc.id,
                    ...doc.data(),
                    enrolledAt: doc.data().enrolledAt?.toDate() || new Date(),
                    completedAt: doc.data().completedAt?.toDate() || null
                })
            })

            return enrollments
        } catch (error) {
            console.error('수강 정보 조회 오류:', error)

            if (error.code === 'permission-denied') {
                console.warn('수강 정보 조회 권한이 없습니다.')
                return []
            }

            return []
        }
    }

    /**
     * 강의 신청
     */
    static async enrollCourse(courseId, userId, isQRAccess = false) {
        try {
            const enrollmentId = `${userId}_${courseId}`

            // 이미 신청했는지 확인
            const existingEnrollment = await getDoc(doc(db, FIREBASE_COLLECTIONS.ENROLLMENTS, enrollmentId))
            if (existingEnrollment.exists()) {
                return {
                    success: false,
                    message: '이미 신청한 강의입니다.'
                }
            }

            // 새 수강 신청
            const enrollmentData = {
                courseId,
                userId,
                status: 'enrolled',
                progress: 0,
                enrolledAt: serverTimestamp(),
                lastViewedAt: serverTimestamp(),
                isQRAccess,
                ...(isQRAccess && { qrAccessedAt: serverTimestamp() })
            }

            await setDoc(doc(db, FIREBASE_COLLECTIONS.ENROLLMENTS, enrollmentId), enrollmentData)

            // 관련 캐시 초기화
            this.clearCache()

            return {
                success: true,
                message: '강의 신청이 완료되었습니다.',
                enrollmentId
            }
        } catch (error) {
            console.error('강의 신청 오류:', error)

            if (error.code === 'permission-denied') {
                return {
                    success: false,
                    message: '강의 신청 권한이 없습니다. 로그인을 확인해주세요.'
                }
            }

            return {
                success: false,
                message: '강의 신청에 실패했습니다.'
            }
        }
    }

    /**
     * 진도 업데이트
     */
    static async updateProgress(courseId, userId, progress, currentTime = 0, duration = 0) {
        try {
            const enrollmentId = `${userId}_${courseId}`

            const updateData = {
                progress: Math.min(100, Math.max(0, progress)),
                lastViewedAt: serverTimestamp(),
                currentVideoTime: currentTime
            }

            // 100% 완료 시
            if (progress >= 100) {
                updateData.status = 'completed'
                updateData.completedAt = serverTimestamp()
                updateData.progress = 100
            }

            await updateDoc(doc(db, FIREBASE_COLLECTIONS.ENROLLMENTS, enrollmentId), updateData)

            return {
                success: true,
                progress: updateData.progress,
                isCompleted: updateData.progress === 100
            }
        } catch (error) {
            console.error('진도 업데이트 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * 비디오 URL 가져오기 (언어별)
     */
    static async getVideoUrl(courseId, language = 'ko') {
        try {
            const course = await this.getCourseById(courseId)

            if (course && course.languageVideos) {
                const langVideo = course.languageVideos[language] || course.languageVideos['ko']
                const videoUrl = langVideo?.video_url || course.videoUrl || ''

                return {
                    videoUrl,
                    metadata: {
                        language,
                        duration: langVideo?.duration_string || course.duration || '30:00',
                        fileSize: langVideo?.file_size || 0
                    }
                }
            }

            return { videoUrl: null, metadata: null }
        } catch (error) {
            console.error('비디오 URL 조회 오류:', error)
            return { videoUrl: null, metadata: null }
        }
    }

    /**
     * 사용 가능한 언어 목록
     */
    static async getAvailableLanguages(courseId) {
        try {
            const course = await this.getCourseById(courseId)

            if (course && course.availableLanguages) {
                const languages = course.availableLanguages

                const details = {}
                languages.forEach(lang => {
                    details[lang] = {
                        language: this.getLanguageName(lang),
                        isDefault: lang === 'ko'
                    }
                })

                return { languages, details }
            }

            return { languages: ['ko'], details: { ko: { language: '한국어', isDefault: true } } }
        } catch (error) {
            console.error('언어 목록 조회 오류:', error)
            return { languages: ['ko'], details: {} }
        }
    }

    /**
     * 언어 코드를 언어명으로 변환
     */
    static getLanguageName(langCode) {
        const languageNames = {
            ko: '한국어',
            en: 'English',
            zh: '中文',
            vi: 'Tiếng Việt',
            th: 'ภาษาไทย',
            ja: '日本語'
        }
        return languageNames[langCode] || langCode
    }

    /**
     * QR 코드 접근 로그 기록
     */
    static async logQRAccess(courseId, userId = null) {
        try {
            const logData = {
                courseId,
                userId: userId || 'anonymous',
                accessedAt: serverTimestamp(),
                userAgent: navigator.userAgent,
                platform: navigator.platform
            }

            await addDoc(collection(db, FIREBASE_COLLECTIONS.QR_ACCESS_LOGS), logData)

            return { success: true }
        } catch (error) {
            console.error('QR 접근 로그 기록 오류:', error)
            return { success: false }
        }
    }
}

export default CourseService