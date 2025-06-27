<template>
  <div class="profile-menu" ref="profileMenu">
    <!-- 프로필 버튼 -->
    <button @click="toggleMenu" class="profile-button">
      <img
          :src="photoURL || defaultAvatar"
          :alt="displayName"
          class="profile-avatar"
      >
    </button>

    <!-- 드롭다운 메뉴 -->
    <transition name="dropdown">
      <div v-if="isMenuOpen" class="dropdown-menu">
        <div class="menu-header">
          <img
              :src="photoURL || defaultAvatar"
              :alt="displayName"
              class="menu-avatar"
          >
          <div class="menu-user-info">
            <div class="menu-user-name">{{ displayName }}</div>
            <div class="menu-user-email">{{ email }}</div>
          </div>
        </div>

        <div class="menu-divider"></div>

        <router-link to="/profile" class="menu-item" @click="closeMenu">
          <i class="fas fa-user"></i>
          <span>내 프로필</span>
        </router-link>

        <router-link to="/profile/settings" class="menu-item" @click="closeMenu">
          <i class="fas fa-cog"></i>
          <span>프로필 설정</span>
        </router-link>

        <router-link to="/my-courses" class="menu-item" @click="closeMenu">
          <i class="fas fa-book"></i>
          <span>내 학습</span>
        </router-link>

        <div class="menu-divider"></div>

        <button @click="handleLogout" class="menu-item menu-item-danger">
          <i class="fas fa-sign-out-alt"></i>
          <span>로그아웃</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import defaultAvatar from '@/assets/images/default-avatar.png'

const router = useRouter()
const authStore = useAuthStore()
const profileMenu = ref(null)
const isMenuOpen = ref(false)

// 계산된 속성
const displayName = computed(() => authStore.displayName || '사용자')
const email = computed(() => authStore.email || '')
const photoURL = computed(() => authStore.photoURL)

// 메뉴 토글
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// 로그아웃
const handleLogout = async () => {
  closeMenu()
  await authStore.logout()
  router.push('/login')
}

// 외부 클릭 감지
const handleClickOutside = (event) => {
  if (profileMenu.value && !profileMenu.value.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.profile-menu {
  position: relative;
}

.profile-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
  transition: border-color 0.2s;
}

.profile-button:hover .profile-avatar {
  border-color: #4CAF50;
}

/* 드롭다운 메뉴 */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  z-index: 1000;
  overflow: hidden;
}

.menu-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #f8f9fa;
}

.menu-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.menu-user-info {
  flex: 1;
  min-width: 0;
}

.menu-user-name {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-user-email {
  font-size: 0.875rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-divider {
  height: 1px;
  background-color: #eee;
  margin: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.875rem;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item i {
  width: 20px;
  text-align: center;
  color: #666;
}

.menu-item-danger {
  color: #f44336;
}

.menu-item-danger i {
  color: #f44336;
}

/* 트랜지션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 반응형 */
@media (max-width: 768px) {
  .dropdown-menu {
    right: -1rem;
  }
}
</style>