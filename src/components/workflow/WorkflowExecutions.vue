<template>
  <div class="workflow-executions">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="page-title">执行记录</h1>
          <p class="page-desc">工作流: {{ workflowName }}</p>
        </div>
      </div>
    </div>

    <div class="executions-container">
      <div v-if="loading" class="loading-state">
        <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
        <p class="loading-text">加载中...</p>
      </div>

      <div v-else-if="executions.length === 0" class="empty-state">
        <div class="empty-icon">
          <Inbox class="w-16 h-16" />
        </div>
        <h3 class="empty-title">暂无执行记录</h3>
        <p class="empty-desc">该工作流尚未运行过</p>
      </div>

      <div v-else class="executions-list">
        <div
          v-for="execution in executions"
          :key="execution.executionId"
          class="execution-card"
        >
          <div class="execution-header">
            <div class="execution-id">{{ execution.executionId }}</div>
            <div class="execution-status-badge" :class="getStatusClass(execution.status)">
              {{ getStatusText(execution.status) }}
            </div>
          </div>

          <div class="execution-body">
            <div class="execution-meta">
              <div class="meta-item">
                <Calendar class="w-4 h-4" />
                <span>开始时间: {{ formatDateTime(execution.startedAt) }}</span>
              </div>
              <div v-if="execution.endedAt" class="meta-item">
                <Clock class="w-4 h-4" />
                <span>结束时间: {{ formatDateTime(execution.endedAt) }}</span>
              </div>
              <div class="meta-item">
                <Timer class="w-4 h-4" />
                <span>耗时: {{ formatDuration(execution.durationMs) }}</span>
              </div>
              <div class="meta-item">
                <Hash class="w-4 h-4" />
                <span>版本: v{{ execution.workflowVersion }}</span>
              </div>
            </div>

            <div v-if="execution.inputSummary" class="execution-summary">
              <div class="summary-label">输入摘要</div>
              <div class="summary-content">{{ execution.inputSummary }}</div>
            </div>

            <div v-if="execution.outputSummary" class="execution-summary">
              <div class="summary-label">输出摘要</div>
              <div class="summary-content">{{ execution.outputSummary }}</div>
            </div>

            <div v-if="execution.errorMessage" class="execution-error">
              <div class="error-label">错误信息</div>
              <div class="error-content">{{ execution.errorMessage }}</div>
              <div v-if="execution.failedNodeName" class="error-node">
                失败节点: {{ execution.failedNodeName }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="currentPage === 0"
          @click="loadPage(currentPage - 1)"
        >
          上一页
        </button>
        <span class="pagination-info">
          第 {{ currentPage + 1 }} 页 / 共 {{ totalPages }} 页
        </span>
        <button
          class="pagination-btn"
          :disabled="currentPage >= totalPages - 1"
          @click="loadPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <Toast
      :show="showErrorToast"
      :message="toastMessage"
      type="error"
      @close="showErrorToast = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeft,
  Loader2,
  Inbox,
  Calendar,
  Clock,
  Timer,
  Hash,
} from 'lucide-vue-next';
import workflowApi from '../../services/workflowApi';
import Toast from '../common/Toast.vue';

const router = useRouter();
const route = useRoute();

const workflowId = ref(route.params.workflowId as string);
const workflowName = ref((route.query.workflowName as string) || '');

const loading = ref(true);
const executions = ref<any[]>([]);
const currentPage = ref(0);
const pageSize = ref(20);
const totalPages = ref(0);
const totalElements = ref(0);

const showErrorToast = ref(false);
const toastMessage = ref('');

function goBack() {
  router.back();
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    RUNNING: 'status-running',
    COMPLETED: 'status-success',
    FAILED: 'status-failed',
    CANCELLED: 'status-cancelled',
  };
  return classes[status] || 'status-pending';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    RUNNING: '运行中',
    COMPLETED: '已完成',
    FAILED: '失败',
    CANCELLED: '已取消',
  };
  return texts[status] || '未知';
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function formatDuration(ms: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}min`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

function showError(message: string) {
  toastMessage.value = message;
  showErrorToast.value = true;
}

async function loadPage(page: number) {
  loading.value = true;
  try {
    const response = await workflowApi.getExecutions(workflowId.value, {
      page,
      size: pageSize.value,
    });
    if (response.success) {
      executions.value = response.data.content;
      currentPage.value = response.data.number;
      totalPages.value = response.data.totalPages;
      totalElements.value = response.data.totalElements;
    }
  } catch (err: any) {
    console.error('Failed to load executions:', err);
    showError(err.message || '加载执行记录失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPage(0);
});
</script>

<style scoped>
.workflow-executions {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 24px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border: none;
  border-radius: 10px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
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

.executions-container {
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
  margin: 0;
}

.executions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.execution-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.execution-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-bottom: 1px solid #e5e7eb;
}

.execution-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.execution-status-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 999px;
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

.status-cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.execution-body {
  padding: 20px;
}

.execution-meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.execution-summary,
.execution-error {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.summary-label,
.error-label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.summary-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  word-break: break-all;
}

.error-content {
  font-size: 14px;
  color: #dc2626;
  line-height: 1.5;
  word-break: break-all;
}

.error-node {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.pagination-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
}
</style>
