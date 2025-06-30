<template>
  <div ref="certificateRef" class="certificate-template">
    <!-- 배경 패턴 -->
    <div class="certificate-background"></div>

    <!-- 메인 컨텐츠 -->
    <div class="certificate-content">
      <!-- 헤더 -->
      <div class="certificate-header">
        <div class="logo-section">
          <img src="/logo.png" alt="Logo" class="company-logo" />
        </div>
        <h1 class="certificate-title">수료증</h1>
        <p class="certificate-subtitle">Certificate of Completion</p>
      </div>

      <!-- 수료자 정보 -->
      <div class="recipient-section">
        <p class="recipient-label">이 수료증은</p>
        <h2 class="recipient-name">{{ certificateData.userName }}</h2>
        <p class="recipient-birthdate">{{ certificateData.birthDate }}</p>
        <p class="recipient-label">님이</p>
      </div>

      <!-- 강의 정보 -->
      <div class="course-section">
        <h3 class="course-name">{{ certificateData.courseName }}</h3>
        <p class="course-description">
          과정을 성공적으로 이수하였음을 증명합니다.
        </p>
      </div>

      <!-- 수료 정보 -->
      <div class="completion-info">
        <div class="info-item">
          <span class="info-label">수료일</span>
          <span class="info-value">{{ formatDate(certificateData.completedDate) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">수료번호</span>
          <span class="info-value">{{ certificateData.certificateNumber }}</span>
        </div>
      </div>

      <!-- 발급 정보 -->
      <div class="issuer-section">
        <div class="issue-date">
          <p>{{ formatDate(certificateData.issuedDate) }}</p>
        </div>
        <div class="issuer-info">
          <p class="issuer-name">{{ certificateData.issuerName }}</p>
          <p class="issuer-title">{{ certificateData.issuerTitle }}</p>
          <div class="signature-line"></div>
        </div>
      </div>

      <!-- QR 코드 -->
      <div class="qr-section">
        <canvas ref="qrCanvas"></canvas>
        <p class="qr-text">검증용 QR 코드</p>
      </div>
    </div>

    <!-- 장식 요소 -->
    <div class="certificate-border"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  certificateData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['ready'])

const certificateRef = ref(null)
const qrCanvas = ref(null)

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

// QR 코드 생성
const generateQRCode = async () => {
  if (!qrCanvas.value || !props.certificateData.qrCode) return

  try {
    await QRCode.toCanvas(qrCanvas.value, props.certificateData.qrCode, {
      width: 100,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('QR 코드 생성 오류:', error)
  }
}

// 마운트 시
onMounted(() => {
  generateQRCode()
  // 부모 컴포넌트에 준비 완료 알림
  emit('ready', certificateRef.value)
})

// 데이터 변경 감지
watch(() => props.certificateData, () => {
  generateQRCode()
}, { deep: true })
</script>

<style scoped>
.certificate-template {
  width: 210mm;
  height: 297mm;
  background: white;
  position: relative;
  padding: 40mm 30mm;
  font-family: 'Pretendard', -apple-system, sans-serif;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

/* 배경 패턴 */
.certificate-background {
  position: absolute;
  inset: 0;
  background-image:
      repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(102, 126, 234, 0.03) 10px, rgba(102, 126, 234, 0.03) 20px),
      repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(103, 194, 58, 0.03) 10px, rgba(103, 194, 58, 0.03) 20px);
  pointer-events: none;
}

/* 테두리 장식 */
.certificate-border {
  position: absolute;
  inset: 20mm;
  border: 3px solid #667eea;
  border-radius: 8px;
  pointer-events: none;
}

.certificate-border::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid #67C23A;
  border-radius: 4px;
  opacity: 0.5;
}

/* 컨텐츠 */
.certificate-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 헤더 */
.certificate-header {
  text-align: center;
  margin-bottom: 30mm;
}

.logo-section {
  margin-bottom: 20px;
}

.company-logo {
  height: 60px;
  width: auto;
}

.certificate-title {
  font-size: 48px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  letter-spacing: 8px;
}

.certificate-subtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 10px 0 0;
  letter-spacing: 2px;
}

/* 수료자 정보 */
.recipient-section {
  text-align: center;
  margin-bottom: 30mm;
}

.recipient-label {
  font-size: 20px;
  color: #4b5563;
  margin: 0;
}

.recipient-name {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 15px 0 10px;
  padding-bottom: 10px;
  border-bottom: 3px solid #667eea;
  display: inline-block;
}

.recipient-birthdate {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 15px;
}

/* 강의 정보 */
.course-section {
  text-align: center;
  margin-bottom: 30mm;
}

.course-name {
  font-size: 28px;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 15px;
}

.course-description {
  font-size: 20px;
  color: #4b5563;
  margin: 0;
  line-height: 1.6;
}

/* 수료 정보 */
.completion-info {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-bottom: 40mm;
}

.info-item {
  text-align: center;
}

.info-label {
  display: block;
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 5px;
}

.info-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

/* 발급 정보 */
.issuer-section {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
}

.issue-date {
  font-size: 16px;
  color: #6b7280;
}

.issuer-info {
  text-align: center;
}

.issuer-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 5px;
}

.issuer-title {
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 20px;
}

.signature-line {
  width: 200px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 auto;
}

/* QR 코드 */
.qr-section {
  position: absolute;
  bottom: 30mm;
  right: 30mm;
  text-align: center;
}

.qr-text {
  font-size: 12px;
  color: #9ca3af;
  margin: 5px 0 0;
}

/* 인쇄 최적화 */
@media print {
  .certificate-template {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
  }
}
</style>