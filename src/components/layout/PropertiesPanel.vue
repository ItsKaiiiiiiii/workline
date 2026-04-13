<template>
  <aside class="properties-panel">
    <div class="panel-header">
      <div class="panel-title">
        <Settings class="w-5 h-5" />
        <span>属性配置</span>
      </div>
    </div>
    <div v-if="selectedNode" class="panel-content">
      <div class="section">
        <div class="node-info">
          <div class="node-icon-wrapper" :style="{ backgroundColor: selectedNode.bgColor }">
            <component :is="iconComponent" class="w-6 h-6" :style="{ color: selectedNode.color }" />
          </div>
          <div class="node-basic-info">
            <div class="node-name">{{ selectedNode.label }}</div>
            <div class="node-id">ID: {{ selectedNode.id }}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="form-item">
          <label class="form-label">名称</label>
          <input
            v-model="localLabel"
            @blur="updateLabel"
            @keyup.enter="updateLabel"
            class="form-input"
          />
        </div>
        <div class="form-item">
          <label class="form-label">描述</label>
          <textarea
            v-model="localDescription"
            @blur="updateDescription"
            class="form-textarea"
            rows="3"
            placeholder="输入组件描述..."
          />
        </div>
      </div>
      <div class="section">
        <div class="section-title">
          <Sliders class="w-4 h-4" />
          <span>参数配置</span>
        </div>
        <div class="params-list">
          <div v-for="(value, key) in selectedNode.params" :key="key" class="form-item">
            <label class="form-label capitalize">{{ key }}</label>
            <input
              v-if="typeof value === 'string'"
              :value="value"
              @input="updateParam(key, ($event.target as HTMLInputElement).value)"
              class="form-input"
            />
            <input
              v-else-if="typeof value === 'number'"
              type="number"
              :value="value"
              @input="updateParam(key, Number(($event.target as HTMLInputElement).value))"
              class="form-input"
            />
            <label v-else-if="typeof value === 'boolean'" class="checkbox-label">
              <input
                type="checkbox"
                :checked="value"
                @change="updateParam(key, ($event.target as HTMLInputElement).checked)"
                class="form-checkbox"
              />
              <span>启用</span>
            </label>
            <textarea
              v-else
              :value="JSON.stringify(value, null, 2)"
              @input="updateParamFromJson(key, ($event.target as HTMLTextAreaElement).value)"
              class="form-textarea font-mono"
              rows="3"
            />
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">
          <Link class="w-4 h-4" />
          <span>接口信息</span>
        </div>
        <div v-if="selectedNode.inputs.length > 0" class="ports-info">
          <span class="ports-label">输入:</span>
          <div class="ports-list">
            <span v-for="input in selectedNode.inputs" :key="input" class="port-tag input">
              {{ input }}
            </span>
          </div>
        </div>
        <div v-if="selectedNode.outputs.length > 0" class="ports-info">
          <span class="ports-label">输出:</span>
          <div class="ports-list">
            <span v-for="output in selectedNode.outputs" :key="output" class="port-tag output">
              {{ output }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="panel-empty">
      <MousePointerClick class="w-12 h-12 icon-empty" />
      <p class="text-empty">选择一个组件</p>
      <p class="text-empty-desc">查看和编辑属性</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Settings, Sliders, Link, MousePointerClick } from 'lucide-vue-next';
import * as Icons from 'lucide-vue-next';
import { useWorkflowStore } from '../../stores/workflow';

const store = useWorkflowStore();

const localLabel = ref('');
const localDescription = ref('');

watch(() => store.selectedNode, (node) => {
  if (node) {
    localLabel.value = node.label;
    localDescription.value = node.description || '';
  }
}, { immediate: true });

const selectedNode = computed(() => store.selectedNode);

const iconComponent = computed(() => {
  if (!selectedNode.value) return Icons.Circle;
  return (Icons as any)[selectedNode.value.icon] || Icons.Circle;
});

function updateLabel() {
  if (selectedNode.value) {
    store.updateNode(selectedNode.value.id, { label: localLabel.value });
  }
}

function updateDescription() {
  if (selectedNode.value) {
    store.updateNode(selectedNode.value.id, { description: localDescription.value });
  }
}

function updateParam(key: string, value: any) {
  if (selectedNode.value) {
    store.updateNode(selectedNode.value.id, {
      params: {
        ...selectedNode.value.params,
        [key]: value,
      },
    });
  }
}

function updateParamFromJson(key: string, jsonStr: string) {
  try {
    const value = JSON.parse(jsonStr);
    updateParam(key, value);
  } catch {
    // 忽略无效的JSON
  }
}
</script>

<style scoped>
.properties-panel {
  width: 300px;
  height: 100%;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.section {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-basic-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.node-id {
  margin-top: 2px;
  font-size: 12px;
  color: #9ca3af;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.form-item {
  margin-bottom: 14px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  resize: none;
  transition: all 0.2s;
}

.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
}

.params-list {
  margin-top: 4px;
}

.ports-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.ports-info:last-child {
  margin-bottom: 0;
}

.ports-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-top: 4px;
  flex-shrink: 0;
}

.ports-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.port-tag {
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 999px;
}

.port-tag.input {
  color: #4b5563;
  background: #f3f4f6;
}

.port-tag.output {
  color: #1d4ed8;
  background: #dbeafe;
}

.panel-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.icon-empty {
  color: #d1d5db;
  margin-bottom: 12px;
}

.text-empty {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.text-empty-desc {
  font-size: 13px;
  color: #9ca3af;
}
</style>
