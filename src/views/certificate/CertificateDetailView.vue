<!-- web/src/views/course/CourseDetailView.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- 헤더 -->
    <div class="header-section sticky top-0 z-30">
      <div class="header-content">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            <div class="flex items-center space-x-4">
              <button
                  @click="router.back()"
                  class="back-button"
              >
                <ArrowLeft class="w-5 h-5" />
              </button>
              <h1 class="text-xl font-semibold text-gray-900">강의 상세</h1>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">
        <Loader2 class="w-10 h-10 animate-spin text-indigo-600" />
      </div>
      <p class="text-gray-600 mt-4">강의 정보를 불러오는 중...</p>
    </div>

    <!-- 메인 콘텐츠 -->
    <div v-else-if="course" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 왼쪽: 강의 정보 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 비디오 프리뷰 -->
          <div class="video-container">
            <div class="video-wrapper">
              <video
                  v-if="canShowPreview"
                  ref="videoPlayer"
                  :src="currentVideoUrl"
                  controls
                  class="video-player"
                  @loadedmetadata="onVideoMetadataLoaded"
                  @timeupdate="onVideoTimeUpdate"
              >
                브라우저가 비디오 재생을 지원하지 않습니다.
              </video>
              <div v-else class="video-placeholder">
                <div class="placeholder-content">
                  <PlayCircle class="w-16 h-16 text-gray-400 mb-4" />
                  <p class="text-gray-600 font-medium">{{ course.title }}</p>
                  <p class="text-sm text-gray-500 mt-2">
                    {{ enrollmentStatus === 'not-enrolled' ? '수강 신청 후 시청 가능' : '비디오 로딩 중...' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 언어 선택 (다국어 지원 시) -->
            <div v-if="availableLanguages.length > 1" class="language-selector">
              <select
                  v-model="selectedLanguage"
                  @change="onLanguageChange"
                  class="language-select"
              >
                <option v-for="lang in availableLanguages" :key="lang" :value="lang">
                  {{ getLanguageName(lang) }}
                </option>
              </select>
            </div>
          </div>

          <!-- 강의 정보 카드 -->
          <div class="info-card">
            <div class="info-header">
              <div :class="['category-badge', getCategoryColorClass(course.category?.main)]">
                {{ getCategoryDisplayPath(course) }}
              </div>
              <h2 class="course-title">{{ course.title }}</h2>
            </div>

            <div class="meta-grid">
              <div class="meta-card">
                <div class="meta-icon">
                  <User class="w-6 h-6" />
                </div>
                <div class="meta-content">
                  <p class="meta-label">강사</p>
                  <p class="meta-value">{{ course.instructor || '전문 강사' }}</p>
                </div>
              </div>
              <div class="meta-card">
                <div class="meta-icon">
                  <Clock class="w-6 h-6" />
                </div>
                <div class="meta-content">
                  <p class="meta-label">소요 시간</p>
                  <p class="meta-value">{{ course.duration || '30분' }}</p>
                </div>
              </div>
              <div class="meta-card">
                <div class="meta-icon">
                  <BarChart class="w-6 h-6" />
                </div>
                <div class="meta-content">
                  <p class="meta-label">난이도</p>
                  <p class="meta-value">{{ getDifficultyText(course.difficulty) }}</p>
                </div>
              </div>
              <div class="meta-card">
                <div class="meta-icon">
                  <Award class="w-6 h-6" />
                </div>
                <div class="meta-content">
                  <p class="meta-label">수료증</p>
                  <p class="meta-value">발급 가능</p>
                </div>
              </div>
            </div>

            <!-- 설명 섹션 -->
            <div class="description-section">
              <h3 class="section-title">
                <BookOpen class="w-5 h-5" />
                강의 소개
              </h3>
              <p class="description-text">{{ course.description }}</p>
            </div>

            <!-- 학습 목표 -->
            <div v-if="course.objectives && course.objectives.length > 0" class="objectives-section">
              <h3 class="section-title">
                <Target class="w-5 h-5" />
                학습 목표
              </h3>
              <ul class="objectives-list">
                <li v-for="(objective, index) in course.objectives" :key="index" class="objective-item">
                  <div class="objective-icon">
                    <CheckCircle class="w-5 h-5 text-green-500" />
                  </div>
                  <span>{{ objective }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 리뷰 섹션 -->
          <div v-if="course.rating" class="review-card">
            <h3 class="section-title">
              <Star class="w-5 h-5" />
              수강 평가
            </h3>
            <div class="rating-container">
              <div class="rating-score">
                <p class="score-number">{{ course.rating.toFixed(1) }}</p>
                <div class="stars">
                  <Star v-for="i in 5" :key="i"
                        :class="[
                          'star-icon',
                          i <= Math.round(course.rating) ? 'filled' : 'empty'
                        ]"
                  />
                </div>
                <p class="review-count">{{ course.reviewCount }}개의 평가</p>
              </div>
              <div class="rating-stats">
                <div class="stat-item">
                  <Users class="w-5 h-5" />
                  <span>{{ course.enrolledCount }}명 수강</span>
                </div>
                <div class="stat-item">
                  <CheckCircle class="w-5 h-5" />
                  <span>{{ course.completedCount }}명 수료</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 수강 정보 및 액션 -->
        <div class="lg:col-span-1">
          <div class="action-card sticky top-28">
            <!-- 수강 상태 -->
            <div v-if="enrollmentStatus === 'enrolled'" class="status-badge enrolled">
              <CheckCircle class="w-5 h-5" />
              <span>수강 중</span>
            </div>
            <div v-else-if="enrollmentStatus === 'completed'" class="status-badge completed">
              <Award class="w-5 h-5" />
              <span>수료 완료</span>
            </div>

            <!-- 진도율 (수강 중인 경우) -->
            <div v-if="enrollmentStatus === 'enrolled' && progress > 0" class="progress-section">
              <div class="progress-header">
                <span class="progress-label">학습 진도</span>
                <span class="progress-value">{{ progress }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
              </div>
            </div>

            <!-- 수료 완료 정보 -->
            <div v-if="enrollmentStatus === 'completed'" class="completion-info">
              <div class="completion-icon">
                <Award class="w-8 h-8 text-green-600" />
              </div>
              <p class="completion-text">축하합니다!</p>
              <p class="completion-subtext">이 강의를 성공적으로 수료하셨습니다.</p>

              <!-- 수료증 관련 버튼 추가 -->
              <div v-if="hasCertificate" class="mt-4">
                <button
                    @click="viewCertificate"
                    class="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-lg
                         hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Award :size="16" />
                  수료증 보기
                </button>
              </div>
              <div v-else-if="!authStore.isGuest" class="mt-4">
                <button
                    @click="generateCertificate"
                    :disabled="isGeneratingCertificate"
                    class="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-lg
                         hover:bg-green-700 transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Award v-if="!isGeneratingCertificate" :size="16" />
                  <Loader2 v-else :size="16" class="animate-spin" />
                  <span>{{ isGeneratingCertificate ? '생성 중...' : '수료증 발급받기' }}</span>
                </button>
              </div>
            </div>

            <!-- 액션 버튼들 -->
            <div class="action-buttons">
              <div v-if="enrollmentStatus === 'not-enrolled'">
                <button
                    v-if="isSelected"
                    @click="removeFromSelectedList"
                    class="btn btn-secondary"
                >
                  <Check :size="16" />
                  선택됨
                </button>
                <button
                    v-else
                    @click="addToSelectedList"
                    class="btn btn-primary"
                >
                  <Plus :size="16" />
                  선택하기
                </button>
              </div>
              <div v-else-if="enrollmentStatus === 'enrolled'">
                <button @click="goToLearning" class="btn btn-primary">
                  <Play :size="16" />
                  학습 계속하기
                </button>
              </div>
              <div v-else-if="enrollmentStatus === 'completed'">
                <button
                    v-if="hasCertificate"
                    @click="viewCertificate"
                    class="btn btn-success"
                >
                  <Award :size="16" />
                  수료증 보기
                </button>
                <button
                    v-else-if="!authStore.isGuest"
                    @click="generateCertificate"
                    :disabled="isGeneratingCertificate"
                    class="btn btn-primary"
                >
                  <Award :size="16" />
                  수료증 발급
                </button>
                <button @click="goToLearning" class="btn btn-secondary mt-2">
                  <Play :size="16" />
                  다시 보기
                </button>
              </div>

              <!-- 북마크 버튼 -->
              <button
                  v-if="!authStore.isGuest"
                  @click="toggleBookmark"
                  :class="['btn', isBookmarked ? 'btn-bookmarked' : 'btn-outline']"
              >
                <Bookmark :size="16" :fill="isBookmarked ? 'currentColor' : 'none'" />
                {{ isBookmarked ? '북마크됨' : '북마크' }}
              </button>
            </div>

            <!-- 선택 완료 메시지 -->
            <Transition name="fade">
              <div v-if="showSelectionMessage" class="selection-message">
                <CheckCircle class="w-5 h-5 text-green-600" />
                <span>선택 목록에 추가되었습니다</span>
              </div>
            </Transition>

            <!-- 강의 정보 -->
            <div class="course-info-section">
              <h4 class="info-title">강의 정보</h4>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">강의 ID</span>
                  <span class="info-value">{{ course.id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">등록일</span>
                  <span class="info-value">{{ formatDate(course.createdAt) }}</span>
                </div>
                <div v-if="course.hasMultipleLanguages" class="info-item">
                  <span class="info-label">지원 언어</span>
                  <span class="info-value">{{ availableLanguages.length }}개</span>
                </div>
              </div>
            </div>

            <!-- QR 코드 정보 (있는 경우) -->
            <div v-if="course.qrUrl" class="qr-section">
              <h4 class="info-title">
                <QrCode class="w-5 h-5" />
                QR 코드
              </h4>
              <p class="qr-text">QR 코드로 빠르게 접근할 수 있습니다</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 개발 정보 (개발 환경에서만) -->
      <div v-if="isDevelopment" class="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 class="font-semibold mb-2">개발 정보</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Course ID:</strong> {{ course.id }}</p>
            <p><strong>Video URL:</strong> {{ course.videoUrl }}</p>
            <p><strong>Current Video URL:</strong> {{ currentVideoUrl }}</p>
            <p><strong>Has Video:</strong> {{ course.hasVideo ? 'Yes' : 'No' }}</p>
          </div>
          <div>
            <p><strong>Languages:</strong> {{ availableLanguages.join(', ') }}</p>
            <p><strong>Selected Language:</strong> {{ selectedLanguage }}</p>
            <p><strong>Enrollment Status:</strong> {{ enrollmentStatus }}</p>
            <p><strong>Is Selected:</strong> {{ isSelected ? 'Yes' : 'No' }}</p>
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
import { useCertificateStore } from '@/stores/certificate'
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
  Bookmark,
  BookOpen,
  Target,
  MessageSquare,
  Users,
  Globe,
  Link
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()
const authStore = useAuthStore()
const certificateStore = useCertificateStore()

// 개발 환경 확인
const isDevelopment = computed(() => import.meta.env.DEV)

// 상태
const isLoading = ref(true)
const course = ref(null)
const selectedLanguage = ref('ko')
const availableLanguages = ref(['ko']) // 기본값 설정
const currentVideoUrl = ref('')
const currentVideoMetadata = ref(null)
const isBookmarked = ref(false)
const showSelectionMessage = ref(false)

// 수료증 관련 상태
const isGeneratingCertificate = ref(false)
const hasCertificate = ref(false)

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
        await courseStore.loadCoursesFromFirestore()
      }
      course.value = courseStore.getCourseById(courseId.value)
    }

    if (course.value) {
      console.log('✅ 강의 로드 성공:', {
        id: course.value.id,
        title: course.value.title,
        hasVideoUrl: !!course.value.videoUrl,
        supportedLanguages: course.value.supported_languages_count
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
        course.value.id, // courseId를 전달
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
  if (!course.value?.id) return

  try {
    const result = await CourseService.getAvailableLanguages(course.value.id)
    if (result && result.languages) {
      availableLanguages.value = result.languages
    }
  } catch (error) {
    console.error('언어 목록 로드 실패:', error)
    availableLanguages.value = ['ko'] // 오류 시 기본값
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

// 카테고리 색상 클래스
const getCategoryColorClass = (mainCategory) => {
  const colorMap = {
    '기계': 'category-machine',
    '공구': 'category-tool',
    '장비': 'category-equipment',
    '약품': 'category-medicine'
  }
  return colorMap[mainCategory] || 'category-default'
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

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
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

// 북마크 토글
const toggleBookmark = async () => {
  try {
    isBookmarked.value = !isBookmarked.value
    ElMessage.success(isBookmarked.value ? '북마크에 추가되었습니다' : '북마크가 제거되었습니다')
  } catch (error) {
    console.error('북마크 처리 실패:', error)
    isBookmarked.value = !isBookmarked.value
  }
}

// 언어 변경
const onLanguageChange = async () => {
  await loadFirebaseVideo()
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

// 수료증 확인 함수
const checkCertificate = async () => {
  if (!authStore.isAuthenticated || authStore.isGuest || !course.value) return

  try {
    const result = await certificateStore.checkCourseCertificate(
        authStore.user.uid,
        course.value.id
    )
    hasCertificate.value = result.hasCertificate
  } catch (error) {
    console.error('수료증 확인 오류:', error)
  }
}

// 수료증 생성 함수
const generateCertificate = async () => {
  if (!authStore.isAuthenticated || authStore.isGuest) {
    ElMessage.warning('로그인 후 수료증을 받을 수 있습니다')
    return
  }

  try {
    isGeneratingCertificate.value = true

    // 수료증 데이터 준비
    const certificateData = {
      userId: authStore.user.uid,
      courseId: course.value.id,
      courseName: course.value.title,
      userName: authStore.user.displayName || authStore.user.email.split('@')[0],
      birthDate: authStore.user.birthDate || '1990.01.01',
      completedDate: new Date()
    }

    const result = await certificateStore.createCertificate(certificateData)

    if (result.success) {
      ElMessage.success('수료증이 발급되었습니다!')
      hasCertificate.value = true

      // 수료증 페이지로 이동
      setTimeout(() => {
        router.push(`/certificates/${result.certificate.certificateId}`)
      }, 1500)
    } else {
      throw new Error(result.error || '수료증 생성 실패')
    }
  } catch (error) {
    console.error('수료증 생성 오류:', error)
    ElMessage.error('수료증 생성 중 오류가 발생했습니다')
  } finally {
    isGeneratingCertificate.value = false
  }
}

// 수료증 보기 함수
const viewCertificate = async () => {
  const cert = certificateStore.getCertificateByCourse(course.value.id)
  if (cert) {
    router.push(`/certificates/${cert.id}`)
  } else {
    // 다시 확인
    await checkCertificate()
    if (hasCertificate.value) {
      const cert = certificateStore.getCertificateByCourse(course.value.id)
      if (cert) {
        router.push(`/certificates/${cert.id}`)
      }
    }
  }
}

// 언어 변경 감시
watch(selectedLanguage, () => {
  loadFirebaseVideo()
})

// 마운트 시
onMounted(async () => {
  await loadCourseDetail()

  if (course.value) {
    await loadAvailableLanguages()
    await loadFirebaseVideo()
    await checkCertificate()
  }
})
</script>

<style scoped>
/* 헤더 스타일 */
.header-section {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
}

.header-content {
  backdrop-filter: saturate(180%) blur(20px);
}

.back-button {
  @apply p-2 rounded-lg hover:bg-gray-100 transition-colors;
}

/* 로딩 스타일 */
.loading-container {
  @apply flex flex-col items-center justify-center min-h-[60vh];
}

.loading-spinner {
  @apply flex items-center justify-center;
}

/* 비디오 컨테이너 */
.video-container {
  @apply bg-white rounded-xl shadow-lg overflow-hidden;
}

.video-wrapper {
  @apply relative aspect-video bg-black;
}

.video-player {
  @apply w-full h-full;
}

.video-placeholder {
  @apply absolute inset-0 flex items-center justify-center bg-gray-900;
}

.placeholder-content {
  @apply text-center;
}

.language-selector {
  @apply p-4 border-t border-gray-200;
}

.language-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500;
}

/* 정보 카드 */
.info-card {
  @apply bg-white rounded-xl shadow-lg p-6 space-y-6;
}

.info-header {
  @apply space-y-3;
}

.category-badge {
  @apply inline-block px-3 py-1 text-sm font-medium rounded-full;
}

.category-machine {
  @apply bg-blue-100 text-blue-800;
}

.category-tool {
  @apply bg-green-100 text-green-800;
}

.category-equipment {
  @apply bg-purple-100 text-purple-800;
}

.category-medicine {
  @apply bg-orange-100 text-orange-800;
}

.category-default {
  @apply bg-gray-100 text-gray-800;
}

.course-title {
  @apply text-2xl font-bold text-gray-900;
}

/* 메타 그리드 */
.meta-grid {
  @apply grid grid-cols-2 gap-4;
}

.meta-card {
  @apply flex items-start space-x-3 p-4 bg-gray-50 rounded-lg;
}

.meta-icon {
  @apply flex-shrink-0 p-2 bg-white rounded-lg text-gray-600;
}

.meta-content {
  @apply flex-1;
}

.meta-label {
  @apply text-sm text-gray-600;
}

.meta-value {
  @apply font-semibold text-gray-900;
}

/* 섹션 스타일 */
.section-title {
  @apply flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-3;
}

.description-section {
  @apply space-y-3;
}

.description-text {
  @apply text-gray-700 leading-relaxed;
}

.objectives-section {
  @apply space-y-3;
}

.objectives-list {
  @apply space-y-2;
}

.objective-item {
  @apply flex items-start space-x-2;
}

.objective-icon {
  @apply flex-shrink-0 mt-0.5;
}

/* 리뷰 카드 */
.review-card {
  @apply bg-white rounded-xl shadow-lg p-6;
}

.rating-container {
  @apply flex items-start justify-between;
}

.rating-score {
  @apply text-center;
}

.score-number {
  @apply text-3xl font-bold text-gray-900;
}

.stars {
  @apply flex justify-center mt-2 mb-1;
}

.star-icon {
  @apply w-5 h-5;
}

.star-icon.filled {
  @apply text-yellow-400 fill-current;
}

.star-icon.empty {
  @apply text-gray-300;
}

.review-count {
  @apply text-sm text-gray-600;
}

.rating-stats {
  @apply space-y-2;
}

.stat-item {
  @apply flex items-center space-x-2 text-sm text-gray-600;
}

/* 액션 카드 */
.action-card {
  @apply bg-white rounded-xl shadow-lg p-6 space-y-4;
}

.status-badge {
  @apply flex items-center space-x-2 px-3 py-2 rounded-lg font-medium;
}

.status-badge.enrolled {
  @apply bg-blue-50 text-blue-700;
}

.status-badge.completed {
  @apply bg-green-50 text-green-700;
}

/* 진도 섹션 */
.progress-section {
  @apply space-y-2;
}

.progress-header {
  @apply flex items-center justify-between text-sm;
}

.progress-label {
  @apply text-gray-600;
}

.progress-value {
  @apply font-semibold text-gray-900;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-blue-600 transition-all duration-300 ease-out;
}

/* 수료 완료 정보 */
.completion-info {
  @apply text-center py-4;
}

.completion-icon {
  @apply flex justify-center mb-3;
}

.completion-text {
  @apply text-lg font-semibold text-gray-900;
}

.completion-subtext {
  @apply text-sm text-gray-600 mt-1;
}

/* 액션 버튼 */
.action-buttons {
  @apply space-y-2;
}

.btn {
  @apply w-full px-4 py-2.5 font-medium rounded-lg transition-all duration-200;
  @apply flex items-center justify-center gap-2;
}

.btn-primary {
  @apply bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300;
}

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700 active:bg-green-800;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100;
}

.btn-bookmarked {
  @apply bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100;
}

/* 선택 메시지 */
.selection-message {
  @apply flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg;
  @apply text-sm font-medium;
}

/* 정보 섹션 */
.course-info-section {
  @apply pt-4 border-t border-gray-200;
}

.info-title {
  @apply flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-3;
}

.info-list {
  @apply space-y-2;
}

.info-item {
  @apply flex items-center justify-between text-sm;
}

.info-label {
  @apply text-gray-600;
}

.info-value {
  @apply font-medium text-gray-900;
}

/* QR 섹션 */
.qr-section {
  @apply pt-4 border-t border-gray-200;
}

.qr-text {
  @apply text-sm text-gray-600 mt-2;
}

/* 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .meta-grid {
    @apply grid-cols-1;
  }

  .action-card {
    @apply relative mt-6;
  }
}

@media (max-width: 640px) {
  .course-title {
    @apply text-xl;
  }

  .rating-container {
    @apply flex-col space-y-4;
  }
}