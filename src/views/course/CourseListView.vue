<!-- web/src/views/course/CourseListView.vue -->
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
            <h1 class="text-xl font-semibold text-gray-900">강의 신청하기</h1>
          </div>
          <button
              @click="refreshCourses"
              :disabled="isLoading"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw :class="['w-5 h-5 text-gray-600', { 'animate-spin': isLoading }]" />
          </button>
        </div>
      </div>
    </div>

    <!-- 카테고리 탭 -->
    <div class="bg-white border-b border-gray-200 sticky top-16 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
          <button
              v-for="(tab, index) in mainTabs"
              :key="tab"
              @click="selectTab(index)"
              :class="[
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              selectedTabIndex === index
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            ]"
          >
            {{ tab }}
          </button>
        </div>
      </div>
    </div>

    <!-- 필터 및 검색 -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <!-- 브레드크럼 -->
        <div v-if="selectedMainCategory !== '전체'" class="mb-4">
          <nav class="flex items-center space-x-2 text-sm">
            <button
                v-for="(crumb, index) in breadcrumbs"
                :key="index"
                @click="navigateToBreadcrumb(crumb)"
                class="flex items-center"
            >
              <span
                  :class="[
                  'hover:text-blue-600 transition-colors',
                  index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'
                ]"
              >
                {{ crumb.label }}
              </span>
              <ChevronRight v-if="index < breadcrumbs.length - 1" class="w-4 h-4 mx-1 text-gray-400" />
            </button>
          </nav>
        </div>

        <!-- 중간 카테고리 필터 -->
        <div v-if="middleCategories.length > 0" class="mb-4">
          <div class="flex flex-wrap gap-2">
            <button
                v-for="midCat in middleCategories"
                :key="midCat"
                @click="selectMiddleCategory(midCat)"
                :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedMiddleCategory === midCat
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ midCat }}
            </button>
          </div>
        </div>

        <!-- 리프 카테고리 필터 -->
        <div v-if="leafCategories.length > 0" class="mb-4">
          <div class="flex flex-wrap gap-2">
            <button
                v-for="leafCat in leafCategories"
                :key="leafCat"
                @click="selectLeafCategory(leafCat)"
                :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedLeafCategory === leafCat
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ leafCat }}
            </button>
          </div>
        </div>

        <!-- 검색 및 난이도 필터 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                v-model="searchQuery"
                type="text"
                placeholder="강의명, 강사명, 태그로 검색..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
              v-model="difficultyFilter"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 난이도</option>
            <option value="beginner">초급</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>
        </div>

        <!-- 활성 필터 표시 -->
        <div v-if="hasActiveFilters" class="mt-3 flex items-center space-x-2">
          <span class="text-sm text-gray-600">활성 필터:</span>
          <button
              @click="clearFilters"
              class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            모두 지우기
          </button>
        </div>
      </div>
    </div>

    <!-- 강의 목록 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
      <!-- 결과 개수 -->
      <div v-if="!isLoading && filteredCourses.length > 0" class="mb-4 text-sm text-gray-600">
        {{ filteredCourses.length }}개의 강의
      </div>

      <!-- 초기 로딩 상태 (스켈레톤) -->
      <div v-if="isInitialLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseSkeletonLoader v-for="i in 6" :key="`skeleton-${i}`" />
      </div>

      <!-- 강의 카드 그리드 -->
      <div v-else-if="filteredCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <!-- 썸네일 -->
          <div class="aspect-video bg-gray-100 relative">
            <img
                v-if="course.thumbnail"
                :src="course.thumbnail"
                :alt="course.title"
                class="w-full h-full object-cover"
                loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <PlayCircle class="w-16 h-16 text-gray-400" />
            </div>

            <!-- 수강 상태 배지 -->
            <div v-if="getEnrollmentStatus(course.id) !== 'not-enrolled'" class="absolute top-2 right-2">
              <span
                  :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getEnrollmentStatus(course.id) === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                ]"
              >
                {{ getEnrollmentStatus(course.id) === 'completed' ? '수료 완료' : '수강 중' }}
              </span>
            </div>
          </div>

          <!-- 카드 내용 -->
          <div class="p-4">
            <!-- 카테고리 -->
            <div class="mb-2">
              <span
                  :class="getCategoryStyle(course.category?.leaf || '기타')"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ getCategoryDisplayPath(course) }}
              </span>
            </div>

            <!-- 제목 -->
            <h3
                @click="handleCourseClick(course)"
                class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
            >
              {{ course.title }}
            </h3>

            <!-- 강사 및 평점 -->
            <div class="flex items-center justify-between mb-3 text-sm text-gray-600">
              <span class="flex items-center">
                <User class="w-4 h-4 mr-1" />
                {{ course.instructor || '전문 강사' }}
              </span>
              <span v-if="course.rating" class="flex items-center">
                <Star class="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                {{ course.rating.toFixed(1) }}
              </span>
            </div>

            <!-- 메타 정보 -->
            <div class="flex items-center space-x-4 mb-4 text-xs text-gray-500">
              <span class="flex items-center">
                <Clock class="w-3 h-3 mr-1" />
                {{ course.duration || '30분' }}
              </span>
              <span class="flex items-center">
                <BarChart class="w-3 h-3 mr-1" />
                {{ getDifficultyText(course.difficulty) }}
              </span>
              <span v-if="course.enrolledCount" class="flex items-center">
                <Users class="w-3 h-3 mr-1" />
                {{ course.enrolledCount }}명
              </span>
            </div>

            <!-- 액션 버튼 -->
            <div class="flex gap-2">
              <button
                  @click="handleCourseClick(course)"
                  class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                상세보기
              </button>
              <button
                  @click="handleCourseSelect(course)"
                  :class="[
                  'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center',
                  courseStore.isSelected(course.id)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                ]"
              >
                <Check v-if="courseStore.isSelected(course.id)" class="w-4 h-4 mr-1" />
                <Plus v-else class="w-4 h-4 mr-1" />
                {{ courseStore.isSelected(course.id) ? '선택됨' : '선택하기' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 검색 결과 없음 -->
      <div v-else-if="!isLoading" class="text-center py-16">
        <BookOpen class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-medium text-gray-900 mb-2">검색 결과가 없습니다</h2>
        <p class="text-gray-500">다른 검색어나 필터를 시도해보세요</p>
      </div>

      <!-- 추가 로딩 표시 -->
      <div v-if="isLoadingMore" class="mt-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
      </div>
    </div>

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
  Check
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
  selectedMiddleCategory.value = category
  selectedLeafCategory.value = ''
}

const selectLeafCategory = (category) => {
  selectedLeafCategory.value = category
}

const resetCategories = () => {
  selectedMainCategory.value = '전체'
  selectedMiddleCategory.value = ''
  selectedLeafCategory.value = ''
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
    selectMainCategory(crumb.value)
  } else if (crumb.type === 'middle') {
    selectMiddleCategory(crumb.value)
    selectedLeafCategory.value = ''
  }
}

// 필터 초기화
const clearFilters = () => {
  searchQuery.value = ''
  selectedTabIndex.value = 0
  difficultyFilter.value = ''
  resetCategories()
}

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

// 강의 클릭 (상세보기)
const handleCourseClick = (course) => {
  router.push(`/course/${course.id}`)
}

// 강의 선택
const handleCourseSelect = (course) => {
  if (courseStore.isSelected(course.id)) {
    courseStore.removeFromSelected(course.id)
  } else {
    const result = courseStore.addToSelected(course.id)
    if (!result.success) {
      ElMessage.warning(result.message)
    }
  }
}

// 새로고침 (캐시 무시)
const refreshCourses = async () => {
  try {
    isLoading.value = true
    // 캐시 초기화 후 다시 로드
    courseStore.clearCache()
    await courseStore.loadCoursesFromFirestore()
    ElMessage.success('강의 목록을 새로고침했습니다.')
  } catch (error) {
    ElMessage.error('새로고침에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 마운트
onMounted(async () => {
  isInitialLoading.value = true
  courseStore.loadSelectedFromStorage()

  try {
    // 강의 데이터 로드 (캐시 우선)
    await courseStore.loadCoursesFromFirestore()
  } catch (error) {
    console.error('강의 로드 실패:', error)
    ElMessage.error('강의 목록을 불러올 수 없습니다.')
  } finally {
    isInitialLoading.value = false
  }
})
</script>

<style scoped>
/* ========== CourseListView.vue 완성된 스타일 ========== */

/* 전체 컨테이너 */
.min-h-screen {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* 헤더 스타일 개선 */
.bg-white.shadow-sm.sticky {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.bg-white.shadow-sm.sticky h1 {
  color: white;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bg-white.shadow-sm.sticky button {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.bg-white.shadow-sm.sticky button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 카테고리 탭 스타일 */
.bg-white.border-b {
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.bg-white.border-b button {
  position: relative;
  font-weight: 600;
  transition: all 0.3s ease;
  border-radius: 12px;
  margin: 0 4px;
}

.bg-white.border-b button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.bg-blue-50 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 필터 섹션 스타일 */
.bg-white.border-b.border-gray-200 {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 0 0 20px 20px;
  margin-bottom: 16px;
}

/* 브레드크럼 스타일 */
nav button span {
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 6px;
}

nav button:hover span {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

/* 카테고리 필터 버튼 */
.bg-green-100 {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
}

.bg-purple-100 {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

.bg-gray-100 {
  background: white;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  font-weight: 500;
}

.bg-gray-100:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

/* 검색바 스타일 */
.relative input {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 12px 16px 12px 44px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.relative input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  outline: none;
}

.relative input::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

/* 셀렉트 박스 스타일 */
select {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  outline: none;
}

/* 강의 카드 스타일 */
.bg-white.rounded-lg.shadow-sm {
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.bg-white.rounded-lg.shadow-sm:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.2);
}

.bg-white.rounded-lg.shadow-sm::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.bg-white.rounded-lg.shadow-sm:hover::before {
  transform: scaleX(1);
}

/* 썸네일 스타일 */
.aspect-video {
  position: relative;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.aspect-video img {
  transition: transform 0.4s ease;
}

.bg-white.rounded-lg.shadow-sm:hover .aspect-video img {
  transform: scale(1.05);
}

/* 상태 배지 스타일 */
.absolute.top-2.right-2 span {
  backdrop-filter: blur(10px);
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bg-green-100.text-green-800 {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: white !important;
}

.bg-blue-100.text-blue-800 {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
  color: white !important;
}

/* 카드 내용 스타일 */
.p-4 {
  padding: 24px;
}

/* 카테고리 태그 스타일 */
.inline-flex.items-center.px-2\.5 {
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 제목 스타일 */
.text-lg.font-semibold {
  font-weight: 700;
  line-height: 1.4;
  transition: all 0.3s ease;
}

.text-lg.font-semibold:hover {
  color: #667eea;
}

/* 액션 버튼 스타일 */
.flex.gap-2 button {
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.flex.gap-2 button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.flex.gap-2 button:hover::before {
  left: 100%;
}

.bg-gray-100.text-gray-700 {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
  border: 2px solid transparent;
}

.bg-gray-100.text-gray-700:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bg-blue-600.text-white {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.bg-blue-600.text-white:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.bg-green-100.text-green-700 {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.bg-green-100.text-green-700:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* 빈 상태 스타일 */
.text-center.py-16 {
  background: white;
  border-radius: 20px;
  margin: 20px;
  padding: 60px 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.text-center.py-16 svg {
  opacity: 0.6;
  margin-bottom: 24px;
}

.text-center.py-16 h2 {
  font-weight: 700;
  color: #374151;
  margin-bottom: 12px;
}

.text-center.py-16 p {
  color: #6b7280;
  font-size: 16px;
}

/* 로딩 애니메이션 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 스켈레톤 로더 스타일 */
.grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
  gap: 24px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .max-w-7xl {
    padding-left: 16px;
    padding-right: 16px;
  }

  .bg-white.shadow-sm.sticky h1 {
    font-size: 18px;
  }

  .flex.items-center.space-x-4 {
    gap: 8px;
  }

  .grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .p-4 {
    padding: 16px;
  }

  .flex.gap-2 {
    flex-direction: column;
    gap: 8px;
  }

  .flex.gap-2 button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .welcome-banner {
    padding: 32px 16px;
  }

  .section-title {
    font-size: 20px;
  }

  .bg-white.shadow-sm.sticky {
    padding: 12px 16px;
  }

  .relative input {
    font-size: 14px;
    padding: 10px 14px 10px 40px;
  }

  select {
    font-size: 14px;
    padding: 10px 14px;
  }
}

/* 스크롤바 커스터마이징 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

/* 포커스 상태 개선 */
button:focus,
input:focus,
select:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

/* 선택 상태 스타일 */
::selection {
  background: rgba(102, 126, 234, 0.2);
  color: #1a202c;
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 다크모드 대비 (향후 확장용) */
@media (prefers-color-scheme: dark) {
  .bg-white {
    background: #1f2937;
    color: white;
  }

  .text-gray-900 {
    color: #f9fafb;
  }

  .text-gray-600 {
    color: #d1d5db;
  }
}
</style>