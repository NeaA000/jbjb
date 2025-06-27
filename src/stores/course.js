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

    // 선택된 강의 수
    const selectedCount = computed(() => selectedCourseIds.value.length)

    // 선택된 강의 목록 (null 체크 추가)
    const selectedCourses = computed(() => {
        return selectedCourseIds.value
            .map(id => courses.value.find(course => course.id === id))
            .filter(course => course !== undefined && course !== null)
    })

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
        console.log('🗑️ 캐시 초기화 완료')
    }

    // 사용자 수강 정보 로드
    const loadUserEnrollments = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                enrollments.value = []
                return
            }

            isLoading.value = true

            // CourseService에서 수강 정보 가져오기
            const userEnrollments = await CourseService.getUserEnrollments(userId)

            // 강의 정보와 병합
            enrollments.value = userEnrollments.map(enrollment => ({
                ...enrollment,
                course: courses.value.find(c => c.id === enrollment.courseId)
            }))

            console.log('✅ 수강 정보 로드 성공:', enrollments.value.length)
        } catch (err) {
            console.error('❌ 수강 정보 로드 실패:', err)
            error.value = err.message
            enrollments.value = []
        } finally {
            isLoading.value = false
        }
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
                clearCache()
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

            // 선택된 강의들을 순차적으로 신청
            for (const courseId of [...selectedCourseIds.value]) {
                const result = await CourseService.enrollCourse(courseId, userId)

                if (result.success) {
                    enrolledCount++
                } else {
                    failedCount++
                    console.error(`강의 ${courseId} 신청 실패:`, result.message)
                }
            }

            // 신청 완료 후 선택 초기화
            clearSelected()

            // 수강 정보 새로고침
            await loadUserEnrollments()

            // 캐시 초기화
            clearCache()

            return {
                success: enrolledCount > 0,
                enrolledCount,
                failedCount
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
    const updateProgress = async (courseId, progress) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) return false

            const result = await CourseService.updateProgress(courseId, userId, progress)

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
        updateProgress
    }
})