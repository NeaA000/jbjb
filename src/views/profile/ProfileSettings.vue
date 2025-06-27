<template>
  <div class="profile-settings-container">
    <!-- 헤더 -->
    <div class="settings-header">
      <h1>프로필 설정</h1>
      <p>프로필 정보를 관리하고 수정할 수 있습니다.</p>
    </div>

    <!-- 프로필 사진 섹션 -->
    <div class="settings-section">
      <h2>프로필 사진</h2>
      <div class="profile-photo-section">
        <div class="current-photo">
          <img
              :src="currentPhotoURL || defaultAvatar"
              :alt="displayName"
              class="profile-avatar"
          >
          <div class="photo-source" v-if="photoSource">
            <i :class="sourceIcon"></i>
            {{ photoSource }}에서 가져온 사진
          </div>
        </div>

        <div class="photo-actions">
          <input
              ref="photoInput"
              type="file"
              accept="image/*"
              @change="handlePhotoChange"
              style="display: none"
          >
          <button @click="$refs.photoInput.click()" class="btn btn-primary">
            사진 변경
          </button>
          <button
              v-if="currentPhotoURL && !isProviderPhoto"
              @click="removePhoto"
              class="btn btn-outline"
          >
            사진 삭제
          </button>
        </div>
      </div>
    </div>

    <!-- 기본 정보 섹션 -->
    <div class="settings-section">
      <h2>기본 정보</h2>
      <form @submit.prevent="updateBasicInfo">
        <div class="form-group">
          <label for="displayName">이름</label>
          <input
              id="displayName"
              v-model="formData.displayName"
              type="text"
              class="form-input"
              required
          >
        </div>

        <div class="form-group">
          <label for="email">이메일</label>
          <div class="email-field">
            <input
                id="email"
                v-model="formData.email"
                type="email"
                class="form-input"
                :disabled="provider !== 'email'"
            >
            <span v-if="provider !== 'email'" class="field-note">
              {{ provider }} 로그인은 이메일을 변경할 수 없습니다.
            </span>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="isUpdating">
          {{ isUpdating ? '저장 중...' : '기본 정보 저장' }}
        </button>
      </form>
    </div>

    <!-- 추가 정보 섹션 -->
    <div class="settings-section">
      <h2>추가 정보</h2>
      <form @submit.prevent="updateAdditionalInfo">
        <div class="form-group">
          <label for="bio">자기소개</label>
          <textarea
              id="bio"
              v-model="formData.bio"
              class="form-textarea"
              rows="4"
              placeholder="간단한 자기소개를 작성해주세요."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="location">위치</label>
          <input
              id="location"
              v-model="formData.location"
              type="text"
              class="form-input"
              placeholder="예: 서울, 대한민국"
          >
        </div>

        <div class="form-group">
          <label for="website">웹사이트</label>
          <input
              id="website"
              v-model="formData.website"
              type="url"
              class="form-input"
              placeholder="https://example.com"
          >
        </div>

        <div class="form-group">
          <label for="interests">관심사</label>
          <input
              id="interests"
              v-model="interestsInput"
              type="text"
              class="form-input"
              placeholder="쉼표로 구분하여 입력 (예: 프로그래밍, 디자인, 음악)"
          >
        </div>

        <button type="submit" class="btn btn-primary" :disabled="isUpdating">
          {{ isUpdating ? '저장 중...' : '추가 정보 저장' }}
        </button>
      </form>
    </div>

    <!-- 보안 설정 섹션 (이메일 로그인만) -->
    <div v-if="provider === 'email'" class="settings-section">
      <h2>보안 설정</h2>
      <div class="security-actions">
        <button @click="showPasswordModal = true" class="btn btn-outline">
          비밀번호 변경
        </button>
      </div>
    </div>

    <!-- 비밀번호 변경 모달 -->
    <PasswordChangeModal
        v-if="showPasswordModal"
        @close="showPasswordModal = false"
        @success="handlePasswordChangeSuccess"
    />

    <!-- 토스트 메시지 -->
    <Toast
        v-if="toast.show"
        :type="toast.type"
        :message="toast.message"
        @close="toast.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authService, firestoreService, storageService } from '@/services/firebase'
import PasswordChangeModal from '@/components/profile/PasswordChangeModal.vue'
import Toast from '@/components/common/Toast.vue'
import defaultAvatar from '@/assets/images/default-avatar.png'

const authStore = useAuthStore()

// 상태
const formData = ref({
  displayName: '',
  email: '',
  bio: '',
  location: '',
  website: '',
  interests: []
})

const interestsInput = ref('')
const currentPhotoURL = ref('')
const isUpdating = ref(false)
const showPasswordModal = ref(false)
const toast = ref({
  show: false,
  type: 'success',
  message: ''
})

// 계산된 속성
const displayName = computed(() => authStore.displayName)
const provider = computed(() => authStore.provider)
const isProviderPhoto = computed(() => {
  return currentPhotoURL.value &&
      (currentPhotoURL.value.includes('googleusercontent.com') ||
          currentPhotoURL.value.includes('github.com'))
})

const photoSource = computed(() => {
  if (!currentPhotoURL.value) return null
  if (currentPhotoURL.value.includes('googleusercontent.com')) return 'Google'
  if (currentPhotoURL.value.includes('github.com')) return 'GitHub'
  return null
})

const sourceIcon = computed(() => {
  if (photoSource.value === 'Google') return 'fab fa-google'
  if (photoSource.value === 'GitHub') return 'fab fa-github'
  return ''
})

// 메서드
const loadProfile = async () => {
  try {
    const profile = await firestoreService.getFullProfile(authStore.userId)

    formData.value = {
      displayName: profile.displayName || '',
      email: profile.email || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      interests: profile.interests || []
    }

    currentPhotoURL.value = profile.photoURL || ''
    interestsInput.value = (profile.interests || []).join(', ')
  } catch (error) {
    console.error('프로필 로드 오류:', error)
    showToast('프로필을 불러오는 데 실패했습니다.', 'error')
  }
}

const handlePhotoChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isUpdating.value = true
    const photoURL = await storageService.uploadProfilePhoto(authStore.userId, file)
    await authService.updateAuthProfile(formData.value.displayName, photoURL)
    currentPhotoURL.value = photoURL
    showToast('프로필 사진이 변경되었습니다.')
  } catch (error) {
    console.error('사진 업로드 오류:', error)
    showToast(error.message || '사진 업로드에 실패했습니다.', 'error')
  } finally {
    isUpdating.value = false
  }
}

const removePhoto = async () => {
  if (!confirm('프로필 사진을 삭제하시겠습니까?')) return

  try {
    isUpdating.value = true
    await storageService.deleteProfilePhoto(authStore.userId)
    await authService.updateAuthProfile(formData.value.displayName, null)
    currentPhotoURL.value = ''
    showToast('프로필 사진이 삭제되었습니다.')
  } catch (error) {
    console.error('사진 삭제 오류:', error)
    showToast('사진 삭제에 실패했습니다.', 'error')
  } finally {
    isUpdating.value = false
  }
}

const updateBasicInfo = async () => {
  try {
    isUpdating.value = true

    // 이름 업데이트
    await authService.updateAuthProfile(formData.value.displayName)

    // 이메일 업데이트 (변경된 경우)
    if (provider.value === 'email' && formData.value.email !== authStore.email) {
      // 이메일 변경은 별도 처리 필요 (비밀번호 재확인 등)
      showToast('이메일 변경은 추가 인증이 필요합니다.', 'info')
    }

    showToast('기본 정보가 저장되었습니다.')
  } catch (error) {
    console.error('기본 정보 업데이트 오류:', error)
    showToast('정보 저장에 실패했습니다.', 'error')
  } finally {
    isUpdating.value = false
  }
}

const updateAdditionalInfo = async () => {
  try {
    isUpdating.value = true

    // 관심사 처리
    const interests = interestsInput.value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)

    const additionalData = {
      bio: formData.value.bio,
      location: formData.value.location,
      website: formData.value.website,
      interests
    }

    await firestoreService.updateProfileAdditionalInfo(authStore.userId, additionalData)
    showToast('추가 정보가 저장되었습니다.')
  } catch (error) {
    console.error('추가 정보 업데이트 오류:', error)
    showToast('정보 저장에 실패했습니다.', 'error')
  } finally {
    isUpdating.value = false
  }
}

const handlePasswordChangeSuccess = () => {
  showPasswordModal.value = false
  showToast('비밀번호가 변경되었습니다.')
}

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    type,
    message
  }
}

// 생명주기
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-header {
  margin-bottom: 3rem;
}

.settings-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.settings-header p {
  color: #666;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.settings-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

/* 프로필 사진 섹션 */
.profile-photo-section {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
}

.current-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f0f0;
}

.photo-source {
  font-size: 0.875rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.photo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 폼 스타일 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.email-field {
  position: relative;
}

.field-note {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
  display: block;
}

/* 버튼 스타일 */
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

.security-actions {
  display: flex;
  gap: 1rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .profile-settings-container {
    padding: 1rem;
  }

  .settings-section {
    padding: 1.5rem;
  }

  .profile-photo-section {
    flex-direction: column;
    align-items: center;
  }
}
</style>