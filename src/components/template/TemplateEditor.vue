<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="template-editor-modal">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEdit ? '编辑模板' : '创建模板' }}</h2>
        <button class="close-btn" @click="$emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-content">
        <div class="form-group">
          <label class="form-label">模板名称 <span class="required">*</span></label>
          <input
            v-model="formData.name"
            type="text"
            class="form-input"
            placeholder="输入模板名称"
            maxlength="128"
          />
        </div>

        <div class="form-group">
          <label class="form-label">描述</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            rows="3"
            placeholder="输入模板描述（可选）"
            maxlength="512"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">分类</label>
            <input
              v-model="formData.category"
              type="text"
              class="form-input"
              placeholder="输入分类（可选）"
              maxlength="64"
              list="category-list"
            />
            <datalist id="category-list">
              <option v-for="cat in categories" :key="cat" :value="cat" />
            </datalist>
          </div>

          <div class="form-group" v-if="isEdit">
            <label class="form-label">可见性</label>
            <select v-model="formData.visibility" class="form-input">
              <option value="PRIVATE">私有</option>
              <option value="ORGANIZATION">组织内</option>
              <option value="PUBLIC">公开</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">标签</label>
          <div class="tags-input-container">
            <div class="tags-display">
              <span v-for="(tag, index) in formData.tags" :key="tag" class="tag-item">
                {{ tag }}
                <button type="button" class="tag-remove" @click="removeTag(index)">
                  <X class="w-3 h-3" />
                </button>
              </span>
              <input
                v-model="tagInput"
                type="text"
                class="tag-input"
                placeholder="输入标签后按回车添加"
                @keydown.enter.prevent="addTag"
                @keydown.backspace="handleBackspace"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label-row">
            <label class="form-label">工作流定义 <span class="required">*</span></label>
            <div class="form-actions">
              <button type="button" class="link-btn" @click="importFromClipboard">
                <Clipboard class="w-4 h-4" />
                从剪贴板导入
              </button>
              <button type="button" class="link-btn" @click="formatDefinition">
                <Check class="w-4 h-4" />
                格式化
              </button>
            </div>
          </div>
          <textarea
            v-model="formData.definitionJson"
            class="form-textarea code"
            rows="12"
            placeholder="输入工作流定义的 JSON"
          />
          <p v-if="definitionError" class="error-text">{{ definitionError }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!canSave || saving">
          <template v-if="saving">
            <Loader2 class="w-4 h-4 animate-spin" />
            保存中...
          </template>
          <template v-else>保存</template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { X, Clipboard, Check, Loader2 } from 'lucide-vue-next';
import { useTemplateStore } from '../../stores/template';
import { ApiError } from '../../utils/api';
import type { WorkflowTemplate, TemplateVisibility } from '../../types/api';

const props = defineProps<{
  templateId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const templateStore = useTemplateStore();

const isEdit = computed(() => !!props.templateId);
const categories = computed(() => templateStore.categories);

const formData = ref({
  name: '',
  description: '',
  category: '',
  tags: [] as string[],
  definitionJson: '',
  visibility: 'PRIVATE' as TemplateVisibility,
});

const tagInput = ref('');
const saving = ref(false);
const loading = ref(false);
const definitionError = ref('');

const canSave = computed(() => {
  if (!formData.value.name.trim()) return false;
  if (!formData.value.definitionJson.trim()) return false;
  if (definitionError.value) return false;
  return true;
});

function validateDefinition(): boolean {
  if (!formData.value.definitionJson.trim()) {
    definitionError.value = '';
    return true;
  }
  try {
    JSON.parse(formData.value.definitionJson);
    definitionError.value = '';
    return true;
  } catch {
    definitionError.value = 'JSON 格式无效';
    return false;
  }
}

function formatDefinition(): void {
  if (!formData.value.definitionJson.trim()) return;
  try {
    const parsed = JSON.parse(formData.value.definitionJson);
    formData.value.definitionJson = JSON.stringify(parsed, null, 2);
    definitionError.value = '';
  } catch {
    definitionError.value = 'JSON 格式无效，无法格式化';
  }
}

async function importFromClipboard(): Promise<void> {
  try {
    const text = await navigator.clipboard.readText();
    if (text.trim()) {
      formData.value.definitionJson = text;
      validateDefinition();
    }
  } catch {
    alert('无法访问剪贴板');
  }
}

function addTag(): void {
  const tag = tagInput.value.trim();
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag);
  }
  tagInput.value = '';
}

function removeTag(index: number): void {
  formData.value.tags.splice(index, 1);
}

function handleBackspace(): void {
  if (!tagInput.value && formData.value.tags.length > 0) {
    formData.value.tags.pop();
  }
}

async function fetchTemplate(): Promise<void> {
  if (!props.templateId) return;
  loading.value = true;
  try {
    const template = await templateStore.fetchTemplate(props.templateId);
    formData.value = {
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      tags: [...template.tags],
      definitionJson: template.definitionJson,
      visibility: template.visibility,
    };
  } catch (e: unknown) {
    const error = e instanceof ApiError ? e.message : String(e);
    alert(`加载模板失败: ${error}`);
    emit('close');
  } finally {
    loading.value = false;
  }
}

async function handleSave(): Promise<void> {
  if (!canSave.value) return;
  if (!validateDefinition()) return;

  saving.value = true;
  try {
    if (isEdit.value && props.templateId) {
      await templateStore.updateTemplate(props.templateId, {
        name: formData.value.name,
        description: formData.value.description || undefined,
        category: formData.value.category || undefined,
        tags: formData.value.tags.length > 0 ? formData.value.tags : undefined,
        definitionJson: formData.value.definitionJson,
        visibility: formData.value.visibility,
      });
    } else {
      await templateStore.createTemplate({
        name: formData.value.name,
        description: formData.value.description || undefined,
        category: formData.value.category || undefined,
        tags: formData.value.tags.length > 0 ? formData.value.tags : undefined,
        definitionJson: formData.value.definitionJson,
      });
    }
    emit('saved');
  } catch (e: unknown) {
    const error = e instanceof ApiError ? e.message : String(e);
    alert(`保存失败: ${error}`);
  } finally {
    saving.value = false;
  }
}

function resetForm(): void {
  formData.value = {
    name: '',
    description: '',
    category: '',
    tags: [],
    definitionJson: '',
    visibility: 'PRIVATE',
  };
  tagInput.value = '';
  definitionError.value = '';
}

watch(() => formData.value.definitionJson, () => {
  validateDefinition();
});

watch(() => props.templateId, (newId) => {
  if (newId) {
    fetchTemplate();
  } else {
    resetForm();
  }
});

onMounted(async () => {
  if (categories.value.length === 0) {
    await templateStore.fetchCategories();
  }
  if (props.templateId) {
    await fetchTemplate();
  } else {
    resetForm();
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.template-editor-modal {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.link-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  font-size: 13px;
  color: #3b82f6;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.link-btn:hover {
  color: #1d4ed8;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  resize: vertical;
  transition: all 0.2s;
  box-sizing: border-box;
  line-height: 1.6;
}

.form-textarea:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.error-text {
  font-size: 13px;
  color: #ef4444;
  margin-top: 8px;
}

.tags-input-container {
  width: 100%;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.tags-display:focus-within {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 13px;
  color: #374151;
  background: #e5e7eb;
  border-radius: 6px;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.tag-remove:hover {
  background: #d1d5db;
  color: #374151;
}

.tag-input {
  flex: 1;
  min-width: 120px;
  padding: 4px 0;
  font-size: 14px;
  border: none;
  background: transparent;
  outline: none;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
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

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
