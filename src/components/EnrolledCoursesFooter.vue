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
    <nav
        v-if="courseStore.selectedCount > 0"
        class="selected-courses-footer"
        role="navigation"
        aria-label="선택된 강의 관리"
    >
      <!-- 모바일 뷰 -->
      <div class="footer-container mobile-view">
        <div class="footer-content">
          <!-- 헤더 섹션 -->
          <div class="footer-header">
            <div class="selected-info">
              <div class="icon-wrapper">
                <ShoppingCart class="icon" aria-hidden="true" />
              </div>
              <div class="text-info">
                <h2 class="label" id="selected-courses-label">선택한 강의</h2>
                <span class="count" aria-describedby="selected-courses-label">
                  <span class="sr-only">총 </span>{{ courseStore.selectedCount }}개
                </span>
              </div>
            </div>
            <button
                @click="toggleExpanded"
                class="toggle-button"
                :aria-label="isExpanded ? '선택한 강의 목록 닫기' : '선택한 강의 목록 열기'"
                :aria-expanded="isExpanded"
                aria-controls="selected-courses-list"
            >
              <ChevronUp
                  :class="['toggle-icon', { 'rotate-180': !isExpanded }]"
                  aria-hidden="true"
              />
            </button>
          </div>

          <!-- 확장된 내용 -->
          <transition name="expand">
            <section
                v-if="isExpanded"
                class="expanded-content"
                id="selected-courses-list"
                role="region"
                aria-label="선택된 강의 목록"
            >
              <!-- 선택된 강의 목록 -->
              <div class="course-list">
                <transition-group name="list">
                  <article
                      v-for="course in selectedCourses"
                      :key="course.id"
                      class="course-item"
                      role="article"
                      :aria-label="`선택된 강의: ${course.title}`"
                  >
                    <div class="course-info">
                      <h3 class="course-title">{{ course.title }}</h3>
                      <div class="course-meta">
                        <span class="meta-item">
                          <Clock class="meta-icon" aria-hidden="true" />
                          <span class="sr-only">소요시간: </span>{{ course.duration || '30분' }}
                        </span>
                        <span class="meta-separator" aria-hidden="true">•</span>
                        <span class="meta-item">
                          <BarChart class="meta-icon" aria-hidden="true" />
                          <span class="sr-only">난이도: </span>{{ getDifficultyText(course.difficulty) }}
                        </span>
                      </div>
                    </div>
                    <button
                        @click="removeFromSelected(course.id)"
                        class="remove-button"
                        :aria-label="`${course.title} 선택 취소`"
                    >
                      <Trash2 class="remove-icon" aria-hidden="true" />
                    </button>
                  </article>
                </transition-group>
              </div>

              <!-- 전체 취소 버튼 -->
              <button
                  @click="clearAll"
                  class="clear-all-button"
                  aria-label="선택한 모든 강의 취소"
              >
                전체 취소
              </button>
            </section>
          </transition>

          <!-- 액션 버튼들 -->
          <div class="action-buttons">
            <button
                @click="showDetailModal = true"
                class="action-button secondary"
                aria-label="선택한 강의 상세 보기"
            >
              <Eye class="button-icon" aria-hidden="true" />
              <span>상세보기</span>
            </button>
            <button
                @click="proceedToEnroll"
                :disabled="isProcessing"
                class="action-button primary"
                :aria-label="isProcessing ? '수강 신청 처리 중' : '선택한 강의 수강 신청하기'"
                :aria-busy="isProcessing"
            >
              <Loader2 v-if="isProcessing" class="button-icon animate-spin" aria-hidden="true" />
              <ShoppingBag v-else class="button-icon" aria-hidden="true" />
              <span>{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
            </button>
          </div>

          <!-- 프로그레스 바 (처리 중일 때) -->
          <div v-if="isProcessing" class="progress-wrapper" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="수강 신청 처리 진행률">
            <div class="progress-bar">
              <div class="progress-fill animate-progress"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 데스크톱 뷰 -->
      <div class="footer-container desktop-view">
        <div class="desktop-content">
          <div class="desktop-left">
            <!-- 선택된 강의 정보 -->
            <div class="selected-info">
              <div class="icon-wrapper large">
                <ShoppingCart class="icon" aria-hidden="true" />
              </div>
              <div class="text-info">
                <h2 class="label" id="desktop-selected-courses-label">선택한 강의</h2>
                <span class="count large" aria-describedby="desktop-selected-courses-label">
                  <span class="sr-only">총 </span>{{ courseStore.selectedCount }}개
                </span>
              </div>
            </div>

            <!-- 선택된 강의 미리보기 -->
            <div class="preview-section">
              <div class="preview-list" role="list" aria-label="선택된 강의 미리보기">
                <transition-group name="avatar">
                  <div
                      v-for="(course, index) in selectedCoursesPreview"
                      :key="course.id"
                      :title="course.title"
                      :style="{ zIndex: 3 - index }"
                      class="preview-item"
                      role="listitem"
                      :aria-label="`선택된 강의: ${course.title}`"
                      tabindex="0"
                  >
                    {{ course.title.charAt(0) }}
                  </div>
                </transition-group>
                <div
                    v-if="courseStore.selectedCount > 3"
                    class="preview-item more"
                    role="listitem"
                    :aria-label="`그 외 ${courseStore.selectedCount - 3}개 강의`"
                >
                  +{{ courseStore.selectedCount - 3 }}
                </div>
              </div>
              <button
                  @click="showDetailModal = true"
                  class="view-all-button"
                  aria-label="선택한 강의 전체 목록 보기"
              >
                <Eye class="view-all-icon" aria-hidden="true" />
                전체보기
              </button>
            </div>
          </div>

          <!-- 우측: 액션 버튼들 -->
          <div class="desktop-actions">
            <button
                @click="clearAll"
                class="action-button outline"
                aria-label="선택한 모든 강의 취소"
            >
              전체 취소
            </button>
            <button
                @click="proceedToEnroll"
                :disabled="isProcessing"
                class="action-button primary large"
                :aria-label="isProcessing ? '수강 신청 처리 중' : '선택한 강의 수강 신청하기'"
                :aria-busy="isProcessing"
            >
              <Loader2 v-if="isProcessing" class="button-icon animate-spin" aria-hidden="true" />
              <ShoppingBag v-else class="button-icon" aria-hidden="true" />
              <span>{{ isProcessing ? '처리 중...' : '수강 신청하기' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 상세보기 모달 -->
      <Teleport to="body">
        <transition name="modal">
          <div
              v-if="showDetailModal"
              @click="showDetailModal = false"
              class="modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
          >
            <div
                @click.stop
                class="modal-content"
                role="document"
            >
              <!-- 모달 헤더 -->
              <header class="modal-header">
                <div class="modal-title-wrapper">
                  <div class="icon-wrapper modal">
                    <ShoppingCart class="icon" aria-hidden="true" />
                  </div>
                  <h3 class="modal-title" id="modal-title">
                    선택한 강의 목록
                  </h3>
                </div>
                <button
                    @click="showDetailModal = false"
                    class="modal-close-button"
                    aria-label="모달 닫기"
                >
                  <X class="close-icon" aria-hidden="true" />
                </button>
              </header>

              <!-- 모달 본문 -->
              <div class="modal-body" role="list" aria-label="선택된 강의 상세 목록">
                <div class="modal-course-list">
                  <transition-group name="list">
                    <article
                        v-for="course in selectedCourses"
                        :key="course.id"
                        class="modal-course-item"
                        role="listitem"
                    >
                      <div class="modal-course-content">
                        <div class="course-avatar">
                          {{ course.title.charAt(0) }}
                        </div>
                        <div class="modal-course-info">
                          <h4 class="modal-course-title">{{ course.title }}</h4>
                          <div class="modal-course-meta">
                            <span class="category-badge">
                              {{ getCategoryDisplayPath(course) }}
                            </span>
                            <div class="meta-details">
                              <span class="meta-item">
                                <Clock class="meta-icon" aria-hidden="true" />
                                <span class="sr-only">소요시간: </span>{{ course.duration || '30분' }}
                              </span>
                              <span class="meta-separator" aria-hidden="true">•</span>
                              <span class="difficulty-badge">
                                <BarChart class="meta-icon" aria-hidden="true" />
                                <span class="sr-only">난이도: </span>{{ getDifficultyText(course.difficulty) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                          @click="removeFromSelected(course.id)"
                          class="modal-remove-button"
                          :aria-label="`${course.title} 선택 취소`"
                      >
                        <Trash2 class="remove-icon" aria-hidden="true" />
                      </button>
                    </article>
                  </transition-group>
                </div>
              </div>

              <!-- 모달 푸터 -->
              <footer class="modal-footer">
                <div class="modal-footer-info">
                  <div class="footer-dot"></div>
                  <span class="footer-text">
                    총 {{ courseStore.selectedCount }}개 강의가 선택되었습니다
                  </span>
                </div>
                <button
                    @click="showDetailModal = false"
                    class="modal-footer-button"
                    aria-label="모달 닫기"
                >
                  닫기
                </button>
              </footer>
            </div>
          </div>
        </transition>
      </Teleport>
    </nav>
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
  ElMessage.info('강의 선택이 취소되었습니다.')
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
/* =================== 기본 스타일 =================== */
.selected-courses-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-fixed);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
}

/* 모바일/데스크톱 뷰 토글 */
.mobile-view {
  display: block;
}

.desktop-view {
  display: none;
}

@media (min-width: 1024px) {
  .mobile-view {
    display: none;
  }

  .desktop-view {
    display: block;
  }
}

/* =================== 모바일 뷰 =================== */
.footer-container {
  padding: var(--space-5);
}

.footer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

/* 선택 정보 */
.selected-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  position: relative;
}

.icon-wrapper::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  border-radius: var(--radius-lg);
  opacity: 0.3;
  filter: blur(8px);
}

.icon-wrapper.large {
  width: 56px;
  height: 56px;
}

.icon-wrapper.modal {
  width: 40px;
  height: 40px;
}

.icon {
  width: 24px;
  height: 24px;
  color: white;
  position: relative;
  z-index: 1;
}

.text-info {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  font-weight: var(--font-medium);
}

.count {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.count.large {
  font-size: var(--text-2xl);
}

/* 토글 버튼 */
.toggle-button {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-button:hover {
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
}

.toggle-button:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

.toggle-icon {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  transition: all var(--transition-base);
}

.rotate-180 {
  transform: rotate(180deg);
}

/* 확장된 컨텐츠 */
.expanded-content {
  margin-bottom: var(--space-4);
}

.course-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.course-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all var(--transition-fast);
}

.course-item:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-primary);
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.meta-icon {
  width: 14px;
  height: 14px;
  color: var(--text-tertiary);
}

.meta-separator {
  color: var(--text-tertiary);
}

.remove-button {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-left: var(--space-3);
}

.remove-button:hover {
  background: var(--color-error-light);
  border-color: var(--color-error);
}

.remove-button:focus-visible {
  outline: 3px solid var(--color-error);
  outline-offset: 2px;
}

.remove-icon {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  transition: color var(--transition-fast);
}

.remove-button:hover .remove-icon {
  color: var(--color-error);
}

/* 전체 취소 버튼 */
.clear-all-button {
  width: 100%;
  padding: var(--space-3);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-error);
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-all-button:hover {
  background: var(--color-error-light);
}

.clear-all-button:focus-visible {
  outline: 3px solid var(--color-error);
  outline-offset: 2px;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: var(--space-3);
}

.action-button {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

.action-button.primary {
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-button.secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.action-button.secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--accent-primary);
}

.action-button.outline {
  background: none;
  color: var(--color-error);
  border-color: var(--color-error);
}

.action-button.outline:hover:not(:disabled) {
  background: var(--color-error-light);
}

.action-button.large {
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-lg);
}

.button-icon {
  width: 20px;
  height: 20px;
}

/* 프로그레스 바 */
.progress-wrapper {
  margin-top: var(--space-3);
}

.progress-bar {
  height: 4px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary) 0%, #764ba2 100%);
  border-radius: var(--radius-full);
}

/* =================== 데스크톱 뷰 =================== */
.desktop-content {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.desktop-left {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.preview-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.preview-list {
  display: flex;
}

.preview-item {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  box-shadow: var(--shadow-sm);
  border: 3px solid white;
  margin-left: -12px;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.preview-item:first-child {
  margin-left: 0;
}

.preview-item:hover {
  transform: scale(1.1);
  z-index: 10 !important;
}

.preview-item:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

.preview-item.more {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.view-all-button {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--accent-primary);
  background: none;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-all-button:hover {
  background: var(--bg-tertiary);
}

.view-all-button:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

.view-all-icon {
  width: 16px;
  height: 16px;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* =================== 모달 =================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 640px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary);
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.modal-close-button {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close-button:hover {
  background: var(--bg-secondary);
}

.modal-close-button:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

.close-icon {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.modal-close-button:hover .close-icon {
  color: var(--text-primary);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

.modal-course-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.modal-course-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all var(--transition-fast);
}

.modal-course-item:hover {
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  border-color: var(--accent-primary);
}

.modal-course-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  flex: 1;
}

.course-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.modal-course-info {
  flex: 1;
  min-width: 0;
}

.modal-course-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.modal-course-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.category-badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-primary-700);
  background: var(--color-primary-100);
  border-radius: var(--radius-base);
  align-self: flex-start;
}

.meta-details {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.difficulty-badge {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-info-700);
  background: var(--color-info-100);
  border-radius: var(--radius-base);
}

.modal-remove-button {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.modal-remove-button:hover {
  background: var(--color-error-light);
  border-color: var(--color-error);
  box-shadow: var(--shadow-sm);
}

.modal-remove-button:hover .remove-icon {
  color: var(--color-error);
  transform: scale(1.1);
}

.modal-remove-button:focus-visible {
  outline: 3px solid var(--color-error);
  outline-offset: 2px;
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary);
}

.modal-footer-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.footer-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
}

.footer-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.modal-footer-button {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.modal-footer-button:hover {
  background: var(--bg-primary);
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-md);
}

.modal-footer-button:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

/* =================== 애니메이션 =================== */
/* 확장 애니메이션 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 리스트 애니메이션 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}

/* 아바타 애니메이션 */
.avatar-enter-active,
.avatar-leave-active {
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

/* 모달 애니메이션 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* 프로그레스 애니메이션 */
@keyframes progress {
  0% { width: 0%; }
  100% { width: 100%; }
}

.animate-progress {
  animation: progress 1.5s ease-in-out infinite;
}

/* 스핀 애니메이션 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* =================== 스크린 리더 전용 =================== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* =================== 반응형 디자인 =================== */
@media (max-width: 640px) {
  .footer-container {
    padding: var(--space-4);
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  .count {
    font-size: var(--text-lg);
  }

  .action-button {
    padding: var(--space-3);
    font-size: var(--text-sm);
  }

  .button-icon {
    width: 18px;
    height: 18px;
  }

  .modal-content {
    max-height: 90vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--space-4);
  }
}

/* =================== 접근성 개선 =================== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 고대비 모드 */
@media (prefers-contrast: high) {
  .action-button.primary {
    background: var(--accent-primary);
  }

  .icon-wrapper {
    background: var(--accent-primary);
  }

  .preview-item {
    background: var(--accent-primary);
  }
}
</style>