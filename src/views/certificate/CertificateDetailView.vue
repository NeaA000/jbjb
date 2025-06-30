<!-- web/src/views/certificate/CertificateDetailView.vue -->
<template>
  <div class="certificate-detail-container">
    <!-- 헤더 -->
    <header class="page-header">
      <button @click="router.back()" class="back-button">
        <ArrowLeft :size="20" />
        <span>뒤로</span>
      </button>
      <h1 class="page-title">수료증 상세</h1>
    </header>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-state">
      <Loader2 class="animate-spin" :size="48" />
      <p>수료증을 불러오는 중...</p>
    </div>

    <!-- 수료증 내용 -->
    <div v-else-if="certificate" class="certificate-content">
      <!-- 수료증 생성기 -->
      <div class="certificate-preview-section">
        <CertificateGenerator
            :certificate-data="certificateData"
            @download="onDownload"
            @print="onPrint"
            @share="onShare"
        />
      </div>

      <!-- 수료증 정보 -->
      <div class="certificate-info-section">
        <div class="info-card">
          <h2 class="info-title">
            <FileText :size="20" />
            수료증 정보
          </h2>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">수료증 번호</span>
              <span class="info-value">{{ certificate.certificateNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">발급일</span>
              <span class="info-value">{{ formatDate(certificate.issuedDate) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">수료자</span>
              <span class="info-value">{{ certificate.userName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">생년월일</span>
              <span class="info-value">{{ certificate.birthDate }}</span>
            </div>
          </div>
        </div>

        <!-- 강의 정보 -->
        <div class="info-card">
          <h2 class="info-title">
            <BookOpen :size="20" />
            강의 정보
          </h2>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">강의명</span>
              <span class="info-value">{{ certificate.courseName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">수료일</span>
              <span class="info-value">{{ formatDate(certificate.completedDate) }}</span>
            </div>
            <div class="info-item" v-if="certificate.metadata?.courseCategory">
              <span class="info-label">카테고리</span>
              <span class="info-value">{{ certificate.metadata.courseCategory }}</span>
            </div>
            <div class="info-item" v-if="certificate.metadata?.courseDuration">
              <span class="info-label">교육 시간</span>
              <span class="info-value">{{ certificate.metadata.courseDuration }}</span>
            </div>
          </div>
        </div>

        <!-- 검증 정보 -->
        <div class="info-card">
          <h2 class="info-title">
            <Shield :size="20" />
            검증 정보
          </h2>

          <div class="verification-status">
            <CheckCircle :size="24" class="status-icon" />
            <div class="status-content">
              <p class="status-text">유효한 수료증</p>
              <p class="status-subtext">이 수료증은 정식으로 발급된 수료증입니다.</p>
            </div>
          </div>

          <button
              @click="verifyCertificate"
              class="verify-button"
              :disabled="isVerifying"
          >
            <Shield :size="16" />
            <span>{{ isVerifying ? '검증 중...' : '수료증 검증' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 오류 상태 -->
    <div v-else class="error-state">
      <AlertCircle :size="64" class="error-icon" />
      <h2>수료증을 찾을 수 없습니다</h2>
      <p>요청하신 수료증이 존재하지 않거나 접근 권한이 없습니다.</p>
      <button @click="router.push('/certificates')" class="back-to-list-button">
        <ArrowLeft :size="20" />
        <span>목록으로 돌아가기</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCertificateStore } from '@/stores/certificate'
import { useAuthStore } from '@/stores/auth'
import CertificateGenerator from '@/components/certificate/CertificateGenerator.vue'
import CertificateService from '@/services/certificateService'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const certificateStore = useCertificateStore()
const authStore = useAuthStore()

// 상태
const isLoading = ref(true)
const isVerifying = ref(false)
const certificate = ref(null)

// 수료증 ID
const certificateId = computed(() => route.params.id)

// Generator용 데이터
const certificateData = computed(() => {
  if (!certificate.value) return null
  return CertificateService.prepareCertificateData(certificate.value)
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

// 수료증 로드
const loadCertificate = async () => {
  try {
    isLoading.value = true

    // 스토어에서 먼저 찾기
    const cached = certificateStore.userCertificates.find(
        cert => cert.id === certificateId.value
    )

    if (cached) {
      certificate.value = cached
    } else {
      // 없으면 Firebase에서 로드
      const result = await certificateStore.loadCertificate(certificateId.value)
      if (result.success) {
        certificate.value = result.certificate
      } else {
        throw new Error(result.error || '수료증을 찾을 수 없습니다')
      }
    }

    // 권한 확인
    if (certificate.value.userId !== authStore.user.uid) {
      throw new Error('접근 권한이 없습니다')
    }
  } catch (error) {
    console.error('수료증 로드 오류:', error)
    certificate.value = null
  } finally {
    isLoading.value = false
  }
}

// 수료증 검증
const verifyCertificate = async () => {
  try {
    isVerifying.value = true
    const result = await certificateStore.verifyCertificate(certificateId.value)

    if (result.success && result.valid) {
      ElMessage.success('수료증이 정상적으로 검증되었습니다')
    } else {
      ElMessage.error('유효하지 않은 수료증입니다')
    }
  } catch (error) {
    ElMessage.error('검증 중 오류가 발생했습니다')
  } finally {
    isVerifying.value = false
  }
}

// 다운로드 핸들러
const onDownload = (result) => {
  if (result.success) {
    ElMessage.success('수료증이 다운로드되었습니다')
  } else {
    ElMessage.error('다운로드 중 오류가 발생했습니다')
  }
}

// 인쇄 핸들러
const onPrint = (result) => {
  if (result.success) {
    ElMessage.success('인쇄 준비가 완료되었습니다')
  }
}

// 공유 핸들러
const onShare = (result) => {
  if (result.success) {
    ElMessage.success('공유되었습니다')
  }
}

// 마운트
onMounted(() => {
  loadCertificate()
})
</script>

<style scoped>
.certificate-detail-container {
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

/* 수료증 내용 */
.certificate-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 수료증 미리보기 섹션 */
.certificate-preview-section {
  margin-bottom: 2rem;
}

/* 정보 섹션 */
.certificate-info-section {
  display: grid;
  gap: 1.5rem;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}

/* 검증 상태 */
.verification-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.status-icon {
  color: #10b981;
  flex-shrink: 0;
}

.status-content {
  flex: 1;
}

.status-text {
  font-weight: 600;
  color: #059669;
  margin: 0 0 0.25rem 0;
}

.status-subtext {
  font-size: 0.875rem;
  color: #047857;
  margin: 0;
}

.verify-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.verify-button:hover:not(:disabled) {
  background: #5a67d8;
}

.verify-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 오류 상태 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1.5rem;
}

.error-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.error-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.back-to-list-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-to-list-button:hover {
  background: #5a67d8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 반응형 */
@media (max-width: 768px) {
  .certificate-content {
    padding: 1rem;
  }

  .info-grid {
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
</style>