<template>
  <div class="profile-settings-container">
    <!-- 헤더 -->
    <div class="settings-header">
      <button @click="goBack" class="back-button">
        <ChevronLeft :size="24" />
      </button>
      <div class="header-content">
        <h1>프로필 설정</h1>
        <p>프로필 정보를 관리하고 수정할 수 있습니다</p>
      </div>
    </div>

    <!-- 프로필 사진 섹션 -->
    <div class="settings-section">
      <div class="section-header">
        <Camera :size="20" class="section-icon" />
        <h2>프로필 사진</h2>
      </div>
      <div class="profile-photo-section">
        <div class="current-photo">
          <img
              :src="currentPhotoURL || defaultAvatar"
              :alt="displayName"
              class="profile-avatar"
              @error="handleImageError"
          >
          <div class="photo-overlay">
            <Camera :size="24" />
          </div>
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
            <Upload :size="18" />
            사진 변경
          </button>
          <button
              v-if="currentPhotoURL && !isProviderPhoto"
              @click="removePhoto"
              class="btn btn-outline"
          >
            <Trash2 :size="18" />
            사진 삭제
          </button>
        </div>
      </div>
    </div>

    <!-- 기본 정보 섹션 -->
    <div class="settings-section">
      <div class="section-header">
        <User :size="20" class="section-icon" />
        <h2>기본 정보</h2>
      </div>
      <form @submit.prevent="updateBasicInfo">
        <div class="form-group">
          <label for="displayName">
            <User :size="16" />
            이름
          </label>
          <input
              id="displayName"
              v-model="formData.displayName"
              type="text"
              class="form-input"
              placeholder="이름을 입력하세요"
              required
          >
        </div>

        <div class="form-group">
          <label for="email">
            <Mail :size="16" />
            이메일
          </label>
          <div class="email-field">
            <input
                id="email"
                v-model="formData.email"
                type="email"
                class="form-input"
                :disabled="provider !== 'email'"
                placeholder="이메일 주소"
            >
            <span v-if="provider !== 'email'" class="field-note">
              <Info :size="14" />
              {{ provider }} 로그인은 이메일을 변경할 수 없습니다
            </span>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-submit" :disabled="isUpdating">
          <Save :size="18" v-if="!isUpdating" />
          <Loader :size="18" v-else class="spin" />
          {{ isUpdating ? '저장 중...' : '기본 정보 저장' }}
        </button>
      </form>
    </div>

    <!-- 추가 정보 섹션 -->
    <div class="settings-section">
      <div class="section-header">
        <FileText :size="20" class="section-icon" />
        <h2>추가 정보</h2>
      </div>
      <form @submit.prevent="updateAdditionalInfo">
        <div class="form-group">
          <label for="bio">
            <FileText :size="16" />
            자기소개
          </label>
          <textarea
              id="bio"
              v-model="formData.bio"
              class="form-textarea"
              rows="4"
              placeholder="간단한 자기소개를 작성해주세요"
          ></textarea>
          <span class="char-count">{{ formData.bio.length }}/500</span>
        </div>

        <div class="form-group">
          <label for="location">
            <MapPin :size="16" />
            위치
          </label>
          <input
              id="location"
              v-model="formData.location"
              type="text"
              class="form-input"
              placeholder="예: 서울, 대한민국"
          >
        </div>

        <div class="form-group">
          <label for="website">
            <Globe :size="16" />
            웹사이트
          </label>
          <input
              id="website"
              v-model="formData.website"
              type="url"
              class="form-input"
              placeholder="https://example.com"
          >
        </div>

        <div class="form-group">
          <label for="interests">
            <Tag :size="16" />
            관심사
          </label>
          <div class="interests-input-wrapper">
            <input
                id="interests"
                v-model="interestsInput"
                type="text"
                class="form-input"
                placeholder="쉼표로 구분하여 입력 (예: 프로그래밍, 디자인, 음악)"
                @keyup.enter="addInterest"
            >
            <div v-if="formData.interests.length > 0" class="interests-tags">
              <span
                  v-for="(interest, index) in formData.interests"
                  :key="index"
                  class="interest-tag"
              >
                {{ interest }}
                <button @click="removeInterest(index)" type="button" class="tag-remove">
                  <X :size="14" />
                </button>
              </span>
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-submit" :disabled="isUpdating">
          <Save :size="18" v-if="!isUpdating" />
          <Loader :size="18" v-else class="spin" />
          {{ isUpdating ? '저장 중...' : '추가 정보 저장' }}
        </button>
      </form>
    </div>

    <!-- 보안 설정 섹션 (이메일 로그인만) -->
    <div v-if="provider === 'email'" class="settings-section">
      <div class="section-header">
        <Shield :size="20" class="section-icon" />
        <h2>보안 설정</h2>
      </div>
      <div class="security-info">
        <p>계정 보안을 위해 주기적으로 비밀번호를 변경해주세요</p>
      </div>
      <div class="security-actions">
        <button @click="showPasswordModal = true" class="btn btn-outline">
          <Lock :size="18" />
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService, firestoreService, storageService } from '@/services/firebase'
// 수정된 코드 (올바른 경로)
// PasswordChangeModal은 존재하지 않으므로 주석 처리하거나 삭제
// import PasswordChangeModal from '@/components/profile/PasswordChangeModal.vue'
import Toast from '@/views/profile/PasswordChangeModal.vue'
import {
  ChevronLeft, Camera, User, Mail, Save, Loader, FileText,
  MapPin, Globe, Tag, Shield, Lock, Upload, Trash2, X, Info
} from 'lucide-vue-next'
// 기본 아바타 URL (외부 이미지 사용)
const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=67C23A&color=fff&size=120'

const router = useRouter()
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
const goBack = () => {
  router.push('/profile')
}

const loadProfile = async () => {
  try {
    const profile = await firestoreService.getUserProfile(authStore.userId)

    if (profile) {
      formData.value = {
        displayName: profile.displayName || authStore.displayName,
        email: profile.email || authStore.email,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        interests: profile.interests || []
      }
      currentPhotoURL.value = profile.photoURL || authStore.photoURL || ''
    } else {
      // 프로필이 없으면 기본값 사용
      formData.value = {
        displayName: authStore.displayName,
        email: authStore.email,
        bio: '',
        location: '',
        website: '',
        interests: []
      }
      currentPhotoURL.value = authStore.photoURL || ''
    }

    interestsInput.value = (formData.value.interests || []).join(', ')
  } catch (error) {
    console.error('프로필 로드 오류:', error)
    showToast('프로필을 불러오는 데 실패했습니다.', 'error')
  }
}

const handleImageError = (e) => {
  e.target.src = defaultAvatar
}

const handlePhotoChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 파일 크기 체크 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    showToast('파일 크기는 5MB 이하여야 합니다.', 'error')
    return
  }

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

    // Firebase Auth 프로필 업데이트
    await authService.updateAuthProfile(formData.value.displayName)

    // Firestore 사용자 문서 업데이트
    await firestoreService.updateUserProfile(authStore.userId, {
      displayName: formData.value.displayName,
      email: formData.value.email
    })

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

const addInterest = () => {
  const interests = interestsInput.value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)

  formData.value.interests = [...new Set([...formData.value.interests, ...interests])]
  interestsInput.value = ''
}

const removeInterest = (index) => {
  formData.value.interests.splice(index, 1)
}

const updateAdditionalInfo = async () => {
  try {
    isUpdating.value = true

    const additionalData = {
      bio: formData.value.bio,
      location: formData.value.location,
      website: formData.value.website,
      interests: formData.value.interests
    }

    // firestoreService의 updateUserProfile 사용
    await firestoreService.updateUserProfile(authStore.userId, additionalData)
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
  padding: 0 1rem 2rem;
  min-height: 100vh;
}

/* 헤더 */
.settings-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem 0;
}

.back-button {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-lg);
  background: white;
  border: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.back-button:hover {
  background: var(--bg-color-base);
  border-color: var(--color-brand-primary);
}

.header-content {
  flex: 1;
}

.settings-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color-primary);
  margin-bottom: 0.25rem;
}

.settings-header p {
  color: var(--text-color-secondary);
}

/* 섹션 스타일 */
.settings-section {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color-light);
  transition: all var(--transition-base);
}

.settings-section:hover {
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  color: var(--color-brand-primary);
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color-primary);
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
  gap: 0.75rem;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--border-color-light);
  transition: all var(--transition-base);
  cursor: pointer;
  position: relative;
}

.profile-avatar:hover {
  border-color: var(--color-brand-primary);
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  opacity: 0;
  transition: opacity var(--transition-base);
  pointer-events: none;
}

.current-photo:hover .photo-overlay {
  opacity: 1;
}

.photo-source {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.photo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

/* 폼 스타일 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-color-primary);
  margin-bottom: 0.5rem;
}

.form-group label svg {
  color: var(--color-brand-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color-light);
  border-radius: var(--border-radius-lg);
  font-size: 1rem;
  transition: all var(--transition-base);
  background: var(--bg-color-base);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.1);
}

.form-input:disabled {
  background-color: var(--bg-color-base);
  cursor: not-allowed;
  opacity: 0.7;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.email-field {
  position: relative;
}

.field-note {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-note svg {
  color: var(--color-brand-secondary);
}

/* 관심사 태그 */
.interests-input-wrapper {
  position: relative;
}

.interests-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.interest-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: var(--color-brand-primary);
  color: white;
  border-radius: var(--border-radius-full);
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity var(--transition-base);
}

.tag-remove:hover {
  opacity: 1;
}

/* 버튼 스타일 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  min-width: 140px;
  justify-content: center;
}

.btn-primary {
  background: var(--color-brand-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-green);
}

.btn-outline {
  background: white;
  color: var(--text-color-primary);
  border: 2px solid var(--border-color-base);
}

.btn-outline:hover {
  background: var(--bg-color-base);
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-submit {
  margin-top: 1rem;
  width: 100%;
}

/* 보안 섹션 */
.security-info {
  background: var(--bg-color-base);
  padding: 1rem;
  border-radius: var(--border-radius-lg);
  margin-bottom: 1rem;
}

.security-info p {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.security-actions {
  display: flex;
  gap: 1rem;
}

/* 애니메이션 */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .profile-settings-container {
    padding: 0 0 2rem;
  }

  .settings-header {
    padding: 1rem;
    background: white;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color-light);
  }

  .settings-section {
    border-radius: 0;
    margin-bottom: 0.5rem;
    padding: 1.5rem;
  }

  .profile-photo-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .photo-actions {
    width: 100%;
    align-items: stretch;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .settings-header h1 {
    font-size: 1.5rem;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
  }

  .form-input,
  .form-textarea {
    font-size: 16px; /* iOS 줌 방지 */
  }
}
</style>