<template>
  <transition name="toast">
    <div v-if="visible" class="toast" :class="`toast-${type}`">
      <div class="toast-icon">
        <i :class="iconClass"></i>
      </div>
      <div class="toast-message">{{ message }}</div>
      <button @click="handleClose" class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'success',
    validator: value => ['success', 'error', 'info', 'warning'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)

const iconClass = computed(() => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  }
  return icons[props.type]
})

const handleClose = () => {
  visible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}

onMounted(() => {
  visible.value = true

  if (props.duration > 0) {
    setTimeout(() => {
      handleClose()
    }, props.duration)
  }
})

watch(() => props.message, () => {
  // 메시지가 변경되면 토스트 재표시
  visible.value = false
  setTimeout(() => {
    visible.value = true
  }, 100)
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.75rem;
  z-index: 2000;
}

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
}

.toast-close {
  background: none;
  border: none;
  padding: 0.25rem;
  font-size: 1rem;
  color: #999;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: #666;
}

/* 타입별 스타일 */
.toast-success {
  border-left: 4px solid #4CAF50;
}

.toast-success .toast-icon {
  color: #4CAF50;
}

.toast-error {
  border-left: 4px solid #f44336;
}

.toast-error .toast-icon {
  color: #f44336;
}

.toast-info {
  border-left: 4px solid #2196F3;
}

.toast-info .toast-icon {
  color: #2196F3;
}

.toast-warning {
  border-left: 4px solid #ff9800;
}

.toast-warning .toast-icon {
  color: #ff9800;
}

/* 트랜지션 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

/* 반응형 */
@media (max-width: 768px) {
  .toast {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
}
</style>