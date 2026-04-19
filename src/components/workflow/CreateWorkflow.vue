<template>
  <div class="create-workflow">
    <div class="workflow-header">
      <div class="header-left">
        <h1 class="page-title">创建工作流</h1>
        <input
          v-model="workflowName"
          class="workflow-name-input"
          placeholder="输入工作流名称"
        />
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="handleSave">
          <Save class="w-4 h-4" />
          <span>保存草稿</span>
        </button>
        <button class="btn btn-primary" @click="handlePublish">
          <Rocket class="w-4 h-4" />
          <span>发布</span>
        </button>
      </div>
    </div>

    <div class="workflow-content">
      <NodePanel @dragstart="handleNodeDragStart" />
      <div class="canvas-area">
        <CanvasEditor ref="canvasEditorRef" />
      </div>
      <PropertiesPanel />
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
import { ref, onMounted } from 'vue';
import { Save, Rocket } from 'lucide-vue-next';
import { useWorkflowsStore } from '../../stores/workflows';
import { useWorkflowStore } from '../../stores/workflow';
import NodePanel from '../layout/NodePanel.vue';
import CanvasEditor from '../canvas/CanvasEditor.vue';
import PropertiesPanel from '../layout/PropertiesPanel.vue';
import Toast from '../common/Toast.vue';
import type { NodeConfig } from '../../types';
import type { ApiError } from '../../utils/api';

const workflowsStore = useWorkflowsStore();
const workflowStore = useWorkflowStore();

const workflowName = ref('未命名工作流');
const canvasEditorRef = ref();
const showSuccessToast = ref(false);
const showErrorToast = ref(false);
const toastMessage = ref('');

function handleNodeDragStart(event: DragEvent, node: NodeConfig) {
  canvasEditorRef.value?.handleNodeDrop(node, event);
}

function showSuccess(message: string) {
  toastMessage.value = message;
  showSuccessToast.value = true;
}

function showError(message: string) {
  toastMessage.value = message;
  showErrorToast.value = true;
}

async function handleSave() {
  if (!workflowName.value) {
    showError('请输入工作流名称');
    return;
  }

  try {
    // 转换节点数据格式
    const nodes = workflowStore.nodes.map(node => ({
      id: node.id,
      type: node.type,
      label: node.label,
      config: node.params || {},
    }));

    // 转换边数据格式
    const edges = workflowStore.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
    }));

    await workflowsStore.saveWorkflowDefinition(
      null,
      workflowName.value,
      '',
      { nodes, edges }
    );
    showSuccess('已保存到草稿！');
  } catch (err: any) {
    console.error('Failed to save workflow:', err);
    if (err.name === 'ApiError') {
      const apiErr = err as ApiError;
      showError(apiErr.detail || apiErr.message || '保存失败');
    } else {
      showError(err.message || '保存失败，请稍后重试');
    }
  }
}

async function handlePublish() {
  if (!workflowName.value) {
    showError('请输入工作流名称');
    return;
  }

  try {
    // 转换节点数据格式
    const nodes = workflowStore.nodes.map(node => ({
      id: node.id,
      type: node.type,
      label: node.label,
      config: node.params || {},
    }));

    // 转换边数据格式
    const edges = workflowStore.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
    }));

    const workflowId = await workflowsStore.saveWorkflowDefinition(
      null,
      workflowName.value,
      '',
      { nodes, edges }
    );
    await workflowsStore.publishWorkflow(workflowId);
    showSuccess('工作流已发布！');
  } catch (err: any) {
    console.error('Failed to publish workflow:', err);
    if (err.name === 'ApiError') {
      const apiErr = err as ApiError;
      showError(apiErr.detail || apiErr.message || '发布失败');
    } else {
      showError(err.message || '发布失败，请稍后重试');
    }
  }
}
</script>

<style scoped>
.create-workflow {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

.workflow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.workflow-name-input {
  padding: 8px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
  min-width: 200px;
}

.workflow-name-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
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

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.workflow-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  overflow: hidden;
}
</style>
