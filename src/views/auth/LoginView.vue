<template>
  <div class="login-container">
    <!-- 로고와 타이틀 -->
    <div class="login-header">
      <div class="logo-wrapper">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="title">강의 신청하기</h1>
      <p class="subtitle">안전교육 플랫폼에 오신 것을 환영합니다</p>
    </div>

    <!-- 로그인 폼 카드 -->
    <div class="login-form">
      <!-- 로그인 탭 -->
      <div class="login-tabs">
        <button
            :class="['tab', { active: loginType === 'email' }]"
            @click="loginType = 'email'"
        >
          이메일 로그인
        </button>
        <button
            :class="['tab', { active: loginType === 'guest' }]"
            @click="loginType = 'guest'"
        >
          게스트 입장
        </button>
      </div>

      <!-- 이메일 로그인 폼 -->
      <form v-if="loginType === 'email'" @submit.prevent="handleEmailLogin" class="form-content">
        <!-- 에러 메시지 -->
        <transition name="error">
          <div v-if="error" class="error-message">
            <AlertCircle :size="16" />
            {{ error }}
          </div>
        </transition>

        <!-- 이메일 입력 -->
        <div class="form-group">
          <label for="email">이메일</label>
          <div class="input-wrapper">
            <Mail :size="20" class="input-icon" />
            <input
                id="email"
                v-model="email"
                type="email"
                placeholder="example@email.com"
                required
                :disabled="loading"
                class="form-input with-icon"
            />
          </div>
        </div>

        <!-- 비밀번호 입력 -->
        <div class="form-group">
          <label for="password">비밀번호</label>
          <div class="input-wrapper">
            <Lock :size="20" class="input-icon" />
            <input
                id="password"
                v-model="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                required
                :disabled="loading"
                class="form-input with-icon"
            />
          </div>
        </div>

        <!-- 로그인 버튼 -->
        <button
            type="submit"
            class="submit-button"
            :disabled="loading || isProcessing"
        >
          <Loader2 v-if="loading" :size="20" class="loading-spinner" />
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>

        <!-- 추가 옵션 -->
        <div class="form-options">
          <label class="remember-me">
            <input v-model="rememberMe" type="checkbox" />
            <span>로그인 상태 유지</span>
          </label>
          <a href="#" @click.prevent="showForgotPassword" class="forgot-link">
            비밀번호 찾기
          </a>
        </div>

        <!-- 소셜 로그인 -->
        <div class="social-login">
          <div class="divider-text">간편 로그인</div>

          <button
              type="button"
              @click="handleGoogleLogin"
              class="social-button google-button"
              :disabled="loading || isProcessing"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            구글로 로그인
          </button>
        </div>

        <!-- 회원가입 링크 -->
        <div class="signup-link">
          아직 계정이 없으신가요?
          <router-link to="/register">회원가입</router-link>
        </div>
      </form>

      <!-- 게스트 입장 폼 -->
      <div v-else class="form-content guest-form">
        <div class="guest-info">
          <div class="info-icon">
            <Zap :size="40" />
          </div>
          <h3>게스트로 입장하기</h3>
          <p>회원가입 없이 바로 교육을 시작할 수 있습니다</p>
        </div>

        <div class="guest-features">
          <div class="feature">
            <CheckCircle :size="18" class="check" />
            <span>모든 강의 시청 가능</span>
          </div>
          <div class="feature">
            <CheckCircle :size="18" class="check" />
            <span>QR 코드로 빠른 접속</span>
          </div>
          <div class="feature disabled">
            <XCircle :size="18" class="x" />
            <span>진도 저장 불가</span>
          </div>
          <div class="feature disabled">
            <XCircle :size="18" class="x" />
            <span>수료증 발급 불가</span>
          </div>
        </div>

        <button
            @click="handleGuestLogin"
            class="submit-button guest-button"
            :disabled="loading || isProcessing"
        >
          <Loader2 v-if="loading" :size="20" class="loading-spinner" />
          {{ loading ? '입장 중...' : '게스트로 입장' }}
        </button>

        <div class="guest-notice">
          <AlertCircle :size="16" />
          수료증이 필요하신 경우 회원가입을 해주세요
        </div>
      </div>
    </div>

    <!-- QR 코드 스캔 옵션 -->
    <div class="qr-option">
      <div class="divider">
        <span>또는</span>
      </div>
      <button @click="openQRScanner" class="qr-button">
        <QrCode :size="20" />
        QR 코드로 시작하기
      </button>
    </div>
  </div>

  <!-- Google 추가 정보 입력 모달 -->
  <GoogleSignupModal
      :show="showGoogleSignupModal"
      :google-user-info="googleUserInfo"
      @close="showGoogleSignupModal = false"
      @completed="onGoogleSignupCompleted"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import GoogleSignupModal from '@/components/GoogleSignupModal.vue'
import {
  AlertCircle,
  Mail,
  Lock,
  Loader2,
  Zap,
  CheckCircle,
  XCircle,
  QrCode
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// 상태 관리
const loginType = ref('email') // 'email' or 'guest'
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')
const isProcessing = ref(false) // 중복 제출 방지

// Google 로그인 추가 정보 모달
const showGoogleSignupModal = ref(false)
const googleUserInfo = ref({})

// 팝업 차단 검사
let popupCheckInterval = null

// 이메일 로그인 처리
const handleEmailLogin = async () => {
  // 이미 처리 중이면 무시
  if (isProcessing.value) return

  error.value = ''

  // HTML5 폼 검증이 통과된 경우에만 실행됨
  isProcessing.value = true
  loading.value = true

  try {
    // authStore를 통한 로그인
    const result = await authStore.loginWithEmail(email.value, password.value)

    if (result.success) {
      // 로그인 상태 저장
      if (rememberMe.value) {
        localStorage.setItem('rememberMe', 'true')
      }
      ElMessage.success('로그인되었습니다')

      // 리다이렉트
      const redirectTo = router.currentRoute.value.query.redirect || '/home'
      router.push(redirectTo)
    } else {
      error.value = result.error || '로그인에 실패했습니다'
    }

  } catch (err) {
    console.error('로그인 오류:', err)
    error.value = '로그인 중 오류가 발생했습니다'
  } finally {
    loading.value = false
    isProcessing.value = false
  }
}

// 게스트 로그인 처리
const handleGuestLogin = async () => {
  if (isProcessing.value) return

  isProcessing.value = true
  loading.value = true

  try {
    // authStore를 통한 게스트 로그인
    const result = await authStore.loginAsGuest()

    if (result.success) {
      ElMessage.success('게스트로 입장합니다')
      router.push('/courses')
    } else {
      ElMessage.error(result.error || '게스트 입장에 실패했습니다')
    }

  } catch (err) {
    console.error('게스트 로그인 오류:', err)
    ElMessage.error('게스트 입장 중 오류가 발생했습니다')
  } finally {
    loading.value = false
    isProcessing.value = false
  }
}

// Google 로그인 처리
const handleGoogleLogin = async () => {
  if (isProcessing.value) return

  // 팝업 차단 확인
  const testPopup = window.open('', '', 'width=1,height=1')
  if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
    ElMessage.warning('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
    return
  }
  testPopup.close()

  isProcessing.value = true
  loading.value = true

  try {
    // authStore를 통한 Google 로그인 시도
    const result = await authStore.loginWithGoogle()

    if (result.success) {
      ElMessage.success('로그인되었습니다')
      router.push('/home')
    } else if (result.needsAdditionalInfo) {
      // 추가 정보 입력이 필요한 경우
      googleUserInfo.value = result.googleUserInfo
      showGoogleSignupModal.value = true
    } else {
      ElMessage.error(result.error || 'Google 로그인에 실패했습니다')
    }

  } catch (err) {
    console.error('Google 로그인 오류:', err)
    ElMessage.error('Google 로그인 중 오류가 발생했습니다')
  } finally {
    loading.value = false
    isProcessing.value = false
  }
}

// Google 회원가입 완료
const onGoogleSignupCompleted = () => {
  showGoogleSignupModal.value = false
  ElMessage.success('회원가입이 완료되었습니다')
  router.push('/home')
}

// QR 스캐너 열기
const openQRScanner = () => {
  router.push('/qr-scan')
}

// 비밀번호 찾기
const showForgotPassword = () => {
  ElMessage.info('비밀번호 찾기 기능은 준비 중입니다')
}

// 마운트/언마운트
onMounted(() => {
  // 로그인 상태 확인
  if (authStore.isAuthenticated) {
    router.push('/home')
  }

  // 이전 로그인 정보 복원
  if (localStorage.getItem('rememberMe') === 'true') {
    rememberMe.value = true
  }
})

onUnmounted(() => {
  if (popupCheckInterval) {
    clearInterval(popupCheckInterval)
  }
})
</script>

<style scoped>
/* =================== 메인 컨테이너 =================== */
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 배경 장식 */
.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  transform: rotate(30deg);
  pointer-events: none;
}

/* =================== 헤더 =================== */
.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
  z-index: 1;
}

.logo-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-6);
  box-shadow: var(--shadow-lg);
}

.title {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: white;
  margin: 0 0 var(--space-3) 0;
}

.subtitle {
  font-size: var(--text-lg);
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* =================== 로그인 폼 =================== */
.login-form {
  width: 100%;
  max-width: 420px;
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: 1;
}

.login-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-primary);
}

.tab {
  flex: 1;
  padding: var(--space-4);
  background: none;
  border: none;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.tab.active {
  color: var(--accent-primary);
  background: var(--bg-tertiary);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-primary);
}

.tab:hover {
  background: var(--bg-tertiary);
}

/* =================== 폼 컨텐츠 =================== */
.form-content {
  padding: var(--space-8);
}

.form-group {
  margin-bottom: var(--space-6);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: all var(--transition-fast);
  background: var(--bg-secondary);
}

.form-input.with-icon {
  padding-left: calc(var(--space-4) + 28px);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: var(--bg-tertiary);
  cursor: not-allowed;
}

/* =================== 에러 메시지 =================== */
.error-message {
  padding: var(--space-3) var(--space-4);
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-lg);
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-bottom: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* 에러 애니메이션 */
.error-enter-active,
.error-leave-active {
  transition: all 0.3s ease;
}

.error-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* =================== 버튼 =================== */
.submit-button {
  width: 100%;
  padding: var(--space-4);
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 48px;
}

.submit-button:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 로딩 스피너 */
.loading-spinner {
  animation: spin 1s linear infinite;
}

/* =================== 폼 옵션 =================== */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-4);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.remember-me input {
  cursor: pointer;
}

.forgot-link {
  font-size: var(--text-sm);
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: var(--font-medium);
}

.forgot-link:hover {
  text-decoration: underline;
}

/* =================== 소셜 로그인 =================== */
.social-login {
  margin-top: var(--space-6);
}

.divider-text {
  text-align: center;
  position: relative;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-5);
}

.divider-text::before,
.divider-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 50px);
  height: 1px;
  background: var(--border-primary);
}

.divider-text::before {
  left: 0;
}

.divider-text::after {
  right: 0;
}

.social-button {
  width: 100%;
  padding: var(--space-3);
  margin-bottom: var(--space-3);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.social-button:hover:not(:disabled) {
  border-color: var(--accent-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.social-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* =================== 회원가입 링크 =================== */
.signup-link {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-primary);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.signup-link a {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: var(--font-semibold);
}

.signup-link a:hover {
  text-decoration: underline;
}

/* =================== 게스트 폼 =================== */
.guest-form {
  text-align: center;
}

.guest-info {
  margin-bottom: var(--space-8);
}

.info-icon {
  display: inline-flex;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--color-primary-100) 0%, var(--color-primary-200) 100%);
  border-radius: var(--radius-2xl);
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-5);
  color: var(--accent-primary);
  box-shadow: var(--shadow-md);
}

.guest-info h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.guest-info p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* =================== 게스트 기능 목록 =================== */
.guest-features {
  background: var(--bg-tertiary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.feature {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  font-size: var(--text-base);
  color: var(--text-primary);
}

.feature:last-child {
  margin-bottom: 0;
}

.feature.disabled {
  color: var(--text-tertiary);
}

.feature .check {
  color: var(--color-success);
  flex-shrink: 0;
}

.feature .x {
  color: var(--color-error);
  flex-shrink: 0;
}

.guest-button {
  background: var(--color-success);
}

.guest-button:hover:not(:disabled) {
  background: #059669;
}

.guest-notice {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--color-warning-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

/* =================== QR 옵션 =================== */
.qr-option {
  width: 100%;
  max-width: 420px;
  margin-top: var(--space-6);
}

.divider {
  text-align: center;
  position: relative;
  margin-bottom: var(--space-4);
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.divider span {
  position: relative;
  padding: 0 var(--space-4);
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--text-sm);
}

.qr-button {
  width: 100%;
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

</style>