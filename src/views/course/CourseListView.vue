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
/* 스크롤바 숨기기 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* 라인 클램프 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>