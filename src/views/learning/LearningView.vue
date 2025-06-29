<!-- web/src/views/learning/LearningView.vue -->
<template>
  <div class="learning-container">
    <!-- 로딩 상태 -->
    <LoadingSpinner v-if="isLoading" />

    <!-- 메인 콘텐츠 -->
    <div v-else class="learning-wrapper">
      <!-- 비디오 플레이어 -->
      <div class="video-section">
        <VideoPlayer
            v-if="videoUrl"
            :videoUrl="videoUrl"
            :courseId="courseId"
            :userId="userId"
            :currentLanguage="currentLanguage"
            @progress="handleProgress"
            @shake-detected="handleShakeDetected"
        />
        <div v-else class="no-video">
          <AlertCircle :size="48" />
          <p>비디오를 불러올 수 없습니다</p>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import CourseService from '@/services/courseService'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import LoadingSpinner from '@/common/LoadingSpinner.vue'
import {
  AlertCircle,
  Clock,
  Globe,
  ArrowLeft,
  Award,
  AlertTriangle
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

    // CourseService를 통해 상세 정보 가져오기
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

    // 기존 진행률 로드
    await loadProgress()

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
    // Firebase에서 언어별 비디오 정보 확인
    const languages = await CourseService.getAvailableLanguages(courseId.value)
    if (languages && languages.length > 0) {
      availableLanguages.value = languages
    } else {
      // 기본값: 한국어만
      availableLanguages.value = ['ko']
    }
  } catch (error) {
    console.warn('언어 목록 로드 실패:', error)
    availableLanguages.value = ['ko']
  }
}

// 비디오 URL 업데이트 (async로 수정)
const updateVideoUrl = async () => {
  if (!course.value) return

  try {
    // CourseService에서 언어별 비디오 URL 가져오기
    const url = await CourseService.getVideoUrlForLanguage(courseId.value, currentLanguage.value)

    // Railway 프록시 URL이 상대 경로인 경우 절대 경로로 변환
    if (url && url.startsWith('/')) {
      const apiUrl = import.meta.env.VITE_API_URL || ''
      videoUrl.value = `${apiUrl}${url}`
    } else {
      videoUrl.value = url
    }

    console.log(`🎬 비디오 URL 업데이트:`, {
      language: currentLanguage.value,
      url: videoUrl.value
    })
  } catch (error) {
    console.error('비디오 URL 업데이트 실패:', error)

    // 에러 시 폴백 처리
    const apiUrl = import.meta.env.VITE_API_URL || ''

    // 1차 폴백: 한국어 비디오 시도
    if (currentLanguage.value !== 'ko') {
      try {
        const koUrl = await CourseService.getVideoUrlForLanguage(courseId.value, 'ko')
        if (koUrl) {
          videoUrl.value = koUrl.startsWith('/') ? `${apiUrl}${koUrl}` : koUrl
          console.warn(`${currentLanguage.value} 영상이 없어 한국어로 재생합니다.`)
          return
        }
      } catch (e) {
        console.error('한국어 비디오도 로드 실패:', e)
      }
    }

    // 2차 폴백: 기본 watch URL
    videoUrl.value = `${apiUrl}/watch/${courseId.value}?lang=${currentLanguage.value}`
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
      const savedProgress = await CourseService.getProgress(authStore.user.uid, courseId.value)
      progress.value = savedProgress || 0
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

// 진행률 업데이트
const handleProgress = async (newProgress) => {
  progress.value = Math.round(newProgress)

  // 로컬 저장
  localStorage.setItem(`progress_${courseId.value}`, progress.value.toString())

  // Firebase 업데이트
  if (authStore.user) {
    try {
      await CourseService.updateProgress(
          authStore.user.uid,
          courseId.value,
          progress.value
      )
    } catch (error) {
      console.error('진도 저장 실패:', error)
    }
  }

  // 100% 완료 시 처리
  if (progress.value === 100) {
    console.log('🎉 강의 수료!')
    // TODO: 수료 처리
  }
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

// 마운트 - 디버깅 코드 추가
onMounted(async () => {
  console.log('=== 비디오 디버깅 시작 ===')

  // 1. 강의 로드
  await loadCourse()

  // 2. 최종 비디오 URL 확인
  console.log('📺 최종 비디오 URL:', videoUrl.value)

  // 3. URL이 있다면 직접 테스트
  if (videoUrl.value) {
    // 3-1. fetch로 헤더 확인
    try {
      const response = await fetch(videoUrl.value, {
        method: 'HEAD',
        mode: 'cors'
      })
      console.log('📡 비디오 응답 상태:', response.status)
      console.log('📋 Content-Type:', response.headers.get('content-type'))
      console.log('🔒 CORS:', response.headers.get('access-control-allow-origin'))
    } catch (error) {
      console.error('❌ Fetch 에러:', error)
    }

    // 3-2. 새 탭에서 비디오 URL 열기 테스트
    console.log('💡 다음 URL을 새 탭에서 직접 열어보세요:')
    console.log(videoUrl.value)

    // 3-3. video 엘리먼트로 테스트
    const testVideo = document.createElement('video')
    testVideo.src = videoUrl.value

    testVideo.addEventListener('loadstart', () => {
      console.log('✅ loadstart: 비디오 로딩 시작')
    })

    testVideo.addEventListener('error', (e) => {
      console.error('❌ 비디오 에러:', e)
      console.error('에러 코드:', testVideo.error?.code)
      console.error('에러 메시지:', testVideo.error?.message)

      // 에러 코드 설명
      const errorMessages = {
        1: 'MEDIA_ERR_ABORTED - 사용자가 다운로드를 중단',
        2: 'MEDIA_ERR_NETWORK - 네트워크 에러',
        3: 'MEDIA_ERR_DECODE - 디코딩 에러 (잘못된 형식)',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - 지원하지 않는 형식'
      }
      console.error('에러 설명:', errorMessages[testVideo.error?.code])
    })

    testVideo.addEventListener('canplay', () => {
      console.log('✅ canplay: 비디오 재생 가능!')
    })

    // 로드 시작
    testVideo.load()
  }

  console.log('=== 디버깅 끝 ===')
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

.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  gap: 1rem;
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