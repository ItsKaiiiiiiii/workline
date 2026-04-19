<template>
  <div class="workflow-detail">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="page-title">工作流详情</h1>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
      <p class="loading-text">加载中...</p>
    </div>

    <div v-else-if="workflow" class="detail-container">
      <div class="info-card">
        <div class="card-header">
          <div class="workflow-icon">
            <Workflow class="w-6 h-6" />
          </div>
          <div class="workflow-basic">
            <h2 class="workflow-name">{{ workflow.name }}</h2>
            <p class="workflow-version">版本 v{{ workflow.version }}</p>
          </div>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">工作流 ID</div>
              <div class="info-value mono">{{ workflow.workflowId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">描述</div>
              <div class="info-value">{{ workflow.description || '暂无描述' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">创建人</div>
              <div class="info-value">{{ workflow.createdBy }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">创建时间</div>
              <div class="info-value">{{ formatDateTime(workflow.createdAt) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">更新时间</div>
              <div class="info-value">{{ formatDateTime(workflow.updatedAt) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">是否最新</div>
              <div class="info-value">
                <span :class="workflow.isLatest ? 'badge-success' : 'badge-warning'">
                  {{ workflow.isLatest ? '是' : '否' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="workflowDefinition" class="definition-card">
        <div class="card-header">
          <h3 class="card-title">工作流定义</h3>
        </div>
        <div class="definition-content">
          <div class="definition-section">
            <h4 class="section-title">节点 ({{ workflowDefinition.nodes?.length || 0 }})</h4>
            <div v-if="workflowDefinition.nodes?.length > 0" class="nodes-list">
              <div v-for="node in workflowDefinition.nodes" :key="node.id" class="node-item">
                <div class="node-id mono">{{ node.id }}</div>
                <div class="node-label">{{ node.label }}</div>
                <div class="node-type">{{ node.type }}</div>
              </div>
            </div>
            <div v-else class="empty-text">暂无节点</div>
          </div>

          <div class="definition-section">
            <h4 class="section-title">边 ({{ workflowDefinition.edges?.length || 0 }})</h4>
            <div v-if="workflowDefinition.edges?.length > 0" class="edges-list">
              <div v-for="edge in workflowDefinition.edges" :key="edge.id" class="edge-item">
                <div class="edge-source mono">{{ edge.sourceNodeId || edge.source }}</div>
                <ArrowRight class="w-4 h-4 arrow-icon" />
                <div class="edge-target mono">{{ edge.targetNodeId || edge.target }}</div>
              </div>
            </div>
            <div v-else class="empty-text">暂无边</div>
          </div>
        </div>
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
import { ArrowLeft, Loader2, Workflow, ArrowRight } from 'lucide-vue-next';
import workflowApi from '../../services/workflowApi';
import Toast from '../common/Toast.vue';

const router = useRouter();
const route = useRoute();

const workflowId = ref(route.params.workflowId as string);
const loading = ref(true);
const workflow = ref<any>(null);
const workflowDefinition = ref<any>(null);

const showErrorToast = ref(false);
const toastMessage = ref('');

function goBack() {
  router.back();
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function showError(message: string) {
  toastMessage.value = message;
  showErrorToast.value = true;
}

async function loadWorkflowDetail() {
  loading.value = true;
  try {
    const response = await workflowApi.getLatestWorkflow(workflowId.value);
    if (response.success) {
      workflow.value = response.data;
      // 解析 definitionJson
      try {
        if (response.data.definitionJson) {
          workflowDefinition.value = JSON.parse(response.data.definitionJson);
        }
      } catch (e) {
        console.error('Failed to parse definitionJson:', e);
      }
    }
  } catch (err: any) {
    console.error('Failed to load workflow detail:', err);
    showError(err.message || '加载工作流详情失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWorkflowDetail();
});
</script>

<style scoped>
.workflow-detail {
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

.detail-container {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.definition-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
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

.workflow-basic {
  flex: 1;
}

.workflow-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.workflow-version {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.info-section {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  word-break: break-all;
}

.mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.badge-success {
  display: inline-block;
  padding: 2px 8px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-warning {
  display: inline-block;
  padding: 2px 8px;
  background: #fef3c7;
  color: #d97706;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.definition-content {
  padding: 20px;
}

.definition-section {
  margin-bottom: 24px;
}

.definition-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.nodes-list,
.edges-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.node-id {
  font-size: 12px;
  color: #6b7280;
  min-width: 120px;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  flex: 1;
}

.node-type {
  font-size: 12px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 999px;
}

.edge-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.edge-source,
.edge-target {
  font-size: 12px;
  color: #374151;
  min-width: 120px;
}

.arrow-icon {
  color: #9ca3af;
}

.empty-text {
  font-size: 14px;
  color: #9ca3af;
  padding: 20px;
  text-align: center;
}
</style>
