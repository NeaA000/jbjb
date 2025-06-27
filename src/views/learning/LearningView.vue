<template>
  <div class="learning-view">
    <!-- 헤더 -->
    <div class="learning-header">
      <el-page-header @back="goBack">
        <template #content>
          <div class="header-content">
            <span class="course-title">{{ courseInfo?.title || '강의 로딩중...' }}</span>
            <el-tag v-if="courseInfo?.category" type="info" size="small">
              {{ courseInfo.category }}
            </el-tag>
          </div>
        </template>
        <template #extra>
          <el-button @click="toggleSidebar" :icon="Menu" circle />
        </template>
      </el-page-header>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="learning-container">
      <!-- 비디오 플레이어 영역 -->
      <div class="video-section" :class="{ 'full-width': !showSidebar }">
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading" :size="40">
            <Loading />
          </el-icon>
          <p>강의를 불러오는 중입니다...</p>
        </div>

        <VideoPlayer
            v-else-if="courseInfo?.videoUrl"
            :video-url="courseInfo.videoUrl"
            :course-id="courseId"
            :user-id="currentUserId"
            :poster="courseInfo.thumbnail"
            @completed="handleVideoCompleted"
            @progress="handleProgressUpdate"
            @error="handleVideoError"
        />

        <div v-else class="no-video">
          <el-empty description="비디오를 찾을 수 없습니다">
            <el-button @click="goBack">돌아가기</el-button>
          </el-empty>
        </div>
      </div>

      <!-- 사이드바 -->
      <transition name="sidebar">
        <div v-if="showSidebar" class="info-sidebar">
          <!-- 강의 정보 -->
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>강의 정보</span>
              </div>
            </template>

            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="강의명">
                {{ courseInfo?.title }}
              </el-descriptions-item>
              <el-descriptions-item label="카테고리">
                {{ courseInfo?.category }}
              </el-descriptions-item>
              <el-descriptions-item label="강사">
                {{ courseInfo?.instructor || '미지정' }}
              </el-descriptions-item>
              <el-descriptions-item label="수강 기한">
                {{ formatDate(courseInfo?.expiryDate) || '무제한' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 진행 상태 -->
          <el-card class="progress-card">
            <template #header>
              <div class="card-header">
                <span>학습 진행률</span>
                <el-tag :type="progressType" size="small">
                  {{ progressStatus }}
                </el-tag>
              </div>
            </template>

            <div class="progress-content">
              <el-progress
                  :percentage="currentProgress"
                  :color="customColorMethod"
                  :stroke-width="10"
              />
              <div class="progress-details">
                <p>시청 시간: {{ watchTime }}</p>
                <p>남은 시간: {{ remainingTime }}</p>
              </div>
            </div>
          </el-card>

          <!-- 강의 설명 -->
          <el-card v-if="courseInfo?.description" class="description-card">
            <template #header>
              <div class="card-header">
                <span>강의 소개</span>
              </div>
            </template>
            <div class="description-content">
              {{ courseInfo.description }}
            </div>
          </el-card>

          <!-- 액션 버튼들 -->
          <div class="action-buttons">
            <el-button
                v-if="isCompleted"
                type="success"
                @click="viewCertificate"
                :icon="Trophy"
                block
            >
              수료증 보기
            </el-button>

            <el-button
                @click="goToCourseList"
                :icon="List"
                block
            >
              강의 목록으로
            </el-button>
          </div>
        </div>
      </transition>
    </div>

    <!-- 완료 모달 -->
    <el-dialog
        v-model="showCompletionModal"
        title="🎉 수강 완료!"
        width="90%"
        :style="{ maxWidth: '400px' }"
        center
    >
      <div class="completion-modal-content">
        <el-result
            icon="success"
            title="축하합니다!"
            sub-title="강의를 성공적으로 완료하셨습니다"
        >
          <template #extra>
            <el-button type="primary" @click="viewCertificate">
              수료증 확인하기
            </el-button>
            <el-button @click="showCompletionModal = false">
              계속 학습하기
            </el-button>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Menu,
  Loading,
  Trophy,
  List
} from '@element-plus/icons-vue'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from '@/stores/auth'
import VideoPlayer from '@/components/video/VideoPlayer.vue'

// 라우터 & 스토어
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 상태 관리
const courseId = ref(route.params.id)
const courseInfo = ref(null)
const currentProgress = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const loading = ref(true)
const showSidebar = ref(true)
const showCompletionModal = ref(false)
const isCompleted = ref(false)

// Firestore 리스너
let progressUnsubscribe = null

// 계산된 속성
const currentUserId = computed(() => authStore.user?.uid || 'guest')

const progressType = computed(() => {
  if (currentProgress.value === 100) return 'success'
  if (currentProgress.value > 50) return 'warning'
  return 'info'
})

const progressStatus = computed(() => {
  if (currentProgress.value === 100) return '완료'
  if (currentProgress.value > 0) return '진행중'
  return '시작전'
})

const watchTime = computed(() => {
  return formatTime(currentTime.value)
})

const remainingTime = computed(() => {
  const remaining = duration.value - currentTime.value
  return formatTime(remaining)
})

const customColorMethod = computed(() => {
  if (currentProgress.value < 30) return '#909399'
  if (currentProgress.value < 70) return '#e6a23c'
  return '#67c23a'
})

// 메서드
const goBack = () => {
  ElMessageBox.confirm(
      '학습을 중단하고 이전 페이지로 돌아가시겠습니까?',
      '학습 중단',
      {
        confirmButtonText: '나가기',
        cancelButtonText: '계속 학습',
        type: 'warning',
      }
  ).then(() => {
    router.back()
  }).catch(() => {
    // 취소됨
  })
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0:00'

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}시간 ${m}분`
  }
  return `${m}분 ${s}초`
}

const formatDate = (date) => {
  if (!date) return null
  if (date.toDate) date = date.toDate()
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// 강의 데이터 로드
const loadCourseData = async () => {
  try {
    loading.value = true

    const courseDoc = await getDoc(doc(db, 'courses', courseId.value))
    if (!courseDoc.exists()) {
      ElMessage.error('강의를 찾을 수 없습니다')
      router.push('/courses')
      return
    }

    courseInfo.value = {
      id: courseDoc.id,
      ...courseDoc.data()
    }

    // 진행 상태 실시간 구독
    subscribeToProgress()

  } catch (error) {
    console.error('Course load error:', error)
    ElMessage.error('강의 정보를 불러오는데 실패했습니다')
    router.push('/courses')
  } finally {
    loading.value = false
  }
}

// 진행 상태 실시간 구독
const subscribeToProgress = () => {
  if (!currentUserId.value || currentUserId.value === 'guest') return

  const progressRef = doc(db, 'progress', `${currentUserId.value}_${courseId.value}`)

  progressUnsubscribe = onSnapshot(progressRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data()
      currentProgress.value = data.percentage || 0
      currentTime.value = data.currentTime || 0
      duration.value = data.duration || 0
      isCompleted.value = data.completed || false
    }
  })
}

// 비디오 이벤트 핸들러
const handleVideoCompleted = () => {
  isCompleted.value = true
  showCompletionModal.value = true
  ElMessage.success('강의를 완료했습니다!')
}

const handleProgressUpdate = (percentage) => {
  currentProgress.value = percentage
}

const handleVideoError = (error) => {
  console.error('Video error:', error)
  ElMessage.error('비디오 재생 중 문제가 발생했습니다')
}

// 액션 메서드
const viewCertificate = () => {
  showCompletionModal.value = false
  router.push({
    name: 'certificates',
    query: { courseId: courseId.value }
  })
}

const goToCourseList = () => {
  router.push('/courses')
}

// 생명주기
onMounted(() => {
  loadCourseData()
})

onUnmounted(() => {
  if (progressUnsubscribe) {
    progressUnsubscribe()
  }
})
</script>

<style scoped>
.learning-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.learning-header {
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.course-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.learning-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.video-section {
  flex: 1;
  transition: all 0.3s;
}

.video-section.full-width {
  max-width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  background: white;
  border-radius: 12px;
  gap: 16px;
}

.no-video {
  background: white;
  border-radius: 12px;
  padding: 60px 20px;
}

.info-sidebar {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card,
.progress-card,
.description-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.progress-content {
  margin-top: 12px;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 14px;
  color: #909399;
}

.description-content {
  line-height: 1.6;
  color: #606266;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
}

/* 사이드바 트랜지션 */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 모바일 대응 */
@media (max-width: 1024px) {
  .learning-container {
    flex-direction: column;
  }

  .info-sidebar {
    width: 100%;
  }

  .video-section.full-width {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .learning-header {
    padding: 12px 16px;
  }

  .course-title {
    font-size: 16px;
  }

  .learning-container {
    padding: 12px;
    gap: 12px;
  }

  .action-buttons {
    position: sticky;
    bottom: 0;
    background: white;
    padding: 12px;
    margin: -12px;
    margin-top: 12px;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  }
}
</style>