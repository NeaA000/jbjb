<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h2>비밀번호 변경</h2>
        <button @click="handleClose" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="password-form">
        <div class="form-group">
          <label for="currentPassword">현재 비밀번호</label>
          <input
              id="currentPassword"
              v-model="formData.currentPassword"
              type="password"
              class="form-input"
              required
              :disabled="isSubmitting"
          >
        </div>

        <div class="form-group">
          <label for="newPassword">새 비밀번호</label>
          <input
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              class="form-input"
              required
              minlength="6"
              :disabled="isSubmitting"
          >
          <span class="field-help">최소 6자 이상 입력해주세요.</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword">새 비밀번호 확인</label>
          <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              class="form-input"
              required
              :disabled="isSubmitting"
          >
          <span v-if="passwordMismatch" class="field-error">
            비밀번호가 일치하지 않습니다.
          </span>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="handleClose" class="btn btn-outline">
            취소
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting || passwordMismatch">
            {{ isSubmitting ? '변경 중...' : '비밀번호 변경' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { authService } from '@/services/firebase'

const emit = defineEmits(['close', 'success'])

const formData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const passwordMismatch = computed(() => {
  return formData.value.newPassword &&
      formData.value.confirmPassword &&
      formData.value.newPassword !== formData.value.confirmPassword
})

const handleSubmit = async () => {
  if (passwordMismatch.value) return

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    await authService.updateUserPassword(
        formData.value.currentPassword,
        formData.value.newPassword
    )

    emit('success')
  } catch (error) {
    console.error('비밀번호 변경 오류:', error)

    if (error.code === 'auth/wrong-password') {
      errorMessage.value = '현재 비밀번호가 올바르지 않습니다.'
    } else if (error.code === 'auth/weak-password') {
      errorMessage.value = '새 비밀번호가 너무 약합니다.'
    } else {
      errorMessage.value = '비밀번호 변경에 실패했습니다. 다시 시도해주세요.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.password-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.field-help {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
  display: block;
}

.field-error {
  font-size: 0.875rem;
  color: #f44336;
  margin-top: 0.25rem;
  display: block;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-outline {
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  background-color: #f5f5f5;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>