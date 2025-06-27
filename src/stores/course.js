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

    // 선택된 강의 수
    const selectedCount = computed(() => selectedCourseIds.value.length)

    // 선택된 강의 목록
    const selectedCourses = computed(() => {
        return selectedCourseIds.value
            .map(id => courses.value.find(course => course.id === id))
            .filter(course => course !== undefined)
    })

    // 강의 목록 로드
    const loadCoursesFromFlask = async () => {
        try {
            isLoading.value = true
            error.value = null

            // CourseService에서 데이터 가져오기
            const data = await CourseService.getCoursesFromFlask()
            courses.value = data.courses || []

            console.log('✅ 강의 목록 로드 성공:', courses.value.length)
            return courses.value
        } catch (err) {
            console.error('❌ 강의 목록 로드 실패:', err)
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // 사용자 수강 정보 로드
    const loadUserEnrollments = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.currentUserId

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
        } finally {
            isLoading.value = false
        }
    }

    // 강의 ID로 조회
    const getCourseById = (courseId) => {
        return courses.value.find(course => course.id === courseId)
    }

    // 강의 상세 정보 가져오기
    const getCourseDetails = async (courseId) => {
        try {
            // 먼저 캐시에서 찾기
            const cached = getCourseById(courseId)
            if (cached) return cached

            // 없으면 Firebase에서 로드
            const course = await CourseService.getCourseById(courseId)
            if (course) {
                // 캐시에 추가
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
            const userId = authStore.currentUserId

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
            const userId = authStore.currentUserId

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
            const userId = authStore.currentUserId

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

        // 계산된 속성
        selectedCount,
        selectedCourses,

        // 메서드
        loadCoursesFromFlask,
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