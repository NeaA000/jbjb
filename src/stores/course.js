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
        if (!courseId) {
            console.warn('⚠️ getCourseById: courseId가 없습니다')
            return null
        }

        const course = courses.value.find(course => course.id === courseId)

        if (!course) {
            console.warn(`⚠️ 메모리에서 강의를 찾을 수 없음: ${courseId}`)
            // 강의 목록이 비어있으면 로드 시도
            if (courses.value.length === 0) {
                console.log('🔄 강의 목록이 비어있어 로드를 시도합니다')
            }
        } else {
            console.log(`✅ 메모리에서 강의 찾음: ${courseId}`)
        }

        return course || null
    }

    // 강의 상세 정보 가져오기 (캐싱 적용)
    const getCourseDetails = async (courseId) => {
        try {
            // 먼저 메모리 캐시에서 찾기
            const cached = getCourseById(courseId)
            if (cached && cached.detailsLoaded) {
                console.log(`📦 캐시에서 강의 상세 정보 반환: ${courseId}`)
                return cached
            }

            // 메모리에 강의 목록이 없으면 먼저 로드
            if (courses.value.length === 0) {
                console.log('🔄 강의 목록 먼저 로드')
                await loadCoursesFromFirestore()
            }

            // 다시 메모리에서 찾기
            const courseFromMemory = getCourseById(courseId)
            if (courseFromMemory) {
                console.log(`✅ 메모리에서 강의 찾음: ${courseId}`)
                return courseFromMemory
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
            console.error(`❌ 강의 상세 정보 로드 실패 (${courseId}):`, err)
            throw err
        }
    }

    // 수강 상태 확인
    const getEnrollmentStatus = (courseId) => {
        const enrollment = enrollments.value.find(e => e.courseId === courseId)
        if (!enrollment) return 'not-enrolled'
        return enrollment.status || 'in-progress'
    }

    // 진도율 가져오기
    const getProgress = (courseId) => {
        const enrollment = enrollments.value.find(e => e.courseId === courseId)
        return enrollment?.progress || 0
    }

    // 선택 상태 확인
    const isSelected = (courseId) => {
        return selectedCourseIds.value.includes(courseId)
    }

    // 선택 목록에 추가
    const addToSelected = (courseId) => {
        if (!isSelected(courseId)) {
            selectedCourseIds.value.push(courseId)
            saveSelectedToStorage()
        }
    }

    // 선택 목록에서 제거
    const removeFromSelected = (courseId) => {
        const index = selectedCourseIds.value.indexOf(courseId)
        if (index > -1) {
            selectedCourseIds.value.splice(index, 1)
            saveSelectedToStorage()
        }
    }

    // 선택 목록 초기화 (별칭 추가)
    const clearSelected = () => {
        selectedCourseIds.value = []
        saveSelectedToStorage()
    }

    // 별칭 메서드
    const clearSelectedCourses = clearSelected

    // 로컬 스토리지에 저장
    const saveSelectedToStorage = () => {
        localStorage.setItem('selectedCourses', JSON.stringify(selectedCourseIds.value))
    }

    // 로컬 스토리지에서 로드
    const loadSelectedFromStorage = () => {
        const saved = localStorage.getItem('selectedCourses')
        if (saved) {
            try {
                selectedCourseIds.value = JSON.parse(saved)
                // 유효성 검사
                selectedCourseIds.value = selectedCourseIds.value.filter(id => id && typeof id === 'string')
            } catch (error) {
                console.error('선택 목록 로드 실패:', error)
                selectedCourseIds.value = []
            }
        }
    }

    // 수강 신청
    const enrollCourse = async (courseId) => {
        try {
            const authStore = useAuthStore()
            if (!authStore.isLoggedIn) {
                throw new Error('로그인이 필요합니다')
            }

            const userId = authStore.userId
            const enrollment = await CourseService.enrollCourse(userId, courseId)

            // 수강 목록 업데이트
            enrollments.value.push({
                ...enrollment,
                course: getCourseById(courseId)
            })

            return enrollment
        } catch (err) {
            console.error('수강 신청 실패:', err)
            throw err
        }
    }

    // 선택한 강의 일괄 수강 신청
    const enrollSelectedCourses = async () => {
        try {
            const authStore = useAuthStore()
            if (!authStore.isLoggedIn) {
                throw new Error('로그인이 필요합니다')
            }

            const userId = authStore.userId
            const results = {
                success: [],
                failed: [],
                alreadyEnrolled: [],
                totalCount: selectedCourseIds.value.length
            }

            for (const courseId of selectedCourseIds.value) {
                try {
                    // 이미 수강 중인지 확인
                    if (getEnrollmentStatus(courseId) !== 'not-enrolled') {
                        results.alreadyEnrolled.push(courseId)
                        continue
                    }

                    const enrollment = await CourseService.enrollCourse(userId, courseId)
                    enrollments.value.push({
                        ...enrollment,
                        course: getCourseById(courseId)
                    })
                    results.success.push(courseId)
                } catch (error) {
                    console.error(`수강 신청 실패 (${courseId}):`, error)
                    results.failed.push({ courseId, error: error.message })
                }
            }

            // 성공한 강의는 선택 목록에서 제거
            results.success.forEach(courseId => {
                removeFromSelected(courseId)
            })

            results.successCount = results.success.length
            results.failedCount = results.failed.length
            results.alreadyEnrolledCount = results.alreadyEnrolled.length

            return results
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

            // 토큰 검증 (실제로는 서버에서 검증)
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
        accessCourseByQR
    }
})