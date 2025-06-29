<!-- web/src/views/learning/LearningView.vue -->
<template>
  <div class="learning-container">
    <!-- 로딩 상태 -->
    <LoadingSpinner v-if="isLoading" />

    <!-- 메인 콘텐츠 -->
    <div v-else class="learning-wrapper">
      <!-- 비디오 플레이어 -->
      <div class="video-section">
        <!-- TypeScript 버전처럼 video 태그 직접 사용 -->
        <video
            v-if="videoUrl && !videoError"
            ref="videoPlayer"
            :key="`${videoUrl}-${retryCount}`"
            :src="videoUrl"
            :poster="course?.thumbnail"
            class="main-video"
            controls
            preload="metadata"
            playsinline
            crossorigin="anonymous"
            @loadedmetadata="onVideoLoaded"
            @timeupdate="onVideoTimeUpdate"
            @play="onVideoPlay"
            @pause="onVideoPause"
            @ended="onVideoEnded"
            @error="onVideoError"
            @canplay="onVideoCanPlay"
            @waiting="onVideoWaiting"
        >
          <source :src="videoUrl" :type="getVideoMimeType(videoUrl)">
          <p class="text-white text-center p-4">
            브라우저가 비디오 재생을 지원하지 않습니다.
          </p>
        </video>

        <!-- 비디오 로딩 상태 -->
        <div v-if="videoLoading" class="video-loading-overlay">
          <Loader2 class="w-12 h-12 animate-spin text-white mb-4" />
          <p class="text-white">비디오 로딩 중...</p>
          <p v-if="retryCount > 0" class="text-gray-400 text-sm mt-2">
            재시도 중... ({{ retryCount }}/3)
          </p>
        </div>

        <!-- 비디오 에러 상태 -->
        <div v-else-if="!videoUrl || videoError" class="no-video">
          <AlertCircle :size="48" />
          <p class="text-lg font-semibold mb-2">비디오를 사용할 수 없습니다</p>
          <p class="text-sm text-gray-400 mb-4">
            {{ videoError || '비디오 URL이 설정되지 않았거나 유효하지 않습니다.' }}
          </p>
          <button
              @click="retryVideoLoad"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>

      <!-- 강의 정보 -->
      <div class="course-info-section">
        <header class="course-header">
          <h1 class="course-title">{{ course?.title || '제목 없음' }}</h1>
          <div class="course-meta">
            <span class="category" v-if="course?.category?.main">
              {{ course.category.main }}
            </span>
            <span class="duration">
              <Clock :size="16" />
              {{ course?.duration || '30분' }}
            </span>
            <span v-if="currentLanguage !== 'ko'" class="language-badge">
              <Globe :size="16" />
              {{ getLanguageName(currentLanguage) }}
            </span>
          </div>
        </header>

        <!-- 언어 변경 (다국어 지원 강의만) -->
        <div v-if="course?.hasMultipleLanguages || availableLanguages.length > 1" class="language-switcher">
          <h3>언어 선택</h3>
          <div class="language-options">
            <button
                v-for="lang in availableLanguages"
                :key="lang"
                @click="changeLanguage(lang)"
                class="language-btn"
                :class="{ active: lang === currentLanguage }"
            >
              {{ getLanguageName(lang) }}
            </button>
          </div>
        </div>

        <!-- 강의 설명 -->
        <div class="course-description">
          <h3>강의 내용</h3>
          <p>{{ course?.description || '설명이 없습니다.' }}</p>
        </div>

        <!-- 진행률 -->
        <div class="progress-section">
          <h3>학습 진행률</h3>
          <div class="progress-bar">
            <div
                class="progress-fill"
                :style="{ width: `${progress}%` }"
            />
          </div>
          <p class="progress-text">{{ progress }}% 완료</p>
        </div>

        <!-- 액션 버튼 -->
        <div class="action-buttons">
          <button @click="router.back()" class="btn btn-secondary">
            <ArrowLeft :size="18" />
            돌아가기
          </button>
          <button
              v-if="progress === 100"
              @click="downloadCertificate"
              class="btn btn-primary"
          >
            <Award :size="18" />
            수료증 다운로드
          </button>
        </div>
      </div>
    </div>

    <!-- 흔들림 경고 모달 -->
    <div v-if="showShakeWarning" class="shake-warning-modal">
      <div class="modal-content">
        <AlertTriangle :size="48" />
        <h2>흔들림 감지!</h2>
        <p>안전한 곳에서 정지한 상태로 수강해주세요.</p>
        <button @click="dismissShakeWarning" class="btn btn-primary">
          확인
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import CourseService from '@/services/courseService'
import LoadingSpinner from '@/common/LoadingSpinner.vue'
import {
  AlertCircle,
  Clock,
  Globe,
  ArrowLeft,
  Award,
  AlertTriangle,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const courseStore = useCourseStore()

// Props
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

// 상태
const isLoading = ref(true)
const course = ref(null)
const courseId = computed(() => props.id)
const userId = computed(() => authStore.user?.uid || 'guest')
const currentLanguage = ref('ko')
const videoUrl = ref('')
const progress = ref(0)
const showShakeWarning = ref(false)
const availableLanguages = ref(['ko']) // 사용 가능한 언어 목록

// 비디오 관련 상태 추가
const videoPlayer = ref(null)
const videoLoading = ref(false)
const videoError = ref(null)
const retryCount = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// 언어 이름 맵핑
const languageNames = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  vi: 'Tiếng Việt',
  th: 'ภาษาไทย',
  ja: '日本語'
}

// 언어 이름 가져오기
const getLanguageName = (code) => {
  return languageNames[code] || code.toUpperCase()
}

// 강의 정보 로드
const loadCourse = async () => {
  try {
    isLoading.value = true

    // CourseService를 통해 상세 정보 가져오기 (TypeScript 버전과 동일한 방식)
    course.value = await CourseService.getCourseById(courseId.value)

    if (!course.value) {
      console.error('강의를 찾을 수 없습니다')
      router.push('/my-courses')
      return
    }

    // URL에서 언어 정보 가져오기 (VideoWarningView에서 전달)
    const queryLang = route.query.lang || localStorage.getItem('language') || 'ko'
    currentLanguage.value = queryLang

    // 사용 가능한 언어 목록 로드
    await loadAvailableLanguages()

    // 비디오 URL 설정
    await updateVideoUrl()

    // 기존 진행률 로드는 비디오 로드 후에 처리

  } catch (error) {
    console.error('강의 로드 실패:', error)
    alert('강의를 불러올 수 없습니다.')
    router.push('/my-courses')
  } finally {
    isLoading.value = false
  }
}

// 사용 가능한 언어 목록 로드
const loadAvailableLanguages = async () => {
  try {
    // CourseService.getAvailableLanguages 사용
    const languages = await CourseService.getAvailableLanguages(courseId.value)

    if (languages && languages.length > 0) {
      availableLanguages.value = languages
    } else {
      // 기본값: 한국어만
      availableLanguages.value = ['ko']
    }

    // 선택된 언어가 사용 가능한지 확인
    if (!availableLanguages.value.includes(currentLanguage.value)) {
      currentLanguage.value = availableLanguages.value[0] || 'ko'
      console.log('⚠️ 선택된 언어가 없어 기본 언어로 변경:', currentLanguage.value)
    }
  } catch (error) {
    console.warn('언어 목록 로드 실패:', error)
    availableLanguages.value = ['ko']
  }
}

// 비디오 URL 업데이트 (CourseService의 실제 메서드 사용)
const updateVideoUrl = async () => {
  if (!course.value) return

  try {
    console.log('🔄 비디오 URL 업데이트 시작...')
    videoLoading.value = true
    videoError.value = null

    // CourseService의 실제 메서드 사용
    const url = await CourseService.getVideoUrlForLanguage(courseId.value, currentLanguage.value)

    if (url) {
      videoUrl.value = url
      console.log(`🎬 비디오 URL 업데이트:`, {
        language: currentLanguage.value,
        url: url,
        courseId: courseId.value
      })

      // 비디오 엘리먼트가 준비될 때까지 대기
      await nextTick()

      if (videoPlayer.value) {
        videoPlayer.value.load()
      }
    } else {
      throw new Error('비디오 URL을 가져올 수 없습니다.')
    }
  } catch (error) {
    console.error('비디오 URL 업데이트 실패:', error)
    videoError.value = '비디오를 불러올 수 없습니다.'

    // 폴백 처리
    if (currentLanguage.value !== 'ko') {
      console.warn('다른 언어 비디오를 찾을 수 없어 한국어로 재생합니다.')
      currentLanguage.value = 'ko'
      await updateVideoUrl()
    }
  } finally {
    videoLoading.value = false
  }
}

// 언어 변경
const changeLanguage = async (lang) => {
  if (lang === currentLanguage.value) return

  currentLanguage.value = lang
  localStorage.setItem('language', lang) // 선택한 언어 저장
  await updateVideoUrl()

  // URL 쿼리 파라미터 업데이트
  router.replace({
    query: { ...route.query, lang }
  })
}

// 진행률 로드
const loadProgress = async () => {
  try {
    if (authStore.user) {
      // CourseService.getProgress 사용 (기존 메서드)
      const savedProgress = await CourseService.getProgress(authStore.user.uid, courseId.value)
      if (savedProgress) {
        progress.value = savedProgress

        // 비디오 시간 복원은 비디오 로드 후에 처리
      }
    } else {
      // 게스트는 로컬스토리지 사용
      const savedProgress = localStorage.getItem(`progress_${courseId.value}`)
      if (savedProgress) {
        progress.value = parseInt(savedProgress) || 0
      }
    }
  } catch (error) {
    console.error('진행률 로드 실패:', error)
  }
}

// 비디오 이벤트 핸들러 추가
const onVideoLoaded = async (event) => {
  duration.value = event.target.duration
  console.log('🎥 비디오 로드됨:', {
    duration: duration.value,
    language: currentLanguage.value
  })

  // 진도 로드
  await loadProgress()
}

const onVideoPlay = () => {
  isPlaying.value = true
  videoLoading.value = false
}

const onVideoPause = () => {
  isPlaying.value = false
}

const onVideoEnded = async () => {
  isPlaying.value = false
  progress.value = 100
  await handleProgress(100)
  console.log('🎉 강의 완료!')
}

const onVideoError = (event) => {
  console.error('❌ 비디오 오류:', event)
  videoLoading.value = false

  const video = event.target
  const errorCode = video?.error?.code || 0

  let message = '비디오를 재생할 수 없습니다.'

  switch (errorCode) {
    case 1:
      message = '비디오 로드가 중단되었습니다.'
      break
    case 2:
      message = '네트워크 오류가 발생했습니다.'
      break
    case 3:
      message = '비디오 형식을 지원하지 않습니다.'
      break
    case 4:
      message = '비디오 소스를 찾을 수 없습니다.'
      break
  }

  videoError.value = message

  // 자동 재시도
  if (retryCount.value < 3) {
    retryCount.value++
    setTimeout(() => {
      console.log(`🔄 비디오 로드 재시도 (${retryCount.value}/3)`)
      updateVideoUrl()
    }, 2000)
  }
}

const onVideoTimeUpdate = (event) => {
  currentTime.value = event.target.currentTime
  const newProgress = Math.round((currentTime.value / duration.value) * 100)

  if (newProgress !== progress.value) {
    progress.value = newProgress
    handleProgress(newProgress)
  }
}

const onVideoCanPlay = () => {
  videoLoading.value = false
  retryCount.value = 0
  console.log('✅ 비디오 재생 준비 완료')
}

const onVideoWaiting = () => {
  console.log('⏳ 비디오 버퍼링 중...')
}

// 비디오 재시도
const retryVideoLoad = () => {
  videoError.value = null
  retryCount.value = 0
  updateVideoUrl()
}

// 비디오 MIME 타입 가져오기
const getVideoMimeType = (url) => {
  if (!url) return 'video/mp4'
  const extension = url.split('.').pop()?.toLowerCase() || 'mp4'
  const mimeTypes = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg'
  }
  return mimeTypes[extension] || 'video/mp4'
}

// 흔들림 감지 처리
const handleShakeDetected = () => {
  showShakeWarning.value = true
}

// 흔들림 경고 닫기
const dismissShakeWarning = () => {
  showShakeWarning.value = false
}

// 수료증 다운로드
const downloadCertificate = () => {
  console.log('수료증 다운로드')
  // TODO: 수료증 다운로드 구현
  alert('수료증 다운로드 기능은 준비 중입니다.')
}

// 언어 변경 감지
watch(currentLanguage, () => {
  updateVideoUrl()
})

// 마운트
onMounted(async () => {
  // 강의 로드
  await loadCourse()

  // 비디오 URL 디버깅 정보
  if (videoUrl.value) {
    console.log('📺 비디오 URL 설정 완료:', {
      url: videoUrl.value,
      courseId: courseId.value,
      language: currentLanguage.value,
      userId: userId.value
    })
    console.log('💡 HTML5 video 엘리먼트가 이 URL을 사용하여 비디오를 재생합니다.')
  }
})
</script>

<style scoped>
/* =================== CSS 변수 Import =================== */
@import '@/assets/main.css';

/* 컨테이너 */
.learning-container {
  min-height: 100vh;
  background: var(--bg-primary, #f8fafc);
}

.learning-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

@media (min-width: 1024px) {
  .learning-wrapper {
    grid-template-columns: 2fr 1fr;
  }
}

/* 비디오 섹션 */
.video-section {
  background: #000;
  border-radius: var(--radius-xl, 1rem);
  overflow: hidden;
  aspect-ratio: 16 / 9;
  position: relative;
  box-shadow: var(--shadow-lg);
}

/* 메인 비디오 */
.main-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 비디오 로딩 오버레이 */
.video-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

/* 강의 정보 섹션 */
.course-info-section {
  background: white;
  border-radius: var(--radius-xl, 1rem);
  padding: 2rem;
  box-shadow: var(--shadow-base);
}

.course-header {
  margin-bottom: 2rem;
}

.course-title {
  font-size: var(--text-3xl, 1.875rem);
  font-weight: var(--font-bold, 700);
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: var(--text-sm, 0.875rem);
}

.category {
  padding: 0.25rem 0.75rem;
  background: var(--bg-tertiary, #f3f4f6);
  color: var(--text-secondary);
  border-radius: 2rem;
}

.duration {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
}

.language-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary, #667eea);
  border-radius: 2rem;
  font-weight: 500;
}

/* 언어 전환 */
.language-switcher {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-tertiary, #f3f4f6);
  border-radius: var(--radius-lg, 0.75rem);
}

.language-switcher h3 {
  font-size: var(--text-base, 1rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.language-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

.language-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  background: white;
  border-radius: var(--radius-md, 0.5rem);
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s);
}

.language-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--color-primary);
}

.language-btn.active {
  background: var(--color-primary, #667eea);
  color: white;
  border-color: var(--color-primary, #667eea);
}

/* 강의 설명 */
.course-description {
  margin-bottom: 2rem;
}

.course-description h3 {
  font-size: var(--text-base, 1rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.course-description p {
  color: var(--text-secondary);
  line-height: var(--leading-relaxed, 1.6);
  margin: 0;
}

/* 진행률 */
.progress-section {
  margin-bottom: 2rem;
}

.progress-section h3 {
  font-size: var(--text-base, 1rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.progress-bar {
  height: 12px;
  background: var(--bg-tertiary, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--color-success, #10b981);
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary);
  margin: 0;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s);
}

.btn-primary {
  background: var(--color-primary, #667eea);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #5a67d8);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--bg-tertiary, #f3f4f6);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: var(--bg-quaternary, #e5e7eb);
}

/* 흔들림 경고 모달 */
.shake-warning-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn var(--transition-fast) ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: var(--radius-xl, 1rem);
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  width: 100%;
  animation: slideUp var(--transition-base) ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content svg {
  color: var(--color-warning, #f59e0b);
  margin-bottom: 1rem;
}

.modal-content h2 {
  font-size: var(--text-2xl, 1.5rem);
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.modal-content p {
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .learning-wrapper {
    padding: 1rem;
  }

  .course-info-section {
    padding: 1.5rem;
  }

  .course-title {
    font-size: var(--text-2xl, 1.5rem);
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>