<template>
  <div class="certificate-list-container">
    <!-- 헤더 -->
    <header class="page-header">
      <button @click="router.back()" class="back-button">
        <ArrowLeft :size="20" />
        <span>뒤로</span>
      </button>
      <h1 class="page-title">내 수료증</h1>
    </header>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-state">
      <Loader2 class="animate-spin" :size="48" />
      <p>수료증을 불러오는 중...</p>
    </div>

    <!-- 수료증 목록 -->
    <div v-else-if="certificates.length > 0" class="certificates-grid">
      <article
          v-for="certificate in certificates"
          :key="certificate.id"
          @click="viewCertificate(certificate.id)"
          class="certificate-card"
      >
        <!-- 수료증 미리보기 -->
        <div class="certificate-preview">
          <Award :size="48" class="certificate-icon" />
          <div class="certificate-badge">
            <CheckCircle :size="16" />
            <span>수료 완료</span>
          </div>
        </div>

        <!-- 수료증 정보 -->
        <div class="certificate-info">
          <h3 class="course-name">{{ certificate.courseName }}</h3>

          <div class="certificate-meta">
            <div class="meta-item">
              <Calendar :size="14" />
              <span>수료일: {{ formatDate(certificate.completedDate) }}</span>
            </div>
            <div class="meta-item">
              <FileText :size="14" />
              <span>번호: {{ certificate.certificateNumber }}</span>
            </div>
          </div>

          <div class="certificate-actions">
            <button
                @click.stop="downloadCertificate(certificate)"
                class="action-button download"
            >
              <Download :size="16" />
              <span>다운로드</span>
            </button>
            <button
                @click.stop="viewCertificate(certificate.id)"
                class="action-button view"
            >
              <Eye :size="16" />
              <span>상세보기</span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-state">
      <Award :size="64" class="empty-icon" />
      <h2>아직 수료증이 없습니다</h2>
      <p>강의를 완료하면 수료증을 받을 수 있습니다.</p>
      <button @click="router.push('/courses')" class="cta-button">
        <BookOpen :size="20" />
        <span>강의 둘러보기</span>
      </button>
    </div>

    <!-- 통계 카드 -->
    <div v-if="certificates.length > 0" class="stats-section">
      <h2 class="section-title">학습 성과</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <Award />
          </div>
          <div class="stat-content">
            <p class="stat-value">{{ certificates.length }}</p>
            <p class="stat-label">총 수료증</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <TrendingUp />
          </div>
          <div class="stat-content">
            <p class="stat-value">{{ thisYearCount }}</p>
            <p class="stat-label">올해 획득</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <Clock />
          </div>
          <div class="stat-content">
            <p class="stat-value">{{ recentCertificate }}</p>
            <p class="stat-label">최근 수료</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCertificateStore } from '@/stores/certificate'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import CertificateGenerator from '@/components/certificate/CertificateGenerator.vue'
import {
  ArrowLeft,
  Award,
  CheckCircle,
  Calendar,
  FileText,
  Download,
  Eye,
  BookOpen,
  Loader2,
  TrendingUp,
  Clock
} from 'lucide-vue-next'

const router = useRouter()
const certificateStore = useCertificateStore()
const authStore = useAuthStore()

// 상태
const isLoading = ref(true)
const showGenerator = ref(false)
const selectedCertificate = ref(null)

// 수료증 목록
const certificates = computed(() => certificateStore.userCertificates)

// 올해 획득한 수료증 수
const thisYearCount = computed(() => {
  const currentYear = new Date().getFullYear()
  return certificates.value.filter(cert => {
    const certYear = new Date(cert.issuedDate?.toDate?.() || cert.issuedDate).getFullYear()
    return certYear === currentYear
  }).length
})

// 최근 수료일
const recentCertificate = computed(() => {
  if (certificates.value.length === 0) return '-'

  const sorted = [...certificates.value].sort((a, b) => {
    const dateA = new Date(a.completedDate?.toDate?.() || a.completedDate)
    const dateB = new Date(b.completedDate?.toDate?.() || b.completedDate)
    return dateB - dateA
  })

  return formatDate(sorted[0].completedDate)
})

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 수료증 목록 로드
const loadCertificates = async () => {
  try {
    isLoading.value = true
    await certificateStore.loadUserCertificates(authStore.user.uid)
  } catch (error) {
    console.error('수료증 목록 로드 오류:', error)
    ElMessage.error('수료증 목록을 불러올 수 없습니다')
  } finally {
    isLoading.value = false
  }
}

// 수료증 상세보기
const viewCertificate = (certificateId) => {
  router.push(`/certificates/${certificateId}`)
}

// 수료증 다운로드
const downloadCertificate = async (certificate) => {
  selectedCertificate.value = certificate
  showGenerator.value = true

  // Generator 컴포넌트가 마운트되면 자동으로 다운로드
  setTimeout(() => {
    const generator = document.querySelector('.certificate-generator')
    if (generator) {
      generator.querySelector('.btn-download').click()
    }
    showGenerator.value = false
  }, 1000)
}

// 초기화
onMounted(() => {
  loadCertificates()
})
</script>

<style scoped>
.certificate-list-container {
  min-height: 100vh;
  background: #f9fafb;
}

/* 헤더 */
.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.loading-state p {
  color: #6b7280;
  font-size: 1.125rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
  color: #6b7280;
}

/* 수료증 그리드 */
.certificates-grid {
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* 수료증 카드 */
.certificate-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.certificate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.certificate-preview {
  position: relative;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.certificate-icon {
  color: white;
  opacity: 0.9;
}

.certificate-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.certificate-info {
  padding: 1.5rem;
}

.course-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.certificate-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.certificate-actions {
  display: flex;
  gap: 0.75rem;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.download {
  background: #2563eb;
  color: white;
}

.action-button.download:hover {
  background: #1d4ed8;
}

.action-button.view {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.action-button.view:hover {
  background: #e5e7eb;
  color: #1f2937;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4b5563;
  margin: 0 0 0.75rem 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.cta-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cta-button:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* 통계 섹션 */
.stats-section {
  padding: 0 2rem 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* 반응형 */
@media (max-width: 768px) {
  .certificates-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 숨겨진 생성기 */
.certificate-generator {
  position: fixed;
  top: -9999px;
  left: -9999px;
}
</style>