<!-- web/src/components/EnrolledCoursesFooter.vue -->
<template>
  <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
  >
    <div
        v-if="courseStore.selectedCount > 0"
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
    >
      <!-- 모바일 뷰 -->
      <div class="lg:hidden">
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <ShoppingCart class="w-5 h-5 text-blue-600" />
              <span class="font-medium text-gray-900">
                선택한 강의 {{ courseStore.selectedCount }}개
              </span>
            </div>
            <button
                @click="toggleExpanded"
                class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronUp
                  :class="['w-5 h-5 text-gray-500 transition-transform',
                  { 'rotate-180': !isExpanded }]"
              />
            </button>
          </div>

          <!-- 확장된 강의 목록 -->
          <transition
              enter-active-class="transition-all duration-300"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-96 opacity-100"
              leave-active-class="transition-all duration-300"
              leave-from-class="max-h-96 opacity-100"
              leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="isExpanded" class="overflow-hidden">
              <div class="max-h-64 overflow-y-auto space-y-2 mb-3">
                <div
                    v-for="course in selectedCourses"
                    :key="course.id"
                    class="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                >
                  <div class="flex-1 min-w-0 mr-2">
                    <h4 class="text-sm font-medium text-gray-900 truncate">
                      {{ course.title }}
                    </h4>
                    <p class="text-xs text-gray-500">
                      {{ getCategoryDisplayPath(course) }}
                    </p>
                  </div>
                  <button
                      @click="removeFromSelected(course.id)"
                      class="p-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X class="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </transition>

          <!-- 액션 버튼들 -->
          <div class="flex gap-2">
            <button
                @click="clearAll"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                     rounded-lg hover:bg-gray-200 transition-colors"
            >
              전체 취소
            </button>
            <button
                @click="proceedToEnroll"
                :disabled="isProcessing"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600
                     rounded-lg hover:bg-blue-700 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Loader2 v-if="isProcessing" class="w-4 h-4 mr-2 animate-spin" />
              <span>{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 데스크톱 뷰 -->
      <div class="hidden lg:block">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <!-- 좌측: 선택된 강의 정보 -->
            <div class="flex items-center space-x-6">
              <div class="flex items-center space-x-2">
                <ShoppingCart class="w-5 h-5 text-blue-600" />
                <span class="font-medium text-gray-900">
                  선택한 강의 {{ courseStore.selectedCount }}개
                </span>
              </div>

              <!-- 선택된 강의 미리보기 -->
              <div class="flex items-center space-x-2">
                <div class="flex -space-x-2">
                  <div
                      v-for="(course, index) in selectedCoursesPreview"
                      :key="course.id"
                      :title="course.title"
                      class="w-8 h-8 rounded-full bg-gray-200 flex items-center
                           justify-center text-xs font-medium text-gray-600
                           border-2 border-white"
                  >
                    {{ course.title.charAt(0) }}
                  </div>
                  <div
                      v-if="courseStore.selectedCount > 3"
                      class="w-8 h-8 rounded-full bg-gray-300 flex items-center
                           justify-center text-xs font-medium text-gray-700
                           border-2 border-white"
                  >
                    +{{ courseStore.selectedCount - 3 }}
                  </div>
                </div>
                <button
                    @click="showDetailModal = true"
                    class="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  상세보기
                </button>
              </div>
            </div>

            <!-- 우측: 액션 버튼들 -->
            <div class="flex items-center space-x-3">
              <button
                  @click="clearAll"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white
                       border border-gray-300 rounded-lg hover:bg-gray-50
                       transition-colors"
              >
                전체 취소
              </button>
              <button
                  @click="proceedToEnroll"
                  :disabled="isProcessing"
                  class="px-6 py-2 text-sm font-medium text-white bg-blue-600
                       rounded-lg hover:bg-blue-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Loader2 v-if="isProcessing" class="w-4 h-4 mr-2 animate-spin" />
                <span>{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 상세보기 모달 -->
      <Teleport to="body">
        <transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
          <div
              v-if="showDetailModal"
              @click="showDetailModal = false"
              class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <div
                @click.stop
                class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <!-- 모달 헤더 -->
              <div class="p-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">
                    선택한 강의 목록
                  </h3>
                  <button
                      @click="showDetailModal = false"
                      class="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X class="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <!-- 모달 바디 -->
              <div class="p-4 overflow-y-auto max-h-[60vh]">
                <div class="space-y-3">
                  <div
                      v-for="(course, index) in selectedCourses"
                      :key="course.id"
                      class="bg-gray-50 rounded-lg p-4 flex items-start justify-between"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start space-x-3">
                        <span class="text-sm font-medium text-gray-500 mt-0.5">
                          {{ index + 1 }}.
                        </span>
                        <div class="flex-1">
                          <h4 class="font-medium text-gray-900">
                            {{ course.title }}
                          </h4>
                          <p class="text-sm text-gray-500 mt-1">
                            {{ getCategoryDisplayPath(course) }}
                          </p>
                          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span class="flex items-center">
                              <Clock class="w-3 h-3 mr-1" />
                              {{ course.duration || '30분' }}
                            </span>
                            <span class="flex items-center">
                              <BarChart class="w-3 h-3 mr-1" />
                              {{ getDifficultyText(course.difficulty) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                        @click="removeFromSelected(course.id)"
                        class="ml-4 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 class="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- 모달 푸터 -->
              <div class="p-4 border-t border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">
                    총 {{ courseStore.selectedCount }}개 강의 선택됨
                  </span>
                  <button
                      @click="showDetailModal = false"
                      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white
                           border border-gray-300 rounded-lg hover:bg-gray-50
                           transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import { CategoryService } from '@/services/categoryService'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ShoppingCart,
  X,
  ChevronUp,
  Loader2,
  Clock,
  BarChart,
  Trash2
} from 'lucide-vue-next'

const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isExpanded = ref(false)
const isProcessing = ref(false)
const showDetailModal = ref(false)

// 선택된 강의 목록
const selectedCourses = computed(() => {
  return courseStore.selectedCourseIds
      .map(id => courseStore.getCourseById(id))
      .filter(course => course !== null)
})

// 미리보기용 강의 목록 (최대 3개)
const selectedCoursesPreview = computed(() => {
  return selectedCourses.value.slice(0, 3)
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

// 난이도 텍스트
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }
  return difficultyMap[difficulty] || difficulty
}

// 토글 확장/축소
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// 선택 해제
const removeFromSelected = (courseId) => {
  courseStore.removeFromSelected(courseId)
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

    // 신청 확인
    const confirmResult = await ElMessageBox.confirm(
        `선택한 ${courseStore.selectedCount}개 강의를 모두 신청하시겠습니까?`,
        '강의 신청 확인',
        {
          confirmButtonText: '신청하기',
          cancelButtonText: '취소',
          type: 'info'
        }
    )

    if (confirmResult === 'confirm') {
      // 일괄 신청 처리
      const result = await courseStore.enrollSelectedCourses()

      if (result.enrolledCount > 0) {
        ElMessage.success(`${result.enrolledCount}개 강의 신청이 완료되었습니다!`)

        // 첫 번째 강의로 이동
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
      }

      if (result.failedCount > 0) {
        ElMessage.warning(`${result.failedCount}개 강의 신청에 실패했습니다.`)
      }
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
</script>

<style scoped>
/* 스크롤바 스타일링 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>