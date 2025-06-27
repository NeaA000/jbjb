// web/src/services/courseService.js - 언어별 비디오 URL 지원 추가
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

        // Railway 프록시 URL 생성 (비디오 URL이 없을 때 폴백)
        const baseUrl = import.meta.env.VITE_API_URL || ''
        const fallbackVideoUrl = hasVideo ? videoUrl : `${baseUrl}/watch/${uploadDoc.id}`

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
            videoUrl: fallbackVideoUrl,
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
     * 언어별 비디오 URL 가져오기
     */
    static getVideoUrlForLanguage(course, language = 'ko') {
        if (!course) return null

        // 언어별 비디오 정보 확인
        if (course.languageVideos && course.languageVideos[language]) {
            const langVideo = course.languageVideos[language]
            const videoUrl = langVideo.video_url || langVideo.videoUrl || ''

            if (videoUrl) {
                console.log(`🌍 ${language} 언어 비디오 URL 발견:`, videoUrl)
                return videoUrl
            }
        }

        // 한국어로 폴백
        if (language !== 'ko' && course.languageVideos && course.languageVideos.ko) {
            const koVideo = course.languageVideos.ko
            const koVideoUrl = koVideo.video_url || koVideo.videoUrl || ''

            if (koVideoUrl) {
                console.log(`🌍 한국어 비디오 URL로 폴백:`, koVideoUrl)
                return koVideoUrl
            }
        }

        // 기본 비디오 URL 사용
        if (course.videoUrl) {
            console.log(`📹 기본 비디오 URL 사용:`, course.videoUrl)
            return course.videoUrl
        }

        // 최종 폴백: Railway 프록시 URL
        const baseUrl = import.meta.env.VITE_API_URL || ''
        const fallbackUrl = `${baseUrl}/watch/${course.id}?lang=${language}`
        console.log(`🔄 Railway 프록시 URL로 폴백:`, fallbackUrl)
        return fallbackUrl
    }

    /**
     * uploads 컬렉션에서 전체 강의 목록 가져오기
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
                            const langData = langDoc.data()
                            languageVideos[langDoc.id] = {
                                ...langData,
                                // video_url 필드 정규화
                                video_url: langData.video_url || langData.videoUrl || langData.video_link || ''
                            }
                        })

                        course.languageVideos = languageVideos
                        course.availableLanguages = Object.keys(languageVideos).length > 0
                            ? Object.keys(languageVideos)
                            : ['ko'] // 기본값으로 한국어 설정
                        course.hasMultipleLanguages = course.availableLanguages.length > 1
                        course.hasLanguageVideos = Object.keys(languageVideos).length > 0

                        console.log(`🌍 ${doc.id} 언어별 비디오:`, course.availableLanguages)
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
                console.warn('Firestore 권한이 거부되었습니다.')
                return { courses: [], fromCache: false }
            }

            throw error
        }
    }

    /**
     * 로컬스토리지에서 캐시된 강의 목록 가져오기
     */
    static getCachedCourses() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY)
            if (!cached) return null

            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(this.CACHE_KEY)
                return null
            }

            console.log('📦 캐시에서 강의 목록 로드')
            return data
        } catch (error) {
            console.error('캐시 로드 오류:', error)
            return null
        }
    }

    /**
     * 로컬스토리지에 강의 목록 캐시 저장
     */
    static setCachedCourses(courses) {
        try {
            const cacheData = {
                data: courses,
                timestamp: Date.now()
            }
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
            console.log('💾 강의 목록 캐시 저장')
        } catch (error) {
            console.error('캐시 저장 오류:', error)
        }
    }

    /**
     * 강의 상세 정보 가져오기 (언어별 비디오 포함)
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
                        const langData = langDoc.data()
                        languageVideos[langDoc.id] = {
                            ...langData,
                            // video_url 필드 정규화
                            video_url: langData.video_url || langData.videoUrl || langData.video_link || ''
                        }
                    })

                    course.languageVideos = languageVideos
                    course.availableLanguages = Object.keys(languageVideos).length > 0
                        ? Object.keys(languageVideos)
                        : ['ko']
                    course.hasMultipleLanguages = course.availableLanguages.length > 1
                    course.hasLanguageVideos = Object.keys(languageVideos).length > 0

                    console.log(`🌍 언어별 비디오 로드 완료:`, course.availableLanguages)
                } catch (error) {
                    console.warn(`언어별 비디오 로드 실패:`, error)
                }

                // 캐시에 저장
                this.setMemoryCache(cacheKey, course)

                return course
            }

            console.warn(`⚠️ 강의를 찾을 수 없음: ${courseId}`)
            return null
        } catch (error) {
            console.error('강의 상세 조회 오류:', error)
            throw error
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

            // 2. 사용자의 enrollment 조회
            const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
            const q = query(
                enrollmentsRef,
                where('userId', '==', userId),
                orderBy('enrolledAt', 'desc')
            )

            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                console.log('📭 수강 정보가 없습니다')
                return []
            }

            // 3. courseId 수집
            const courseIds = []
            const enrollmentMap = new Map()

            snapshot.forEach(doc => {
                const data = doc.data()
                courseIds.push(data.courseId)
                enrollmentMap.set(data.courseId, {
                    id: doc.id,
                    ...data
                })
            })

            // 4. 관련 강의 정보 한 번에 조회
            const enrollmentsWithCourses = []

            for (const courseId of courseIds) {
                try {
                    // 강의 정보 가져오기 (언어별 비디오 포함)
                    const course = await this.getCourseById(courseId)

                    if (course) {
                        const enrollment = enrollmentMap.get(courseId)
                        enrollmentsWithCourses.push({
                            ...enrollment,
                            course: course,
                            courseId: courseId
                        })
                    }
                } catch (error) {
                    console.error(`강의 정보 로드 실패 (${courseId}):`, error)
                }
            }

            // 5. 캐시 저장
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
     * 비디오 URL 가져오기 (언어별 지원)
     */
    static async getVideoUrl(videoId, language = 'ko') {
        try {
            // Railway 프록시 URL 반환
            const baseUrl = import.meta.env.VITE_API_URL || ''
            const videoUrl = `${baseUrl}/watch/${videoId}?lang=${language}`

            console.log(`🎬 비디오 URL 생성: ${videoUrl}`)
            return videoUrl
        } catch (error) {
            console.error('비디오 URL 생성 오류:', error)
            throw error
        }
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
}

export default CourseService