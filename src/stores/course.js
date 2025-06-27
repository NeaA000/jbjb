// web/src/stores/course.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CourseService from '@/services/courseService'
import { useAuthStore } from './auth'

export const useCourseStore = defineStore('course', () => {
    // 상태
    const courses = ref([])
    const enrollments = ref([])
    const selectedCourseIds = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const lastLoadTime = ref(null)
    const isLoadingFromCache = ref(false)

    // 캐시 관련 상태 추가
    const lastEnrollmentLoadTime = ref(null)
    const CACHE_DURATION = 5 * 60 * 1000 // 5분

    // 선택된 강의 수
    const selectedCount = computed(() => selectedCourseIds.value.length)

    // 선택된 강의 목록 (null 체크 추가)
    const selectedCourses = computed(() => {
        return selectedCourseIds.value
            .map(id => courses.value.find(course => course.id === id))
            .filter(course => course !== undefined && course !== null)
    })

    // 캐시 유효성 검사
    const isCacheValid = (cacheTime, duration = CACHE_DURATION) => {
        if (!cacheTime) return false
        return (Date.now() - cacheTime) < duration
    }

    // Firestore에서 강의 목록 로드 (캐시 적용)
    const loadCoursesFromFirestore = async (forceRefresh = false) => {
        try {
            // 강제 새로고침이 아니고 이미 데이터가 있으면 캐시 사용
            if (!forceRefresh && courses.value.length > 0 && lastLoadTime.value) {
                const timeSinceLastLoad = Date.now() - lastLoadTime.value
                if (timeSinceLastLoad < 60000) { // 1분 이내면 캐시 사용
                    console.log('📦 메모리 캐시 사용')
                    return courses.value
                }
            }

            isLoading.value = true
            error.value = null

            // CourseService에서 데이터 가져오기 (로컬스토리지 캐시 포함)
            const data = await CourseService.getCoursesFromFirestore()

            if (data.fromCache) {
                isLoadingFromCache.value = true
                console.log('📦 로컬스토리지 캐시에서 로드')
            }

            courses.value = data.courses || []
            lastLoadTime.value = Date.now()

            console.log('✅ 강의 목록 로드 성공:', courses.value.length)

            // 로드된 강의 정보 샘플 출력 (디버깅용)
            if (courses.value.length > 0) {
                console.log('첫 번째 강의 정보:', {
                    id: courses.value[0].id,
                    title: courses.value[0].title,
                    category: courses.value[0].category,
                    hasVideo: !!courses.value[0].videoUrl,
                    languages: courses.value[0].availableLanguages
                })
            }

            return courses.value
        } catch (err) {
            console.error('❌ 강의 목록 로드 실패:', err)
            error.value = err.message

            // Firestore 권한 오류 시에도 빈 배열 반환
            if (err.code === 'permission-denied') {
                courses.value = []
                return []
            }

            throw err
        } finally {
            isLoading.value = false
            isLoadingFromCache.value = false
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

    /**
     * 내 강의실 데이터를 최적화된 방식으로 로드
     * - 병렬 처리
     * - 캐싱 적용
     * - 중복 방지
     */
    const loadMyCoursesOptimized = async (forceRefresh = false) => {
        try {
            // 캐시가 유효하고 강제 새로고침이 아닌 경우
            if (!forceRefresh &&
                isCacheValid(lastEnrollmentLoadTime.value) &&
                enrollments.value.length > 0) {
                console.log('📦 캐시된 enrollment 데이터 사용')
                return enrollments.value
            }

            isLoading.value = true
            error.value = null

            // 병렬로 필요한 데이터 로드
            const promises = []

            // enrollment 데이터는 항상 필요
            promises.push(loadUserEnrollmentsOptimized())

            // courses가 비어있거나 캐시가 오래된 경우만 로드
            if (courses.value.length === 0 || !isCacheValid(lastLoadTime.value)) {
                promises.push(loadCoursesFromFirestore())
            }

            // 모든 Promise를 병렬로 실행
            const results = await Promise.allSettled(promises)

            // 에러 처리 (부분 실패 허용)
            const errors = results.filter(result => result.status === 'rejected')
            if (errors.length > 0) {
                console.warn('일부 데이터 로드 실패:', errors)
            }

            // 캐시 시간 업데이트
            lastEnrollmentLoadTime.value = Date.now()

            return enrollments.value
        } catch (err) {
            console.error('❌ 최적화된 로드 실패:', err)
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 사용자 수강 정보만 빠르게 로드 (캐시 적용)
     */
    const loadUserEnrollmentsOptimized = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                enrollments.value = []
                return []
            }

            // 캐시 확인
            if (isCacheValid(lastEnrollmentLoadTime.value, 3 * 60 * 1000)) { // 3분
                console.log('📦 캐시된 enrollment 사용')
                return enrollments.value
            }

            isLoading.value = true

            // CourseService에서 수강 정보 가져오기
            const userEnrollments = await CourseService.getUserEnrollments(userId)

            // 이미 로드된 courses가 있으면 병합
            if (courses.value.length > 0) {
                enrollments.value = userEnrollments.map(enrollment => ({
                    ...enrollment,
                    course: courses.value.find(c => c.id === enrollment.courseId)
                }))
            } else {
                // courses가 없으면 enrollment 정보만 저장
                enrollments.value = userEnrollments
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

    // 사용자 수강 정보 로드
    const loadUserEnrollments = async () => {
        return loadUserEnrollmentsOptimized()
    }

    /**
     * 필요한 강의 정보만 로드
     */
    const loadRequiredCourses = async (courseIds) => {
        try {
            if (!courseIds || courseIds.length === 0) return

            // 이미 로드된 강의 확인
            const loadedIds = new Set(courses.value.map(c => c.id))
            const missingIds = courseIds.filter(id => !loadedIds.has(id))

            if (missingIds.length === 0) {
                console.log('✅ 모든 강의가 이미 로드됨')
                return
            }

            isLoading.value = true

            // 누락된 강의만 로드
            const missingCourses = await Promise.all(
                missingIds.map(id => CourseService.getCourseById(id))
            )

            // 기존 courses에 추가
            courses.value = [...courses.value, ...missingCourses.filter(c => c)]

            console.log(`✅ ${missingCourses.length}개 강의 추가 로드`)
        } catch (err) {
            console.error('❌ 강의 추가 로드 실패:', err)
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 캐시 무효화
     */
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

    /**
     * 수강 정보만 새로고침
     */
    const refreshEnrollments = async () => {
        invalidateCache('enrollments')
        return loadUserEnrollmentsOptimized()
    }

    // 강의 ID로 조회 (null 체크 추가)
    const getCourseById = (courseId) => {
        if (!courseId) return null
        return courses.value.find(course => course.id === courseId) || null
    }

    // 강의 상세 정보 가져오기 (캐싱 적용)
    const getCourseDetails = async (courseId) => {
        try {
            // 먼저 메모리 캐시에서 찾기
            const cached = getCourseById(courseId)
            if (cached && cached.detailsLoaded) {
                return cached
            }

            // CourseService에서 로드 (로컬스토리지 캐시 포함)
            const course = await CourseService.getCourseById(courseId)
            if (course) {
                course.detailsLoaded = true

                // 캐시에 추가 또는 업데이트
                const index = courses.value.findIndex(c => c.id === courseId)
                if (index !== -1) {
                    courses.value[index] = course
                } else {
                    courses.value.push(course)
                }
            }
            return course
        } catch (err) {
            console.error('❌ 강의 상세 로드 실패:', err)
            throw err
        }
    }

    // 수강 상태 확인
    const getEnrollmentStatus = (courseId) => {
        const enrollment = enrollments.value.find(e => e.courseId === courseId)
        if (!enrollment) return 'not-enrolled'

        if (enrollment.progress === 100 || enrollment.status === 'completed') {
            return 'completed'
        }
        return 'enrolled'
    }

    // 진도율 확인
    const getProgress = (courseId) => {
        const enrollment = enrollments.value.find(e => e.courseId === courseId)
        return enrollment?.progress || 0
    }

    // 선택 여부 확인
    const isSelected = (courseId) => {
        return selectedCourseIds.value.includes(courseId)
    }

    // 선택 목록에 추가
    const addToSelected = (courseId) => {
        try {
            // 이미 선택된 경우
            if (isSelected(courseId)) {
                return { success: false, message: '이미 선택된 강의입니다.' }
            }

            // 최대 선택 개수 체크
            if (selectedCourseIds.value.length >= 10) {
                return { success: false, message: '최대 10개까지 선택할 수 있습니다.' }
            }

            // 이미 수강 중인 강의 체크
            const status = getEnrollmentStatus(courseId)
            if (status !== 'not-enrolled') {
                return { success: false, message: '이미 수강 중이거나 완료한 강의입니다.' }
            }

            selectedCourseIds.value.push(courseId)
            saveSelectedToStorage()

            console.log('✅ 강의 선택됨:', courseId)
            return { success: true, message: '강의가 선택되었습니다.' }
        } catch (err) {
            console.error('❌ 강의 선택 실패:', err)
            return { success: false, message: '강의 선택에 실패했습니다.' }
        }
    }

    // 선택 목록에서 제거
    const removeFromSelected = (courseId) => {
        const index = selectedCourseIds.value.indexOf(courseId)
        if (index > -1) {
            selectedCourseIds.value.splice(index, 1)
            saveSelectedToStorage()
            console.log('🗑️ 강의 선택 해제됨:', courseId)
        }
    }

    // 전체 선택 해제
    const clearSelected = () => {
        selectedCourseIds.value = []
        saveSelectedToStorage()
        console.log('🗑️ 모든 선택 해제됨')
    }

    // clearSelectedCourses 별칭
    const clearSelectedCourses = () => {
        clearSelected()
    }

    // 로컬 스토리지에 저장
    const saveSelectedToStorage = () => {
        try {
            localStorage.setItem('selectedCourses', JSON.stringify(selectedCourseIds.value))
        } catch (err) {
            console.error('로컬 스토리지 저장 실패:', err)
        }
    }

    // 로컬 스토리지에서 로드
    const loadSelectedFromStorage = () => {
        try {
            const saved = localStorage.getItem('selectedCourses')
            if (saved) {
                selectedCourseIds.value = JSON.parse(saved)
                console.log('📦 선택된 강의 로드됨:', selectedCourseIds.value.length)
            }
        } catch (err) {
            console.error('로컬 스토리지 로드 실패:', err)
            selectedCourseIds.value = []
        }
    }

    // 단일 강의 신청
    const enrollCourse = async (courseId) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                return { success: false, message: '로그인이 필요합니다.' }
            }

            isLoading.value = true

            const result = await CourseService.enrollCourse(courseId, userId)

            if (result.success) {
                // 수강 정보 새로고침
                await loadUserEnrollments()

                // 선택 목록에서 제거
                removeFromSelected(courseId)

                // 캐시 초기화 (수강 정보 변경)
                invalidateCache('enrollments')
            }

            return result
        } catch (err) {
            console.error('❌ 강의 신청 실패:', err)
            return { success: false, message: err.message || '강의 신청에 실패했습니다.' }
        } finally {
            isLoading.value = false
        }
    }

    // 선택된 강의 일괄 신청
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
            const enrollmentResults = []

            // 선택된 강의들을 순차적으로 신청
            for (const courseId of [...selectedCourseIds.value]) {
                const result = await CourseService.enrollCourse(courseId, userId)

                if (result.success) {
                    enrolledCount++
                    enrollmentResults.push({
                        courseId,
                        success: true,
                        message: result.message
                    })
                } else {
                    failedCount++
                    enrollmentResults.push({
                        courseId,
                        success: false,
                        message: result.message
                    })
                    console.error(`강의 ${courseId} 신청 실패:`, result.message)
                }
            }

            // 신청 완료 후 선택 초기화
            clearSelected()

            // 수강 정보 새로고침
            await loadUserEnrollments()

            // 캐시 초기화
            invalidateCache('enrollments')

            // 상세 결과 로그
            console.log('📋 일괄 신청 결과:', {
                total: enrollmentResults.length,
                success: enrolledCount,
                failed: failedCount,
                details: enrollmentResults
            })

            return {
                success: enrolledCount > 0,
                enrolledCount,
                failedCount,
                message: `${enrolledCount}개 강의 신청 완료${failedCount > 0 ? `, ${failedCount}개 실패` : ''}`
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

    return {
        // 상태
        courses,
        enrollments,
        selectedCourseIds,
        isLoading,
        error,
        isLoadingFromCache,

        // 계산된 속성
        selectedCount,
        selectedCourses,

        // 메서드
        loadCoursesFromFirestore,
        loadCoursesFromFlask: loadCoursesFromFirestore, // 호환성을 위한 별칭
        loadCoursesWithPagination,
        clearCache,
        loadUserEnrollments,
        getCourseById,
        getCourseDetails,
        getEnrollmentStatus,
        getProgress,
        isSelected,
        addToSelected,
        removeFromSelected,
        clearSelected,
        clearSelectedCourses,
        saveSelectedToStorage,
        loadSelectedFromStorage,
        enrollCourse,
        enrollSelectedCourses,
        updateProgress,
        accessCourseByQR,

        // 최적화 메서드 추가
        loadMyCoursesOptimized,
        loadRequiredCourses,
        invalidateCache,
        refreshEnrollments
    }
})