<template>
  <div class="register-container">
    <!-- 헤더 -->
    <div class="register-header">
      <div class="logo-wrapper">
        <div class="logo">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <h1 class="title">회원가입</h1>
      <p class="subtitle">안전교육 플랫폼에 오신 것을 환영합니다</p>
    </div>

    <!-- 회원가입 폼 -->
    <div class="register-form">
      <form @submit.prevent="handleRegister">
        <!-- 프로필 사진 -->
        <div class="profile-photo-section">
          <div class="photo-wrapper">
            <div class="photo-preview" @click="selectPhoto">
              <img v-if="photoPreview" :src="photoPreview" alt="프로필 사진" />
              <div v-else class="photo-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2"/>
                  <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>사진 추가</span>
              </div>
            </div>
            <input
                ref="photoInput"
                type="file"
                accept="image/*"
                @change="handlePhotoChange"
                style="display: none"
            />
          </div>
          <p class="photo-hint">프로필 사진 (선택사항)</p>
        </div>

        <!-- 이름 -->
        <div class="form-group">
          <label for="displayName">이름 *</label>
          <input
              id="displayName"
              v-model="displayName"
              type="text"
              placeholder="홍길동"
              required
              :disabled="loading"
              class="form-input"
          />
        </div>

        <!-- 이메일 -->
        <div class="form-group">
          <label for="email">이메일 *</label>
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

        <!-- 생년월일 -->
        <div class="form-group">
          <label for="birthDate">생년월일 *</label>
          <input
              id="birthDate"
              v-model="birthDate"
              type="date"
              required
              :disabled="loading"
              :max="maxDate"
              class="form-input"
          />
          <p class="form-hint">만 14세 이상만 가입 가능합니다</p>
        </div>

        <!-- 비밀번호 -->
        <div class="form-group">
          <label for="password">비밀번호 *</label>
          <input
              id="password"
              v-model="password"
              type="password"
              placeholder="6자 이상"
              required
              :disabled="loading"
              class="form-input"
              @input="checkPasswordStrength"
          />
          <div v-if="password" class="password-strength">
            <div class="strength-bar">
              <div
                  class="strength-fill"
                  :class="passwordStrength.class"
                  :style="{width: passwordStrength.percentage + '%'}"
              ></div>
            </div>
            <span class="strength-text" :class="passwordStrength.class">
              {{ passwordStrength.text }}
            </span>
          </div>
        </div>

        <!-- 비밀번호 확인 -->
        <div class="form-group">
          <label for="passwordConfirm">비밀번호 확인 *</label>
          <input
              id="passwordConfirm"
              v-model="passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              required
              :disabled="loading"
              class="form-input"
          />
          <p v-if="passwordConfirm && password !== passwordConfirm" class="error-text">
            비밀번호가 일치하지 않습니다
          </p>
        </div>

        <!-- 약관 동의 -->
        <div class="terms-section">
          <label class="checkbox-label">
            <input
                v-model="agreeTerms"
                type="checkbox"
                required
            />
            <span>
              <a href="#" @click.prevent="showTerms">이용약관</a> 및
              <a href="#" @click.prevent="showPrivacy">개인정보처리방침</a>에 동의합니다
            </span>
          </label>
        </div>

        <!-- 에러 메시지 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- 가입 버튼 -->
        <button
            type="submit"
            class="submit-button"
            :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>

        <!-- 로그인 링크 -->
        <div class="login-link">
          이미 계정이 있으신가요?
          <router-link to="/login">로그인</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 폼 데이터
const displayName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const birthDate = ref('')
const agreeTerms = ref(false)
const loading = ref(false)
const error = ref('')

// 프로필 사진
const photoInput = ref(null)
const photoFile = ref(null)
const photoPreview = ref('')

// 생년월일 최대값 (14세 이상)
const maxDate = computed(() => {
  const today = new Date()
  const minAge = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate())
  return minAge.toISOString().split('T')[0]
})

// 비밀번호 강도
const passwordStrength = ref({
  percentage: 0,
  text: '',
  class: ''
})

// 폼 유효성 검사
const isFormValid = computed(() => {
  return displayName.value &&
      email.value &&
      password.value.length >= 6 &&
      password.value === passwordConfirm.value &&
      birthDate.value &&
      agreeTerms.value
})

// 프로필 사진 선택
const selectPhoto = () => {
  photoInput.value?.click()
}

// 사진 변경 처리
const handlePhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('파일 크기는 5MB 이하여야 합니다')
      return
    }

    photoFile.value = file

    // 미리보기
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 비밀번호 강도 체크
const checkPasswordStrength = () => {
  const pwd = password.value
  let strength = 0

  // 길이
  if (pwd.length >= 8) strength += 25
  if (pwd.length >= 12) strength += 25

  // 복잡도
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25
  if (/[0-9]/.test(pwd)) strength += 12.5
  if (/[^a-zA-Z0-9]/.test(pwd)) strength += 12.5

  // 결과 설정
  if (strength < 30) {
    passwordStrength.value = {
      percentage: 30,
      text: '약함',
      class: 'weak'
    }
  } else if (strength < 60) {
    passwordStrength.value = {
      percentage: 60,
      text: '보통',
      class: 'medium'
    }
  } else {
    passwordStrength.value = {
      percentage: 100,
      text: '강함',
      class: 'strong'
    }
  }
}

// 회원가입 처리
const handleRegister = async () => {
  error.value = ''
  loading.value = true

  try {
    // 비밀번호 확인
    if (password.value !== passwordConfirm.value) {
      throw new Error('비밀번호가 일치하지 않습니다')
    }

    // 회원가입 (생년월일 포함)
    const result = await authStore.register(
        email.value,
        password.value,
        displayName.value,
        birthDate.value,
        router
    )

    if (result.success) {
      // 프로필 사진 업로드 (선택사항)
      if (photoFile.value) {
        try {
          await authStore.uploadProfilePhoto(photoFile.value)
        } catch (photoError) {
          console.error('사진 업로드 실패:', photoError)
          // 사진 업로드 실패해도 회원가입은 성공
        }
      }

      ElMessage.success('회원가입이 완료되었습니다!')

      // 홈으로 이동은 authStore에서 처리
    } else {
      error.value = result.error
    }

  } catch (err) {
    console.error('회원가입 오류:', err)
    error.value = err.message || '회원가입 중 오류가 발생했습니다'
  } finally {
    loading.value = false
  }
}

// 약관 보기
const showTerms = () => {
  ElMessage.info('이용약관 페이지는 준비 중입니다')
}

const showPrivacy = () => {
  ElMessage.info('개인정보처리방침 페이지는 준비 중입니다')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 헤더 스타일 */
.register-header {
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

/* 폼 스타일 */
.register-form {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

/* 프로필 사진 섹션 */
.profile-photo-section {
  text-align: center;
  margin-bottom: 30px;
}

.photo-wrapper {
  display: inline-block;
}

.photo-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 3px solid #e0e0e0;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.photo-preview:hover {
  border-color: #667eea;
  transform: scale(1.05);
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
}

.photo-placeholder span {
  font-size: 12px;
}

.photo-hint {
  margin-top: 10px;
  font-size: 13px;
  color: #666;
}

/* 폼 그룹 */
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

/* 비밀번호 강도 표시 */
.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
}

.strength-fill.weak {
  background: #f44336;
}

.strength-fill.medium {
  background: #ff9800;
}

.strength-fill.strong {
  background: #4caf50;
}

.strength-text {
  font-size: 12px;
}

.strength-text.weak {
  color: #f44336;
}

.strength-text.medium {
  color: #ff9800;
}

.strength-text.strong {
  color: #4caf50;
}

/* 폼 힌트 */
.form-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 에러 텍스트 */
.error-text {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}

/* 약관 섹션 */
.terms-section {
  margin: 24px 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.checkbox-label input {
  margin-top: 2px;
  cursor: pointer;
}

.checkbox-label a {
  color: #667eea;
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
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

/* 로그인 링크 */
.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .register-container {
    padding: 16px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
  }

  .register-form {
    padding: 30px 20px;
  }
}
</style>