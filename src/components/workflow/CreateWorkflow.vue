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
        <button
          class="btn btn-test"
          :disabled="testStore.isRunning"
          @click="handleRunTestClick"
        >
          <Play v-if="!testStore.isRunning" class="w-4 h-4" />
          <Loader v-else class="w-4 h-4 spin" />
          <span>{{ testStore.isRunning ? '测试中...' : '运行测试' }}</span>
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
        <CanvasEditor ref="canvasEditorRef" @runTestFromNode="handleRunTestFromNode" />
      </div>
      <PropertiesPanel />
      <TestResultPanel
        :visible="testStore.showTestResultPanel"
        @close="testStore.closeTestResultPanel"
        @rerun="handleRerun"
      />
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
import { ref, onUnmounted } from 'vue';
import { Save, Rocket, Play, Loader } from 'lucide-vue-next';
import { useWorkflowsStore } from '../../stores/workflows';
import { useWorkflowStore } from '../../stores/workflow';
import { useWorkflowTestStore } from '../../stores/workflowTest';
import { getComponentConfig } from '../../config/componentConfig';
import NodePanel from '../layout/NodePanel.vue';
import CanvasEditor from '../canvas/CanvasEditor.vue';
import PropertiesPanel from '../layout/PropertiesPanel.vue';
import Toast from '../common/Toast.vue';
import TestResultPanel from './TestResultPanel.vue';
import type { NodeConfig } from '../../types';
import type { ApiError } from '../../utils/api';

const workflowsStore = useWorkflowsStore();
const workflowStore = useWorkflowStore();
const testStore = useWorkflowTestStore();

const workflowName = ref('未命名工作流');
const canvasEditorRef = ref();
const showSuccessToast = ref(false);
const showErrorToast = ref(false);
const toastMessage = ref('');
const savedDraftId = ref<string>('');
const savedWorkflowId = ref<string>('');

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

function getCleanConfig(params: any): any {
  let config = params?.config || {};
  if (config && typeof config === 'object' && 'config' in config) {
    config = config.config;
  }
  return config || {};
}

async function handleSave() {
  if (!workflowName.value) {
    showError('请输入工作流名称');
    return;
  }

  try {
    const nodes = workflowStore.nodes.map(node => {
      const componentConfig = getComponentConfig(node.type);
      let currentConfig = getCleanConfig(node.params);
      const finalConfig: Record<string, any> = { ...currentConfig };

      if (componentConfig) {
        for (const field of componentConfig.fields) {
          if (field.default !== undefined && finalConfig[field.name] === undefined) {
            finalConfig[field.name] = field.default;
          }
        }
      }

      return {
        id: node.id,
        type: node.type,
        label: node.label,
        config: finalConfig,
      };
    });

    const edges = workflowStore.edges.map(edge => ({
      id: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      label: '',
    }));

    const result = await workflowsStore.saveWorkflowDefinition(
      savedWorkflowId.value || null,
      savedDraftId.value || null,
      workflowName.value,
      '',
      { nodes, edges }
    );

    if (result && result.draftId) {
      savedDraftId.value = result.draftId;
      savedWorkflowId.value = result.workflowId;
      testStore.setDraftId(result.draftId);
    } else {
      showError('保存成功，但没有获取到草稿 ID，请刷新页面重试');
      return;
    }

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

function handleRunTestClick() {
  handleRunTest();
}

async function handleRunTest(startNodeId?: string) {
  if (!savedDraftId.value) {
    showError('请先保存草稿后再运行测试');
    return;
  }

  try {
    await testStore.runTest(startNodeId);
  } catch (err: any) {
    console.error('Failed to run test:', err);
    if (err.name === 'ApiError') {
      const apiErr = err as ApiError;
      showError(apiErr.detail || apiErr.message || '运行测试失败');
    } else {
      showError(err.message || '运行测试失败，请稍后重试');
    }
  }
}

function handleRunTestFromNode(nodeId: string) {
  handleRunTest(nodeId);
}

function handleRerun() {
  handleRunTest();
}

onUnmounted(() => {
  testStore.stopPolling();
});

async function handlePublish() {
  if (!workflowName.value) {
    showError('请输入工作流名称');
    return;
  }

  try {
    const nodes = workflowStore.nodes.map(node => {
      const componentConfig = getComponentConfig(node.type);
      let currentConfig = getCleanConfig(node.params);
      const finalConfig: Record<string, any> = { ...currentConfig };

      if (componentConfig) {
        for (const field of componentConfig.fields) {
          if (field.default !== undefined && finalConfig[field.name] === undefined) {
            finalConfig[field.name] = field.default;
          }
        }
      }

      return {
        id: node.id,
        type: node.type,
        label: node.label,
        config: finalConfig,
      };
    });

    const edges = workflowStore.edges.map(edge => ({
      id: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      label: '',
    }));

    const result = await workflowsStore.saveWorkflowDefinition(
      savedWorkflowId.value || null,
      savedDraftId.value || null,
      workflowName.value,
      '',
      { nodes, edges }
    );

    if (result && result.draftId) {
      savedDraftId.value = result.draftId;
      savedWorkflowId.value = result.workflowId;
      testStore.setDraftId(result.draftId);
    } else {
      showError('保存失败，没有获取到草稿 ID');
      return;
    }

    await workflowsStore.publishWorkflow(result.workflowId);
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

.btn-test {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
}

.btn-test:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
