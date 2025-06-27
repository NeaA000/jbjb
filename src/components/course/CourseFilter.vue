<template>
  <el-card class="course-filter-card" shadow="never">
    <!-- 필터 헤더 -->
    <div class="filter-header">
      <div class="filter-title">
        <el-icon size="16"><Filter /></el-icon>
        <span>강의 필터</span>
      </div>

      <div class="filter-actions">
        <el-button
          v-if="hasActiveFilters"
          size="small"
          type="info"
          text
          @click="clearAllFilters"
        >
          <template #icon>
            <el-icon><RefreshLeft /></el-icon>
          </template>
          초기화
        </el-button>

        <el-button
          size="small"
          type="primary"
          text
          @click="toggleExpanded"
        >
          <template #icon>
            <el-icon>
              <ArrowUp v-if="isExpanded" />
              <ArrowDown v-else />
            </el-icon>
          </template>
          {{ isExpanded ? '접기' : '더보기' }}
        </el-button>
      </div>
    </div>

    <!-- 빠른 필터 (항상 표시) -->
    <div class="quick-filters">
      <div class="quick-filters-row">
        <!-- 검색 -->
        <div class="quick-search">
          <el-input
            v-model="localFilters.search"
            placeholder="강의 검색..."
            :prefix-icon="Search"
            clearable
            size="default"
            @input="onSearchInput"
            @clear="onSearchClear"
            @keyup.enter="applyFilters"
          />
        </div>

        <!-- 🔧 CategoryService를 사용한 메인 카테고리 -->
        <el-select
          v-model="localFilters.category"
          placeholder="카테고리"
          clearable
          size="default"
          class="filter-select"
          @change="onCategoryChange"
        >
          <el-option
            v-for="category in mainCategories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>

        <!-- 정렬 -->
        <el-select
          v-model="localFilters.sortBy"
          placeholder="정렬"
          size="default"
          class="filter-select"
          @change="onSortChange"
        >
          <el-option label="최신순" value="newest" />
          <el-option label="인기순" value="popular" />
          <el-option label="이름순" value="name" />
          <el-option label="시간순" value="duration" />
          <el-option label="평점순" value="rating" />
        </el-select>
      </div>
    </div>

    <!-- 상세 필터 (확장 시 표시) -->
    <div v-if="isExpanded" class="detailed-filters">
      <el-divider />

      <div class="filter-grid">
        <!-- 🔧 CategoryService를 사용한 중간 카테고리 -->
        <div class="filter-group">
          <label class="filter-label">중간 카테고리</label>
          <el-select
            v-model="localFilters.middleCategory"
            placeholder="중간 카테고리 선택"
            clearable
            size="default"
            class="filter-input"
            :disabled="!localFilters.category || localFilters.category === '전체'"
            @change="onMiddleCategoryChange"
          >
            <el-option
              v-for="middleCategory in currentMiddleCategories"
              :key="middleCategory"
              :label="middleCategory"
              :value="middleCategory"
            />
          </el-select>
        </div>

        <!-- 🔧 CategoryService를 사용한 리프 카테고리 -->
        <div class="filter-group">
          <label class="filter-label">세부 카테고리</label>
          <el-select
            v-model="localFilters.leafCategory"
            placeholder="세부 카테고리 선택"
            clearable
            size="default"
            class="filter-input"
            :disabled="!localFilters.middleCategory"
          >
            <el-option
              v-for="leafCategory in currentLeafCategories"
              :key="leafCategory"
              :label="leafCategory"
              :value="leafCategory"
            />
          </el-select>
        </div>

        <!-- 난이도 -->
        <div class="filter-group">
          <label class="filter-label">난이도</label>
          <el-select
            v-model="localFilters.difficulty"
            placeholder="난이도 선택"
            clearable
            size="default"
            class="filter-input"
          >
            <el-option label="초급" value="beginner">
              <el-tag type="success" size="small">초급</el-tag>
            </el-option>
            <el-option label="중급" value="intermediate">
              <el-tag type="warning" size="small">중급</el-tag>
            </el-option>
            <el-option label="고급" value="advanced">
              <el-tag type="danger" size="small">고급</el-tag>
            </el-option>
          </el-select>
        </div>

        <!-- 강사 -->
        <div class="filter-group">
          <label class="filter-label">강사</label>
          <el-select
            v-model="localFilters.instructor"
            placeholder="강사 선택"
            clearable
            filterable
            size="default"
            class="filter-input"
          >
            <el-option
              v-for="instructor in availableInstructors"
              :key="instructor"
              :label="instructor"
              :value="instructor"
            />
          </el-select>
        </div>

        <!-- 진행 상태 -->
        <div class="filter-group">
          <label class="filter-label">진행 상태</label>
          <el-select
            v-model="localFilters.status"
            placeholder="상태 선택"
            clearable
            size="default"
            class="filter-input"
          >
            <el-option label="전체" value="" />
            <el-option label="미수강" value="not-enrolled">
              <el-tag type="info" size="small">미수강</el-tag>
            </el-option>
            <el-option label="수강 중" value="in-progress">
              <el-tag type="warning" size="small">수강 중</el-tag>
            </el-option>
            <el-option label="완료" value="completed">
              <el-tag type="success" size="small">완료</el-tag>
            </el-option>
          </el-select>
        </div>

        <!-- 강의 시간 -->
        <div class="filter-group">
          <label class="filter-label">강의 시간</label>
          <el-select
            v-model="localFilters.duration"
            placeholder="시간 선택"
            clearable
            size="default"
            class="filter-input"
          >
            <el-option label="30분 이하" value="short" />
            <el-option label="30분~1시간" value="medium" />
            <el-option label="1시간~2시간" value="long" />
            <el-option label="2시간 이상" value="very-long" />
          </el-select>
        </div>

        <!-- 평점 -->
        <div class="filter-group">
          <label class="filter-label">평점</label>
          <el-select
            v-model="localFilters.rating"
            placeholder="평점 선택"
            clearable
            size="default"
            class="filter-input"
          >
            <el-option label="4.5점 이상" value="4.5" />
            <el-option label="4.0점 이상" value="4.0" />
            <el-option label="3.5점 이상" value="3.5" />
          </el-select>
        </div>
      </div>

      <!-- 태그 필터 -->
      <div class="filter-group full-width">
        <label class="filter-label">태그</label>
        <div class="tag-filters">
          <div class="tag-filter-container">
            <el-check-tag
              v-for="tag in popularTags"
              :key="tag"
              :checked="localFilters.tags.includes(tag)"
              @change="onTagToggle(tag, $event)"
              class="tag-item"
            >
              {{ tag }}
            </el-check-tag>
          </div>
        </div>
      </div>

      <!-- 고급 옵션 -->
      <div class="advanced-options">
        <div class="advanced-options-row">
          <el-checkbox
            v-model="localFilters.hasVideo"
            @change="onAdvancedOptionChange"
          >
            동영상 있는 강의만
          </el-checkbox>
          <el-checkbox
            v-model="localFilters.hasCertificate"
            @change="onAdvancedOptionChange"
          >
            수료증 발급 강의만
          </el-checkbox>
          <el-checkbox
            v-model="localFilters.isFree"
            @change="onAdvancedOptionChange"
          >
            무료 강의만
          </el-checkbox>
          <el-checkbox
            v-model="localFilters.isNew"
            @change="onAdvancedOptionChange"
          >
            신규 강의만
          </el-checkbox>
        </div>
      </div>
    </div>

    <!-- 활성 필터 표시 -->
    <div v-if="activeFilters.length > 0" class="active-filters">
      <el-divider />
      <div class="active-filters-header">
        <span class="active-filters-title">적용된 필터</span>
        <el-tag type="info" size="small">{{ activeFilters.length }}개</el-tag>
      </div>
      <div class="active-filters-list">
        <el-tag
          v-for="filter in activeFilters"
          :key="filter.key"
          :type="filter.type"
          closable
          @close="removeFilter(filter.key)"
          size="small"
          class="active-filter-tag"
        >
          {{ filter.label }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Filter,
  Search,
  RefreshLeft,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import { CategoryService } from '@/services/categoryService'

// Props
const props = defineProps({
  // 초기 필터 값
  initialFilters: {
    type: Object,
    default: () => ({})
  },

  // 사용 가능한 강사 목록
  availableInstructors: {
    type: Array,
    default: () => []
  },

  // 인기 태그 목록
  popularTags: {
    type: Array,
    default: () => ['안전교육', '작업안전', '화재안전', '응급처치', '기계안전']
  },

  // 자동 적용 여부
  autoApply: {
    type: Boolean,
    default: true
  },

  // 초기 확장 상태
  initialExpanded: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['filter', 'change'])

// 로컬 상태
const isExpanded = ref(props.initialExpanded)
const searchTimeout = ref(null)

// 🔧 CategoryService에서 카테고리 정보 가져오기
const mainCategories = computed(() => CategoryService.getMainTabs())
const mainToMidMapping = computed(() => CategoryService.getMainToMidMapping())
const midToLeafMapping = computed(() => CategoryService.getMidToLeafMapping())

// 로컬 필터 상태
const localFilters = ref({
  search: '',
  category: '',
  middleCategory: '', // 🔧 중간 카테고리 추가
  leafCategory: '',   // 🔧 리프 카테고리 추가 (기존 subCategory 대신)
  difficulty: '',
  instructor: '',
  status: '',
  duration: '',
  rating: '',
  sortBy: 'newest',
  tags: [],
  hasVideo: false,
  hasCertificate: false,
  isFree: false,
  isNew: false,
  ...props.initialFilters
})

// 🔧 현재 선택된 메인 카테고리의 중간 카테고리들
const currentMiddleCategories = computed(() => {
  if (!localFilters.value.category || localFilters.value.category === '전체') {
    return []
  }
  return mainToMidMapping.value[localFilters.value.category] || []
})

// 🔧 현재 선택된 중간 카테고리의 리프 카테고리들
const currentLeafCategories = computed(() => {
  if (!localFilters.value.middleCategory) {
    return []
  }
  return midToLeafMapping.value[localFilters.value.middleCategory] || []
})

// 활성 필터 여부
const hasActiveFilters = computed(() => {
  const filters = localFilters.value
  return !!(
    filters.search ||
    filters.category ||
    filters.middleCategory ||
    filters.leafCategory ||
    filters.difficulty ||
    filters.instructor ||
    filters.status ||
    filters.duration ||
    filters.rating ||
    filters.tags.length > 0 ||
    filters.hasVideo ||
    filters.hasCertificate ||
    filters.isFree ||
    filters.isNew
  )
})

// 활성 필터 목록
const activeFilters = computed(() => {
  const filters = localFilters.value
  const active = []

  if (filters.search) {
    active.push({
      key: 'search',
      label: `검색: ${filters.search}`,
      type: 'primary'
    })
  }

  if (filters.category) {
    active.push({
      key: 'category',
      label: `카테고리: ${filters.category}`,
      type: 'success'
    })
  }

  // 🔧 중간 카테고리 필터 표시
  if (filters.middleCategory) {
    active.push({
      key: 'middleCategory',
      label: `중간: ${filters.middleCategory}`,
      type: 'success'
    })
  }

  // 🔧 리프 카테고리 필터 표시
  if (filters.leafCategory) {
    active.push({
      key: 'leafCategory',
      label: `세부: ${filters.leafCategory}`,
      type: 'success'
    })
  }

  if (filters.difficulty) {
    const difficultyMap = {
      'beginner': '초급',
      'intermediate': '중급',
      'advanced': '고급'
    }
    active.push({
      key: 'difficulty',
      label: `난이도: ${difficultyMap[filters.difficulty]}`,
      type: 'warning'
    })
  }

  if (filters.instructor) {
    active.push({
      key: 'instructor',
      label: `강사: ${filters.instructor}`,
      type: 'info'
    })
  }

  if (filters.status) {
    const statusMap = {
      'not-enrolled': '미수강',
      'in-progress': '수강 중',
      'completed': '완료'
    }
    active.push({
      key: 'status',
      label: `상태: ${statusMap[filters.status]}`,
      type: 'info'
    })
  }

  if (filters.duration) {
    const durationMap = {
      'short': '30분 이하',
      'medium': '30분~1시간',
      'long': '1시간~2시간',
      'very-long': '2시간 이상'
    }
    active.push({
      key: 'duration',
      label: `시간: ${durationMap[filters.duration]}`,
      type: 'info'
    })
  }

  if (filters.rating) {
    active.push({
      key: 'rating',
      label: `평점: ${filters.rating}점 이상`,
      type: 'warning'
    })
  }

  if (filters.tags.length > 0) {
    filters.tags.forEach(tag => {
      active.push({
        key: `tag-${tag}`,
        label: `태그: ${tag}`,
        type: 'primary'
      })
    })
  }

  if (filters.hasVideo) {
    active.push({
      key: 'hasVideo',
      label: '동영상 있음',
      type: 'success'
    })
  }

  if (filters.hasCertificate) {
    active.push({
      key: 'hasCertificate',
      label: '수료증 발급',
      type: 'success'
    })
  }

  if (filters.isFree) {
    active.push({
      key: 'isFree',
      label: '무료 강의',
      type: 'success'
    })
  }

  if (filters.isNew) {
    active.push({
      key: 'isNew',
      label: '신규 강의',
      type: 'success'
    })
  }

  return active
})

// 이벤트 핸들러
const onSearchInput = (value) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    if (props.autoApply) {
      applyFilters()
    }
  }, 500)
}

const onSearchClear = () => {
  if (props.autoApply) {
    applyFilters()
  }
}

// 🔧 메인 카테고리 변경 시 하위 카테고리 초기화
const onCategoryChange = (value) => {
  localFilters.value.middleCategory = ''
  localFilters.value.leafCategory = ''

  if (props.autoApply) {
    applyFilters()
  }
}

// 🔧 중간 카테고리 변경 시 리프 카테고리 초기화
const onMiddleCategoryChange = (value) => {
  localFilters.value.leafCategory = ''

  if (props.autoApply) {
    applyFilters()
  }
}

const onSortChange = () => {
  if (props.autoApply) {
    applyFilters()
  }
}

const onAdvancedOptionChange = () => {
  if (props.autoApply) {
    applyFilters()
  }
}

const onTagToggle = (tag, checked) => {
  if (checked) {
    if (!localFilters.value.tags.includes(tag)) {
      localFilters.value.tags.push(tag)
    }
  } else {
    const index = localFilters.value.tags.indexOf(tag)
    if (index > -1) {
      localFilters.value.tags.splice(index, 1)
    }
  }

  if (props.autoApply) {
    applyFilters()
  }
}

const removeFilter = (key) => {
  if (key === 'search') {
    localFilters.value.search = ''
  } else if (key === 'category') {
    localFilters.value.category = ''
    localFilters.value.middleCategory = ''
    localFilters.value.leafCategory = ''
  } else if (key === 'middleCategory') {
    localFilters.value.middleCategory = ''
    localFilters.value.leafCategory = ''
  } else if (key === 'leafCategory') {
    localFilters.value.leafCategory = ''
  } else if (key === 'difficulty') {
    localFilters.value.difficulty = ''
  } else if (key === 'instructor') {
    localFilters.value.instructor = ''
  } else if (key === 'status') {
    localFilters.value.status = ''
  } else if (key === 'duration') {
    localFilters.value.duration = ''
  } else if (key === 'rating') {
    localFilters.value.rating = ''
  } else if (key.startsWith('tag-')) {
    const tag = key.replace('tag-', '')
    const index = localFilters.value.tags.indexOf(tag)
    if (index > -1) {
      localFilters.value.tags.splice(index, 1)
    }
  } else if (key === 'hasVideo') {
    localFilters.value.hasVideo = false
  } else if (key === 'hasCertificate') {
    localFilters.value.hasCertificate = false
  } else if (key === 'isFree') {
    localFilters.value.isFree = false
  } else if (key === 'isNew') {
    localFilters.value.isNew = false
  }

  applyFilters()
}

const clearAllFilters = () => {
  localFilters.value = {
    search: '',
    category: '',
    middleCategory: '',
    leafCategory: '',
    difficulty: '',
    instructor: '',
    status: '',
    duration: '',
    rating: '',
    sortBy: 'newest',
    tags: [],
    hasVideo: false,
    hasCertificate: false,
    isFree: false,
    isNew: false
  }

  applyFilters()
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const applyFilters = () => {
  const filters = { ...localFilters.value }

  // 🔧 호환성을 위해 subCategory도 포함 (기존 코드 지원)
  if (filters.leafCategory) {
    filters.subCategory = filters.leafCategory
  }

  emit('filter', filters)
  emit('change', filters)
}

// 외부에서 필터 설정
const setFilters = (filters) => {
  localFilters.value = { ...localFilters.value, ...filters }

  // 🔧 기존 subCategory 지원
  if (filters.subCategory && !filters.leafCategory) {
    localFilters.value.leafCategory = filters.subCategory
  }

  if (props.autoApply) {
    applyFilters()
  }
}

// 외부에서 사용할 수 있도록 expose
defineExpose({
  setFilters,
  clearAllFilters,
  applyFilters,
  toggleExpanded
})

// 초기화
onMounted(() => {
  // 🔧 CategoryService 디버깅 정보 출력
  console.log('🔧 CourseFilter CategoryService 정보:')
  CategoryService.debugCategoryMapping()

  if (props.autoApply && hasActiveFilters.value) {
    applyFilters()
  }
})

// 자동 적용이 꺼져있을 때는 변경사항 감지해서 이벤트만 발생
watch(localFilters, (newFilters) => {
  if (!props.autoApply) {
    emit('change', newFilters)
  }
}, { deep: true })
</script>

<style scoped>
/* === 필터 카드 === */
.course-filter-card {
  margin-bottom: 16px;
  border-radius: 16px;
}

/* === 헤더 === */
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1a1a1a;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

/* === 빠른 필터 === */
.quick-filters {
  margin-bottom: 12px;
}

.quick-filters-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.quick-search {
  flex: 1;
  min-width: 280px;
}

.filter-select {
  width: 120px;
}

/* === 상세 필터 === */
.detailed-filters {
  margin-top: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group.full-width {
  grid-column: 1 / -1;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #6c757d;
  margin-bottom: 4px;
}

.filter-input {
  width: 100%;
}

/* === 태그 필터 === */
.tag-filters {
  margin-top: 8px;
}

.tag-filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

/* === 고급 옵션 === */
.advanced-options {
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.advanced-options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* === 활성 필터 === */
.active-filters {
  margin-top: 16px;
}

.active-filters-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.active-filters-title {
  font-size: 13px;
  font-weight: 500;
  color: #6c757d;
}

.active-filters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.active-filter-tag {
  margin: 0;
}

/* === 반응형 디자인 === */
@media (max-width: 768px) {
  .filter-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .filter-actions {
    justify-content: flex-end;
  }

  .quick-filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-search {
    min-width: auto;
  }

  .filter-select {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .advanced-options-row {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .course-filter-card :deep(.el-card__body) {
    padding: 12px;
  }

  .filter-grid {
    gap: 8px;
  }

  .active-filters-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* === 애니메이션 === */
.course-filter-card {
  animation: fadeInDown 0.3s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === 접근성 === */
@media (prefers-reduced-motion: reduce) {
  .course-filter-card {
    animation: none;
  }
}
</style>
