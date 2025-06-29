// web/src/stores/course.js - 성능 최적화 버전
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
    const isLoadingFromCache = ref(false)
    const error = ref(null)
    const lastLoadTime = ref(null)
    const hasMore = ref(true)
    const lastDoc = ref(null)

    // 선택된 강의 수
    const selectedCount = computed(() => selectedCourseIds.value.length)

    // 선택된 강의 목록 (최적화)
    const selectedCourses = computed(() => {
        const courseMap = new Map(courses.value.map(c => [c.id, c]))
        return selectedCourseIds.value
            .map(id => courseMap.get(id))
            .filter(Boolean)
    })

    // 수강 정보 맵 (빠른 조회용)
    const enrollmentMap = computed(() => {
        return new Map(enrollments.value.map(e => [e.courseId, e]))
    })

    // Firestore에서 강의 목록 로드 (최적화)
    const loadCoursesFromFirestore = async (forceRefresh = false) => {
        try {
            // 중복 로딩 방지
            if (isLoading.value) return courses.value

            // 캐시 확인
            if (!forceRefresh && courses.value.length > 0 && lastLoadTime.value) {
                const timeSinceLastLoad = Date.now() - lastLoadTime.value
                if (timeSinceLastLoad < 60000) { // 1분 이내
                    console.log('📦 메모리 캐시 사용')
                    return courses.value
                }
            }

            isLoading.value = true
            error.value = null

            // CourseService에서 데이터 가져오기
            const data = await CourseService.getCoursesFromFirestore()

            if (data.fromCache) {
                isLoadingFromCache.value = true
                console.log('📦 로컬스토리지 캐시에서 로드')
            }

            courses.value = data.courses || []
            hasMore.value = data.hasMore || false
            lastLoadTime.value = Date.now()

            console.log(`✅ 강의 목록 로드 성공: ${courses.value.length}개`)

            return courses.value
        } catch (err) {
            console.error('❌ 강의 목록 로드 실패:', err)
            error.value = err.message

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

    // 강의 ID로 조회 (최적화)
    const getCourseById = (courseId) => {
        if (!courseId) {
            console.warn('⚠️ getCourseById: courseId가 없습니다')
            return null
        }

        // Map을 사용한 빠른 조회
        const courseMap = new Map(courses.value.map(c => [c.id, c]))
        return courseMap.get(courseId) || null
    }

    // 강의 상세 정보 가져오기 (캐싱 적용)
    const getCourseDetails = async (courseId) => {
        try {
            // 먼저 메모리 캐시에서 찾기
            const cached = getCourseById(courseId)
            if (cached?.detailsLoaded) {
                console.log(`📦 캐시에서 강의 상세 정보 반환: ${courseId}`)
                return cached
            }

            // 메모리에 강의 목록이 없으면 먼저 로드
            if (courses.value.length === 0) {
                console.log('🔄 강의 목록 먼저 로드')
                await loadCoursesFromFirestore()
            }

            // CourseService에서 개별 강의 로드
            console.log(`🔄 서버에서 강의 상세 정보 로드: ${courseId}`)
            const courseDetail = await CourseService.getCourseById(courseId)

            if (courseDetail) {
                // 메모리 캐시 업데이트
                const index = courses.value.findIndex(c => c.id === courseId)
                if (index !== -1) {
                    courses.value[index] = { ...courseDetail, detailsLoaded: true }
                } else {
                    courses.value.push({ ...courseDetail, detailsLoaded: true })
                }

                return courseDetail
            }

            return null
        } catch (err) {
            console.error('강의 상세 조회 실패:', err)
            throw err
        }
    }

    // 수강 상태 확인 (수정됨)
    const getEnrollmentStatus = (courseId) => {
        const enrollment = enrollmentMap.value.get(courseId)

        // 수강 정보가 없으면 'not-enrolled' 반환
        if (!enrollment) {
            return 'not-enrolled'
        }

        // status가 있으면 반환, 없으면 progress로 판단
        if (enrollment.status) {
            return enrollment.status
        }

        // progress가 100이면 completed, 0보다 크면 enrolled
        if (enrollment.progress >= 100) {
            return 'completed'
        } else if (enrollment.progress > 0) {
            return 'enrolled'
        }

        return 'enrolled' // 기본값
    }

    // 진도율 확인 (최적화)
    const getProgress = (courseId) => {
        return enrollmentMap.value.get(courseId)?.progress || 0
    }

    // 선택 관련 메서드
    const isSelected = (courseId) => selectedCourseIds.value.includes(courseId)

    const addToSelected = (courseId) => {
        // 최대 선택 개수 체크
        if (selectedCourseIds.value.length >= 10) {
            return {
                success: false,
                message: '최대 10개까지 선택할 수 있습니다'
            }
        }

        if (!isSelected(courseId)) {
            selectedCourseIds.value.push(courseId)
            saveSelectedToStorage()
            return {
                success: true,
                message: '강의가 선택되었습니다'
            }
        }

        return {
            success: false,
            message: '이미 선택된 강의입니다'
        }
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

    const clearSelectedCourses = clearSelected // 별칭

    // 로컬 스토리지 저장/로드 (최적화)
    const saveSelectedToStorage = () => {
        try {
            localStorage.setItem('selectedCourseIds', JSON.stringify(selectedCourseIds.value))
        } catch (error) {
            console.error('선택 항목 저장 실패:', error)
        }
    }

    const loadSelectedFromStorage = () => {
        try {
            const saved = localStorage.getItem('selectedCourseIds')
            if (saved) {
                selectedCourseIds.value = JSON.parse(saved)
            }
        } catch (error) {
            console.error('선택 항목 로드 실패:', error)
            selectedCourseIds.value = []
        }
    }

    // 수강 신청 (최적화된 배치 처리)
    const enrollCourse = async (courseId) => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                throw new Error('로그인이 필요합니다')
            }

            const enrollment = await CourseService.enrollCourse(userId, courseId)

            // 로컬 상태 업데이트
            enrollments.value.push(enrollment)

            return enrollment
        } catch (err) {
            console.error('수강 신청 실패:', err)
            throw err
        }
    }

    // 선택한 강의 일괄 수강 신청 (최적화)
    const enrollSelectedCourses = async () => {
        try {
            const authStore = useAuthStore()
            const userId = authStore.userId

            if (!userId) {
                throw new Error('로그인이 필요합니다')
            }

            if (selectedCourseIds.value.length === 0) {
                throw new Error('선택된 강의가 없습니다')
            }

            // 이미 수강 중인 강의 필터링
            const enrolledCourseIds = new Set(enrollments.value.map(e => e.courseId))
            const coursesToEnroll = selectedCourseIds.value.filter(id => !enrolledCourseIds.has(id))

            if (coursesToEnroll.length === 0) {
                return {
                    success: true,
                    successCount: 0,
                    failedCount: 0,
                    message: '이미 모든 강의를 수강 중입니다'
                }
            }

            // 배치 처리로 일괄 신청
            const results = await CourseService.enrollMultipleCourses(userId, coursesToEnroll)

            // 성공한 수강 신청 로컬 상태 업데이트
            results.success.forEach(({ courseId, result }) => {
                enrollments.value.push({
                    ...result,
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
            hasMore: hasMore.value,
            ...CourseService.getCacheStatus()
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
        clearSelectedCourses,
        saveSelectedToStorage,
        loadSelectedFromStorage,
        enrollCourse,
        enrollSelectedCourses,
        updateProgress,
        accessCourseByQR,
        getCacheStatus
    }
})