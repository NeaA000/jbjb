// ===== 1. VideoPlayer.vue =====
// src/components/video/VideoPlayer.vue
<template>
  <div class="video-player-container" ref="playerContainer">
    <!-- 안전 경고 모달 -->
    <SafetyWarningModal
        v-if="showSafetyWarning"
        @confirm="handleSafetyConfirm"
        @cancel="handleSafetyCancel"
    />

    <!-- 비디오 플레이어 -->
    <div class="video-wrapper" v-show="!showSafetyWarning">
      <video
          ref="videoElement"
          :src="videoUrl"
          @loadedmetadata="handleLoadedMetadata"
          @timeupdate="handleTimeUpdate"
          @ended="handleVideoEnded"
          @play="handlePlay"
          @pause="handlePause"
          @error="handleError"
          class="video-element"
          playsinline
          webkit-playsinline
      >
        Your browser does not support the video tag.
      </video>

      <!-- 커스텀 컨트롤 -->
      <VideoControls
          :isPlaying="isPlaying"
          :currentTime="currentTime"
          :duration="duration"
          :progress="progress"
          @play="play"
          @pause="pause"
          @seek="seek"
          @toggleFullscreen="toggleFullscreen"
      />

      <!-- 흔들림 감지 알림 -->
      <div v-if="motionDetected" class="motion-alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span>안전을 위해 일시정지되었습니다</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import VideoControls from './VideoControls.vue'
import SafetyWarningModal from './SafetyWarningModal.vue'
import { useVideoProgress } from '@/composables/useVideoProgress'
import { useMotionDetection } from '@/composables/useMotionDetection'
import { useCertificate } from '@/composables/useCertificate'

export default {
  name: 'VideoPlayer',
  components: {
    VideoControls,
    SafetyWarningModal
  },
  props: {
    videoUrl: {
      type: String,
      required: true
    },
    courseId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // Refs
    const videoElement = ref(null)
    const playerContainer = ref(null)

    // State
    const isPlaying = ref(false)
    const currentTime = ref(0)
    const duration = ref(0)
    const showSafetyWarning = ref(true)
    const motionDetected = ref(false)

    // Composables
    const { saveProgress, loadProgress, markAsCompleted } = useVideoProgress()
    const { startMotionDetection, stopMotionDetection } = useMotionDetection()
    const { generateCertificate } = useCertificate()

    // Computed
    const progress = computed(() => {
      return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    })

    // Methods
    const play = async () => {
      try {
        await videoElement.value.play()
        isPlaying.value = true
      } catch (error) {
        console.error('Play error:', error)
      }
    }

    const pause = () => {
      videoElement.value.pause()
      isPlaying.value = false
    }

    const seek = (time) => {
      videoElement.value.currentTime = time
      currentTime.value = time
    }

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        playerContainer.value.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }

    // Event Handlers
    const handleLoadedMetadata = () => {
      duration.value = videoElement.value.duration
      loadSavedProgress()
    }

    const handleTimeUpdate = () => {
      currentTime.value = videoElement.value.currentTime

      // 5초마다 진도 저장
      if (Math.floor(currentTime.value) % 5 === 0) {
        saveProgressToFirestore()
      }
    }

    const handleVideoEnded = async () => {
      isPlaying.value = false

      // 수료 처리
      await markAsCompleted(props.userId, props.courseId)
      await generateCertificate(props.userId, props.courseId)

      // 완료 이벤트 발생
      emit('completed')
    }

    const handlePlay = () => {
      isPlaying.value = true
      startMotionTracking()
    }

    const handlePause = () => {
      isPlaying.value = false
      stopMotionTracking()
    }

    const handleError = (error) => {
      console.error('Video error:', error)
      emit('error', error)
    }

    const handleSafetyConfirm = () => {
      showSafetyWarning.value = false
    }

    const handleSafetyCancel = () => {
      emit('cancel')
    }

    // Progress Management
    const saveProgressToFirestore = async () => {
      await saveProgress(props.userId, props.courseId, {
        currentTime: currentTime.value,
        duration: duration.value,
        progress: progress.value,
        lastUpdated: new Date()
      })
    }

    const loadSavedProgress = async () => {
      const savedProgress = await loadProgress(props.userId, props.courseId)
      if (savedProgress && savedProgress.currentTime) {
        seek(savedProgress.currentTime)
      }
    }

    // Motion Detection
    const startMotionTracking = () => {
      startMotionDetection((motion) => {
        if (motion.acceleration > 2.5) { // 임계값
          motionDetected.value = true
          pause()

          // 3초 후 알림 숨기기
          setTimeout(() => {
            motionDetected.value = false
          }, 3000)
        }
      })
    }

    const stopMotionTracking = () => {
      stopMotionDetection()
    }

    // Lifecycle
    onMounted(() => {
      // 페이지 떠날 때 진도 저장
      window.addEventListener('beforeunload', saveProgressToFirestore)
    })

    onUnmounted(() => {
      stopMotionTracking()
      saveProgressToFirestore()
      window.removeEventListener('beforeunload', saveProgressToFirestore)
    })

    const emit = defineEmits(['completed', 'error', 'cancel'])

    return {
      videoElement,
      playerContainer,
      isPlaying,
      currentTime,
      duration,
      progress,
      showSafetyWarning,
      motionDetected,
      play,
      pause,
      seek,
      toggleFullscreen,
      handleLoadedMetadata,
      handleTimeUpdate,
      handleVideoEnded,
      handlePlay,
      handlePause,
      handleError,
      handleSafetyConfirm,
      handleSafetyCancel
    }
  }
}
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.motion-alert {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 59, 48, 0.9);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  z-index: 100;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}
</style>

// ===== 2. VideoControls.vue =====
// src/components/video/VideoControls.vue
<template>
  <div class="video-controls" :class="{ 'controls-hidden': !showControls }">
    <!-- 진도바 -->
    <div class="progress-bar-container" @click="handleSeek">
      <div class="progress-bar">
        <div class="progress-filled" :style="{ width: progress + '%' }"></div>
        <div class="progress-thumb" :style="{ left: progress + '%' }"></div>
      </div>
    </div>

    <!-- 컨트롤 버튼들 -->
    <div class="controls-bottom">
      <div class="controls-left">
        <!-- 재생/일시정지 -->
        <button @click="togglePlay" class="control-btn">
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>

        <!-- 시간 표시 -->
        <div class="time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>
      </div>

      <div class="controls-right">
        <!-- 전체화면 -->
        <button @click="$emit('toggleFullscreen')" class="control-btn">
          <i class="fas fa-expand"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'VideoControls',
  props: {
    isPlaying: Boolean,
    currentTime: Number,
    duration: Number,
    progress: Number
  },
  emits: ['play', 'pause', 'seek', 'toggleFullscreen'],
  setup(props, { emit }) {
    const showControls = ref(true)
    let hideControlsTimer = null

    const togglePlay = () => {
      if (props.isPlaying) {
        emit('pause')
      } else {
        emit('play')
      }
    }

    const handleSeek = (event) => {
      const progressBar = event.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const percent = (event.clientX - rect.left) / rect.width
      const time = percent * props.duration
      emit('seek', time)
    }

    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)

      if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      }
      return `${m}:${s.toString().padStart(2, '0')}`
    }

    const handleMouseMove = () => {
      showControls.value = true
      clearTimeout(hideControlsTimer)
      hideControlsTimer = setTimeout(() => {
        if (props.isPlaying) {
          showControls.value = false
        }
      }, 3000)
    }

    onMounted(() => {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchstart', handleMouseMove)
    })

    onUnmounted(() => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchstart', handleMouseMove)
      clearTimeout(hideControlsTimer)
    })

    return {
      showControls,
      togglePlay,
      handleSeek,
      formatTime
    }
  }
}
</script>

<style scoped>
.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
  padding: 20px;
  transition: opacity 0.3s ease;
}

.controls-hidden {
  opacity: 0;
  pointer-events: none;
}

.progress-bar-container {
  margin-bottom: 15px;
  cursor: pointer;
  padding: 10px 0;
}

.progress-bar {
  position: relative;
  height: 4px;
  background-color: rgba(255,255,255,0.3);
  border-radius: 2px;
}

.progress-filled {
  position: absolute;
  height: 100%;
  background-color: #007AFF;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.controls-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background-color: rgba(255,255,255,0.1);
}

.time-display {
  color: white;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
</style>

// ===== 3. SafetyWarningModal.vue =====
// src/components/video/SafetyWarningModal.vue
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="warning-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>

      <h2 class="modal-title">안전 주의사항</h2>

      <div class="warning-list">
        <div class="warning-item">
          <i class="fas fa-ban"></i>
          <span>작업 중 시청을 금지합니다</span>
        </div>
        <div class="warning-item">
          <i class="fas fa-walking"></i>
          <span>이동 중 시청을 금지합니다</span>
        </div>
        <div class="warning-item">
          <i class="fas fa-hand-paper"></i>
          <span>흔들림이 감지되면 자동으로 일시정지됩니다</span>
        </div>
      </div>

      <p class="warning-message">
        안전한 환경에서 시청하시기 바랍니다.
      </p>

      <div class="modal-actions">
        <button @click="$emit('cancel')" class="btn-cancel">
          취소
        </button>
        <button @click="$emit('confirm')" class="btn-confirm">
          확인했습니다
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SafetyWarningModal',
  emits: ['confirm', 'cancel']
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.warning-icon {
  width: 80px;
  height: 80px;
  background-color: #FFF3E0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.warning-icon i {
  font-size: 40px;
  color: #FF9800;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #333;
}

.warning-list {
  text-align: left;
  margin-bottom: 24px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  color: #666;
}

.warning-item i {
  color: #FF5252;
  width: 20px;
}

.warning-message {
  color: #666;
  margin-bottom: 32px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #F5F5F5;
  color: #666;
}

.btn-cancel:hover {
  background-color: #E0E0E0;
}

.btn-confirm {
  background-color: #007AFF;
  color: white;
}

.btn-confirm:hover {
  background-color: #0056B3;
}
</style>

// ===== 4. useVideoProgress.js =====
// src/composables/useVideoProgress.js
import { ref } from 'vue'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useVideoProgress() {
const loading = ref(false)
const error = ref(null)

const saveProgress = async (userId, courseId, progressData) => {
loading.value = true
error.value = null

try {
const progressRef = doc(db, 'users', userId, 'courseProgress', courseId)
await setDoc(progressRef, progressData, { merge: true })
} catch (err) {
console.error('Progress save error:', err)
error.value = err.message
} finally {
loading.value = false
}
}

const loadProgress = async (userId, courseId) => {
loading.value = true
error.value = null

try {
const progressRef = doc(db, 'users', userId, 'courseProgress', courseId)
const progressDoc = await getDoc(progressRef)

if (progressDoc.exists()) {
return progressDoc.data()
}
return null
} catch (err) {
console.error('Progress load error:', err)
error.value = err.message
return null
} finally {
loading.value = false
}
}

const markAsCompleted = async (userId, courseId) => {
loading.value = true
error.value = null

try {
const progressRef = doc(db, 'users', userId, 'courseProgress', courseId)
await updateDoc(progressRef, {
completed: true,
completedAt: new Date(),
progress: 100
})

// 사용자의 완료 강의 수 업데이트
const userRef = doc(db, 'users', userId)
const userDoc = await getDoc(userRef)
const currentCount = userDoc.data()?.completedCourses || 0

await updateDoc(userRef, {
completedCourses: currentCount + 1
})
} catch (err) {
console.error('Mark completed error:', err)
error.value = err.message
} finally {
loading.value = false
}
}

return {
loading,
error,
saveProgress,
loadProgress,
markAsCompleted
}
}

// ===== 5. useMotionDetection.js =====
// src/composables/useMotionDetection.js
import { ref, onUnmounted } from 'vue'

export function useMotionDetection() {
const isDetecting = ref(false)
const motionData = ref(null)
let motionHandler = null

const startMotionDetection = (callback) => {
if (!window.DeviceMotionEvent) {
console.warn('Device motion not supported')
return
}

// iOS 13+ 권한 요청
if (typeof DeviceMotionEvent.requestPermission === 'function') {
DeviceMotionEvent.requestPermission()
.then(response => {
if (response === 'granted') {
setupMotionDetection(callback)
}
})
.catch(console.error)
} else {
setupMotionDetection(callback)
}
}

const setupMotionDetection = (callback) => {
motionHandler = (event) => {
const acceleration = event.accelerationIncludingGravity

if (acceleration) {
const totalAcceleration = Math.sqrt(
Math.pow(acceleration.x || 0, 2) +
Math.pow(acceleration.y || 0, 2) +
Math.pow(acceleration.z || 0, 2)
)

motionData.value = {
x: acceleration.x,
y: acceleration.y,
z: acceleration.z,
acceleration: totalAcceleration
}

if (callback) {
callback(motionData.value)
}
}
}

window.addEventListener('devicemotion', motionHandler)
isDetecting.value = true
}

const stopMotionDetection = () => {
if (motionHandler) {
window.removeEventListener('devicemotion', motionHandler)
motionHandler = null
isDetecting.value = false
}
}

onUnmounted(() => {
stopMotionDetection()
})

return {
isDetecting,
motionData,
startMotionDetection,
stopMotionDetection
}
}

// ===== 6. useCertificate.js =====
// src/composables/useCertificate.js
import { ref } from 'vue'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '@/firebase/config'

export function useCertificate() {
const loading = ref(false)
const error = ref(null)
const functions = getFunctions()

const generateCertificate = async (userId, courseId) => {
loading.value = true
error.value = null

try {
// 강의 정보 가져오기
const courseRef = doc(db, 'courses', courseId)
const courseDoc = await getDoc(courseRef)

if (!courseDoc.exists()) {
throw new Error('Course not found')
}

const courseData = courseDoc.data()

// 사용자 정보 가져오기
const userRef = doc(db, 'users', userId)
const userDoc = await getDoc(userRef)

if (!userDoc.exists()) {
throw new Error('User not found')
}

const userData = userDoc.data()

// 수료증 데이터 준비
const certificateData = {
userId,
courseId,
courseName: courseData.title,
userName: userData.name || 'Unknown User',
completedAt: new Date(),
certificateNumber: generateCertificateNumber()
}

// Firestore에 수료증 저장
const certificateRef = doc(db, 'certificates', `${userId}_${courseId}`)
await setDoc(certificateRef, certificateData)

// Cloud Function 호출하여 PDF 생성 (옵션)
if (functions) {
const generatePDF = httpsCallable(functions, 'generateCertificatePDF')
await generatePDF(certificateData)
}

return certificateData
} catch (err) {
console.error('Certificate generation error:', err)
error.value = err.message
throw err
} finally {
loading.value = false
}
}

const generateCertificateNumber = () => {
const date = new Date()
const year = date.getFullYear()
const month = String(date.getMonth() + 1).padStart(2, '0')
const day = String(date.getDate()).padStart(2, '0')
const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

return `CERT-${year}${month}${day}-${random}`
}

return {
loading,
error,
generateCertificate
}
}

// ===== 7. VideoPlayView.vue =====
// src/views/VideoPlayView.vue
<template>
  <div class="video-play-view">
    <VideoPlayer
        v-if="videoUrl"
        :videoUrl="videoUrl"
        :courseId="courseId"
        :userId="userId"
        @completed="handleVideoCompleted"
        @error="handleVideoError"
        @cancel="handleCancel"
    />

    <!-- 완료 모달 -->
    <div v-if="showCompletionModal" class="completion-modal">
      <div class="modal-content">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>수강 완료!</h2>
        <p>축하합니다! 강의를 모두 수강하셨습니다.</p>
        <p>수료증이 발급되었습니다.</p>
        <div class="modal-actions">
          <button @click="viewCertificate" class="btn-primary">
            수료증 보기
          </button>
          <button @click="goToHome" class="btn-secondary">
            홈으로
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export default {
  name: 'VideoPlayView',
  components: {
    VideoPlayer
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()

    const videoUrl = ref('')
    const courseId = ref(route.params.courseId)
    const userId = ref(authStore.user?.uid)
    const showCompletionModal = ref(false)

    const loadCourseData = async () => {
      try {
        const courseRef = doc(db, 'courses', courseId.value)
        const courseDoc = await getDoc(courseRef)

        if (courseDoc.exists()) {
          const data = courseDoc.data()
          videoUrl.value = data.videoUrl
        } else {
          console.error('Course not found')
          router.push('/home')
        }
      } catch (error) {
        console.error('Error loading course:', error)
      }
    }

    const handleVideoCompleted = () => {
      showCompletionModal.value = true
    }

    const handleVideoError = (error) => {
      console.error('Video error:', error)
      // 에러 처리 로직
    }

    const handleCancel = () => {
      router.push('/home')
    }

    const viewCertificate = () => {
      router.push(`/certificates/${courseId.value}`)
    }

    const goToHome = () => {
      router.push('/home')
    }

    onMounted(() => {
      loadCourseData()
    })

    return {
      videoUrl,
      courseId,
      userId,
      showCompletionModal,
      handleVideoCompleted,
      handleVideoError,
      handleCancel,
      viewCertificate,
      goToHome
    }
  }
}
</script>

<style scoped>
.video-play-view {
  width: 100%;
  height: 100vh;
  background-color: #000;
  position: relative;
}

.completion-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.success-icon {
  width: 80px;
  height: 80px;
  background-color: #E8F5E9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.success-icon i {
  font-size: 40px;
  color: #4CAF50;
}

.modal-content h2 {
  font-size: 28px;
  margin-bottom: 16px;
  color: #333;
}

.modal-content p {
  color: #666;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007AFF;
  color: white;
}

.btn-primary:hover {
  background-color: #0056B3;
}

.btn-secondary {
  background-color: #F5F5F5;
  color: #333;
}

.btn-secondary:hover {
  background-color: #E0E0E0;
}
</style>

// ===== 8. Firebase 설정 파일 =====
// src/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
// Firebase 프로젝트 설정
apiKey: "your-api-key",
authDomain: "your-auth-domain",
projectId: "your-project-id",
storageBucket: "your-storage-bucket",
messagingSenderId: "your-messaging-sender-id",
appId: "your-app-id"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

export default app