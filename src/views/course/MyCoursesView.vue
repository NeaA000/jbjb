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

        <!-- 강의 목록 -->
        <div v-else>
          <!-- 진행 중인 강의 -->
          <div v-if="activeTab === 'in-progress'" class="course-section">
            <div v-if="inProgressCourses.length === 0" class="empty-state">
              <BookOpen class="empty-icon" />
              <h2 class="empty-title">진행 중인 강의가 없습니다</h2>
              <p class="empty-description">새로운 강의를 시작해보세요!</p>
              <button
                  @click="router.push('/courses')"
                  class="btn btn-primary"
              >
                <Plus :size="20" />
                강의 둘러보기
              </button>
            </div>

            <div v-else class="course-grid">
              <div
                  v-for="enrollment in inProgressCourses"
                  :key="enrollment.id"
                  class="course-card"
              >
                <div class="course-card-content">
                  <div class="course-card-header">
                    <!-- 썸네일 -->
                    <div class="course-thumbnail">
                      <img
                          v-if="enrollment.course?.thumbnail"
                          :src="enrollment.course.thumbnail"
                          :alt="enrollment.course.title"
                          class="thumbnail-image"
                      />
                      <div v-else class="thumbnail-placeholder">
                        <PlayCircle :size="32" />
                      </div>
                    </div>

                    <!-- 강의 정보 -->
                    <div class="course-info">
                      <h3 class="course-title">
                        {{ enrollment.course?.title }}
                      </h3>

                      <!-- 카테고리 -->
                      <div class="course-category">
                        <span
                            :class="getCategoryStyle(enrollment.course?.category?.leaf || '기타')"
                            class="category-badge"
                        >
                          {{ getCategoryDisplayPath(enrollment.course) }}
                        </span>
                      </div>

                      <!-- 진도율 -->
                      <div class="progress-section">
                        <div class="progress-header">
                          <span class="progress-label">진도율</span>
                          <span class="progress-value">{{ enrollment.progress }}%</span>
                        </div>
                        <div class="progress-bar">
                          <div
                              :style="{ width: `${enrollment.progress}%` }"
                              class="progress-fill"
                          ></div>
                        </div>
                      </div>

                      <!-- 메타 정보 -->
                      <div class="course-meta">
                        <span class="meta-item">
                          <Clock :size="14" />
                          {{ getRemainingTime(enrollment) }}
                        </span>
                        <span class="meta-item">
                          <Calendar :size="14" />
                          {{ formatDate(enrollment.enrolledAt) }} 시작
                        </span>
                      </div>
                    </div>

                    <!-- 액션 버튼 -->
                    <div class="course-actions">
                      <button
                          @click="continueLearning(enrollment.courseId)"
                          class="btn btn-primary"
                      >
                        <Play :size="18" />
                        이어보기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 완료한 강의 -->
          <div v-else-if="activeTab === 'completed'" class="course-section">
            <div v-if="completedCourses.length === 0" class="empty-state">
              <Award class="empty-icon" />
              <h2 class="empty-title">완료한 강의가 없습니다</h2>
              <p class="empty-description">강의를 완료하면 수료증을 받을 수 있습니다!</p>
            </div>

            <div v-else class="course-grid">
              <div
                  v-for="enrollment in completedCourses"
                  :key="enrollment.id"
                  class="course-card course-card-completed"
              >
                <div class="course-card-content">
                  <div class="course-card-header">
                    <!-- 썸네일 -->
                    <div class="course-thumbnail">
                      <img
                          v-if="enrollment.course?.thumbnail"
                          :src="enrollment.course.thumbnail"
                          :alt="enrollment.course.title"
                          class="thumbnail-image"
                      />
                      <div v-else class="thumbnail-placeholder">
                        <PlayCircle :size="32" />
                      </div>
                      <!-- 완료 뱃지 -->
                      <div class="completion-badge">
                        <CheckCircle :size="24" />
                      </div>
                    </div>

                    <!-- 강의 정보 -->
                    <div class="course-info">
                      <h3 class="course-title">
                        {{ enrollment.course?.title }}
                      </h3>

                      <!-- 카테고리 -->
                      <div class="course-category">
                        <span
                            :class="getCategoryStyle(enrollment.course?.category?.leaf || '기타')"
                            class="category-badge"
                        >
                          {{ getCategoryDisplayPath(enrollment.course) }}
                        </span>
                      </div>

                      <!-- 완료 정보 -->
                      <div class="completion-info">
                        <CheckCircle :size="16" />
                        {{ formatDate(enrollment.completedAt) }} 수료
                      </div>

                      <!-- 메타 정보 -->
                      <div class="course-meta">
                        <span class="meta-item">
                          <Clock :size="14" />
                          {{ enrollment.course?.duration || '30분' }}
                        </span>
                        <span v-if="enrollment.course?.rating" class="meta-item">
                          <Star :size="14" class="star-icon" />
                          {{ enrollment.course.rating.toFixed(1) }}
                        </span>
                      </div>
                    </div>

                    <!-- 액션 버튼 -->
                    <div class="course-actions-vertical">
                      <button
                          @click="viewCertificate(enrollment.courseId)"
                          class="btn btn-success"
                      >
                        <Award :size="18" />
                        수료증 보기
                      </button>
                      <button
                          @click="reviewCourse(enrollment.courseId)"
                          class="btn btn-secondary"
                      >
                        <RefreshCw :size="18" />
                        다시 보기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 전체 강의 -->
          <div v-else class="course-section">
            <div v-if="allEnrollments.length === 0" class="empty-state">
              <BookOpen class="empty-icon" />
              <h2 class="empty-title">신청한 강의가 없습니다</h2>
              <p class="empty-description">관심있는 강의를 신청해보세요!</p>
              <button
                  @click="router.push('/courses')"
                  class="btn btn-primary"
              >
                <Plus :size="20" />
                강의 둘러보기
              </button>
            </div>

            <div v-else class="course-grid">
              <div
                  v-for="enrollment in allEnrollments"
                  :key="enrollment.id"
                  :class="[
                    'course-card',
                    enrollment.status === 'completed' || enrollment.progress === 100 ? 'course-card-completed' : ''
                  ]"
              >
                <!-- 진행중/완료 강의와 동일한 구조 사용 -->
                <div class="course-card-content">
                  <div class="course-card-header">
                    <!-- 썸네일 -->
                    <div class="course-thumbnail">
                      <img
                          v-if="enrollment.course?.thumbnail"
                          :src="enrollment.course.thumbnail"
                          :alt="enrollment.course.title"
                          class="thumbnail-image"
                      />
                      <div v-else class="thumbnail-placeholder">
                        <PlayCircle :size="32" />
                      </div>
                      <!-- 완료 뱃지 (완료된 경우만) -->
                      <div v-if="enrollment.status === 'completed' || enrollment.progress === 100" class="completion-badge">
                        <CheckCircle :size="24" />
                      </div>
                    </div>

                    <!-- 강의 정보 -->
                    <div class="course-info">
                      <h3 class="course-title">
                        {{ enrollment.course?.title }}
                      </h3>

                      <!-- 카테고리 -->
                      <div class="course-category">
                        <span
                            :class="getCategoryStyle(enrollment.course?.category?.leaf || '기타')"
                            class="category-badge"
                        >
                          {{ getCategoryDisplayPath(enrollment.course) }}
                        </span>
                      </div>

                      <!-- 진도율 또는 완료 정보 -->
                      <div v-if="enrollment.status === 'completed' || enrollment.progress === 100" class="completion-info">
                        <CheckCircle :size="16" />
                        {{ formatDate(enrollment.completedAt) }} 수료
                      </div>
                      <div v-else class="progress-section">
                        <div class="progress-header">
                          <span class="progress-label">진도율</span>
                          <span class="progress-value">{{ enrollment.progress }}%</span>
                        </div>
                        <div class="progress-bar">
                          <div
                              :style="{ width: `${enrollment.progress}%` }"
                              class="progress-fill"
                          ></div>
                        </div>
                      </div>

                      <!-- 메타 정보 -->
                      <div class="course-meta">
                        <span class="meta-item">
                          <Clock :size="14" />
                          {{ enrollment.status === 'completed' ? enrollment.course?.duration || '30분' : getRemainingTime(enrollment) }}
                        </span>
                        <span class="meta-item">
                          <Calendar :size="14" />
                          {{ formatDate(enrollment.enrolledAt) }} 시작
                        </span>
                      </div>
                    </div>

                    <!-- 액션 버튼 -->
                    <div class="course-actions">
                      <button
                          v-if="enrollment.status !== 'completed' && enrollment.progress < 100"
                          @click="continueLearning(enrollment.courseId)"
                          class="btn btn-primary"
                      >
                        <Play :size="18" />
                        이어보기
                      </button>
                      <div v-else class="course-actions-vertical">
                        <button
                            @click="viewCertificate(enrollment.courseId)"
                            class="btn btn-success"
                        >
                          <Award :size="18" />
                          수료증 보기
                        </button>
                        <button
                            @click="reviewCourse(enrollment.courseId)"
                            class="btn btn-secondary"
                        >
                          <RefreshCw :size="18" />
                          다시 보기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

// 캐시 관련 상수
const CACHE_DURATION = 5 * 60 * 1000 // 5분
const lastFetchTime = ref(null)

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

// 캐시가 유효한지 확인
const isCacheValid = () => {
  if (!lastFetchTime.value) return false
  const now = Date.now()
  return (now - lastFetchTime.value) < CACHE_DURATION
}

// 최적화된 데이터 로드
const loadMyCoursesOptimized = async () => {
  try {
    isLoading.value = true

    // 캐시가 유효하고 데이터가 있으면 로딩 스킵
    if (isCacheValid() && courseStore.enrollments.length > 0) {
      console.log('Using cached data')
      return
    }

    // Store에 최적화된 메서드가 있다면 사용
    if (typeof courseStore.loadMyCoursesOptimized === 'function') {
      await courseStore.loadMyCoursesOptimized()
    } else {
      // 병렬 처리로 데이터 로드
      const promises = []

      // enrollment 데이터는 항상 필요
      promises.push(courseStore.loadUserEnrollments())

      // course 데이터가 없을 때만 로드
      if (courseStore.courses.length === 0) {
        promises.push(courseStore.loadCoursesFromFlask())
      }

      // 모든 Promise를 병렬로 실행
      const results = await Promise.allSettled(promises)

      // 에러 처리
      const errors = results.filter(result => result.status === 'rejected')
      if (errors.length > 0) {
        console.error('Some data failed to load:', errors)
        // 부분적 실패는 허용하고 계속 진행
      }
    }

    // 캐시 시간 업데이트
    lastFetchTime.value = Date.now()

  } catch (error) {
    console.error('Failed to load courses:', error)
    ElMessage.error('강의 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 새로고침 (캐시 무시)
const refreshCourses = async () => {
  try {
    isLoading.value = true

    // 캐시 무효화
    lastFetchTime.value = null

    // 강제 새로고침
    await courseStore.loadUserEnrollments()

    // 캐시 시간 업데이트
    lastFetchTime.value = Date.now()

    ElMessage.success('강의 목록을 새로고침했습니다.')
  } catch (error) {
    ElMessage.error('새로고침에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 마운트
onMounted(async () => {
  await loadMyCoursesOptimized()
})
</script>

<style scoped>
/* =================== 페이지 구조 =================== */
.page-wrapper {
  min-height: 100vh;
  background: var(--bg-primary, #f8fafc);
  display: flex;
  flex-direction: column;
}

/* =================== 헤더 =================== */
.page-header {
  background: var(--bg-secondary, #ffffff);
  border-bottom: 1px solid var(--border-primary, #e5e7eb);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  position: sticky;
  top: 0;
  z-index: 30;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button,
.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-lg, 0.5rem);
  border: none;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
}

.back-button:hover,
.refresh-button:hover {
  background: var(--bg-tertiary, #f3f4f6);
  color: var(--text-primary, #111827);
}

.page-title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
  margin: 0;
}

/* =================== 탭 네비게이션 =================== */
.tab-navigation {
  background: var(--bg-secondary, #ffffff);
  border-bottom: 1px solid var(--border-primary, #e5e7eb);
  position: sticky;
  top: 4rem;
  z-index: 20;
}

.tab-list {
  display: flex;
  gap: 2rem;
}

.tab-button {
  padding: 1rem 0.25rem;
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  font-weight: var(--font-medium, 500);
  color: var(--text-primary, #111827);
  margin: 0 0 0.5rem;
}

.empty-description {
  color: var(--text-secondary, #6b7280);
  margin: 0 0 1.5rem;
}

/* =================== 강의 그리드 =================== */
.course-section {
  width: 100%;
}

.course-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* =================== 강의 카드 =================== */
.course-card {
  background: var(--bg-secondary, #ffffff);
  border-radius: var(--radius-2xl, 1rem);
  box-shadow: var(--shadow-base, 0 1px 3px 0 rgba(0, 0, 0, 0.1));
  overflow: hidden;
  transition: all var(--transition-base, 0.3s ease);
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
}

.course-card-completed {
  border: 2px solid var(--color-success-light, #d1fae5);
}

.course-card-content {
  padding: 1.5rem;
}

.course-card-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

/* =================== 썸네일 =================== */
.course-thumbnail {
  flex-shrink: 0;
  width: 12rem;
  height: 6.75rem;
  background: var(--bg-tertiary, #f3f4f6);
  border-radius: var(--radius-lg, 0.5rem);
  overflow: hidden;
  position: relative;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #9ca3af);
}

.completion-badge {
  position: absolute;
  inset: 0;
  background: rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.completion-badge svg {
  background: white;
  border-radius: var(--radius-full, 9999px);
  padding: 0.5rem;
  color: var(--color-success, #10b981);
  width: 2.5rem;
  height: 2.5rem;
}

/* =================== 강의 정보 =================== */
.course-info {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
  margin: 0 0 0.5rem;
  line-height: 1.25;
}

.course-category {
  margin-bottom: 0.5rem;
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
}

.course-actions-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  background: var(--accent-hover, #2563eb);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.btn-success {
  background: var(--color-success, #10b981);
  color: white;
}

.btn-success:hover {
  background: var(--color-success-dark, #059669);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.btn-secondary {
  background: var(--bg-tertiary, #f3f4f6);
  color: var(--text-primary, #374151);
}

.btn-secondary:hover {
  background: var(--bg-quaternary, #e5e7eb);
  transform: translateY(-1px);
}

/* =================== 반응형 디자인 =================== */
@media (max-width: 768px) {
  .page-title {
    font-size: var(--text-lg, 1.125rem);
  }

  .tab-list {
    gap: 1.5rem;
  }

  .course-card-header {
    flex-direction: column;
  }

  .course-thumbnail {
    width: 100%;
    height: 9rem;
  }

  .course-actions {
    width: 100%;
    margin-top: 1rem;
  }

  .course-actions-vertical {
    flex-direction: row;
    width: 100%;
  }

  .course-actions-vertical .btn {
    flex: 1;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 0.75rem;
  }

  .tab-list {
    gap: 1rem;
  }

  .tab-button {
    font-size: var(--text-xs, 0.75rem);
  }

  .course-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}

/* =================== 접근성 =================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .course-card:hover {
    transform: none;
  }
}

/* =================== 포커스 스타일 =================== */
button:focus-visible,
.btn:focus-visible {
  outline: 2px solid var(--accent-primary, #3b82f6);
  outline-offset: 2px;
}

.course-card:focus-within {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>