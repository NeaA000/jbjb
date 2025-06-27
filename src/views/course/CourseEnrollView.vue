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
                v-for="(course, index) in selectedCourses"
                :key="course.id"
                class="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div class="p-6">
                <div class="flex items-start space-x-4">
                  <!-- 순번 -->
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600
                              rounded-full flex items-center justify-center
                              font-medium text-sm">
                    {{ index + 1 }}
                  </div>

                  <!-- 강의 정보 -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      {{ course.title }}
                    </h3>

                    <!-- 카테고리 표시 -->
                    <div class="flex items-center space-x-2 mb-3">
                      <span
                          :class="getCategoryStyle(course.category?.leaf || '기타')"
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full
                               text-xs font-medium"
                      >
                        {{ getCategoryDisplayPath(course) }}
                      </span>
                    </div>

                    <!-- 강의 메타 정보 -->
                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span class="flex items-center">
                        <User class="w-4 h-4 mr-1" />
                        {{ course.instructor || '전문 강사' }}
                      </span>
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
              <p v-if="authStore.isGuest" class="text-sm text-amber-600">
                <AlertCircle class="w-4 h-4 inline mr-1" />
                게스트는 수료증을 받을 수 없습니다
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                  @click="clearAll"
                  class="px-6 py-3 text-gray-700 bg-gray-100 font-medium
                       rounded-lg hover:bg-gray-200 transition-colors"
              >
                전체 취소
              </button>
              <button
                  @click="proceedToEnroll"
                  :disabled="isProcessing"
                  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors inline-flex items-center justify-center"
              >
                <Loader2 v-if="isProcessing" class="w-5 h-5 mr-2 animate-spin" />
                <span>{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  User,
  Star,
  X,
  AlertCircle,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isProcessing = ref(false)

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
          confirmButtonText: '취소하기',
          cancelButtonText: '돌아가기',
          type: 'warning'
        }
    )

    courseStore.clearSelected()
    ElMessage.info('모든 강의 선택이 취소되었습니다.')
    router.push('/courses')
  } catch {
    // 사용자가 취소한 경우
  }
}

// 수강 신청 진행
const proceedToEnroll = async () => {
  try {
    isProcessing.value = true

    // 게스트 체크
    if (authStore.isGuest) {
      const result = await ElMessageBox.confirm(
          '게스트는 수료증을 받을 수 없습니다. 회원가입하시겠습니까?',
          '회원가입 안내',
          {
            confirmButtonText: '회원가입',
            cancelButtonText: '게스트로 계속',
            type: 'warning'
          }
      )

      if (result === 'confirm') {
        router.push('/register?upgrade=true')
        return
      }
    }

    // 일괄 신청 처리
    const result = await courseStore.enrollSelectedCourses()

    if (result.enrolledCount > 0) {
      await ElMessage.success({
        message: `${result.enrolledCount}개 강의 신청이 완료되었습니다!`,
        duration: 2000
      })

      // 첫 번째 강의로 이동
      setTimeout(() => {
        const firstCourse = selectedCourses.value[0]
        if (firstCourse) {
          // 게스트는 바로 학습, 일반 사용자는 안전 경고 화면으로
          if (authStore.isGuest) {
            router.push(`/learning/${firstCourse.id}`)
          } else {
            router.push(`/video-warning/${firstCourse.id}`)
          }
        } else {
          // 내 강의실로 이동
          router.push('/my-courses')
        }
      }, 1000)
    }

    if (result.failedCount > 0) {
      ElMessage.warning(`${result.failedCount}개 강의 신청에 실패했습니다.`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('강의 신청 오류:', error)
      ElMessage.error('강의 신청 중 오류가 발생했습니다.')
    }
  } finally {
    isProcessing.value = false
  }
}

// 마운트 시 로컬 스토리지에서 선택 항목 로드
onMounted(() => {
  courseStore.loadSelectedFromStorage()

  // 강의 데이터가 없으면 로드
  if (courseStore.courses.length === 0) {
    courseStore.loadCoursesFromFlask()
  }
})
</script>

<style scoped>
/* 리스트 애니메이션 */
.course-list-enter-active,
.course-list-leave-active {
  transition: all 0.3s ease;
}

.course-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.course-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.course-list-move {
  transition: transform 0.3s ease;
}

/* 라인 클램프 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>