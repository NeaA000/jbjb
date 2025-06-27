<template>
  <div class="home-container">
    <!-- 헤더 -->
    <header class="home-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="app-name">안전교육 플랫폼</span>
        </div>

        <div class="user-section">
          <div class="user-info" @click="showUserMenu = !showUserMenu">
            <img
                v-if="authStore.photoURL"
                :src="authStore.photoURL"
                alt="프로필"
                class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="user-name">{{ authStore.displayName }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- 사용자 메뉴 드롭다운 -->
          <div v-if="showUserMenu" class="user-menu">
            <router-link to="/profile" class="menu-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              프로필 관리
            </router-link>
            <div class="menu-divider"></div>
            <button @click="handleLogout" class="menu-item logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2"/>
                <path d="M21 12H9" stroke="currentColor" stroke-width="2"/>
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 환영 배너 -->
    <section class="welcome-banner">
      <div class="banner-content">
        <h1>안녕하세요, {{ authStore.displayName }}님!</h1>
        <p>오늘도 안전한 하루 되세요. 새로운 안전교육 강의를 시작해보세요.</p>
      </div>
      <div class="banner-illustration">
        <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="75" r="60" fill="#667eea" opacity="0.2"/>
          <path d="M100 45L70 60L100 75L130 60L100 45Z" fill="#667eea"/>
          <path d="M70 90L100 105L130 90" stroke="#667eea" stroke-width="2"/>
          <path d="M70 75L100 90L130 75" stroke="#667eea" stroke-width="2"/>
        </svg>
      </div>
    </section>

    <!-- 빠른 액션 -->
    <section class="quick-actions">
      <h2 class="section-title">빠른 시작</h2>
      <div class="action-grid">
        <router-link to="/courses" class="action-card">
          <div class="action-icon" style="background: #e3f2fd;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#1976d2" stroke-width="2"/>
              <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="#1976d2" stroke-width="2"/>
            </svg>
          </div>
          <h3>강의 둘러보기</h3>
          <p>다양한 안전교육 강의를 확인하세요</p>
        </router-link>

        <router-link to="/my-courses" class="action-card">
          <div class="action-icon" style="background: #fce4ec;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="#c2185b" stroke-width="2"/>
              <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="#c2185b" stroke-width="2"/>
            </svg>
          </div>
          <h3>내 강의실</h3>
          <p>수강 중인 강의를 관리하세요</p>
        </router-link>

        <router-link to="/qr-scan" class="action-card">
          <div class="action-icon" style="background: #f3e5f5;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7V5C3 3.89543 3.89543 3 5 3H7" stroke="#7b1fa2" stroke-width="2"/>
              <path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" stroke="#7b1fa2" stroke-width="2"/>
              <path d="M21 17V19C21 20.1046 20.1046 21 19 21H17" stroke="#7b1fa2" stroke-width="2"/>
              <path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" stroke="#7b1fa2" stroke-width="2"/>
            </svg>
          </div>
          <h3>QR 코드 스캔</h3>
          <p>QR 코드로 빠르게 강의 시작</p>
        </router-link>

        <router-link to="/certificates" class="action-card">
          <div class="action-icon" style="background: #e8f5e9;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#388e3c" stroke-width="2"/>
              <path d="M14 2V8H20" stroke="#388e3c" stroke-width="2"/>
              <path d="M16 13H8" stroke="#388e3c" stroke-width="2"/>
              <path d="M16 17H8" stroke="#388e3c" stroke-width="2"/>
              <path d="M10 9H9H8" stroke="#388e3c" stroke-width="2"/>
            </svg>
          </div>
          <h3>수료증 관리</h3>
          <p>획득한 수료증을 확인하세요</p>
        </router-link>

        <router-link to="/profile" class="action-card">
          <div class="action-icon" style="background: #fff3e0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#f57c00" stroke-width="2"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#f57c00" stroke-width="2"/>
            </svg>
          </div>
          <h3>프로필 설정</h3>
          <p>개인정보와 설정을 관리하세요</p>
        </router-link>
      </div>
    </section>

    <!-- 학습 현황 -->
    <section class="learning-status">
      <h2 class="section-title">나의 학습 현황</h2>
      <div class="status-grid">
        <div class="status-card">
          <div class="status-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#4caf50" stroke-width="2"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="#4caf50" stroke-width="2"/>
            </svg>
          </div>
          <div class="status-info">
            <h3>{{ stats.completed }}</h3>
            <p>완료한 강의</p>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#2196f3" stroke-width="2"/>
              <path d="M12 6V12L16 14" stroke="#2196f3" stroke-width="2"/>
            </svg>
          </div>
          <div class="status-info">
            <h3>{{ stats.inProgress }}</h3>
            <p>진행 중인 강의</p>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#ff9800" stroke-width="2"/>
            </svg>
          </div>
          <div class="status-info">
            <h3>{{ stats.certificates }}</h3>
            <p>획득한 수료증</p>
          </div>
        </div>

        <div class="status-card">
          <div class="status-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#9c27b0" stroke-width="2"/>
              <path d="M9 11C11.2091 11 16 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#9c27b0" stroke-width="2"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#9c27b0" stroke-width="2"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#9c27b0" stroke-width="2"/>
            </svg>
          </div>
          <div class="status-info">
            <h3>{{ stats.totalHours }}시간</h3>
            <p>총 학습 시간</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 최근 학습 -->
    <section class="recent-courses" v-if="recentCourses.length > 0">
      <h2 class="section-title">최근 학습한 강의</h2>
      <div class="course-list">
        <div v-for="course in recentCourses" :key="course.id" class="course-item">
          <div class="course-thumbnail">
            <img v-if="course.thumbnail" :src="course.thumbnail" alt="">
            <div v-else class="thumbnail-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
          </div>
          <div class="course-info">
            <h4>{{ course.title }}</h4>
            <p>{{ course.category }}</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{width: course.progress + '%'}"></div>
            </div>
          </div>
          <router-link :to="`/learning/${course.id}`" class="continue-button">
            이어보기
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

// 상태
const showUserMenu = ref(false)
const stats = ref({
  completed: 0,
  inProgress: 0,
  certificates: 0,
  totalHours: 0
})
const recentCourses = ref([])

// 사용자 메뉴 외부 클릭 감지
const handleClickOutside = (event) => {
  const userSection = document.querySelector('.user-section')
  if (userSection && !userSection.contains(event.target)) {
    showUserMenu.value = false
  }
}

// 로그아웃
const handleLogout = async () => {
  try {
    await authStore.logout(router)
    ElMessage.success('로그아웃되었습니다')
  } catch (error) {
    ElMessage.error('로그아웃 중 오류가 발생했습니다')
  }
}

// 데이터 로드
const loadDashboardData = async () => {
  // TODO: 실제 API에서 데이터 로드
  // 임시 데이터
  stats.value = {
    completed: 5,
    inProgress: 2,
    certificates: 5,
    totalHours: 12
  }

  recentCourses.value = [
    {
      id: '1',
      title: '건설현장 안전관리 기초',
      category: '건설안전',
      progress: 75,
      thumbnail: null
    },
    {
      id: '2',
      title: '전기작업 안전수칙',
      category: '전기안전',
      progress: 30,
      thumbnail: null
    }
  ]
}

// 마운트/언마운트
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadDashboardData()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 헤더 */
.home-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 40px;
  height: 40px;
  background: #667eea;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.user-section {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f5f5;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  transition: background 0.3s;
  border: none;
  background: none;
  width: 100%;
  font-size: 14px;
  cursor: pointer;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.logout {
  color: #f44336;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

/* 환영 배너 */
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 48px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.banner-content h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.banner-content p {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
}

.banner-illustration {
  flex-shrink: 0;
}

/* 섹션 공통 */
.quick-actions,
.learning-status,
.recent-courses {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

/* 빠른 액션 */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.action-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.action-card p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 학습 현황 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-icon {
  flex-shrink: 0;
}

.status-info h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #333;
}

.status-info p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 최근 학습 */
.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.course-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.course-info {
  flex: 1;
}

.course-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
}

.course-info p {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.continue-button {
  padding: 8px 20px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.continue-button:hover {
  background: #5a67d8;
}

/* 반응형 */
@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }

  .banner-illustration {
    order: -1;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 12px 16px;
  }

  .app-name {
    display: none;
  }

  .banner-content h1 {
    font-size: 24px;
  }

  .banner-content p {
    font-size: 16px;
  }

  .course-item {
    flex-direction: column;
    text-align: center;
  }

  .continue-button {
    width: 100%;
    text-align: center;
  }
}
</style>