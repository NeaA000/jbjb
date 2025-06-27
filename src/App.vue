<template>
  <div id="app">
    <!-- 메인 레이아웃 -->
    <div class="app-layout">
      <!-- 모바일 헤더 (홈 화면이 아닐 때만 표시) -->
      <header v-if="!isHomePage && isMobile" class="mobile-header">
        <div class="mobile-header-content">
          <button @click="goBack" class="back-button">
            <ArrowLeft :size="20" />
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
          <div class="header-spacer"></div>
        </div>
      </header>

      <!-- 메인 콘텐츠 영역 -->
      <main class="main-content" :class="{ 'with-header': !isHomePage && isMobile, 'with-nav': isMobile }">
        <router-view v-slot="{ Component }" :key="route.fullPath">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- 모바일 하단 네비게이션 -->
      <nav v-if="isMobile && showBottomNav" class="mobile-nav">
        <router-link to="/home" class="nav-item" :class="{ active: route.path === '/home' }">
          <Home :size="24" />
          <span>홈</span>
        </router-link>
        <router-link to="/courses" class="nav-item" :class="{ active: route.path.includes('/courses') }">
          <BookOpen :size="24" />
          <span>강의</span>
        </router-link>
        <router-link to="/my-courses" class="nav-item" :class="{ active: route.path === '/my-courses' }">
          <Award :size="24" />
          <span>내 학습</span>
        </router-link>
        <router-link to="/profile" class="nav-item" :class="{ active: route.path === '/profile' }">
          <User :size="24" />
          <span>프로필</span>
        </router-link>
      </nav>
    </div>

    <!-- 로딩 인디케이터 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Home, BookOpen, Award, User } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 상태
const isLoading = ref(false)
const isMobile = ref(false)

// 페이지 정보
const isHomePage = computed(() => route.path === '/home' || route.path === '/')
const showBottomNav = computed(() => authStore.isAuthenticated && !route.path.includes('/login') && !route.path.includes('/register'))

// 페이지 제목
const pageTitle = computed(() => {
  const titles = {
    '/courses': '강의 목록',
    '/my-courses': '내 학습',
    '/profile': '프로필',
    '/course-enroll': '수강 신청'
  }

  if (route.path.includes('/course/')) {
    return '강의 상세'
  }

  if (route.path.includes('/learning/')) {
    return '학습하기'
  }

  return titles[route.path] || ''
})

// 뒤로가기
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/home')
  }
}

// 반응형 체크
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 라우터 로딩
router.beforeEach(() => {
  isLoading.value = true
})

router.afterEach(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 300)
})

// 마운트/언마운트
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 앱 초기화
  authStore.initialize()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style>
/* 전역 스타일 리셋 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 앱 레이아웃 */
#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 모바일 헤더 */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  z-index: var(--z-fixed);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.9);
}

.mobile-header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-3);
}

.back-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
}

.back-button:active {
  background-color: var(--bg-tertiary);
}

.page-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  flex: 1;
  text-align: center;
}

.header-spacer {
  width: 40px;
}

/* 메인 콘텐츠 */
.main-content {
  flex: 1;
  width: 100%;
  transition: padding var(--transition-base);
}

.main-content.with-header {
  padding-top: 56px;
}

.main-content.with-nav {
  padding-bottom: 65px;
}

/* 모바일 네비게이션 */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: var(--z-fixed);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  text-decoration: none;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  position: relative;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: var(--accent-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-fast);
}

.nav-item.active {
  color: var(--accent-primary);
}

.nav-item.active::before {
  width: 24px;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item span {
  font-weight: var(--font-medium);
}

/* 페이지 전환 애니메이션 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-tooltip);
  backdrop-filter: blur(4px);
}

/* 반응형 디자인 */
@media (min-width: 769px) {
  .mobile-header,
  .mobile-nav {
    display: none;
  }

  .main-content {
    padding: 0 !important;
  }
}

/* iOS 안전 영역 대응 */
@supports (padding: max(0px)) {
  .mobile-header {
    padding-top: max(0px, env(safe-area-inset-top));
    height: calc(56px + max(0px, env(safe-area-inset-top)));
  }

  .main-content.with-header {
    padding-top: calc(56px + max(0px, env(safe-area-inset-top)));
  }

  .mobile-nav {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
    height: calc(65px + max(0px, env(safe-area-inset-bottom)));
  }

  .main-content.with-nav {
    padding-bottom: calc(65px + max(0px, env(safe-area-inset-bottom)));
  }
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }

  .nav-item:active {
    transform: none;
  }
}

/* Element Plus 컴포넌트 모바일 최적화 */
.el-message-box {
  width: 90% !important;
  max-width: 320px;
}

.el-dialog {
  width: 95% !important;
  margin: var(--space-4) !important;
}

@media (max-width: 768px) {
  .el-button {
    min-height: 44px;
    font-size: var(--text-base);
  }

  .el-input__wrapper {
    min-height: 44px;
    font-size: var(--text-base);
  }
}
</style>