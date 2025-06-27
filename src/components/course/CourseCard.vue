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

      <!-- Flask 메타 정보 -->
      <div v-if="course.flaskData" class="flask-meta">
        <div v-if="course.flaskData.totalViews" class="meta-item">
          <el-icon size="12"><View /></el-icon>
          <span>{{ formatViews(course.flaskData.totalViews) }}회</span>
        </div>
        <div v-if="course.flaskData.favoriteCount" class="meta-item">
          <el-icon size="12"><Star /></el-icon>
          <span>{{ course.flaskData.favoriteCount }}명</span>
        </div>
      </div>

      <!-- 진행률 표시 (있을 경우) -->
      <div v-if="hasProgress && progress > 0" class="progress-section">
        <div class="progress-info">
          <span class="progress-label">진행률</span>
          <span class="progress-value">{{ progress }}%</span>
        </div>
        <el-progress
            :percentage="progress"
            :stroke-width="6"
            :show-text="false"
            :color="getProgressColor(progress)"
        />
        <div v-if="lastWatched" class="last-watched">
          <el-icon size="12"><Clock /></el-icon>
          <span>{{ formatLastWatched(lastWatched) }} 시청</span>
        </div>
      </div>

      <!-- 액션 버튼들 -->
      <div class="course-actions">
        <template v-if="isEnrolled">
          <el-button
              v-if="progress === 100"
              type="success"
              size="small"
              @click.stop="handleReview"
          >
            <el-icon><Trophy /></el-icon>
            <span>복습하기</span>
          </el-button>
          <el-button
              v-else-if="progress > 0"
              type="primary"
              size="small"
              @click.stop="handleContinue"
          >
            <el-icon><VideoPlay /></el-icon>
            <span>이어보기</span>
          </el-button>
          <el-button
              v-else
              type="primary"
              size="small"
              @click.stop="handleStart"
          >
            <el-icon><VideoPlay /></el-icon>
            <span>학습시작</span>
          </el-button>
        </template>

        <template v-else>
          <el-button
              v-if="enrollable && !isEnrolled"
              type="primary"
              size="small"
              @click.stop="handleEnroll"
              :loading="enrolling"
              :disabled="isEnrolled"
          >
            <el-icon v-if="!enrolling"><Plus /></el-icon>
            <span>{{ isEnrolled ? '수강중' : '수강신청' }}</span>
          </el-button>
        </template>

        <el-button
            v-if="course.qrCode"
            type="info"
            size="small"
            @click.stop="handleQRAccess"
            class="qr-btn"
        >
          <el-icon><Cellphone /></el-icon>
          <span>QR</span>
        </el-button>

        <!-- 북마크 버튼 -->
        <el-button
            :type="isBookmarked ? 'warning' : 'default'"
            size="small"
            @click.stop="handleBookmark"
            circle
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
import { useCourseStore } from '@/stores/course'
import {
  VideoPlay, Clock, User, Star, StarFilled, Reading, View,
  Trophy, Plus, Cellphone, Check
} from '@element-plus/icons-vue'
import { CategoryService } from '@/services/categoryService'

// Props
const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  selectable: {
    type: Boolean,
    default: false
  },
  enrollable: {
    type: Boolean,
    default: false
  },
  hasProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  lastWatched: {
    type: Date,
    default: null
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
  'qr-access',
  'bookmark'
])

// Store
const courseStore = useCourseStore()

// 상태
const enrolling = ref(false)

// 수강 여부 확인
const isEnrolled = computed(() => {
  return courseStore.getEnrollmentStatus(props.course.id) !== 'not-enrolled'
})

// 계산된 속성들
const isNewCourse = computed(() => {
  if (!props.course.createdAt) return false
  const created = new Date(props.course.createdAt)
  const now = new Date()
  const daysDiff = (now - created) / (1000 * 60 * 60 * 24)
  return daysDiff <= 7
})

const supportedLanguages = computed(() => {
  return props.course.availableLanguages || ['ko']
})

// 유틸리티 함수들
const formatViews = (views) => {
  if (views >= 10000) return `${Math.floor(views / 10000)}만`
  if (views >= 1000) return `${Math.floor(views / 1000)}천`
  return views.toString()
}

// 카테고리 관련
const getCategoryType = (mainCategory) => {
  const typeMap = {
    '개발': 'primary',
    '디자인': 'warning',
    '마케팅': 'success',
    '비즈니스': 'info',
    '교육': 'danger'
  }
  return typeMap[mainCategory] || ''
}

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
  if (progress >= 100) return '#67c23a'
  if (progress >= 50) return '#e6a23c'
  return '#409eff'
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
  if (!isEnrolled.value) {
    emit('select', props.course, selected)
  }
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

  /* 최소 높이 설정 */
  min-height: calc(var(--text-sm) * var(--leading-relaxed) * 2);
}

/* =================== 메타 정보 =================== */
.course-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.instructor-info,
.rating-info,
.language-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.meta-divider {
  color: var(--border-primary);
}

.rating-value {
  font-weight: var(--font-semibold);
  color: var(--color-warning);
}

/* Flask 메타 정보 */
.flask-meta {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--border-primary);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* =================== 진행률 섹션 =================== */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) 0;
  border-top: 1px solid var(--border-primary);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.progress-label {
  color: var(--text-tertiary);
}

.progress-value {
  font-weight: var(--font-semibold);
  color: var(--accent-primary);
}

.last-watched {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-1);
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
</style>