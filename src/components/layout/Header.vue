<template>
  <header class="header">
    <div class="header-left">
      <div class="logo">
        <div class="logo-icon">
          <Workflow class="w-5 h-5 text-white" />
        </div>
        <span class="logo-text">Workline</span>
      </div>
      <div class="divider"></div>
      <input
        v-model="localName"
        @blur="updateName"
        @keyup.enter="updateName"
        class="workflow-name"
        placeholder="工作流名称"
      />
    </div>
    <div class="header-right">
      <button class="btn btn-secondary" @click="handleClear">
        <Trash2 class="w-4 h-4" />
        <span>清空</span>
      </button>
      <button class="btn btn-secondary" @click="handleExport">
        <Download class="w-4 h-4" />
        <span>导出</span>
      </button>
      <div class="divider"></div>
      <button class="btn btn-primary" @click="handleSave" :disabled="isSaving">
        <template v-if="isSaving">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>保存中...</span>
        </template>
        <template v-else>
          <Save class="w-4 h-4" />
          <span>保存</span>
        </template>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Workflow, Trash2, Download, Save, Loader2 } from 'lucide-vue-next';
import { useWorkflowStore } from '../../stores/workflow';

const store = useWorkflowStore();
const localName = ref(store.workflowName);

watch(() => store.workflowName, (newName) => {
  localName.value = newName;
});

function updateName() {
  store.setWorkflowName(localName.value);
}

function handleClear() {
  if (window.confirm('确定要清空画布吗？此操作不可撤销。')) {
    store.clearCanvas();
  }
}

function handleExport() {
  const workflow = store.exportWorkflow();
  const dataStr = JSON.stringify(workflow, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workflow.name || 'workflow'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleSave() {
  store.isSaving = true;
  // 模拟保存
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('保存工作流:', store.exportWorkflow());
  store.isSaving = false;
  alert('工作流已保存！');
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
}

.workflow-name {
  padding: 6px 10px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background: transparent;
  border: none;
  border-radius: 6px;
  outline: none;
  transition: background 0.2s;
}

.workflow-name:hover {
  background: #f3f4f6;
}

.workflow-name:focus {
  background: #f3f4f6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  color: #4b5563;
  background: transparent;
}

.btn-secondary:hover {
  color: #1f2937;
  background: #f3f4f6;
}

.btn-primary {
  color: #ffffff;
  background: #3b82f6;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}
</style>
