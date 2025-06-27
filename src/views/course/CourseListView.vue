<template>
  <div class="course-list-container">
    <!-- 헤더 -->
    <header class="course-header">
      <div class="header-content">
        <button class="back-button" @click="$router.back()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h1 class="header-title">강의 목록</h1>
        <button
            class="refresh-button"
            @click="handleRefresh"
            :disabled="isLoading"
        >
          <i
              class="fas fa-sync-alt"
              :class="{ 'fa-spin': isLoading }"
          ></i>
        </button>
      </div>
    </header>

    <!-- 선택된 강의 정보 바 -->
    <transition name="slide-down">
      <div v-if="selectedCount > 0" class="selected-info-bar">
        <div class="selected-content">
          <div class="selected-info">
            <i class="fas fa-check-circle"></i>
            <span>{{ selectedCount }}개 강의 선택됨</span>
          </div>
          <div class="selected-actions">
            <button
                class="btn-text"
                @click="courseStore.clearSelectedCourses"
            >
              <i class="fas fa-times"></i>
              선택 해제
            </button>
            <router-link to="/course/enroll" class="btn-primary">
              <i class="fas fa-shopping-cart"></i>
              수강 신청하기
            </router-link>
          </div>
        </div>
      </div>
    </transition>

    <!-- 메인 콘텐츠 -->
    <main class="course-content">
      <div class="content-wrapper">
        <!-- 검색 및 필터 -->
        <div class="search-filter-section">
          <!-- 검색 바 -->
          <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input
                v-model="searchQuery"
                type="text"
                placeholder="강의 제목, 설명, 카테고리로 검색..."
                class="search-input"
            />
            <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="clear-search"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- 카테고리 필터 -->
          <div class="category-filter">
            <!-- 대분류 탭 -->
            <div class="tab-container">
              <button
                  v-for="(tab, index) in mainTabs"
                  :key="tab"
                  :class="['tab-item', { active: selectedTabIndex === index }]"
                  @click="selectTab(index)"
              >
                {{ tab }}
              </button>
            </div>

            <!-- 중분류 -->
            <div v-if="middleCategories.length > 0" class="filter-group">
              <span class="filter-label">중분류</span>
              <div class="category-chips">
                <button
                    v-for="category in middleCategories"
                    :key="category"
                    :class="['chip', { active: selectedMiddleCategory === category }]"
                    @click="selectMiddleCategory(category)"
                >
                  {{ category }}
                </button>
              </div>
            </div>

            <!-- 소분류 -->
            <div v-if="leafCategories.length > 0" class="filter-group">
              <span class="filter-label">소분류</span>
              <div class="category-chips">
                <button
                    v-for="category in leafCategories"
                    :key="category"
                    :class="['chip', { active: selectedLeafCategory === category }]"
                    @click="selectLeafCategory(category)"
                >
                  {{ category }}
                </button>
              </div>
            </div>

            <!-- 브레드크럼 -->
            <div v-if="breadcrumbs.length > 1" class="breadcrumbs">
              <button
                  v-for="(crumb, index) in breadcrumbs"
                  :key="index"
                  :class="['breadcrumb-item', { active: index === breadcrumbs.length - 1 }]"
                  @click="navigateToBreadcrumb(crumb)"
              >
                {{ crumb.name }}
              </button>
              <span
                  v-if="index < breadcrumbs.length - 1"
                  class="breadcrumb-separator"
              >
                >
              </span>
            </div>
          </div>

          <!-- 추가 필터 -->
          <div class="additional-filters">
            <select
                v-model="difficultyFilter"
                class="filter-select"
            >
              <option value="">난이도 전체</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>

            <div class="clear-filters">
              <button
                  v-if="hasActiveFilters"
                  @click="clearFilters"
                  class="clear-button"
              >
                <i class="fas fa-redo"></i>
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="isInitialLoading" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p class="loading-text">강의 목록을 불러오는 중...</p>
        </div>

        <!-- 강의 목록 -->
        <div v-else-if="!error" class="course-grid">
          <!-- 검색 결과 정보 -->
          <div v-if="searchQuery && filteredCourses.length > 0" class="search-results-info">
            <p>
              <strong>"{{ searchQuery }}"</strong> 검색 결과:
              {{ filteredCourses.length }}개 강의
            </p>
          </div>

          <!-- 빈 상태 -->
          <div v-if="filteredCourses.length === 0" class="empty-state">
            <i class="fas fa-search empty-icon"></i>
            <h3 class="empty-title">
              {{ searchQuery ? '검색 결과가 없습니다' : '등록된 강의가 없습니다' }}
            </h3>
            <p class="empty-description">
              {{ searchQuery
                ? '다른 검색어를 시도해보세요'
                : '새로운 강의가 곧 추가될 예정입니다'
              }}
            </p>
          </div>

          <!-- 강의 카드 목록 -->
          <TransitionGroup
              v-else
              name="course-list"
              tag="div"
              class="course-cards"
          >
            <article
                v-for="course in filteredCourses"
                :key="course.id"
                class="course-card"
                @click="handleCourseClick(course)"
            >
              <!-- 수강 상태 배지 -->
              <div
                  v-if="getEnrollmentStatus(course.id) !== 'not-enrolled'"
                  class="status-badge"
                  :class="getStatusBadgeClass(course.id)"
              >
                {{ getStatusBadgeText(course.id) }}
              </div>

              <!-- 카드 헤더 -->
              <div class="card-header">
                <h3 class="course-title">{{ course.title }}</h3>
                <button
                    class="select-button"
                    :class="{ selected: courseStore.isSelected(course.id) }"
                    @click.stop="handleCourseSelect(course)"
                >
                  <i
                      :class="[
                      'fas',
                      courseStore.isSelected(course.id)
                        ? 'fa-check-square'
                        : 'fa-square'
                    ]"
                  ></i>
                </button>
              </div>

              <!-- 카테고리 -->
              <div class="course-category">
                <span
                    class="category-badge"
                    :style="getCategoryStyle(course.category?.leaf)"
                >
                  {{ getCategoryDisplayPath(course) }}
                </span>
              </div>

              <!-- 설명 -->
              <p class="course-description line-clamp-2">
                {{ course.description || '설명이 없습니다.' }}
              </p>

              <!-- 메타 정보 -->
              <div class="course-meta">
                <div class="meta-item">
                  <i class="fas fa-signal"></i>
                  <span>{{ getDifficultyText(course.difficulty) }}</span>
                </div>
                <div v-if="course.duration" class="meta-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ course.duration }}</span>
                </div>
                <div v-if="course.availableLanguages?.length > 0" class="meta-item">
                  <i class="fas fa-language"></i>
                  <span>{{ course.availableLanguages.length }}개 언어</span>
                </div>
              </div>

              <!-- 진도율 (수강 중인 경우) -->
              <div
                  v-if="getEnrollmentStatus(course.id) === 'in-progress'"
                  class="progress-section"
              >
                <div class="progress-info">
                  <span>진도율</span>
                  <span>{{ courseStore.getProgress(course.id) }}%</span>
                </div>
                <div class="progress-bar">
                  <div
                      class="progress-fill"
                      :style="{ width: `${courseStore.getProgress(course.id)}%` }"
                  ></div>
                </div>
              </div>
            </article>
          </TransitionGroup>
        </div>

        <!-- 에러 상태 -->
        <div v-else class="error-container">
          <i class="fas fa-exclamation-triangle error-icon"></i>
          <h3 class="error-title">강의 목록을 불러올 수 없습니다</h3>
          <p class="error-description">{{ error }}</p>
          <button class="btn-primary" @click="handleRefresh">
            <i class="fas fa-redo"></i>
            다시 시도
          </button>
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
import CategoryService from '@/services/categoryService'
import { ElMessage } from 'element-plus'

// 스토어 및 라우터
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const searchQuery = ref('')
const selectedTabIndex = ref(0)
const selectedMainCategory = ref('전체')
const selectedMiddleCategory = ref('')
const selectedLeafCategory = ref('')
const difficultyFilter = ref('')
const isInitialLoading = ref(false)

// 계산된 속성
const selectedCount = computed(() => courseStore.selectedCount)
const isLoading = computed(() => courseStore.isLoading)
const error = computed(() => courseStore.error)

// 카테고리 관련
const mainTabs = computed(() => ['전체', ...CategoryService.getMainCategories()])

const middleCategories = computed(() => {
  if (selectedMainCategory.value === '전체') return []
  return CategoryService.getMiddleCategories(selectedMainCategory.value)
})

const leafCategories = computed(() => {
  if (!selectedMiddleCategory.value) return []
  return CategoryService.getLeafCategories(
      selectedMainCategory.value,
      selectedMiddleCategory.value
  )
})

// 브레드크럼
const breadcrumbs = computed(() => {
  const crumbs = [{ name: '전체', type: 'main' }]

  if (selectedMainCategory.value && selectedMainCategory.value !== '전체') {
    crumbs.push({
      name: selectedMainCategory.value,
      type: 'main'
    })
  }

  if (selectedMiddleCategory.value) {
    crumbs.push({
      name: selectedMiddleCategory.value,
      type: 'middle'
    })
  }

  if (selectedLeafCategory.value) {
    crumbs.push({
      name: selectedLeafCategory.value,
      type: 'leaf'
    })
  }

  return crumbs
})

// 필터링된 강의 목록
const filteredCourses = computed(() => {
  let filtered = courseStore.courses

  // 검색 필터
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(course => {
      const title = (course.title || '').toLowerCase()
      const description = (course.description || '').toLowerCase()
      const categoryPath = getCategoryDisplayPath(course).toLowerCase()
      return title.includes(query) ||
          description.includes(query) ||
          categoryPath.includes(query)
    })
  }

  // 카테고리 필터
  if (selectedMainCategory.value && selectedMainCategory.value !== '전체') {
    filtered = filtered.filter(course =>
        course.category?.main === selectedMainCategory.value
    )
  }

  if (selectedMiddleCategory.value) {
    filtered = filtered.filter(course =>
        course.category?.middle === selectedMiddleCategory.value
    )
  }

  if (selectedLeafCategory.value) {
    filtered = filtered.filter(course =>
        course.category?.leaf === selectedLeafCategory.value
    )
  }

  // 난이도 필터
  if (difficultyFilter.value) {
    filtered = filtered.filter(course =>
        course.difficulty === difficultyFilter.value
    )
  }

  return filtered
})

// 활성 필터 확인
const hasActiveFilters = computed(() => {
  return searchQuery.value ||
      selectedMainCategory.value !== '전체' ||
      difficultyFilter.value
})

// 메서드
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
    // addToSelected 메서드 수정
    if (courseStore.selectedCount >= 10) {
      ElMessage.warning('최대 10개까지 선택할 수 있습니다')
      return
    }

    courseStore.addToSelected(course.id)
    ElMessage.success('강의가 선택되었습니다')
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
    // 사용자 정보 로드
    if (authStore.isLoggedIn) {
      await courseStore.loadUserEnrollments()
    }

    // 강의 목록 로드
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
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0;
}

/* =================== 선택 정보 바 =================== */
.selected-info-bar {
  background: var(--color-info-bg);
  border-bottom: 1px solid var(--color-info-border);
  position: sticky;
  top: 72px;
  z-index: calc(var(--z-sticky) - 1);
}

.selected-content {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: var(--space-3) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-info-dark);
  font-weight: var(--font-medium);
}

.selected-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn-text {
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-text:hover {
  color: var(--color-error);
}

.btn-primary {
  padding: var(--space-2) var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* =================== 메인 콘텐츠 =================== */
.course-content {
  flex: 1;
  padding: var(--space-6) 0;
}

.content-wrapper {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* =================== 검색 및 필터 =================== */
.search-filter-section {
  margin-bottom: var(--space-6);
}

/* 검색 바 */
.search-container {
  position: relative;
  margin-bottom: var(--space-4);
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-5);
  padding-left: 48px;
  font-size: var(--text-base);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  background: var(--bg-secondary);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
}

.clear-search {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  padding: var(--space-1);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-search:hover {
  color: var(--text-secondary);
}

/* 카테고리 필터 */
.category-filter {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

/* 탭 컨테이너 */
.tab-container {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tab-container::-webkit-scrollbar {
  display: none;
}

.tab-item {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.tab-item:hover {
  background: var(--color-primary-50);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.tab-item.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* 필터 그룹 */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.filter-group:last-child {
  margin-bottom: 0;
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
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  flex-wrap: wrap;
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
  cursor: default;
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

/* 추가 필터 */
.additional-filters {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.filter-select {
  padding: var(--space-2) var(--space-3);
  padding-right: var(--space-8);
  font-size: var(--text-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-2) center;
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
  color: var(--color-error-dark);
}

/* =================== 강의 그리드 =================== */
.course-grid {
  min-height: 400px;
}

.search-results-info {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
}

.search-results-info p {
  margin: 0;
  color: var(--text-secondary);
}

.course-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
}

/* 강의 카드 */
.course-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-primary-alpha);
}

/* 수강 상태 배지 */
.status-badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-base);
}

.badge-completed {
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}

.badge-progress {
  background: var(--color-warning-bg);
  color: var(--color-warning-dark);
  border: 1px solid var(--color-warning-border);
}

/* 카드 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.course-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.select-button {
  padding: var(--space-1);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: var(--text-xl);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.select-button:hover {
  color: var(--accent-primary);
}

.select-button.selected {
  color: var(--color-success);
}

/* 카테고리 배지 */
.course-category {
  margin-bottom: var(--space-3);
}

.category-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-base);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

/* 설명 */
.course-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  flex: 1;
}

/* 메타 정보 */
.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.meta-item i {
  font-size: var(--text-xs);
}

/* 진도율 */
.progress-section {
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-primary);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
}

.progress-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-success);
  transition: width var(--transition-base);
}

/* =================== 로딩 상태 =================== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-4);
}

.loading-spinner {
  font-size: var(--text-3xl);
  color: var(--accent-primary);
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--text-base);
}

/* =================== 빈 상태 =================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: var(--space-8);
}

.empty-icon {
  font-size: 64px;
  color: var(--text-quaternary);
  margin-bottom: var(--space-4);
}

.empty-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: 0 0 var(--space-2) 0;
}

.empty-description {
  color: var(--text-tertiary);
  font-size: var(--text-base);
  margin: 0;
}

/* =================== 에러 상태 =================== */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: var(--space-8);
  gap: var(--space-3);
}

.error-icon {
  font-size: 64px;
  color: var(--color-error);
  margin-bottom: var(--space-2);
}

.error-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.error-description {
  color: var(--text-secondary);
  font-size: var(--text-base);
  margin: 0;
}

/* =================== 애니메이션 =================== */
/* 슬라이드 다운 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-base);
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(-100%);
}

/* 리스트 애니메이션 */
.course-list-move,
.course-list-enter-active,
.course-list-leave-active {
  transition: all var(--transition-base);
}

.course-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.course-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* =================== 유틸리티 =================== */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* =================== 반응형 =================== */
@media (max-width: 768px) {
  .header-content,
  .selected-content,
  .content-wrapper {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }

  .course-cards {
    grid-template-columns: 1fr;
  }

  .additional-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .clear-filters {
    margin-left: 0;
    margin-top: var(--space-2);
  }

  .filter-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: var(--text-xl);
  }

  .course-card {
    padding: var(--space-3);
  }

  .course-title {
    font-size: var(--text-base);
  }

  .tab-container {
    gap: var(--space-1);
  }

  .tab-item {
    padding: var(--space-1-5) var(--space-3);
    font-size: var(--text-xs);
  }
}
</style>