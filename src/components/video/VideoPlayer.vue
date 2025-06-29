<template>
  <div class="video-player-container">
    <!-- 비디오 로딩 스켈레톤 -->
    <div v-if="isInitialLoading" class="video-skeleton">
      <div class="skeleton-video"></div>
      <div class="skeleton-controls">
        <div class="skeleton-progress"></div>
        <div class="skeleton-buttons"></div>
      </div>
    </div>

    <!-- 비디오 플레이어 -->
    <div v-else class="video-wrapper" :class="{ 'fullscreen': isFullscreen }">
      <!-- 썸네일 프리뷰 (초기 로딩 최적화) -->
      <div v-if="!isVideoReady && thumbnailUrl" class="video-thumbnail" @click="loadVideo">
        <img :src="thumbnailUrl" :alt="title" />
        <div class="play-overlay">
          <div class="play-button">
            <Play :size="48" />
          </div>
        </div>
      </div>

      <!-- 실제 비디오 엘리먼트 -->
      <video
          v-show="isVideoReady"
          ref="videoElement"
          class="video-player"
          :poster="thumbnailUrl"
          preload="metadata"
          playsinline
          crossorigin="anonymous"
          @loadstart="onLoadStart"
          @loadedmetadata="onLoadedMetadata"
          @loadeddata="onLoadedData"
          @canplay="onCanPlay"
          @play="onPlay"
          @pause="onPause"
          @timeupdate="onTimeUpdate"
          @ended="onEnded"
          @error="onError"
          @waiting="onWaiting"
          @playing="onPlaying"
      >
        <!-- 여러 소스 형식 지원 -->
        <source :src="videoUrl" type="video/mp4" />
        <source :src="videoUrl" type="application/x-mpegURL" v-if="videoUrl.includes('.m3u8')" />
        <p>브라우저가 비디오 재생을 지원하지 않습니다.</p>
      </video>

      <!-- 버퍼링 인디케이터 -->
      <div v-if="isBuffering" class="buffering-overlay">
        <div class="buffering-spinner"></div>
        <p>버퍼링 중...</p>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="errorMessage" class="error-overlay">
        <AlertCircle :size="48" />
        <h3>비디오 재생 오류</h3>
        <p>{{ errorMessage }}</p>
        <button @click="retryLoad" class="retry-btn">다시 시도</button>
      </div>

      <!-- 커스텀 컨트롤 -->
      <div
          v-if="!errorMessage"
          class="video-controls"
          :class="{ 'visible': showControls }"
          @mouseenter="showControls = true"
          @mouseleave="hideControlsDelayed"
      >
        <!-- 진도 바 -->
        <div class="progress-container" @click="seek">
          <div class="progress-bar">
            <div class="progress-buffered" :style="{ width: bufferedPercent + '%' }"></div>
            <div class="progress-played" :style="{ width: progressPercent + '%' }"></div>
            <div
                class="progress-thumb"
                :style="{ left: progressPercent + '%' }"
                @mousedown="startDragging"
            ></div>
          </div>
          <div class="time-tooltip" :style="{ left: tooltipPosition + '%' }">
            {{ formatTime(tooltipTime) }}
          </div>
        </div>

        <!-- 컨트롤 버튼들 -->
        <div class="control-buttons">
          <div class="controls-left">
            <!-- 재생/일시정지 -->
            <button @click="togglePlay" class="control-btn">
              <component :is="isPlaying ? Pause : Play" :size="20" />
            </button>

            <!-- 볼륨 조절 -->
            <div class="volume-control">
              <button @click="toggleMute" class="control-btn">
                <component :is="volumeIcon" :size="20" />
              </button>
              <div class="volume-slider">
                <input
                    type="range"
                    min="0"
                    max="100"
                    v-model="volume"
                    @input="changeVolume"
                />
              </div>
            </div>

            <!-- 시간 표시 -->
            <div class="time-display">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </div>
          </div>

          <div class="controls-right">
            <!-- 재생 속도 -->
            <div class="speed-control">
              <button @click="showSpeedMenu = !showSpeedMenu" class="control-btn">
                {{ playbackRate }}x
              </button>
              <div v-if="showSpeedMenu" class="speed-menu">
                <button
                    v-for="speed in playbackSpeeds"
                    :key="speed"
                    @click="changeSpeed(speed)"
                    :class="{ active: playbackRate === speed }"
                >
                  {{ speed }}x
                </button>
              </div>
            </div>

            <!-- 화질 선택 -->
            <div v-if="qualities.length > 1" class="quality-control">
              <button @click="showQualityMenu = !showQualityMenu" class="control-btn">
                <Settings :size="20" />
              </button>
              <div v-if="showQualityMenu" class="quality-menu">
                <button
                    v-for="quality in qualities"
                    :key="quality.value"
                    @click="changeQuality(quality.value)"
                    :class="{ active: currentQuality === quality.value }"
                >
                  {{ quality.label }}
                </button>
              </div>
            </div>

            <!-- 전체화면 -->
            <button @click="toggleFullscreen" class="control-btn">
              <component :is="isFullscreen ? Minimize : Maximize" :size="20" />
            </button>
          </div>
        </div>
      </div>

      <!-- 키보드 단축키 안내 -->
      <Transition name="fade">
        <div v-if="showKeyboardHint" class="keyboard-hint">
          <div class="hint-content">
            <h4>키보드 단축키</h4>
            <div class="hint-grid">
              <div><kbd>Space</kbd> 재생/일시정지</div>
              <div><kbd>←/→</kbd> 10초 앞/뒤로</div>
              <div><kbd>↑/↓</kbd> 볼륨 조절</div>
              <div><kbd>F</kbd> 전체화면</div>
              <div><kbd>M</kbd> 음소거</div>
              <div><kbd>1-9</kbd> 구간 이동</div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Settings, Maximize, Minimize, SkipBack, SkipForward,
  AlertCircle
} from 'lucide-vue-next'

// Props
const props = defineProps({
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  courseId: {
    type: String,
    default: ''
  },
  episodeId: {
    type: String,
    default: ''
  },
  userId: {
    type: String,
    default: ''
  },
  currentLanguage: {
    type: String,
    default: 'ko'
  },
  onProgress: {
    type: Function,
    default: null
  }
})

// Emit
const emit = defineEmits(['ready', 'play', 'pause', 'ended', 'progress', 'error', 'shake-detected'])

// Refs
const videoElement = ref(null)

// 상태
const isInitialLoading = ref(true)
const isVideoReady = ref(false)
const isPlaying = ref(false)
const isBuffering = ref(false)
const isFullscreen = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const isMuted = ref(false)
const playbackRate = ref(1)
const bufferedPercent = ref(0)
const showControls = ref(true)
const showSpeedMenu = ref(false)
const showQualityMenu = ref(false)
const showKeyboardHint = ref(false)
const isDragging = ref(false)
const tooltipTime = ref(0)
const tooltipPosition = ref(0)
const currentQuality = ref('auto')
const lastSavedTime = ref(0)
const errorMessage = ref('')
const retryCount = ref(0)
const maxRetries = 3

// 설정값
const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const qualities = ref([
  { value: 'auto', label: '자동' },
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '480p', label: '480p' }
])

// 타이머
let controlsTimer = null
let progressTimer = null
let shakeDetectionTimer = null

// 계산된 속성
const progressPercent = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return VolumeX
  if (volume.value < 50) return Volume1
  return Volume2
})

// 메서드
const loadVideo = async () => {
  if (!props.videoUrl) {
    errorMessage.value = '비디오 URL이 없습니다.'
    return
  }

  isVideoReady.value = true
  errorMessage.value = ''

  await nextTick()

  if (videoElement.value) {
    try {
      console.log('🎬 비디오 로드 시작:', props.videoUrl)

      // 기존 소스 제거
      videoElement.value.pause()
      videoElement.value.removeAttribute('src')
      videoElement.value.load()

      // 새 소스 설정
      videoElement.value.src = props.videoUrl

      // 메타데이터 로드 대기
      videoElement.value.load()

    } catch (error) {
      console.error('비디오 로드 오류:', error)
      errorMessage.value = '비디오를 로드할 수 없습니다.'
    }
  }
}

const retryLoad = async () => {
  if (retryCount.value < maxRetries) {
    retryCount.value++
    errorMessage.value = ''
    await loadVideo()
  } else {
    errorMessage.value = '비디오 로드에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }
}

const togglePlay = () => {
  if (!videoElement.value) return

  if (isPlaying.value) {
    videoElement.value.pause()
  } else {
    videoElement.value.play().catch(error => {
      console.error('재생 오류:', error)
      errorMessage.value = '비디오를 재생할 수 없습니다.'
    })
  }
}

const seek = (event) => {
  if (!videoElement.value || !duration.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const time = percent * duration.value

  videoElement.value.currentTime = time
}

const startDragging = (event) => {
  isDragging.value = true
  document.addEventListener('mousemove', handleDragging)
  document.addEventListener('mouseup', stopDragging)
}

const handleDragging = (event) => {
  if (!isDragging.value || !videoElement.value || !duration.value) return

  const progressBar = document.querySelector('.progress-container')
  const rect = progressBar.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const time = percent * duration.value

  videoElement.value.currentTime = time
}

const stopDragging = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragging)
  document.removeEventListener('mouseup', stopDragging)
}

const toggleMute = () => {
  if (!videoElement.value) return

  isMuted.value = !isMuted.value
  videoElement.value.muted = isMuted.value
}

const changeVolume = () => {
  if (!videoElement.value) return

  videoElement.value.volume = volume.value / 100
  isMuted.value = volume.value === 0

  // 볼륨 설정 저장
  localStorage.setItem('videoPlayerVolume', volume.value)
}

const changeSpeed = (speed) => {
  if (!videoElement.value) return

  playbackRate.value = speed
  videoElement.value.playbackRate = speed
  showSpeedMenu.value = false

  // 속도 설정 저장
  localStorage.setItem('videoPlayerSpeed', speed)
}

const changeQuality = (quality) => {
  currentQuality.value = quality
  showQualityMenu.value = false

  // 화질 변경 로직 (서버 지원 필요)
  console.log('화질 변경:', quality)
}

const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    const container = document.querySelector('.video-wrapper')
    if (container.requestFullscreen) {
      container.requestFullscreen()
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    }
  }
}

const hideControlsDelayed = () => {
  clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 이벤트 핸들러
const onLoadStart = () => {
  isInitialLoading.value = false
  isBuffering.value = true
  console.log('🎬 비디오 로드 시작')
}

const onLoadedMetadata = () => {
  duration.value = videoElement.value.duration
  console.log('📊 비디오 메타데이터 로드됨:', {
    duration: duration.value,
    videoWidth: videoElement.value.videoWidth,
    videoHeight: videoElement.value.videoHeight
  })

  // 저장된 재생 위치 복원
  const savedPosition = localStorage.getItem(`videoPosition_${props.courseId}_${props.episodeId}`)
  if (savedPosition) {
    const position = parseFloat(savedPosition)
    if (position > 0 && position < duration.value - 10) {
      videoElement.value.currentTime = position
    }
  }
}

const onLoadedData = () => {
  console.log('✅ 비디오 데이터 로드 완료')
  emit('ready')
}

const onCanPlay = () => {
  isBuffering.value = false
  errorMessage.value = ''
  console.log('▶️ 비디오 재생 준비 완료')
}

const onPlay = () => {
  isPlaying.value = true
  emit('play')
  hideControlsDelayed()
  startShakeDetection()
}

const onPause = () => {
  isPlaying.value = false
  showControls.value = true
  emit('pause')
  stopShakeDetection()
}

const onTimeUpdate = () => {
  if (!videoElement.value) return

  currentTime.value = videoElement.value.currentTime

  // 버퍼링 상태 업데이트
  if (videoElement.value.buffered.length > 0) {
    const bufferedEnd = videoElement.value.buffered.end(videoElement.value.buffered.length - 1)
    bufferedPercent.value = (bufferedEnd / duration.value) * 100
  }

  // 10초마다 진도 저장
  if (currentTime.value - lastSavedTime.value > 10) {
    saveProgress()
    lastSavedTime.value = currentTime.value
  }
}

const onEnded = () => {
  isPlaying.value = false
  showControls.value = true
  emit('ended')

  // 완료 상태 저장
  if (props.onProgress) {
    props.onProgress(100)
  }
  emit('progress', 100)
}

const onError = (event) => {
  const error = event.target.error
  console.error('❌ 비디오 재생 오류:', error)

  let message = '비디오를 재생할 수 없습니다.'

  if (error) {
    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        message = '비디오 로드가 중단되었습니다.'
        break
      case error.MEDIA_ERR_NETWORK:
        message = '네트워크 오류가 발생했습니다.'
        break
      case error.MEDIA_ERR_DECODE:
        message = '비디오 형식을 지원하지 않습니다.'
        break
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        message = '비디오 소스를 찾을 수 없거나 지원하지 않는 형식입니다.'
        break
    }
  }

  errorMessage.value = message
  emit('error', event)
  isBuffering.value = false
}

const onWaiting = () => {
  isBuffering.value = true
}

const onPlaying = () => {
  isBuffering.value = false
}

// 진도 저장
const saveProgress = () => {
  if (!duration.value) return

  const progress = Math.floor((currentTime.value / duration.value) * 100)

  // 로컬 스토리지에 저장
  localStorage.setItem(
      `videoPosition_${props.courseId}_${props.episodeId}`,
      currentTime.value.toString()
  )

  // 진도 콜백 호출
  if (props.onProgress) {
    props.onProgress(progress)
  }

  emit('progress', progress)
}

// 흔들림 감지
const startShakeDetection = () => {
  if ('DeviceMotionEvent' in window) {
    window.addEventListener('devicemotion', handleMotion)
  }
}

const stopShakeDetection = () => {
  if ('DeviceMotionEvent' in window) {
    window.removeEventListener('devicemotion', handleMotion)
  }
}

let lastShakeTime = 0
const shakeThreshold = 15

const handleMotion = (event) => {
  const acceleration = event.accelerationIncludingGravity
  if (!acceleration) return

  const currentTime = new Date().getTime()
  if (currentTime - lastShakeTime > 1000) {
    const speed = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z)

    if (speed > shakeThreshold) {
      lastShakeTime = currentTime
      emit('shake-detected')
      console.log('🚨 흔들림 감지!')
    }
  }
}

// 키보드 단축키
const handleKeyboard = (event) => {
  if (!videoElement.value) return

  switch (event.key) {
    case ' ':
    case 'Spacebar':
      event.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      event.preventDefault()
      videoElement.value.currentTime = Math.max(0, currentTime.value - 10)
      break
    case 'ArrowRight':
      event.preventDefault()
      videoElement.value.currentTime = Math.min(duration.value, currentTime.value + 10)
      break
    case 'ArrowUp':
      event.preventDefault()
      volume.value = Math.min(100, volume.value + 10)
      changeVolume()
      break
    case 'ArrowDown':
      event.preventDefault()
      volume.value = Math.max(0, volume.value - 10)
      changeVolume()
      break
    case 'f':
    case 'F':
      event.preventDefault()
      toggleFullscreen()
      break
    case 'm':
    case 'M':
      event.preventDefault()
      toggleMute()
      break
    case '?':
      showKeyboardHint.value = !showKeyboardHint.value
      break
    default:
      // 숫자 키로 구간 이동 (1-9)
      if (event.key >= '1' && event.key <= '9') {
        const percent = parseInt(event.key) * 10
        videoElement.value.currentTime = (duration.value * percent) / 100
      }
  }
}

// 전체화면 변경 감지
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 저장된 설정 복원
const restoreSettings = () => {
  const savedVolume = localStorage.getItem('videoPlayerVolume')
  if (savedVolume) {
    volume.value = parseFloat(savedVolume)
  }

  const savedSpeed = localStorage.getItem('videoPlayerSpeed')
  if (savedSpeed) {
    playbackRate.value = parseFloat(savedSpeed)
  }
}

// 마운트
onMounted(() => {
  restoreSettings()

  // 이벤트 리스너 등록
  document.addEventListener('keydown', handleKeyboard)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

  // 주기적 진도 저장
  progressTimer = setInterval(saveProgress, 30000) // 30초마다

  // 초기 로딩
  if (props.videoUrl) {
    setTimeout(() => {
      loadVideo()
    }, 100)
  }
})

// 언마운트
onUnmounted(() => {
  // 마지막 진도 저장
  saveProgress()

  // 이벤트 리스너 제거
  document.removeEventListener('keydown', handleKeyboard)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  stopShakeDetection()

  // 타이머 정리
  clearTimeout(controlsTimer)
  clearInterval(progressTimer)
})

// 비디오 URL 변경 감지
watch(() => props.videoUrl, async (newUrl, oldUrl) => {
  if (newUrl && newUrl !== oldUrl) {
    console.log('🔄 비디오 URL 변경 감지:', newUrl)
    retryCount.value = 0
    await loadVideo()
  }
})
</script>

<style scoped>
/* =================== 컨테이너 =================== */
.video-player-container {
  width: 100%;
  background: #000;
  position: relative;
}

/* =================== 스켈레톤 로딩 =================== */
.video-skeleton {
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
}

.skeleton-video {
  width: 100%;
  height: 100%;
  background: var(--bg-tertiary);
  animation: skeleton-pulse 1.5s infinite;
}

.skeleton-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.3);
}

.skeleton-progress {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: var(--space-3);
}

.skeleton-buttons {
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* =================== 비디오 래퍼 =================== */
.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  overflow: hidden;
  cursor: pointer;
}

.video-wrapper.fullscreen {
  aspect-ratio: auto;
  height: 100vh;
}

/* =================== 썸네일 프리뷰 =================== */
.video-thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: background 0.3s ease;
}

.video-thumbnail:hover .play-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.play-button {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.video-thumbnail:hover .play-button {
  transform: scale(1.1);
}

/* =================== 비디오 플레이어 =================== */
.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* =================== 버퍼링 오버레이 =================== */
.buffering-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  pointer-events: none;
}

.buffering-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-3);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =================== 에러 오버레이 =================== */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  text-align: center;
  padding: 2rem;
}

.error-overlay svg {
  margin-bottom: 1rem;
  color: #ef4444;
}

.error-overlay h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-overlay p {
  margin-bottom: 1.5rem;
  color: #9ca3af;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: var(--accent-primary-dark);
}

/* =================== 비디오 컨트롤 =================== */
.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: var(--space-6) var(--space-4) var(--space-4);
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: default;
}

.video-controls.visible {
  opacity: 1;
}

/* =================== 진도 바 =================== */
.progress-container {
  position: relative;
  height: 40px;
  margin-bottom: var(--space-2);
  cursor: pointer;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  transition: height 0.2s ease;
}

.progress-container:hover .progress-bar {
  height: 8px;
}

.progress-buffered {
  position: absolute;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.progress-played {
  position: absolute;
  height: 100%;
  background: var(--accent-primary);
  border-radius: 2px;
}

.progress-thumb {
  position: absolute;
  bottom: -6px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: grab;
}

.progress-container:hover .progress-thumb {
  opacity: 1;
}

.progress-thumb:active {
  cursor: grabbing;
  transform: translateX(-50%) scale(1.2);
}

.time-tooltip {
  position: absolute;
  bottom: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-container:hover .time-tooltip {
  opacity: 1;
}

/* =================== 컨트롤 버튼 =================== */
.control-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.control-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* =================== 볼륨 컨트롤 =================== */
.volume-control {
  display: flex;
  align-items: center;
}

.volume-slider {
  width: 0;
  overflow: hidden;
  transition: width 0.3s ease;
  margin-left: var(--space-2);
}

.volume-control:hover .volume-slider {
  width: 100px;
}

.volume-slider input[type="range"] {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.volume-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

/* =================== 시간 표시 =================== */
.time-display {
  color: white;
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  user-select: none;
}

/* =================== 속도/화질 메뉴 =================== */
.speed-control,
.quality-control {
  position: relative;
}

.speed-menu,
.quality-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  margin-bottom: var(--space-2);
  min-width: 120px;
}

.speed-menu button,
.quality-menu button {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.speed-menu button:hover,
.quality-menu button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.speed-menu button.active,
.quality-menu button.active {
  background: var(--accent-primary);
}

/* =================== 키보드 힌트 =================== */
.keyboard-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  max-width: 500px;
  width: 90%;
}

.hint-content h4 {
  margin-bottom: var(--space-4);
  font-size: var(--text-lg);
}

.hint-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.hint-grid kbd {
  background: rgba(255, 255, 255, 0.2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-family: monospace;
  margin-right: var(--space-2);
}

/* =================== 애니메이션 =================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* =================== 반응형 =================== */
@media (max-width: 768px) {
  .control-btn {
    width: 36px;
    height: 36px;
  }

  .controls-left,
  .controls-right {
    gap: var(--space-2);
  }

  .time-display {
    display: none;
  }

  .volume-control:hover .volume-slider {
    width: 80px;
  }

  .keyboard-hint {
    display: none;
  }
}

/* =================== 접근성 =================== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>