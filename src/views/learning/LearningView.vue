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
        <div v-if="course?.hasMultipleLanguages" class="language-switcher">
          <h3>언어 선택</h3>
          <div class="language-options">
            <button
                v-for="lang in course.availableLanguages"
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
const currentLanguage = ref('ko')
const videoUrl = ref('')
const progress = ref(0)
const showShakeWarning = ref(false)

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

    // CourseService를 통해 상세 정보 가져오기 (언어별 비디오 포함)
    course.value = await CourseService.getCourseById(courseId.value)

    if (!course.value) {
      console.error('강의를 찾을 수 없습니다')
      router.push('/my-courses')
      return
    }

    // URL에서 언어 정보 가져오기
    const queryLang = route.query.lang || 'ko'
    currentLanguage.value = queryLang

    // 비디오 URL 설정
    updateVideoUrl()

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

// 비디오 URL 업데이트
const updateVideoUrl = () => {
  if (!course.value) return

  // CourseService의 getVideoUrlForLanguage 메서드 사용
  const url = CourseService.getVideoUrlForLanguage(course.value, currentLanguage.value)
  videoUrl.value = url

  console.log(`🎬 비디오 URL 업데이트:`, {
    language: currentLanguage.value,
    url: url
  })
}

// 언어 변경
const changeLanguage = (lang) => {
  if (lang === currentLanguage.value) return

  currentLanguage.value = lang
  updateVideoUrl()

  // URL 쿼리 파라미터 업데이트
  router.replace({
    query: { ...route.query, lang }
  })
}

// 진행률 로드
const loadProgress = async () => {
  try {
    // TODO: Firebase에서 진행률 가져오기
    const savedProgress = localStorage.getItem(`progress_${courseId.value}`)
    if (savedProgress) {
      progress.value = parseInt(savedProgress) || 0
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
    await CourseService.updateProgress(
        courseId.value,
        authStore.user.uid,
        progress.value
    )
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

// 마운트
onMounted(() => {
  loadCourse()
})
</script>

<style scoped>
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
  border-radius: 1rem;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  position: relative;
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
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.course-header {
  margin-bottom: 2rem;
}

.course-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
}

.category {
  padding: 0.25rem 0.75rem;
  background: var(--bg-tertiary);
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
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 2rem;
  font-weight: 500;
}

/* 언어 전환 */
.language-switcher {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 0.75rem;
}

.language-switcher h3 {
  font-size: 1rem;
  font-weight: 600;
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
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.language-btn:hover {
  background: var(--bg-secondary);
}

.language-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* 강의 설명 */
.course-description {
  margin-bottom: 2rem;
}

.course-description h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.course-description p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 진행률 */
.progress-section {
  margin-bottom: 2rem;
}

.progress-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.progress-bar {
  height: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.875rem;
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
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: var(--bg-quaternary);
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
}

.modal-content {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.modal-content svg {
  color: var(--warning);
  margin-bottom: 1rem;
}

.modal-content h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.modal-content p {
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .course-info-section {
    padding: 1.5rem;
  }

  .course-title {
    font-size: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>