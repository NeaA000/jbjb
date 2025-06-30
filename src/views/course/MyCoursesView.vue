<!-- web/src/views/course/MyCoursesView.vue -->
<template>
  <div class="page-wrapper">
    <!-- 헤더 -->
    <header class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <button @click="router.back()" class="back-button">
              <ArrowLeft :size="20" />
            </button>
            <h1 class="page-title">내 강의</h1>
          </div>
          <button
              @click="refreshCourses"
              :disabled="isLoading"
              class="refresh-button"
          >
            <RefreshCw :size="20" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
      </div>
    </header>

    <!-- 탭 네비게이션 -->
    <nav class="tab-navigation">
      <div class="container">
        <div class="tab-list">
          <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="tab-button"
              :class="{ 'tab-active': activeTab === tab.id }"
          >
            {{ tab.label }}
            <span class="tab-count">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="container">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-state">
          <Loader2 :size="48" class="animate-spin" />
          <p>강의 목록을 불러오는 중...</p>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="currentCourses.length === 0" class="empty-state">
          <BookOpen :size="64" />
          <h2 class="empty-title">
            {{ activeTab === 'in-progress' ? '진행 중인 강의가 없습니다' :
              activeTab === 'completed' ? '완료한 강의가 없습니다' :
                  '수강 중인 강의가 없습니다' }}
          </h2>
          <p class="empty-description">
            강의를 수강 신청하면 여기에 표시됩니다
          </p>
          <button
              @click="router.push('/courses')"
              class="btn-primary"
          >
            <Plus :size="16" />
            강의 둘러보기
          </button>
        </div>

        <!-- 강의 목록 -->
        <div v-else class="course-grid">
          <article
              v-for="enrollment in currentCourses"
              :key="enrollment.id"
              class="course-card"
          >
            <!-- 강의 카드 내용 -->
            <div class="course-header">
              <h3 class="course-title">{{ enrollment.course?.title || '제목 없음' }}</h3>
              <div class="course-category">
                <span class="category-path">{{ getCategoryDisplayPath(enrollment.course) }}</span>
                <span
                    v-if="enrollment.course?.category?.leaf"
                    class="category-badge"
                    :style="getCategoryStyle(enrollment.course.category.leaf)"
                >
                  {{ enrollment.course.category.leaf }}
                </span>
              </div>
            </div>

            <div class="course-body">
              <!-- 진도 정보 -->
              <div v-if="enrollment.progress !== undefined" class="progress-section">
                <div class="progress-header">
                  <span>진도율</span>
                  <span class="progress-value">{{ Math.round(enrollment.progress) }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="`width: ${enrollment.progress}%`"></div>
                </div>
              </div>

              <!-- 언어 선택 (다국어 지원 강의만) -->
              <div v-if="enrollment.course?.hasMultipleLanguages" class="language-section">
                <Globe :size="16" />
                <select
                    v-model="selectedLanguages[enrollment.id]"
                    @change="updateSelectedLanguage(enrollment.id, $event.target.value)"
                    class="language-select"
                >
                  <option
                      v-for="lang in enrollment.course.availableLanguages"
                      :key="lang"
                      :value="lang"
                  >
                    {{ getLanguageName(lang) }}
                  </option>
                </select>
              </div>

              <!-- 완료 정보 -->
              <div v-if="enrollment.status === 'completed' || enrollment.progress >= 100" class="completion-info">
                <CheckCircle :size="16" />
                <span>{{ formatDate(enrollment.completedAt) }} 수료</span>
              </div>

              <!-- 학습 정보 -->
              <div class="study-info">
                <div class="info-item">
                  <Clock :size="14" />
                  <span>{{ getRemainingTime(enrollment) }}</span>
                </div>
                <div class="info-item">
                  <Calendar :size="14" />
                  <span>{{ formatDate(enrollment.enrolledAt) }} 시작</span>
                </div>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="course-actions">
              <button
                  v-if="enrollment.progress < 100"
                  @click="continueLearning(enrollment)"
                  class="btn-action btn-primary"
              >
                <Play :size="16" />
                {{ enrollment.progress > 0 ? '이어서 학습' : '학습 시작' }}
              </button>
              <button
                  v-else-if="enrollment.status === 'completed'"
                  @click="viewCertificate(enrollment.courseId)"
                  class="btn-action btn-success"
              >
                <Award :size="16" />
                수료증 보기
              </button>
              <button
                  v-if="enrollment.progress >= 100"
                  @click="reviewCourse(enrollment.courseId)"
                  class="btn-action btn-secondary"
              >
                <PlayCircle :size="16" />
                다시 보기
              </button>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import CategoryService from '@/services/categoryService'
import CourseService from '@/services/courseService'
import ProgressService from '@/services/progressService'
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
  Loader2,
  Globe
} from 'lucide-vue-next'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { FIREBASE_COLLECTIONS } from '@/utils/constants'

const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 상태
const isLoading = ref(false)
const activeTab = ref('in-progress')
const selectedLanguages = reactive({})

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
      enrollment.status === 'completed' || enrollment.progress >= 100
  )
})

// 전체 강의
const allEnrollments = computed(() => {
  return courseStore.enrollments
})

// 현재 탭의 강의들
const currentCourses = computed(() => {
  switch (activeTab.value) {
    case 'in-progress':
      return inProgressCourses.value
    case 'completed':
      return completedCourses.value
    case 'all':
      return allEnrollments.value
    default:
      return []
  }
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
  // Tailwind 클래스 대신 일반 CSS 스타일 객체 반환
  const mainCategory = CategoryService.getMainCategoryForItem(leafCategory)

  const styleMap = {
    '기계': {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    '공구': {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    '장비': {
      backgroundColor: '#e9d5ff',
      color: '#6b21a8'
    },
    '약품': {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    }
  }

  return styleMap[mainCategory] || {
    backgroundColor: '#f3f4f6',
    color: '#374151'
  }
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

// 선택된 언어 업데이트
const updateSelectedLanguage = (enrollmentId, language) => {
  selectedLanguages[enrollmentId] = language
  console.log(`🌍 언어 변경: ${enrollmentId} -> ${language}`)
}

// 학습 이어하기
const continueLearning = (enrollment) => {
  const selectedLang = selectedLanguages[enrollment.id] || 'ko'

  if (authStore.isGuest) {
    router.push({
      path: `/learning/${enrollment.courseId}`,
      query: { lang: selectedLang }
    })
  } else {
    router.push({
      path: `/video-warning/${enrollment.courseId}`,
      query: { lang: selectedLang }
    })
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
    await loadMyCourses()
    ElMessage.success('강의 목록을 새로고침했습니다.')
  } catch (error) {
    ElMessage.error('새로고침에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 내 강의 로드 (기존 ProgressService 사용)
const loadMyCourses = async () => {
  try {
    isLoading.value = true

    // 사용자 확인
    const userId = authStore.user?.uid || (authStore.isGuest ? 'guest' : null)
    if (!userId) {
      console.warn('로그인이 필요합니다')
      router.push('/auth/login')
      return
    }

    // 1. enrollments 컬렉션에서 사용자의 수강 정보 가져오기
    const enrollmentsRef = collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS)
    const q = query(enrollmentsRef, where('userId', '==', userId))
    const enrollmentSnapshot = await getDocs(q)

    const enrollmentsWithCourses = []
    const courseIds = []

    // 2. 각 enrollment에 대해 강의 정보 가져오기
    for (const enrollmentDoc of enrollmentSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data()
      courseIds.push(enrollmentData.courseId)

      // 강의 정보 가져오기
      const course = await CourseService.getCourseById(enrollmentData.courseId)

      enrollmentsWithCourses.push({
        id: enrollmentDoc.id,
        ...enrollmentData,
        course: course,
        progress: 0 // 초기값
      })
    }

    // 3. 배치로 모든 진행률 가져오기
    const progressMap = await ProgressService.loadBatchProgress(userId, courseIds)

    // 4. 진행률 정보 업데이트
    enrollmentsWithCourses.forEach(enrollment => {
      const progressData = progressMap.get(enrollment.courseId)
      if (progressData) {
        enrollment.progress = progressData.progress || 0
        enrollment.lastWatchedTime = progressData.lastWatchedTime || 0
        enrollment.status = progressData.completed ? 'completed' : enrollment.status || 'enrolled'
      }
    })

    // store 업데이트
    courseStore.enrollments = enrollmentsWithCourses

    // 각 강의의 기본 언어 설정
    enrollmentsWithCourses.forEach(enrollment => {
      if (enrollment.course?.availableLanguages?.length > 0) {
        selectedLanguages[enrollment.id] = enrollment.preferredLanguage || 'ko'
      }
    })

    console.log('✅ 내 강의 로드 완료:', enrollmentsWithCourses.length)
  } catch (error) {
    console.error('내 강의 로드 오류:', error)
    ElMessage.error('강의 목록을 불러올 수 없습니다.')
  } finally {
    isLoading.value = false
  }
}

// 마운트 시 로드
onMounted(() => {
  loadMyCourses()
})
</script>

<style scoped>
/* =================== 기본 레이아웃 =================== */
.page-wrapper {
  min-height: 100vh;
  background: var(--bg-primary, #ffffff);
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

/* =================== 헤더 =================== */
.page-header {
  background: var(--bg-primary, #ffffff);
  border-bottom: 1px solid var(--border-primary, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button, .refresh-button {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  border-radius: var(--radius-md, 0.375rem);
  transition: all var(--transition-fast, 0.15s ease);
}

.back-button:hover, .refresh-button:hover {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #374151);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* =================== 탭 네비게이션 =================== */
.tab-navigation {
  background: var(--bg-primary, #ffffff);
  border-bottom: 1px solid var(--border-primary, #e5e7eb);
  position: sticky;
  top: 3.5rem;
  z-index: 30;
}

.tab-list {
  display: flex;
  gap: 2rem;
  height: 3rem;
}

.tab-button {
  padding: 0 0.5rem;
  height: 100%;
  border: none;
  background: none;
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast, 0.15s ease);
}

.tab-button:hover {
  color: var(--text-primary, #374151);
}

.tab-button.tab-active {
  color: var(--accent-primary, #3b82f6);
}

.tab-button.tab-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-primary, #3b82f6);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  margin-left: 0.25rem;
  background: var(--bg-tertiary, #e5e7eb);
  color: var(--text-secondary, #6b7280);
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--font-medium, 500);
  border-radius: var(--radius-full, 9999px);
}

.tab-active .tab-count {
  background: var(--accent-primary, #3b82f6);
  color: white;
}

/* =================== 메인 콘텐츠 =================== */
.main-content {
  flex: 1;
  padding: 2rem 0;
}

/* =================== 로딩 상태 =================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-secondary, #6b7280);
}

.loading-state p {
  margin-top: 1rem;
}

/* =================== 빈 상태 =================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state svg {
  color: var(--text-tertiary, #d1d5db);
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: var(--text-xl, 1.25rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
  margin-bottom: 0.5rem;
}

.empty-description {
  color: var(--text-secondary, #6b7280);
  margin-bottom: 2rem;
}

/* =================== 강의 그리드 =================== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* =================== 강의 카드 =================== */
.course-card {
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-primary, #e5e7eb);
  border-radius: var(--radius-lg, 0.5rem);
  padding: 1.5rem;
  transition: all var(--transition-base, 0.3s ease);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.course-card:hover {
  border-color: var(--border-secondary, #d1d5db);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

/* =================== 강의 헤더 =================== */
.course-header {
  margin-bottom: 0.5rem;
}

.course-title {
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary, #111827);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.course-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-path {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
}

.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: var(--text-xs, 0.75rem);
  font-weight: var(--font-medium, 500);
  border-radius: var(--radius-full, 9999px);
}

/* =================== 진도 정보 =================== */
.progress-section {
  margin-bottom: 0.75rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.25rem;
}

.progress-value {
  font-weight: var(--font-medium, 500);
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-tertiary, #e5e7eb);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary, #3b82f6);
  transition: width var(--transition-base, 0.3s ease);
}

/* =================== 언어 선택 =================== */
.language-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-tertiary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
}

.language-section svg {
  color: var(--text-secondary, #6b7280);
}

.language-select {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-primary, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  background: white;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-primary, #374151);
  cursor: pointer;
}

.language-select:focus {
  outline: none;
  border-color: var(--accent-primary, #3b82f6);
}

/* =================== 완료 정보 =================== */
.completion-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--accent-success-light, #d1fae5);
  color: var(--accent-success, #10b981);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  border-radius: var(--radius-md, 0.375rem);
}

/* =================== 학습 정보 =================== */
.study-info {
  display: flex;
  gap: 1rem;
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #6b7280);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* =================== 액션 버튼 =================== */
.course-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  border: none;
  border-radius: var(--radius-md, 0.375rem);
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
}

.btn-primary {
  background: var(--accent-primary, #3b82f6);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-primary-dark, #2563eb);
}

.btn-success {
  background: var(--accent-success, #10b981);
  color: white;
}

.btn-success:hover {
  background: var(--accent-success-dark, #059669);
}

.btn-secondary {
  background: var(--bg-tertiary, #e5e7eb);
  color: var(--text-primary, #374151);
}

.btn-secondary:hover {
  background: var(--bg-quaternary, #d1d5db);
}

/* =================== 반응형 =================== */
@media (max-width: 768px) {
  .course-grid {
    grid-template-columns: 1fr;
  }

  .tab-list {
    gap: 1rem;
  }

  .study-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .course-actions {
    flex-direction: column;
  }
}
</style>