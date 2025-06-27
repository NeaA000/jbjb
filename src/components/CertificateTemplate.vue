<template>
  <div class="certificate-template" ref="certificateRef">
    <!-- 배경 패턴 -->
    <div class="certificate-background"></div>

    <!-- 수료증 내용 -->
    <div class="certificate-content">
      <!-- 헤더 -->
      <div class="certificate-header">
        <div class="logo-section">
          <img src="/logo.png" alt="Logo" class="certificate-logo">
        </div>
        <h1 class="certificate-title">수료증</h1>
        <p class="certificate-subtitle">Certificate of Completion</p>
      </div>

      <!-- 본문 -->
      <div class="certificate-body">
        <p class="certificate-label">이 수료증은</p>

        <h2 class="recipient-name">{{ certificateData.userName }}</h2>

        <p class="birth-date">{{ certificateData.birthDate }}</p>

        <p class="certificate-text">
          님이 아래의 교육과정을 성실히 이수하였음을 증명합니다.
        </p>

        <!-- 강의 정보 -->
        <div class="course-info">
          <div class="info-item">
            <span class="info-label">교육과정명</span>
            <span class="info-value">{{ certificateData.courseName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">수료일</span>
            <span class="info-value">{{ formatDate(certificateData.completedDate) }}</span>
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <div class="certificate-footer">
        <div class="issue-info">
          <p class="issue-date">{{ formatDate(certificateData.issuedDate) }}</p>
          <p class="certificate-number">수료증 번호: {{ certificateData.certificateNumber }}</p>
        </div>

        <div class="signature-section">
          <div class="organization">
            <p class="org-name">주식회사 데이터브릿지</p>
            <p class="org-title">대표이사</p>
            <div class="signature-line"></div>
            <div class="stamp-area">
              <span>인</span>
            </div>
          </div>
        </div>

        <!-- QR 코드 -->
        <div class="qr-section">
          <canvas ref="qrCanvas"></canvas>
          <p class="qr-text">검증용 QR</p>
        </div>
      </div>
    </div>

    <!-- 장식 테두리 -->
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
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// QR 코드 생성
const generateQRCode = async () => {
  if (!qrCanvas.value || !props.certificateData.qrCode) return

  try {
    await QRCode.toCanvas(qrCanvas.value, props.certificateData.qrCode, {
      width: 80,
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

// 컴포넌트가 준비되면 부모에게 알림
onMounted(() => {
  generateQRCode()
  emit('ready', certificateRef.value)
})

// certificateData 변경 시 QR 코드 재생성
watch(() => props.certificateData, () => {
  generateQRCode()
}, { deep: true })
</script>

<style scoped>
.certificate-template {
  position: relative;
  width: 210mm;
  height: 297mm;
  background: white;
  padding: 20mm;
  box-sizing: border-box;
  font-family: 'Noto Sans KR', sans-serif;
  overflow: hidden;
}

/* 배경 패턴 */
.certificate-background {
  position: absolute;
  inset: 0;
  background-image:
      repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.02) 35px, rgba(0,0,0,.02) 70px),
      repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(0,0,0,.02) 35px, rgba(0,0,0,.02) 70px);
  pointer-events: none;
}

/* 장식 테두리 */
.certificate-border {
  position: absolute;
  inset: 10mm;
  border: 3px solid #2563eb;
  border-radius: 8px;
  pointer-events: none;
}

.certificate-border::before {
  content: '';
  position: absolute;
  inset: 3mm;
  border: 1px solid #2563eb;
  border-radius: 6px;
  opacity: 0.5;
}

/* 수료증 내용 */
.certificate-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

/* 헤더 */
.certificate-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-section {
  margin-bottom: 30px;
}

.certificate-logo {
  height: 60px;
  width: auto;
}

.certificate-title {
  font-size: 48px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: 8px;
}

.certificate-subtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
  letter-spacing: 2px;
}

/* 본문 */
.certificate-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 0;
}

.certificate-label {
  font-size: 20px;
  color: #4b5563;
  margin: 0 0 20px 0;
}

.recipient-name {
  font-size: 42px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid #2563eb;
}

.birth-date {
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 30px 0;
}

.certificate-text {
  font-size: 20px;
  color: #374151;
  margin: 0 0 40px 0;
  line-height: 1.8;
}

/* 강의 정보 */
.course-info {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 30px 50px;
  margin: 20px 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 12px 0;
}

.info-label {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  min-width: 100px;
  text-align: right;
}

.info-value {
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
  text-align: left;
}

/* 푸터 */
.certificate-footer {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 40px;
  padding-top: 40px;
}

.issue-info {
  flex: 1;
}

.issue-date {
  font-size: 16px;
  color: #4b5563;
  margin: 0 0 8px 0;
}

.certificate-number {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 서명 섹션 */
.signature-section {
  flex: 1;
  display: flex;
  justify-content: center;
}

.organization {
  text-align: center;
  position: relative;
}

.org-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.org-title {
  font-size: 16px;
  color: #4b5563;
  margin: 0 0 20px 0;
}

.signature-line {
  width: 150px;
  height: 1px;
  background: #d1d5db;
  margin: 0 auto 8px;
}

.stamp-area {
  position: absolute;
  right: -30px;
  bottom: -10px;
  width: 60px;
  height: 60px;
  border: 2px solid #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #ef4444;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.9);
}

/* QR 섹션 */
.qr-section {
  position: absolute;
  right: 0;
  bottom: 0;
  text-align: center;
}

.qr-text {
  font-size: 10px;
  color: #9ca3af;
  margin: 4px 0 0 0;
}

/* 인쇄 최적화 */
@media print {
  .certificate-template {
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 20mm;
    page-break-after: always;
  }

  .certificate-background {
    opacity: 0.5;
  }

  .certificate-border {
    border-color: #2563eb !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .stamp-area {
    border-color: #ef4444 !important;
    color: #ef4444 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>