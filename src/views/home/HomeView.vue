<template>
  <div class="home-container">
    <!-- 헤더 -->
    <header class="home-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="app-name">강의 신청하기</span>
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
              <User :size="18" />
            </div>
            <span class="user-name">{{ authStore.displayName }}</span>
            <ChevronDown :size="16" />
          </div>

          <!-- 사용자 메뉴 드롭다운 -->
          <transition name="menu">
            <div v-if="showUserMenu" class="user-menu">
              <router-link to="/profile" class="menu-item">
                <User :size="16" />
                프로필 관리
              </router-link>
              <div class="menu-divider"></div>
              <button @click="handleLogout" class="menu-item logout">
                <LogOut :size="16" />
                로그아웃
              </button>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <!-- 환영 배너 -->
    <section class="welcome-banner">
      <div class="container">
        <div class="banner-wrapper">
          <div class="banner-content">
            <h1>안녕하세요, {{ authStore.displayName }}님!</h1>
            <p>오늘도 안전한 하루 되세요. 새로운 안전교육이 준비되어 있습니다.</p>
          </div>
          <div class="banner-illustration">
            <img src="/banner-illustration.svg" alt="안전교육" onerror="this.style.display='none'" />
          </div>
        </div>
      </div>
    </section>

    <!-- 빠른 액션 -->
    <section class="quick-actions">
      <div class="container">
        <h2 class="section-title">빠른 메뉴</h2>
        <div class="action-grid">
          <router-link to="/courses" class="action-card">
            <div class="action-icon action-icon--courses">
              <BookOpen :size="28" />
            </div>
            <h3>강의 둘러보기</h3>
            <p>다양한 안전교육 강의를 만나보세요</p>
          </router-link>

          <router-link to="/my-courses" class="action-card">
            <div class="action-icon action-icon--my-courses">
              <Award :size="28" />
            </div>
            <h3>내 학습관리</h3>
            <p>수강 중인 강의와 진도를 확인하세요</p>
          </router-link>

          <router-link to="/qr-scan" class="action-card">
            <div class="action-icon action-icon--qr">
              <QrCode :size="28" />
            </div>
            <h3>QR 코드 스캔</h3>
            <p>QR 코드로 빠르게 강의 시작</p>
          </router-link>

          <router-link to="/certificates" class="action-card">
            <div class="action-icon action-icon--certificates">
              <FileText :size="28" />
            </div>
            <h3>수료증 관리</h3>
            <p>획득한 수료증을 확인하세요</p>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 학습 현황 -->
    <section class="learning-status">
      <div class="container">
        <h2 class="section-title">나의 학습 현황</h2>
        <div class="status-grid">
          <div class="status-card">
            <div class="status-icon status-icon--completed">
              <CheckCircle :size="36" />
            </div>
            <div class="status-info">
              <h3>{{ stats.completed }}</h3>
              <p>완료한 강의</p>
            </div>
          </div>

          <div class="status-card">
            <div class="status-icon status-icon--progress">
              <PlayCircle :size="36" />
            </div>
            <div class="status-info">
              <h3>{{ stats.inProgress }}</h3>
              <p>진행 중인 강의</p>
            </div>
          </div>

          <div class="status-card">
            <div class="status-icon status-icon--certificates">
              <Award :size="36" />
            </div>
            <div class="status-info">
              <h3>{{ stats.certificates }}</h3>
              <p>획득한 수료증</p>
            </div>
          </div>

          <div class="status-card">
            <div class="status-icon status-icon--time">
              <Clock :size="36" />
            </div>
            <div class="status-info">
              <h3>{{ stats.totalHours }}시간</h3>
              <p>총 학습 시간</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 최근 학습 -->
    <section class="recent-courses" v-if="recentCourses.length > 0">
      <div class="container">
        <h2 class="section-title">최근 학습한 강의</h2>
        <div class="course-list">
          <div v-for="course in recentCourses" :key="course.id" class="course-item">
            <div class="course-thumbnail">
              <img v-if="course.thumbnail" :src="course.thumbnail" alt="">
              <div v-else class="thumbnail-placeholder">
                <BookOpen :size="32" />
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
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProgressService from '@/services/progressService'
import { ElMessage } from 'element-plus'
import {
  User,
  ChevronDown,
  LogOut,
  BookOpen,
  Award,
  QrCode,
  FileText,
  CheckCircle,
  PlayCircle,
  Clock
} from 'lucide-vue-next'
// Firebase imports
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { FIREBASE_COLLECTIONS } from '@/utils/constants'

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

// 통계 데이터 로드 (기존 ProgressService 사용)
const loadStats = async () => {
  try {
    const userId = authStore.userId || (authStore.isGuest ? 'guest' : null)
    if (!userId) return

    // enrollments 컬렉션에서 사용자 수강 정보 가져오기
    const enrollmentsQuery = query(
        collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS),
        where('userId', '==', userId)
    )
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)

    let totalMinutes = 0
    const courseIds = []

    enrollmentsSnapshot.forEach(doc => {
      const enrollment = doc.data()
      courseIds.push(enrollment.courseId)
      totalMinutes += enrollment.studyTime || 0
    })

    // 모든 진행률 정보 가져오기
    const progressMap = await ProgressService.loadAllUserProgress(userId)

    // 통계 계산
    const progressStats = ProgressService.calculateProgressStats(progressMap)

    // certificates 컬렉션에서 수료증 개수 가져오기
    const certificatesQuery = query(
        collection(db, FIREBASE_COLLECTIONS.CERTIFICATES),
        where('userId', '==', userId)
    )
    const certificatesSnapshot = await getDocs(certificatesQuery)
    const certificatesCount = certificatesSnapshot.size

    stats.value = {
      completed: progressStats.completedCourses,
      inProgress: progressStats.inProgressCourses,
      certificates: certificatesCount,
      totalHours: Math.round(totalMinutes / 60)
    }

  } catch (error) {
    console.error('통계 로드 오류:', error)
    // 오류 시 기본값 유지
  }
}

// 최근 학습 강의 로드 (기존 ProgressService 사용)
const loadRecentCourses = async () => {
  try {
    const userId = authStore.userId || (authStore.isGuest ? 'guest' : null)
    if (!userId) return

    // 최근 접근한 enrollments 가져오기
    const enrollmentsQuery = query(
        collection(db, FIREBASE_COLLECTIONS.ENROLLMENTS),
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc'),
        limit(3)
    )

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery)
    const courses = []
    const courseIds = []

    // 강의 ID 수집
    enrollmentsSnapshot.forEach(doc => {
      const enrollment = doc.data()
      courseIds.push(enrollment.courseId)
    })

    // 배치로 모든 진행률 가져오기
    const progressMap = await ProgressService.loadBatchProgress(userId, courseIds)

    // 각 enrollment에 대한 강의 정보 가져오기
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data()
      const course = await loadCourseInfo(enrollment.courseId)

      if (course) {
        const progressData = progressMap.get(enrollment.courseId)
        courses.push({
          ...course,
          progress: progressData?.progress || 0
        })
      }
    }

    recentCourses.value = courses
  } catch (error) {
    console.error('최근 학습 강의 로드 오류:', error)
    recentCourses.value = []
  }
}

// 강의 정보 로드
const loadCourseInfo = async (courseId) => {
  try {
    // 강의 정보 가져오기
    const courseDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.UPLOADS, courseId))
    if (!courseDoc.exists()) return null

    const courseData = courseDoc.data()

    // 카테고리 경로 생성
    const categoryPath = [
      courseData.main_category,
      courseData.sub_category,
      courseData.sub_sub_category
    ].filter(Boolean).join(' > ')

    return {
      id: courseId,
      title: courseData.group_name || courseData.title || '제목 없음',
      category: categoryPath || '미분류',
      thumbnail: courseData.thumbnail_url || null,
      duration: courseData.duration || '30분'
    }
  } catch (error) {
    console.error('강의 정보 로드 오류:', error)
    return null
  }
}

// 데이터 로드
const loadDashboardData = async () => {
  try {
    // 병렬로 모든 데이터 로드
    await Promise.all([
      loadStats(),
      loadRecentCourses()
    ])
  } catch (error) {
    console.error('대시보드 데이터 로드 오류:', error)
    ElMessage.error('데이터를 불러오는 중 오류가 발생했습니다')
  }
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
/* =================== 메인 컨테이너 =================== */
.home-container {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* =================== 헤더 =================== */
.home-header {
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  border-bottom: 1px solid var(--border-primary);
}

.header-content {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.logo {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.app-name {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.user-section {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
  border: 2px solid transparent;
}

.user-info:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-primary);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--border-primary);
}

.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  border: 2px solid var(--border-primary);
}

.user-name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

/* 메뉴 드롭다운 */
.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  overflow: hidden;
  z-index: var(--z-dropdown);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--text-primary);
  text-decoration: none;
  transition: background var(--transition-fast);
  border: none;
  background: none;
  width: 100%;
  font-size: var(--text-base);
  cursor: pointer;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-item.logout {
  color: var(--color-error);
}

.menu-divider {
  height: 1px;
  background: var(--border-primary);
  margin: 0;
}

/* 메뉴 애니메이션 */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* =================== 환영 배너 =================== */
.welcome-banner {
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  color: white;
  padding: var(--space-12) 0;
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.banner-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-8);
}

.banner-content h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-3) 0;
  line-height: var(--leading-tight);
}

.banner-content p {
  font-size: var(--text-lg);
  margin: 0;
  opacity: 0.95;
  line-height: var(--leading-relaxed);
}

.banner-illustration {
  flex-shrink: 0;
}

.banner-illustration img {
  width: 300px;
  height: auto;
}

/* =================== 섹션 공통 =================== */
.quick-actions,
.learning-status,
.recent-courses {
  padding: var(--space-12) 0;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-8) 0;
}

/* =================== 빠른 액션 =================== */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

.action-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  text-decoration: none;
  color: var(--text-primary);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent-primary) 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform var(--transition-base);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-primary);
}

.action-card:hover::before {
  transform: scaleX(1);
}

.action-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.action-icon--courses {
  background: linear-gradient(135deg, var(--color-info-light) 0%, var(--color-info) 100%);
  color: white;
}

.action-icon--my-courses {
  background: linear-gradient(135deg, var(--color-error-light) 0%, var(--color-error) 100%);
  color: white;
}

.action-icon--qr {
  background: linear-gradient(135deg, var(--color-primary-200) 0%, var(--color-primary-500) 100%);
  color: white;
}

.action-icon--certificates {
  background: linear-gradient(135deg, var(--color-success-light) 0%, var(--color-success) 100%);
  color: white;
}

.action-card h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-2) 0;
}

.action-card p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

/* =================== 학습 현황 =================== */
.learning-status {
  background: var(--bg-tertiary);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
}

.status-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-5);
  box-shadow: var(--shadow-base);
  transition: all var(--transition-base);
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}

.status-icon {
  flex-shrink: 0;
}

.status-icon--completed {
  color: var(--color-success);
}

.status-icon--progress {
  color: var(--color-info);
}

.status-icon--certificates {
  color: var(--color-warning);
}

.status-icon--time {
  color: var(--color-primary-600);
}

.status-info h3 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-1) 0;
  color: var(--text-primary);
}

.status-info p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* =================== 최근 학습 =================== */
.course-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.course-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-5);
  box-shadow: var(--shadow-base);
  transition: all var(--transition-base);
}

.course-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}

.course-thumbnail {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.course-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--color-gray-200) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.course-info {
  flex: 1;
}

.course-info h4 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-2) 0;
  color: var(--text-primary);
}

.course-info p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0 0 var(--space-4) 0;
}

.progress-bar {
  height: 8px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
  transition: width var(--transition-base);
  border-radius: var(--radius-full);
}

.continue-button {
  padding: var(--space-3) var(--space-6);
  background: var(--accent-primary);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.continue-button:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* =================== 반응형 디자인 =================== */
@media (max-width: 768px) {
  .header-content {
    padding: var(--space-3) var(--space-4);
  }

  .app-name {
    display: none;
  }

  .logo {
    width: 40px;
    height: 40px;
  }

  .user-avatar,
  .user-avatar-placeholder {
    width: 32px;
    height: 32px;
  }

  .banner-wrapper {
    flex-direction: column;
    text-align: center;
    gap: var(--space-6);
  }

  .banner-illustration {
    display: none;
  }

  .banner-content h1 {
    font-size: var(--text-3xl);
  }

  .banner-content p {
    font-size: var(--text-base);
  }

  .section-title {
    font-size: var(--text-2xl);
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .action-card {
    padding: var(--space-6);
  }

  .action-icon {
    width: 56px;
    height: 56px;
  }

  .action-card h3 {
    font-size: var(--text-lg);
  }

  .action-card p {
    font-size: var(--text-sm);
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .status-card {
    padding: var(--space-5);
  }

  .status-info h3 {
    font-size: var(--text-2xl);
  }

  .quick-actions,
  .learning-status,
  .recent-courses {
    padding: var(--space-8) 0;
  }

  .course-item {
    flex-direction: column;
    text-align: center;
    padding: var(--space-5);
  }

  .course-info {
    text-align: center;
  }

  .continue-button {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .banner-content h1 {
    font-size: var(--text-2xl);
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .course-thumbnail {
    width: 80px;
    height: 80px;
  }
}

/* =================== 애니메이션 =================== */
.home-container {
  animation: fadeIn var(--transition-base) ease-out;
}

.action-card,
.status-card,
.course-item {
  animation: slideUp var(--transition-base) ease-out;
  animation-fill-mode: both;
}

.action-card:nth-child(1) { animation-delay: 0.1s; }
.action-card:nth-child(2) { animation-delay: 0.2s; }
.action-card:nth-child(3) { animation-delay: 0.3s; }
.action-card:nth-child(4) { animation-delay: 0.4s; }

.status-card:nth-child(1) { animation-delay: 0.1s; }
.status-card:nth-child(2) { animation-delay: 0.2s; }
.status-card:nth-child(3) { animation-delay: 0.3s; }
.status-card:nth-child(4) { animation-delay: 0.4s; }

/* =================== 접근성 =================== */
@media (prefers-reduced-motion: reduce) {
  .home-container,
  .action-card,
  .status-card,
  .course-item {
    animation: none;
  }

  .action-card:hover,
  .status-card:hover,
  .course-item:hover,
  .continue-button:hover {
    transform: none;
  }
}

/* 포커스 스타일 */
.action-card:focus-visible,
.menu-item:focus-visible,
.continue-button:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}
</style>