<template>
  <Teleport to="body">
    <div v-if="show" class="toast-container">
      <div class="toast" :class="type">
        <component :is="iconComponent" class="toast-icon w-5 h-5" />
        <span class="toast-message">{{ message }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-vue-next';

const props = defineProps<{
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}>();

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return XCircle;
    case 'warning':
      return AlertCircle;
    default:
      return Info;
  }
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    visible.value = true;

    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    hideTimer = setTimeout(() => {
      visible.value = false;
      emit('close');
    }, props.duration || 3000);
  } else {
    visible.value = false;
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
  }
});

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
  min-width: 300px;
}

.toast.success .toast-icon {
  color: #10b981;
}

.toast.error .toast-icon {
  color: #ef4444;
}

.toast.warning .toast-icon {
  color: #f59e0b;
}

.toast.info .toast-icon {
  color: #3b82f6;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}
</style>
