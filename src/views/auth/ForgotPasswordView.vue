<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <!-- 헤더 -->
      <div class="card-header">
        <router-link to="/login" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          돌아가기
        </router-link>

        <div class="header-content">
          <div class="icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 13C20 18 12 22 12 22C12 22 4 18 4 13V7L12 2L20 7V13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 11V13M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>비밀번호 찾기</h1>
          <p>가입하신 이메일 주소를 입력하시면<br>비밀번호 재설정 링크를 보내드립니다.</p>
        </div>
      </div>

      <!-- 폼 -->
      <form @submit.prevent="handleSubmit" class="forgot-password-form">
        <div class="form-group">
          <label for="email">이메일 주소</label>
          <input
              id="email"
              v-model="email"
              type="email"
              placeholder="example@email.com"
              required
              :disabled="loading || sent"
              class="form-input"
          />
        </div>

        <!-- 에러 메시지 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- 성공 메시지 -->
        <div v-if="sent" class="success-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div>
            <strong>이메일을 확인해주세요!</strong>
            <p>{{ email }}로 비밀번호 재설정 링크를 보냈습니다.</p>
          </div>
        </div>

        <!-- 제출 버튼 -->
        <button
            type="submit"
            class="submit-button"
            :disabled="loading || sent"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ buttonText }}
        </button>

        <!-- 추가 안내 -->
        <div v-if="sent" class="additional-info">
          <p>이메일을 받지 못하셨나요?</p>
          <button
              type="button"
              @click="resendEmail"
              class="resend-button"
              :disabled="resendCooldown > 0"
          >
            {{ resendCooldown > 0 ? `${resendCooldown}초 후 재전송 가능` : '다시 보내기' }}
          </button>
        </div>

        <div class="help-text">
          <p>이메일이 기억나지 않으시나요?</p>
          <a href="mailto:support@safeedu.com">고객센터에 문의하기</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 상태 관리
const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)
const resendCooldown = ref(0)
let cooldownInterval = null

// 버튼 텍스트
const buttonText = computed(() => {
  if (loading.value) return '전송 중...'
  if (sent.value) return '이메일 전송됨'
  return '재설정 링크 보내기'
})

// 폼 제출 처리
const handleSubmit = async () => {
  if (sent.value) return

  error.value = ''
  loading.value = true

  try {
    const result = await authStore.sendPasswordResetEmail(email.value)

    if (result.success) {
      sent.value = true
      startResendCooldown()
      ElMessage.success('비밀번호 재설정 이메일을 전송했습니다')
    } else {
      error.value = result.error
    }
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err)
    error.value = '이메일 전송 중 오류가 발생했습니다'
  } finally {
    loading.value = false
  }
}

// 재전송 쿨다운 시작
const startResendCooldown = () => {
  resendCooldown.value = 60 // 60초 쿨다운

  cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

// 이메일 재전송
const resendEmail = async () => {
  if (resendCooldown.value > 0) return

  loading.value = true
  error.value = ''

  try {
    const result = await authStore.sendPasswordResetEmail(email.value)

    if (result.success) {
      startResendCooldown()
      ElMessage.success('이메일을 다시 전송했습니다')
    } else {
      error.value = result.error
    }
  } catch (err) {
    console.error('이메일 재전송 오류:', err)
    error.value = '이메일 전송 중 오류가 발생했습니다'
  } finally {
    loading.value = false
  }
}

// 컴포넌트 언마운트 시 인터벌 정리
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.forgot-password-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 카드 헤더 */
.card-header {
  padding: 30px 30px 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 24px;
  transition: color 0.3s;
}

.back-button:hover {
  color: #667eea;
}

.header-content {
  text-align: center;
}

.icon-wrapper {
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

.header-content h1 {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 12px 0;
}

.header-content p {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

/* 폼 스타일 */
.forgot-password-form {
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
  color: #303133;
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

/* 메시지 스타일 */
.error-message {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
  margin-bottom: 20px;
}

.success-message {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.success-message svg {
  flex-shrink: 0;
  color: #0ea5e9;
}

.success-message strong {
  display: block;
  font-size: 15px;
  color: #0c4a6e;
  margin-bottom: 4px;
}

.success-message p {
  margin: 0;
  font-size: 14px;
  color: #0c4a6e;
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

/* 추가 정보 */
.additional-info {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.additional-info p {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
}

.resend-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.resend-button:hover:not(:disabled) {
  background: #f0f4ff;
}

.resend-button:disabled {
  color: #909399;
  cursor: not-allowed;
}

/* 도움말 텍스트 */
.help-text {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.help-text p {
  font-size: 14px;
  color: #606266;
  margin: 0 0 8px 0;
}

.help-text a {
  font-size: 14px;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.help-text a:hover {
  text-decoration: underline;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .forgot-password-container {
    padding: 16px;
  }

  .forgot-password-card {
    max-width: 100%;
  }

  .card-header,
  .forgot-password-form {
    padding: 20px;
  }

  .header-content h1 {
    font-size: 20px;
  }
}
</style>