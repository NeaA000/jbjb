<template>
  <div class="course-list-container">
    <!-- 헤더 -->
    <header class="course-header">
      <div class="header-content">
        <button @click="router.back()" class="back-button">
          <ArrowLeft :size="20" />
        </button>
        <h1 class="header-title">강의 목록</h1>
        <button @click="handleRefresh" class="refresh-button" :disabled="isLoading">
          <RefreshCw :size="20" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </header>

    <!-- 카테고리 탭 -->
    <nav class="category-tabs">
      <div class="tabs-wrapper">
        <button
            v-for="(tab, index) in mainTabs"
            :key="tab"
            :class="['tab-button', { active: selectedTabIndex === index }]"
            @click="selectTab(index)"
        >
          {{ tab }}
        </button>
      </div>
    </nav>

    <!-- 필터 섹션 -->
    <section class="filter-section">
      <div class="filter-content">
        <!-- 검색 바 -->
        <div class="search-wrapper">
          <Search :size="20" class="search-icon" />
          <input
              v-model="searchQuery"
              type="text"
              placeholder="강의명, 강사명, 태그로 검색..."
              class="search-input"
          />
        </div>

        <!-- 중간/리프 카테고리 선택 -->
        <div v-if="selectedMainCategory !== '전체'" class="category-filters">
          <!-- 중간 카테고리 -->
          <div v-if="middleCategories.length > 0" class="category-group">
            <label class="filter-label">중분류</label>
            <div class="category-chips">
              <button
                  v-for="cat in middleCategories"
                  :key="cat"
                  :class="['chip', { active: selectedMiddleCategory === cat }]"
                  @click="selectMiddleCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- 리프 카테고리 -->
          <div v-if="leafCategories.length > 0" class="category-group">
            <label class="filter-label">소분류</label>
            <div class="category-chips">
              <button
                  v-for="cat in leafCategories"
                  :key="cat"
                  :class="['chip', { active: selectedLeafCategory === cat }]"
                  @click="selectLeafCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>
          </div>
        </div>

        <!-- 브레드크럼 -->
        <nav v-if="breadcrumbs.length > 0" class="breadcrumbs">
          <button @click="resetCategories" class="breadcrumb-item">
            전체
          </button>
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.value">
            <ChevronRight :size="16" class="breadcrumb-separator" />
            <button
                @click="navigateToBreadcrumb(crumb)"
                :class="['breadcrumb-item', { active: index === breadcrumbs.length - 1 }]"
            >
              {{ crumb.label }}
            </button>
          </template>
        </nav>

        <!-- 추가 필터 -->
        <div class="additional-filters">
          <select v-model="difficultyFilter" class="filter-select">
            <option value="">난이도 전체</option>
            <option value="beginner">초급</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>

          <div v-if="hasActiveFilters" class="clear-filters">
            <button @click="clearFilters" class="clear-button">
              <XCircle :size="16" />
              필터 초기화
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 강의 목록 -->
    <main class="course-main">
      <div class="container">
        <!-- 결과 개수 -->
        <div v-if="!isLoading && filteredCourses.length > 0" class="result-count">
          {{ filteredCourses.length }}개의 강의를 찾았습니다
        </div>

        <!-- 초기 로딩 상태 -->
        <div v-if="isInitialLoading" class="course-grid">
          <CourseSkeletonLoader v-for="i in 6" :key="`skeleton-${i}`" />
        </div>

        <!-- 강의 카드 그리드 -->
        <div v-else-if="filteredCourses.length > 0" class="course-grid">
          <article
              v-for="course in filteredCourses"
              :key="course.id"
              class="course-card"
          >
            <!-- 썸네일 -->
            <div class="course-thumbnail" @click="handleCourseClick(course)">
              <img
                  v-if="course.thumbnail"
                  :src="course.thumbnail"
                  :alt="course.title"
                  loading="lazy"
              />
              <div v-else class="thumbnail-placeholder">
                <PlayCircle :size="48" />
              </div>

              <!-- 수강 상태 배지 -->
              <div v-if="getEnrollmentStatus(course.id) !== 'not-enrolled'" class="status-badge">
                <span :class="getStatusBadgeClass(course.id)">
                  {{ getStatusBadgeText(course.id) }}
                </span>
              </div>
            </div>

            <!-- 카드 내용 -->
            <div class="course-content">
              <!-- 카테고리 -->
              <div class="course-category">
                <span :class="getCategoryStyle(course.category?.leaf || '기타')">
                  {{ getCategoryDisplayPath(course) }}
                </span>
              </div>

              <!-- 제목 -->
              <h3 class="course-title" @click="handleCourseClick(course)">
                {{ course.title }}
              </h3>

              <!-- 강사 및 평점 -->
              <div class="course-meta">
                <span class="instructor">
                  <User :size="14" />
                  {{ course.instructor || '전문 강사' }}
                </span>
                <span v-if="course.rating" class="rating">
                  <Star :size="14" />
                  {{ course.rating.toFixed(1) }}
                </span>
              </div>

              <!-- 추가 정보 -->
              <div class="course-info">
                <span class="info-item">
                  <Clock :size="12" />
                  {{ course.duration || '30분' }}
                </span>
                <span class="info-item">
                  <BarChart :size="12" />
                  {{ getDifficultyText(course.difficulty) }}
                </span>
                <span v-if="course.enrolledCount" class="info-item">
                  <Users :size="12" />
                  {{ course.enrolledCount }}명
                </span>
              </div>

              <!-- 액션 버튼 -->
              <div class="course-actions">
                <button
                    @click="handleCourseClick(course)"
                    class="btn-detail"
                >
                  상세보기
                </button>
                <button
                    @click="handleCourseSelect(course)"
                    :class="['btn-select', { selected: courseStore.isSelected(course.id) }]"
                >
                  <Check v-if="courseStore.isSelected(course.id)" :size="16" />
                  <Plus v-else :size="16" />
                  {{ courseStore.isSelected(course.id) ? '선택됨' : '선택하기' }}
                </button>
              </div>
            </div>
          </article>
        </div>

        <!-- 검색 결과 없음 -->
        <div v-else-if="!isLoading" class="empty-state">
          <BookOpen :size="64" />
          <h2>검색 결과가 없습니다</h2>
          <p>다른 검색어나 필터를 시도해보세요</p>
          <button @click="clearFilters" class="btn-primary">
            필터 초기화
          </button>
        </div>

        <!-- 추가 로딩 표시 -->
        <div v-if="isLoadingMore" class="loading-more">
          <Loader2 :size="24" class="animate-spin" />
          <span>강의를 더 불러오는 중...</span>
        </div>
      </div>
    </main>

    <!-- 하단 선택 강의 푸터 -->
    <EnrolledCoursesFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { CategoryService } from '@/services/categoryService'
import CourseSkeletonLoader from '@/components/CourseSkeletonLoader.vue'
import EnrolledCoursesFooter from '@/components/EnrolledCoursesFooter.vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  RefreshCw,
  Search,
  ChevronRight,
  PlayCircle,
  User,
  Star,
  Clock,
  BarChart,
  Users,
  BookOpen,
  Loader2,
  Plus,
  Check,
  XCircle
} from 'lucide-vue-next'

const router = useRouter()
const courseStore = useCourseStore()

// 상태
const isLoading = ref(false)
const isInitialLoading = ref(true)
const isLoadingMore = ref(false)
const searchQuery = ref('')
const difficultyFilter = ref('')
const selectedTabIndex = ref(0)
const selectedMainCategory = ref('전체')
const selectedMiddleCategory = ref('')
const selectedLeafCategory = ref('')

// 카테고리 데이터
const mainTabs = computed(() => CategoryService.getMainTabs())
const middleCategories = computed(() => {
  if (selectedMainCategory.value === '전체') return []
  return CategoryService.getMainToMidMapping()[selectedMainCategory.value] || []
})
const leafCategories = computed(() => {
  if (!selectedMiddleCategory.value) return []
  return CategoryService.getMidToLeafMapping()[selectedMiddleCategory.value] || []
})

// 브레드크럼
const breadcrumbs = computed(() => {
  const crumbs = []

  if (selectedMainCategory.value && selectedMainCategory.value !== '전체') {
    crumbs.push({
      label: selectedMainCategory.value,
      value: selectedMainCategory.value,
      type: 'main'
    })
  }

  if (selectedMiddleCategory.value) {
    crumbs.push({
      label: selectedMiddleCategory.value,
      value: selectedMiddleCategory.value,
      type: 'middle'
    })
  }

  if (selectedLeafCategory.value) {
    crumbs.push({
      label: selectedLeafCategory.value,
      value: selectedLeafCategory.value,
      type: 'leaf'
    })
  }

  return crumbs
})

// 필터링된 강의 목록
const filteredCourses = computed(() => {
  let courses = courseStore.courses

  // 카테고리 필터
  if (selectedMainCategory.value !== '전체') {
    courses = courses.filter(course => {
      const itemCategories = [
        course.category?.main,
        course.category?.middle,
        course.category?.leaf
      ].filter(Boolean)

      if (selectedLeafCategory.value) {
        return CategoryService.matchesCategory(selectedLeafCategory.value, itemCategories)
      } else if (selectedMiddleCategory.value) {
        return CategoryService.matchesCategory(selectedMiddleCategory.value, itemCategories)
      } else {
        return CategoryService.matchesCategory(selectedMainCategory.value, itemCategories)
      }
    })
  }

  // 난이도 필터
  if (difficultyFilter.value) {
    courses = courses.filter(course => course.difficulty === difficultyFilter.value)
  }

  // 검색어 필터
  if (searchQuery.value.trim()) {
    const searchTerm = searchQuery.value.toLowerCase()
    courses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.instructor?.toLowerCase().includes(searchTerm) ||
        (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    )
  }

  return courses
})

// 활성 필터 여부
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' ||
      selectedMiddleCategory.value !== '' ||
      selectedLeafCategory.value !== '' ||
      difficultyFilter.value !== '' ||
      selectedTabIndex.value !== 0
})

// 카테고리 선택
const selectMainCategory = (category) => {
  selectedMainCategory.value = category
  selectedMiddleCategory.value = ''
  selectedLeafCategory.value = ''
}

const selectMiddleCategory = (category) => {
  selectedMiddleCategory.value = category === selectedMiddleCategory.value ? '' : category
  selectedLeafCategory.value = ''
}

const selectLeafCategory = (category) => {
  selectedLeafCategory.value = category === selectedLeafCategory.value ? '' : category
}

const resetCategories = () => {
  selectedMainCategory.value = '전체'
  selectedMiddleCategory.value = ''
  selectedLeafCategory.value = ''
  selectedTabIndex.value = 0
}

// 탭 선택
const selectTab = (index) => {
  selectedTabIndex.value = index
  const tab = mainTabs.value[index]
  selectMainCategory(tab)
}

// 브레드크럼 네비게이션
const navigateToBreadcrumb = (crumb) => {
  if (crumb.type === 'main') {
    selectedMiddleCategory.value = ''
    selectedLeafCategory.value = ''
  } else if (crumb.type === 'middle') {
    selectedLeafCategory.value = ''
  }
}

// 필터 초기화
const clearFilters = () => {
  searchQuery.value = ''
  difficultyFilter.value = ''
  resetCategories()
}

// 강의 클릭
const handleCourseClick = (course) => {
  router.push(`/course/${course.id}`)
}

// 강의 선택
const handleCourseSelect = (course) => {
  const isSelected = courseStore.isSelected(course.id)

  if (isSelected) {
    courseStore.removeFromSelected(course.id)
    ElMessage.info('선택이 취소되었습니다')
  } else {
    const result = courseStore.addToSelected(course.id)
    if (!result.success) {
      ElMessage.warning(result.message)
    } else {
      ElMessage.success('강의가 선택되었습니다')
    }
  }
}

// 수강 상태 관련
const getEnrollmentStatus = (courseId) => {
  return courseStore.getEnrollmentStatus(courseId)
}

const getStatusBadgeClass = (courseId) => {
  const status = getEnrollmentStatus(courseId)
  return status === 'completed' ? 'badge-completed' : 'badge-progress'
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

// 마운트
onMounted(async () => {
  isInitialLoading.value = true
  courseStore.loadSelectedFromStorage()

  try {
    await courseStore.loadCoursesFromFirestore()
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
  transition: all var(--transition-fast);
}

.back-button:hover,
.refresh-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0;
}

/* =================== 카테고리 탭 =================== */
.category-tabs {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 64px;
  z-index: var(--z-sticky - 1);
}

.tabs-wrapper {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tabs-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-button {
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.tab-button:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.tab-button.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
  background: var(--color-primary-50);
}

/* =================== 필터 섹션 =================== */
.filter-section {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  position: sticky;
  top: 128px;
  z-index: var(--z-sticky - 2);
}

.filter-content {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
}

/* 검색 바 */
.search-wrapper {
  position: relative;
  margin-bottom: var(--space-4);
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-4) var(--space-3) calc(var(--space-4) + 28px);
  font-size: var(--text-base);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 카테고리 필터 */
.category-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.category-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chip:hover {
  background: var(--color-primary-50);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.chip.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 브레드크럼 */
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
}

.breadcrumb-item {
  padding: var(--space-1) var(--space-2);
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.breadcrumb-item:hover {
  background: var(--bg-tertiary);
  color: var(--accent-primary);
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

/* 추가 필터 */
.additional-filters {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.filter-select {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-filters {
  margin-left: auto;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-error);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-button:hover {
  color: var(--color-error-dark-2);
}

/* =================== 메인 콘텐츠 =================== */
.course-main {
  flex: 1;
  padding: var(--space-6) 0 var(--space-20);
}

.container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.result-count {
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* =================== 강의 그리드 =================== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
}

/* =================== 강의 카드 =================== */
.course-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-base);
  overflow: hidden;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 썸네일 */
.course-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-tertiary);
  overflow: hidden;
  cursor: pointer;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.course-card:hover .course-thumbnail img {
  transform: scale(1.05);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-gray-200) 100%);
}

.status-badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}

.status-badge span {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
  backdrop-filter: blur(10px);
}

.badge-completed {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.badge-progress {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

/* 카드 내용 */
.course-content {
  flex: 1;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
}

.course-category {
  margin-bottom: var(--space-2);
}

.course-category span {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
}

.course-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-3) 0;
  line-height: var(--leading-tight);
  cursor: pointer;
  transition: color var(--transition-fast);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-title:hover {
  color: var(--accent-primary);
}

.course-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.instructor,
.rating {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.rating {
  color: var(--color-warning);
}

.course-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* 액션 버튼 */
.course-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
}

.btn-detail,
.btn-select {
  flex: 1;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.btn-detail {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-detail:hover {
  background: var(--color-gray-200);
}

.btn-select {
  background: var(--accent-primary);
  color: white;
}

.btn-select:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.btn-select.selected {
  background: var(--color-success);
}

.btn-select.selected:hover {
  background: #059669;
}

/* =================== 빈 상태 =================== */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-6);
  color: var(--text-tertiary);
}

.empty-state h2 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: var(--space-4) 0 var(--space-2) 0;
}

.empty-state p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6) 0;
}

.btn-primary {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: white;
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* =================== 로딩 상태 =================== */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-secondary);
}

/* =================== 애니메이션 =================== */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* =================== 반응형 디자인 =================== */
@media (max-width: 768px) {
  .header-content,
  .tabs-wrapper,
  .filter-content,
  .container {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }

  .course-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .additional-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    width: 100%;
  }

  .clear-filters {
    margin-left: 0;
    margin-top: var(--space-2);
  }

  .category-tabs {
    top: 56px;
  }

  .filter-section {
    top: 104px;
  }
}

@media (max-width: 480px) {
  .course-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .course-info {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .course-actions {
    flex-direction: column;
  }
}

/* =================== 접근성 =================== */
.course-card:focus-within {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .course-card,
  .course-thumbnail img {
    transition: none;
  }
}

/* =================== 카테고리 스타일 =================== */
.bg-blue-100 { background-color: var(--color-info-light); color: var(--color-info); }
.bg-green-100 { background-color: var(--color-success-light); color: var(--color-success); }
.bg-purple-100 { background-color: var(--color-primary-100); color: var(--color-primary-700); }
.bg-red-100 { background-color: var(--color-error-light); color: var(--color-error); }
.bg-gray-100 { background-color: var(--bg-tertiary); color: var(--text-secondary); }

.text-blue-800 { color: var(--color-info); }
.text-green-800 { color: var(--color-success); }
.text-purple-800 { color: var(--color-primary-700); }
.text-red-800 { color: var(--color-error); }
.text-gray-800 { color: var(--text-secondary); }
</style>