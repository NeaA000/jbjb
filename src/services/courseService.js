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
     * Firestore에서 전체 강의 목록 가져오기 (캐싱 적용)
     */
    static async getCoursesFromFirestore() {
        try {
            // 1. 먼저 캐시 확인
            const cachedCourses = this.getCachedCourses()
            if (cachedCourses) {
                return { courses: cachedCourses, fromCache: true }
            }

            // 2. Firestore에서 로드
            console.log('🔄 Firestore에서 강의 로드 시작...')
            const coursesRef = collection(db, 'courses')
            const q = query(coursesRef, orderBy('createdAt', 'desc'))
            const snapshot = await getDocs(q)

            const courses = []
            snapshot.forEach(doc => {
                courses.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date()
                })
            })

            // 3. 캐시에 저장
            this.setCachedCourses(courses)

            console.log(`✅ Firestore에서 ${courses.length}개 강의 로드 완료`)
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
            const coursesRef = collection(db, 'courses')

            let q
            if (lastDoc) {
                q = query(
                    coursesRef,
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(pageSize)
                )
            } else {
                q = query(
                    coursesRef,
                    orderBy('createdAt', 'desc'),
                    limit(pageSize)
                )
            }

            const snapshot = await getDocs(q)

            const courses = []
            let lastDocument = null

            snapshot.forEach(doc => {
                courses.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date()
                })
                lastDocument = doc
            })

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
            const coursesRef = collection(db, 'courses')
            const q = query(
                coursesRef,
                where('category.leaf', '==', category),
                orderBy('createdAt', 'desc'),
                limit(50) // 카테고리별 최대 50개
            )

            const snapshot = await getDocs(q)
            const courses = []

            snapshot.forEach(doc => {
                courses.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date()
                })
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
            const courseDoc = await getDoc(doc(db, 'courses', courseId))

            if (courseDoc.exists()) {
                const course = {
                    id: courseDoc.id,
                    ...courseDoc.data(),
                    createdAt: courseDoc.data().createdAt?.toDate() || new Date(),
                    updatedAt: courseDoc.data().updatedAt?.toDate() || new Date()
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
                collection(db, 'enrollments'),
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
            const existingEnrollment = await getDoc(doc(db, 'enrollments', enrollmentId))
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

            await setDoc(doc(db, 'enrollments', enrollmentId), enrollmentData)

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

            await updateDoc(doc(db, 'enrollments', enrollmentId), updateData)

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
     * 비디오 URL 가져오기 (Firebase Storage URL)
     */
    static async getVideoUrl(videoId, language = 'ko') {
        try {
            const courseDoc = await getDoc(doc(db, 'courses', videoId))

            if (courseDoc.exists()) {
                const courseData = courseDoc.data()
                const videoUrl = courseData.videoUrls?.[language] || courseData.videoUrl || ''

                return {
                    videoUrl,
                    metadata: {
                        language,
                        duration: courseData.duration || '30:00'
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
    static async getAvailableLanguages(videoId) {
        try {
            const courseDoc = await getDoc(doc(db, 'courses', videoId))

            if (courseDoc.exists()) {
                const courseData = courseDoc.data()
                const languages = courseData.availableLanguages || ['ko']

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
            vi: 'Tiếng Việt'
        }
        return languageNames[langCode] || langCode
    }

    /**
     * 새 강의 추가 (관리자용)
     */
    static async createCourse(courseData) {
        try {
            const docRef = await addDoc(collection(db, 'courses'), {
                ...courseData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                enrolledCount: 0,
                rating: 0,
                reviewCount: 0
            })

            // 캐시 초기화
            this.clearCache()

            return {
                success: true,
                courseId: docRef.id
            }
        } catch (error) {
            console.error('강의 생성 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * 강의 정보 업데이트 (관리자용)
     */
    static async updateCourse(courseId, updateData) {
        try {
            await updateDoc(doc(db, 'courses', courseId), {
                ...updateData,
                updatedAt: serverTimestamp()
            })

            // 캐시 초기화
            this.clearCache()

            return {
                success: true
            }
        } catch (error) {
            console.error('강의 업데이트 오류:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }
}

export default CourseService