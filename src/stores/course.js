// src/stores/course.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import CourseService from '@/services/courseService'
import EnrollmentService from '@/services/enrollmentService'
import { useAuthStore } from './auth'

export const useCourseStore = defineStore('course', () => {
    // 상태
    const courses = ref([])
    const enrollments = ref([])
    const selectedCourseIds = ref([])
    const isLoading = ref(false)
    const isLoadingFromCache = ref(false)
    const error = ref(null)
    const hasMore = ref(true)
    const lastDoc = ref(null)
    const lastLoadTime = ref(null)

    // 계산된 속성
    const selectedCount = computed(() => selectedCourseIds.value.length)

    const selectedCourses = computed(() => {
        return selectedCourseIds.value
            .map(id => courses.value.find(course => course.id === id))
            .filter(Boolean)
    })

    const enrollmentMap = computed(() => {
        const map = new Map()
        enrollments.value.forEach(enrollment => {
            map.set(enrollment.courseId, enrollment)
        })
        return map
    })

    // 강의 목록 로드 (개선된 Flask 프록시 지원)
    const loadCoursesFromFirestore = async (forceRefresh = false) => {
        try {
            // 캐시 체크
            if (!forceRefresh && courses.value.length > 0) {
                const cacheAge = Date.now() - (lastLoadTime.value || 0)
                if (cacheAge < 5 * 60 * 1000) { // 5분
                    console.log('✅ 캐시된 강의 사용')
                    return result.courses || []
                }
            }

            isLoading.value = true
            isLoadingFromCache.value = true
            error.value = null

            // 캐시에서 먼저 로드 시도
            const cachedCourses = CourseService.getCachedCourses()
            if (cachedCourses && cachedCourses.length > 0) {
                courses.value = cachedCourses
                console.log(`📦 캐시에서 ${cachedCourses.length}개 강의 로드`)
            }

            // Firebase에서 전체 강의 로드
            const result = await CourseService.getCoursesFromFirestore()

            if (result.courses && result.courses.length > 0) {
                courses.value = result.courses
                lastLoadTime.value = Date.now()
                console.log(`✅ Firebase에서 ${result.courses.length}개 강의 로드 완료`)
            }

            return courses.value
        } catch (err) {
            console.error('❌ 강의 로드 실패:', err)
            error.value = err.message

            // 권한 오류일 경우 빈 배열 반환
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

    // 페이지네이션으로 추가 강의 로드
    const loadCoursesWithPagination = async (lastDocument = null) => {
        try {
            if (isLoading.value || !hasMore.value) return

            isLoading.value = true
            error.value = null

            const result = await CourseService.getCoursesWithPagination(
                lastDocument || lastDoc.value
            )

            if (result.courses.length > 0) {
                // 중복 제거 후 추가
                const existingIds = new Set(courses.value.map(c => c.id))
                const newCourses = result.courses.filter(c => !existingIds.has(c.id))

                courses.value = [...courses.value, ...newCourses]
                lastDoc.value = result.lastDoc
                hasMore.value = result.hasMore
            } else {
                hasMore.value = false
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
        courses.value = []
        lastDoc.value = null
        hasMore.value = true
        console.log('🗑️ 캐시 초기화 완료')
    }

    // 사용자 수강 정보 로드 (최적화)
    const loadUserEnrollments = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                enrollments.value = []
                return
            }

            isLoading.value = true

            // CourseService에서 최적화된 메서드 사용
            const userEnrollments = await CourseService.getUserEnrollmentsWithCourses(userId)

            enrollments.value = userEnrollments

            console.log(`✅ 수강 정보 로드 성공: ${enrollments.value.length}개`)
        } catch (err) {
            console.error('❌ 수강 정보 로드 실패:', err)
            error.value = err.message
            enrollments.value = []
        } finally {
            isLoading.value = false
        }
    }

    // 특정 강의 정보 가져오기
    const getCourseById = (courseId) => {
        return courses.value.find(course => course.id === courseId) || null
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
                const existingIndex = courses.value.findIndex(c => c.id === courseId)
                if (existingIndex >= 0) {
                    courses.value[existingIndex] = course
                } else {
                    courses.value.push(course)
                }
            }
            return course
        } catch (err) {
            console.error('강의 상세 정보 로드 실패:', err)
            throw err
        }
    }

    // 수강 상태 확인
    const getEnrollmentStatus = (courseId) => {
        const enrollment = enrollmentMap.value.get(courseId)
        return enrollment ? enrollment.status : 'not-enrolled'
    }

    // 수강 진도 확인
    const getProgress = (courseId) => {
        const enrollment = enrollmentMap.value.get(courseId)
        return enrollment ? enrollment.progress || 0 : 0
    }

    // 선택 관련 메서드
    const isSelected = (courseId) => {
        return selectedCourseIds.value.includes(courseId)
    }

    const addToSelected = (courseId) => {
        if (!isSelected(courseId) && selectedCount.value < 10) {
            selectedCourseIds.value.push(courseId)
            saveSelectedToStorage()
            return { success: true }
        }
        return { success: false, message: '최대 10개까지 선택 가능합니다.' }
    }

    const removeFromSelected = (courseId) => {
        const index = selectedCourseIds.value.indexOf(courseId)
        if (index > -1) {
            selectedCourseIds.value.splice(index, 1)
            saveSelectedToStorage()
        }
    }

    const clearSelected = () => {
        selectedCourseIds.value = []
        saveSelectedToStorage()
    }

    // 로컬 스토리지에 선택 목록 저장
    const saveSelectedToStorage = () => {
        localStorage.setItem('selectedCourses', JSON.stringify(selectedCourseIds.value))
    }

    const loadSelectedFromStorage = () => {
        const saved = localStorage.getItem('selectedCourses')
        if (saved) {
            try {
                selectedCourseIds.value = JSON.parse(saved)
            } catch {
                selectedCourseIds.value = []
            }
        }
    }

    // 수강 신청
    const enrollCourse = async (courseId) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            const result = await EnrollmentService.enrollCourse(userId, courseId)

            // 수강 정보 업데이트
            if (!result.alreadyEnrolled) {
                enrollments.value.push({
                    ...result,
                    course: getCourseById(courseId)
                })
            }

            return result
        } catch (err) {
            console.error('수강 신청 실패:', err)
            throw err
        }
    }

    // 선택한 강의 일괄 수강 신청
    const enrollSelectedCourses = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                throw new Error('로그인이 필요합니다')
            }

            isLoading.value = true

            // 이미 수강 중인 강의 필터링
            const coursesToEnroll = selectedCourseIds.value.filter(id => {
                const status = getEnrollmentStatus(id)
                return status === 'not-enrolled'
            })

            if (coursesToEnroll.length === 0) {
                return {
                    success: true,
                    successCount: 0,
                    failedCount: 0,
                    message: '이미 모든 선택한 강의를 수강 중입니다'
                }
            }

            // 배치 수강 신청
            const results = await EnrollmentService.enrollMultipleCourses(userId, coursesToEnroll)

            // 성공한 수강 신청 로컬 상태 업데이트
            results.success.forEach(({ courseId, enrollment }) => {
                enrollments.value.push({
                    ...enrollment,
                    courseId,
                    course: getCourseById(courseId)
                })
            })

            // 선택 목록 초기화
            clearSelected()

            return {
                success: results.failed.length === 0,
                successCount: results.success.length,
                failedCount: results.failed.length,
                message: `${results.success.length}개 강의 수강 신청 완료`
            }
        } catch (err) {
            console.error('일괄 수강 신청 실패:', err)
            throw err
        }
    }

    // 진도 업데이트
    const updateProgress = async (courseId, progress) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            const updated = await CourseService.updateProgress(userId, courseId, progress)

            // 로컬 상태 업데이트
            const enrollment = enrollments.value.find(e => e.courseId === courseId)
            if (enrollment) {
                enrollment.progress = progress
                if (progress >= 100) {
                    enrollment.status = 'completed'
                }
            }

            return updated
        } catch (err) {
            console.error('진도 업데이트 실패:', err)
            throw err
        }
    }

    // 수강 상태 업데이트 (추가된 메서드)
    const updateEnrollmentStatus = async (courseId, status) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) return

            // EnrollmentService를 통해 상태 업데이트
            await EnrollmentService.updateEnrollment(userId, courseId, { status })

            // 로컬 상태 업데이트
            const enrollment = enrollments.value.find(e => e.courseId === courseId)
            if (enrollment) {
                enrollment.status = status
                console.log(`📝 수강 상태 업데이트: ${courseId} -> ${status}`)
            } else {
                // enrollment이 없으면 새로 추가
                enrollments.value.push({
                    courseId,
                    userId,
                    status,
                    progress: status === 'completed' ? 100 : 0,
                    course: getCourseById(courseId)
                })
            }

            return { success: true }
        } catch (err) {
            console.error('수강 상태 업데이트 실패:', err)
            throw err
        }
    }

    // QR 코드로 강의 접근
    const accessCourseByQR = async (qrData) => {
        try {
            // QR 데이터 파싱
            const { courseId, token } = JSON.parse(qrData)

            // 토큰 검증
            const isValid = await CourseService.validateQRToken(courseId, token)
            if (!isValid) {
                throw new Error('유효하지 않은 QR 코드입니다')
            }

            // 강의 정보 가져오기
            const course = await getCourseDetails(courseId)
            if (!course) {
                throw new Error('강의를 찾을 수 없습니다')
            }

            return course
        } catch (err) {
            console.error('QR 코드 접근 실패:', err)
            throw err
        }
    }

    // 캐시 상태 확인
    const getCacheStatus = () => {
        return {
            memoryCourses: courses.value.length,
            lastLoadTime: lastLoadTime.value ? new Date(lastLoadTime.value).toLocaleString() : null,
            hasMore: hasMore.value
        }
    }

    return {
        // 상태
        courses,
        enrollments,
        selectedCourseIds,
        isLoading,
        isLoadingFromCache,
        error,
        hasMore,

        // 계산된 속성
        selectedCount,
        selectedCourses,
        enrollmentMap,

        // 메서드
        loadCoursesFromFirestore,
        loadCoursesFromFlask: loadCoursesFromFirestore, // 호환성
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
        clearSelectedCourses: clearSelected, // 호환성
        saveSelectedToStorage,
        loadSelectedFromStorage,
        enrollCourse,
        enrollSelectedCourses,
        updateProgress,
        updateEnrollmentStatus, // 추가된 메서드
        accessCourseByQR,
        getCacheStatus
    }
})