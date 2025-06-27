<!-- web/src/components/EnrolledCoursesFooter.vue -->
<template>
  <transition
      enter-active-class="transition-all ease-out duration-500"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all ease-in duration-300"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
  >
    <div
        v-if="courseStore.selectedCount > 0"
        class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white to-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl z-40"
    >
      <!-- 모바일 뷰 -->
      <div class="lg:hidden">
        <div class="p-5">
          <!-- 헤더 섹션 -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-60"></div>
                <div class="relative bg-gradient-to-r from-blue-500 to-purple-500 p-2.5 rounded-full shadow-lg">
                  <ShoppingCart class="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <span class="text-sm text-gray-500 block">선택한 강의</span>
                <span class="font-bold text-gray-900 text-lg">
                  {{ courseStore.selectedCount }}개
                </span>
              </div>
            </div>
            <button
                @click="toggleExpanded"
                class="group p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-md"
            >
              <ChevronUp
                  :class="['w-5 h-5 text-gray-600 transition-all duration-500 group-hover:text-gray-900',
                  { 'rotate-180': !isExpanded }]"
              />
            </button>
          </div>

          <!-- 확장된 강의 목록 -->
          <transition
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="max-h-0 opacity-0 scale-95"
              enter-to-class="max-h-96 opacity-100 scale-100"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="max-h-96 opacity-100 scale-100"
              leave-to-class="max-h-0 opacity-0 scale-95"
          >
            <div v-if="isExpanded" class="overflow-hidden">
              <div class="max-h-64 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar">
                <transition-group
                    name="list"
                    tag="div"
                    class="space-y-3"
                >
                  <div
                      v-for="course in selectedCourses"
                      :key="course.id"
                      class="group bg-gradient-to-r from-gray-50 to-gray-50/50 hover:from-blue-50 hover:to-purple-50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gray-100"
                  >
                    <div class="flex-1 min-w-0 mr-3">
                      <h4 class="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                        {{ course.title }}
                      </h4>
                      <p class="text-xs text-gray-500 mt-1 flex items-center">
                        <span class="inline-block w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mr-2"></span>
                        {{ getCategoryDisplayPath(course) }}
                      </p>
                    </div>
                    <button
                        @click="removeFromSelected(course.id)"
                        class="group/btn p-2 rounded-xl bg-white hover:bg-red-50 transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-red-200"
                    >
                      <X class="w-4 h-4 text-gray-400 group-hover/btn:text-red-500 transition-colors" />
                    </button>
                  </div>
                </transition-group>
              </div>
            </div>
          </transition>

          <!-- 액션 버튼들 -->
          <div class="flex gap-3">
            <button
                @click="clearAll"
                class="flex-1 relative overflow-hidden group px-5 py-4 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-300 hover:shadow-lg border border-gray-200"
            >
              <span class="relative z-10 flex items-center justify-center">
                <Trash2 class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                전체 취소
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
            <button
                @click="proceedToEnroll"
                :disabled="isProcessing"
                class="flex-1 relative overflow-hidden group px-5 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-2xl transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.02]"
            >
              <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
              <Loader2 v-if="isProcessing" class="w-4 h-4 mr-2 animate-spin" />
              <ShoppingBag v-else class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              <span class="relative">{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
            </button>
          </div>

          <!-- 프로그레스 바 (처리 중일 때) -->
          <div v-if="isProcessing" class="mt-3">
            <div class="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-progress"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 데스크톱 뷰 -->
      <div class="hidden lg:block">
        <div class="max-w-7xl mx-auto px-6 py-5">
          <div class="flex items-center justify-between">
            <!-- 좌측: 선택된 강의 정보 -->
            <div class="flex items-center space-x-8">
              <div class="flex items-center space-x-4">
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-60"></div>
                  <div class="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full shadow-lg">
                    <ShoppingCart class="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <span class="text-sm text-gray-500 block">선택한 강의</span>
                  <span class="font-bold text-gray-900 text-xl">
                    {{ courseStore.selectedCount }}개
                  </span>
                </div>
              </div>

              <!-- 선택된 강의 미리보기 -->
              <div class="flex items-center space-x-3">
                <div class="flex -space-x-3">
                  <transition-group name="avatar">
                    <div
                        v-for="(course, index) in selectedCoursesPreview"
                        :key="course.id"
                        :title="course.title"
                        :style="{ zIndex: 3 - index }"
                        class="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xs font-bold text-white border-3 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      {{ course.title.charAt(0) }}
                    </div>
                  </transition-group>
                  <div
                      v-if="courseStore.selectedCount > 3"
                      class="relative w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-xs font-bold text-white border-3 border-white shadow-lg"
                  >
                    +{{ courseStore.selectedCount - 3 }}
                  </div>
                </div>
                <button
                    @click="showDetailModal = true"
                    class="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center"
                >
                  <Eye class="w-4 h-4 mr-1 text-blue-600" />
                  상세보기
                </button>
              </div>
            </div>

            <!-- 우측: 액션 버튼들 -->
            <div class="flex items-center space-x-4">
              <button
                  @click="clearAll"
                  class="group px-6 py-3 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all duration-300 hover:shadow-lg flex items-center"
              >
                <Trash2 class="w-4 h-4 mr-2 text-gray-400 group-hover:text-gray-600 group-hover:scale-110 transition-all" />
                전체 취소
              </button>
              <button
                  @click="proceedToEnroll"
                  :disabled="isProcessing"
                  class="relative overflow-hidden group px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-2xl transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center transform hover:scale-[1.02]"
              >
                <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
                <Loader2 v-if="isProcessing" class="w-4 h-4 mr-2 animate-spin" />
                <ShoppingBag v-else class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                <span class="relative">{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 상세보기 모달 -->
      <Teleport to="body">
        <transition
            enter-active-class="transition-all ease-out duration-300"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all ease-in duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
          <div
              v-if="showDetailModal"
              @click="showDetailModal = false"
              class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div
                @click.stop
                class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transform transition-all"
            >
              <!-- 모달 헤더 -->
              <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
                      <ShoppingCart class="w-5 h-5 text-white" />
                    </div>
                    <h3 class="text-xl font-bold text-gray-900">
                      선택한 강의 목록
                    </h3>
                  </div>
                  <button
                      @click="showDetailModal = false"
                      class="p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
                  >
                    <X class="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:rotate-90 transition-all" />
                  </button>
                </div>
              </div>

              <!-- 모달 바디 -->
              <div class="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div class="space-y-4">
                  <transition-group name="modal-list">
                    <div
                        v-for="(course, index) in selectedCourses"
                        :key="course.id"
                        class="group bg-gradient-to-r from-gray-50 to-gray-50/30 hover:from-blue-50 hover:to-purple-50 rounded-2xl p-5 flex items-start justify-between transition-all duration-300 hover:shadow-lg border border-gray-100"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start space-x-4">
                          <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                            {{ index + 1 }}
                          </span>
                          <div class="flex-1">
                            <h4 class="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {{ course.title }}
                            </h4>
                            <p class="text-sm text-gray-500 mt-1">
                              {{ getCategoryDisplayPath(course) }}
                            </p>
                            <div class="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                              <span class="flex items-center bg-gray-100 px-2 py-1 rounded-lg">
                                <Clock class="w-3 h-3 mr-1" />
                                {{ course.duration || '30분' }}
                              </span>
                              <span class="flex items-center bg-gray-100 px-2 py-1 rounded-lg">
                                <BarChart class="w-3 h-3 mr-1" />
                                {{ getDifficultyText(course.difficulty) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                          @click="removeFromSelected(course.id)"
                          class="ml-4 p-2.5 rounded-xl bg-white hover:bg-red-50 transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-red-200 group/delete"
                      >
                        <Trash2 class="w-4 h-4 text-gray-400 group-hover/delete:text-red-500 group-hover/delete:scale-110 transition-all" />
                      </button>
                    </div>
                  </transition-group>
                </div>
              </div>

              <!-- 모달 푸터 -->
              <div class="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/50">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                    <span class="text-sm font-medium text-gray-600">
                      총 {{ courseStore.selectedCount }}개 강의가 선택되었습니다
                    </span>
                  </div>
                  <button
                      @click="showDetailModal = false"
                      class="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-300 hover:shadow-lg"
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
  Trash2,
  Eye,
  ShoppingBag
} from 'lucide-vue-next'

const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isExpanded = ref(false)
const isProcessing = ref(false)
const showDetailModal = ref(false)

// 선택된 강의 목록 (null 체크 강화)
const selectedCourses = computed(() => {
  return courseStore.selectedCourseIds
      .map(id => courseStore.getCourseById(id))
      .filter(course => course !== null && course !== undefined)
})

// 미리보기용 강의 목록 (최대 3개)
const selectedCoursesPreview = computed(() => {
  return selectedCourses.value.slice(0, 3)
})

// 카테고리 경로 표시
const getCategoryDisplayPath = (course) => {
  if (!course || !course.category) return '기타'

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
  return difficultyMap[difficulty] || difficulty || '초급'
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
          type: 'warning',
          customClass: 'modern-message-box'
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
            type: 'warning',
            customClass: 'modern-message-box'
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
          type: 'info',
          customClass: 'modern-message-box'
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
/* 커스텀 스크롤바 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #2563eb, #7c3aed);
}

/* 리스트 애니메이션 */
.list-enter-active,
.list-leave-active,
.modal-list-enter-active,
.modal-list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.modal-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to,
.modal-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move,
.modal-list-move {
  transition: transform 0.3s ease;
}

/* 아바타 애니메이션 */
.avatar-enter-active {
  transition: all 0.3s ease;
}

.avatar-enter-from {
  opacity: 0;
  transform: scale(0);
}

.avatar-leave-to {
  opacity: 0;
  transform: scale(0);
}

/* 프로그레스 애니메이션 */
@keyframes progress {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}

.animate-progress {
  animation: progress 2s ease-in-out infinite;
}

/* 글로벌 스타일 오버라이드 */
:deep(.modern-message-box) {
  border-radius: 20px !important;
  overflow: hidden;
}

:deep(.modern-message-box .el-message-box__header) {
  background: linear-gradient(to right, #eff6ff, #faf5ff);
  padding: 20px;
}

:deep(.modern-message-box .el-message-box__title) {
  font-weight: 700;
  font-size: 18px;
}

:deep(.modern-message-box .el-message-box__btns button) {
  border-radius: 12px;
  padding: 10px 24px;
  font-weight: 600;
  transition: all 0.3s;
}

:deep(.modern-message-box .el-button--primary) {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  border: none;
}

:deep(.modern-message-box .el-button--primary:hover) {
  background: linear-gradient(to right, #2563eb, #7c3aed);
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}
</style>