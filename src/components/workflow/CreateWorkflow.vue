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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Save, Rocket } from 'lucide-vue-next';
import { useWorkflowsStore } from '../../stores/workflows';
import NodePanel from '../layout/NodePanel.vue';
import CanvasEditor from '../canvas/CanvasEditor.vue';
import PropertiesPanel from '../layout/PropertiesPanel.vue';
import type { NodeConfig } from '../../types';

const workflowsStore = useWorkflowsStore();

const workflowName = ref('未命名工作流');
const canvasEditorRef = ref();

function handleNodeDragStart(event: DragEvent, node: NodeConfig) {
  canvasEditorRef.value?.handleNodeDrop(node, event);
}

async function handleSave() {
  if (!workflowName.value) {
    alert('请输入工作流名称');
    return;
  }

  await workflowsStore.createWorkflow(workflowName.value);
  alert('已保存到草稿！');
}

async function handlePublish() {
  if (!workflowName.value) {
    alert('请输入工作流名称');
    return;
  }

  const workflow = await workflowsStore.createWorkflow(workflowName.value);
  await workflowsStore.publishWorkflow(workflow.id);
  alert('工作流已发布！');
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
