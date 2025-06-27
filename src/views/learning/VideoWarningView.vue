<!-- web/src/views/learning/VideoWarningView.vue -->
<template>
  <div class="page-wrapper">
    <!-- 배경 그라데이션 -->
    <div class="background-gradient"></div>

    <!-- 메인 콘텐츠 -->
    <div class="container">
      <div class="content-wrapper">
        <!-- 경고 카드 -->
        <div class="warning-card">
          <!-- 경고 아이콘 -->
          <div class="icon-section">
            <div class="icon-wrapper">
              <AlertTriangle :size="48" />
            </div>
          </div>

          <!-- 제목 -->
          <header class="card-header">
            <h1 class="title">안전 교육 수강 전 필수 확인사항</h1>
            <p class="subtitle">안전한 교육 수강을 위해 아래 내용을 반드시 확인해주세요</p>
          </header>

          <!-- 경고 사항 -->
          <section class="warnings-section">
            <article class="warning-item danger">
              <div class="warning-icon-wrapper">
                <Ban :size="24" />
              </div>
              <div class="warning-content">
                <h3 class="warning-title">작업 중 교육 수강 절대 금지</h3>
                <p class="warning-text">
                  기계 조작, 운전, 높은 곳 작업 등 위험한 작업 중에는 절대 교육을 수강하지 마세요.
                  사고의 위험이 있습니다.
                </p>
              </div>
            </article>

            <article class="warning-item caution">
              <div class="warning-icon-wrapper">
                <Smartphone :size="24" />
              </div>
              <div class="warning-content">
                <h3 class="warning-title">기기 흔들림 자동 감지</h3>
                <p class="warning-text">
                  이동 중이거나 기기가 흔들리면 자동으로 재생이 일시정지됩니다.
                  안전한 장소에서 정지한 상태로 수강해주세요.
                </p>
              </div>
            </article>

            <article class="warning-item info">
              <div class="warning-icon-wrapper">
                <Eye :size="24" />
              </div>
              <div class="warning-content">
                <h3 class="warning-title">집중하여 수강하기</h3>
                <p class="warning-text">
                  안전 교육은 여러분의 생명과 직결됩니다.
                  다른 일을 하지 말고 교육 내용에 집중해주세요.
                </p>
              </div>
            </article>
          </section>

          <!-- 체크리스트 -->
          <section class="checklist-section">
            <h3 class="checklist-title">수강 전 체크리스트</h3>
            <div class="checklist-items">
              <label
                  v-for="(item, index) in checkItems"
                  :key="index"
                  class="checklist-item"
                  :class="{ checked: item.checked }"
              >
                <div class="checkbox-wrapper">
                  <input
                      type="checkbox"
                      v-model="item.checked"
                      class="checkbox-input"
                  />
                  <div class="checkbox-custom">
                    <svg v-if="item.checked" class="checkbox-icon" fill="none" viewBox="0 0 12 10">
                      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1.5 5.5L4.5 8.5L10.5 1.5"/>
                    </svg>
                  </div>
                </div>
                <span class="checkbox-label">{{ item.text }}</span>
              </label>
            </div>
          </section>

          <!-- 강의 정보 -->
          <div v-if="course" class="course-info">
            <div class="course-thumbnail">
              <PlayCircle :size="28" />
            </div>
            <div class="course-details">
              <p class="course-label">수강 예정 강의</p>
              <h4 class="course-title">{{ course.title }}</h4>
              <p v-if="selectedLanguage !== 'ko'" class="course-language">
                {{ getLanguageName(selectedLanguage) }}로 수강
              </p>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <footer class="card-footer">
            <button
                @click="router.back()"
                class="btn btn-secondary"
            >
              돌아가기
            </button>
            <button
                @click="proceedToLearning"
                :disabled="!allChecked"
                class="btn btn-primary"
                :class="{ 'btn-disabled': !allChecked }"
            >
              <Shield :size="20" />
              <span>안전하게 수강하기</span>
            </button>
          </footer>

          <!-- 추가 안내 -->
          <p class="footer-note">
            본 안전 교육은 산업안전보건법에 따라 실시되는 법정 의무교육입니다.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import {
  AlertTriangle,
  Ban,
  Smartphone,
  Eye,
  PlayCircle,
  Shield
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

// Props
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

// 상태
const course = ref(null)
const selectedLanguage = ref('ko')
const checkItems = ref([
  {
    text: '현재 안전한 장소에 있으며, 작업 중이 아닙니다.',
    checked: false
  },
  {
    text: '이동 중이 아니며, 정지한 상태입니다.',
    checked: false
  },
  {
    text: '교육 내용에 집중할 수 있는 환경입니다.',
    checked: false
  },
  {
    text: '기기 흔들림 시 자동 정지됨을 이해했습니다.',
    checked: false
  }
])

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

// 모든 항목 체크 여부
const allChecked = computed(() => {
  return checkItems.value.every(item => item.checked)
})

// 강의 정보 로드
const loadCourse = async () => {
  try {
    course.value = await courseStore.getCourseById(props.id)
    if (!course.value) {
      course.value = courseStore.courses.find(c => c.id === props.id)
    }
  } catch (error) {
    console.error('강의 정보 로드 실패:', error)
  }
}

// 학습 진행
const proceedToLearning = () => {
  if (!allChecked.value) return

  // URL에서 언어 정보 가져오기
  const selectedLang = route.query.lang || 'ko'

  // 학습 화면으로 이동 (언어 정보 포함)
  router.push({
    path: `/learning/${props.id}`,
    query: { lang: selectedLang }
  })
}

// 마운트
onMounted(() => {
  // URL에서 언어 정보 가져오기
  selectedLanguage.value = route.query.lang || 'ko'
  loadCourse()
})
</script>

<style scoped>
/* =================== 페이지 구조 =================== */
.page-wrapper {
  min-height: 100vh;
  background: var(--bg-primary, #f8fafc);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast, 0.15s ease);
  background: white;
}

.checkbox-input:checked ~ .checkbox-custom {
  background: #22c55e;
  border-color: #22c55e;
}

.checkbox-icon {
  width: 1rem;
  height: 1rem;
  color: white;
}

.checkbox-label {
  color: var(--text-primary, #374151);
  font-size: var(--text-base, 1rem);
  line-height: 1.6;
  user-select: none;
}

/* =================== 강의 정보 =================== */
.course-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-tertiary, #f9fafb);
  border: 2px solid var(--border-primary, #e5e7eb);
  border-radius: var(--radius-xl, 0.75rem);
  margin-bottom: 1.5rem;
}

.course-thumbnail {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-lg, 0.5rem);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.course-thumbnail svg {
  color: white;
}

.course-details {
  flex: 1;
  min-width: 0;
}

.course-label {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
  margin: 0 0 0.25rem 0;
}

.course-title {
  font-size: var(--text-base, 1rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-language {
  font-size: var(--text-sm, 0.875rem);
  color: var(--primary, #3b82f6);
  margin: 0.25rem 0 0 0;
  font-weight: var(--font-medium, 500);
}

/* =================== 푸터 =================== */
.card-footer {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.footer-note {
  text-align: center;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
  margin: 0;
  line-height: 1.6;
}

/* =================== 버튼 스타일 =================== */
.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: var(--text-base, 1rem);
  font-weight: var(--font-medium, 500);
  border: none;
  border-radius: var(--radius-lg, 0.5rem);
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
  outline: none;
}

.btn:focus-visible {
  outline: 2px solid var(--accent-primary, #3b82f6);
  outline-offset: 2px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.btn-secondary {
  background: var(--bg-tertiary, #f3f4f6);
  color: var(--text-primary, #374151);
  border: 1px solid var(--border-primary, #e5e7eb);
}

.btn-secondary:hover {
  background: var(--bg-quaternary, #e5e7eb);
  transform: translateY(-1px);
}

.btn-disabled {
  background: var(--bg-quaternary, #e5e7eb) !important;
  color: var(--text-tertiary, #9ca3af) !important;
  cursor: not-allowed !important;
  opacity: 0.6;
  transform: none !important;
  box-shadow: none !important;
}

/* =================== 반응형 디자인 =================== */
@media (max-width: 640px) {
  .title {
    font-size: var(--text-xl, 1.25rem);
  }

  .warning-item {
    flex-direction: column;
    gap: 0.75rem;
  }

  .checklist-section {
    padding: 1.25rem;
  }

  .card-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

/* =================== 접근성 =================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .warning-item:hover,
  .btn:hover {
    transform: none;
  }
}
</style> center;
justify-content: center;
padding: 1rem;
}

/* =================== 배경 그라데이션 =================== */
.background-gradient {
position: absolute;
inset: 0;
background: linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%);
opacity: 0.3;
pointer-events: none;
}

.background-gradient::before {
content: '';
position: absolute;
top: -50%;
right: -20%;
width: 600px;
height: 600px;
background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
border-radius: 50%;
}

/* =================== 컨테이너 =================== */
.container {
max-width: 720px;
width: 100%;
margin: 0 auto;
position: relative;
z-index: 1;
}

.content-wrapper {
width: 100%;
}

/* =================== 경고 카드 =================== */
.warning-card {
background: var(--bg-secondary, #ffffff);
border-radius: var(--radius-2xl, 1rem);
box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
padding: 3rem;
animation: slideUp 0.6s ease-out;
}

@media (max-width: 768px) {
.warning-card {
padding: 2rem 1.5rem;
}
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

/* =================== 아이콘 섹션 =================== */
.icon-section {
display: flex;
justify-content: center;
margin-bottom: 2rem;
}

.icon-wrapper {
width: 6rem;
height: 6rem;
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
position: relative;
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.icon-wrapper svg {
color: white;
}

@keyframes pulse {
0%, 100% {
opacity: 1;
}
50% {
opacity: 0.8;
transform: scale(0.95);
}
}

/* =================== 헤더 =================== */
.card-header {
text-align: center;
margin-bottom: 2.5rem;
}

.title {
font-size: var(--text-2xl, 1.5rem);
font-weight: var(--font-bold, 700);
color: var(--text-primary, #111827);
margin: 0 0 0.75rem 0;
line-height: 1.2;
}

.subtitle {
font-size: var(--text-base, 1rem);
color: var(--text-secondary, #6b7280);
margin: 0;
line-height: 1.6;
}

/* =================== 경고 사항 =================== */
.warnings-section {
display: flex;
flex-direction: column;
gap: 1rem;
margin-bottom: 2rem;
}

.warning-item {
display: flex;
gap: 1rem;
padding: 1.25rem;
border-radius: var(--radius-xl, 0.75rem);
border-left: 4px solid;
background: var(--bg-tertiary, #f9fafb);
transition: all var(--transition-base, 0.3s ease);
}

.warning-item:hover {
transform: translateY(-2px);
box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.warning-item.danger {
border-left-color: #ef4444;
background: rgba(239, 68, 68, 0.05);
}

.warning-item.caution {
border-left-color: #f59e0b;
background: rgba(245, 158, 11, 0.05);
}

.warning-item.info {
border-left-color: #3b82f6;
background: rgba(59, 130, 246, 0.05);
}

.warning-icon-wrapper {
flex-shrink: 0;
width: 2.5rem;
height: 2.5rem;
border-radius: var(--radius-lg, 0.5rem);
display: flex;
align-items: center;
justify-content: center;
background: white;
box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

.warning-item.danger .warning-icon-wrapper svg { color: #ef4444; }
.warning-item.caution .warning-icon-wrapper svg { color: #f59e0b; }
.warning-item.info .warning-icon-wrapper svg { color: #3b82f6; }

.warning-content {
flex: 1;
min-width: 0;
}

.warning-title {
font-size: var(--text-lg, 1.125rem);
font-weight: var(--font-semibold, 600);
margin: 0 0 0.25rem 0;
line-height: 1.25;
}

.warning-item.danger .warning-title { color: #dc2626; }
.warning-item.caution .warning-title { color: #d97706; }
.warning-item.info .warning-title { color: #2563eb; }

.warning-text {
font-size: var(--text-sm, 0.875rem);
margin: 0;
line-height: 1.6;
color: var(--text-secondary, #6b7280);
}

/* =================== 체크리스트 =================== */
.checklist-section {
background: var(--bg-tertiary, #f9fafb);
border: 1px solid var(--border-primary, #e5e7eb);
border-radius: var(--radius-xl, 0.75rem);
padding: 1.5rem;
margin-bottom: 1.5rem;
}

.checklist-title {
font-size: var(--text-lg, 1.125rem);
font-weight: var(--font-semibold, 600);
color: var(--text-primary, #111827);
margin: 0 0 1rem 0;
}

.checklist-items {
display: flex;
flex-direction: column;
gap: 0.75rem;
}

.checklist-item {
display: flex;
align-items: flex-start;
gap: 0.75rem;
padding: 0.75rem;
border-radius: var(--radius-lg, 0.5rem);
cursor: pointer;
transition: all var(--transition-fast, 0.15s ease);
}

.checklist-item:hover {
background: rgba(34, 197, 94, 0.05);
}

.checklist-item.checked {
background: rgba(34, 197, 94, 0.1);
}

.checkbox-wrapper {
position: relative;
flex-shrink: 0;
}

.checkbox-input {
position: absolute;
opacity: 0;
width: 0;
height: 0;
}

.checkbox-custom {
width: 1.5rem;
height: 1.5rem;
border: 2px solid var(--border-secondary, #d1d5db);
border-radius: var(--radius-md, 0.375rem);
display: flex;
align-items:
}
