<template>
  <div v-if="visible" class="test-input-dialog-overlay" @click.self="handleCancel">
    <div class="test-input-dialog">
      <div class="dialog-header">
        <h3 class="dialog-title">输入测试数据</h3>
        <button class="dialog-close-btn" @click="handleCancel">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="dialog-body">
        <div class="mode-tabs">
          <button
            class="mode-tab"
            :class="{ active: inputMode === 'form' }"
            @click="inputMode = 'form'"
          >
            简易模式
          </button>
          <button
            class="mode-tab"
            :class="{ active: inputMode === 'json' }"
            @click="inputMode = 'json'"
          >
            JSON 模式
          </button>
        </div>

        <div v-if="inputMode === 'form'" class="form-mode">
          <div class="form-hint">
            添加测试数据的键值对，点击"+"添加更多字段
          </div>
          <div class="kv-list">
            <div v-for="(item, index) in kvPairs" :key="index" class="kv-item">
              <input
                v-model="item.key"
                class="kv-input kv-key"
                placeholder="字段名"
                @input="syncFromKv"
              />
              <span class="kv-separator">:</span>
              <input
                v-model="item.value"
                class="kv-input kv-value"
                placeholder="值"
                @input="syncFromKv"
              />
              <button class="kv-remove-btn" @click="removeKvPair(index)">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          <button class="add-kv-btn" @click="addKvPair">
            <Plus class="w-4 h-4" />
            <span>添加字段</span>
          </button>
        </div>

        <div v-if="inputMode === 'json'" class="json-mode">
          <div class="input-section">
            <label class="input-label">测试输入 (JSON 格式)</label>
            <textarea
              v-model="testInputJson"
              class="json-textarea"
              placeholder='{"key": "value"}'
              :class="{ error: hasJsonError }"
              @input="syncFromJson"
            ></textarea>
            <p v-if="hasJsonError" class="error-message">请输入有效的 JSON 格式</p>
          </div>
        </div>

        <div class="options-section">
          <label class="checkbox-label">
            <input v-model="saveAsDefault" type="checkbox" class="checkbox-input" />
            <span>保存为默认测试输入</span>
          </label>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleCancel">
          取消
        </button>
        <button
          class="btn btn-primary"
          :disabled="isRunning || hasJsonError"
          @click="handleRun"
        >
          <Play v-if="!isRunning" class="w-4 h-4" />
          <Loader v-else class="w-4 h-4 spin" />
          <span>{{ isRunning ? '运行中...' : '运行测试' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Play, Loader, Plus } from 'lucide-vue-next';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'run', testInput: Record<string, any> | undefined, saveAsDefault: boolean): void;
}>();
const inputMode = ref<'form' | 'json'>('form');
const testInputJson = ref('{}');
const kvPairs = ref<{ key: string; value: string }[]>([]);
const saveAsDefault = ref(false);
const isRunning = ref(false);

const hasJsonError = computed(() => {
  if (!testInputJson.value.trim()) return false;
  try {
    JSON.parse(testInputJson.value);
    return false;
  } catch {
    return true;
  }
});

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // testStore.defaultTestInput 暂时不存在，先用默认值
    testInputJson.value = '{}';
    saveAsDefault.value = false;
    syncFromJson();
  }
});

function syncFromJson() {
  try {
    const parsed = JSON.parse(testInputJson.value || '{}');
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      kvPairs.value = Object.entries(parsed).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }));
    }
  } catch {
  }
}

function syncFromKv() {
  const result: Record<string, any> = {};
  for (const pair of kvPairs.value) {
    if (pair.key.trim()) {
      let value: any = pair.value;
      try {
        value = JSON.parse(pair.value);
      } catch {
      }
      result[pair.key.trim()] = value;
    }
  }
  testInputJson.value = JSON.stringify(result, null, 2);
}

function addKvPair() {
  kvPairs.value.push({ key: '', value: '' });
}

function removeKvPair(index: number) {
  kvPairs.value.splice(index, 1);
  syncFromKv();
}

function handleCancel() {
  emit('cancel');
}

function handleRun() {
  let testInput: Record<string, any> | undefined;

  if (testInputJson.value.trim()) {
    try {
      testInput = JSON.parse(testInputJson.value);
      if (testInput && typeof testInput === 'object' && Object.keys(testInput).length === 0) {
        testInput = undefined;
      }
    } catch {
      return;
    }
  }

  isRunning.value = true;
  emit('run', testInput, saveAsDefault.value);
}

function resetState() {
  isRunning.value = false;
}

defineExpose({
  resetState,
});
</script>

<style scoped>
.test-input-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.test-input-dialog {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 540px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.dialog-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.dialog-body {
  padding: 20px 24px;
  overflow-y: auto;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 10px;
}

.mode-tab {
  flex: 1;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-tab:hover {
  color: #374151;
}

.mode-tab.active {
  background: #ffffff;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-mode {
  margin-bottom: 20px;
}

.form-hint {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.kv-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.kv-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kv-input {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
}

.kv-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.kv-key {
  flex: 1;
  max-width: 140px;
}

.kv-value {
  flex: 2;
}

.kv-separator {
  color: #9ca3af;
  font-weight: 500;
}

.kv-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.kv-remove-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.add-kv-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  border: 1px dashed #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-kv-btn:hover {
  background: #dbeafe;
}

.json-mode {
}

.input-section {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.json-textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1f2937;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  resize: vertical;
  transition: all 0.2s;
  box-sizing: border-box;
}

.json-textarea:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.json-textarea.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.error-message {
  font-size: 13px;
  color: #ef4444;
  margin-top: 8px;
}

.options-section {
  margin-bottom: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>
