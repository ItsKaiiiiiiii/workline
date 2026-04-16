<template>
  <div v-if="show" class="user-profile-overlay" @click.self="handleClose">
    <div class="user-profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          {{ user?.nickname?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="profile-basic">
          <h3 class="profile-name">{{ user?.nickname || user?.username }}</h3>
          <p class="profile-email">{{ user?.email }}</p>
        </div>
        <button class="close-button" @click="handleClose">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="profile-content">
        <form class="profile-form" @submit.prevent="handleSave">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input
              v-model="formData.username"
              type="text"
              class="form-input"
              disabled
            />
          </div>

          <div class="form-group">
            <label class="form-label">昵称</label>
            <input
              v-model="formData.nickname"
              type="text"
              class="form-input"
              placeholder="请输入昵称"
            />
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              v-model="formData.email"
              type="email"
              class="form-input"
              disabled
            />
          </div>

          <div class="form-group">
            <label class="form-label">手机号（可选）</label>
            <input
              v-model="formData.phone"
              type="tel"
              class="form-input"
              placeholder="请输入手机号"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="handleClose">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <template v-if="isLoading">
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>保存中...</span>
              </template>
              <template v-else>
                保存
              </template>
            </button>
          </div>
        </form>

        <div class="profile-info">
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ formatDate(user?.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">更新时间</span>
            <span class="info-value">{{ formatDate(user?.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <div class="profile-footer">
        <button class="logout-button" @click="handleLogout">
          <LogOut class="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { X, LogOut, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
import type { User } from '../../types/auth';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const authStore = useAuthStore();
const router = useRouter();

const user = ref<User | null>(null);
const isLoading = ref(false);
const formData = ref({
  username: '',
  nickname: '',
  email: '',
  phone: '',
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    initForm();
  }
});

onMounted(() => {
  user.value = authStore.user;
});

function initForm() {
  user.value = authStore.user;
  if (user.value) {
    formData.value = {
      username: user.value.username,
      nickname: user.value.nickname || '',
      email: user.value.email,
      phone: user.value.phone || '',
    };
  }
}

async function handleSave() {
  isLoading.value = true;
  try {
    const success = await authStore.updateUser({
      nickname: formData.value.nickname || undefined,
      phone: formData.value.phone || undefined,
    });
    if (success) {
      emit('close');
    }
  } catch (err) {
    console.error('Failed to update user:', err);
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  emit('close');
}

function handleLogout() {
  authStore.logout();
  emit('close');
  router.push('/login');
}

function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
</script>

<style scoped>
.user-profile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.user-profile-card {
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.profile-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 16px 16px 0 0;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.3);
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-basic {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
}

.profile-email {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #ffffff;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.profile-content {
  padding: 24px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input:focus:not(:disabled) {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.profile-info {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.profile-footer {
  padding: 0 24px 24px;
}

.logout-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  border: none;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-button:hover {
  background: #fee2e2;
}
</style>
