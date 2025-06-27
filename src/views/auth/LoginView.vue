<template>
  <div class="login-container">
    <!-- 로고 및 타이틀 -->
    <div class="login-header">
      <div class="logo-wrapper">
        <div class="logo">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <h1 class="title">안전교육 플랫폼</h1>
      <p class="subtitle">안전한 작업 환경을 위한 온라인 교육</p>
    </div>

    <!-- 로그인 폼 -->
    <div class="login-form">
      <!-- 로그인 방식 선택 탭 -->
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
        <div class="form-group">
          <label for="email">이메일</label>
          <input
              id="email"
              v-model="email"
              type="email"
              placeholder="example@email.com"
              required
              :disabled="loading"
              class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input
              id="password"
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              required
              :disabled="loading"
              class="form-input"
          />
        </div>

        <!-- 에러 메시지 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- 로그인 버튼 -->
        <button type="submit" class="submit-button" :disabled="loading || isProcessing">
          <span v-if="loading" class="loading-spinner"></span>
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
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 로그인
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
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>게스트로 입장하기</h3>
          <p>회원가입 없이 바로 교육을 시작할 수 있습니다</p>
        </div>

        <div class="guest-features">
          <div class="feature">
            <span class="check">✓</span>
            <span>모든 강의 시청 가능</span>
          </div>
          <div class="feature">
            <span class="check">✓</span>
            <span>QR 코드로 빠른 접속</span>
          </div>
          <div class="feature disabled">
            <span class="x">✗</span>
            <span>진도 저장 불가</span>
          </div>
          <div class="feature disabled">
            <span class="x">✗</span>
            <span>수료증 발급 불가</span>
          </div>
        </div>

        <button
            @click="handleGuestLogin"
            class="submit-button guest-button"
            :disabled="loading || isProcessing"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '입장 중...' : '게스트로 입장' }}
        </button>

        <div class="guest-notice">
          💡 수료증이 필요하신 경우 회원가입을 해주세요
        </div>
      </div>
    </div>

    <!-- QR 코드 스캔 옵션 -->
    <div class="qr-option">
      <div class="divider">
        <span>또는</span>
      </div>
      <button @click="openQRScanner" class="qr-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 7V5C3 3.89543 3.89543 3 5 3H7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M21 17V19C21 20.1046 20.1046 21 19 21H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
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
  error.value = ''

  try {
    const result = await authStore.loginWithGoogle()

    if (result.success) {
      // 프로필이 완성되지 않은 신규 사용자인 경우
      if (!result.user?.profileCompleted) {
        googleUserInfo.value = result.user
        showGoogleSignupModal.value = true
        ElMessage.info('추가 정보를 입력해주세요')
      } else {
        // 기존 사용자는 바로 홈으로
        ElMessage.success('Google 계정으로 로그인되었습니다')
        router.push('/home')
      }
    } else {
      error.value = result.error || 'Google 로그인에 실패했습니다'
    }

  } catch (err) {
    console.error('Google 로그인 오류:', err)
    error.value = 'Google 로그인 중 오류가 발생했습니다'
  } finally {
    loading.value = false
    isProcessing.value = false
  }
}

// Google 추가 정보 입력 완료
const onGoogleSignupCompleted = () => {
  showGoogleSignupModal.value = false
  router.push('/home')
}

// QR 스캐너 열기
const openQRScanner = () => {
  // 하이브리드 앱인 경우 네이티브 스캐너 호출
  if (window.AndroidBridge?.openQRScanner) {
    window.AndroidBridge.openQRScanner()
  } else {
    // 웹인 경우 QR 스캔 페이지로 이동
    router.push('/qr-scan')
  }
}

// 비밀번호 찾기
const showForgotPassword = () => {
  router.push('/forgot-password')
}

// 자동 로그인 체크
onMounted(() => {
  // 이미 로그인된 경우 홈으로 리다이렉트
  if (authStore.isLoggedIn && !authStore.isGuest) {
    router.push('/home')
    return
  }

  // 저장된 로그인 정보 확인
  if (localStorage.getItem('rememberMe') === 'true') {
    rememberMe.value = true
  }

  // URL 파라미터에서 에러 메시지 확인
  const urlError = router.currentRoute.value.query.error
  if (urlError) {
    error.value = decodeURIComponent(urlError)
  }
})

// 컴포넌트 언마운트 시 정리
onUnmounted(() => {
  if (popupCheckInterval) {
    clearInterval(popupCheckInterval)
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 헤더 스타일 */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  display: inline-flex;
  margin-bottom: 20px;
}

.logo {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  color: #667eea;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

/* 로그인 폼 스타일 */
.login-form {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab.active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
}

.tab:hover {
  background: #f5f5f5;
}

/* 폼 컨텐츠 스타일 */
.form-content {
  padding: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* 에러 메시지 */
.error-message {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
  margin-bottom: 20px;
}

/* 버튼 스타일 */
.submit-button {
  width: 100%;
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-button:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 로딩 스피너 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 폼 옵션 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.remember-me input {
  cursor: pointer;
}

.forgot-link {
  font-size: 14px;
  color: #667eea;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* 회원가입 링크 */
.signup-link {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
  font-size: 14px;
  color: #666;
}

.signup-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.signup-link a:hover {
  text-decoration: underline;
}

/* 소셜 로그인 스타일 */
.social-login {
  margin-top: 24px;
}

.divider-text {
  text-align: center;
  position: relative;
  color: #999;
  font-size: 13px;
  margin-bottom: 20px;
}

.divider-text::before,
.divider-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 50px);
  height: 1px;
  background: #e0e0e0;
}

.divider-text::before {
  left: 0;
}

.divider-text::after {
  right: 0;
}

.social-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.social-button:hover:not(:disabled) {
  border-color: #999;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.social-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-button {
  color: #333;
}

.google-button:hover:not(:disabled) {
  border-color: #4285F4;
}

/* 게스트 폼 스타일 */
.guest-form {
  text-align: center;
}

.guest-info {
  margin-bottom: 30px;
}

.info-icon {
  display: inline-flex;
  width: 80px;
  height: 80px;
  background: #f0f4ff;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #667eea;
}

.guest-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.guest-info p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 게스트 기능 목록 */
.guest-features {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.feature:last-child {
  margin-bottom: 0;
}

.feature.disabled {
  color: #999;
}

.feature .check {
  color: #4caf50;
  font-weight: bold;
}

.feature .x {
  color: #f44336;
  font-weight: bold;
}

.guest-button {
  background: #4caf50;
}

.guest-button:hover:not(:disabled) {
  background: #43a047;
}

.guest-notice {
  font-size: 13px;
  color: #666;
  margin-top: 16px;
  padding: 12px;
  background: #fff8e1;
  border-radius: 8px;
}

/* QR 옵션 */
.qr-option {
  width: 100%;
  max-width: 400px;
  margin-top: 24px;
}

.divider {
  text-align: center;
  position: relative;
  margin-bottom: 16px;
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
  padding: 0 16px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.qr-button {
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.qr-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
  }

  .login-form {
    max-width: 100%;
  }

  .form-content {
    padding: 20px;
  }
}
</style>