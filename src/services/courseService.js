// web/src/services/courseService.js - 성능 최적화 및 CORS 대응 버전
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
    static PAGE_SIZE = 10 // 페이지당 10개로 줄임
    static INITIAL_PAGE_SIZE = 20 // 초기 로딩은 20개

    // 메모리 캐시 (LRU 캐시 구현)
    static memoryCache = new Map()
    static MAX_CACHE_SIZE = 100 // 최대 캐시 항목 수

    /**
     * LRU 캐시 관리
     */
    static getFromMemoryCache(key) {
        const cached = this.memoryCache.get(key)
        if (!cached) return null

        if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
            this.memoryCache.delete(key)
            return null
        }

        // LRU: 사용된 항목을 맨 뒤로 이동
        this.memoryCache.delete(key)
        this.memoryCache.set(key, cached)

        return cached.data
    }

    static setMemoryCache(key, data) {
        // 캐시 크기 제한
        if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
            // 가장 오래된 항목 삭제
            const firstKey = this.memoryCache.keys().next().value
            this.memoryCache.delete(firstKey)
        }

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
        const baseUrl = this._getBaseUrl()
        const fallbackVideoUrl = hasVideo ? this._convertToProxyUrl(videoUrl) : `${baseUrl}/watch/${uploadDoc.id}`

        // 언어 정보 처리 - 안전하게 처리
        const supportedLanguagesCount = data.supported_languages_count || 1
        const supportedVideoLanguages = data.supported_video_languages || ['ko']
        const availableLanguages = supportedVideoLanguages.length > 0 ? supportedVideoLanguages : ['ko']

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
            thumbnailUrl: this._convertToProxyUrl(data.thumbnail_url || data.thumbnailUrl || '/default-thumbnail.jpg'),
            qrUrl: this._convertToProxyUrl(data.qr_url || data.qrUrl || ''),

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

            // 언어 정보 - 안전하게 처리
            languageVideos: data.language_videos || {},
            hasMultipleLanguages: availableLanguages.length > 1,
            availableLanguages: availableLanguages,
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
     * 기본 URL 가져오기 (개발/프로덕션 환경 구분)
     */
    static _getBaseUrl() {
        // 개발 환경에서는 Vite 프록시 사용
        if (import.meta.env.DEV) {
            return ''  // 프록시를 통해 상대 경로 사용
        }
        // 프로덕션 환경
        return import.meta.env.VITE_RAILWAY_URL || import.meta.env.VITE_API_URL || ''
    }

    /**
     * Railway 프록시 URL로 변환 (CORS 대응)
     */
    static _convertToProxyUrl(url) {
        if (!url) return ''

        // 이미 절대 경로인 경우
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // 개발 환경에서는 프록시를 통해 접근
            if (import.meta.env.DEV) {
                // Railway URL을 로컬 프록시 경로로 변환
                const railwayUrl = import.meta.env.VITE_RAILWAY_URL || 'https://videouploader-production.up.railway.app'
                if (url.startsWith(railwayUrl)) {
                    return url.replace(railwayUrl, '')
                }
            }
            return url
        }

        // 상대 경로인 경우
        const baseUrl = this._getBaseUrl()
        return `${baseUrl}${url}`
    }

    /**
     * Railway 프록시 URL을 절대 경로로 변환
     */
    static _convertToAbsoluteUrl(url) {
        if (!url) return ''

        // 이미 절대 경로인 경우 그대로 반환
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }

        // 개발 환경에서는 상대 경로 유지
        if (import.meta.env.DEV) {
            return url
        }

        // 프로덕션 환경에서는 Railway URL 추가
        const apiUrl = import.meta.env.VITE_RAILWAY_URL || import.meta.env.VITE_API_URL || ''
        return `${apiUrl}${url}`
    }

    /**
     * uploads 컬렉션에서 강의 목록 조회 (최적화된 페이지네이션)
     */
    static async getCoursesFromUploads(lastDoc = null, pageSize = this.INITIAL_PAGE_SIZE) {
        try {
            const uploadsRef = collection(db, FIREBASE_COLLECTIONS.UPLOADS)

            // 최적화된 쿼리
            let q = query(
                uploadsRef,
                orderBy('upload_date', 'desc'),
                limit(pageSize)
            )

            if (lastDoc) {
                q = query(
                    uploadsRef,
                    orderBy('upload_date', 'desc'),
                    startAfter(lastDoc),
                    limit(pageSize)
                )
            }

            const snapshot = await getDocs(q)
            const courses = []
            let lastDocument = null

            snapshot.forEach((doc) => {
                courses.push(this.convertUploadToCourse(doc))
                lastDocument = doc
            })

            return {
                courses,
                lastDoc: lastDocument,
                hasMore: snapshot.size === pageSize
            }
        } catch (error) {
            console.error('uploads 컬렉션 조회 오류:', error)
            throw error
        }
    }

    /**
     * 로컬 스토리지 캐시 관리 (압축 적용)
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

            return data
        } catch (error) {
            console.error('캐시 읽기 오류:', error)
            localStorage.removeItem(this.CACHE_KEY)
            return null
        }
    }

    static setCachedCourses(courses) {
        try {
            // 큰 데이터는 저장하지 않음
            if (courses.length > 100) {
                return
            }

            const cacheData = {
                data: courses,
                timestamp: Date.now()
            }

            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
        } catch (error) {
            console.error('캐시 저장 오류:', error)
            // 용량 초과 시 캐시 삭제
            if (error.name === 'QuotaExceededError') {
                localStorage.removeItem(this.CACHE_KEY)
            }
        }
    }

    /**
     * Firestore에서 전체 강의 목록 조회 (최적화)
     */
    static async getCoursesFromFirestore() {
        try {
            // 1. 먼저 캐시 확인
            const cachedCourses = this.getCachedCourses()
            if (cachedCourses) {
                // 백그라운드에서 최신 데이터 로드
                this.refreshCoursesInBackground()
                return { courses: cachedCourses, fromCache: true }
            }

            // 2. 초기 데이터만 로드
            const result = await this.getCoursesFromUploads(null, this.INITIAL_PAGE_SIZE)

            // 3. 캐시에 저장
            this.setCachedCourses(result.courses)

            return {
                courses: result.courses,
                fromCache: false,
                hasMore: result.hasMore
            }
        } catch (error) {
            console.error('Firestore 강의 목록 조회 오류:', error)
            return { courses: [], fromCache: false }
        }
    }

    /**
     * 백그라운드에서 최신 데이터 새로고침
     */
    static async refreshCoursesInBackground() {
        try {
            const result = await this.getCoursesFromUploads()
            this.setCachedCourses(result.courses)
        } catch (error) {
            console.error('백그라운드 새로고침 실패:', error)
        }
    }

    /**
     * 페이지네이션으로 추가 강의 로드
     */
    static async getCoursesWithPagination(lastDoc = null) {
        const cacheKey = `courses_page_${lastDoc?.id || 'first'}`
        const cached = this.getFromMemoryCache(cacheKey)

        if (cached) {
            return cached
        }

        const result = await this.getCoursesFromUploads(lastDoc, this.PAGE_SIZE)
        this.setMemoryCache(cacheKey, result)

        return result
    }

    /**
     * 강의 ID로 상세 정보 가져오기 (지연 로딩)
     */
    static async getCourseById(courseId) {
        try {
            // courseId 유효성 검사
            if (!courseId || typeof courseId !== 'string') {
                console.error('유효하지 않은 courseId:', courseId)
                return null
            }

            // 1. 메모리 캐시 확인
            const cacheKey = `course_${courseId}`
            const cached = this.getFromMemoryCache(cacheKey)
            if (cached) {
                return cached
            }

            // 2. 기본 정보만 먼저 로드
            const courseRef = doc(db, FIREBASE_COLLECTIONS.UPLOADS, courseId)
            const courseSnap = await getDoc(courseRef)

            if (!courseSnap.exists()) {
                console.warn(`강의를 찾을 수 없음: ${courseId}`)
                return null
            }

            const course = this.convertUploadToCourse(courseSnap)

            // 3. 캐시에 저장하고 반환
            this.setMemoryCache(cacheKey, course)

            // 4. 언어별 비디오는 별도로 비동기 로드
            this.loadLanguageVideosAsync(courseId, course)

            return course
        } catch (error) {
            console.error('강의 상세 조회 오류:', error)
            throw error
        }
    }

    /**
     * 언어별 비디오 비동기 로드
     */
    static async loadLanguageVideosAsync(courseId, course) {
        try {
            const languageVideosRef = collection(
                db,
                FIREBASE_COLLECTIONS.UPLOADS,
                courseId,
                FLASK_SUBCOLLECTIONS.LANGUAGE_VIDEOS
            )

            const snapshot = await getDocs(languageVideosRef)
            const languageVideos = {}

            snapshot.forEach((doc) => {
                const data = doc.data()
                const language = data.language_code || doc.id
                const videoUrl = data.video_url || data.railway_proxy_url || ''

                languageVideos[language] = {
                    language,
                    languageName: data.language_name || language,
                    videoUrl: this._convertToProxyUrl(videoUrl),
                    hasVideo: !!videoUrl,
                    fileSize: data.file_size || 0,
                    duration: data.duration_string || '',
                    uploadedAt: data.created_at || new Date(),
                    isOriginal: data.is_original || (language === 'ko')
                }
            })

            // 캐시 업데이트
            course.languageVideos = languageVideos
            course.availableLanguages = Object.keys(languageVideos).length > 0 ?
                Object.keys(languageVideos) : ['ko']
            course.hasMultipleLanguages = course.availableLanguages.length > 1
            course.hasLanguageVideos = true

            // 메모리 캐시 업데이트
            const cacheKey = `course_${courseId}`
            this.setMemoryCache(cacheKey, course)
        } catch (error) {
            console.warn('언어별 비디오 로드 실패:', error)
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
                return cached
            }

            // 2. 사용자의 enrollment 조회
            const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
            const q = query(
                enrollmentsRef,
                where('userId', '==', userId),
                orderBy('enrolledAt', 'desc'),
                limit(50) // 최대 50개로 제한
            )

            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                return []
            }

            // 3. 병렬 처리로 강의 정보 로드
            const enrollmentPromises = []

            snapshot.forEach(doc => {
                const data = doc.data()
                const promise = this.getCourseById(data.courseId).then(course => ({
                    id: doc.id,
                    ...data,
                    course
                }))
                enrollmentPromises.push(promise)
            })

            const enrollmentsWithCourses = await Promise.all(enrollmentPromises)

            // 4. 캐시 저장
            this.setMemoryCache(cacheKey, enrollmentsWithCourses)

            return enrollmentsWithCourses
        } catch (error) {
            console.error('최적화된 enrollment 로드 실패:', error)
            throw error
        }
    }

    /**
     * 비디오 URL 가져오기 (수정됨 - courseId에서 videoUrl 추출)
     */
    static async getVideoUrl(videoUrl, language = 'ko') {
        try {
            // videoUrl이 이미 완전한 URL인 경우
            if (videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://') || videoUrl.startsWith('/'))) {
                return {
                    videoUrl: this._convertToProxyUrl(videoUrl),
                    metadata: {
                        language,
                        source: 'direct'
                    }
                }
            }

            // videoUrl이 courseId인 경우
            const courseId = videoUrl
            const languageVideoUrl = await this.getVideoUrlForLanguage(courseId, language)

            return {
                videoUrl: languageVideoUrl,
                metadata: {
                    language,
                    source: 'firebase'
                }
            }
        } catch (error) {
            console.error('비디오 URL 생성 오류:', error)
            throw error
        }
    }

    /**
     * 언어별 비디오 URL 가져오기 (수정된 버전)
     */
    static async getVideoUrlForLanguage(courseId, language = 'ko') {
        try {
            console.log(`🔍 언어별 비디오 URL 조회: ${courseId} (${language})`)

            // courseId 유효성 검사
            if (!courseId || typeof courseId !== 'string') {
                console.error('유효하지 않은 courseId:', courseId)
                const baseUrl = this._getBaseUrl()
                return `${baseUrl}/watch/${courseId}?lang=${language}`
            }

            // 1. Firebase에서 언어별 비디오 정보 직접 조회
            const languageVideoRef = doc(
                db,
                FIREBASE_COLLECTIONS.UPLOADS,
                courseId,
                FLASK_SUBCOLLECTIONS.LANGUAGE_VIDEOS,
                language
            )

            const languageVideoSnap = await getDoc(languageVideoRef)

            if (languageVideoSnap.exists()) {
                const data = languageVideoSnap.data()
                const videoUrl = data.video_url || data.railway_proxy_url || ''

                if (videoUrl) {
                    console.log(`✅ ${language} 비디오 URL 찾음: ${videoUrl}`)
                    return this._convertToProxyUrl(videoUrl)
                }
            }

            // 2. 요청한 언어의 비디오가 없으면 한국어로 폴백
            if (language !== 'ko') {
                console.log(`⚠️ ${language} 비디오가 없어 한국어로 폴백`)

                const koVideoRef = doc(
                    db,
                    FIREBASE_COLLECTIONS.UPLOADS,
                    courseId,
                    FLASK_SUBCOLLECTIONS.LANGUAGE_VIDEOS,
                    'ko'
                )

                const koVideoSnap = await getDoc(koVideoRef)

                if (koVideoSnap.exists()) {
                    const koData = koVideoSnap.data()
                    const koVideoUrl = koData.video_url || koData.railway_proxy_url || ''

                    if (koVideoUrl) {
                        console.log(`✅ 한국어 비디오 URL로 폴백: ${koVideoUrl}`)
                        return this._convertToProxyUrl(koVideoUrl)
                    }
                }
            }

            // 3. 모든 방법이 실패하면 기본 watch URL 반환
            console.log(`⚠️ 비디오 URL을 찾을 수 없어 기본 URL 사용`)
            const baseUrl = this._getBaseUrl()
            return `${baseUrl}/watch/${courseId}?lang=${language}`

        } catch (error) {
            console.error('언어별 비디오 URL 조회 오류:', error)
            // 오류 시 기본 URL 반환
            const baseUrl = this._getBaseUrl()
            return `${baseUrl}/watch/${courseId}?lang=${language}`
        }
    }

    /**
     * 사용 가능한 언어 목록 가져오기 (수정됨 - courseId 직접 사용)
     */
    static async getAvailableLanguages(courseId) {
        try {
            console.log(`🌐 사용 가능한 언어 목록 조회: ${courseId}`)

            // courseId 유효성 검사
            if (!courseId || typeof courseId !== 'string') {
                console.error('유효하지 않은 courseId:', courseId)
                return { languages: ['ko'] }
            }

            // 메모리 캐시 확인
            const cacheKey = `languages_${courseId}`
            const cached = this.getFromMemoryCache(cacheKey)
            if (cached) {
                return cached
            }

            // language_videos 서브컬렉션의 모든 문서 조회
            const languageVideosRef = collection(
                db,
                FIREBASE_COLLECTIONS.UPLOADS,
                courseId,
                FLASK_SUBCOLLECTIONS.LANGUAGE_VIDEOS
            )

            const snapshot = await getDocs(languageVideosRef)
            const languages = []

            snapshot.forEach((doc) => {
                const data = doc.data()
                // video_url이 있는 언어만 추가
                if (data.video_url || data.railway_proxy_url) {
                    languages.push(doc.id)
                }
            })

            // 언어가 없으면 기본값으로 한국어만 반환
            if (languages.length === 0) {
                console.log('⚠️ 언어별 비디오가 없어 기본값(한국어) 반환')
                return { languages: ['ko'] }
            }

            console.log(`✅ 사용 가능한 언어: ${languages.join(', ')}`)

            const result = { languages }
            this.setMemoryCache(cacheKey, result)

            return result

        } catch (error) {
            console.error('언어 목록 조회 오류:', error)
            return { languages: ['ko'] } // 오류 시 기본값
        }
    }

    /**
     * 수강 신청 (배치 처리)
     */
    static async enrollCourse(userId, courseId) {
        try {
            const enrollmentData = {
                userId,
                courseId,
                enrolledAt: serverTimestamp(),
                progress: 0,
                status: 'enrolled',
                lastAccessedAt: serverTimestamp()
            }

            const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
            const docRef = await addDoc(enrollmentsRef, enrollmentData)

            // 캐시 무효화
            const cacheKey = `enrollments_${userId}`
            this.memoryCache.delete(cacheKey)

            return {
                id: docRef.id,
                ...enrollmentData,
                enrolledAt: new Date()
            }
        } catch (error) {
            console.error('수강 신청 오류:', error)
            throw error
        }
    }

    /**
     * 여러 강의 일괄 수강 신청
     */
    static async enrollMultipleCourses(userId, courseIds) {
        const results = {
            success: [],
            failed: []
        }

        // 배치 처리로 성능 최적화
        const batchSize = 5
        for (let i = 0; i < courseIds.length; i += batchSize) {
            const batch = courseIds.slice(i, i + batchSize)
            const promises = batch.map(courseId =>
                this.enrollCourse(userId, courseId)
                    .then(result => ({ courseId, result, success: true }))
                    .catch(error => ({ courseId, error, success: false }))
            )

            const batchResults = await Promise.all(promises)

            batchResults.forEach(result => {
                if (result.success) {
                    results.success.push(result)
                } else {
                    results.failed.push(result)
                }
            })
        }

        return results
    }

    /**
     * 캐시 초기화
     */
    static clearCache() {
        this.memoryCache.clear()
        localStorage.removeItem(this.CACHE_KEY)

        // 추가 캐시 키들도 삭제
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
            if (key.startsWith('courses_') || key.startsWith('enrollments_')) {
                localStorage.removeItem(key)
            }
        })
    }

    /**
     * 사용자 진도 정보 가져오기
     */
    static async getProgress(userId, courseId) {
        try {
            if (!userId || !courseId) return 0

            const progressRef = doc(db, 'progress', `${userId}_${courseId}`)
            const progressSnap = await getDoc(progressRef)

            if (progressSnap.exists()) {
                const data = progressSnap.data()
                return data.progress || data.percentage || 0
            }

            return 0
        } catch (error) {
            console.error('진도 조회 오류:', error)
            return 0
        }
    }

    /**
     * 진도 업데이트
     */
    static async updateProgress(userId, courseId, progress) {
        try {
            const progressRef = doc(db, 'progress', `${userId}_${courseId}`)

            const progressData = {
                userId,
                courseId,
                progress: Math.round(progress),
                lastUpdated: serverTimestamp(),
                completed: progress >= 100
            }

            await setDoc(progressRef, progressData, { merge: true })

            return progressData
        } catch (error) {
            console.error('진도 업데이트 오류:', error)
            throw error
        }
    }

    /**
     * QR 토큰 검증
     */
    static async validateQRToken(courseId, token) {
        try {
            // 실제로는 서버에서 검증해야 함
            // 여기서는 간단한 검증만 수행
            return token && token.length > 0
        } catch (error) {
            console.error('QR 토큰 검증 오류:', error)
            return false
        }
    }

    /**
     * 캐시 상태 확인
     */
    static getCacheStatus() {
        return {
            memoryCacheSize: this.memoryCache.size,
            localStorageKeys: Object.keys(localStorage).filter(key =>
                key.startsWith('courses_') || key.startsWith('enrollments_')
            ).length
        }
    }

    /**
     * 비디오 스트리밍 최적화 설정
     */
    static getOptimizedVideoConfig() {
        return {
            preload: 'metadata',
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
            controls: true,
            fluid: true,
            responsive: true,
            html5: {
                hls: {
                    enableLowInitialPlaylist: true,
                    smoothQualityChange: true,
                    overrideNative: true
                }
            }
        }
    }
}

export default CourseService