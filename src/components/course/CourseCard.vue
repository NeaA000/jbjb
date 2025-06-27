<!-- components/course/CourseCard.vue -->
<template>
  <el-card
      :class="['course-card', { 'selected': isSelected, 'has-progress': hasProgress }]"
      shadow="hover"
      @click="handleCardClick"
  >
    <!-- 썸네일 영역 -->
    <div class="course-thumbnail">
      <div class="thumbnail-container">
        <img
            v-if="course.thumbnail"
            :src="course.thumbnail"
            :alt="course.title"
            class="thumbnail-image"
            @error="onImageError"
        />
        <div v-else class="thumbnail-placeholder">
          <el-icon size="40" color="var(--text-tertiary)">
            <VideoPlay />
          </el-icon>
        </div>

        <!-- 선택 체크박스 (선택 모드일 때) -->
        <div v-if="selectable" class="selection-overlay">
          <el-checkbox
              :model-value="isSelected"
              @change="handleSelection"
              @click.stop
              size="large"
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
              v-if="course.qrCode"
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
            <el-icon size="12"><Clock /></el-icon>
            <span class="duration-text">{{ formatDuration(course.duration) }}</span>
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 카드 콘텐츠 -->
    <div class="course-content">
      <!-- 카테고리 태그 -->
      <div class="course-category">
        <el-tag
            :type="getCategoryType(course.category?.main)"
            size="small"
            effect="light"
        >
          {{ getCategoryDisplayText(course.category) }}
        </el-tag>
      </div>

      <!-- 제목 -->
      <h3 class="course-title" :title="course.title">
        {{ course.title }}
      </h3>

      <!-- 설명 -->
      <p class="course-description" :title="course.description">
        {{ course.description }}
      </p>

      <!-- 강사 및 메타 정보 -->
      <div class="course-meta">
        <div class="instructor-info">
          <el-icon size="14" color="var(--text-tertiary)"><User /></el-icon>
          <span class="instructor-name">{{ course.instructor }}</span>
        </div>

        <div class="meta-divider">•</div>

        <div class="difficulty-info">
          <el-tag
              :type="getDifficultyType(course.difficulty)"
              size="small"
              effect="plain"
          >
            {{ getDifficultyText(course.difficulty) }}
          </el-tag>
        </div>

        <div v-if="course.rating" class="rating-info">
          <div class="meta-divider">•</div>
          <el-icon size="14" color="var(--color-warning)"><Star /></el-icon>
          <span class="rating-value">{{ course.rating.toFixed(1) }}</span>
        </div>

        <!-- 언어 지원 -->
        <div v-if="supportedLanguages.length > 1" class="language-info">
          <div class="meta-divider">•</div>
          <el-icon size="14" color="var(--color-success)"><Reading /></el-icon>
          <span class="language-count">{{ supportedLanguages.length }}개 언어</span>
        </div>
      </div>

      <!-- Flask 특화 정보 -->
      <div v-if="course.flaskData" class="flask-meta">
        <div class="flask-info">
          <el-icon size="12" color="var(--text-tertiary)"><DataLine /></el-icon>
          <span class="flask-text">Flask ID: {{ course.flaskData.groupId }}</span>
        </div>
        <div v-if="course.flaskData.basefolder" class="folder-info">
          <el-icon size="12" color="var(--text-tertiary)"><FolderOpened /></el-icon>
          <span class="folder-text">{{ course.flaskData.basefolder }}</span>
        </div>
      </div>

      <!-- 진행률 (수강 중인 경우) -->
      <div v-if="hasProgress && normalizedProgress > 0" class="course-progress">
        <div class="progress-header">
          <span class="progress-label">진행률</span>
          <span class="progress-value">{{ Math.round(normalizedProgress) }}%</span>
        </div>
        <el-progress
            :percentage="normalizedProgress"
            :stroke-width="6"
            :show-text="false"
            :color="getProgressColor(normalizedProgress)"
        />
        <div v-if="progressLastWatched" class="last-watched">
          <span class="last-watched-text">
            {{ formatLastWatched(progressLastWatched) }}에 시청
          </span>
        </div>
      </div>

      <!-- 액션 버튼들 -->
      <div class="course-actions">
        <!-- 수강 신청 버튼 -->
        <el-button
            v-if="showEnrollButton"
            type="primary"
            size="small"
            @click.stop="handleEnroll"
            :loading="enrolling"
        >
          <template #icon>
            <el-icon><Plus /></el-icon>
          </template>
          {{ isSelected ? '선택됨' : '선택하기' }}
        </el-button>

        <!-- 이어보기 버튼 -->
        <el-button
            v-if="showContinueButton"
            type="success"
            size="small"
            @click.stop="handleContinue"
        >
          <template #icon>
            <el-icon><VideoPlay /></el-icon>
          </template>
          이어보기
        </el-button>

        <!-- 시작하기 버튼 -->
        <el-button
            v-if="showStartButton"
            type="primary"
            size="small"
            @click.stop="handleStart"
        >
          <template #icon>
            <el-icon><VideoPlay /></el-icon>
          </template>
          시작하기
        </el-button>

        <!-- 다시보기 버튼 -->
        <el-button
            v-if="showReviewButton"
            type="info"
            size="small"
            @click.stop="handleReview"
        >
          <template #icon>
            <el-icon><Refresh /></el-icon>
          </template>
          다시보기
        </el-button>

        <!-- QR 접근 버튼 -->
        <el-button
            v-if="course.qrCode"
            size="small"
            @click.stop="handleQRAccess"
            class="qr-btn"
        >
          <template #icon>
            <el-icon><CameraFilled /></el-icon>
          </template>
          QR 보기
        </el-button>

        <!-- 북마크 버튼 -->
        <el-button
            v-if="showBookmark"
            :type="isBookmarked ? 'warning' : 'info'"
            size="small"
            circle
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
import { computed, ref } from 'vue'
import {
  VideoPlay,
  Clock,
  User,
  Star,
  StarFilled,
  Plus,
  Refresh,
  CameraFilled,
  Reading,
  DataLine,
  FolderOpened
} from '@element-plus/icons-vue'

// Props 정의 - JavaScript 방식
const props = defineProps({
  // 강의 정보 (Flask 연동)
  course: {
    type: Object,
    required: true
  },

  // 진행률 정보 - Number 타입도 허용
  progress: {
    type: [Object, Number],
    default: null
  },

  // 선택 가능 여부
  selectable: {
    type: Boolean,
    default: false
  },

  // 선택 상태
  isSelected: {
    type: Boolean,
    default: false
  },

  // 북마크 상태
  isBookmarked: {
    type: Boolean,
    default: false
  },

  // 표시할 버튼들
  showEnrollButton: {
    type: Boolean,
    default: false
  },

  showContinueButton: {
    type: Boolean,
    default: false
  },

  showStartButton: {
    type: Boolean,
    default: false
  },

  showReviewButton: {
    type: Boolean,
    default: false
  },

  showBookmark: {
    type: Boolean,
    default: true
  },

  // 카드 크기
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  }
})

// Emits 정의 - JavaScript 방식
const emit = defineEmits([
  'click',
  'select',
  'enroll',
  'continue',
  'start',
  'review',
  'qr-access',
  'bookmark'
])

// 로컬 상태
const enrolling = ref(false)

// 진행률 정규화
const hasProgress = computed(() => {
  return props.progress !== null && props.progress !== undefined
})

const normalizedProgress = computed(() => {
  if (!props.progress) return 0

  // Number 타입인 경우
  if (typeof props.progress === 'number') {
    return Math.min(100, Math.max(0, props.progress))
  }

  // CourseProgress 객체인 경우
  return Math.min(100, Math.max(0, props.progress.progress || 0))
})

const progressLastWatched = computed(() => {
  if (!props.progress || typeof props.progress === 'number') {
    return null
  }
  return props.progress.lastWatchedAt || props.progress.lastViewedAt
})

// 계산된 속성
const isNewCourse = computed(() => {
  if (!props.course.createdAt) return false
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return new Date(props.course.createdAt) > weekAgo
})

const supportedLanguages = computed(() => {
  if (!props.course.flaskData?.supportedLanguages) return ['ko']
  return props.course.flaskData.supportedLanguages
})

// 카테고리 타입 매핑
const getCategoryType = (category) => {
  const types = {
    '전체': 'primary',
    '기계': 'success',
    '공구': 'warning',
    '장비': 'danger',
    '약품': 'info'
  }
  return types[category || ''] || 'primary'
}

// 카테고리 표시 텍스트
const getCategoryDisplayText = (category) => {
  if (!category) return '기타'

  if (category.leaf) return category.leaf
  if (category.middle && category.middle !== category.main) return category.middle
  return category.main || '기타'
}

// 난이도 타입 매핑
const getDifficultyType = (difficulty) => {
  const types = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'danger'
  }
  return types[difficulty || ''] || 'info'
}

// 난이도 텍스트
const getDifficultyText = (difficulty) => {
  const texts = {
    'beginner': '초급',
    'intermediate': '중급',
    'advanced': '고급'
  }
  return texts[difficulty || ''] || '미정'
}

// 진행률 색상
const getProgressColor = (progress) => {
  if (progress >= 100) return 'var(--color-success)'
  if (progress >= 50) return 'var(--color-warning)'
  return 'var(--accent-primary)'
}

// 시간 포맷팅
const formatDuration = (minutes) => {
  if (!minutes) return '0분'

  if (minutes < 60) {
    return `${minutes}분`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}시간`
  }

  return `${hours}시간 ${remainingMinutes}분`
}

// 마지막 시청 시간 포맷팅
const formatLastWatched = (date) => {
  if (!date) return ''

  const watchedDate = new Date(date)
  const now = new Date()
  const diff = now.getTime() - watchedDate.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}분 전`
  } else if (hours < 24) {
    return `${hours}시간 전`
  } else {
    return `${days}일 전`
  }
}

// 이벤트 핸들러
const handleCardClick = () => {
  emit('click', props.course)
}

const handleSelection = (selected) => {
  emit('select', props.course, selected)
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
  const target = event.target
  if (target) {
    target.style.display = 'none'
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
  margin: 0;
  line-height: var(--leading-normal);

  /* 텍스트 말줄임 (2줄) */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  /* 최소/최대 높이 설정 */
  min-height: calc(var(--text-sm) * var(--leading-normal) * 1);
  max-height: calc(var(--text-sm) * var(--leading-normal) * 2);
}

/* =================== 메타 정보 =================== */
.course-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.instructor-info,
.difficulty-info,
.rating-info,
.language-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.instructor-name,
.rating-value,
.language-count {
  font-weight: var(--font-medium);
}

.meta-divider {
  color: var(--border-secondary);
  font-weight: var(--font-bold);
}

/* =================== Flask 메타 정보 =================== */
.flask-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  padding: var(--space-2);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  margin-top: auto;
}

.flask-info,
.folder-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.flask-text,
.folder-text {
  font-weight: var(--font-medium);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =================== 진행률 =================== */
.course-progress {
  margin-top: auto;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.progress-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.progress-value {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--accent-primary);
}

.last-watched {
  margin-top: var(--space-1);
  text-align: center;
}

.last-watched-text {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
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