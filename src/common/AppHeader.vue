<!-- components/common/AppHeader.vue -->
<template>
  <div class="app-header bg-white shadow-sm">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center">
        <Shield class="w-6 h-6 text-blue-500 mr-2" />
        <h1 class="text-lg font-bold">QR 안전교육</h1>
      </div>

      <div class="flex items-center space-x-3">
        <!-- 언어 선택 (임시로 비활성화) -->
        <el-select v-model="currentLanguage" size="small" style="width: 80px">
          <el-option label="한국어" value="ko" />
          <el-option label="English" value="en" />
        </el-select>

        <!-- 알림 -->
        <el-badge :value="notificationCount" :hidden="notificationCount === 0">
          <el-button circle size="small">
            <template #icon>
              <Bell class="w-4 h-4" />
            </template>
          </el-button>
        </el-badge>

        <!-- 사용자 메뉴 -->
        <el-dropdown>
          <el-avatar :src="userAvatar" size="small" class="cursor-pointer">
            {{ userInitial }}
          </el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToProfile">
                <template #default>
                  <div class="flex items-center">
                    <User class="w-4 h-4 mr-2" />
                    <span>프로필</span>
                  </div>
                </template>
              </el-dropdown-item>
              <el-dropdown-item @click="logout" divided>
                <template #default>
                  <div class="flex items-center">
                    <LogOut class="w-4 h-4 mr-2" />
                    <span>로그아웃</span>
                  </div>
                </template>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'  // ✅ computed import 추가
import { useRouter } from 'vue-router'
import { Shield, Bell, User, LogOut } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 상태
const notificationCount = ref(0)
const currentLanguage = ref('ko')

// 계산된 속성
const userName = computed(() => authStore.displayName || '사용자')
const userAvatar = computed(() => authStore.user?.photoURL || '')

// ✅ userInitial 계산 속성 추가 (안전한 접근)
const userInitial = computed(() => {
  const name = userName.value
  return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U'
})

// 메서드
const goToProfile = () => {
  router.push('/profile')
}

const logout = async () => {
  try {
    await authStore.logout()
    ElMessage.success('로그아웃되었습니다.')
    router.push('/login')
  } catch (error) {
    ElMessage.error('로그아웃 실패')
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>
