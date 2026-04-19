<template>
  <div class="create-org-container">
    <div class="create-org-card">
      <div class="create-org-header">
        <div class="logo">
          <div class="logo-icon">
            <Building class="w-8 h-8 text-white" />
          </div>
          <h1 class="logo-text">创建组织</h1>
        </div>
        <p class="create-org-subtitle">开始使用 Workline，首先创建一个组织</p>
      </div>

      <form class="create-org-form" @submit.prevent="handleCreate">
        <div class="form-group">
          <label class="form-label">组织名称</label>
          <div class="input-wrapper">
            <Building class="input-icon w-5 h-5" />
            <input
              v-model="name"
              type="text"
              :class="['form-input', { 'input-error': fieldErrors.name }]"
              placeholder="请输入组织名称"
              required
            />
          </div>
          <p v-if="fieldErrors.name" class="error-text">{{ fieldErrors.name }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">组织描述（可选）</label>
          <div class="input-wrapper">
            <FileText class="input-icon w-5 h-5" />
            <textarea
              v-model="description"
              :class="['form-textarea', { 'input-error': fieldErrors.description }]"
              rows="3"
              placeholder="请输入组织描述"
            />
          </div>
          <p v-if="fieldErrors.description" class="error-text">{{ fieldErrors.description }}</p>
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <button
          type="submit"
          class="create-org-button"
          :disabled="isLoading || !name"
        >
          <template v-if="isLoading">
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>创建中...</span>
          </template>
          <template v-else>
            <span>创建组织</span>
          </template>
        </button>
      </form>

      <div class="create-org-footer">
        <p class="footer-text">稍后创建？</p>
        <button class="footer-link" @click="handleSkip">跳过此步</button>
      </div>
    </div>

    <div class="create-org-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>

    <Toast
      :show="showSuccessToast"
      :message="successMessage"
      type="success"
      @close="showSuccessToast = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Building, FileText, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
import type { ApiError } from '../../utils/api';
import Toast from '../common/Toast.vue';

const authStore = useAuthStore();
const router = useRouter();

const name = ref('');
const description = ref('');
const isLoading = ref(false);
const error = ref('');
const fieldErrors = ref<Record<string, string>>({});
const showSuccessToast = ref(false);
const successMessage = ref('');

async function handleCreate() {
  if (!name.value) return;

  isLoading.value = true;
  error.value = '';
  fieldErrors.value = {};

  try {
    const success = await authStore.createFirstOrganization({
      name: name.value,
      description: description.value || undefined,
    });

    if (success) {
      successMessage.value = '组织创建成功';
      showSuccessToast.value = true;
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  } catch (err: any) {
    console.error('Failed to create organization:', err);

    if (err.name === 'ApiError') {
      const apiErr = err as ApiError;
      error.value = apiErr.message;

      if (apiErr.data && typeof apiErr.data === 'object') {
        fieldErrors.value = apiErr.data as Record<string, string>;
      }
    } else {
      error.value = err.message || '创建组织失败，请稍后重试';
    }
  } finally {
    isLoading.value = false;
  }
}

function handleSkip() {
  // 跳过组织创建，但之后可能还需要检查
  authStore.needsOrganization = false;
  router.push('/');
}
</script>

<style scoped>
.create-org-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.create-org-card {
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.create-org-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.create-org-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.create-org-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.input-wrapper {
  position: relative;
  display: flex;
  align-items: flex-start;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 12px;
  color: #9ca3af;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 44px;
  font-size: 15px;
  color: #1f2937;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 12px 14px 12px 44px;
  font-size: 15px;
  color: #1f2937;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  resize: none;
  transition: all 0.2s;
}

.form-textarea:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea.input-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.form-textarea.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  margin: 0 0 8px 0;
}

.error-text {
  font-size: 12px;
  color: #ef4444;
  margin: 4px 0 0 0;
}

.create-org-button {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.create-org-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
}

.create-org-button:active:not(:disabled) {
  transform: translateY(0);
}

.create-org-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.create-org-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
}

.footer-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.footer-link {
  font-size: 14px;
  font-weight: 500;
  color: #3b82f6;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #2563eb;
}

.create-org-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  left: -100px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
