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
          <button class="delete-node-btn" @click="handleDeleteNode" title="删除节点">
            <Trash2 class="w-4 h-4" />
          </button>
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

      <!-- 组件配置字段 -->
      <div v-if="componentConfig && componentConfig.fields.length > 0" class="section">
        <div class="section-title">
          <Sliders class="w-4 h-4" />
          <span>组件配置</span>
        </div>
        <div class="fields-container">
          <div v-for="field in componentConfig.fields" :key="field.name" class="form-item">
            <div class="field-header">
              <label class="form-label">
                {{ field.label }}
                <span v-if="field.required" class="field-required">*</span>
              </label>
            </div>
            <p v-if="field.description" class="field-description">{{ field.description }}</p>

            <!-- String Input -->
            <input
              v-if="field.type === 'string'"
              type="text"
              :value="getConfigValue(field.name, field.default)"
              @input="updateConfigField(field.name, ($event.target as HTMLInputElement).value)"
              class="form-input"
              :placeholder="field.placeholder"
            />

            <!-- Number Input -->
            <input
              v-else-if="field.type === 'number'"
              type="number"
              :value="getConfigValue(field.name, field.default)"
              @input="updateConfigField(field.name, Number(($event.target as HTMLInputElement).value))"
              class="form-input"
              :placeholder="field.placeholder"
            />

            <!-- Boolean Checkbox -->
            <label v-else-if="field.type === 'boolean'" class="checkbox-label">
              <input
                type="checkbox"
                :checked="getConfigValue(field.name, field.default)"
                @change="updateConfigField(field.name, ($event.target as HTMLInputElement).checked)"
                class="form-checkbox"
              />
              <span>启用</span>
            </label>

            <!-- Select Dropdown -->
            <select
              v-else-if="field.type === 'select'"
              :value="getConfigValue(field.name, field.default)"
              @change="updateConfigField(field.name, ($event.target as HTMLSelectElement).value)"
              class="form-input"
            >
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>

            <!-- Textarea -->
            <textarea
              v-else-if="field.type === 'textarea'"
              :value="getConfigValue(field.name, field.default)"
              @input="updateConfigField(field.name, ($event.target as HTMLTextAreaElement).value)"
              class="form-textarea"
              rows="4"
              :placeholder="field.placeholder"
            />

            <!-- Code Editor -->
            <div v-else-if="field.type === 'code'" class="code-field-wrapper">
              <textarea
                :value="getConfigValue(field.name, field.default)"
                @input="updateConfigField(field.name, ($event.target as HTMLTextAreaElement).value)"
                class="form-textarea font-mono"
                rows="6"
                :placeholder="field.placeholder"
              />
            </div>

            <!-- List Field -->
            <div v-else-if="field.type === 'list' && field.listFields" class="list-field-wrapper">
              <div class="list-items">
                <div
                  v-for="(item, index) in getListValue(field.name)"
                  :key="index"
                  class="list-item"
                >
                  <div class="list-item-content">
                    <div v-for="listField in field.listFields" :key="listField.name" class="form-item">
                      <label class="form-label-sm">{{ listField.label }}</label>
                      <input
                        v-if="listField.type === 'string'"
                        type="text"
                        :value="item[listField.name] || listField.default || ''"
                        @input="updateListItemField(field.name, index, listField.name, ($event.target as HTMLInputElement).value)"
                        class="form-input form-input-sm"
                        :placeholder="listField.placeholder"
                      />
                    </div>
                  </div>
                  <button class="remove-item-btn" @click="removeListItem(field.name, index)">
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button class="add-item-btn" @click="addListItem(field.name, field.listFields)">
                <Plus class="w-4 h-4" />
                <span>添加项</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 脚本编辑器 -->
      <div v-if="componentConfig && componentConfig.supportsScript" class="section">
        <div class="section-title">
          <Code2 class="w-4 h-4" />
          <span>脚本编辑</span>
        </div>
        <div class="script-editor-wrapper">
          <div class="script-hint">
            <span class="hint-icon">ƒ</span>
            <span class="hint-text">transform(msg, metadata)</span>
          </div>
          <textarea
            :value="getScriptValue()"
            @input="updateScript(($event.target as HTMLTextAreaElement).value)"
            class="form-textarea font-mono script-editor"
            rows="12"
            placeholder="编写数据转换脚本..."
          />
          <div class="script-docs">
            <p class="docs-title">参数说明:</p>
            <ul class="docs-list">
              <li><code>msg</code> - 输入消息对象</li>
              <li><code>metadata</code> - 元数据（如 MQTT topic）</li>
            </ul>
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
import { ref, computed, watch, onMounted } from 'vue';
import { Settings, Sliders, Link, MousePointerClick, Trash2, Plus, Code2 } from 'lucide-vue-next';
import * as Icons from 'lucide-vue-next';
import { useWorkflowStore } from '../../stores/workflow';
import { useDatasourceStore } from '../../stores/datasource';
import { useComponentsStore } from '../../stores/components';
import { getComponentConfig, type ComponentConfig } from '../../config/componentConfig';
import type { NodeConfig } from '../../types';

const store = useWorkflowStore();
const datasourceStore = useDatasourceStore();
const componentsStore = useComponentsStore();

const localLabel = ref('');
const localDescription = ref('');

watch(() => store.selectedNode, (node) => {
  if (node) {
    localLabel.value = node.label;
    localDescription.value = node.description || '';
  }
}, { immediate: true });

const selectedNode = computed(() => store.selectedNode);

const currentNodeConfig = computed<NodeConfig | undefined>(() => {
  if (!selectedNode.value) return undefined;
  return componentsStore.getComponentByType(selectedNode.value.type);
});

const componentConfig = computed<ComponentConfig | undefined>(() => {
  if (!selectedNode.value) return undefined;
  return getComponentConfig(selectedNode.value.type);
});

onMounted(() => {
  datasourceStore.fetchDatasources();
  if (componentsStore.allComponents.length === 0) {
    componentsStore.fetchComponents();
  }
});

const iconComponent = computed(() => {
  if (!selectedNode.value) return Icons.Circle;
  return (Icons as any)[selectedNode.value.icon] || Icons.Circle;
});

// 辅助函数：解包 config.config 嵌套
function getCleanConfig(params: any): any {
  let config = params?.config || {};
  if (config && typeof config === 'object' && 'config' in config) {
    config = config.config;
  }
  return config || {};
}

function getConfigValue(name: string, defaultValue: any = ''): any {
  if (!selectedNode.value) return defaultValue;
  const params = selectedNode.value.params || {};
  const config = getCleanConfig(params);
  return config[name] !== undefined ? config[name] : defaultValue;
}

function getListValue(name: string): any[] {
  const value = getConfigValue(name, []);
  return Array.isArray(value) ? value : [];
}

function updateConfigField(name: string, value: any) {
  if (!selectedNode.value) return;
  const params = selectedNode.value.params || {};
  const config = getCleanConfig(params);
  store.updateNode(selectedNode.value.id, {
    params: {
      ...params,
      config: {
        ...config,
        [name]: value,
      },
    },
  });
}

function updateListItemField(listName: string, index: number, fieldName: string, value: any) {
  if (!selectedNode.value) return;
  const params = selectedNode.value.params || {};
  const config = getCleanConfig(params);
  const list = [...(config[listName] || [])];
  list[index] = {
    ...list[index],
    [fieldName]: value,
  };
  store.updateNode(selectedNode.value.id, {
    params: {
      ...params,
      config: {
        ...config,
        [listName]: list,
      },
    },
  });
}

function addListItem(listName: string, listFields: any[]) {
  if (!selectedNode.value) return;
  const params = selectedNode.value.params || {};
  const config = getCleanConfig(params);
  const list = [...(config[listName] || [])];
  const newItem: any = {};
  listFields.forEach(field => {
    newItem[field.name] = field.default || '';
  });
  list.push(newItem);
  store.updateNode(selectedNode.value.id, {
    params: {
      ...params,
      config: {
        ...config,
        [listName]: list,
      },
    },
  });
}

function removeListItem(listName: string, index: number) {
  if (!selectedNode.value) return;
  const params = selectedNode.value.params || {};
  const config = params.config || {};
  const list = [...(config[listName] || [])];
  list.splice(index, 1);
  store.updateNode(selectedNode.value.id, {
    params: {
      ...params,
      config: {
        ...config,
        [listName]: list,
      },
    },
  });
}

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

function handleDeleteNode() {
  if (selectedNode.value) {
    store.removeNode(selectedNode.value.id);
  }
}

function getScriptValue(): string {
  if (!selectedNode.value || !componentConfig.value) return '';
  const params = selectedNode.value.params || {};
  const config = getCleanConfig(params);
  return config.script || componentConfig.value.defaultScript || '';
}

function updateScript(value: string) {
  if (!selectedNode.value) return;
  const params = selectedNode.value.params || {};
  const config = getCleanConfig(params);
  store.updateNode(selectedNode.value.id, {
    params: {
      ...params,
      config: {
        ...config,
        script: value,
      },
    },
  });
}
</script>

<style scoped>
.properties-panel {
  width: 320px;
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

.delete-node-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.delete-node-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
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

.field-header {
  margin-bottom: 4px;
}

.field-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.field-required {
  color: #ef4444;
  font-weight: 600;
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

.form-label-sm {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
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
  box-sizing: border-box;
}

.form-input-sm {
  padding: 6px 10px;
  font-size: 13px;
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
  box-sizing: border-box;
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

.code-field-wrapper {
  margin-top: 4px;
}

.list-field-wrapper {
  margin-top: 4px;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.list-item {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.list-item-content {
  flex: 1;
  min-width: 0;
}

.remove-item-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-item-btn:hover {
  background: #fef2f2;
}

.add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  background: #f0fdf4;
  border: 1px dashed #86efac;
  border-radius: 8px;
  color: #166534;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-item-btn:hover {
  background: #dcfce7;
  border-color: #4ade80;
}

.fields-container {
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

.font-mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.script-editor-wrapper {
  margin-top: 8px;
}

.script-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  margin-bottom: 8px;
}

.hint-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #8b5cf6;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
}

.hint-text {
  font-size: 13px;
  font-weight: 500;
  color: #5b21b6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.script-editor {
  font-size: 13px;
  line-height: 1.6;
}

.script-docs {
  margin-top: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.docs-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 6px 0;
}

.docs-list {
  margin: 0;
  padding-left: 16px;
}

.docs-list li {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.docs-list li:last-child {
  margin-bottom: 0;
}

.docs-list code {
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #374151;
}
</style>
