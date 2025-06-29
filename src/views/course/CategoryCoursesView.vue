<!-- web/src/views/course/CategoryCoursesView.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- 헤더 -->
    <div class="header-section sticky top-0 z-30">
      <div class="header-gradient">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            <div class="flex items-center space-x-4">
              <button
                  @click="router.back()"
                  class="back-button"
              >
                <ArrowLeft class="w-5 h-5" />
              </button>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ leafCategory }} 강의</h1>
                <p class="text-sm text-gray-600 mt-1">{{ getCategoryPath() }}</p>
              </div>
            </div>
            <div class="category-icon-wrapper">
              <component :is="getCategoryIcon()" class="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <!-- 카테고리 설명 카드 -->
      <div class="category-info-card">
        <div class="flex items-start space-x-5">
          <div
              :class="[getCategoryStyle(leafCategory), 'category-icon-box']"
          >
            <component :is="getCategoryIcon()" class="w-7 h-7" />
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900 mb-3">
              {{ leafCategory }} 관련 교육
            </h2>
            <p class="text-gray-600 leading-relaxed">
              {{ getCategoryDescription() }}
            </p>
            <div class="mt-4 flex items-center space-x-6 text-sm">
              <div class="stat-item">
                <BookOpen class="w-5 h-5" />
                <span>{{ filteredCourses.length }}개 강의</span>
              </div>
              <div class="stat-item">
                <Users class="w-5 h-5" />
                <span>{{ getTotalEnrolled() }}명 수강</span>
              </div>
              <div class="stat-item">
                <Globe class="w-5 h-5" />
                <span>다국어 지원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 정렬 옵션 -->
      <div class="sort-section">
        <p class="text-sm font-medium text-gray-700">
          총 {{ filteredCourses.length }}개의 강의
        </p>
        <select
            v-model="sortBy"
            class="sort-select"
        >
          <option value="newest">최신순</option>
          <option value="popular">인기순</option>
          <option value="rating">평점순</option>
          <option value="title">제목순</option>
        </select>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-content">
          <Loader2 class="w-8 h-8 animate-spin text-blue-600" />
          <span class="text-gray-600 mt-3">강의를 불러오는 중...</span>
        </div>
      </div>

      <!-- 강의 목록 -->
      <div v-else-if="sortedCourses.length > 0" class="course-list">
        <div
            v-for="course in sortedCourses"
            :key="course.id"
            class="course-card"
            :class="{
              'course-enrolled': getEnrollmentStatus(course.id) === 'enrolled',
              'course-completed': getEnrollmentStatus(course.id) === 'completed'
            }"
        >
          <div class="course-card-body">
            <div class="flex items-start space-x-5">
              <!-- 썸네일 -->
              <div class="course-thumbnail">
                <div class="thumbnail-wrapper">
                  <img
                      v-if="course.thumbnail"
                      :src="course.thumbnail"
                      :alt="course.title"
                      class="thumbnail-image"
                      @error="handleImageError"
                  />
                  <div v-else class="thumbnail-placeholder">
                    <PlayCircle class="w-14 h-14 text-gray-400" />
                  </div>

                  <!-- 수강 상태 오버레이 -->
                  <div v-if="getEnrollmentStatus(course.id) !== 'not-enrolled'"
                       class="status-overlay">
                    <CheckCircle v-if="getEnrollmentStatus(course.id) === 'completed'"
                                 class="w-8 h-8 text-white" />
                    <div v-else class="progress-circle">
                      {{ getProgress(course.id) }}%
                    </div>
                  </div>
                </div>
              </div>

              <!-- 강의 정보 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <!-- 상태 배지 -->
                    <div class="flex items-center gap-2 mb-3">
                      <span v-if="getEnrollmentStatus(course.id) !== 'not-enrolled'"
                            :class="[
                              'status-badge',
                              getEnrollmentStatus(course.id) === 'completed'
                                ? 'badge-completed'
                                : 'badge-enrolled'
                            ]">
                        <CheckCircle class="w-3.5 h-3.5" />
                        {{ getEnrollmentStatus(course.id) === 'completed'
                          ? '수료 완료'
                          : `진행중 ${getProgress(course.id)}%` }}
                      </span>

                      <!-- QR 접근 가능 배지 -->
                      <span v-if="course.qr_combined_enabled"
                            class="status-badge badge-qr">
                        <QrCode class="w-3.5 h-3.5" />
                        QR 학습
                      </span>

                      <!-- 다국어 지원 배지 -->
                      <span v-if="course.supported_languages_count > 1"
                            class="status-badge badge-language">
                        <Globe class="w-3.5 h-3.5" />
                        {{ course.supported_languages_count }}개 언어
                      </span>
                    </div>

                    <!-- 제목 -->
                    <h3
                        @click="goToCourseDetail(course.id)"
                        class="course-title"
                    >
                      {{ course.title }}
                    </h3>

                    <!-- 설명 -->
                    <p class="course-description">
                      {{ course.description }}
                    </p>

                    <!-- 메타 정보 -->
                    <div class="course-meta">
                      <div class="meta-item">
                        <User class="w-4 h-4" />
                        <span>{{ course.instructor || '전문 강사' }}</span>
                      </div>
                      <div class="meta-item">
                        <Clock class="w-4 h-4" />
                        <span>{{ course.duration || '30분' }}</span>
                      </div>
                      <div class="meta-item">
                        <BarChart class="w-4 h-4" />
                        <span>{{ getDifficultyText(course.difficulty) }}</span>
                      </div>
                      <div v-if="course.rating" class="meta-item">
                        <Star class="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{{ course.rating.toFixed(1) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 액션 버튼 -->
                  <div class="ml-6 flex-shrink-0">
                    <button
                        v-if="getEnrollmentStatus(course.id) === 'not-enrolled'"
                        @click="isSelected(course.id) ? removeFromSelectedList(course.id) : addToSelectedList(course.id)"
                        :class="[
                          'action-button',
                          isSelected(course.id) ? 'button-selected' : 'button-primary'
                        ]"
                    >
                      <Check v-if="isSelected(course.id)" class="w-5 h-5 mr-2" />
                      <Plus v-else class="w-5 h-5 mr-2" />
                      {{ isSelected(course.id) ? '선택됨' : '선택하기' }}
                    </button>
                    <button
                        v-else-if="getEnrollmentStatus(course.id) === 'enrolled'"
                        @click="router.push(`/learning/${course.id}`)"
                        class="action-button button-continue"
                    >
                      <Play class="w-5 h-5 mr-2" />
                      이어보기
                    </button>
                    <button
                        v-else
                        @click="router.push(`/certificates?courseId=${course.id}`)"
                        class="action-button button-certificate"
                    >
                      <Award class="w-5 h-5 mr-2" />
                      수료증
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 강의 없음 -->
      <div v-else class="empty-state">
        <div class="empty-state-content">
          <component :is="getCategoryIcon()" class="w-20 h-20 text-gray-300 mb-6" />
          <h2 class="text-2xl font-bold text-gray-900 mb-3">
            {{ leafCategory }} 카테고리에 강의가 없습니다
          </h2>
          <p class="text-gray-500 mb-8">
            다른 카테고리를 확인해보세요
          </p>
          <button
              @click="router.push('/courses')"
              class="action-button button-primary"
          >
            <BookOpen class="w-5 h-5 mr-2" />
            전체 강의 보기
          </button>
        </div>
      </div>
    </div>

    <!-- 하단 선택 강의 푸터 -->
    <EnrolledCoursesFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { CategoryService } from '@/services/categoryService'
import EnrolledCoursesFooter from '@/components/EnrolledCoursesFooter.vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  BookOpen,
  Users,
  Loader2,
  PlayCircle,
  User,
  Clock,
  BarChart,
  Star,
  CheckCircle,
  Play,
  Award,
  Plus,
  Check,
  Wrench,
  Hammer,
  HardHat,
  FlaskConical,
  Globe,
  QrCode
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

// Props
const props = defineProps({
  leafCategory: {
    type: String,
    required: true
  }
})

// 상태
const isLoading = ref(false)
const sortBy = ref('newest')

// 필터링된 강의 목록
const filteredCourses = computed(() => {
  return courseStore.courses.filter(course => {
    const courseLeaf = course.category?.leaf
    return courseLeaf === props.leafCategory
  })
})

// 정렬된 강의 목록
const sortedCourses = computed(() => {
  const courses = [...filteredCourses.value]

  switch (sortBy.value) {
    case 'newest':
      return courses.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    case 'popular':
      return courses.sort((a, b) =>
          (b.enrolledCount || 0) - (a.enrolledCount || 0)
      )
    case 'rating':
      return courses.sort((a, b) =>
          (b.rating || 0) - (a.rating || 0)
      )
    case 'title':
      return courses.sort((a, b) =>
          a.title.localeCompare(b.title, 'ko')
      )
    default:
      return courses
  }
})

// 카테고리 경로
const getCategoryPath = () => {
  const mainCategory = CategoryService.getMainCategoryForItem(props.leafCategory)
  const middleCategories = CategoryService.getMainToMidMapping()[mainCategory] || []

  for (const middle of middleCategories) {
    const leafCategories = CategoryService.getMidToLeafMapping()[middle] || []
    if (leafCategories.includes(props.leafCategory)) {
      return `${mainCategory} > ${middle} > ${props.leafCategory}`
    }
  }

  return props.leafCategory
}

// 카테고리 설명
const getCategoryDescription = () => {
  const descriptions = {
    // 기계
    '불도저': '불도저의 안전한 조작법과 유지보수 방법을 학습합니다.',
    '크레인': '크레인 운전 및 안전 규정에 대해 배웁니다.',
    '굴착기': '굴착기 조작 기술과 현장 안전 수칙을 익힙니다.',
    'CNC 선반': 'CNC 선반 프로그래밍과 정밀 가공 기술을 학습합니다.',
    '연삭기': '연삭기 조작법과 표면 처리 기술을 배웁니다.',
    '유압 프레스': '유압 프레스의 원리와 안전한 사용법을 익힙니다.',
    '사출 성형기': '사출 성형 공정과 품질 관리 방법을 학습합니다.',
    '열 성형기': '열 성형 기술과 재료 특성을 이해합니다.',

    // 공구
    '플라이어': '플라이어의 올바른 사용법과 안전 수칙을 배웁니다.',
    '해머': '다양한 해머의 용도와 안전한 사용법을 익힙니다.',
    '그라인더': '그라인더 조작법과 연마 기술을 학습합니다.',
    '전동톱': '전동톱의 안전한 사용법과 유지보수를 배웁니다.',
    '해머드릴': '해머드릴 사용법과 천공 작업 기술을 익힙니다.',
    '전동드릴': '전동드릴의 다양한 활용법과 안전 수칙을 학습합니다.',
    '가스 용접기': '가스 용접의 원리와 안전한 작업 방법을 배웁니다.',
    '커터': '절단 공구의 종류와 올바른 사용법을 익힙니다.',
    '마이크로미터': '정밀 측정 도구 사용법과 측정 기술을 학습합니다.',
    '하이트 게이지': '높이 측정의 정확한 방법과 활용법을 배웁니다.',

    // 장비
    '헬멧': '안전 헬멧의 올바른 착용법과 관리 방법을 학습합니다.',
    '방진 마스크': '호흡기 보호구의 선택과 사용법을 익힙니다.',
    '낙하 방지벨트': '추락 방지 장비의 착용법과 점검 방법을 배웁니다.',
    '안전모': '작업 현장 안전모 규정과 관리법을 학습합니다.',
    '안전화': '안전화 선택 기준과 올바른 착용법을 익힙니다.',
    '보호안경': '눈 보호구의 종류와 상황별 사용법을 배웁니다.',
    '귀마개': '청력 보호구의 올바른 사용법을 학습합니다.',
    '보호장갑': '작업별 적합한 보호장갑 선택법을 익힙니다.',
    '호흡 보호구': '호흡 보호구의 종류와 올바른 착용법을 배웁니다.',
    '리프트 장비': '리프트 장비의 안전한 조작법을 학습합니다.',
    '체인 블록': '체인 블록 사용법과 하중 계산법을 익힙니다.',
    '호이스트': '호이스트 운영과 안전 점검 사항을 배웁니다.',

    // 약품
    '인슐린': '인슐린의 보관법과 안전한 취급 방법을 학습합니다.',
    '항생제': '항생제의 종류와 올바른 관리법을 익힙니다.',
    '황산': '황산의 위험성과 안전한 취급법을 배웁니다.',
    '염산': '염산 사용 시 안전 수칙과 응급처치법을 학습합니다.'
  }

  return descriptions[props.leafCategory] || `${props.leafCategory} 관련 전문 교육 과정입니다.`
}

// 총 수강생 수
const getTotalEnrolled = () => {
  return filteredCourses.value.reduce((sum, course) => {
    return sum + (course.enrolledCount || 0)
  }, 0)
}

// 카테고리 아이콘
const getCategoryIcon = () => {
  const mainCategory = CategoryService.getMainCategoryForItem(props.leafCategory)
  const iconMap = {
    기계: Wrench,
    공구: Hammer,
    장비: HardHat,
    약품: FlaskConical
  }
  return iconMap[mainCategory] || BookOpen
}

// 카테고리 스타일
const getCategoryStyle = (leafCategory) => {
  const mainCategory = CategoryService.getMainCategoryForItem(leafCategory)
  const styleMap = {
    기계: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20',
    공구: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/20',
    장비: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-500/20',
    약품: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-500/20'
  }
  return styleMap[mainCategory] || 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
}

// 난이도 텍스트
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }
  return difficultyMap[difficulty] || difficulty
}

// 수강 상태 확인
const getEnrollmentStatus = (courseId) => {
  return courseStore.getEnrollmentStatus(courseId)
}

// 진도율 확인
const getProgress = (courseId) => {
  return courseStore.getProgress(courseId)
}

// 선택 여부 확인
const isSelected = (courseId) => {
  return courseStore.isSelected(courseId)
}

// 선택 목록에 추가
const addToSelectedList = (courseId) => {
  const result = courseStore.addToSelected(courseId)
  if (!result.success) {
    ElMessage.warning(result.message)
  }
}

// 선택 목록에서 제거
const removeFromSelectedList = (courseId) => {
  courseStore.removeFromSelected(courseId)
}

// 강의 상세로 이동
const goToCourseDetail = (courseId) => {
  router.push(`/course/${courseId}`)
}

// 이미지 로드 에러 처리
const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.querySelector('.thumbnail-placeholder').style.display = 'flex'
}

// 마운트
onMounted(async () => {
  isLoading.value = true
  courseStore.loadSelectedFromStorage()

  if (courseStore.courses.length === 0) {
    await courseStore.loadCoursesFromFlask()
  }

  isLoading.value = false
})

// 카테고리 변경 감지
watch(() => props.leafCategory, async () => {
  isLoading.value = true
  await courseStore.loadCoursesFromFlask()
  isLoading.value = false
})
</script>

<style scoped>
/* 헤더 섹션 */
.header-section {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
}

.header-gradient {
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
}

.back-button {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #6b7280;
}

.back-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.category-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.25);
}

/* 카테고리 정보 카드 */
.category-info-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 32px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.category-info-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.category-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.stat-item svg {
  color: #9ca3af;
}

/* 정렬 섹션 */
.sort-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.sort-select {
  padding: 8px 36px 8px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L2 5h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  appearance: none;
}

.sort-select:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

.sort-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 강의 목록 */
.course-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 강의 카드 */
.course-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.course-card:hover {
  border-color: #667eea;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.course-card.course-enrolled {
  background: linear-gradient(to right, #eff6ff 0%, white 100%);
  border-left: 4px solid #3b82f6;
}

.course-card.course-completed {
  background: linear-gradient(to right, #f0fdf4 0%, white 100%);
  border-left: 4px solid #10b981;
}

.course-card-body {
  padding: 24px;
}

/* 썸네일 */
.course-thumbnail {
  flex-shrink: 0;
  width: 200px;
}

.thumbnail-wrapper {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
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
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.progress-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.badge-completed {
  background: #d1fae5;
  color: #065f46;
}

.badge-enrolled {
  background: #dbeafe;
  color: #1e40af;
}

.badge-qr {
  background: #f3e8ff;
  color: #6b21a8;
}

.badge-language {
  background: #fef3c7;
  color: #92400e;
}

/* 강의 제목 */
.course-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  cursor: pointer;
  transition: color 0.2s ease;
  line-height: 1.4;
}

.course-title:hover {
  color: #667eea;
}

/* 강의 설명 */
.course-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 메타 정보 */
.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.meta-item svg {
  color: #9ca3af;
}

/* 액션 버튼 */
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.25);
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.button-selected {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.button-continue {
  background: #dbeafe;
  color: #1e40af;
}

.button-certificate {
  background: #fef3c7;
  color: #92400e;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .course-card-body {
    padding: 16px;
  }

  .course-thumbnail {
    width: 140px;
  }

  .thumbnail-wrapper {
    height: 90px;
  }

  .course-title {
    font-size: 16px;
  }

  .course-description {
    font-size: 13px;
  }

  .action-button {
    padding: 10px 20px;
    font-size: 14px;
  }

  .meta-item {
    font-size: 12px;
  }

  .status-badge {
    font-size: 12px;
    padding: 4px 10px;
  }
}

@media (max-width: 480px) {
  .course-card-body {
    padding: 12px;
  }

  .flex.items-start.space-x-5 {
    flex-direction: column;
    gap: 12px;
  }

  .course-thumbnail {
    width: 100%;
  }

  .thumbnail-wrapper {
    height: 160px;
  }

  .ml-6.flex-shrink-0 {
    margin-left: 0;
    margin-top: 12px;
    width: 100%;
  }

  .action-button {
    width: 100%;
  }
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.course-card {
  animation: fadeIn 0.4s ease-out;
}

.course-card:nth-child(1) { animation-delay: 0.05s; }
.course-card:nth-child(2) { animation-delay: 0.1s; }
.course-card:nth-child(3) { animation-delay: 0.15s; }
.course-card:nth-child(4) { animation-delay: 0.2s; }
.course-card:nth-child(5) { animation-delay: 0.25s; }
</style>