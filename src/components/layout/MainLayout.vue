<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <Workflow class="w-6 h-6 text-white" />
          </div>
          <span class="logo-text">Workline</span>
        </div>
      </div>

      <div class="org-switcher">
        <button class="org-selector" @click="showOrgModal = true">
          <Building class="w-4 h-4" />
          <span class="org-name">{{ currentOrg?.name || '选择组织' }}</span>
          <ChevronDown class="w-4 h-4 ml-auto" />
        </button>
      </div>

      <nav class="nav-menu">
        <router-link
          to="/workflows/create"
          class="nav-item"
          :class="{ active: $route.path === '/workflows/create' }"
        >
          <PlusSquare class="w-5 h-5" />
          <span>创建工作流</span>
        </router-link>
        <router-link
          to="/workflows/published"
          class="nav-item"
          :class="{ active: $route.path === '/workflows/published' }"
        >
          <ListChecks class="w-5 h-5" />
          <span>已发布工作流</span>
        </router-link>
        <router-link
          to="/datasources"
          class="nav-item"
          :class="{ active: $route.path === '/datasources' }"
        >
          <Database class="w-5 h-5" />
          <span>数据源管理</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ user?.username?.charAt(0).toUpperCase() }}
          </div>
          <div class="user-details">
            <div class="user-name">{{ user?.username }}</div>
            <div class="user-email">{{ user?.email }}</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>

    <div v-if="showOrgModal" class="modal-overlay" @click.self="showOrgModal = false">
      <div class="org-modal">
        <div class="modal-header">
          <h3 class="modal-title">选择组织</h3>
          <button class="modal-close" @click="showOrgModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-content">
          <div class="org-list">
            <div
              v-for="org in organizations"
              :key="org.id"
              class="org-item"
              :class="{ active: currentOrg?.id === org.id }"
              @click="selectOrg(org)"
            >
              <div class="org-icon">
                <Building class="w-5 h-5" />
              </div>
              <div class="org-info">
                <div class="org-item-name">{{ org.name }}</div>
                <div class="org-item-desc">{{ org.description }}</div>
              </div>
              <Check v-if="currentOrg?.id === org.id" class="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <button class="create-org-btn" @click="showCreateOrgModal = true">
            <Plus class="w-4 h-4" />
            <span>创建新组织</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCreateOrgModal" class="modal-overlay" @click.self="showCreateOrgModal = false">
      <div class="create-org-modal">
        <div class="modal-header">
          <h3 class="modal-title">创建组织</h3>
          <button class="modal-close" @click="showCreateOrgModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label class="form-label">组织名称</label>
            <input
              v-model="newOrgName"
              type="text"
              class="form-input"
              placeholder="输入组织名称"
            />
          </div>
          <div class="form-group">
            <label class="form-label">描述（可选）</label>
            <textarea
              v-model="newOrgDesc"
              class="form-textarea"
              rows="3"
              placeholder="输入组织描述"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateOrgModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="handleCreateOrg" :disabled="!newOrgName">
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Workflow,
  Building,
  ChevronDown,
  PlusSquare,
  ListChecks,
  LogOut,
  X,
  Plus,
  Check,
  Database,
} from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const user = computed(() => authStore.user);
const organizations = computed(() => authStore.organizations);
const currentOrg = computed(() => authStore.currentOrganization);

const showOrgModal = ref(false);
const showCreateOrgModal = ref(false);
const newOrgName = ref('');
const newOrgDesc = ref('');

function selectOrg(org: any) {
  authStore.switchOrganization(org.id);
  showOrgModal.value = false;
}

async function handleCreateOrg() {
  if (!newOrgName.value) return;
  await authStore.createOrganization(newOrgName.value, newOrgDesc.value);
  newOrgName.value = '';
  newOrgDesc.value = '';
  showCreateOrgModal.value = false;
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background: #f8fafc;
}

.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.org-switcher {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.org-selector {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.org-selector:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.org-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.nav-menu {
  flex: 1;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: #6b7280;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s;
}

.nav-item:hover {
  color: #374151;
  background: #f3f4f6;
}

.nav-item.active {
  color: #3b82f6;
  background: #eff6ff;
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-details {
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 36px;
  height: 36px;
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

.logout-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

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
}

.org-modal,
.create-org-modal {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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

.modal-content {
  padding: 20px 24px;
}

.org-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.org-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.org-item:hover {
  background: #f3f4f6;
}

.org-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.org-icon {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
}

.org-info {
  flex: 1;
  min-width: 0;
}

.org-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.org-item-desc {
  font-size: 12px;
  color: #6b7280;
}

.create-org-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: transparent;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.create-org-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
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
}

.form-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
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
