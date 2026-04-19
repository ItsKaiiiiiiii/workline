<template>
  <div class="published-workflows">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">已发布工作流</h1>
        <p class="page-desc">查看和管理组织下已发布的工作流</p>
      </div>
    </div>

    <div class="workflows-container">
      <div v-if="loading" class="loading-state">
        <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
        <p class="loading-text">加载中...</p>
      </div>

      <div v-else-if="publishedWorkflows.length === 0" class="empty-state">
        <div class="empty-icon">
          <Inbox class="w-16 h-16" />
        </div>
        <h3 class="empty-title">暂无发布的工作流</h3>
        <p class="empty-desc">前往"创建工作流"创建并发布你的第一个工作流</p>
        <router-link to="/workflows/create" class="empty-action">
          <Plus class="w-4 h-4" />
          <span>创建工作流</span>
        </router-link>
      </div>

      <div v-else class="workflows-grid">
        <div
          v-for="workflow in publishedWorkflows"
          :key="workflow.id"
          class="workflow-card"
        >
          <div class="card-header">
            <div class="workflow-icon">
              <Workflow class="w-6 h-6" />
            </div>
            <div class="workflow-status-badge" :class="getDeploymentStatusClass(workflow.deploymentStatus)">
              {{ getDeploymentStatusText(workflow.deploymentStatus) }}
            </div>
          </div>

          <div class="card-body">
            <h3 class="workflow-name">{{ workflow.name }}</h3>
            <p class="workflow-desc">{{ workflow.description || '暂无描述' }}</p>

            <div class="workflow-meta">
              <div class="meta-item">
                <Calendar class="w-4 h-4" />
                <span>发布于 {{ formatDate(workflow.publishedAt) }}</span>
              </div>
              <div class="meta-item">
                <User class="w-4 h-4" />
                <span>创建者</span>
              </div>
            </div>

            <div class="executions-preview">
              <div class="executions-title">最近运行</div>
              <div v-if="getExecutionsForWorkflow(workflow.id).length > 0" class="executions-list">
                <div
                  v-for="exec in getExecutionsForWorkflow(workflow.id).slice(0, 3)"
                  :key="exec.id"
                  class="execution-item"
                >
                  <div class="execution-dot" :class="getStatusClass(exec.status)"></div>
                  <span class="execution-time">{{ formatTime(exec.startedAt) }}</span>
                </div>
              </div>
              <div v-else class="no-executions">
                暂无运行记录
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="card-btn" @click="handleView(workflow)">
              <Eye class="w-4 h-4" />
              <span>查看</span>
            </button>
            <button class="card-btn" @click="handleViewExecutions(workflow)">
              <List class="w-4 h-4" />
              <span>执行记录</span>
            </button>
            <template v-if="workflow.deploymentStatus === 'DEPLOYED'">
              <button class="card-btn card-btn-warning" @click="handleUndeploy(workflow)">
                <XCircle class="w-4 h-4" />
                <span>取消部署</span>
              </button>
            </template>
            <template v-else>
              <button class="card-btn card-btn-primary" @click="handleDeploy(workflow)">
                <Rocket class="w-4 h-4" />
                <span>部署</span>
              </button>
            </template>
            <button class="card-btn card-btn-danger" @click="handleDelete(workflow)">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <Toast
      :show="showSuccessToast"
      :message="toastMessage"
      type="success"
      @close="showSuccessToast = false"
    />
    <Toast
      :show="showErrorToast"
      :message="toastMessage"
      type="error"
      @close="showErrorToast = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Workflow,
  Loader2,
  Inbox,
  Plus,
  Calendar,
  User,
  Eye,
  List,
  Trash2,
  Rocket,
  XCircle,
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useWorkflowsStore } from '../../stores/workflows';
import type { WorkflowExecution } from '../../types/auth';
import Toast from '../common/Toast.vue';

const workflowsStore = useWorkflowsStore();
const router = useRouter();

const loading = ref(true);
const showSuccessToast = ref(false);
const showErrorToast = ref(false);
const toastMessage = ref('');

const publishedWorkflows = computed(() => workflowsStore.publishedWorkflows);

function getExecutionsForWorkflow(workflowId: string): WorkflowExecution[] {
  return workflowsStore.getExecutionsForWorkflow(workflowId);
}

function getLatestStatus(workflowId: string): string {
  const executions = getExecutionsForWorkflow(workflowId);
  return executions.length > 0 ? executions[0].status : 'pending';
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    running: 'status-running',
    success: 'status-success',
    failed: 'status-failed',
  };
  return classes[status] || 'status-pending';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    success: '成功',
    failed: '失败',
  };
  return texts[status] || '未知';
}

function getDeploymentStatusClass(status?: string): string {
  const classes: Record<string, string> = {
    DEPLOYED: 'status-deployed',
    UNDEPLOYED: 'status-undeployed',
    FAILED: 'status-failed',
  };
  return classes[status || ''] || 'status-undeployed';
}

function getDeploymentStatusText(status?: string): string {
  const texts: Record<string, string> = {
    DEPLOYED: '已部署',
    UNDEPLOYED: '未部署',
    FAILED: '部署失败',
  };
  return texts[status || ''] || '未部署';
}

function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
}

function formatTime(date?: Date): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function handleView(workflow: any) {
  router.push({
    name: 'WorkflowDetail',
    params: { workflowId: workflow.id }
  });
}

function handleViewExecutions(workflow: any) {
  router.push({
    name: 'WorkflowExecutions',
    params: { workflowId: workflow.id },
    query: { workflowName: workflow.name }
  });
}

function handleRun(workflow: any) {
  console.log('运行工作流:', workflow);
  alert(`工作流 "${workflow.name}" 已开始运行！`);
}

function showSuccess(message: string) {
  toastMessage.value = message;
  showSuccessToast.value = true;
}

function showError(message: string) {
  toastMessage.value = message;
  showErrorToast.value = true;
}

async function handleDelete(workflow: any) {
  if (workflow.deploymentStatus === 'DEPLOYED') {
    alert('该工作流已部署，如需删除请先取消部署');
    return;
  }

  if (!confirm(`确定要删除工作流 "${workflow.name}" 吗？`)) {
    return;
  }

  try {
    await workflowsStore.deleteWorkflow(workflow.id);
    showSuccess('工作流已删除！');
  } catch (err: any) {
    console.error('Failed to delete workflow:', err);
    showError(err.message || '删除失败，请稍后重试');
  }
}

async function handleDeploy(workflow: any) {
  if (workflow.deploymentStatus === 'DEPLOYED') {
    alert('该工作流已部署，如需重新部署请先取消部署');
    return;
  }

  try {
    await workflowsStore.deployWorkflow(workflow.id);
    showSuccess(`工作流 "${workflow.name}" 部署成功！`);
  } catch (err: any) {
    console.error('Failed to deploy workflow:', err);
    showError(err.message || '部署失败，请稍后重试');
  }
}

async function handleUndeploy(workflow: any) {
  if (!confirm(`确定要取消部署工作流 "${workflow.name}" 吗？`)) {
    return;
  }

  try {
    await workflowsStore.undeployWorkflow(workflow.id);
    showSuccess(`工作流 "${workflow.name}" 已取消部署！`);
  } catch (err: any) {
    console.error('Failed to undeploy workflow:', err);
    showError(err.message || '取消部署失败，请稍后重试');
  }
}

onMounted(async () => {
  loading.value = true;
  await workflowsStore.fetchWorkflows();
  loading.value = false;
});
</script>

<style scoped>
.published-workflows {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  overflow: hidden;
}

.page-header {
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

.workflows-container {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
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
  padding: 80px 20px;
  text-align: center;
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
  margin: 0 0 24px 0;
}

.empty-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.empty-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.workflows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.workflow-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.workflow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-bottom: 1px solid #e5e7eb;
}

.workflow-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.workflow-status-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 999px;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-running {
  background: #dbeafe;
  color: #2563eb;
}

.status-success {
  background: #dcfce7;
  color: #16a34a;
}

.status-failed {
  background: #fee2e2;
  color: #dc2626;
}

.status-deployed {
  background: #dcfce7;
  color: #16a34a;
}

.status-undeployed {
  background: #f3f4f6;
  color: #6b7280;
}

.card-body {
  padding: 20px;
  flex: 1;
}

.workflow-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.workflow-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.workflow-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.executions-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.executions-title {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.executions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.execution-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.execution-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.execution-dot.status-pending {
  background: #fbbf24;
}

.execution-dot.status-running {
  background: #3b82f6;
}

.execution-dot.status-success {
  background: #22c55e;
}

.execution-dot.status-failed {
  background: #ef4444;
}

.no-executions {
  font-size: 13px;
  color: #9ca3af;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}

.card-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.card-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.card-btn-danger {
  color: #ef4444;
  border-color: #fecaca;
}

.card-btn-danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.card-btn-primary {
  color: #3b82f6;
  border-color: #bfdbfe;
}

.card-btn-primary:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}

.card-btn-warning {
  color: #f59e0b;
  border-color: #fed7aa;
}

.card-btn-warning:hover {
  background: #fffbeb;
  border-color: #f59e0b;
}
</style>
