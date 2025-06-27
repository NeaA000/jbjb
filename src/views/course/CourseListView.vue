<template>
  <div class="course-list-container">
    <!-- 헤더 -->
    <header class="course-header">
      <div class="header-content">
        <button @click="$router.back()" class="back-button">
          <ChevronLeft :size="24" />
        </button>

        <h1 class="header-title">
          <BookOpen :size="24" />
          <span>전체 강의</span>
        </h1>

        <button @click="handleRefresh" class="refresh-button" :disabled="isLoading">
          <RefreshCw :size="20" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </header>

    <!-- 로딩 상태 (스켈레톤 UI) -->
    <div v-if="isInitialLoading" class="loading-container">
      <div class="skeleton-grid">
        <div v-for="i in 8" :key="i" class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <main v-else class="main-content">
      <!-- 필터 및 정렬 -->
      <div class="filter-section">
        <div class="filter-chips">
          <button
              v-for="category in filterCategories"
              :key="category.value"
              @click="selectedCategory = category.value"
              :class="['filter-chip', { active: selectedCategory === category.value }]"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="sort-dropdown">
          <select v-model="sortBy" class="sort-select">
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>

      <!-- 강의 목록 -->
      <div v-if="filteredCourses.length > 0" class="course-grid">
        <div
            v-for="course in displayedCourses"
            :key="course.id"
            class="course-card"
            @click="navigateToCourse(course.id)"
        >
          <!-- 이미지 lazy loading -->
          <div class="course-image">
            <img
                v-lazy="course.thumbnailUrl || '/placeholder-course.jpg'"
                :alt="course.title"
                class="course-thumbnail"
            />

            <!-- 수강 상태 배지 -->
            <div v-if="getEnrollmentStatus(course.id)" class="status-badge">
              <CheckCircle :size="16" />
              <span>{{ getStatusBadgeText(course.id) }}</span>
            </div>

            <!-- 진도율 표시 -->
            <div v-if="getProgress(course.id) > 0" class="progress-overlay">
              <div class="progress-bar">
                <div
                    class="progress-fill"
                    :style="{ width: `${getProgress(course.id)}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ getProgress(course.id) }}%</span>
            </div>
          </div>

          <div class="course-content">
            <!-- 카테고리 -->
            <div class="course-category">
              <Tag :size="14" />
              <span>{{ getCategoryDisplayPath(course) }}</span>
            </div>

            <!-- 제목 -->
            <h3 class="course-title">{{ course.title }}</h3>

            <!-- 강사 & 난이도 -->
            <div class="course-meta">
              <span class="instructor">
                <User :size="14" />
                {{ course.instructor }}
              </span>
              <span class="difficulty" :class="`difficulty-${course.difficulty}`">
                {{ getDifficultyText(course.difficulty) }}
              </span>
            </div>

            <!-- 수강생 수 & 평점 -->
            <div class="course-stats">
              <span class="stat-item">
                <Users :size="14" />
                {{ formatNumber(course.enrollmentCount || 0) }}명
              </span>
              <span v-if="course.rating" class="stat-item">
                <Star :size="14" />
                {{ course.rating.toFixed(1) }}
              </span>
            </div>

            <!-- 언어 옵션 -->
            <div v-if="course.availableLanguages?.length > 1" class="language-chips">
              <span
                  v-for="lang in course.availableLanguages.slice(0, 3)"
                  :key="lang"
                  class="language-chip"
              >
                {{ getLanguageLabel(lang) }}
              </span>
              <span v-if="course.availableLanguages.length > 3" class="language-more">
                +{{ course.availableLanguages.length - 3 }}
              </span>
            </div>
          </div>

          <!-- 선택 체크박스 -->
          <div class="course-select" @click.stop>
            <el-checkbox
                :model-value="courseStore.isSelected(course.id)"
                @change="handleSelectChange(course.id, $event)"
                size="large"
            />
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="empty-state">
        <BookOpen :size="64" class="empty-icon" />
        <h3>강의가 없습니다</h3>
        <p>선택한 카테고리에 해당하는 강의가 없습니다.</p>
      </div>

      <!-- 더 보기 버튼 (무한 스크롤 대체) -->
      <div v-if="hasMore && !isLoadingMore" class="load-more">
        <button @click="loadMore" class="load-more-button">
          더 많은 강의 보기
        </button>
      </div>

      <!-- 추가 로딩 -->
      <div v-if="isLoadingMore" class="loading-more">
        <div class="spinner"></div>
        <span>강의를 불러오는 중...</span>
      </div>
    </main>

    <!-- 플로팅 액션 버튼 -->
    <Transition name="fab">
      <div v-if="selectedCount > 0" class="floating-action">
        <div class="selection-info">
          <span>{{ selectedCount }}개 선택됨</span>
          <button @click="courseStore.clearSelected" class="clear-button">
            전체 해제
          </button>
        </div>

        <button @click="goToEnrollment" class="enroll-button">
          <ShoppingCart :size="20" />
          <span>수강 신청</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElCheckbox } from 'element-plus'
import CategoryService from '@/services/categoryService'
import {
  ChevronLeft, BookOpen, RefreshCw, CheckCircle,
  Tag, User, Users, Star, ShoppingCart, Clock
} from 'lucide-vue-next'

// 라우터 & 스토어
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isInitialLoading = ref(true)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const selectedCategory = ref('all')
const sortBy = ref('latest')
const displayCount = ref(20)
const lastDoc = ref(null)

// 필터 카테고리
const filterCategories = ref([
  { value: 'all', label: '전체' },
  { value: '기계', label: '기계' },
  { value: '공구', label: '공구' },
  { value: '장비', label: '장비' },
  { value: '약품', label: '약품' }
])

// 계산된 속성
const courses = computed(() => courseStore.courses)
const selectedCount = computed(() => courseStore.selectedCount)
const enrollments = computed(() => courseStore.enrollments)

// 필터링 및 정렬된 강의
const filteredCourses = computed(() => {
  let filtered = courses.value

  // 카테고리 필터
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(course =>
        course.category?.main === selectedCategory.value
    )
  }

  // 정렬
  switch (sortBy.value) {
    case 'popular':
      return [...filtered].sort((a, b) =>
          (b.enrollmentCount || 0) - (a.enrollmentCount || 0)
      )
    case 'title':
      return [...filtered].sort((a, b) =>
          a.title.localeCompare(b.title, 'ko')
      )
    case 'latest':
    default:
      return [...filtered].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt)
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt)
        return dateB - dateA
      })
  }
})

// 표시할 강의 (가상 스크롤링)
const displayedCourses = computed(() => {
  return filteredCourses.value.slice(0, displayCount.value)
})

const hasMore = computed(() => {
  return displayCount.value < filteredCourses.value.length
})

// 메서드
const navigateToCourse = (courseId) => {
  router.push(`/course/${courseId}`)
}

const goToEnrollment = () => {
  router.push('/course-enroll')
}

const handleSelectChange = (courseId, checked) => {
  if (checked) {
    courseStore.addToSelected(courseId)
  } else {
    courseStore.removeFromSelected(courseId)
  }
  courseStore.saveSelectedToStorage()
}

// 수강 상태 관련
const getEnrollmentStatus = (courseId) => {
  return courseStore.getEnrollmentStatus(courseId)
}

const getProgress = (courseId) => {
  return courseStore.getProgress(courseId)
}

const getStatusBadgeText = (courseId) => {
  const status = getEnrollmentStatus(courseId)
  return status === 'completed' ? '수료 완료' : '수강 중'
}

// 카테고리 표시
const getCategoryDisplayPath = (course) => {
  if (!course.category) return '기타'
  const { main, middle, leaf } = course.category
  const parts = []
  if (main) parts.push(main)
  if (middle) parts.push(middle)
  if (leaf) parts.push(leaf)
  return parts.join(' > ') || '기타'
}

// 유틸리티
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }
  return difficultyMap[difficulty] || difficulty
}

const getLanguageLabel = (lang) => {
  const langMap = {
    ko: '한국어',
    en: 'English',
    zh: '中文',
    vi: 'Tiếng Việt',
    th: 'ไทย',
    ja: '日本語'
  }
  return langMap[lang] || lang
}

const formatNumber = (num) => {
  if (num >= 10000) return `${Math.floor(num / 10000)}만`
  if (num >= 1000) return `${Math.floor(num / 1000)}천`
  return num.toString()
}

// 새로고침
const handleRefresh = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    await courseStore.loadCoursesFromFirestore(true)
    ElMessage.success('강의 목록을 새로고침했습니다')
  } catch (error) {
    ElMessage.error('새로고침에 실패했습니다')
  } finally {
    isLoading.value = false
  }
}

// 더 보기
const loadMore = () => {
  displayCount.value += 20

  // 다음 페이지 미리 로드
  if (displayCount.value >= courses.value.length - 10) {
    loadNextPage()
  }
}

// 다음 페이지 로드
const loadNextPage = async () => {
  if (isLoadingMore.value || !courseStore.hasMore) return

  isLoadingMore.value = true
  try {
    await courseStore.loadCoursesWithPagination(lastDoc.value)
  } catch (error) {
    console.error('추가 로드 실패:', error)
  } finally {
    isLoadingMore.value = false
  }
}

// 이미지 lazy loading 디렉티브
const vLazy = {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.src = binding.value
          observer.unobserve(el)
        }
      })
    }, {
      rootMargin: '50px'
    })
    observer.observe(el)
  }
}

// 마운트
onMounted(async () => {
  isInitialLoading.value = true
  courseStore.loadSelectedFromStorage()

  try {
    // 병렬 로드
    const promises = []

    if (authStore.isLoggedIn) {
      promises.push(courseStore.loadUserEnrollments())
    }

    promises.push(courseStore.loadCoursesFromFirestore())

    await Promise.all(promises)
  } catch (error) {
    console.error('강의 로드 실패:', error)
    ElMessage.error('강의 목록을 불러올 수 없습니다')
  } finally {
    isInitialLoading.value = false
  }
})
</script>

<style scoped>
/* =================== 컨테이너 =================== */
.course-list-container {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

/* =================== 헤더 =================== */
.course-header {
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  color: white;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-md);
}

.header-content {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button,
.refresh-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover,
.refresh-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.refresh-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin: 0;
}

/* =================== 스켈레톤 로딩 =================== */
.loading-container {
  flex: 1;
  padding: var(--space-6);
  max-width: var(--container-xl);
  margin: 0 auto;
  width: 100%;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

.skeleton-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  animation: skeleton-pulse 1.5s infinite;
}

.skeleton-image {
  width: 100%;
  height: 180px;
  background: var(--bg-tertiary);
}

.skeleton-content {
  padding: var(--space-4);
}

.skeleton-title {
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
}

.skeleton-text {
  height: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.skeleton-text.short {
  width: 60%;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* =================== 메인 콘텐츠 =================== */
.main-content {
  flex: 1;
  padding: var(--space-6);
  max-width: var(--container-xl);
  margin: 0 auto;
  width: 100%;
}

/* =================== 필터 섹션 =================== */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
}

.filter-chips {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-chips::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-secondary);
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.filter-chip.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.sort-select {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-secondary);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
}

/* =================== 강의 그리드 =================== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* =================== 강의 카드 =================== */
.course-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.course-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.course-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.course-card:hover .course-thumbnail {
  transform: scale(1.05);
}

.status-badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: var(--accent-success);
  color: white;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  backdrop-filter: blur(10px);
}

.progress-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  padding: var(--space-2) var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.progress-text {
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.course-content {
  padding: var(--space-4);
}

.course-category {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  margin-bottom: var(--space-2);
}

.course-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.instructor {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.difficulty {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.difficulty-beginner {
  background: var(--bg-success);
  color: var(--accent-success);
}

.difficulty-intermediate {
  background: var(--bg-warning);
  color: var(--accent-warning);
}

.difficulty-advanced {
  background: var(--bg-danger);
  color: var(--accent-danger);
}

.course-stats {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.language-chips {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.language-chip {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.language-more {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  color: var(--text-tertiary);
}

.course-select {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-1);
  box-shadow: var(--shadow-md);
}

/* =================== 빈 상태 =================== */
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
}

.empty-icon {
  color: var(--text-tertiary);
  margin-bottom: var(--space-4);
}

.empty-state h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-state p {
  color: var(--text-secondary);
}

/* =================== 더 보기 =================== */
.load-more {
  text-align: center;
  padding: var(--space-8) 0;
}

.load-more-button {
  padding: var(--space-3) var(--space-6);
  background: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-button:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8) 0;
  color: var(--text-secondary);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-secondary);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =================== 플로팅 액션 =================== */
.floating-action {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-xl);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  z-index: var(--z-fixed);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.clear-button {
  font-size: var(--text-sm);
  color: var(--accent-danger);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: var(--font-medium);
}

.enroll-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.enroll-button:hover {
  background: var(--accent-primary-dark);
  transform: scale(1.05);
}

/* =================== 애니메이션 =================== */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s ease;
}

.fab-enter-from {
  transform: translate(-50%, 100px);
  opacity: 0;
}

.fab-leave-to {
  transform: translate(-50%, 100px);
  opacity: 0;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* =================== 반응형 =================== */
@media (max-width: 768px) {
  .main-content {
    padding: var(--space-4);
  }

  .course-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .floating-action {
    bottom: calc(65px + var(--space-4));
    width: calc(100% - var(--space-8));
    max-width: 400px;
  }
}
</style>