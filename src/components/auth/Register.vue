<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo">
          <div class="logo-icon">
            <Workflow class="w-8 h-8 text-white" />
          </div>
          <h1 class="logo-text">Workline</h1>
        </div>
        <p class="register-subtitle">创建您的账号</p>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <User class="input-icon w-5 h-5" />
            <input
              v-model="username"
              type="text"
              :class="['form-input', { 'input-error': fieldErrors.username }]"
              placeholder="请输入用户名 (3-50字符)"
              required
            />
          </div>
          <p v-if="fieldErrors.username" class="error-text">{{ fieldErrors.username }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">真实姓名（可选）</label>
          <div class="input-wrapper">
            <User class="input-icon w-5 h-5" />
            <input
              v-model="realName"
              type="text"
              class="form-input"
              placeholder="请输入真实姓名"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <div class="input-wrapper">
            <Mail class="input-icon w-5 h-5" />
            <input
              v-model="email"
              type="email"
              :class="['form-input', { 'input-error': fieldErrors.email }]"
              placeholder="请输入邮箱"
              required
            />
          </div>
          <p v-if="fieldErrors.email" class="error-text">{{ fieldErrors.email }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">组织名称</label>
          <div class="input-wrapper">
            <Building class="input-icon w-5 h-5" />
            <input
              v-model="organizationName"
              type="text"
              :class="['form-input', { 'input-error': fieldErrors['organization.name'] }]"
              placeholder="请输入组织名称"
              required
            />
          </div>
          <p v-if="fieldErrors['organization.name']" class="error-text">{{ fieldErrors['organization.name'] }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">组织描述（可选）</label>
          <div class="input-wrapper">
            <FileText class="input-icon w-5 h-5" />
            <textarea
              v-model="organizationDescription"
              class="form-textarea"
              placeholder="请输入组织描述"
              rows="2"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <Lock class="input-icon w-5 h-5" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :class="['form-input', { 'input-error': fieldErrors.password }]"
              placeholder="请输入密码 (6-100字符)"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <component
                :is="showPassword ? EyeOff : Eye"
                class="w-5 h-5"
              />
            </button>
          </div>
          <p v-if="fieldErrors.password" class="error-text">{{ fieldErrors.password }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <div class="input-wrapper">
            <Lock class="input-icon w-5 h-5" />
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请再次输入密码"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <component
                :is="showConfirmPassword ? EyeOff : Eye"
                class="w-5 h-5"
              />
            </button>
          </div>
          <p v-if="passwordMismatch" class="error-text">两次密码输入不一致</p>
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <button
          type="submit"
          class="register-button"
          :disabled="isLoading || passwordMismatch"
        >
          <template v-if="isLoading">
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>注册中...</span>
          </template>
          <template v-else>
            <span>注册</span>
          </template>
        </button>
      </form>

      <div class="register-footer">
        <p class="footer-text">已有账号？</p>
        <button class="footer-link" @click="goToLogin">立即登录</button>
      </div>
    </div>

    <div class="register-decoration">
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Workflow, User, Mail, Lock, Eye, EyeOff, Loader2, Building, FileText } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
import type { ApiError } from '../../utils/api';
import Toast from '../common/Toast.vue';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const realName = ref('');
const email = ref('');
const organizationName = ref('');
const organizationDescription = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const error = ref('');
const fieldErrors = ref<Record<string, string>>({});
const showSuccessToast = ref(false);
const successMessage = ref('');

const passwordMismatch = computed(() => {
  return confirmPassword.value && password.value !== confirmPassword.value;
});

async function handleRegister() {
  if (passwordMismatch.value) return;

  isLoading.value = true;
  error.value = '';
  fieldErrors.value = {};

  try {
    const success = await authStore.registerWithOrganization({
      username: username.value,
      email: email.value,
      password: password.value,
      realName: realName.value || undefined,
      organization: {
        name: organizationName.value,
        description: organizationDescription.value || undefined,
      },
    });

    if (success) {
      successMessage.value = '注册成功';
      showSuccessToast.value = true;
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      error.value = '注册失败，请稍后重试';
    }
  } catch (err: any) {
    console.error('Registration failed:', err);

    // 处理 API 错误
    if (err.name === 'ApiError') {
      const apiErr = err as ApiError;
      error.value = apiErr.message;

      // 如果有字段级别的错误，存储起来
      if (apiErr.data && typeof apiErr.data === 'object') {
        fieldErrors.value = apiErr.data as Record<string, string>;
      }
    } else {
      error.value = err.message || '注册失败，请稍后重试';
    }
  } finally {
    isLoading.value = false;
  }
}

function goToLogin() {
  router.push('/login');
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.register-card {
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 40px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
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
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.register-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
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

.error-message {
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  margin: 0 0 8px 0;
}

.password-toggle {
  position: absolute;
  right: 14px;
  padding: 0;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #6b7280;
}

.error-text {
  font-size: 12px;
  color: #ef4444;
  margin: 4px 0 0 0;
}

.register-button {
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
  margin-top: 8px;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
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

.register-decoration {
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
