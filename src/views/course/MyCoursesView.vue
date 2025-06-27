<!-- web/src/views/course/MyCoursesView.vue -->
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
            <h1 class="text-xl font-semibold text-gray-900">내 강의실</h1>
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

    <!-- 탭 메뉴 -->
    <div class="bg-white border-b border-gray-200 sticky top-16 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
            <span
                v-if="getTabCount(tab.id) > 0"
                :class="[
                'ml-2 px-2 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ getTabCount(tab.id) }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div class="flex items-center space-x-2">
          <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
          <span class="text-gray-600">강의를 불러오는 중...</span>
        </div>
      </div>

      <!-- 강의 목록 -->
      <div v-else>
        <!-- 진행 중인 강의 -->
        <div v-if="activeTab === 'in-progress'" class="space-y-4">
          <div v-if="inProgressCourses.length === 0" class="text-center py-16">
            <BookOpen class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 class="text-xl font-medium text-gray-900 mb-2">진행 중인 강의가 없습니다</h2>
            <p class="text-gray-500 mb-6">새로운 강의를 시작해보세요!</p>
            <button
                @click="router.push('/courses')"
                class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus class="w-5 h-5 mr-2" />
              강의 둘러보기
            </button>
          </div>

          <div
              v-for="enrollment in inProgressCourses"
              :key="enrollment.id"
              class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div class="p-6">
              <div class="flex items-start space-x-4">
                <!-- 썸네일 -->
                <div class="flex-shrink-0 w-48 h-27 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                      v-if="enrollment.course?.thumbnail"
                      :src="enrollment.course.thumbnail"
                      :alt="enrollment.course.title"
                      class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <PlayCircle class="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                <!-- 강의 정보 -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">
                    {{ enrollment.course?.title }}
                  </h3>

                  <!-- 카테고리 -->
                  <div class="mb-2">
                    <span
                        :class="getCategoryStyle(enrollment.course?.category?.leaf || '기타')"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ getCategoryDisplayPath(enrollment.course) }}
                    </span>
                  </div>

                  <!-- 진도율 -->
                  <div class="mb-3">
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                      <span>진도율</span>
                      <span class="font-medium">{{ enrollment.progress }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                          :style="{ width: `${enrollment.progress}%` }"
                          class="bg-blue-600 h-2 rounded-full transition-all"
                      ></div>
                    </div>
                  </div>

                  <!-- 메타 정보 -->
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span class="flex items-center">
                      <Clock class="w-4 h-4 mr-1" />
                      {{ getRemainingTime(enrollment) }}
                    </span>
                    <span class="flex items-center">
                      <Calendar class="w-4 h-4 mr-1" />
                      {{ formatDate(enrollment.enrolledAt) }} 시작
                    </span>
                  </div>
                </div>

                <!-- 액션 버튼 -->
                <div class="flex-shrink-0">
                  <button
                      @click="continueLearning(enrollment.courseId)"
                      class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Play class="w-5 h-5 mr-2" />
                    이어보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 완료한 강의 -->
        <div v-else-if="activeTab === 'completed'" class="space-y-4">
          <div v-if="completedCourses.length === 0" class="text-center py-16">
            <Award class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 class="text-xl font-medium text-gray-900 mb-2">완료한 강의가 없습니다</h2>
            <p class="text-gray-500">강의를 완료하면 수료증을 받을 수 있습니다!</p>
          </div>

          <div
              v-for="enrollment in completedCourses"
              :key="enrollment.id"
              class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div class="p-6">
              <div class="flex items-start space-x-4">
                <!-- 썸네일 -->
                <div class="flex-shrink-0 w-48 h-27 bg-gray-100 rounded-lg overflow-hidden relative">
                  <img
                      v-if="enrollment.course?.thumbnail"
                      :src="enrollment.course.thumbnail"
                      :alt="enrollment.course.title"
                      class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <PlayCircle class="w-12 h-12 text-gray-400" />
                  </div>
                  <!-- 완료 오버레이 -->
                  <div class="absolute inset-0 bg-green-600 bg-opacity-20 flex items-center justify-center">
                    <div class="bg-white rounded-full p-2">
                      <CheckCircle class="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                <!-- 강의 정보 -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">
                    {{ enrollment.course?.title }}
                  </h3>

                  <!-- 카테고리 -->
                  <div class="mb-2">
                    <span
                        :class="getCategoryStyle(enrollment.course?.category?.leaf || '기타')"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ getCategoryDisplayPath(enrollment.course) }}
                    </span>
                  </div>

                  <!-- 완료 정보 -->
                  <div class="mb-3">
                    <p class="text-sm text-green-600 font-medium">
                      <CheckCircle class="w-4 h-4 inline mr-1" />
                      {{ formatDate(enrollment.completedAt) }} 수료
                    </p>
                  </div>

                  <!-- 메타 정보 -->
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span class="flex items-center">
                      <Clock class="w-4 h-4 mr-1" />
                      {{ enrollment.course?.duration || '30분' }}
                    </span>
                    <span v-if="enrollment.course?.rating" class="flex items-center">
                      <Star class="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                      {{ enrollment.course.rating.toFixed(1) }}
                    </span>
                  </div>
                </div>

                <!-- 액션 버튼 -->
                <div class="flex-shrink-0 space-y-2">
                  <button
                      @click="viewCertificate(enrollment.courseId)"
                      class="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center"
                  >
                    <Award class="w-5 h-5 mr-2" />
                    수료증 보기
                  </button>
                  <button
                      @click="reviewCourse(enrollment.courseId)"
                      class="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
                  >
                    <RefreshCw class="w-5 h-5 mr-2" />
                    다시 보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 전체 강의 -->
        <div v-else class="space-y-4">
          <div v-if="allEnrollments.length === 0" class="text-center py-16">
            <BookOpen class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 class="text-xl font-medium text-gray-900 mb-2">신청한 강의가 없습니다</h2>
            <p class="text-gray-500 mb-6">관심있는 강의를 신청해보세요!</p>
            <button
                @click="router.push('/courses')"
                class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus class="w-5 h-5 mr-2" />
              강의 둘러보기
            </button>
          </div>

          <!-- 강의 카드 목록은 위와 동일한 구조 -->
          <div
              v-for="enrollment in allEnrollments"
              :key="enrollment.id"
              class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <!-- 진행중/완료 강의와 동일한 구조 사용 -->
          </div>
        </div>
      </div>
    </div>
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

// 마운트
onMounted(async () => {
  isLoading.value = true

  // 강의 데이터 로드
  if (courseStore.courses.length === 0) {
    await courseStore.loadCoursesFromFlask()
  }

  // 사용자 수강 정보 로드
  await courseStore.loadUserEnrollments()

  isLoading.value = false
})
</script>

<style scoped>
/* 탭 애니메이션 */
.border-b-2 {
  transition: border-color 0.3s ease;
}
</style>