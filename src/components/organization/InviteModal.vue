<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">邀请成员</h3>
        <button class="modal-close" @click="handleClose">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">邮箱地址</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            :class="{ 'input-error': fieldErrors.email }"
            placeholder="请输入被邀请人的邮箱"
            @keyup.enter="handleInvite"
          />
          <p v-if="fieldErrors.email" class="error-text">{{ fieldErrors.email }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">角色</label>
          <div class="role-options">
            <label
              v-for="role in roles"
              :key="role.value"
              class="role-option"
              :class="{ 'role-selected': selectedRole === role.value }"
            >
              <input
                type="radio"
                :value="role.value"
                v-model="selectedRole"
                class="role-radio"
              />
              <div class="role-info">
                <div class="role-name">{{ role.label }}</div>
                <div class="role-desc">{{ role.desc }}</div>
              </div>
              <div v-if="selectedRole === role.value" class="role-check">
                <Check class="w-4 h-4" />
              </div>
            </label>
          </div>
        </div>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        <button class="btn btn-primary" @click="handleInvite" :disabled="loading || !email">
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <span v-else>发送邀请</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Check, Loader2 } from 'lucide-vue-next';
import organizationApi from '../../services/organizationApi';

const props = defineProps<{
  show: boolean;
  organizationId: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const email = ref('');
const selectedRole = ref<'ADMIN' | 'MEMBER'>('MEMBER');
const loading = ref(false);
const errorMessage = ref('');
const fieldErrors = ref<Record<string, string>>({});

const roles = [
  { value: 'ADMIN' as const, label: '管理员', desc: '可以管理成员和工作流' },
  { value: 'MEMBER' as const, label: '成员', desc: '可以查看和使用工作流' },
];

watch(() => props.show, (newVal) => {
  if (newVal) {
    email.value = '';
    selectedRole.value = 'MEMBER';
    errorMessage.value = '';
    fieldErrors.value = {};
  }
});

function handleClose() {
  emit('close');
}

async function handleInvite() {
  if (!email.value || !props.organizationId) return;

  loading.value = true;
  errorMessage.value = '';
  fieldErrors.value = {};

  try {
    await organizationApi.sendInvitation(props.organizationId, {
      email: email.value,
      role: selectedRole.value,
    });
    emit('success');
    emit('close');
  } catch (err: any) {
    console.error('Failed to send invitation:', err);
    if (err.name === 'ApiError') {
      errorMessage.value = err.message;
      if (err.data && typeof err.data === 'object') {
        fieldErrors.value = err.data;
      }
    } else {
      errorMessage.value = err.message || '发送邀请失败，请稍后重试';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
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
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
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

.role-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.role-option:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.role-selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.role-radio {
  margin: 0;
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.role-info {
  flex: 1;
}

.role-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.role-desc {
  font-size: 13px;
  color: #6b7280;
}

.role-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
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
  margin: 6px 0 0 0;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: #f3f4f6;
  border: none;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  border: none;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
