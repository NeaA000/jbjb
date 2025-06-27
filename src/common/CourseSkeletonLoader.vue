<!-- web/src/components/CourseSkeletonLoader.vue -->
<template>
  <div class="animate-pulse">
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- 썸네일 스켈레톤 -->
      <div class="aspect-video bg-gray-200"></div>

      <!-- 컨텐츠 스켈레톤 -->
      <div class="p-4">
        <!-- 카테고리 -->
        <div class="mb-2">
          <div class="h-5 bg-gray-200 rounded-full w-24"></div>
        </div>

        <!-- 제목 -->
        <div class="mb-2">
          <div class="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>

        <!-- 강사 및 평점 -->
        <div class="flex items-center justify-between mb-3">
          <div class="h-4 bg-gray-200 rounded w-20"></div>
          <div class="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        <!-- 메타 정보 -->
        <div class="flex items-center space-x-4 mb-4">
          <div class="h-3 bg-gray-200 rounded w-16"></div>
          <div class="h-3 bg-gray-200 rounded w-12"></div>
          <div class="h-3 bg-gray-200 rounded w-20"></div>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex gap-2">
          <div class="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div class="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 스켈레톤 로더는 props나 상태가 필요 없음
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>