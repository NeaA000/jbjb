<template>
  <div class="learning-view">
    <div class="learning-header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="course-title">{{ courseData?.title }}</span>
        </template>
      </el-page-header>
    </div>

    <div class="learning-content">
      <VideoPlayer
          v-if="courseData?.videoUrl"
          :video-url="courseData.videoUrl"
          :course-id="courseId"
          :user-id="userId"
          :poster="courseData.thumbnail"
          @completed="onVideoCompleted"
          @progress="onProgressUpdate"
          @error="onVideoError"
      />
    </div>

    <div class="learning-info">
      <el-card>
        <h3>강의 정보</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="강의명">{{ courseData?.title }}</el-descriptions-item>
          <el-descriptions-item label="카테고리">{{ courseData?.category }}</el-descriptions-item>
          <el-descriptions-item label="강사">{{ courseData?.instructor }}</el-descriptions-item>
          <el-descriptions-item label="진행률">
            <el-progress :percentage="currentProgress" />
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const courseId = ref(route.params.id)
const userId = ref(authStore.user?.uid || 'guest')
const courseData = ref(null)
const currentProgress = ref(0)

// 강의 데이터 로드
const loadCourseData = async () => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId.value))
    if (courseDoc.exists()) {
      courseData.value = courseDoc.data()
    } else {
      ElMessage.error('강의를 찾을 수 없습니다')
      router.push('/courses')
    }
  } catch (error) {
    console.error('Course load error:', error)
    ElMessage.error('강의 로드 중 오류가 발생했습니다')
  }
}

// 뒤로가기
const goBack = () => {
  router.back()
}

// 비디오 완료
const onVideoCompleted = () => {
  ElMessage.success('수강을 완료했습니다!')
  router.push(`/certificates?courseId=${courseId.value}`)
}

// 진행도 업데이트
const onProgressUpdate = (percentage) => {
  currentProgress.value = percentage
}

// 비디오 에러
const onVideoError = () => {
  ElMessage.error('비디오 재생 중 문제가 발생했습니다')
}

onMounted(() => {
  loadCourseData()
})
</script>

<style scoped>
.learning-view {
  min-height: 100vh;
  background: #f5f5f5;
}

.learning-header {
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.course-title {
  font-size: 18px;
  font-weight: 600;
}

.learning-content {
  padding: 20px;
}

.learning-info {
  padding: 0 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.learning-info h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}
</style>