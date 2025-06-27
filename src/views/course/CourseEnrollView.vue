<!-- web/src/views/course/CourseEnrollView.vue -->
<!-- 강의 신청 화면 - 선택된 강의들을 확인하고 일괄 신청하는 화면 -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <div class="bg-white shadow-sm sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <button
                @click="router.back()"
                class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft class="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 class="text-xl font-semibold text-gray-900">강의 신청</h1>
              <p class="text-sm text-gray-500">
                선택한 강의를 확인하고 신청하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 선택된 강의가 없는 경우 -->
      <div v-if="selectedCourses.length === 0" class="text-center py-16">
        <ShoppingCart class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-medium text-gray-900 mb-2">
          선택한 강의가 없습니다
        </h2>
        <p class="text-gray-500 mb-6">
          강의를 선택하여 수강 신청을 진행하세요
        </p>
        <button
            @click="router.push('/courses')"
            class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
                 hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          <BookOpen class="w-5 h-5 mr-2" />
          강의 둘러보기
        </button>
      </div>

      <!-- 선택된 강의 목록 -->
      <div v-else>
        <!-- 요약 정보 -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">
              수강 신청 정보
            </h2>
            <span class="text-sm text-gray-500">
              총 {{ selectedCourses.length }}개 강의
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center space-x-2 text-gray-600 mb-1">
                <Clock class="w-4 h-4" />
                <span class="text-sm">총 학습 시간</span>
              </div>
              <p class="text-lg font-semibold text-gray-900">
                {{ totalDuration }}
              </p>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center space-x-2 text-gray-600 mb-1">
                <BarChart class="w-4 h-4" />
                <span class="text-sm">평균 난이도</span>
              </div>
              <p class="text-lg font-semibold text-gray-900">
                {{ averageDifficulty }}
              </p>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center space-x-2 text-gray-600 mb-1">
                <Award class="w-4 h-4" />
                <span class="text-sm">예상 수료증</span>
              </div>
              <p class="text-lg font-semibold text-gray-900">
                {{ selectedCourses.length }}개
              </p>
            </div>
          </div>
        </div>

        <!-- 강의 목록 -->
        <div class="space-y-4">
          <TransitionGroup
              name="course-list"
              tag="div"
              class="space-y-4"
          >
            <div
                v-for="course in selectedCourses"
                :key="course.id"
                class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="p-6">
                <div class="flex items-start space-x-4">
                  <!-- 썸네일 -->
                  <div class="flex-shrink-0">
                    <img
                        v-if="course.thumbnailUrl"
                        :src="course.thumbnailUrl"
                        :alt="course.title"
                        class="w-32 h-24 object-cover rounded-lg"
                    >
                    <div
                        v-else
                        class="w-32 h-24 bg-gradient-to-br from-blue-400 to-purple-500
                             rounded-lg flex items-center justify-center"
                    >
                      <BookOpen class="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <!-- 강의 정보 -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                      {{ course.title }}
                    </h3>

                    <!-- 카테고리 -->
                    <div class="mb-2">
                      <span
                          :class="getCategoryStyle(course.category?.leaf || '기타')"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full
                               text-xs font-medium"
                      >
                        {{ getCategoryDisplayPath(course) }}
                      </span>
                    </div>

                    <!-- 메타 정보 -->
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                      <span class="flex items-center">
                        <Clock class="w-4 h-4 mr-1" />
                        {{ course.duration || '30분' }}
                      </span>
                      <span class="flex items-center">
                        <BarChart class="w-4 h-4 mr-1" />
                        {{ getDifficultyText(course.difficulty) }}
                      </span>
                      <span v-if="course.rating" class="flex items-center">
                        <Star class="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                        {{ course.rating.toFixed(1) }}
                      </span>
                      <span v-if="course.hasMultipleLanguages" class="flex items-center">
                        <Globe class="w-4 h-4 mr-1" />
                        {{ course.availableLanguages.length }}개 언어
                      </span>
                    </div>

                    <!-- 설명 -->
                    <p class="mt-3 text-gray-600 line-clamp-2">
                      {{ course.description }}
                    </p>
                  </div>

                  <!-- 액션 버튼 -->
                  <div class="flex-shrink-0">
                    <button
                        @click="removeFromSelected(course.id)"
                        class="p-2 text-red-500 hover:bg-red-50 rounded-lg
                             transition-colors"
                        title="선택 취소"
                    >
                      <X class="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <!-- 이미 신청한 강의 경고 -->
                <div
                    v-if="getEnrollmentStatus(course.id) === 'enrolled'"
                    class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div class="flex items-center space-x-2 text-amber-800">
                    <AlertCircle class="w-4 h-4 flex-shrink-0" />
                    <span class="text-sm">
                      이미 수강 중인 강의입니다. 진도율: {{ getProgress(course.id) }}%
                    </span>
                  </div>
                </div>

                <!-- 이미 완료한 강의 경고 -->
                <div
                    v-else-if="getEnrollmentStatus(course.id) === 'completed'"
                    class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div class="flex items-center space-x-2 text-green-800">
                    <CheckCircle class="w-4 h-4 flex-shrink-0" />
                    <span class="text-sm">
                      이미 완료한 강의입니다.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- 하단 액션 영역 -->
        <div class="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-center sm:text-left">
              <p class="text-gray-600 mb-1">
                총 {{ selectedCourses.length }}개 강의를 신청하시겠습니까?
              </p>
              <p class="text-sm text-gray-500">
                신청 후 바로 학습을 시작할 수 있습니다.
              </p>
            </div>

            <div class="flex space-x-3">
              <button
                  @click="clearAll"
                  class="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg
                       hover:bg-gray-200 transition-colors"
              >
                전체 취소
              </button>
              <button
                  @click="enrollAll"
                  :disabled="isProcessing"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
                       hover:bg-blue-700 transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed inline-flex items-center"
              >
                <Loader2 v-if="isProcessing" class="w-5 h-5 mr-2 animate-spin" />
                <span>{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 신청 결과 모달 -->
    <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
      <div
          v-if="showResultModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          @click.self="closeResultModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="text-center">
            <!-- 성공 아이콘 -->
            <div
                v-if="enrollmentResult.success"
                class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4"
            >
              <CheckCircle class="h-6 w-6 text-green-600" />
            </div>
            <!-- 부분 성공 아이콘 -->
            <div
                v-else-if="enrollmentResult.enrolledCount > 0"
                class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4"
            >
              <AlertCircle class="h-6 w-6 text-amber-600" />
            </div>
            <!-- 실패 아이콘 -->
            <div
                v-else
                class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
            >
              <X class="h-6 w-6 text-red-600" />
            </div>

            <!-- 제목 -->
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              {{ getResultTitle() }}
            </h3>

            <!-- 내용 -->
            <p class="text-sm text-gray-600 mb-6">
              {{ enrollmentResult.message }}
            </p>

            <!-- 버튼 -->
            <div class="flex space-x-3">
              <button
                  @click="goToMyCourses"
                  class="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg
                       hover:bg-blue-700 transition-colors"
              >
                내 강의실 가기
              </button>
              <button
                  @click="closeResultModal"
                  class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg
                       hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import { CategoryService } from '@/services/categoryService'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ShoppingCart,
  BookOpen,
  Clock,
  BarChart,
  Award,
  Star,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Globe
} from 'lucide-vue-next'

const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isProcessing = ref(false)
const showResultModal = ref(false)
const enrollmentResult = ref({
  success: false,
  enrolledCount: 0,
  failedCount: 0,
  message: ''
})

// 선택된 강의 목록
const selectedCourses = computed(() => {
  return courseStore.selectedCourseIds
      .map(id => courseStore.getCourseById(id))
      .filter(course => course !== null)
})

// 총 학습 시간 계산
const totalDuration = computed(() => {
  const totalMinutes = selectedCourses.value.reduce((sum, course) => {
    const duration = course.duration || '30분'
    const minutes = parseInt(duration.replace(/[^0-9]/g, '')) || 30
    return sum + minutes
  }, 0)

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  }
  return `${minutes}분`
})

// 평균 난이도 계산
const averageDifficulty = computed(() => {
  const difficultyMap = {
    beginner: 1,
    intermediate: 2,
    advanced: 3
  }

  const totalScore = selectedCourses.value.reduce((sum, course) => {
    return sum + (difficultyMap[course.difficulty] || 2)
  }, 0)

  const avgScore = totalScore / selectedCourses.value.length

  if (avgScore <= 1.5) return '초급'
  if (avgScore <= 2.5) return '중급'
  return '고급'
})

// 카테고리 경로 표시
const getCategoryDisplayPath = (course) => {
  if (!course.category) return '기타'

  const { main, middle, leaf } = course.category
  const parts = []

  if (main) parts.push(main)
  if (middle) parts.push(middle)
  if (leaf) parts.push(leaf)

  return parts.join(' > ') || '기타'
}

// 카테고리 스타일
const getCategoryStyle = (leafCategory) => {
  return CategoryService.getCategoryStyle(leafCategory)
}

// 난이도 텍스트
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }
  return difficultyMap[difficulty] || difficulty
}

// 수강 상태 확인
const getEnrollmentStatus = (courseId) => {
  return courseStore.getEnrollmentStatus(courseId)
}

// 진도율 확인
const getProgress = (courseId) => {
  return courseStore.getProgress(courseId)
}

// 선택 해제
const removeFromSelected = (courseId) => {
  courseStore.removeFromSelected(courseId)

  if (selectedCourses.value.length === 0) {
    ElMessage.info('모든 강의가 선택 해제되었습니다.')
  }
}

// 전체 취소
const clearAll = async () => {
  try {
    await ElMessageBox.confirm(
        '선택한 모든 강의를 취소하시겠습니까?',
        '전체 취소',
        {
          confirmButtonText: '확인',
          cancelButtonText: '취소',
          type: 'warning'
        }
    )

    courseStore.clearSelected()
    ElMessage.success('모든 강의가 선택 해제되었습니다.')
  } catch {
    // 취소됨
  }
}

// 전체 신청
const enrollAll = async () => {
  // 로그인 확인
  if (!authStore.isLoggedIn) {
    ElMessage.warning('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  try {
    isProcessing.value = true

    // 일괄 신청 처리
    const result = await courseStore.enrollSelectedCourses()

    // 결과 저장
    enrollmentResult.value = result

    // 모달 표시
    showResultModal.value = true

  } catch (error) {
    ElMessage.error('수강 신청 중 오류가 발생했습니다.')
    console.error('수강 신청 오류:', error)
  } finally {
    isProcessing.value = false
  }
}

// 결과 제목
const getResultTitle = () => {
  if (enrollmentResult.value.success) {
    if (enrollmentResult.value.failedCount === 0) {
      return '수강 신청 완료!'
    } else {
      return '일부 강의 신청 완료'
    }
  }
  return '수강 신청 실패'
}

// 결과 모달 닫기
const closeResultModal = () => {
  showResultModal.value = false
}

// 내 강의실로 이동
const goToMyCourses = () => {
  showResultModal.value = false
  router.push('/my-courses')
}

// 마운트
onMounted(async () => {
  // 강의 데이터가 없으면 로드
  if (courseStore.courses.length === 0) {
    await courseStore.loadCoursesFromFirestore()
  }

  // 사용자 수강 정보 로드
  if (authStore.isLoggedIn) {
    await courseStore.loadUserEnrollments()
  }
})
</script>

<style scoped>
/* 리스트 애니메이션 */
.course-list-move,
.course-list-enter-active,
.course-list-leave-active {
  transition: all 0.3s ease;
}

.course-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.course-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.course-list-leave-active {
  position: absolute;
  width: 100%;
}

/* 라인 클램프 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>