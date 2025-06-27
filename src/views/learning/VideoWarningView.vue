<!-- web/src/views/learning/VideoWarningView.vue -->
<template>
  <div class="warning-container">
    <div class="content-wrapper">
      <!-- 경고 카드 (프로젝트의 education-card 스타일 적용) -->
      <div class="warning-card education-card">
        <!-- 경고 아이콘 -->
        <div class="icon-section">
          <div class="icon-wrapper animate-pulse">
            <AlertTriangle class="icon" />
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
              <Ban class="warning-icon" />
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
              <Smartphone class="warning-icon" />
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
              <Eye class="warning-icon" />
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
              <div class="checkbox-round" :class="item.checked ? 'checkbox-round-selected' : 'checkbox-round-unselected'">
                <svg v-if="item.checked" class="w-4 h-4 text-white" fill="none" viewBox="0 0 12 10">
                  <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1.5 5.5L4.5 8.5L10.5 1.5"/>
                </svg>
              </div>
              <input
                  type="checkbox"
                  v-model="item.checked"
                  class="sr-only"
              />
              <span class="checkbox-label">{{ item.text }}</span>
            </label>
          </div>
        </section>

        <!-- 강의 정보 -->
        <div v-if="course" class="course-info course-card">
          <div class="course-icon-wrapper">
            <PlayCircle class="course-icon" />
          </div>
          <div class="course-details">
            <p class="course-label">수강 예정 강의</p>
            <h4 class="course-title">{{ course.title }}</h4>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <footer class="card-footer">
          <button
              @click="router.back()"
              class="action-button secondary"
          >
            돌아가기
          </button>
          <button
              @click="proceedToLearning"
              :disabled="!allChecked"
              class="action-button education-button"
              :class="{ disabled: !allChecked }"
          >
            <Shield class="button-icon" />
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

  // 학습 화면으로 이동
  router.push(`/learning/${props.id}`)
}

// 마운트
onMounted(() => {
  loadCourse()
})
</script>

<style scoped>
/* =================== CSS 변수 Import =================== */
@import '@/assets/main.css';

/* =================== 메인 컨테이너 =================== */
.warning-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
}

.warning-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.content-wrapper {
  max-width: 720px;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* =================== 경고 카드 =================== */
.warning-card {
  padding: var(--spacing-4xl);
  background: white !important;
  animation: slideUp 0.6s var(--easing-out);
}

@media (max-width: 768px) {
  .warning-card {
    padding: var(--spacing-2xl);
  }
}

/* =================== 아이콘 섹션 =================== */
.icon-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-3xl);
}

.icon-wrapper {
  width: 96px;
  height: 96px;
  background: var(--gradient-danger);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: var(--shadow-lg);
}

.icon-wrapper::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: var(--gradient-danger);
  border-radius: 50%;
  opacity: 0.3;
  filter: blur(12px);
  z-index: -1;
}

.icon {
  width: 48px;
  height: 48px;
  color: white;
  position: relative;
  z-index: 1;
}

/* =================== 헤더 =================== */
.card-header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
  padding: 0;
  background: transparent;
  border: none;
}

.title {
  font-size: var(--font-size-4xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.2;
}

.subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* =================== 경고 사항 =================== */
.warnings-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-3xl);
}

.warning-item {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  border-left: 4px solid;
  background: var(--color-background-light);
  transition: all var(--transition-base) var(--easing-base);
}

.warning-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.warning-item.danger {
  border-left-color: var(--color-red);
  background: rgba(245, 108, 108, 0.05);
}

.warning-item.caution {
  border-left-color: var(--color-orange);
  background: rgba(230, 162, 60, 0.05);
}

.warning-item.info {
  border-left-color: var(--color-blue);
  background: rgba(64, 158, 255, 0.05);
}

.warning-icon-wrapper {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: var(--shadow-sm);
}

.warning-icon {
  width: 24px;
  height: 24px;
}

.warning-item.danger .warning-icon { color: var(--color-red); }
.warning-item.caution .warning-icon { color: var(--color-orange); }
.warning-item.info .warning-icon { color: var(--color-blue); }

.warning-content {
  flex: 1;
  min-width: 0;
}

.warning-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin: 0 0 var(--spacing-xs) 0;
}

.warning-item.danger .warning-title { color: #b91c1c; }
.warning-item.caution .warning-title { color: #c2410c; }
.warning-item.info .warning-title { color: #1e40af; }

.warning-text {
  font-size: var(--font-size-md);
  margin: 0;
  line-height: 1.6;
}

.warning-item.danger .warning-text { color: #dc2626; }
.warning-item.caution .warning-text { color: #ea580c; }
.warning-item.info .warning-text { color: #2563eb; }

/* =================== 체크리스트 =================== */
.checklist-section {
  background: var(--color-background-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
}

.checklist-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xl) 0;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast) var(--easing-base);
}

.checklist-item:hover {
  background: rgba(103, 194, 58, 0.05);
}

.checklist-item.checked {
  background: rgba(103, 194, 58, 0.1);
}

.checkbox-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  line-height: 1.6;
  user-select: none;
}

/* =================== 강의 정보 =================== */
.course-info {
  margin-bottom: var(--spacing-2xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  border: 2px solid var(--color-border-light);
}

.course-icon-wrapper {
  width: 48px;
  height: 48px;
  background: var(--gradient-education);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-green);
}

.course-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.course-details {
  flex: 1;
  min-width: 0;
}

.course-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
}

.course-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =================== 푸터 =================== */
.card-footer {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding: 0;
  background: transparent;
  border: none;
}

.action-button {
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-2xl);
  font-size: var(--font-size-lg);
  font-weight: 600;
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast) var(--easing-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.action-button:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.action-button.secondary {
  background: var(--color-background-light);
  color: var(--color-text-primary);
  border-color: var(--color-border-base);
}

.action-button.secondary:hover {
  background: var(--color-background-dark);
  border-color: var(--color-border-dark);
}

.action-button.education-button:not(.disabled) {
  color: white;
  border: none;
}

.action-button.disabled {
  background: var(--color-border-light) !important;
  color: var(--color-text-placeholder) !important;
  cursor: not-allowed !important;
  opacity: 0.6;
  box-shadow: none !important;
}

.button-icon {
  width: 20px;
  height: 20px;
}

.footer-note {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* =================== 애니메이션 =================== */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* =================== 반응형 디자인 =================== */
@media (max-width: 640px) {
  .warning-container {
    padding: var(--spacing-lg);
  }

  .title {
    font-size: var(--font-size-3xl);
  }

  .subtitle {
    font-size: var(--font-size-md);
  }

  .warning-item {
    flex-direction: column;
    padding: var(--spacing-lg);
  }

  .checklist-section {
    padding: var(--spacing-xl);
  }

  .card-footer {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}

/* =================== 접근성 =================== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>