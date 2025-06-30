<template>
  <div class="certificate-generator">
    <!-- 수료증 미리보기 -->
    <div class="certificate-preview" v-if="certificateData">
      <CertificateTemplate
          :certificate-data="certificateData"
          @ready="onTemplateReady"
      />
    </div>

    <!-- 액션 버튼 -->
    <div class="action-buttons" v-if="certificateData">
      <button
          @click="downloadPDF"
          :disabled="isGenerating"
          class="btn-download"
      >
        <Download :size="20" />
        <span>{{ isGenerating ? '생성 중...' : 'PDF 다운로드' }}</span>
      </button>

      <button
          @click="printCertificate"
          :disabled="isGenerating"
          class="btn-print"
      >
        <Printer :size="20" />
        <span>인쇄하기</span>
      </button>

      <button
          @click="shareCertificate"
          class="btn-share"
      >
        <Share2 :size="20" />
        <span>공유하기</span>
      </button>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="isGenerating" class="loading-overlay">
      <Loader2 class="animate-spin" :size="48" />
      <p>수료증을 생성하고 있습니다...</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Download, Printer, Share2, Loader2 } from 'lucide-vue-next'
import CertificateTemplate from './CertificateTemplate.vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const props = defineProps({
  certificateData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['download', 'print', 'share'])

// 상태
const isGenerating = ref(false)
const templateElement = ref(null)

// 템플릿 준비 완료
const onTemplateReady = (element) => {
  templateElement.value = element
}

// PDF 다운로드
const downloadPDF = async () => {
  if (!templateElement.value || isGenerating.value) return

  isGenerating.value = true

  try {
    // HTML을 캔버스로 변환
    const canvas = await html2canvas(templateElement.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794, // A4 width in pixels at 96 DPI
      windowHeight: 1123 // A4 height in pixels at 96 DPI
    })

    // PDF 생성
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // 이미지를 PDF에 추가
    const imgWidth = 210 // A4 width in mm
    const imgHeight = 297 // A4 height in mm

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    // 파일명 생성
    const fileName = `수료증_${props.certificateData.userName}_${props.certificateData.certificateNumber}.pdf`

    // 다운로드
    pdf.save(fileName)

    emit('download', { success: true, fileName })
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    emit('download', { success: false, error: error.message })
  } finally {
    isGenerating.value = false
  }
}

// 인쇄
const printCertificate = () => {
  if (!templateElement.value) return

  // 새 창에서 수료증만 인쇄
  const printWindow = window.open('', '_blank')
  const certificateHTML = templateElement.value.outerHTML

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>수료증 인쇄</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Pretendard', -apple-system, sans-serif;
        }
        ${document.querySelector('style').textContent}
      </style>
    </head>
    <body>
      ${certificateHTML}
    </body>
    </html>
  `)

  printWindow.document.close()

  // 인쇄 다이얼로그 열기
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)

  emit('print', { success: true })
}

// 공유
const shareCertificate = async () => {
  if (!navigator.share) {
    alert('이 브라우저는 공유 기능을 지원하지 않습니다.')
    return
  }

  try {
    const shareData = {
      title: '수료증',
      text: `${props.certificateData.userName}님이 ${props.certificateData.courseName} 과정을 수료하였습니다.`,
      url: window.location.href
    }

    await navigator.share(shareData)
    emit('share', { success: true })
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('공유 오류:', error)
      emit('share', { success: false, error: error.message })
    }
  }
}
</script>

<style scoped>
.certificate-generator {
  position: relative;
}

/* 미리보기 영역 */
.certificate-preview {
  background: #f3f4f6;
  padding: 2rem;
  border-radius: 8px;
  overflow: auto;
  max-height: 80vh;
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-buttons button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-download {
  background: #667eea;
  color: white;
}

.btn-download:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-print {
  background: #67C23A;
  color: white;
}

.btn-print:hover:not(:disabled) {
  background: #529b2e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.btn-share {
  background: #8b5cf6;
  color: white;
}

.btn-share:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 50;
}

.loading-overlay p {
  color: white;
  font-size: 1.125rem;
  font-weight: 500;
}

.animate-spin {
  animation: spin 1s linear infinite;
  color: white;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .certificate-preview {
    padding: 1rem;
    max-height: 60vh;
  }

  .action-buttons {
    padding: 0 1rem;
  }

  .action-buttons button {
    flex: 1;
    min-width: 140px;
  }
}

/* 인쇄 스타일 */
@media print {
  .action-buttons,
  .loading-overlay {
    display: none !important;
  }

  .certificate-preview {
    background: white;
    padding: 0;
    max-height: none;
  }
}
</style>