<template>
  <div class="datasource-manager">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">数据源管理</h1>
        <p class="page-desc">管理和配置组织的数据源连接</p>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="showCreateModal = true">
          <Plus class="w-4 h-4" />
          <span>新建数据源</span>
        </button>
      </div>
    </div>

    <div class="manager-content">
      <div v-if="loading" class="loading-state">
        <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
        <p class="loading-text">加载中...</p>
      </div>

      <div v-else-if="datasources.length === 0" class="empty-state">
        <div class="empty-icon">
          <Database class="w-16 h-16" />
        </div>
        <h3 class="empty-title">暂无数据源</h3>
        <p class="empty-desc">创建第一个数据源连接</p>
        <button class="empty-action" @click="showCreateModal = true">
          <Plus class="w-4 h-4" />
          <span>新建数据源</span>
        </button>
      </div>

      <div v-else class="datasources-grid">
        <div
          v-for="datasource in datasources"
          :key="datasource.id"
          class="datasource-card"
        >
          <div class="card-header">
            <div class="datasource-icon" :style="{ backgroundColor: getDatasourceColor(datasource.type) }">
              <component :is="getDatasourceIcon(datasource.type)" class="w-6 h-6 text-white" />
            </div>
            <div class="datasource-type-badge">
              {{ getDatasourceLabel(datasource.type) }}
            </div>
            <div v-if="datasource.isShared" class="shared-badge">
              <Users class="w-3 h-3" />
              <span>共享</span>
            </div>
          </div>

          <div class="card-body">
            <h3 class="datasource-name">{{ datasource.name }}</h3>
            <p class="datasource-desc">{{ datasource.description || '暂无描述' }}</p>

            <div class="datasource-meta">
              <div class="meta-item">
                <Calendar class="w-4 h-4" />
                <span>创建于 {{ formatDate(datasource.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <Clock class="w-4 h-4" />
                <span>更新于 {{ formatDate(datasource.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="card-btn test-btn" @click="handleTest(datasource)" :disabled="testing[datasource.id]">
              <template v-if="testing[datasource.id]">
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>测试中</span>
              </template>
              <template v-else>
                <Zap class="w-4 h-4" />
                <span>测试连接</span>
              </template>
            </button>
            <button class="card-btn" @click="handleEdit(datasource)">
              <Edit class="w-4 h-4" />
              <span>编辑</span>
            </button>
            <button class="card-btn delete-btn" @click="handleDelete(datasource)">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="datasource-modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ showEditModal ? '编辑数据源' : '新建数据源' }}</h3>
          <button class="modal-close" @click="closeModal">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-content">
          <div v-if="!selectedType" class="type-selector">
            <div class="type-grid">
              <div
                v-for="dsConfig in datasourceLibrary"
                :key="dsConfig.type"
                class="type-option"
                :class="{ selected: creatingType === dsConfig.type }"
                @click="selectType(dsConfig.type)"
              >
                <div class="type-icon" :style="{ backgroundColor: dsConfig.color }">
                  <component :is="getDatasourceIcon(dsConfig.type)" class="w-6 h-6 text-white" />
                </div>
                <span class="type-label">{{ dsConfig.label }}</span>
              </div>
            </div>
          </div>

          <div v-else class="config-form">
            <div class="form-group">
              <label class="form-label">数据源名称</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-input"
                placeholder="输入数据源名称"
              />
            </div>

            <div class="form-group">
              <label class="form-label">描述（可选）</label>
              <textarea
                v-model="formData.description"
                class="form-textarea"
                rows="2"
                placeholder="输入数据源描述"
              />
            </div>

            <div class="form-divider">
              <span>连接配置</span>
            </div>

            <div class="config-fields">
              <div
                v-for="field in currentConfigFields"
                :key="field.name"
                class="form-group"
              >
                <label class="form-label">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                </label>
                <input
                  v-if="field.type === 'text' || field.type === 'password'"
                  v-model="formData.config[field.name]"
                  :type="field.type"
                  class="form-input"
                  :placeholder="field.placeholder"
                  :value="field.defaultValue"
                />
                <input
                  v-else-if="field.type === 'number'"
                  v-model.number="formData.config[field.name]"
                  type="number"
                  class="form-input"
                  :placeholder="field.placeholder"
                  :value="field.defaultValue"
                />
                <label v-else-if="field.type === 'checkbox'" class="checkbox-label">
                  <input
                    v-model="formData.config[field.name]"
                    type="checkbox"
                    class="form-checkbox"
                    :checked="field.defaultValue"
                  />
                  <span>启用</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="formData.isShared"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span>共享给组织成员</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button
            v-if="selectedType"
            class="btn btn-primary"
            @click="handleSave"
            :disabled="!formData.name"
          >
            {{ showEditModal ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Database,
  Plus,
  Loader2,
  Users,
  Calendar,
  Clock,
  Zap,
  Edit,
  Trash2,
  X,
  Search,
  Globe,
} from 'lucide-vue-next';
import * as Icons from 'lucide-vue-next';
import { useDatasourceStore } from '../../stores/datasource';
import { DATASOURCE_LIBRARY } from '../../config/datasourceLibrary';
import type { Datasource, DatasourceType } from '../../types/datasource';

const datasourceStore = useDatasourceStore();

const datasources = computed(() => datasourceStore.organizationDatasources);
const loading = computed(() => datasourceStore.loading);
const testing = computed(() => datasourceStore.testing);
const datasourceLibrary = DATASOURCE_LIBRARY;

const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedType = ref<DatasourceType | null>(null);
const creatingType = ref<DatasourceType | null>(null);
const editingDatasource = ref<Datasource | null>(null);

const formData = ref({
  name: '',
  description: '',
  config: {} as Record<string, any>,
  isShared: false,
});

const currentConfigFields = computed(() => {
  if (!selectedType.value) return [];
  const config = datasourceLibrary.find((c) => c.type === selectedType.value);
  return config?.configFields || [];
});

function getDatasourceIcon(type: DatasourceType) {
  const config = datasourceLibrary.find((c) => c.type === type);
  const iconName = config?.icon || 'Database';
  return (Icons as any)[iconName] || Icons.Database;
}

function getDatasourceColor(type: DatasourceType): string {
  const config = datasourceLibrary.find((c) => c.type === type);
  return config?.color || '#6b7280';
}

function getDatasourceLabel(type: DatasourceType): string {
  const config = datasourceLibrary.find((c) => c.type === type);
  return config?.label || type;
}

function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN');
}

function selectType(type: DatasourceType) {
  creatingType.value = type;
  selectedType.value = type;
  const config = datasourceLibrary.find((c) => c.type === type);
  formData.value.config = { ...config?.defaultConfig } || {};
}

function handleEdit(datasource: Datasource) {
  editingDatasource.value = datasource;
  showEditModal.value = true;
  selectedType.value = datasource.type;
  creatingType.value = datasource.type;
  formData.value = {
    name: datasource.name,
    description: datasource.description || '',
    config: { ...datasource.config },
    isShared: datasource.isShared,
  };
}

function handleDelete(datasource: Datasource) {
  if (confirm(`确定要删除数据源 "${datasource.name}" 吗？`)) {
    datasourceStore.deleteDatasource(datasource.id);
  }
}

async function handleTest(datasource: Datasource) {
  const result = await datasourceStore.testDatasource(datasource.id);
  alert(result.message + (result.latency ? ` (${result.latency}ms)` : ''));
}

async function handleSave() {
  if (!selectedType.value || !formData.value.name) return;

  if (showEditModal.value && editingDatasource.value) {
    await datasourceStore.updateDatasource(editingDatasource.value.id, {
      name: formData.value.name,
      description: formData.value.description,
      config: { ...formData.value.config },
      isShared: formData.value.isShared,
    });
  } else {
    await datasourceStore.createDatasource(
      formData.value.name,
      selectedType.value,
      { ...formData.value.config },
      formData.value.description,
      formData.value.isShared
    );
  }

  closeModal();
}

function closeModal() {
  showCreateModal.value = false;
  showEditModal.value = false;
  selectedType.value = null;
  creatingType.value = null;
  editingDatasource.value = null;
  formData.value = {
    name: '',
    description: '',
    config: {},
    isShared: false,
  };
}

onMounted(() => {
  datasourceStore.fetchDatasources();
});
</script>

<style scoped>
.datasource-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
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

.manager-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.loading-state {
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.empty-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.datasources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.datasource-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.datasource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-bottom: 1px solid #e5e7eb;
}

.datasource-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.datasource-type-badge {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  background: #e5e7eb;
  color: #374151;
  border-radius: 999px;
}

.shared-badge {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 999px;
}

.card-body {
  padding: 20px;
  flex: 1;
}

.datasource-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.datasource-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.datasource-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}

.card-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.card-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.card-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.delete-btn {
  flex: 0 0 auto;
  width: 40px;
  padding: 10px;
}

.delete-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.datasource-modal {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
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
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.type-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.type-option.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
  margin-left: 2px;
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
  resize: none;
  transition: all 0.2s;
}

.form-textarea:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-divider {
  display: flex;
  align-items: center;
  margin: 8px 0;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-divider::before,
.form-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.form-divider span {
  padding: 0 12px;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
}
</style>
