<!-- components/course/CourseCard.vue -->
<template>
  <el-card
      :class="['course-card', { 'selected': isSelected, 'has-progress': hasProgress, 'enrolled': isEnrolled }]"
      shadow="hover"
      @click="handleCardClick"
  >
    <!-- 썸네일 영역 -->
    <div class="course-thumbnail">
      <div class="thumbnail-container">
        <img
            v-if="course.thumbnailUrl"
            :src="course.thumbnailUrl"
            :alt="course.title"
            class="thumbnail-image"
            @error="onImageError"
            loading="lazy"
        />
        <div v-else class="thumbnail-placeholder">
          <el-icon size="40" color="var(--text-tertiary)">
            <VideoPlay />
          </el-icon>
        </div>

        <!-- 썸네일 로딩 중 표시 -->
        <div v-if="thumbnailLoading" class="thumbnail-loading">
          <el-icon class="is-loading" size="30">
            <Loading />
          </el-icon>
        </div>

        <!-- 수강중 배지 추가 -->
        <div v-if="isEnrolled" class="enrolled-badge">
          <el-icon size="16"><Check /></el-icon>
          <span>수강중</span>
        </div>

        <!-- 선택 체크박스 (선택 모드일 때, 수강중이면 비활성화) -->
        <div v-if="selectable && !isEnrolled" class="selection-overlay">
          <el-checkbox
              :model-value="isSelected"
              @change="handleSelection"
              @click.stop
              size="large"
              :disabled="isEnrolled"
          />
        </div>

        <!-- 강의 상태 배지 -->
        <div class="status-badges">
          <el-tag
              v-if="isNewCourse"
              type="success"
              size="small"
              class="status-badge"
          >
            NEW
          </el-tag>
          <el-tag
              v-if="course.flaskData?.railwayOptimized"
              type="warning"
              size="small"
              class="status-badge"
          >
            최적화
          </el-tag>
          <el-tag
              v-if="course.qrUrl"
              type="info"
              size="small"
              class="status-badge"
          >
            QR
          </el-tag>
        </div>

        <!-- 재생 시간 표시 -->
        <div class="duration-badge">
          <el-tag size="small" type="info" effect="dark">
            <el-icon size="12"><Timer /></el-icon>
            <span class="duration-text">{{ course.duration || '30분' }}</span>
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 카드 내용 -->
    <div class="course-content">
      <!-- 카테고리 -->
      <div class="course-category">
        <el-tag
            size="small"
            :style="{
              backgroundColor: getCategoryColor(course.category?.leaf) + '20',
              color: getCategoryColor(course.category?.leaf),
              border: `1px solid ${getCategoryColor(course.category?.leaf)}40`
            }"
        >
          {{ getCategoryPath(course) }}
        </el-tag>
      </div>

      <!-- 제목 -->
      <h3 class="course-title">{{ course.title }}</h3>

      <!-- 설명 -->
      <p v-if="course.description" class="course-description">
        {{ course.description }}
      </p>

      <!-- 메타 정보 -->
      <div class="course-meta">
        <div class="meta-item">
          <el-icon><User /></el-icon>
          <span>{{ enrollmentCount }}명 수강중</span>
        </div>
        <div v-if="hasProgress" class="meta-item">
          <el-icon><Trophy /></el-icon>
          <span>{{ Math.round(courseProgress) }}% 완료</span>
        </div>
        <div v-else-if="course.difficulty" class="meta-item">
          <el-icon><Promotion /></el-icon>
          <span>{{ difficultyText }}</span>
        </div>
      </div>

      <!-- 진행률 바 -->
      <div v-if="hasProgress" class="progress-bar">
        <div
            class="progress-fill"
            :style="{ width: `${courseProgress}%` }"
        ></div>
      </div>

      <!-- Flask 메타 정보 -->
      <div v-if="course.flaskData" class="flask-meta">
        <el-tooltip
            v-if="course.flaskData.confidence"
            :content="`신뢰도: ${(course.flaskData.confidence * 100).toFixed(1)}%`"
            placement="top"
        >
          <el-tag size="small" type="info">
            <el-icon><DataAnalysis /></el-icon>
            {{ (course.flaskData.confidence * 100).toFixed(0) }}%
          </el-tag>
        </el-tooltip>

        <el-tooltip
            v-if="course.hasMultipleLanguages"
            :content="`지원 언어: ${course.availableLanguages?.join(', ') || ''}`"
            placement="top"
        >
          <el-tag size="small" type="success">
            <el-icon><Globe /></el-icon>
            {{ course.availableLanguages?.length || 0 }}개 언어
          </el-tag>
        </el-tooltip>
      </div>

      <!-- 액션 버튼들 -->
      <div class="course-actions">
        <!-- 등록 안 됨 -->
        <template v-if="!isEnrolled">
          <el-button
              type="primary"
              size="small"
              @click.stop="handleEnroll"
              :loading="enrolling"
          >
            <el-icon><Plus /></el-icon>
            수강 신청
          </el-button>
          <el-button
              v-if="course.qrUrl"
              type="success"
              size="small"
              plain
              @click.stop="handleQRAccess"
              class="qr-btn"
          >
            <el-icon><QrCode /></el-icon>
            QR 수강
          </el-button>
        </template>

        <!-- 등록됨 -->
        <template v-else>
          <!-- 진행 중 -->
          <el-button
              v-if="hasProgress && !isCompleted"
              type="primary"
              size="small"
              @click.stop="handleContinue"
          >
            <el-icon><VideoPlay /></el-icon>
            이어보기
          </el-button>

          <!-- 시작 전 -->
          <el-button
              v-else-if="!hasProgress"
              type="success"
              size="small"
              @click.stop="handleStart"
          >
            <el-icon><PlayCircle /></el-icon>
            학습 시작
          </el-button>

          <!-- 완료됨 -->
          <el-button
              v-else
              type="info"
              size="small"
              plain
              @click.stop="handleReview"
          >
            <el-icon><RefreshRight /></el-icon>
            다시보기
          </el-button>
        </template>

        <!-- 북마크 버튼 -->
        <el-button
            size="small"
            circle
            :type="isBookmarked ? 'warning' : 'default'"
            @click.stop="handleBookmark"
            class="bookmark-btn"
        >
          <el-icon>
            <StarFilled v-if="isBookmarked" />
            <Star v-else />
          </el-icon>
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  VideoPlay,
  Timer,
  User,
  Trophy,
  Promotion,
  Plus,
  PlayCircle,
  RefreshRight,
  Star,
  StarFilled,
  QrCode,
  DataAnalysis,
  Globe,
  Check,
  Loading
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  enrollment: {
    type: Object,
    default: null
  },
  selectable: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isBookmarked: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'click',
  'select',
  'enroll',
  'continue',
  'start',
  'review',
  'bookmark',
  'qr-access'
])

// State
const enrolling = ref(false)
const thumbnailLoading = ref(false)

// Computed
const isEnrolled = computed(() => {
  return !!props.enrollment || props.course.isEnrolled
})

const hasProgress = computed(() => {
  const progress = props.enrollment?.progress || props.course.progress
  return progress !== undefined && progress !== null && progress > 0
})

const courseProgress = computed(() => {
  const progress = props.enrollment?.progress || props.course.progress || 0
  return typeof progress === 'number' ? Math.min(Math.max(progress, 0), 100) : 0
})

const isCompleted = computed(() => {
  return courseProgress.value >= 100 || props.enrollment?.status === 'completed'
})

const isNewCourse = computed(() => {
  if (!props.course.createdAt) return false
  const createdDate = new Date(props.course.createdAt)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return createdDate > sevenDaysAgo
})

const enrollmentCount = computed(() => {
  return props.course.enrolledCount || Math.floor(Math.random() * 50) + 10
})

const difficultyText = computed(() => {
  const levels = {
    'beginner': '초급',
    'intermediate': '중급',
    'advanced': '고급'
  }
  return levels[props.course.difficulty] || '중급'
})

// Methods
const getCategoryPath = (course) => {
  if (!course.category) return '미분류'
  const { main, middle, leaf } = course.category
  if (leaf) return leaf
  if (middle) return middle
  return main || '미분류'
}

const getCategoryColor = (category) => {
  const colors = {
    '안전': '#10b981',
    '보건': '#3b82f6',
    '환경': '#22c55e',
    '품질': '#f59e0b',
    '건설': '#ef4444',
    '화학': '#8b5cf6',
    'IT': '#06b6d4',
    '경영': '#ec4899',
    '기타': '#6b7280'
  }

  // 카테고리명에 키워드가 포함되어 있는지 확인
  for (const [keyword, color] of Object.entries(colors)) {
    if (category?.includes(keyword)) {
      return color
    }
  }

  return colors['기타']
}

// Event Handlers
const handleCardClick = () => {
  emit('click', props.course)
}

const handleSelection = (checked) => {
  emit('select', { course: props.course, selected: checked })
}

const handleEnroll = async () => {
  try {
    enrolling.value = true
    emit('enroll', props.course)
  } finally {
    enrolling.value = false
  }
}

const handleContinue = () => {
  emit('continue', props.course)
}

const handleStart = () => {
  emit('start', props.course)
}

const handleReview = () => {
  emit('review', props.course)
}

const handleQRAccess = () => {
  emit('qr-access', props.course)
}

const handleBookmark = () => {
  emit('bookmark', props.course, !props.isBookmarked)
}

const onImageError = (event) => {
  thumbnailLoading.value = false
  const target = event.target
  if (target) {
    // 대체 이미지 표시
    target.style.display = 'none'

    // 부모 요소에 플레이스홀더 표시
    const placeholder = target.parentElement.querySelector('.thumbnail-placeholder')
    if (placeholder) {
      placeholder.style.display = 'flex'
    }
  }
  console.warn('강의 썸네일 로드 실패:', props.course.id)
}
</script>

<style scoped>
/* =================== 카드 기본 스타일 =================== */
.course-card {
  position: relative;
  cursor: pointer;
  transition: all var(--transition-base);
  border-radius: var(--radius-xl);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-primary);
}

.course-card.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.course-card.has-progress {
  border-left: 4px solid var(--accent-primary);
}

/* 수강중인 카드 스타일 */
.course-card.enrolled {
  background: linear-gradient(to bottom, #f0f9ff 0%, var(--bg-secondary) 100%);
  border-color: #3b82f6;
  position: relative;
}

.course-card.enrolled::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
}

/* =================== 썸네일 영역 =================== */
.course-thumbnail {
  position: relative;
  width: 100%;
  flex-shrink: 0;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.course-card:hover .thumbnail-image {
  transform: scale(1.05);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-gray-200) 100%);
}

/* 썸네일 로딩 표시 */
.thumbnail-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
}

/* =================== 수강중 배지 =================== */
.enrolled-badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: #3b82f6;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 3;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* =================== 오버레이 요소들 =================== */
.selection-overlay {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  z-index: 2;
}

.status-badges {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 2;
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.status-badge {
  font-weight: var(--font-semibold);
  font-size: var(--text-xs);
}

.duration-badge {
  position: absolute;
  bottom: var(--space-3);
  right: var(--space-3);
  z-index: 2;
}

.duration-text {
  margin-left: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

/* =================== 콘텐츠 영역 =================== */
.course-content {
  padding: var(--space-4);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.course-category {
  flex-shrink: 0;
}

.course-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-tight);

  /* 텍스트 말줄임 (2줄) */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  /* 최소/최대 높이 설정 */
  min-height: calc(var(--text-lg) * var(--leading-tight) * 1);
  max-height: calc(var(--text-lg) * var(--leading-tight) * 2);
}

.course-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);

  /* 텍스트 말줄임 (3줄) */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =================== 메타 정보 =================== */
.course-meta {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.meta-item .el-icon {
  font-size: var(--text-base);
}

/* =================== 진행률 바 =================== */
.progress-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--space-2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary) 0%, var(--color-primary-600) 100%);
  transition: width var(--transition-base);
  border-radius: var(--radius-full);
}

/* =================== Flask 메타 정보 =================== */
.flask-meta {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

/* =================== 액션 버튼들 =================== */
.course-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-primary);
  flex-wrap: wrap;
}

.qr-btn {
  background: linear-gradient(45deg, var(--accent-primary), var(--color-success));
  color: white;
  border: none;
}

.qr-btn:hover {
  background: linear-gradient(45deg, var(--accent-hover), var(--color-success));
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.bookmark-btn {
  margin-left: auto;
}

/* 수강중인 카드의 버튼 스타일 */
.course-card.enrolled .course-actions {
  border-top-color: #e0e7ff;
}

/* =================== 반응형 디자인 =================== */
@media (max-width: 768px) {
  .thumbnail-container {
    height: 140px;
  }

  .course-content {
    padding: var(--space-3);
    gap: var(--space-2);
  }

  .course-title {
    font-size: var(--text-base);
  }

  .course-description {
    font-size: var(--text-xs);
  }

  .course-actions {
    gap: var(--space-1);
  }

  .course-actions .el-button {
    flex: 1;
    min-width: 0;
  }

  .bookmark-btn {
    flex: none;
    margin-left: var(--space-1);
  }

  .flask-meta {
    font-size: var(--text-xs);
    padding: var(--space-1);
    flex-direction: column;
    gap: var(--space-1);
  }
}

@media (max-width: 480px) {
  .thumbnail-container {
    height: 120px;
  }

  .status-badges,
  .duration-badge {
    display: none; /* 작은 화면에서는 숨김 */
  }

  .course-meta {
    font-size: var(--text-xs);
  }

  .course-actions {
    flex-direction: column;
  }

  .bookmark-btn {
    align-self: flex-end;
    margin-left: 0;
  }
}

/* =================== 접근성 =================== */
@media (prefers-reduced-motion: reduce) {
  .course-card,
  .thumbnail-image {
    transition: none;
  }

  .course-card:hover {
    transform: none;
  }
}

/* =================== 포커스 스타일 =================== */
.course-card:focus,
.course-card:focus-within {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* =================== 애니메이션 =================== */
.course-card {
  animation: slideUp var(--transition-base) ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =================== 로딩 애니메이션 =================== */
.is-loading {
  animation: loading-rotate 2s linear infinite;
}

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>