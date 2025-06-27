<!-- web/src/views/course/CategoryCoursesView.vue -->
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
            <div>
              <h1 class="text-xl font-semibold text-gray-900">{{ leafCategory }} 강의</h1>
              <p class="text-sm text-gray-500">{{ getCategoryPath() }}</p>
            </div>
          </div>
          <component :is="getCategoryIcon()" class="w-6 h-6 text-gray-600" />
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <!-- 카테고리 설명 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-start space-x-4">
          <div
              :class="getCategoryStyle(leafCategory)"
              class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <component :is="getCategoryIcon()" class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">
              {{ leafCategory }} 관련 교육
            </h2>
            <p class="text-gray-600">
              {{ getCategoryDescription() }}
            </p>
            <div class="mt-3 flex items-center space-x-4 text-sm text-gray-500">
              <span class="flex items-center">
                <BookOpen class="w-4 h-4 mr-1" />
                {{ filteredCourses.length }}개 강의
              </span>
              <span class="flex items-center">
                <Users class="w-4 h-4 mr-1" />
                {{ getTotalEnrolled() }}명 수강
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 정렬 옵션 -->
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-600">
          총 {{ filteredCourses.length }}개의 강의
        </p>
        <select
            v-model="sortBy"
            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="newest">최신순</option>
          <option value="popular">인기순</option>
          <option value="rating">평점순</option>
          <option value="title">제목순</option>
        </select>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div class="flex items-center space-x-2">
          <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
          <span class="text-gray-600">강의를 불러오는 중...</span>
        </div>
      </div>

      <!-- 강의 목록 -->
      <div v-else-if="sortedCourses.length > 0" class="space-y-4">
        <div
            v-for="course in sortedCourses"
            :key="course.id"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <div class="p-6">
            <div class="flex items-start space-x-4">
              <!-- 썸네일 -->
              <div class="flex-shrink-0 w-48 h-27 bg-gray-100 rounded-lg overflow-hidden">
                <img
                    v-if="course.thumbnail"
                    :src="course.thumbnail"
                    :alt="course.title"
                    class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <PlayCircle class="w-12 h-12 text-gray-400" />
                </div>
              </div>

              <!-- 강의 정보 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <!-- 수강 상태 배지 -->
                    <div v-if="getEnrollmentStatus(course.id) !== 'not-enrolled'" class="mb-2">
                      <span
                          :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getEnrollmentStatus(course.id) === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        ]"
                      >
                        <CheckCircle class="w-3 h-3 mr-1" />
                        {{ getEnrollmentStatus(course.id) === 'completed' ? '수료 완료' : `진행중 ${getProgress(course.id)}%` }}
                      </span>
                    </div>

                    <!-- 제목 -->
                    <h3
                        @click="goToCourseDetail(course.id)"
                        class="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer"
                    >
                      {{ course.title }}
                    </h3>

                    <!-- 설명 -->
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                      {{ course.description }}
                    </p>

                    <!-- 메타 정보 -->
                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span class="flex items-center">
                        <User class="w-4 h-4 mr-1" />
                        {{ course.instructor || '전문 강사' }}
                      </span>
                      <span class="flex items-center">
                        <Clock class="w-4 h-4 mr-1" />
                        {{ course.duration || '30분' }}
                      </span>
                      <span class="flex items-center">
                        <BarChart class="w-4 h-4 mr-1" />
                        {{ getDifficultyText(course.difficulty) }}
                      </span>
                      <span v-if="course.rating" class="flex items-center">
                        <Star class="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                        {{ course.rating.toFixed(1) }}
                      </span>
                    </div>
                  </div>

                  <!-- 액션 버튼 -->
                  <div class="ml-4 flex-shrink-0">
                    <button
                        v-if="getEnrollmentStatus(course.id) === 'not-enrolled'"
                        @click="isSelected(course.id) ? removeFromSelectedList(course.id) : addToSelectedList(course.id)"
                        :class="[
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center',
                        isSelected(course.id)
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      ]"
                    >
                      <Check v-if="isSelected(course.id)" class="w-4 h-4 mr-1" />
                      <Plus v-else class="w-4 h-4 mr-1" />
                      {{ isSelected(course.id) ? '선택됨' : '선택하기' }}
                    </button>
                    <button
                        v-else-if="getEnrollmentStatus(course.id) === 'enrolled'"
                        @click="router.push(`/learning/${course.id}`)"
                        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                    >
                      <Play class="w-4 h-4 mr-1" />
                      이어보기
                    </button>
                    <button
                        v-else
                        @click="router.push(`/certificates?courseId=${course.id}`)"
                        class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
                    >
                      <Award class="w-4 h-4 mr-1" />
                      수료증
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 강의 없음 -->
      <div v-else class="text-center py-16">
        <component :is="getCategoryIcon()" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-medium text-gray-900 mb-2">
          {{ leafCategory }} 카테고리에 강의가 없습니다
        </h2>
        <p class="text-gray-500 mb-6">
          다른 카테고리를 확인해보세요
        </p>
        <button
            @click="router.push('/courses')"
            class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          <BookOpen class="w-5 h-5 mr-2" />
          전체 강의 보기
        </button>
      </div>
    </div>

    <!-- 하단 선택 강의 푸터 -->
    <EnrolledCoursesFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { CategoryService } from '@/services/categoryService'
import EnrolledCoursesFooter from '@/components/EnrolledCoursesFooter.vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  BookOpen,
  Users,
  Loader2,
  PlayCircle,
  User,
  Clock,
  BarChart,
  Star,
  CheckCircle,
  Play,
  Award,
  Plus,
  Check,
  Wrench,
  Hammer,
  HardHat,
  FlaskConical
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

// Props
const props = defineProps({
  leafCategory: {
    type: String,
    required: true
  }
})

// 상태
const isLoading = ref(false)
const sortBy = ref('newest')

// 필터링된 강의 목록
const filteredCourses = computed(() => {
  return courseStore.courses.filter(course => {
    const courseLeaf = course.category?.leaf
    return courseLeaf === props.leafCategory
  })
})

// 정렬된 강의 목록
const sortedCourses = computed(() => {
  const courses = [...filteredCourses.value]

  switch (sortBy.value) {
    case 'newest':
      return courses.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    case 'popular':
      return courses.sort((a, b) =>
          (b.enrolledCount || 0) - (a.enrolledCount || 0)
      )
    case 'rating':
      return courses.sort((a, b) =>
          (b.rating || 0) - (a.rating || 0)
      )
    case 'title':
      return courses.sort((a, b) =>
          a.title.localeCompare(b.title, 'ko')
      )
    default:
      return courses
  }
})

// 카테고리 경로
const getCategoryPath = () => {
  const mainCategory = CategoryService.getMainCategoryForItem(props.leafCategory)
  const middleCategories = CategoryService.getMainToMidMapping()[mainCategory] || []

  for (const middle of middleCategories) {
    const leafCategories = CategoryService.getMidToLeafMapping()[middle] || []
    if (leafCategories.includes(props.leafCategory)) {
      return `${mainCategory} > ${middle} > ${props.leafCategory}`
    }
  }

  return props.leafCategory
}

// 카테고리 설명
const getCategoryDescription = () => {
  const descriptions = {
    // 기계
    '불도저': '불도저의 안전한 조작법과 유지보수 방법을 학습합니다.',
    '크레인': '크레인 운전 및 안전 규정에 대해 배웁니다.',
    '굴착기': '굴착기 조작 기술과 현장 안전 수칙을 익힙니다.',
    'CNC 선반': 'CNC 선반 프로그래밍과 정밀 가공 기술을 학습합니다.',
    '연삭기': '연삭기 조작법과 표면 처리 기술을 배웁니다.',
    '유압 프레스': '유압 프레스의 원리와 안전한 사용법을 익힙니다.',
    '사출 성형기': '사출 성형 공정과 품질 관리 방법을 학습합니다.',
    '열 성형기': '열 성형 기술과 재료 특성을 이해합니다.',

    // 공구
    '플라이어': '플라이어의 올바른 사용법과 안전 수칙을 배웁니다.',
    '해머': '다양한 해머의 용도와 안전한 사용법을 익힙니다.',
    '그라인더': '그라인더 조작법과 연마 기술을 학습합니다.',
    '전동톱': '전동톱의 안전한 사용법과 유지보수를 배웁니다.',
    '해머드릴': '해머드릴 사용법과 천공 작업 기술을 익힙니다.',
    '전동드릴': '전동드릴의 다양한 활용법과 안전 수칙을 학습합니다.',
    '가스 용접기': '가스 용접의 원리와 안전한 작업 방법을 배웁니다.',
    '커터': '절단 공구의 종류와 올바른 사용법을 익힙니다.',
    '마이크로미터': '정밀 측정 도구 사용법과 측정 기술을 학습합니다.',
    '하이트 게이지': '높이 측정의 정확한 방법과 활용법을 배웁니다.',

    // 장비
    '헬멧': '안전 헬멧의 올바른 착용법과 관리 방법을 학습합니다.',
    '방진 마스크': '호흡기 보호구의 선택과 사용법을 익힙니다.',
    '낙하 방지벨트': '추락 방지 장비의 착용법과 점검 방법을 배웁니다.',
    '안전모': '작업 현장 안전모 규정과 관리법을 학습합니다.',
    '안전화': '안전화 선택 기준과 올바른 착용법을 익힙니다.',
    '보호안경': '눈 보호구의 종류와 상황별 사용법을 배웁니다.',
    '귀마개': '청력 보호구의 올바른 사용법을 학습합니다.',
    '보호장갑': '작업별 적합한 보호장갑 선택법을 익힙니다.',
    '호흡 보호구': '호흡 보호구의 종류와 올바른 착용법을 배웁니다.',
    '리프트 장비': '리프트 장비의 안전한 조작법을 학습합니다.',
    '체인 블록': '체인 블록 사용법과 하중 계산법을 익힙니다.',
    '호이스트': '호이스트 운영과 안전 점검 사항을 배웁니다.',

    // 약품
    '인슐린': '인슐린의 보관법과 안전한 취급 방법을 학습합니다.',
    '항생제': '항생제의 종류와 올바른 관리법을 익힙니다.',
    '황산': '황산의 위험성과 안전한 취급법을 배웁니다.',
    '염산': '염산 사용 시 안전 수칙과 응급처치법을 학습합니다.'
  }

  return descriptions[props.leafCategory] || `${props.leafCategory} 관련 전문 교육 과정입니다.`
}

// 총 수강생 수
const getTotalEnrolled = () => {
  return filteredCourses.value.reduce((sum, course) => {
    return sum + (course.enrolledCount || 0)
  }, 0)
}

// 카테고리 아이콘
const getCategoryIcon = () => {
  const mainCategory = CategoryService.getMainCategoryForItem(props.leafCategory)
  const iconMap = {
    기계: Wrench,
    공구: Hammer,
    장비: HardHat,
    약품: FlaskConical
  }
  return iconMap[mainCategory] || BookOpen
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

// 진도율 확인
const getProgress = (courseId) => {
  return courseStore.getProgress(courseId)
}

// 선택 여부 확인
const isSelected = (courseId) => {
  return courseStore.isSelected(courseId)
}

// 선택 목록에 추가
const addToSelectedList = (courseId) => {
  const result = courseStore.addToSelected(courseId)
  if (!result.success) {
    ElMessage.warning(result.message)
  }
}

// 선택 목록에서 제거
const removeFromSelectedList = (courseId) => {
  courseStore.removeFromSelected(courseId)
}

// 강의 상세로 이동
const goToCourseDetail = (courseId) => {
  router.push(`/course/${courseId}`)
}

// 마운트
onMounted(async () => {
  isLoading.value = true
  courseStore.loadSelectedFromStorage()

  if (courseStore.courses.length === 0) {
    await courseStore.loadCoursesFromFlask()
  }

  isLoading.value = false
})

// 카테고리 변경 감지
watch(() => props.leafCategory, async () => {
  isLoading.value = true
  await courseStore.loadCoursesFromFlask()
  isLoading.value = false
})
</script>

<style scoped>
/* 라인 클램프 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>