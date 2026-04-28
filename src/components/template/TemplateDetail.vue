<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="template-detail-modal">
      <div v-if="loading" class="loading-container">
        <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
        <p class="loading-text">加载中...</p>
      </div>

      <template v-else-if="template">
        <div class="modal-header">
          <div class="header-left">
            <button class="back-btn" @click="$emit('close')">
              <ArrowLeft class="w-5 h-5" />
            </button>
            <h2 class="modal-title">{{ template.name }}</h2>
          </div>
          <div class="header-right">
            <div class="template-badges">
              <span v-if="template.isOfficial" class="badge official">官方</span>
              <span v-if="template.visibility === 'PUBLIC'" class="badge public">公开</span>
              <span v-else-if="template.visibility === 'ORGANIZATION'" class="badge organization">组织</span>
              <span v-else class="badge private">私有</span>
            </div>
            <div class="header-actions">
              <button
                v-if="template.canEdit"
                class="btn btn-secondary"
                @click="$emit('edit', template.id)"
              >
                <Edit class="w-4 h-4" />
                编辑
              </button>
              <button
                v-if="template.canEdit"
                class="btn btn-danger"
                @click="confirmDelete"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="modal-content">
          <!-- 模板信息 -->
          <div class="template-info">
            <p class="template-description">{{ template.description || '暂无描述' }}</p>

            <div class="info-grid">
              <div class="info-item">
                <User class="w-4 h-4" />
                <div class="info-content">
                  <span class="info-label">创建者</span>
                  <span class="info-value">{{ template.createdByName }}</span>
                </div>
              </div>
              <div class="info-item">
                <Calendar class="w-4 h-4" />
                <div class="info-content">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{ formatDate(template.createdAt) }}</span>
                </div>
              </div>
              <div class="info-item">
                <Download class="w-4 h-4" />
                <div class="info-content">
                  <span class="info-label">使用次数</span>
                  <span class="info-value">{{ template.usageCount }} 次</span>
                </div>
              </div>
              <div class="info-item">
                <Heart class="w-4 h-4" />
                <div class="info-content">
                  <span class="info-label">点赞数</span>
                  <span class="info-value">{{ template.likesCount }}</span>
                </div>
              </div>
            </div>

            <div v-if="template.category" class="category-section">
              <Folder class="w-4 h-4" />
              <span class="category-label">分类：</span>
              <span class="category-value">{{ template.category }}</span>
            </div>

            <div v-if="template.tags?.length > 0" class="tags-section">
              <Tag class="w-4 h-4" />
              <div class="tags-list">
                <span v-for="tag in template.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
          </div>

          <!-- 预览区域 -->
          <div class="preview-section">
            <h3 class="section-title">
              <Eye class="w-4 h-4" />
              模板预览
            </h3>
            <div class="preview-box">
              <pre class="definition-json">{{ formatJson(template.definitionJson) }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="like-btn"
            :class="{ liked: template.likedByCurrentUser }"
            @click="toggleLike"
          >
            <Heart class="w-5 h-5" :fill="template.likedByCurrentUser ? 'currentColor' : 'none'" />
            <span>{{ template.likedByCurrentUser ? '已点赞' : '点赞' }}</span>
            <span class="like-count">({{ template.likesCount }})</span>
          </button>
          <button class="btn btn-primary use-btn" @click="handleUse">
            <Zap class="w-4 h-4" />
            使用模板
          </button>
        </div>
      </template>
    </div>

    <!-- 使用模板确认框 -->
    <div v-if="showUseConfirm" class="modal-overlay" @click.self="showUseConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-icon">
          <Zap class="w-10 h-10 text-blue-500" />
        </div>
        <h3 class="confirm-title">使用此模板</h3>
        <p class="confirm-desc">基于此模板创建新的工作流</p>
        <div class="form-group">
          <label class="form-label">工作流名称</label>
          <input
            v-model="workflowName"
            type="text"
            class="form-input"
            placeholder="输入工作流名称"
          />
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showUseConfirm = false">取消</button>
          <button class="btn btn-primary" @click="confirmUse" :disabled="using">
            <template v-if="using">
              <Loader2 class="w-4 h-4 animate-spin" />
              创建中...
            </template>
            <template v-else>创建工作流</template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Calendar,
  Download,
  Heart,
  Folder,
  Tag,
  Eye,
  Zap,
  Loader2,
} from 'lucide-vue-next';
import { useTemplateStore } from '../../stores/template';
import { ApiError } from '../../utils/api';
import type { WorkflowTemplate } from '../../types/api';

const props = defineProps<{
  templateId: number;
}>();

const emit = defineEmits<{
  close: [];
  use: [workflowId: string];
  edit: [templateId: number];
  delete: [templateId: number];
}>();

const templateStore = useTemplateStore();

const template = ref<WorkflowTemplate | null>(null);
const loading = ref(false);
const liking = ref(false);
const using = ref(false);
const showUseConfirm = ref(false);
const workflowName = ref('');

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN');
}

function formatJson(jsonStr: string): string {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
}

async function fetchTemplate(): Promise<void> {
  loading.value = true;
  try {
    template.value = await templateStore.fetchTemplate(props.templateId);
    workflowName.value = `${template.value.name} - 副本`;
  } catch (e: unknown) {
    const error = e instanceof ApiError ? e.message : String(e);
    alert(`加载模板失败: ${error}`);
    emit('close');
  } finally {
    loading.value = false;
  }
}

async function toggleLike(): Promise<void> {
  if (!template.value || liking.value) return;
  liking.value = true;
  try {
    if (template.value.likedByCurrentUser) {
      await templateStore.unlikeTemplate(template.value.id);
    } else {
      await templateStore.likeTemplate(template.value.id);
    }
    // 重新获取最新状态
    await fetchTemplate();
  } catch (e: unknown) {
    const error = e instanceof ApiError ? e.message : String(e);
    alert(`操作失败: ${error}`);
  } finally {
    liking.value = false;
  }
}

function handleUse(): void {
  showUseConfirm.value = true;
}

async function confirmUse(): Promise<void> {
  if (!template.value || using.value) return;
  using.value = true;
  try {
    const result = await templateStore.useTemplate(
      template.value.id,
      workflowName.value || undefined
    );
    showUseConfirm.value = false;
    emit('use', result.workflowId);
  } catch (e: unknown) {
    const error = e instanceof ApiError ? e.message : String(e);
    alert(`创建工作流失败: ${error}`);
  } finally {
    using.value = false;
  }
}

function confirmDelete(): void {
  if (!template.value) return;
  if (confirm('确定要删除此模板吗？此操作不可撤销。')) {
    emit('delete', template.value.id);
  }
}

watch(() => props.templateId, () => {
  if (props.templateId) {
    fetchTemplate();
  }
});

onMounted(() => {
  if (props.templateId) {
    fetchTemplate();
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

.template-detail-modal {
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.loading-container {
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.back-btn {
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
  flex-shrink: 0;
}

.back-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.template-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
}

.badge.official {
  background: #fef3c7;
  color: #92400e;
}

.badge.public {
  background: #dcfce7;
  color: #166534;
}

.badge.organization {
  background: #dbeafe;
  color: #1e40af;
}

.badge.private {
  background: #f3f4f6;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 8px;
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

.btn-danger {
  background: #fee2e2;
  color: #ef4444;
  padding: 10px;
}

.btn-danger:hover {
  background: #fecaca;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.template-info {
  margin-bottom: 24px;
}

.template-description {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
}

.info-item svg {
  color: #9ca3af;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 12px;
  color: #9ca3af;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.category-section,
.tags-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 12px;
}

.category-section svg,
.tags-section svg {
  color: #9ca3af;
  flex-shrink: 0;
}

.category-label {
  font-size: 14px;
  color: #6b7280;
}

.category-value {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  font-size: 12px;
  color: #6b7280;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.preview-section {
  border-top: 1px solid #f3f4f6;
  padding-top: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.section-title svg {
  color: #9ca3af;
}

.preview-box {
  background: #1f2937;
  border-radius: 12px;
  padding: 20px;
  overflow: auto;
  max-height: 400px;
}

.definition-json {
  margin: 0;
  font-size: 12px;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.like-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

.like-btn.liked {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

.like-count {
  color: #9ca3af;
}

.use-btn {
  gap: 8px;
}

.confirm-modal {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.confirm-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.form-group {
  margin-bottom: 24px;
  text-align: left;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
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

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
