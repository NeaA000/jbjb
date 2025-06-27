<template>
  <div class="profile-container">
    <!-- 프로필 헤더 -->
    <div class="profile-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="profile-main">
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <img
                  :src="profileData.photoURL || defaultAvatar"
                  :alt="profileData.displayName"
                  class="profile-avatar"
                  @error="handleImageError"
              >
              <div class="avatar-status" :class="statusClass"></div>
            </div>
            <button class="avatar-edit" @click="goToSettings">
              <Camera :size="20" />
            </button>
          </div>

          <div class="profile-info">
            <h1 class="profile-name">{{ profileData.displayName || '사용자' }}</h1>
            <p class="profile-email">{{ profileData.email }}</p>
            <div class="profile-meta">
              <span v-if="profileData.location" class="meta-item">
                <MapPin :size="16" />
                {{ profileData.location }}
              </span>
              <span class="meta-item">
                <Calendar :size="16" />
                가입일: {{ formatDate(profileData.createdAt) }}
              </span>
            </div>
            <p v-if="profileData.bio" class="profile-bio">{{ profileData.bio }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 프로필 통계 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon learning">
            <BookOpen :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.coursesInProgress }}</div>
            <div class="stat-label">학습 중</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed">
            <CheckCircle :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.coursesCompleted }}</div>
            <div class="stat-label">완료</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon certificate">
            <Award :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.certificates }}</div>
            <div class="stat-label">수료증</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon time">
            <Clock :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalHours }}h</div>
            <div class="stat-label">학습 시간</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 빠른 메뉴 -->
    <div class="quick-menu-section">
      <h2 class="section-title">빠른 메뉴</h2>
      <div class="quick-menu-grid">
        <router-link to="/profile/settings" class="menu-card">
          <div class="menu-icon">
            <Settings :size="24" />
          </div>
          <span class="menu-label">프로필 설정</span>
          <ChevronRight :size="20" class="menu-arrow" />
        </router-link>

        <router-link to="/my-courses" class="menu-card">
          <div class="menu-icon">
            <BookOpen :size="24" />
          </div>
          <span class="menu-label">내 학습</span>
          <ChevronRight :size="20" class="menu-arrow" />
        </router-link>

        <router-link to="/certificates" class="menu-card">
          <div class="menu-icon">
            <Award :size="24" />
          </div>
          <span class="menu-label">수료증</span>
          <ChevronRight :size="20" class="menu-arrow" />
        </router-link>

        <button @click="handleLogout" class="menu-card logout">
          <div class="menu-icon">
            <LogOut :size="24" />
          </div>
          <span class="menu-label">로그아웃</span>
          <ChevronRight :size="20" class="menu-arrow" />
        </button>
      </div>
    </div>

    <!-- 최근 활동 -->
    <div class="activity-section">
      <h2 class="section-title">최근 학습 활동</h2>
      <div v-if="recentActivities.length > 0" class="activity-list">
        <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="activity-card"
            @click="goToCourse(activity.courseId)"
        >
          <div class="activity-icon" :class="getActivityIconClass(activity.type)">
            <component :is="getActivityIcon(activity.type)" :size="20" />
          </div>
          <div class="activity-content">
            <h3 class="activity-title">{{ activity.courseName }}</h3>
            <p class="activity-description">{{ activity.description }}</p>
            <span class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</span>
          </div>
          <div class="activity-progress" v-if="activity.progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: activity.progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ activity.progress }}%</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <BookOpen :size="48" class="empty-icon" />
        <p class="empty-text">아직 학습 활동이 없습니다</p>
        <router-link to="/courses" class="empty-action">
          강의 둘러보기
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { firestoreService } from '@/services/firebase'
import {
  Camera, Settings, BookOpen, Award, LogOut, ChevronRight,
  MapPin, Calendar, Clock, CheckCircle, Play, FileText
} from 'lucide-vue-next'
import defaultAvatar from '@/assets/images/default-avatar.png'

const router = useRouter()
const authStore = useAuthStore()

// 상태
const profileData = ref({
  displayName: '',
  email: '',
  photoURL: '',
  bio: '',
  location: '',
  createdAt: null,
  interests: []
})

const stats = ref({
  coursesInProgress: 0,
  coursesCompleted: 0,
  certificates: 0,
  totalHours: 0
})

const recentActivities = ref([])
const isLoading = ref(true)

// 계산된 속성
const statusClass = computed(() => {
  // 실제로는 사용자의 온라인 상태를 확인해야 함
  return 'online'
})

// 메서드
const loadProfileData = async () => {
  try {
    isLoading.value = true

    // 프로필 데이터 로드
    const profile = await firestoreService.getFullProfile(authStore.userId)
    profileData.value = {
      displayName: profile.displayName || authStore.displayName,
      email: profile.email || authStore.email,
      photoURL: profile.photoURL || authStore.photoURL,
      bio: profile.bio || '',
      location: profile.location || '',
      createdAt: profile.createdAt || new Date(),
      interests: profile.interests || []
    }

    // 통계 데이터 로드
    await loadStats()

    // 최근 활동 로드
    await loadRecentActivities()

  } catch (error) {
    console.error('프로필 데이터 로드 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const loadStats = async () => {
  try {
    // 실제로는 Firestore에서 통계 데이터를 가져와야 함
    const userCourses = await firestoreService.getUserCourses(authStore.userId)

    stats.value = {
      coursesInProgress: userCourses.filter(c => c.progress > 0 && c.progress < 100).length,
      coursesCompleted: userCourses.filter(c => c.progress === 100).length,
      certificates: userCourses.filter(c => c.certificateId).length,
      totalHours: Math.round(userCourses.reduce((sum, c) => sum + (c.studyTime || 0), 0) / 60)
    }
  } catch (error) {
    console.error('통계 로드 오류:', error)
  }
}

const loadRecentActivities = async () => {
  try {
    // 실제로는 Firestore에서 최근 활동을 가져와야 함
    // 여기서는 예시 데이터
    recentActivities.value = [
      {
        id: '1',
        courseId: 'course1',
        courseName: '안전교육 기초과정',
        type: 'progress',
        description: '3장 완료',
        progress: 75,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2시간 전
      },
      {
        id: '2',
        courseId: 'course2',
        courseName: '소방안전 교육',
        type: 'completed',
        description: '과정 완료',
        progress: 100,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1일 전
      }
    ]
  } catch (error) {
    console.error('최근 활동 로드 오류:', error)
  }
}

const goToSettings = () => {
  router.push('/profile/settings')
}

const goToCourse = (courseId) => {
  router.push(`/course/${courseId}`)
}

const handleLogout = async () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    await authStore.logout()
    router.push('/login')
  }
}

const handleImageError = (e) => {
  e.target.src = defaultAvatar
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatRelativeTime = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  const now = new Date()
  const diff = now - d

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return d.toLocaleDateString('ko-KR')
}

const getActivityIcon = (type) => {
  const icons = {
    progress: Play,
    completed: CheckCircle,
    certificate: Award,
    started: BookOpen
  }
  return icons[type] || FileText
}

const getActivityIconClass = (type) => {
  const classes = {
    progress: 'progress',
    completed: 'completed',
    certificate: 'certificate',
    started: 'started'
  }
  return classes[type] || ''
}

// 생명주기
onMounted(() => {
  loadProfileData()
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  min-height: 100vh;
}

/* 프로필 헤더 */
.profile-header {
  position: relative;
  margin-bottom: 2rem;
  background: white;
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-base);
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: var(--gradient-primary);
  opacity: 0.9;
}

.header-content {
  position: relative;
  padding: 2rem;
}

.profile-main {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  margin-top: 80px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: var(--shadow-lg);
}

.avatar-status {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: var(--shadow-sm);
}

.avatar-status.online {
  background-color: var(--color-success);
}

.avatar-status.offline {
  background-color: var(--color-text-secondary);
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-brand-primary);
  color: white;
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.avatar-edit:hover {
  background: var(--color-brand-primary-dark);
  transform: scale(1.1);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color-primary);
  margin-bottom: 0.25rem;
}

.profile-email {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.meta-item svg {
  color: var(--color-brand-primary);
}

.profile-bio {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color-regular);
}

/* 통계 섹션 */
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.learning {
  background: rgba(74, 144, 226, 0.1);
  color: var(--color-brand-secondary);
}

.stat-icon.completed {
  background: rgba(103, 194, 58, 0.1);
  color: var(--color-brand-primary);
}

.stat-icon.certificate {
  background: rgba(255, 193, 7, 0.1);
  color: var(--color-warning);
}

.stat-icon.time {
  background: rgba(139, 92, 246, 0.1);
  color: var(--color-purple);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

/* 빠른 메뉴 섹션 */
.quick-menu-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 1rem;
}

.quick-menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.menu-card {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: var(--text-color-primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: pointer;
  border: 1px solid var(--border-color-light);
}

.menu-card:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-brand-primary);
}

.menu-card.logout:hover {
  border-color: var(--color-danger);
}

.menu-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-base);
  background: var(--bg-color-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-brand-primary);
  flex-shrink: 0;
}

.menu-card.logout .menu-icon {
  color: var(--color-danger);
}

.menu-label {
  flex: 1;
  font-weight: 500;
}

.menu-arrow {
  color: var(--text-color-secondary);
}

/* 활동 섹션 */
.activity-section {
  margin-bottom: 2rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-card {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}

.activity-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.progress {
  background: rgba(74, 144, 226, 0.1);
  color: var(--color-brand-secondary);
}

.activity-icon.completed {
  background: rgba(103, 194, 58, 0.1);
  color: var(--color-brand-primary);
}

.activity-icon.certificate {
  background: rgba(255, 193, 7, 0.1);
  color: var(--color-warning);
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 0.25rem;
}

.activity-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-color-placeholder);
}

.activity-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 100px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-color-base);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-brand-primary);
  transition: width var(--transition-base);
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-brand-primary);
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  color: var(--text-color-placeholder);
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
}

.empty-action {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--color-brand-primary);
  color: white;
  text-decoration: none;
  border-radius: var(--border-radius-base);
  font-weight: 500;
  transition: all var(--transition-base);
}

.empty-action:hover {
  background: var(--color-brand-primary-dark);
  transform: translateY(-1px);
}

/* 반응형 */
@media (max-width: 768px) {
  .profile-container {
    padding: 0 0 2rem;
  }

  .profile-header {
    border-radius: 0;
    margin-bottom: 1rem;
  }

  .header-content {
    padding: 1.5rem 1rem;
  }

  .profile-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: 60px;
  }

  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .profile-meta {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin: 0 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .quick-menu-section,
  .activity-section {
    padding: 0 1rem;
  }

  .quick-menu-grid {
    grid-template-columns: 1fr;
  }

  .activity-card {
    padding: 1rem;
  }

  .activity-progress {
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .header-background {
    height: 140px;
  }

  .profile-main {
    margin-top: 40px;
  }

  .meta-item {
    font-size: 0.8rem;
  }
}
</style>