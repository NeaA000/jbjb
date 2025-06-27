<!-- web/src/views/learning/VideoWarningView.vue -->
<template>
  <div class="warning-container">
    <!-- 헤더 (HomeView와 동일한 스타일) -->
    <header class="warning-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo">
            <AlertTriangle class="logo-icon" />
          </div>
          <span class="app-name">안전 교육 경고</span>
        </div>

        <!-- 언어 선택 -->
        <el-dropdown @command="handleLanguageChange" trigger="click">
          <div class="language-selector">
            <Globe :size="20" />
            <span>{{ currentLanguageCode }}</span>
            <ChevronDown :size="16" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                  v-for="(name, code) in languages"
                  :key="code"
                  :command="code"
                  :disabled="code === currentLanguage"
              >
                <div class="language-option">
                  <span class="language-flag">{{ getLanguageFlag(code) }}</span>
                  <span>{{ name }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 경고 배너 (HomeView 스타일) -->
    <section class="warning-banner">
      <div class="container">
        <div class="banner-content">
          <h1>{{ getLocalizedText('title') }}</h1>
          <p>{{ getLocalizedText('subtitle') }}</p>
        </div>
      </div>
    </section>

    <!-- 메인 콘텐츠 -->
    <div class="main-content">
      <div class="container">
        <!-- 경고 사항 카드들 -->
        <section class="warnings-section">
          <div class="warning-grid">
            <!-- 작업 중 교육 금지 -->
            <div class="warning-card danger">
              <div class="card-icon">
                <Ban :size="32" />
              </div>
              <h3>{{ getLocalizedText('warning1Title') }}</h3>
              <p>{{ getLocalizedText('warning1Text') }}</p>
            </div>

            <!-- 기기 흔들림 감지 -->
            <div class="warning-card caution">
              <div class="card-icon">
                <Smartphone :size="32" />
              </div>
              <h3>{{ getLocalizedText('warning2Title') }}</h3>
              <p>{{ getLocalizedText('warning2Text') }}</p>
            </div>

            <!-- 집중하여 수강 -->
            <div class="warning-card info">
              <div class="card-icon">
                <Eye :size="32" />
              </div>
              <h3>{{ getLocalizedText('warning3Title') }}</h3>
              <p>{{ getLocalizedText('warning3Text') }}</p>
            </div>
          </div>
        </section>

        <!-- 체크리스트 섹션 -->
        <section class="checklist-section">
          <h2 class="section-title">{{ getLocalizedText('checklistTitle') }}</h2>
          <div class="checklist-card">
            <div class="checklist-items">
              <label
                  v-for="(item, index) in checkItems"
                  :key="index"
                  class="checklist-item"
                  :class="{ checked: item.checked }"
              >
                <div class="checkbox-wrapper">
                  <input
                      type="checkbox"
                      v-model="item.checked"
                      :id="`check-${index}`"
                      class="checkbox-input"
                  />
                  <div class="checkbox-custom">
                    <Check v-if="item.checked" class="check-icon" />
                  </div>
                </div>
                <span class="checkbox-label">{{ getLocalizedText(item.textKey) }}</span>
              </label>
            </div>

            <!-- 강의 정보 (체크리스트 내부) -->
            <div v-if="course" class="course-info-box">
              <div class="course-icon">
                <PlayCircle :size="24" />
              </div>
              <div class="course-details">
                <span class="course-label">{{ getLocalizedText('courseLabel') }}</span>
                <h4 class="course-title">{{ course.title }}</h4>
              </div>
            </div>
          </div>
        </section>

        <!-- 액션 버튼 섹션 -->
        <section class="action-section">
          <button
              @click="router.back()"
              class="action-button secondary"
          >
            <ArrowLeft :size="20" />
            {{ getLocalizedText('backButton') }}
          </button>
          <button
              @click="proceedToLearning"
              :disabled="!allChecked"
              class="action-button primary"
              :class="{ disabled: !allChecked }"
          >
            <Shield :size="20" />
            {{ getLocalizedText('proceedButton') }}
          </button>
        </section>

        <!-- 푸터 정보 -->
        <p class="footer-note">
          {{ getLocalizedText('footerNote') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage } from 'element-plus'
import {
  AlertTriangle,
  Ban,
  Smartphone,
  Eye,
  PlayCircle,
  Shield,
  Check,
  ArrowLeft,
  Globe,
  ChevronDown
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

// Props
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

// 다국어 지원
const languages = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  vi: 'Tiếng Việt',
  th: 'ไทย'
}

// 현재 언어
const currentLanguage = ref(localStorage.getItem('language') || 'ko')
const currentLanguageCode = computed(() => currentLanguage.value.toUpperCase())

// 언어별 텍스트
const translations = {
  ko: {
    title: '안전 교육 수강 전 필수 확인사항',
    subtitle: '안전한 교육 수강을 위해 아래 내용을 반드시 확인해주세요',
    warning1Title: '작업 중 교육 수강 절대 금지',
    warning1Text: '기계 조작, 운전, 높은 곳 작업 등 위험한 작업 중에는 절대 교육을 수강하지 마세요.',
    warning2Title: '기기 흔들림 자동 감지',
    warning2Text: '이동 중이거나 기기가 흔들리면 자동으로 재생이 일시정지됩니다.',
    warning3Title: '집중하여 수강하기',
    warning3Text: '안전 교육은 여러분의 생명과 직결됩니다. 다른 일을 하지 말고 교육 내용에 집중해주세요.',
    checklistTitle: '수강 전 체크리스트',
    check1: '현재 안전한 장소에 있으며, 작업 중이 아닙니다.',
    check2: '이동 중이 아니며, 정지한 상태입니다.',
    check3: '교육 내용에 집중할 수 있는 환경입니다.',
    check4: '기기 흔들림 시 자동 정지됨을 이해했습니다.',
    courseLabel: '수강 예정 강의',
    backButton: '돌아가기',
    proceedButton: '안전하게 수강하기',
    footerNote: '본 안전 교육은 산업안전보건법에 따라 실시되는 법정 의무교육입니다.'
  },
  en: {
    title: 'Essential Safety Check Before Training',
    subtitle: 'Please check the following for safe training',
    warning1Title: 'No Training During Work',
    warning1Text: 'Never take training during dangerous work such as operating machinery, driving, or working at heights.',
    warning2Title: 'Automatic Device Shake Detection',
    warning2Text: 'Playback will automatically pause if you are moving or the device shakes.',
    warning3Title: 'Focus on Training',
    warning3Text: 'Safety training is directly related to your life. Please focus on the training content without doing other things.',
    checklistTitle: 'Pre-Training Checklist',
    check1: 'I am currently in a safe place and not working.',
    check2: 'I am not moving and in a stationary state.',
    check3: 'I am in an environment where I can focus on the training.',
    check4: 'I understand that playback will stop automatically when the device shakes.',
    courseLabel: 'Scheduled Course',
    backButton: 'Go Back',
    proceedButton: 'Start Training Safely',
    footerNote: 'This safety training is mandatory legal training conducted in accordance with the Occupational Safety and Health Act.'
  },
  zh: {
    title: '培训前必须确认的安全事项',
    subtitle: '为了安全的培训，请务必确认以下内容',
    warning1Title: '工作中绝对禁止参加培训',
    warning1Text: '在操作机械、驾驶、高处作业等危险工作中，绝对不要参加培训。',
    warning2Title: '设备摇晃自动检测',
    warning2Text: '如果您在移动中或设备摇晃，播放将自动暂停。',
    warning3Title: '集中精力参加培训',
    warning3Text: '安全培训直接关系到您的生命。请不要做其他事情，集中精力学习培训内容。',
    checklistTitle: '培训前检查清单',
    check1: '我目前在安全的地方，没有在工作。',
    check2: '我没有在移动，处于静止状态。',
    check3: '我在可以集中精力学习培训内容的环境中。',
    check4: '我理解设备摇晃时会自动停止播放。',
    courseLabel: '预定课程',
    backButton: '返回',
    proceedButton: '安全开始培训',
    footerNote: '本安全培训是根据产业安全保健法实施的法定义务培训。'
  },
  vi: {
    title: 'Kiểm tra An toàn Bắt buộc Trước khi Đào tạo',
    subtitle: 'Vui lòng kiểm tra nội dung dưới đây để đào tạo an toàn',
    warning1Title: 'Tuyệt đối Cấm Đào tạo Trong khi Làm việc',
    warning1Text: 'Tuyệt đối không tham gia đào tạo trong khi thực hiện công việc nguy hiểm.',
    warning2Title: 'Tự động Phát hiện Rung lắc Thiết bị',
    warning2Text: 'Phát lại sẽ tự động tạm dừng nếu bạn đang di chuyển hoặc thiết bị rung lắc.',
    warning3Title: 'Tập trung vào Đào tạo',
    warning3Text: 'Đào tạo an toàn liên quan trực tiếp đến tính mạng của bạn.',
    checklistTitle: 'Danh sách Kiểm tra Trước Đào tạo',
    check1: 'Tôi đang ở nơi an toàn và không đang làm việc.',
    check2: 'Tôi không di chuyển và ở trạng thái đứng yên.',
    check3: 'Tôi ở trong môi trường có thể tập trung vào đào tạo.',
    check4: 'Tôi hiểu rằng phát lại sẽ tự động dừng khi thiết bị rung lắc.',
    courseLabel: 'Khóa học Dự kiến',
    backButton: 'Quay lại',
    proceedButton: 'Bắt đầu Đào tạo An toàn',
    footerNote: 'Đào tạo an toàn này là đào tạo pháp lý bắt buộc.'
  },
  th: {
    title: 'การตรวจสอบความปลอดภัยที่จำเป็นก่อนการฝึกอบรม',
    subtitle: 'กรุณาตรวจสอบเนื้อหาด้านล่างเพื่อการฝึกอบรมที่ปลอดภัย',
    warning1Title: 'ห้ามฝึกอบรมขณะทำงานโดยเด็ดขาด',
    warning1Text: 'อย่าเข้ารับการฝึกอบรมขณะทำงานอันตราย',
    warning2Title: 'การตรวจจับการสั่นของอุปกรณ์อัตโนมัติ',
    warning2Text: 'การเล่นจะหยุดชั่วคราวโดยอัตโนมัติหากคุณกำลังเคลื่อนที่',
    warning3Title: 'มุ่งเน้นการฝึกอบรม',
    warning3Text: 'การฝึกอบรมด้านความปลอดภัยเกี่ยวข้องโดยตรงกับชีวิตของคุณ',
    checklistTitle: 'รายการตรวจสอบก่อนการฝึกอบรม',
    check1: 'ฉันอยู่ในสถานที่ปลอดภัยและไม่ได้ทำงานอยู่',
    check2: 'ฉันไม่ได้เคลื่อนที่และอยู่ในสภาพนิ่ง',
    check3: 'ฉันอยู่ในสภาพแวดล้อมที่สามารถมุ่งเน้นการฝึกอบรมได้',
    check4: 'ฉันเข้าใจว่าการเล่นจะหยุดโดยอัตโนมัติเมื่ออุปกรณ์สั่น',
    courseLabel: 'หลักสูตรที่กำหนด',
    backButton: 'กลับ',
    proceedButton: 'เริ่มการฝึกอบรมอย่างปลอดภัย',
    footerNote: 'การฝึกอบรมด้านความปลอดภัยนี้เป็นการฝึกอบรมตามกฎหมาย'
  }
}

// 상태
const course = ref(null)
const checkItems = ref([
  {
    textKey: 'check1',
    checked: false
  },
  {
    textKey: 'check2',
    checked: false
  },
  {
    textKey: 'check3',
    checked: false
  },
  {
    textKey: 'check4',
    checked: false
  }
])

// 모든 항목 체크 여부
const allChecked = computed(() => {
  return checkItems.value.every(item => item.checked)
})

// 언어별 텍스트 가져오기
const getLocalizedText = (key) => {
  return translations[currentLanguage.value]?.[key] || translations['ko'][key]
}

// 언어 플래그 가져오기
const getLanguageFlag = (code) => {
  const flags = {
    ko: '🇰🇷',
    en: '🇺🇸',
    zh: '🇨🇳',
    vi: '🇻🇳',
    th: '🇹🇭'
  }
  return flags[code] || '🌐'
}

// 언어 변경 핸들러
const handleLanguageChange = (command) => {
  currentLanguage.value = command
  localStorage.setItem('language', command)
  ElMessage.success(`${languages[command]}로 변경되었습니다`)
}

// 강의 정보 로드
const loadCourse = async () => {
  try {
    course.value = await courseStore.getCourseById(props.id)
    if (!course.value) {
      course.value = courseStore.courses.find(c => c.id === props.id)
    }
  } catch (error) {
    console.error('강의 정보 로드 실패:', error)
  }
}

// 학습 진행
const proceedToLearning = () => {
  if (!allChecked.value) return

  // 학습 화면으로 이동
  router.push(`/learning/${props.id}`)
}

// 마운트
onMounted(() => {
  loadCourse()
})
</script>

<style scoped>
/* =================== CSS 변수 Import =================== */
@import '@/assets/main.css';

/* =================== 컨테이너 =================== */
.warning-container {
  min-height: 100vh;
  background: var(--bg-primary, #ffffff);
}

.container {
  max-width: var(--container-xl, 1200px);
  margin: 0 auto;
  padding: 0 var(--space-6, 24px);
}

/* =================== 헤더 (HomeView 스타일) =================== */
.warning-header {
  background: var(--bg-secondary, #f8f9fa);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky, 100);
  border-bottom: 1px solid var(--border-primary, #e9ecef);
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
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.logo-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.app-name {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

/* 언어 선택기 */
.language-selector {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
  border: 2px solid transparent;
  color: var(--text-primary);
}

.language-selector:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-primary);
}

.language-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.language-flag {
  font-size: 20px;
}

/* =================== 경고 배너 (HomeView 스타일) =================== */
.warning-banner {
  background: linear-gradient(135deg, var(--accent-primary, #667eea) 0%, #764ba2 100%);
  color: white;
  padding: var(--space-12) 0;
  position: relative;
  overflow: hidden;
}

.warning-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.banner-content {
  text-align: center;
  position: relative;
  z-index: 1;
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

/* =================== 메인 콘텐츠 =================== */
.main-content {
  padding: var(--space-12) 0;
}

/* =================== 경고 카드 그리드 =================== */
.warnings-section {
  margin-bottom: var(--space-12);
}

.warning-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

.warning-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.warning-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transform: scaleX(0);
  transition: transform var(--transition-base);
}

.warning-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.warning-card:hover::before {
  transform: scaleX(1);
}

/* 카드 타입별 색상 */
.warning-card.danger {
  border-color: rgba(245, 108, 108, 0.3);
}

.warning-card.danger::before {
  background: linear-gradient(90deg, #f56c6c 0%, #ef4444 100%);
}

.warning-card.danger .card-icon {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%);
  color: #f56c6c;
}

.warning-card.caution {
  border-color: rgba(230, 162, 60, 0.3);
}

.warning-card.caution::before {
  background: linear-gradient(90deg, #e6a23c 0%, #f59e0b 100%);
}

.warning-card.caution .card-icon {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%);
  color: #e6a23c;
}

.warning-card.info {
  border-color: rgba(64, 158, 255, 0.3);
}

.warning-card.info::before {
  background: linear-gradient(90deg, #409eff 0%, #3b82f6 100%);
}

.warning-card.info .card-icon {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
  color: #409eff;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-5);
}

.warning-card h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--space-3) 0;
  color: var(--text-primary);
}

.warning-card p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

/* =================== 체크리스트 섹션 =================== */
.checklist-section {
  margin-bottom: var(--space-12);
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-8) 0;
}

.checklist-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-base);
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.checklist-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-primary);
}

.checklist-item.checked {
  background: rgba(103, 194, 58, 0.05);
  border-color: rgba(103, 194, 58, 0.3);
}

/* 체크박스 스타일 */
.checkbox-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-custom {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  width: 24px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 50%;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-input:checked ~ .checkbox-custom {
  background-color: var(--color-success, #67c23a);
  border-color: var(--color-success, #67c23a);
}

.check-icon {
  width: 14px;
  height: 14px;
  color: white;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.checkbox-input:checked ~ .checkbox-custom .check-icon {
  opacity: 1;
}

.checkbox-label {
  color: var(--text-primary);
  font-size: var(--text-base);
  line-height: 1.6;
  user-select: none;
}

/* 강의 정보 박스 */
.course-info-box {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: linear-gradient(135deg, var(--accent-primary) 0%, #764ba2 100%);
  border-radius: var(--radius-lg);
  color: white;
  margin-top: var(--space-6);
}

.course-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.course-details {
  flex: 1;
  min-width: 0;
}

.course-label {
  font-size: var(--text-sm);
  opacity: 0.9;
  margin: 0 0 var(--space-1) 0;
}

.course-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =================== 액션 섹션 =================== */
.action-section {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.action-button {
  flex: 1;
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.action-button.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-primary);
}

.action-button.secondary:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-button.primary {
  background: var(--accent-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.action-button.primary:hover:not(.disabled) {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* =================== 푸터 노트 =================== */
.footer-note {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* =================== 애니메이션 =================== */
.warning-card,
.checklist-card {
  animation: slideUp var(--transition-base) ease-out;
  animation-fill-mode: both;
}

.warning-card:nth-child(1) { animation-delay: 0.1s; }
.warning-card:nth-child(2) { animation-delay: 0.2s; }
.warning-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

  .banner-content h1 {
    font-size: var(--text-3xl);
  }

  .banner-content p {
    font-size: var(--text-base);
  }

  .warning-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .checklist-card {
    padding: var(--space-5);
  }

  .action-section {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }

  .section-title {
    font-size: var(--text-2xl);
  }
}

/* =================== 접근성 =================== */
@media (prefers-reduced-motion: reduce) {
  .warning-card,
  .checklist-card {
    animation: none;
  }

  .warning-card:hover,
  .action-button:hover {
    transform: none;
  }
}

.action-button:focus-visible,
.checklist-item:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}
</style>