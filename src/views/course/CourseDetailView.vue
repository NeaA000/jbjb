<!-- web/src/views/course/CourseDetailView.vue -->
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
            <h1 class="text-xl font-semibold text-gray-900">강의 상세</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="flex items-center space-x-2">
        <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
        <span class="text-gray-600">강의 정보를 불러오는 중...</span>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div v-else-if="course" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 왼쪽: 강의 정보 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 비디오 프리뷰 -->
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="aspect-video bg-gray-900 relative">
              <video
                  v-if="canShowPreview"
                  ref="videoPlayer"
                  :src="currentVideoUrl"
                  controls
                  class="w-full h-full"
                  @loadedmetadata="onVideoMetadataLoaded"
                  @timeupdate="onVideoTimeUpdate"
              >
                브라우저가 비디오 재생을 지원하지 않습니다.
              </video>
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <PlayCircle class="w-20 h-20 text-gray-600 mx-auto mb-4" />
                  <p class="text-gray-400 mb-4">강의를 신청하면 미리보기가 가능합니다</p>
                  <button
                      @click="addToSelectedList"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    강의 신청하기
                  </button>
                </div>
              </div>
            </div>

            <!-- 언어 선택 (로그인 사용자만) -->
            <div v-if="availableLanguages.length > 1 && !authStore.isGuest" class="p-4 border-t">
              <div class="flex items-center space-x-3">
                <span class="text-sm font-medium text-gray-700">자막 언어:</span>
                <div class="flex gap-2">
                  <button
                      v-for="lang in availableLanguages"
                      :key="lang"
                      @click="selectedLanguage = lang"
                      :class="[
                      'px-3 py-1 text-sm rounded-lg transition-colors',
                      selectedLanguage === lang
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    ]"
                  >
                    {{ getLanguageName(lang) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 강의 정보 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">
              {{ course.title }}
            </h1>

            <!-- 카테고리 및 태그 -->
            <div class="flex flex-wrap items-center gap-2 mb-4">
              <span
                  :class="getCategoryStyle(course.category?.leaf || '기타')"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ getCategoryDisplayPath(course) }}
              </span>
              <span
                  v-for="tag in course.tags"
                  :key="tag"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- 메타 정보 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <User class="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <p class="text-xs text-gray-500">강사</p>
                <p class="text-sm font-medium text-gray-900">{{ course.instructor || '전문 강사' }}</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <Clock class="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <p class="text-xs text-gray-500">소요 시간</p>
                <p class="text-sm font-medium text-gray-900">{{ course.duration || '30분' }}</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <BarChart class="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <p class="text-xs text-gray-500">난이도</p>
                <p class="text-sm font-medium text-gray-900">{{ getDifficultyText(course.difficulty) }}</p>
              </div>
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <Award class="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <p class="text-xs text-gray-500">수료증</p>
                <p class="text-sm font-medium text-gray-900">발급 가능</p>
              </div>
            </div>

            <!-- 설명 -->
            <div class="prose prose-gray max-w-none">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">강의 소개</h3>
              <p class="text-gray-600 whitespace-pre-wrap">{{ course.description }}</p>
            </div>

            <!-- 학습 목표 -->
            <div v-if="course.objectives && course.objectives.length > 0" class="mt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">학습 목표</h3>
              <ul class="space-y-2">
                <li v-for="(objective, index) in course.objectives" :key="index" class="flex items-start">
                  <CheckCircle class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span class="text-gray-600">{{ objective }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 리뷰 섹션 (있는 경우) -->
          <div v-if="course.rating" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">수강 평가</h3>
            <div class="flex items-center space-x-4">
              <div class="text-center">
                <p class="text-3xl font-bold text-gray-900">{{ course.rating.toFixed(1) }}</p>
                <div class="flex items-center justify-center mt-1">
                  <Star v-for="i in 5" :key="i"
                        :class="[
                      'w-5 h-5',
                      i <= Math.round(course.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    ]"
                  />
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-600">
                  {{ course.reviewCount || 0 }}개의 평가
                </p>
                <p class="text-sm text-gray-600">
                  {{ course.enrolledCount || 0 }}명 수강
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 수강 신청 카드 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <!-- 수강 상태 -->
            <div v-if="enrollmentStatus !== 'not-enrolled'" class="mb-4">
              <div v-if="enrollmentStatus === 'completed'"
                   class="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center space-x-2 text-green-800">
                  <Award class="w-5 h-5" />
                  <span class="font-medium">수료 완료</span>
                </div>
                <p class="text-sm text-green-600 mt-1">
                  수료증을 다운로드할 수 있습니다
                </p>
              </div>
              <div v-else class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center space-x-2 text-blue-800">
                  <Play class="w-5 h-5" />
                  <span class="font-medium">수강 중</span>
                </div>
                <div class="mt-2">
                  <div class="flex justify-between text-sm text-blue-600 mb-1">
                    <span>진도율</span>
                    <span>{{ progress }}%</span>
                  </div>
                  <div class="w-full bg-blue-100 rounded-full h-2">
                    <div
                        :style="{ width: `${progress}%` }"
                        class="bg-blue-600 h-2 rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- QR 스캔 표시 -->
            <div v-if="course.isQRAccess" class="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div class="flex items-center space-x-2 text-purple-800">
                <QrCode class="w-4 h-4" />
                <span class="text-sm">QR 코드로 접근한 강의</span>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="space-y-3">
              <!-- 수강 신청/선택 버튼 -->
              <button
                  v-if="enrollmentStatus === 'not-enrolled'"
                  @click="isSelected ? removeFromSelectedList() : addToSelectedList()"
                  :class="[
                  'w-full py-3 px-4 font-medium rounded-lg transition-colors inline-flex items-center justify-center',
                  isSelected
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                ]"
              >
                <Check v-if="isSelected" class="w-5 h-5 mr-2" />
                <Plus v-else class="w-5 h-5 mr-2" />
                {{ isSelected ? '선택됨' : '수강 신청하기' }}
              </button>

              <!-- 학습하기 버튼 -->
              <button
                  v-else-if="enrollmentStatus === 'enrolled'"
                  @click="goToLearning"
                  class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <Play class="w-5 h-5 mr-2" />
                {{ progress > 0 ? '이어서 학습하기' : '학습 시작하기' }}
              </button>

              <!-- 수료증 다운로드 버튼 -->
              <button
                  v-else-if="enrollmentStatus === 'completed'"
                  @click="downloadCertificate"
                  class="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center"
              >
                <Award class="w-5 h-5 mr-2" />
                수료증 다운로드
              </button>

              <!-- 북마크 버튼 -->
              <button
                  @click="toggleBookmark"
                  class="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
              >
                <Bookmark :class="['w-5 h-5 mr-2', { 'fill-current': isBookmarked }]" />
                {{ isBookmarked ? '북마크 제거' : '북마크 추가' }}
              </button>
            </div>

            <!-- 선택 알림 메시지 -->
            <Transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 transform translate-y-2"
                enter-to-class="opacity-100 transform translate-y-0"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
              <div v-if="showSelectionMessage" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-sm text-green-800">
                  <CheckCircle class="w-4 h-4 inline mr-1" />
                  강의가 선택되었습니다. 하단에서 확인하세요.
                </p>
              </div>
            </Transition>

            <!-- 게스트 안내 -->
            <div v-if="authStore.isGuest" class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-sm text-amber-800">
                <AlertCircle class="w-4 h-4 inline mr-1" />
                게스트는 수료증을 받을 수 없습니다
              </p>
            </div>

            <!-- 개발 환경 디버그 정보 -->
            <div v-if="isDevelopment" class="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
              <p class="font-semibold mb-1">Debug Info:</p>
              <p>Course ID: {{ course.id }}</p>
              <p>Status: {{ enrollmentStatus }}</p>
              <p>Progress: {{ progress }}%</p>
              <p>Selected: {{ isSelected }}</p>
            </div>
          </div>
        </div>
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
import { useAuthStore } from '@/stores/auth'
import { CategoryService } from '@/services/categoryService'
import CourseService from '@/services/courseService'
import { SUPPORTED_LANGUAGES } from '@/utils/constants'
import EnrolledCoursesFooter from '@/components/EnrolledCoursesFooter.vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Play,
  Award,
  Loader2,
  AlertCircle,
  Star,
  User,
  CheckCircle,
  QrCode,
  Plus,
  Check,
  Clock,
  BarChart,
  PlayCircle,
  Bookmark
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 개발 환경 확인
const isDevelopment = computed(() => import.meta.env.DEV)

// 상태
const isLoading = ref(true)
const course = ref(null)
const selectedLanguage = ref('ko')
const availableLanguages = ref([])
const currentVideoUrl = ref('')
const currentVideoMetadata = ref(null)
const isBookmarked = ref(false)
const showSelectionMessage = ref(false)

// 비디오 플레이어 상태
const videoPlayer = ref(null)
const isVideoPlaying = ref(false)
const videoCurrentTime = ref(0)
const videoDuration = ref(0)

// 강의 ID
const courseId = computed(() => route.params.id)

// 강의 정보
const enrollmentStatus = computed(() =>
    course.value ? courseStore.getEnrollmentStatus(course.value.id) : 'not-enrolled'
)

const progress = computed(() =>
    course.value ? courseStore.getProgress(course.value.id) : 0
)

const isSelected = computed(() =>
    course.value ? courseStore.isSelected(course.value.id) : false
)

const canShowPreview = computed(() => {
  return currentVideoUrl.value && (
      enrollmentStatus.value !== 'not-enrolled' ||
      authStore.isGuest
  )
})

// 강의 상세 정보 로드
const loadCourseDetail = async () => {
  try {
    isLoading.value = true

    // Firebase에서 직접 로드
    course.value = await courseStore.getCourseDetails(courseId.value)

    if (!course.value) {
      // 캐시된 데이터에서 찾기
      if (courseStore.courses.length === 0) {
        await courseStore.loadCoursesFromFlask()
      }
      course.value = courseStore.getCourseById(courseId.value)
    }

    if (course.value) {
      console.log('✅ 강의 로드 성공:', {
        id: course.value.id,
        title: course.value.title,
        hasVideoUrl: !!course.value.videoUrl
      })
    } else {
      throw new Error('강의를 찾을 수 없습니다')
    }
  } catch (error) {
    console.error('강의 로드 실패:', error)
    ElMessage.error('강의 정보를 불러올 수 없습니다.')
    router.push('/courses')
  } finally {
    isLoading.value = false
  }
}

// Firebase 비디오 로드
const loadFirebaseVideo = async () => {
  if (!course.value?.videoUrl) return

  try {
    const { videoUrl, metadata } = await CourseService.getVideoUrl(
        course.value.videoUrl,
        selectedLanguage.value
    )

    if (videoUrl) {
      currentVideoUrl.value = videoUrl
      currentVideoMetadata.value = metadata
    }
  } catch (error) {
    console.error('비디오 로드 실패:', error)
  }
}

// 사용 가능한 언어 로드
const loadAvailableLanguages = async () => {
  if (!course.value?.videoUrl) return

  try {
    const { languages } = await CourseService.getAvailableLanguages(course.value.videoUrl)
    availableLanguages.value = languages
  } catch (error) {
    console.error('언어 목록 로드 실패:', error)
  }
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

// 언어 이름
const getLanguageName = (langCode) => {
  return SUPPORTED_LANGUAGES[langCode] || langCode.toUpperCase()
}

// 선택 목록에 추가
const addToSelectedList = () => {
  const result = courseStore.addToSelected(course.value.id)

  if (result.success) {
    showSelectionMessage.value = true
    setTimeout(() => {
      showSelectionMessage.value = false
    }, 3000)
  }
}

// 선택 목록에서 제거
const removeFromSelectedList = () => {
  courseStore.removeFromSelected(course.value.id)
}

// 학습 페이지로 이동
const goToLearning = () => {
  if (authStore.isGuest) {
    router.push(`/learning/${course.value.id}`)
  } else {
    router.push(`/video-warning/${course.value.id}`)
  }
}

// 수료증 다운로드
const downloadCertificate = () => {
  router.push(`/certificates?courseId=${course.value.id}`)
}

// 북마크 토글
const toggleBookmark = async () => {
  try {
    isBookmarked.value = !isBookmarked.value
    ElMessage.success(isBookmarked.value ? '북마크에 추가되었습니다' : '북마크가 제거되었습니다')
  } catch (error) {
    console.error('북마크 토글 실패:', error)
    isBookmarked.value = !isBookmarked.value
  }
}

// 비디오 메타데이터 로드
const onVideoMetadataLoaded = () => {
  if (videoPlayer.value) {
    videoDuration.value = videoPlayer.value.duration
  }
}

// 비디오 시간 업데이트
const onVideoTimeUpdate = () => {
  if (videoPlayer.value) {
    videoCurrentTime.value = videoPlayer.value.currentTime
  }
}

// 언어 변경 감지
watch(selectedLanguage, () => {
  loadFirebaseVideo()
})

// 마운트
onMounted(async () => {
  await loadCourseDetail()
  await loadFirebaseVideo()
  await loadAvailableLanguages()
  courseStore.loadSelectedFromStorage()
})
</script>

<style scoped>
/* 스티키 포지셔닝 조정 */
@media (min-width: 1024px) {
  .sticky {
    position: sticky;
  }
}
</style>