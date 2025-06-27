<!-- web/src/views/learning/VideoWarningView.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <!-- 경고 카드 -->
      <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <!-- 경고 아이콘 -->
        <div class="flex justify-center mb-6">
          <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle class="w-12 h-12 text-red-600" />
          </div>
        </div>

        <!-- 제목 -->
        <h1 class="text-3xl font-bold text-center text-gray-900 mb-2">
          안전 교육 수강 전 필수 확인사항
        </h1>
        <p class="text-center text-gray-600 mb-8">
          안전한 교육 수강을 위해 아래 내용을 반드시 확인해주세요
        </p>

        <!-- 경고 사항 -->
        <div class="space-y-4 mb-8">
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div class="flex items-start">
              <Ban class="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 class="font-semibold text-red-900 mb-1">
                  작업 중 교육 수강 절대 금지
                </h3>
                <p class="text-red-700 text-sm">
                  기계 조작, 운전, 높은 곳 작업 등 위험한 작업 중에는 절대 교육을 수강하지 마세요.
                  사고의 위험이 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div class="flex items-start">
              <Smartphone class="w-6 h-6 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 class="font-semibold text-orange-900 mb-1">
                  기기 흔들림 자동 감지
                </h3>
                <p class="text-orange-700 text-sm">
                  이동 중이거나 기기가 흔들리면 자동으로 재생이 일시정지됩니다.
                  안전한 장소에서 정지한 상태로 수강해주세요.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div class="flex items-start">
              <Eye class="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 class="font-semibold text-blue-900 mb-1">
                  집중하여 수강하기
                </h3>
                <p class="text-blue-700 text-sm">
                  안전 교육은 여러분의 생명과 직결됩니다.
                  다른 일을 하지 말고 교육 내용에 집중해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 체크리스트 -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 class="font-semibold text-gray-900 mb-4">수강 전 체크리스트</h3>
          <div class="space-y-3">
            <label
                v-for="(item, index) in checkItems"
                :key="index"
                class="flex items-start cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <input
                  type="checkbox"
                  v-model="item.checked"
                  class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-0.5"
              />
              <span class="ml-3 text-gray-700">{{ item.text }}</span>
            </label>
          </div>
        </div>

        <!-- 강의 정보 -->
        <div v-if="course" class="bg-gray-100 rounded-lg p-4 mb-6">
          <div class="flex items-center space-x-3">
            <PlayCircle class="w-8 h-8 text-gray-600" />
            <div class="flex-1">
              <p class="text-sm text-gray-600">수강 예정 강의</p>
              <h4 class="font-semibold text-gray-900">{{ course.title }}</h4>
            </div>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
              @click="router.back()"
              class="flex-1 px-6 py-3 text-gray-700 bg-gray-200 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            돌아가기
          </button>
          <button
              @click="proceedToLearning"
              :disabled="!allChecked"
              :class="[
              'flex-1 px-6 py-3 font-medium rounded-lg transition-colors inline-flex items-center justify-center',
              allChecked
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            <Shield class="w-5 h-5 mr-2" />
            안전하게 수강하기
          </button>
        </div>

        <!-- 추가 안내 -->
        <p class="text-center text-sm text-gray-500 mt-6">
          본 안전 교육은 산업안전보건법에 따라 실시되는 법정 의무교육입니다.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import {
  AlertTriangle,
  Ban,
  Smartphone,
  Eye,
  PlayCircle,
  Shield
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

// 상태
const course = ref(null)
const checkItems = ref([
  {
    text: '현재 안전한 장소에 있으며, 작업 중이 아닙니다.',
    checked: false
  },
  {
    text: '이동 중이 아니며, 정지한 상태입니다.',
    checked: false
  },
  {
    text: '교육 내용에 집중할 수 있는 환경입니다.',
    checked: false
  },
  {
    text: '기기 흔들림 시 자동 정지됨을 이해했습니다.',
    checked: false
  }
])

// 모든 항목 체크 여부
const allChecked = computed(() => {
  return checkItems.value.every(item => item.checked)
})

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
/* 체크박스 스타일 */
input[type="checkbox"] {
  cursor: pointer;
}

input[type="checkbox"]:checked {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* 애니메이션 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>