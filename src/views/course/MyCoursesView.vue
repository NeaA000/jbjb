<!-- web/src/views/course/MyCoursesView.vue -->
<template>
  <div class="page-wrapper">
    <!-- 헤더 -->
    <header class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <button
                @click="router.back()"
                class="back-button"
            >
              <ArrowLeft :size="20" />
            </button>
            <h1 class="page-title">내 강의실</h1>
          </div>
          <button
              @click="refreshCourses"
              :disabled="isLoading"
              class="refresh-button"
          >
            <RefreshCw :size="20" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
      </div>
    </header>

    <!-- 탭 메뉴 -->
    <nav class="tab-navigation">
      <div class="container">
        <div class="tab-list">
          <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'tab-button',
                activeTab === tab.id ? 'tab-button-active' : 'tab-button-inactive'
              ]"
          >
            {{ tab.label }}
            <span
                v-if="getTabCount(tab.id) > 0"
                :class="[
                  'tab-count',
                  activeTab === tab.id ? 'tab-count-active' : 'tab-count-inactive'
                ]"
            >
              {{ getTabCount(tab.id) }}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 메인 콘텐츠 -->
    <main class="page-content">
      <div class="container">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-content">
            <Loader2 class="loading-icon" />
            <span class="loading-text">강의를 불러오는 중...</span>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="currentCourses.length === 0" class="empty-state">
          <BookOpen class="empty-icon" />
          <h2 class="empty-title">
            {{ activeTab === 'in-progress' ? '진행 중인 강의가 없습니다' :
              activeTab === 'completed' ? '완료한 강의가 없습니다' :
                  '수강 중인 강의가 없습니다' }}
          </h2>
          <p class="empty-description">
            강의를 수강 신청하면 여기에 표시됩니다
          </p>
          <button
              @click="router.push('/courses')"
              class="btn-primary"
          >
            <Plus :size="16" />
            강의 둘러보기
          </button>
        </div>

        <!-- 강의 목록 -->
        <div v-else class="course-grid">
          <article
              v-for="enrollment in currentCourses"
              :key="enrollment.id"
              class="course-card"
          >
            <!-- 강의 카드 내용 -->
            <div class="course-header">
              <h3 class="course-title">{{ enrollment.course?.title || '제목 없음' }}</h3>
              <div class="course-category">
                <span class="category-path">{{ getCategoryDisplayPath(enrollment.course) }}</span>
                <span
                    v-if="enrollment.course?.category?.leaf"
                    class="category-badge"
                    :style="getCategoryStyle(enrollment.course.category.leaf)"
                >
                  {{ enrollment.course.category.leaf }}
                </span>
              </div>
            </div>

            <div class="course-body">
              <!-- 진도 정보 -->
              <div v-if="enrollment.progress !== undefined" class="progress-section">
                <div class="progress-header">
                  <span>진도율</span>
                  <span class="progress-value">{{ enrollment.progress }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="`width: ${enrollment.progress}%`"></div>
                </div>
              </div>

              <!-- 완료 정보 -->
              <div v-if="enrollment.status === 'completed'" class="completion-info">
                <CheckCircle :size="16" />
                <span>{{ formatDate(enrollment.completedAt) }} 완료</span>
              </div>

              <!-- 메타 정보 -->
              <div class="course-meta">
                <div class="meta-item">
                  <Clock :size="14" />
                  <span>{{ getRemainingTime(enrollment) }}</span>
                </div>
                <div class="meta-item">
                  <Calendar :size="14" />
                  <span>{{ formatDate(enrollment.enrolledAt) }} 시작</span>
                </div>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="course-actions">
              <!-- 진행 중인 강의 -->
              <template v-if="enrollment.status !== 'completed'">
                <button
                    @click="continueLearning(enrollment.courseId)"
                    class="btn btn-primary"
                >
                  <PlayCircle :size="16" />
                  이어서 학습하기
                </button>
              </template>

              <!-- 완료한 강의 -->
              <template v-else>
                <button
                    @click="viewCertificate(enrollment.courseId)"
                    class="btn btn-success"
                >
                  <Award :size="16" />
                  수료증 보기
                </button>
                <button
                    @click="reviewCourse(enrollment.courseId)"
                    class="btn btn-secondary"
                >
                  <Play :size="16" />
                  다시 보기
                </button>
              </template>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import { CategoryService } from '@/services/categoryService'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  RefreshCw,
  BookOpen,
  Plus,
  PlayCircle,
  Play,
  Clock,
  Calendar,
  Award,
  CheckCircle,
  Star,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isLoading = ref(false)
const activeTab = ref('in-progress')

// 탭 설정
const tabs = [
  { id: 'in-progress', label: '진행 중' },
  { id: 'completed', label: '완료' },
  { id: 'all', label: '전체' }
]

// 진행 중인 강의
const inProgressCourses = computed(() => {
  return courseStore.enrollments.filter(enrollment =>
      enrollment.status === 'enrolled' && enrollment.progress < 100
  )
})

// 완료한 강의
const completedCourses = computed(() => {
  return courseStore.enrollments.filter(enrollment =>
      enrollment.status === 'completed' || enrollment.progress === 100
  )
})

// 전체 강의
const allEnrollments = computed(() => {
  return courseStore.enrollments
})

// 현재 탭의 강의들
const currentCourses = computed(() => {
  switch (activeTab.value) {
    case 'in-progress':
      return inProgressCourses.value
    case 'completed':
      return completedCourses.value
    case 'all':
      return allEnrollments.value
    default:
      return []
  }
})

// 탭별 강의 수
const getTabCount = (tabId) => {
  switch (tabId) {
    case 'in-progress':
      return inProgressCourses.value.length
    case 'completed':
      return completedCourses.value.length
    case 'all':
      return allEnrollments.value.length
    default:
      return 0
  }
}

// 카테고리 경로 표시
const getCategoryDisplayPath = (course) => {
  if (!course?.category) return '기타'

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

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 남은 시간 계산
const getRemainingTime = (enrollment) => {
  if (!enrollment.course?.duration) return '30분 남음'

  const totalMinutes = parseInt(enrollment.course.duration.replace(/[^0-9]/g, '')) || 30
  const completedMinutes = Math.floor(totalMinutes * enrollment.progress / 100)
  const remainingMinutes = totalMinutes - completedMinutes

  if (remainingMinutes <= 0) return '완료'
  if (remainingMinutes < 60) return `${remainingMinutes}분 남음`

  const hours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60
  return `${hours}시간 ${minutes}분 남음`
}

// 학습 이어하기
const continueLearning = (courseId) => {
  if (authStore.isGuest) {
    router.push(`/learning/${courseId}`)
  } else {
    router.push(`/video-warning/${courseId}`)
  }
}

// 수료증 보기
const viewCertificate = (courseId) => {
  router.push(`/certificates?courseId=${courseId}`)
}

// 다시 보기
const reviewCourse = (courseId) => {
  router.push(`/learning/${courseId}`)
}

// 새로고침
const refreshCourses = async () => {
  try {
    isLoading.value = true
    await courseStore.loadUserEnrollments()
    ElMessage.success('강의 목록을 새로고침했습니다.')
  } catch (error) {
    ElMessage.error('새로고침에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 내 강의 로드 (수정됨 - loadCourses 대신 올바른 메서드 사용)
const loadMyCourses = async () => {
  try {
    isLoading.value = true

    // 최적화된 메서드가 있으면 사용, 없으면 기본 메서드 사용
    if (typeof courseStore.loadMyCoursesOptimized === 'function') {
      await courseStore.loadMyCoursesOptimized()
    } else {
      // 기본 메서드: enrollments만 로드
      await courseStore.loadUserEnrollments()
    }

    console.log('✅ 내 강의 로드 완료:', courseStore.enrollments.length)
  } catch (error) {
    console.error('내 강의 로드 오류:', error)
    ElMessage.error('강의 목록을 불러올 수 없습니다.')
  } finally {
    isLoading.value = false
  }
}

// 마운트 시 로드
onMounted(() => {
  loadMyCourses()
})
</script>

<style scoped>
/* =================== 기본 레이아웃 =================== */
.page-wrapper {
  min-height: 100vh;
  background: var(--bg-primary, #ffffff);
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

/* =================== 헤더 =================== */
.page-header {
  background: var(--bg-primary, #ffffff);
  border-bottom: 1px solid var(--border-primary, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button, .refresh-button {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  border-radius: var(--radius-md, 0.375rem);
  transition: all var(--transition-fast, 0.15s ease);
}

.back-button:hover, .refresh-button:hover {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* =================== 탭 네비게이션 =================== */
.tab-navigation {
  background: var(--bg-primary, #ffffff);
  border-bottom: 1px solid var(--border-primary, #e5e7eb);
  position: sticky;
  top: 3.5rem;
  z-index: 30;
}

.tab-list {
  display: flex;
  gap: 2rem;
  height: 3rem;
}

.tab-button {
  padding: 0 0.5rem;
  height: 100%;
  border: none;
  background: none;
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  position: relative;
  transition: color var(--transition-fast, 0.15s ease);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  transition: background var(--transition-fast, 0.15s ease);
}

.tab-button-active {
  color: var(--accent-primary, #3b82f6);
}

.tab-button-active::after {
  background: var(--accent-primary, #3b82f6);
}

.tab-button-inactive:hover {
  color: var(--text-primary, #374151);
}

.tab-button-inactive:hover::after {
  background: var(--border-secondary, #d1d5db);
}

.tab-count {
  padding: 0.125rem 0.5rem;
  font-size: var(--text-xs, 0.75rem);
  border-radius: var(--radius-full, 9999px);
  transition: all var(--transition-fast, 0.15s ease);
}

.tab-count-active {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-primary, #3b82f6);
}

.tab-count-inactive {
  background: var(--bg-tertiary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

/* =================== 메인 콘텐츠 =================== */
.page-content {
  flex: 1;
  padding: 2rem 0 4rem;
}

/* =================== 로딩 상태 =================== */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 16rem;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--accent-primary, #3b82f6);
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--text-secondary, #6b7280);
}

/* =================== 빈 상태 =================== */
.empty-state {
  text-align: center;
  padding: 4rem 0;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-tertiary, #d1d5db);
  margin: 0 auto 1rem;
}

.empty-title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
  margin-bottom: 0.5rem;
}

.empty-description {
  color: var(--text-secondary, #6b7280);
  margin-bottom: 2rem;
}

/* =================== 강의 그리드 =================== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* =================== 강의 카드 =================== */
.course-card {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-primary, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  padding: 1.5rem;
  transition: all var(--transition-base, 0.3s ease);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-card:hover {
  border-color: var(--border-secondary, #d1d5db);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

/* =================== 강의 헤더 =================== */
.course-header {
  margin-bottom: 0.5rem;
}

.course-title {
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.course-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-path {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
}

.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--font-medium, 500);
  border-radius: var(--radius-full, 9999px);
}

/* =================== 진도 정보 =================== */
.progress-section {
  margin-bottom: 0.75rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.25rem;
}

.progress-value {
  font-weight: var(--font-medium, 500);
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-tertiary, #e5e7eb);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary, #3b82f6);
  transition: width var(--transition-base, 0.3s ease);
}

/* =================== 완료 정보 =================== */
.completion-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-success, #10b981);
  font-weight: var(--font-medium, 500);
  margin-bottom: 0.75rem;
}

/* =================== 메타 정보 =================== */
.course-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.star-icon {
  color: var(--color-warning, #f59e0b);
  fill: currentColor;
}

/* =================== 액션 버튼 =================== */
.course-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
}

/* =================== 버튼 스타일 =================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  border: none;
  border-radius: var(--radius-lg, 0.5rem);
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
  white-space: nowrap;
}

.btn-primary {
  background: var(--accent-primary, #3b82f6);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-primary-dark, #2563eb);
}

.btn-secondary {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
}

.btn-secondary:hover {
  background: var(--bg-tertiary, #e5e7eb);
}

.btn-success {
  background: var(--color-success, #10b981);
  color: white;
}

.btn-success:hover {
  background: var(--color-success-dark, #059669);
}

/* =================== 반응형 =================== */
@media (max-width: 768px) {
  .course-grid {
    grid-template-columns: 1fr;
  }

  .tab-list {
    gap: 1rem;
  }

  .course-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
</style>