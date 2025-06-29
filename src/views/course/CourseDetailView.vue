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
                  <div class="play-icon-wrapper">
                    <PlayCircle class="w-24 h-24 text-white" />
                  </div>
                  <p class="text-white text-lg font-medium mb-4">강의를 신청하면 미리보기가 가능합니다</p>
                  <button
                      @click="addToSelectedList"
                      class="preview-button"
                  >
                    <Plus class="w-5 h-5 mr-2" />
                    강의 신청하기
                  </button>
                </div>
              </div>
            </div>

            <!-- 언어 선택 (로그인 사용자만, 여러 언어가 있을 때만) -->
            <div v-if="availableLanguages && availableLanguages.length > 1 && !authStore.isGuest" class="language-selector">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">자막 언어</span>
                <div class="language-buttons">
                  <button
                      v-for="lang in availableLanguages"
                      :key="lang"
                      @click="selectedLanguage = lang"
                      :class="[
                        'language-button',
                        selectedLanguage === lang ? 'active' : ''
                      ]"
                  >
                    {{ getLanguageName(lang) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 강의 정보 카드 -->
          <div class="info-card">
            <h1 class="course-main-title">
              {{ course.title }}
            </h1>

            <!-- 카테고리 및 태그 -->
            <div class="tags-section">
              <span class="category-tag" :class="getCategoryColorClass(course.category?.main)">
                {{ getCategoryDisplayPath(course) }}
              </span>
              <span
                  v-for="tag in course.tags"
                  :key="tag"
                  class="tag"
              >
                #{{ tag }}
              </span>

              <!-- Firebase 메타데이터 기반 배지들 -->
              <span v-if="course.translation_status === 'completed'" class="status-tag completed">
                <CheckCircle class="w-3.5 h-3.5" />
                번역 완료
              </span>
              <span v-if="course.qr_combined_enabled" class="status-tag qr">
                <QrCode class="w-3.5 h-3.5" />
                QR 학습
              </span>
              <span v-if="course.supported_languages_count && course.supported_languages_count > 1" class="status-tag language">
                <Globe class="w-3.5 h-3.5" />
                {{ course.supported_languages_count }}개 언어
              </span>
            </div>

            <!-- 메타 정보 그리드 -->
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
                          i <= Math.round(course.rating) ? 'filled' : ''
                        ]"
                  />
                </div>
              </div>
              <div class="rating-info">
                <div class="info-item">
                  <MessageSquare class="w-4 h-4" />
                  <span>{{ course.reviewCount || 0 }}개의 평가</span>
                </div>
                <div class="info-item">
                  <Users class="w-4 h-4" />
                  <span>{{ course.enrolledCount || 0 }}명 수강</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 수강 신청 카드 -->
        <div class="lg:col-span-1">
          <div class="enrollment-card">
            <!-- 수강 상태 -->
            <div v-if="enrollmentStatus !== 'not-enrolled'" class="status-section">
              <div v-if="enrollmentStatus === 'completed'" class="status-card completed">
                <Award class="w-6 h-6" />
                <div>
                  <p class="status-title">수료 완료</p>
                  <p class="status-subtitle">수료증을 다운로드할 수 있습니다</p>
                </div>
              </div>
              <div v-else class="status-card enrolled">
                <Play class="w-6 h-6" />
                <div class="flex-1">
                  <p class="status-title">수강 중</p>
                  <div class="progress-container">
                    <div class="progress-info">
                      <span>진도율</span>
                      <span>{{ progress }}%</span>
                    </div>
                    <div class="progress-bar">
                      <div
                          :style="{ width: `${progress}%` }"
                          class="progress-fill"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Firebase 메타데이터 표시 -->
            <div v-if="course.isQRAccess || course.qr_combined_enabled" class="qr-info-card">
              <QrCode class="w-5 h-5" />
              <div>
                <p class="font-medium">QR 코드 학습 지원</p>
                <p class="text-xs text-purple-600">스마트폰으로 간편하게 학습하세요</p>
              </div>
            </div>

            <!-- 영구 링크 정보 -->
            <div v-if="course.permanent_links" class="permanent-link-info">
              <Link class="w-4 h-4" />
              <span class="text-sm">영구 링크 제공</span>
            </div>

            <!-- 액션 버튼들 -->
            <div class="action-buttons">
              <!-- 수강 신청/선택 버튼 -->
              <button
                  v-if="enrollmentStatus === 'not-enrolled'"
                  @click="isSelected ? removeFromSelectedList() : addToSelectedList()"
                  :class="[
                    'main-action-button',
                    isSelected ? 'selected' : 'primary'
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
                  class="main-action-button learning"
              >
                <Play class="w-5 h-5 mr-2" />
                {{ progress > 0 ? '이어서 학습하기' : '학습 시작하기' }}
              </button>

              <!-- 수료증 다운로드 버튼 -->
              <button
                  v-else-if="enrollmentStatus === 'completed'"
                  @click="downloadCertificate"
                  class="main-action-button certificate"
              >
                <Award class="w-5 h-5 mr-2" />
                수료증 다운로드
              </button>

              <!-- 북마크 버튼 -->
              <button
                  @click="toggleBookmark"
                  class="secondary-action-button"
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
              <div v-if="showSelectionMessage" class="selection-message">
                <CheckCircle class="w-5 h-5" />
                <p>강의가 선택되었습니다. 하단에서 확인하세요.</p>
              </div>
            </Transition>

            <!-- 게스트 안내 -->
            <div v-if="authStore.isGuest" class="guest-notice">
              <AlertCircle class="w-5 h-5" />
              <p>게스트는 수료증을 받을 수 없습니다</p>
            </div>

            <!-- 개발 환경 디버그 정보 -->
            <div v-if="isDevelopment" class="debug-info">
              <p class="font-semibold mb-2">Debug Info:</p>
              <div class="debug-content">
                <p>Course ID: {{ course.id }}</p>
                <p>Status: {{ enrollmentStatus }}</p>
                <p>Progress: {{ progress }}%</p>
                <p>Selected: {{ isSelected }}</p>
                <p>Languages: {{ course.supported_languages_count || 1 }}</p>
                <p>Available Languages: {{ availableLanguages ? availableLanguages.length : 0 }}</p>
                <p>QR Enabled: {{ course.qr_combined_enabled ? 'Yes' : 'No' }}</p>
              </div>
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
  if (!course.value?.id) return

  try {
    const { videoUrl, metadata } = await CourseService.getVideoUrl(
        course.value.id,
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
    // CourseService.getAvailableLanguages는 배열을 직접 반환
    const languages = await CourseService.getAvailableLanguages(course.value.id)
    availableLanguages.value = languages || ['ko']
  } catch (error) {
    console.error('언어 목록 로드 실패:', error)
    availableLanguages.value = ['ko']
  }
}

// 카테고리 경로 표시
const getCategoryDisplayPath = (course) => {
  if (!course || !course.category) return '기타'

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
  return difficultyMap[difficulty] || difficulty || '중급'
}

// 언어 이름
const getLanguageName = (langCode) => {
  return SUPPORTED_LANGUAGES[langCode] || langCode.toUpperCase()
}

// 선택 목록에 추가
const addToSelectedList = () => {
  if (!course.value) return

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
  if (!course.value) return
  courseStore.removeFromSelected(course.value.id)
}

// 학습 페이지로 이동
const goToLearning = () => {
  if (!course.value) return

  if (authStore.isGuest) {
    router.push(`/learning/${course.value.id}`)
  } else {
    router.push(`/video-warning/${course.value.id}`)
  }
}

// 수료증 다운로드
const downloadCertificate = () => {
  if (!course.value) return
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

  if (course.value) {
    await Promise.all([
      loadFirebaseVideo(),
      loadAvailableLanguages()
    ])
  }

  courseStore.loadSelectedFromStorage()
})
</script>

<style scoped>
/* 헤더 섹션 */
.header-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
}

.header-content {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.back-button {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #6b7280;
}

.back-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.15);
}

/* 비디오 컨테이너 */
.video-container {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

.placeholder-content {
  text-align: center;
}

.play-icon-wrapper {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.play-icon-wrapper:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.preview-button {
  padding: 12px 24px;
  background: white;
  color: #1e293b;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.preview-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

/* 언어 선택기 */
.language-selector {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.language-buttons {
  display: flex;
  gap: 8px;
}

.language-button {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  cursor: pointer;
}

.language-button:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.language-button.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

/* 정보 카드 */
.info-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.course-main-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  line-height: 1.3;
  margin-bottom: 20px;
}

/* 태그 섹션 */
.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.category-tag {
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.category-machine {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.category-tool {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.category-equipment {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
}

.category-medicine {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.category-default {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
}

.tag {
  padding: 6px 12px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.status-tag {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-tag.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-tag.qr {
  background: #f3e8ff;
  color: #6b21a8;
}

.status-tag.language {
  background: #fef3c7;
  color: #92400e;
}

/* 메타 그리드 */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.meta-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.meta-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.meta-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.meta-content {
  flex: 1;
}

.meta-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 2px;
}

.meta-value {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

/* 섹션 스타일 */
.description-section,
.objectives-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title svg {
  color: #6b7280;
}

.description-text {
  font-size: 15px;
  line-height: 1.8;
  color: #4b5563;
  white-space: pre-wrap;
}

.objectives-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.objective-item {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 15px;
}

.objective-item:last-child {
  border-bottom: none;
}

.objective-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* 리뷰 카드 */
.review-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 32px;
}

.rating-score {
  text-align: center;
}

.score-number {
  font-size: 48px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  margin-bottom: 8px;
}

.stars {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.star-icon {
  width: 20px;
  height: 20px;
  color: #e5e7eb;
  transition: all 0.2s ease;
}

.star-icon.filled {
  color: #fbbf24;
  fill: #fbbf24;
}

.rating-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.info-item svg {
  color: #9ca3af;
}

/* 수강 신청 카드 */
.enrollment-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

/* 상태 섹션 */
.status-section {
  margin-bottom: 24px;
}

.status-card {
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-card.completed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.status-card.enrolled {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.status-card svg {
  width: 24px;
  height: 24px;
}

.status-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.status-subtitle {
  font-size: 13px;
  opacity: 0.8;
}

.progress-container {
  margin-top: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1e40af;
  transition: width 0.3s ease;
  border-radius: 99px;
}

/* QR 정보 카드 */
.qr-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  color: #6b21a8;
}

.qr-info-card svg {
  flex-shrink: 0;
}

/* 영구 링크 정보 */
.permanent-link-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #6b7280;
  font-size: 14px;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-action-button {
  width: 100%;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.main-action-button.primary {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
}

.main-action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.4);
}

.main-action-button.selected {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.main-action-button.learning {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.main-action-button.certificate {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.secondary-action-button {
  width: 100%;
  padding: 14px 24px;
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.secondary-action-button:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

/* 선택 메시지 */
.selection-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.selection-message svg {
  flex-shrink: 0;
}

/* 게스트 안내 */
.guest-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  margin-top: 16px;
  font-size: 14px;
}

.guest-notice svg {
  flex-shrink: 0;
}

/* 디버그 정보 */
.debug-info {
  margin-top: 20px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 12px;
  color: #6b7280;
}

.debug-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: monospace;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .enrollment-card {
    position: static;
    margin-top: 24px;
  }
}

@media (max-width: 768px) {
  .course-main-title {
    font-size: 24px;
  }

  .meta-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .meta-card {
    padding: 12px;
  }

  .rating-container {
    flex-direction: column;
    gap: 20px;
  }

  .info-card,
  .review-card,
  .enrollment-card {
    padding: 20px;
  }

  .main-action-button {
    padding: 14px 20px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .tags-section {
    gap: 6px;
  }

  .category-tag,
  .tag,
  .status-tag {
    font-size: 12px;
    padding: 4px 10px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 16px;
  }

  .description-text,
  .objective-item {
    font-size: 14px;
  }
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-card,
.review-card,
.enrollment-card {
  animation: fadeIn 0.6s ease-out;
}

.video-container {
  animation: fadeIn 0.4s ease-out;
}

/* 스크롤바 스타일 */
.enrollment-card::-webkit-scrollbar {
  width: 6px;
}

.enrollment-card::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.enrollment-card::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.enrollment-card::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>