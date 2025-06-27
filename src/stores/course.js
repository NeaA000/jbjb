// web/src/stores/course.js - 모든 수정사항 통합
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CourseService from '@/services/courseService'
import { useAuthStore } from './auth'
import { STORAGE_KEYS } from '@/utils/constants'

export const useCourseStore = defineStore('course', () => {
    // 상태
    const courses = ref([])
    const enrollments = ref([])
    const selectedCourses = ref([])  // 기존 호환성 유지
    const selectedCourseIds = ref([])  // 새로운 최적화 버전
    const isLoading = ref(false)
    const isLoadingFromCache = ref(false)
    const error = ref(null)
    const lastLoadTime = ref(null)
    const lastEnrollmentLoadTime = ref(null)

    // 캐시 시간 (5분)
    const CACHE_DURATION = 5 * 60 * 1000

    // Getters
    const enrolledCourses = computed(() => {
        return enrollments.value
            .filter(e => e.status === 'enrolled' || e.status === 'in-progress' || e.status === 'completed')
            .map(e => {
                const course = courses.value.find(c => c.id === e.courseId)
                return {
                    ...e,
                    course
                }
            })
            .filter(e => e.course)
    })

    const completedCourses = computed(() => {
        return enrollments.value
            .filter(e => e.status === 'completed')
            .map(e => {
                const course = courses.value.find(c => c.id === e.courseId)
                return {
                    ...e,
                    course
                }
            })
            .filter(e => e.course)
    })

    // 선택된 강의 목록 (기존 호환성)
    const selectedCoursesList = computed(() => {
        return selectedCourses.value
            .map(courseId => courses.value.find(c => c.id === courseId))
            .filter(Boolean)
    })

    // 선택된 강의 수 (새로운 최적화)
    const selectedCount = computed(() => selectedCourseIds.value.length)

    // 캐시 유효성 검사
    const isCacheValid = (cacheTime, duration = CACHE_DURATION) => {
        if (!cacheTime) return false
        return (Date.now() - cacheTime) < duration
    }

    // Firebase에서 강의 목록 로드 (수정됨 - 더 자세한 로깅)
    const loadCoursesFromFirebase = async (forceReload = false) => {
        try {
            // 캐시 확인
            if (!forceReload && isCacheValid(lastLoadTime.value) && courses.value.length > 0) {
                console.log('📦 메모리 캐시에서 강의 목록 사용')
                return courses.value
            }

            isLoading.value = true
            error.value = null

            console.log('🔄 Firebase에서 강의 목록 로드 시작...')
            const result = await CourseService.getCoursesFromFirestore()

            if (result.fromCache) {
                isLoadingFromCache.value = true
                console.log('📦 로컬스토리지 캐시에서 로드')
            }

            courses.value = result.courses || []
            lastLoadTime.value = Date.now()

            console.log(`✅ ${result.fromCache ? '캐시' : 'Firestore'}에서 ${courses.value.length}개 강의 로드`)

            // 디버깅: 첫 번째 강의 정보 출력
            if (courses.value.length > 0) {
                console.log('📋 첫 번째 강의 정보:', {
                    id: courses.value[0].id,
                    title: courses.value[0].title,
                    hasVideo: courses.value[0].hasVideo,
                    videoUrl: courses.value[0].videoUrl,
                    languages: courses.value[0].availableLanguages
                })
            }

            return courses.value
        } catch (err) {
            console.error('❌ Firebase 강의 목록 로드 실패:', err)
            error.value = err.message

            // Firebase 오류 시 Flask API 자동 대체
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
                console.log('🔄 권한 오류로 Flask API 대체 시도...')
                return await loadCoursesFromFlask()
            }

            throw err
        } finally {
            isLoading.value = false
            isLoadingFromCache.value = false
        }
    }

    // Flask API에서 강의 목록 로드 (수정됨)
    const loadCoursesFromFlask = async () => {
        try {
            isLoading.value = true
            error.value = null

            console.log('🔄 Flask API에서 강의 목록 로드 중...')
            const flaskCourses = await CourseService.getCoursesFromFlask()

            if (flaskCourses && flaskCourses.length > 0) {
                courses.value = flaskCourses
                lastLoadTime.value = Date.now()
                console.log(`✅ Flask API에서 ${courses.value.length}개 강의 로드`)

                // 첫 번째 강의 정보 출력
                if (courses.value.length > 0) {
                    console.log('📋 Flask 첫 번째 강의:', {
                        id: courses.value[0].id,
                        title: courses.value[0].title,
                        hasVideo: courses.value[0].hasVideo
                    })
                }
            } else {
                console.warn('⚠️ Flask API에서 강의를 찾을 수 없음')
                courses.value = []
            }

            return courses.value
        } catch (err) {
            console.error('❌ Flask API 강의 로드 실패:', err)
            error.value = err.message
            courses.value = []
            return []
        } finally {
            isLoading.value = false
        }
    }

    // 페이지네이션으로 강의 로드
    const loadCoursesWithPagination = async (lastDoc = null) => {
        try {
            isLoading.value = true
            error.value = null

            const result = await CourseService.getCoursesWithPagination(lastDoc)

            if (lastDoc) {
                // 추가 로드
                courses.value = [...courses.value, ...result.courses]
            } else {
                // 초기 로드
                courses.value = result.courses
            }

            return result
        } catch (err) {
            console.error('❌ 페이지네이션 로드 실패:', err)
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // 캐시 초기화
    const clearCache = () => {
        CourseService.clearCache()
        lastLoadTime.value = null
        lastEnrollmentLoadTime.value = null
        console.log('🗑️ 캐시 초기화 완료')
    }

    // 사용자 수강 정보 로드 (최적화)
    const loadUserEnrollments = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                enrollments.value = []
                return []
            }

            // 캐시 확인
            if (isCacheValid(lastEnrollmentLoadTime.value, 3 * 60 * 1000)) {
                console.log('📦 캐시된 enrollment 사용')
                return enrollments.value
            }

            isLoading.value = true

            // 최적화된 메서드 사용
            if (typeof CourseService.getUserEnrollmentsWithCourses === 'function') {
                enrollments.value = await CourseService.getUserEnrollmentsWithCourses(userId)
            } else {
                // 폴백: 기존 방식
                const userEnrollments = await CourseService.getUserEnrollments(userId)

                // 강의 정보와 병합
                enrollments.value = userEnrollments.map(enrollment => ({
                    ...enrollment,
                    course: courses.value.find(c => c.id === enrollment.courseId)
                }))
            }

            lastEnrollmentLoadTime.value = Date.now()
            console.log('✅ 수강 정보 로드 성공:', enrollments.value.length)

            return enrollments.value
        } catch (err) {
            console.error('❌ 수강 정보 로드 실패:', err)
            error.value = err.message
            enrollments.value = []
            return []
        } finally {
            isLoading.value = false
        }
    }

    // 내 강의실 데이터 최적화 로드
    const loadMyCoursesOptimized = async (forceRefresh = false) => {
        try {
            if (!forceRefresh &&
                isCacheValid(lastEnrollmentLoadTime.value) &&
                enrollments.value.length > 0) {
                console.log('📦 캐시된 enrollment 데이터 사용')
                return enrollments.value
            }

            isLoading.value = true
            error.value = null

            await loadUserEnrollments()
            return enrollments.value
        } catch (err) {
            console.error('❌ 최적화된 로드 실패:', err)
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // 필요한 강의 정보만 로드
    const loadRequiredCourses = async (courseIds) => {
        try {
            if (!courseIds || courseIds.length === 0) return

            const loadedIds = new Set(courses.value.map(c => c.id))
            const missingIds = courseIds.filter(id => !loadedIds.has(id))

            if (missingIds.length === 0) {
                console.log('✅ 모든 강의가 이미 로드됨')
                return
            }

            isLoading.value = true

            const missingCourses = await Promise.all(
                missingIds.map(id => CourseService.getCourseById(id))
            )

            courses.value = [...courses.value, ...missingCourses.filter(c => c)]
            console.log(`✅ ${missingCourses.length}개 강의 추가 로드`)
        } catch (err) {
            console.error('❌ 강의 추가 로드 실패:', err)
        } finally {
            isLoading.value = false
        }
    }

    // 강의 ID로 조회 (수정됨 - 더 자세한 로깅)
    const getCourseById = (courseId) => {
        if (!courseId) {
            console.warn('⚠️ getCourseById: courseId가 없습니다')
            return null
        }

        const course = courses.value.find(course => course.id === courseId)

        if (course) {
            console.log('✅ 메모리에서 강의 찾음:', {
                id: course.id,
                title: course.title,
                hasVideo: course.hasVideo
            })
        } else {
            console.log('❌ 메모리에서 강의를 찾을 수 없음:', courseId)
        }

        return course || null
    }

    // 강의 상세 정보 가져오기 (수정됨 - 에러 처리 강화)
    const getCourseDetails = async (courseId) => {
        try {
            console.log('🔍 강의 상세 조회 시작:', courseId)

            // 먼저 메모리 캐시에서 찾기
            const cached = getCourseById(courseId)
            if (cached && cached.detailsLoaded) {
                console.log('📦 메모리 캐시에서 상세 정보 반환')
                return cached
            }

            // CourseService에서 로드
            const course = await CourseService.getCourseById(courseId)

            if (course) {
                // 메모리의 강의 정보 업데이트
                const index = courses.value.findIndex(c => c.id === courseId)
                if (index !== -1) {
                    courses.value[index] = { ...course, detailsLoaded: true }
                } else {
                    courses.value.push({ ...course, detailsLoaded: true })
                }

                console.log('✅ 강의 상세 정보 로드 성공:', {
                    id: course.id,
                    title: course.title,
                    hasVideo: course.hasVideo,
                    videoUrl: course.videoUrl
                })

                return course
            } else {
                console.warn('⚠️ 강의 상세 정보를 찾을 수 없음:', courseId)
                return null
            }
        } catch (err) {
            console.error('❌ 강의 상세 조회 실패:', err)
            error.value = err.message

            // Flask API로 대체 시도
            try {
                console.log('🔄 Flask API로 대체 시도...')
                const flaskCourses = await CourseService.getCoursesFromFlask()
                const flaskCourse = flaskCourses.find(c => c.id === courseId)
                if (flaskCourse) {
                    console.log('✅ Flask API에서 강의 발견')
                    return flaskCourse
                }
            } catch (flaskErr) {
                console.error('Flask API 대체도 실패:', flaskErr)
            }

            return null
        }
    }

    // 수강 신청
    const enrollCourse = async (courseId) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                return {
                    success: false,
                    message: '로그인이 필요합니다.'
                }
            }

            isLoading.value = true

            // 이미 수강 중인지 확인
            const existingEnrollment = enrollments.value.find(e => e.courseId === courseId)
            if (existingEnrollment) {
                return {
                    success: false,
                    message: '이미 수강 중인 강의입니다.'
                }
            }

            // CourseService를 통해 수강 신청
            const result = await CourseService.enrollCourse(courseId, userId)

            if (result.success) {
                // 수강 정보 다시 로드
                await loadUserEnrollments()

                // 선택 목록에서 제거
                removeFromSelected(courseId)

                return {
                    success: true,
                    message: '수강 신청이 완료되었습니다.'
                }
            } else {
                return {
                    success: false,
                    message: result.error || '수강 신청에 실패했습니다.'
                }
            }
        } catch (err) {
            console.error('❌ 수강 신청 실패:', err)
            return {
                success: false,
                message: err.message || '수강 신청 중 오류가 발생했습니다.'
            }
        } finally {
            isLoading.value = false
        }
    }

    // 수강 상태 조회
    const getEnrollmentStatus = (courseId) => {
        const enrollment = enrollments.value.find(e => e.courseId === courseId)
        return enrollment ? enrollment.status : 'not-enrolled'
    }

    // 진도 조회
    const getProgress = (courseId) => {
        const enrollment = enrollments.value.find(e => e.courseId === courseId)
        return enrollment ? enrollment.progress || 0 : 0
    }

    // 선택 목록에 추가 (기존 호환성 + 새로운 최적화)
    const addToSelected = (courseId) => {
        // selectedCourseIds 사용
        if (selectedCourseIds.value.includes(courseId)) {
            return {
                success: false,
                message: '이미 선택된 강의입니다.'
            }
        }

        if (selectedCourseIds.value.length >= 10) {
            return {
                success: false,
                message: '최대 10개까지만 선택할 수 있습니다.'
            }
        }

        // 이미 수강 중인지 확인
        const status = getEnrollmentStatus(courseId)
        if (status !== 'not-enrolled') {
            return {
                success: false,
                message: '이미 수강 중이거나 완료한 강의입니다.'
            }
        }

        selectedCourseIds.value.push(courseId)
        selectedCourses.value.push(courseId)  // 기존 호환성
        saveSelectedToStorage()

        return {
            success: true,
            message: '학습 목록에 추가되었습니다.'
        }
    }

    // 선택 목록에서 제거
    const removeFromSelected = (courseId) => {
        const index = selectedCourseIds.value.indexOf(courseId)
        if (index > -1) {
            selectedCourseIds.value.splice(index, 1)
        }

        const oldIndex = selectedCourses.value.indexOf(courseId)
        if (oldIndex > -1) {
            selectedCourses.value.splice(oldIndex, 1)
        }

        saveSelectedToStorage()
    }

    // 선택 목록 전체 초기화
    const clearSelected = () => {
        selectedCourseIds.value = []
        selectedCourses.value = []
        saveSelectedToStorage()
    }

    // 선택 여부 확인
    const isSelected = (courseId) => {
        return selectedCourseIds.value.includes(courseId) || selectedCourses.value.includes(courseId)
    }

    // 로컬 스토리지에 선택 목록 저장
    const saveSelectedToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEYS.SELECTED_COURSES, JSON.stringify(selectedCourseIds.value))
            localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses.value))  // 기존 호환성
        } catch (error) {
            console.error('선택 목록 저장 실패:', error)
        }
    }

    // 로컬 스토리지에서 선택 목록 로드
    const loadSelectedFromStorage = () => {
        try {
            // 새로운 방식 먼저 시도
            let saved = localStorage.getItem(STORAGE_KEYS.SELECTED_COURSES)
            if (saved) {
                selectedCourseIds.value = JSON.parse(saved)
            } else {
                // 기존 방식 폴백
                saved = localStorage.getItem('selectedCourses')
                if (saved) {
                    const oldData = JSON.parse(saved)
                    // ID만 추출 (기존 데이터가 객체 배열일 수 있음)
                    selectedCourseIds.value = oldData.map(item =>
                        typeof item === 'string' ? item : item.id
                    ).filter(Boolean)
                }
            }

            selectedCourses.value = [...selectedCourseIds.value]  // 동기화
            console.log('📦 선택된 강의 로드됨:', selectedCourseIds.value.length)
        } catch (error) {
            console.error('선택 목록 로드 실패:', error)
            selectedCourseIds.value = []
            selectedCourses.value = []
        }
    }

    // 선택된 강의 일괄 수강 신청
    const enrollSelectedCourses = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                return {
                    success: false,
                    enrolledCount: 0,
                    failedCount: 0,
                    message: '로그인이 필요합니다.'
                }
            }

            if (selectedCourseIds.value.length === 0) {
                return {
                    success: false,
                    enrolledCount: 0,
                    failedCount: 0,
                    message: '선택된 강의가 없습니다.'
                }
            }

            isLoading.value = true
            let enrolledCount = 0
            let failedCount = 0

            // 각 강의별로 수강 신청
            for (const courseId of selectedCourseIds.value) {
                try {
                    // 이미 수강 중인지 확인
                    const existingEnrollment = enrollments.value.find(e => e.courseId === courseId)
                    if (!existingEnrollment) {
                        const result = await CourseService.enrollCourse(courseId, userId)
                        if (result.success) {
                            enrolledCount++
                        } else {
                            failedCount++
                        }
                    }
                } catch (error) {
                    console.error(`수강 신청 실패 (${courseId}):`, error)
                    failedCount++
                }
            }

            // 수강 정보 다시 로드
            await loadUserEnrollments()

            // 성공한 강의는 선택 목록에서 제거
            if (enrolledCount > 0) {
                const enrolledCourseIds = enrollments.value.map(e => e.courseId)
                selectedCourseIds.value = selectedCourseIds.value.filter(id => !enrolledCourseIds.includes(id))
                selectedCourses.value = selectedCourseIds.value  // 동기화
                saveSelectedToStorage()
            }

            return {
                success: enrolledCount > 0,
                enrolledCount,
                failedCount,
                message: `${enrolledCount}개 강의 수강 신청 완료${failedCount > 0 ? `, ${failedCount}개 실패` : ''}`
            }
        } catch (err) {
            console.error('❌ 일괄 수강 신청 실패:', err)
            return {
                success: false,
                enrolledCount: 0,
                failedCount: 0,
                message: err.message || '일괄 수강 신청에 실패했습니다.'
            }
        } finally {
            isLoading.value = false
        }
    }

    // 진도 업데이트
    const updateProgress = async (courseId, progress, currentTime = 0) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) return false

            const result = await CourseService.updateProgress(courseId, userId, progress, currentTime)

            if (result.success) {
                // 로컬 상태 업데이트
                const enrollment = enrollments.value.find(e => e.courseId === courseId)
                if (enrollment) {
                    enrollment.progress = progress
                    if (progress === 100) {
                        enrollment.status = 'completed'
                        enrollment.completedAt = new Date()
                    }
                }
            }

            return result.success
        } catch (err) {
            console.error('❌ 진도 업데이트 실패:', err)
            return false
        }
    }

    // QR 코드로 강의 접근
    const accessCourseByQR = async (courseId) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            // QR 접근 로그 기록
            await CourseService.logQRAccess(courseId, userId)

            // 로그인하지 않은 경우 바로 강의 페이지로
            if (!userId) {
                return {
                    success: true,
                    requiresAuth: false,
                    courseId
                }
            }

            // 로그인한 경우 자동 신청
            const enrollmentStatus = getEnrollmentStatus(courseId)

            if (enrollmentStatus === 'not-enrolled') {
                // 자동 신청
                const result = await CourseService.enrollCourse(courseId, userId, true)
                if (result.success) {
                    await loadUserEnrollments()
                }
            }

            return {
                success: true,
                requiresAuth: true,
                courseId,
                enrolled: true
            }
        } catch (err) {
            console.error('❌ QR 강의 접근 실패:', err)
            return {
                success: false,
                message: 'QR 코드 처리 중 오류가 발생했습니다.'
            }
        }
    }

    // 카테고리별 강의 조회
    const getCoursesByCategory = async (category) => {
        try {
            const courses = await CourseService.getCoursesByCategory(category)
            return courses
        } catch (err) {
            console.error('❌ 카테고리별 강의 조회 실패:', err)
            return []
        }
    }

    // 강의 검색
    const searchCourses = async (searchTerm) => {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return []
            }

            const results = await CourseService.searchCourses(searchTerm)
            return results
        } catch (err) {
            console.error('❌ 강의 검색 실패:', err)
            return []
        }
    }

    // 캐시 무효화
    const invalidateCache = (cacheType = 'all') => {
        if (cacheType === 'all' || cacheType === 'courses') {
            lastLoadTime.value = null
            CourseService.clearCache()
        }
        if (cacheType === 'all' || cacheType === 'enrollments') {
            lastEnrollmentLoadTime.value = null
        }
        console.log(`🗑️ ${cacheType} 캐시 무효화`)
    }

    // 수강 정보만 새로고침
    const refreshEnrollments = async () => {
        invalidateCache('enrollments')
        return loadUserEnrollments()
    }

    return {
        // 상태
        courses,
        enrollments,
        selectedCourses,  // 기존 호환성
        selectedCourseIds,  // 새로운 최적화
        isLoading,
        isLoadingFromCache,
        error,

        // Getters
        enrolledCourses,
        completedCourses,
        selectedCoursesList,
        selectedCount,

        // Actions - 강의 로드
        loadCoursesFromFirebase,
        loadCoursesFromFlask,
        loadCoursesWithPagination,
        loadUserEnrollments,
        getCourseById,
        getCourseDetails,
        getCoursesByCategory,
        searchCourses,
        clearCache,

        // Actions - 수강 관리
        enrollCourse,
        enrollSelectedCourses,
        getEnrollmentStatus,
        getProgress,
        updateProgress,
        accessCourseByQR,

        // Actions - 선택 목록
        addToSelected,
        removeFromSelected,
        clearSelected,
        isSelected,
        saveSelectedToStorage,
        loadSelectedFromStorage,

        // 최적화 메서드
        loadMyCoursesOptimized,
        loadRequiredCourses,
        invalidateCache,
        refreshEnrollments
    }
})