<!-- components/common/LoadingSpinner.vue -->
<template>
  <div class="loading-spinner flex items-center justify-center">
    <el-icon class="text-3xl animate-spin text-blue-500">
      <Loading />
    </el-icon>
    <span v-if="message" class="ml-2">{{ message }}</span>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

// Props 정의 - JavaScript 방식
defineProps({
  message: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
/* Tailwind 애니메이션이 없는 경우를 위한 폴백 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>