<template>
  <el-dialog
      v-model="visible"
      title="추가 정보 입력"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      class="google-signup-dialog"
  >
    <div class="google-signup-content">
      <!-- Google 계정 정보 표시 -->
      <div class="google-info">
        <div class="google-avatar">
          <img
              v-if="googleUserInfo?.photoURL"
              :src="googleUserInfo.photoURL"
              :alt="googleUserInfo.displayName"
          >
          <div v-else class="avatar-placeholder">
            {{ googleUserInfo?.displayName?.charAt(0) || 'G' }}
          </div>
        </div>
        <div class="google-details">
          <h3>{{ googleUserInfo?.displayName }}</h3>
          <p>{{ googleUserInfo?.email }}</p>
        </div>
      </div>

      <!-- 추가 정보 입력 폼 -->
      <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="100px"
          class="signup-form"
      >
        <!-- 프로필 사진 업로드 -->
        <el-form-item label="프로필 사진" prop="profilePhoto">
          <div class="photo-upload-container">
            <div class="photo-preview" @click="triggerFileInput">
              <img
                  v-if="photoPreview"
                  :src="photoPreview"
                  alt="프로필 사진"
              >
              <div v-else class="photo-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>사진 선택</span>
              </div>
            </div>
            <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handlePhotoChange"
                style="display: none"
            />
            <div class="photo-info">
              <p>수료증에 표시될 사진입니다</p>
              <p class="photo-requirements">JPG, PNG (최대 5MB)</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="생년월일" prop="birthDate">
          <el-date-picker
              v-model="formData.birthDate"
              type="date"
              placeholder="생년월일을 선택하세요"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="전화번호" prop="phoneNumber">
          <el-input
              v-model="formData.phoneNumber"
              placeholder="010-0000-0000"
              maxlength="13"
              @input="formatPhoneNumber"
          />
        </el-form-item>

        <el-form-item label="회사/소속" prop="company">
          <el-input
              v-model="formData.company"
              placeholder="회사명 또는 소속을 입력하세요"
          />
        </el-form-item>

        <el-form-item label="부서" prop="department">
          <el-input
              v-model="formData.department"
              placeholder="부서명을 입력하세요 (선택사항)"
          />
        </el-form-item>

        <el-form-item label="알림 설정" prop="notifications">
          <el-switch
              v-model="formData.notifications"
              active-text="교육 알림 받기"
              inactive-text="받지 않기"
          />
        </el-form-item>
      </el-form>

      <!-- 개인정보 동의 -->
      <div class="privacy-agreement">
        <el-checkbox v-model="formData.agreeToTerms">
          <span class="agreement-text">
            <a href="/terms" target="_blank" @click.stop>이용약관</a> 및
            <a href="/privacy" target="_blank" @click.stop>개인정보처리방침</a>에 동의합니다
          </span>
        </el-checkbox>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="loading">
          취소
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          가입 완료
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  googleUserInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'completed'])

const authStore = useAuthStore()
const formRef = ref()
const fileInput = ref()
const loading = ref(false)

// 사진 관련
const photoFile = ref(null)
const photoPreview = ref('')

// 다이얼로그 표시 상태
const visible = computed({
  get: () => props.show,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

// 폼 데이터
const formData = reactive({
  birthDate: '',
  phoneNumber: '',
  company: '',
  department: '',
  notifications: true,
  agreeToTerms: false
})

// 폼 유효성 검사 규칙
const rules = reactive({
  birthDate: [
    { required: true, message: '생년월일을 선택해주세요', trigger: 'change' }
  ],
  phoneNumber: [
    { required: true, message: '전화번호를 입력해주세요', trigger: 'blur' },
    {
      pattern: /^01[0-9]-[0-9]{4}-[0-9]{4}$/,
      message: '올바른 전화번호 형식이 아닙니다',
      trigger: 'blur'
    }
  ],
  company: [
    { required: true, message: '회사/소속을 입력해주세요', trigger: 'blur' }
  ]
})

// 생년월일 선택 제한 (미래 날짜 비활성화)
const disabledDate = (date) => {
  return date.getTime() > Date.now()
}

// 전화번호 자동 포맷팅
const formatPhoneNumber = (value) => {
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '')

  // 포맷팅
  if (numbers.length <= 3) {
    formData.phoneNumber = numbers
  } else if (numbers.length <= 7) {
    formData.phoneNumber = `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 11) {
    formData.phoneNumber = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }
}

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 사진 변경 처리
const handlePhotoChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 파일 크기 검증 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('파일 크기는 5MB를 초과할 수 없습니다')
    return
  }

  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    ElMessage.error('이미지 파일만 업로드 가능합니다')
    return
  }

  photoFile.value = file

  // 미리보기 생성
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// 폼 제출
const handleSubmit = async () => {
  // 폼 유효성 검사
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 개인정보 동의 확인
  if (!formData.agreeToTerms) {
    ElMessage.warning('이용약관 및 개인정보처리방침에 동의해주세요')
    return
  }

  loading.value = true

  try {
    // 1. Google 사용자 추가 정보 업데이트
    const profileResult = await authStore.completeGoogleProfile(props.googleUserInfo.uid, {
      birthDate: formData.birthDate,
      phoneNumber: formData.phoneNumber,
      company: formData.company,
      department: formData.department || null,
      preferences: {
        language: 'ko',
        notifications: formData.notifications
      }
    })

    if (!profileResult.success) {
      throw new Error(profileResult.error || '프로필 업데이트 실패')
    }

    // 2. 프로필 사진 업로드 (선택한 경우)
    if (photoFile.value) {
      const photoResult = await authStore.uploadProfilePhoto(photoFile.value)
      if (!photoResult.success) {
        ElMessage.warning('프로필 사진 업로드에 실패했지만 회원가입은 완료되었습니다')
      }
    } else if (props.googleUserInfo.photoURL) {
      // Google 프로필 사진을 기본으로 사용하는 경우
      await authStore.updateProfile({
        photoURL: props.googleUserInfo.photoURL
      })
    }

    ElMessage.success('회원가입이 완료되었습니다!')
    emit('completed')
  } catch (error) {
    console.error('회원가입 오류:', error)
    ElMessage.error(error.message || '회원가입 중 오류가 발생했습니다')
  } finally {
    loading.value = false
  }
}

// 취소
const handleCancel = async () => {
  // Google 로그인 취소 시 로그아웃 처리
  await authStore.logout()
  emit('close')
}

// props 변경 감지하여 폼 초기화
watch(() => props.show, (newVal) => {
  if (newVal) {
    // 폼 초기화
    Object.assign(formData, {
      birthDate: '',
      phoneNumber: '',
      company: '',
      department: '',
      notifications: true,
      agreeToTerms: false
    })

    // 사진 초기화
    photoFile.value = null
    photoPreview.value = props.googleUserInfo.photoURL || ''

    // 유효성 검사 초기화
    formRef.value?.resetFields()
  }
})
</script>

<style scoped>
.google-signup-dialog {
  --el-dialog-padding-primary: 20px;
}

.google-signup-content {
  padding: 0;
}

/* Google 계정 정보 표시 */
.google-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 24px;
}

.google-avatar {
  flex-shrink: 0;
}

.google-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.google-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.google-details p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

/* 폼 스타일 */
.signup-form {
  margin-top: 20px;
}

.signup-form :deep(.el-form-item__label) {
  font-weight: 500;
}

/* 프로필 사진 업로드 */
.photo-upload-container {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.photo-preview {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 2px dashed #e0e0e0;
  transition: all 0.3s;
  flex-shrink: 0;
}

.photo-preview:hover {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  gap: 8px;
}

.photo-placeholder span {
  font-size: 12px;
}

.photo-info {
  flex: 1;
}

.photo-info p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #606266;
}

.photo-requirements {
  font-size: 12px;
  color: #909399;
}

/* 개인정보 동의 */
.privacy-agreement {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.agreement-text {
  font-size: 14px;
  color: #606266;
}

.agreement-text a {
  color: #667eea;
  text-decoration: none;
}

.agreement-text a:hover {
  text-decoration: underline;
}

/* 다이얼로그 푸터 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  :deep(.el-dialog) {
    width: 90% !important;
  }

  .google-info {
    flex-direction: column;
    text-align: center;
  }

  .photo-upload-container {
    flex-direction: column;
    align-items: center;
  }

  .photo-info {
    text-align: center;
  }

  .signup-form {
    :deep(.el-form-item) {
      margin-bottom: 18px;
    }

    :deep(.el-form-item__label) {
      width: 80px !important;
    }
  }
}
</style>