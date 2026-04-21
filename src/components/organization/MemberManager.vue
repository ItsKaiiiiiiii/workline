<template>
  <div class="member-manager">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">成员管理</h1>
        <p class="page-desc">管理组织成员和发送邀请</p>
      </div>
      <button class="invite-btn" @click="showInviteModal = true">
        <UserPlus class="w-4 h-4" />
        <span>邀请成员</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
      <p class="loading-text">加载中...</p>
    </div>

    <div v-else class="content-container">
      <div class="members-section">
        <h2 class="section-title">组织成员 ({{ members.length }})</h2>
        <div v-if="members.length === 0" class="empty-state">
          <div class="empty-icon">
            <Users class="w-16 h-16" />
          </div>
          <h3 class="empty-title">暂无成员</h3>
          <p class="empty-desc">点击上方按钮邀请新成员加入</p>
        </div>
        <div v-else class="members-list">
          <div
            v-for="member in members"
            :key="member.userId"
            class="member-item"
          >
            <div class="member-avatar">
              {{ member.realName?.charAt(0) || member.username?.charAt(0) || 'U' }}
            </div>
            <div class="member-info">
              <div class="member-name">{{ member.realName || member.username }}</div>
              <div class="member-email">{{ member.email }}</div>
              <div class="member-joined">加入于 {{ formatDate(member.joinedAt) }}</div>
            </div>
            <div class="member-role">
              <select
                v-model="member.role"
                :disabled="member.role === 'OWNER' || !canEditMember(member)"
                @change="updateRole(member)"
                class="role-select"
              >
                <option value="OWNER" :disabled="member.role !== 'OWNER'">所有者</option>
                <option value="ADMIN">管理员</option>
                <option value="MEMBER">成员</option>
              </select>
            </div>
            <button
              v-if="canEditMember(member)"
              class="remove-btn"
              @click="handleRemove(member)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="invitations.length > 0" class="invitations-section">
        <h2 class="section-title">待处理邀请 ({{ invitations.length }})</h2>
        <div class="invitations-list">
          <div
            v-for="invitation in invitations"
            :key="invitation.invitationId"
            class="invitation-item"
          >
            <div class="invitation-icon">
              <Mail class="w-5 h-5" />
            </div>
            <div class="invitation-info">
              <div class="invitation-email">{{ invitation.email }}</div>
              <div class="invitation-role">{{ getRoleText(invitation.role) }}</div>
              <div class="invitation-meta">
                邀请人: {{ invitation.invitedByName }} · {{ formatDate(invitation.invitedAt) }}
              </div>
            </div>
            <div class="invitation-status">
              <span class="status-badge" :class="getStatusClass(invitation.status)">
                {{ getStatusText(invitation.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <InviteModal
      :show="showInviteModal"
      :organization-id="currentOrgId"
      @close="showInviteModal = false"
      @success="handleInviteSuccess"
    />

    <Toast
      :show="showSuccessToast"
      :message="successMessage"
      type="success"
      @close="showSuccessToast = false"
    />
    <Toast
      :show="showErrorToast"
      :message="errorMessage"
      type="error"
      @close="showErrorToast = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { UserPlus, Users, Trash2, Mail, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';
import organizationApi from '../../services/organizationApi';
import type { OrganizationMember, Invitation } from '../../types/api';
import InviteModal from './InviteModal.vue';
import Toast from '../common/Toast.vue';

const authStore = useAuthStore();
const currentOrgId = computed(() => authStore.currentOrganization?.organizationId || '');
const currentUserRole = computed(() => authStore.currentOrganization?.currentUserRole || 'MEMBER');

const loading = ref(false);
const members = ref<OrganizationMember[]>([]);
const invitations = ref<Invitation[]>([]);
const showInviteModal = ref(false);
const showSuccessToast = ref(false);
const showErrorToast = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

function canEditMember(member: OrganizationMember): boolean {
  const role = currentUserRole.value;
  if (role === 'OWNER') {
    return member.role !== 'OWNER';
  }
  if (role === 'ADMIN') {
    return member.role === 'MEMBER';
  }
  return false;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function getRoleText(role: string): string {
  const texts: Record<string, string> = {
    OWNER: '所有者',
    ADMIN: '管理员',
    MEMBER: '成员',
  };
  return texts[role] || role;
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    PENDING: 'status-pending',
    ACCEPTED: 'status-success',
    REJECTED: 'status-cancelled',
    EXPIRED: 'status-skipped',
  };
  return classes[status] || '';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: '待接受',
    ACCEPTED: '已接受',
    REJECTED: '已拒绝',
    EXPIRED: '已过期',
  };
  return texts[status] || status;
}

function showSuccess(message: string) {
  successMessage.value = message;
  showSuccessToast.value = true;
}

function showError(message: string) {
  errorMessage.value = message;
  showErrorToast.value = true;
}

async function loadMembers() {
  if (!currentOrgId.value) return;

  loading.value = true;
  try {
    const response = await organizationApi.getMembers(currentOrgId.value);
    if (response.success) {
      members.value = response.data;
    }
  } catch (err: any) {
    console.error('Failed to load members:', err);
    showError(err.message || '加载成员列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadInvitations() {
  if (!currentOrgId.value) return;

  try {
    const response = await organizationApi.getInvitations(currentOrgId.value);
    if (response.success) {
      invitations.value = response.data.filter((inv: Invitation) => inv.status === 'PENDING');
    }
  } catch (err: any) {
    console.error('Failed to load invitations:', err);
  }
}

async function updateRole(member: OrganizationMember) {
  if (!currentOrgId.value) return;

  try {
    await organizationApi.updateMemberRole(currentOrgId.value, member.userId, member.role as any);
    showSuccess('角色更新成功');
  } catch (err: any) {
    console.error('Failed to update role:', err);
    showError(err.message || '更新角色失败');
    await loadMembers();
  }
}

async function handleRemove(member: OrganizationMember) {
  if (!confirm(`确定要移除成员 "${member.realName || member.username}" 吗？`)) {
    return;
  }

  if (!currentOrgId.value) return;

  try {
    await organizationApi.removeMember(currentOrgId.value, member.userId);
    showSuccess('成员已移除');
    await loadMembers();
  } catch (err: any) {
    console.error('Failed to remove member:', err);
    showError(err.message || '移除成员失败');
  }
}

function handleInviteSuccess() {
  loadMembers();
  loadInvitations();
  showSuccess('邀请已发送');
}

onMounted(() => {
  loadMembers();
  loadInvitations();
});
</script>

<style scoped>
.member-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.invite-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.content-container {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.members-list,
.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item,
.invitation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;
}

.member-item:hover,
.invitation-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.member-avatar,
.invitation-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.invitation-icon {
  background: #f3f4f6;
  color: #6b7280;
}

.member-info,
.invitation-info {
  flex: 1;
  min-width: 0;
}

.member-name,
.invitation-email {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.member-email,
.invitation-role {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 2px;
}

.member-joined,
.invitation-meta {
  font-size: 12px;
  color: #9ca3af;
}

.member-role {
  flex-shrink: 0;
}

.role-select {
  padding: 8px 12px;
  font-size: 14px;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-select:hover:not(:disabled) {
  border-color: #9ca3af;
}

.role-select:focus:not(:disabled) {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.role-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: #ef4444;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #fef2f2;
}

.invitation-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 999px;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-success {
  background: #dcfce7;
  color: #16a34a;
}

.status-cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.status-skipped {
  background: #f3f4f6;
  color: #6b7280;
}
</style>
