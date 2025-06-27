<template>
  <div class="video-player-wrapper">
    <!-- 비디오 컨테이너 -->
    <div class="video-container">
      <video
          ref="videoPlayer"
          class="video-js vjs-theme-forest vjs-big-play-centered"
          controls
          preload="auto"
          :poster="poster"
      >
        <source :src="videoUrl" type="video/mp4" />
        <p class="vjs-no-js">
          동영상을 재생하려면 JavaScript를 활성화해주세요.
        </p>
      </video>
    </div>

    <!-- 진행 상태 표시 -->
    <div class="video-controls">
      <div class="progress-info">
        <div class="progress-text">
          <span>진행률: {{ progressPercentage }}%</span>
          <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>
        <el-progress
            :percentage="progressPercentage"
            :color="progressColor"
            :stroke-width="8"
        />
      </div>

      <!-- 추가 컨트롤 -->
      <div class="additional-controls">
        <el-button-group>
          <el-button @click="togglePlayback" :icon="isPlaying ? 'Pause' : 'CaretRight'">
            {{ isPlaying ? '일시정지' : '재생' }}
          </el-button>
          <el-button @click="skipBackward" icon="DArrowLeft">
            10초 뒤로
          </el-button>
          <el-button @click="skipForward" icon="DArrowRight">
            10초 앞으로
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 완료 알림 -->
    <el-dialog
        v-model="showCompletionDialog"
        title="수강 완료"
        width="30%"
        center
    >
      <div class="completion-content">
        <el-icon class="completion-icon" :size="64" color="#67c23a">
          <SuccessFilled />
        </el-icon>
        <p>축하합니다! 강의를 완료하셨습니다.</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleCompletion">
            확인
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { SuccessFilled } from '@element-plus/icons-vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import '@videojs/themes/dist/forest/index.css'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

const props = defineProps({
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
  },
  poster: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['completed', 'error', 'progress'])

// Video.js 인스턴스
const videoPlayer = ref(null)
const player = ref(null)

// 상태 관리
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const isCompleted = ref(false)
const showCompletionDialog = ref(false)
const lastSaveTime = ref(0)

// 계산된 속성
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return Math.round((currentTime.value / duration.value) * 100)
})

const progressColor = computed(() => {
  if (progressPercentage.value < 30) return '#f56c6c'
  if (progressPercentage.value < 70) return '#e6a23c'
  return '#67c23a'
})

// 시간 포맷팅
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Video.js 초기화
const initializePlayer = () => {
  const options = {
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    controlBar: {
      playToggle: true,
      volumePanel: {
        inline: false
      },
      currentTimeDisplay: true,
      timeDivider: true,
      durationDisplay: true,
      progressControl: true,
      remainingTimeDisplay: false,
      playbackRateMenuButton: {
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2]
      },
      fullscreenToggle: true
    }
  }

  player.value = videojs(videoPlayer.value, options)

  // 이벤트 리스너 설정
  player.value.on('loadedmetadata', onLoadedMetadata)
  player.value.on('timeupdate', onTimeUpdate)
  player.value.on('play', () => { isPlaying.value = true })
  player.value.on('pause', () => { isPlaying.value = false })
  player.value.on('ended', onVideoEnded)
  player.value.on('error', onVideoError)

  // 10초마다 진행도 저장
  setInterval(saveProgress, 10000)
}

// 메타데이터 로드 완료
const onLoadedMetadata = async () => {
  duration.value = player.value.duration()

  // 이전 진행도 불러오기
  await loadProgress()
}

// 시간 업데이트
const onTimeUpdate = () => {
  currentTime.value = player.value.currentTime()
  emit('progress', progressPercentage.value)
}

// 비디오 종료
const onVideoEnded = () => {
  isCompleted.value = true
  showCompletionDialog.value = true
  saveProgress(true)
}

// 비디오 에러
const onVideoError = (error) => {
  console.error('Video error:', error)
  ElMessage.error('비디오 재생 중 오류가 발생했습니다')
  emit('error', error)
}

// 진행도 저장
const saveProgress = async (completed = false) => {
  if (!props.userId || !props.courseId) return

  const now = Date.now()
  // 10초 이내에 저장한 경우 스킵 (완료 시 제외)
  if (!completed && now - lastSaveTime.value < 10000) return

  lastSaveTime.value = now

  try {
    const progressData = {
      userId: props.userId,
      courseId: props.courseId,
      currentTime: currentTime.value,
      duration: duration.value,
      percentage: progressPercentage.value,
      completed: completed || isCompleted.value,
      lastUpdated: serverTimestamp()
    }

    await setDoc(
        doc(db, 'progress', `${props.userId}_${props.courseId}`),
        progressData,
        { merge: true }
    )

    if (completed) {
      await setDoc(
          doc(db, 'certificates', `${props.userId}_${props.courseId}`),
          {
            userId: props.userId,
            courseId: props.courseId,
            completedAt: serverTimestamp(),
            certificateNumber: generateCertificateNumber()
          }
      )
    }
  } catch (error) {
    console.error('Progress save error:', error)
  }
}

// 진행도 불러오기
const loadProgress = async () => {
  if (!props.userId || !props.courseId) return

  try {
    const docRef = doc(db, 'progress', `${props.userId}_${props.courseId}`)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.currentTime && !data.completed) {
        player.value.currentTime(data.currentTime)
        ElMessage.info(`이전 시청 위치(${formatTime(data.currentTime)})부터 재생합니다`)
      }
      isCompleted.value = data.completed || false
    }
  } catch (error) {
    console.error('Progress load error:', error)
  }
}

// 재생/일시정지 토글
const togglePlayback = () => {
  if (player.value) {
    if (isPlaying.value) {
      player.value.pause()
    } else {
      player.value.play()
    }
  }
}

// 10초 뒤로
const skipBackward = () => {
  if (player.value) {
    const newTime = Math.max(0, currentTime.value - 10)
    player.value.currentTime(newTime)
  }
}

// 10초 앞으로
const skipForward = () => {
  if (player.value) {
    const newTime = Math.min(duration.value, currentTime.value + 10)
    player.value.currentTime(newTime)
  }
}

// 완료 처리
const handleCompletion = () => {
  showCompletionDialog.value = false
  emit('completed')
}

// 수료증 번호 생성
const generateCertificateNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CERT-${year}${month}${day}-${random}`
}

// 생명주기
onMounted(() => {
  if (videoPlayer.value) {
    initializePlayer()
  }
})

onUnmounted(() => {
  if (player.value) {
    saveProgress()
    player.value.dispose()
  }
})

// 비디오 URL 변경 감지
watch(() => props.videoUrl, (newUrl) => {
  if (player.value && newUrl) {
    player.value.src({ type: 'video/mp4', src: newUrl })
  }
})
</script>

<style scoped>
.video-player-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.video-container {
  width: 100%;
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-js {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
}

.video-controls {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 20px;
}

.progress-info {
  margin-bottom: 20px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.additional-controls {
  display: flex;
  justify-content: center;
}

.completion-content {
  text-align: center;
  padding: 20px;
}

.completion-icon {
  margin-bottom: 20px;
}

/* 모바일 대응 */
@media (max-width: 768px) {
  .video-player-wrapper {
    padding: 10px;
  }

  .video-container {
    border-radius: 8px;
  }

  .video-controls {
    padding: 15px;
  }

  .additional-controls :deep(.el-button) {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>