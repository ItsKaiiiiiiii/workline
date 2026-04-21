<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">组织邀请</h3>
        <button class="modal-close" @click="handleClose">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
          <p class="loading-text">加载中...</p>
        </div>

        <div v-else-if="invitations.length === 0" class="empty-state">
          <div class="empty-icon">
            <Mail class="w-12 h-12" />
          </div>
          <h3 class="empty-title">暂无待处理邀请</h3>
          <p class="empty-desc">你目前没有收到任何组织邀请</p>
        </div>

        <div v-else class="invitations-list">
          <div
            v-for="invitation in invitations"
            :key="invitation.invitationId"
            class="invitation-card"
          >
            <div class="invitation-header">
              <div class="org-icon">
                <Building class="w-6 h-6" />
              </div>
              <div class="invitation-info">
                <div class="org-name">{{ invitation.organizationName }}</div>
                <div class="invitation-meta">
                  <span class="invitation-role">{{ getRoleText(invitation.role) }}</span>
                  <span class="invitation-divider">·</span>
                  <span class="invitation-inviter">邀请人: {{ invitation.invitedByName }}</span>
                </div>
              </div>
            </div>
            <div class="invitation-actions">
              <button
                class="action-btn btn-reject"
                @click="handleReject(invitation)"
                :disabled="processingIds.has(invitation.invitationId)"
              >
                <X v-if="processingIds.has(invitation.invitationId)" class="w-4 h-4 animate-spin" />
                <span v-else>拒绝</span>
              </button>
              <button
                class="action-btn btn-accept"
                @click="handleAccept(invitation)"
                :disabled="processingIds.has(invitation.invitationId)"
              >
                <Loader2 v-if="processingIds.has(invitation.invitationId)" class="w-4 h-4 animate-spin" />
                <span v-else>接受</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { X, Loader2, Mail, Building } from 'lucide-vue-next';
import organizationApi from '../../services/organizationApi';
import type { Invitation } from '../../types/api';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'accepted'): void;
}>();

const loading = ref(false);
const invitations = ref<Invitation[]>([]);
const processingIds = ref<Set<string>>(new Set());

function getRoleText(role: string): string {
  const texts: Record<string, string> = {
    OWNER: '所有者',
    ADMIN: '管理员',
    MEMBER: '成员',
  };
  return texts[role] || role;
}

function handleClose() {
  emit('close');
}

async function loadInvitations() {
  loading.value = true;
  try {
    const response = await organizationApi.getPendingInvitations();
    if (response.success) {
      invitations.value = response.data;
    }
  } catch (err: any) {
    console.error('Failed to load pending invitations:', err);
  } finally {
    loading.value = false;
  }
}

async function handleAccept(invitation: Invitation) {
  processingIds.value.add(invitation.invitationId);
  try {
    await organizationApi.acceptInvitation(invitation.invitationId);
    await loadInvitations();
    emit('accepted');
    emit('close');
  } catch (err: any) {
    console.error('Failed to accept invitation:', err);
    alert(err.message || '接受邀请失败，请稍后重试');
  } finally {
    processingIds.value.delete(invitation.invitationId);
  }
}

async function handleReject(invitation: Invitation) {
  if (!confirm(`确定要拒绝来自 "${invitation.organizationName}" 的邀请吗？`)) {
    return;
  }

  processingIds.value.add(invitation.invitationId);
  try {
    await organizationApi.rejectInvitation(invitation.invitationId);
    await loadInvitations();
  } catch (err: any) {
    console.error('Failed to reject invitation:', err);
    alert(err.message || '拒绝邀请失败，请稍后重试');
  } finally {
    processingIds.value.delete(invitation.invitationId);
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadInvitations();
  }
});

onMounted(() => {
  if (props.show) {
    loadInvitations();
  }
});
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
  max-width: 520px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
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
  overflow-y: auto;
  flex: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 6px 0;
}

.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.invitation-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.org-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.invitation-info {
  flex: 1;
  min-width: 0;
}

.org-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.invitation-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.invitation-role {
  background: #eff6ff;
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.invitation-divider {
  color: #d1d5db;
}

.invitation-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.action-btn {
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

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reject {
  background: #f3f4f6;
  color: #374151;
}

.btn-reject:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-accept {
  background: #3b82f6;
  color: #ffffff;
}

.btn-accept:hover:not(:disabled) {
  background: #2563eb;
}
</style>
