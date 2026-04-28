<template>
  <div class="datasource-manager">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">数据源管理</h1>
        <p class="page-desc">管理和配置工作流使用的数据源连接</p>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="openCreateModal">
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
        <button class="empty-action" @click="openCreateModal">
          <Plus class="w-4 h-4" />
          <span>新建数据源</span>
        </button>
      </div>

      <div v-else class="datasources-grid">
        <div
          v-for="datasource in datasources"
          :key="datasource.configId"
          class="datasource-card"
        >
          <div class="card-header">
            <div class="datasource-icon" :style="{ backgroundColor: getDatasourceColor(datasource.dbType) }">
              <component :is="getDatasourceIcon(datasource.dbType)" class="w-6 h-6 text-white" />
            </div>
            <div class="datasource-type-badge">
              {{ getDatasourceLabel(datasource.dbType) }}
            </div>
            <div class="status-badge" :class="datasource.status.toLowerCase()">
              {{ getStatusLabel(datasource.status) }}
            </div>
          </div>

          <div class="card-body">
            <h3 class="datasource-name">{{ datasource.name }}</h3>
            <p class="datasource-desc">{{ datasource.description || '暂无描述' }}</p>
            <p class="datasource-url" :title="datasource.jdbcUrl">{{ truncateUrl(datasource.jdbcUrl) }}</p>

            <div class="datasource-meta">
              <div class="meta-item">
                <Calendar class="w-4 h-4" />
                <span>创建于 {{ formatDate(datasource.createdAt) }}</span>
              </div>
              <div v-if="datasource.lastTestedAt" class="meta-item">
                <Clock class="w-4 h-4" />
                <span>最后测试: {{ formatDate(datasource.lastTestedAt) }}</span>
              </div>
            </div>

            <div v-if="datasource.lastTestResult" class="test-result" :class="datasource.lastTestResult.toLowerCase()">
              <span class="result-icon">{{ datasource.lastTestResult === 'SUCCESS' ? '✓' : '✗' }}</span>
              <span>{{ datasource.lastTestResult === 'SUCCESS' ? '连接成功' : '连接失败' }}</span>
              <span v-if="datasource.lastTestError" class="error-text">{{ datasource.lastTestError }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="card-btn test-btn" @click="testDatasource(datasource)" :disabled="testing[datasource.configId]">
              <template v-if="testing[datasource.configId]">
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>测试中</span>
              </template>
              <template v-else>
                <Zap class="w-4 h-4" />
                <span>测试连接</span>
              </template>
            </button>
            <button class="card-btn" @click="openEditModal(datasource)">
              <Edit class="w-4 h-4" />
              <span>编辑</span>
            </button>
            <button class="card-btn delete-btn" @click="confirmDelete(datasource)">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑模态框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="datasource-modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '编辑数据源' : '新建数据源' }}</h3>
          <button class="modal-close" @click="closeModal">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-content">
          <!-- 类型选择 (仅新建时) -->
          <div v-if="!selectedType && !isEdit" class="type-selector">
            <div class="type-grid">
              <div
                v-for="dsConfig in datasourceLibrary"
                :key="dsConfig.dbType"
                class="type-option"
                @click="selectType(dsConfig.dbType)"
              >
                <div class="type-icon" :style="{ backgroundColor: dsConfig.color }">
                  <component :is="getDatasourceIcon(dsConfig.dbType)" class="w-6 h-6 text-white" />
                </div>
                <span class="type-label">{{ dsConfig.label }}</span>
              </div>
            </div>
          </div>

          <!-- 表单配置 -->
          <div v-if="selectedType || isEdit" class="config-form">
            <div class="form-group">
              <label class="form-label">数据源名称 <span class="required">*</span></label>
              <input
                v-model="formData.name"
                type="text"
                class="form-input"
                placeholder="输入数据源名称"
                maxlength="128"
              />
            </div>

            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="formData.description"
                class="form-textarea"
                rows="2"
                placeholder="输入数据源描述（可选）"
                maxlength="512"
              />
            </div>

            <div class="form-divider">
              <span>连接配置</span>
            </div>

            <!-- 数据库类型显示 -->
            <div class="form-group">
              <label class="form-label">数据库类型</label>
              <div class="type-display">
                <div class="type-icon-small" :style="{ backgroundColor: getSelectedTypeConfig()?.color }">
                  <component :is="getSelectedTypeConfig()?.icon || 'Database'" class="w-4 h-4 text-white" />
                </div>
                <span>{{ getSelectedTypeConfig()?.label || formData.dbType }}</span>
              </div>
            </div>

            <!-- JDBC URL 模式选择 -->
            <div class="form-group">
              <label class="form-label">配置模式</label>
              <div class="mode-switch">
                <button
                  class="mode-btn"
                  :class="{ active: !useAdvancedMode }"
                  @click="useAdvancedMode = false"
                  type="button"
                >
                  简单配置
                </button>
                <button
                  class="mode-btn"
                  :class="{ active: useAdvancedMode }"
                  @click="useAdvancedMode = true"
                  type="button"
                >
                  高级模式 (JDBC URL)
                </button>
              </div>
            </div>

            <!-- 简单配置模式 -->
            <template v-if="!useAdvancedMode && getSelectedTypeConfig()">
              <div class="config-fields">
                <div
                  v-for="field in getSelectedTypeConfig()?.configFields"
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
                  />
                  <input
                    v-else-if="field.type === 'number'"
                    v-model.number="formData.config[field.name]"
                    type="number"
                    class="form-input"
                    :placeholder="field.placeholder"
                  />
                  <select
                    v-else-if="field.type === 'select'"
                    v-model="formData.config[field.name]"
                    class="form-input"
                  >
                    <option
                      v-for="opt in field.options"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                  <label v-else-if="field.type === 'checkbox'" class="checkbox-label">
                    <input
                      v-model="formData.config[field.name]"
                      type="checkbox"
                      class="form-checkbox"
                    />
                    <span>启用</span>
                  </label>
                </div>
              </div>

              <!-- 预览生成的 JDBC URL -->
              <div class="form-group">
                <label class="form-label">生成的 JDBC URL</label>
                <div class="url-preview">{{ buildJdbcUrl() }}</div>
              </div>
            </template>

            <!-- 高级模式 -->
            <template v-else>
              <div class="form-group">
                <label class="form-label">JDBC URL <span class="required">*</span></label>
                <textarea
                  v-model="formData.jdbcUrl"
                  class="form-textarea"
                  rows="3"
                  placeholder="jdbc:mysql://localhost:3306/mydb"
                  maxlength="512"
                />
              </div>
            </template>

            <!-- 连接池配置 -->
            <div class="form-divider">
              <span>连接池配置 (可选)</span>
            </div>

            <div class="config-grid">
              <div class="form-group">
                <label class="form-label">用户名</label>
                <input
                  v-model="formData.username"
                  type="text"
                  class="form-input"
                  placeholder="用户名"
                  maxlength="128"
                />
              </div>

              <div class="form-group">
                <label class="form-label">密码</label>
                <input
                  v-model="formData.password"
                  type="password"
                  class="form-input"
                  placeholder="密码"
                  maxlength="512"
                />
              </div>

              <div class="form-group">
                <label class="form-label">驱动类名</label>
                <input
                  v-model="formData.driverClass"
                  type="text"
                  class="form-input"
                  placeholder="留空使用默认驱动"
                />
              </div>

              <div class="form-group">
                <label class="form-label">测试 SQL</label>
                <input
                  v-model="formData.testQuery"
                  type="text"
                  class="form-input"
                  placeholder="留空自动选择"
                />
              </div>

              <div class="form-group">
                <label class="form-label">最大连接数</label>
                <input
                  v-model.number="formData.maxPoolSize"
                  type="number"
                  class="form-input"
                  :min="1"
                />
              </div>

              <div class="form-group">
                <label class="form-label">最小空闲连接</label>
                <input
                  v-model.number="formData.minIdle"
                  type="number"
                  class="form-input"
                  :min="0"
                />
              </div>

              <div class="form-group">
                <label class="form-label">连接超时 (ms)</label>
                <input
                  v-model.number="formData.connectionTimeout"
                  type="number"
                  class="form-input"
                  :min="1000"
                />
              </div>

              <div class="form-group">
                <label class="form-label">空闲超时 (ms)</label>
                <input
                  v-model.number="formData.idleTimeout"
                  type="number"
                  class="form-input"
                  :min="10000"
                />
              </div>
            </div>

            <!-- 测试连接按钮 -->
            <button class="btn btn-secondary test-connection-btn" @click="testCurrentConnection" :disabled="testingConnection">
              <template v-if="testingConnection">
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>测试中...</span>
              </template>
              <template v-else>
                <Zap class="w-4 h-4" />
                <span>测试连接</span>
              </template>
            </button>

            <!-- 测试结果 -->
            <div v-if="testResult" class="test-result-inline" :class="testResult.success ? 'success' : 'failed'">
              <span class="result-icon">{{ testResult.success ? '✓' : '✗' }}</span>
              <span>{{ testResult.message }}</span>
              <span v-if="testResult.durationMs" class="duration">({{ testResult.durationMs }}ms)</span>
              <span v-if="testResult.databaseVersion" class="version">版本: {{ testResult.databaseVersion }}</span>
              <span v-if="testResult.error" class="error-text">{{ testResult.error }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button
            v-if="selectedType || isEdit"
            class="btn btn-primary"
            @click="saveDatasource"
            :disabled="!canSave || saving"
          >
            <template v-if="saving">
              <Loader2 class="w-4 h-4 animate-spin" />
              <span>保存中...</span>
            </template>
            <template v-else>
              {{ isEdit ? '保存' : '创建' }}
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-icon">
          <Trash2 class="w-8 h-8 text-red-500" />
        </div>
        <h3 class="confirm-title">确认删除</h3>
        <p class="confirm-text">确定要删除数据源 "{{ deleteTarget?.name }}" 吗？此操作不可撤销。</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">取消</button>
          <button class="btn btn-danger" @click="deleteDatasource" :disabled="deleting">
            <template v-if="deleting">
              <Loader2 class="w-4 h-4 animate-spin" />
            </template>
            <span>删除</span>
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
  Calendar,
  Clock,
  Zap,
  Edit,
  Trash2,
  X,
} from 'lucide-vue-next';
import * as Icons from 'lucide-vue-next';
import { useDatasourceStore } from '../../stores/datasource';
import { DATASOURCE_LIBRARY } from '../../config/datasourceLibrary';
import type { Datasource, DatasourceTestResult as DatasourceTestResultType, DbType } from '../../types/datasource';
import type { TestConnectionResponse } from '../../types/api';
import { ApiError } from '../../utils/api';

const datasourceStore = useDatasourceStore();
const datasources = computed(() => datasourceStore.datasources);
const loading = computed(() => datasourceStore.loading);
const testing = computed(() => datasourceStore.testing);
const datasourceLibrary = DATASOURCE_LIBRARY;

const showModal = ref(false);
const isEdit = ref(false);
const selectedType = ref<DbType | null>(null);
const useAdvancedMode = ref(false);
const editTarget = ref<Datasource | null>(null);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Datasource | null>(null);
const testingConnection = ref(false);
const saving = ref(false);
const deleting = ref(false);
const testResult = ref<TestConnectionResponse | null>(null);

const formData = ref({
  configId: '',
  name: '',
  description: '',
  dbType: 'MYSQL' as DbType,
  jdbcUrl: '',
  username: '',
  password: '',
  driverClass: '',
  maxPoolSize: 10,
  minIdle: 2,
  connectionTimeout: 30000,
  idleTimeout: 600000,
  testQuery: '',
  config: {} as Record<string, any>,
});

const canSave = computed(() => {
  if (!formData.value.name) return false;
  if (!formData.value.dbType) return false;
  if (useAdvancedMode.value && !formData.value.jdbcUrl) return false;
  if (!useAdvancedMode.value && !buildJdbcUrl()) return false;
  return true;
});

function getDatasourceIcon(dbType: DbType) {
  const config = datasourceLibrary.find((c) => c.dbType === dbType);
  const iconName = config?.icon || 'Database';
  return (Icons as any)[iconName] || Icons.Database;
}

function getDatasourceColor(dbType: DbType): string {
  const config = datasourceLibrary.find((c) => c.dbType === dbType);
  return config?.color || '#6b7280';
}

function getDatasourceLabel(dbType: DbType): string {
  const config = datasourceLibrary.find((c) => c.dbType === dbType);
  return config?.label || dbType;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: '可用',
    INACTIVE: '不可用',
    TESTING: '测试中',
  };
  return labels[status] || status;
}

function getSelectedTypeConfig() {
  return datasourceLibrary.find((c) => c.dbType === formData.value.dbType);
}

function truncateUrl(url: string): string {
  if (url.length <= 50) return url;
  return url.substring(0, 47) + '...';
}

function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildJdbcUrl(): string {
  const config = getSelectedTypeConfig();
  if (!config) return formData.value.jdbcUrl;
  return config.buildJdbcUrl(formData.value.config);
}

function openCreateModal() {
  isEdit.value = false;
  selectedType.value = null;
  useAdvancedMode.value = false;
  editTarget.value = null;
  testResult.value = null;
  resetForm();
  showModal.value = true;
}

function openEditModal(datasource: Datasource) {
  isEdit.value = true;
  selectedType.value = datasource.dbType;
  editTarget.value = datasource;
  useAdvancedMode.value = true;
  testResult.value = null;

  formData.value = {
    configId: datasource.configId,
    name: datasource.name,
    description: datasource.description || '',
    dbType: datasource.dbType,
    jdbcUrl: datasource.jdbcUrl,
    username: datasource.username || '',
    password: '',
    driverClass: datasource.driverClass || '',
    maxPoolSize: datasource.maxPoolSize,
    minIdle: datasource.minIdle,
    connectionTimeout: datasource.connectionTimeout,
    idleTimeout: datasource.idleTimeout,
    testQuery: datasource.testQuery || '',
    config: {},
  };

  showModal.value = true;
}

function selectType(dbType: DbType) {
  selectedType.value = dbType;
  formData.value.dbType = dbType;

  const config = datasourceLibrary.find((c) => c.dbType === dbType);
  if (config) {
    formData.value.config = { ...config.defaultConfig };
    formData.value.jdbcUrl = config.defaultJdbcUrl;
    formData.value.maxPoolSize = 10;
    formData.value.minIdle = 2;
    formData.value.connectionTimeout = 30000;
    formData.value.idleTimeout = 600000;
  }
}

function resetForm() {
  formData.value = {
    configId: '',
    name: '',
    description: '',
    dbType: 'MYSQL',
    jdbcUrl: '',
    username: '',
    password: '',
    driverClass: '',
    maxPoolSize: 10,
    minIdle: 2,
    connectionTimeout: 30000,
    idleTimeout: 600000,
    testQuery: '',
    config: {},
  };
}

function closeModal() {
  showModal.value = false;
  setTimeout(() => {
    isEdit.value = false;
    selectedType.value = null;
    editTarget.value = null;
    testResult.value = null;
    resetForm();
  }, 200);
}

function getErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    return e.detail || e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}

async function testDatasource(datasource: Datasource) {
  try {
    const result = await datasourceStore.testDatasource(datasource.configId);
    showTestResult(result);
  } catch (e: unknown) {
    showTestResult({
      success: false,
      message: '测试失败',
      error: getErrorMessage(e),
    });
  }
}

function showTestResult(result: DatasourceTestResultType | TestConnectionResponse) {
  let message = result.message;
  if ('databaseVersion' in result && result.databaseVersion) {
    message += ` (${result.databaseVersion})`;
  }
  alert(`${result.success ? '✓ ' : '✗ '}${message}${'durationMs' in result && result.durationMs ? ` (${result.durationMs}ms)` : ''}${result.error ? `\n\n错误详情: ${result.error}` : ''}`);
}

async function testCurrentConnection() {
  testingConnection.value = true;
  testResult.value = null;

  try {
    const jdbcUrl = useAdvancedMode.value ? formData.value.jdbcUrl : buildJdbcUrl();
    const result = await datasourceStore.testConnection({
      dbType: formData.value.dbType,
      jdbcUrl,
      username: formData.value.username || undefined,
      password: formData.value.password || undefined,
      driverClass: formData.value.driverClass || undefined,
      testQuery: formData.value.testQuery || undefined,
    });
    testResult.value = result;
  } catch (e: unknown) {
    testResult.value = {
      success: false,
      message: '测试失败',
      error: getErrorMessage(e),
    };
  } finally {
    testingConnection.value = false;
  }
}

async function saveDatasource() {
  if (!canSave.value) return;

  saving.value = true;
  try {
    const jdbcUrl = useAdvancedMode.value ? formData.value.jdbcUrl : buildJdbcUrl();

    await datasourceStore.saveDatasource({
      configId: isEdit.value ? formData.value.configId : undefined,
      name: formData.value.name,
      description: formData.value.description || undefined,
      dbType: formData.value.dbType,
      jdbcUrl,
      username: formData.value.username || undefined,
      password: formData.value.password || undefined,
      driverClass: formData.value.driverClass || undefined,
      maxPoolSize: formData.value.maxPoolSize,
      minIdle: formData.value.minIdle,
      connectionTimeout: formData.value.connectionTimeout,
      idleTimeout: formData.value.idleTimeout,
      testQuery: formData.value.testQuery || undefined,
    });

    closeModal();
  } catch (e: unknown) {
    alert(`保存失败: ${getErrorMessage(e)}`);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(datasource: Datasource) {
  deleteTarget.value = datasource;
  showDeleteConfirm.value = true;
}

async function deleteDatasource() {
  if (!deleteTarget.value) return;

  deleting.value = true;
  try {
    await datasourceStore.deleteDatasource(deleteTarget.value.configId);
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  } catch (e: unknown) {
    alert(`删除失败: ${getErrorMessage(e)}`);
  } finally {
    deleting.value = false;
  }
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

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
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
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
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

.status-badge {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 999px;
  margin-left: auto;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.testing {
  background: #fef3c7;
  color: #92400e;
}

.card-body {
  padding: 20px;
  flex: 1;
}

.datasource-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.datasource-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.datasource-url {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
  margin: 0 0 12px 0;
  word-break: break-all;
}

.datasource-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.test-result.success {
  background: #dcfce7;
  color: #166534;
}

.test-result.failed {
  background: #fee2e2;
  color: #991b1b;
}

.test-result .result-icon {
  font-weight: bold;
}

.test-result .error-text {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.8;
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
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.datasource-modal {
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.confirm-modal {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.confirm-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
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
  grid-template-columns: repeat(3, 1fr);
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
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
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
}

.form-textarea:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-divider {
  display: flex;
  align-items: center;
  margin: 8px 0 4px;
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
  gap: 14px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.url-preview {
  padding: 10px 12px;
  background: #f3f4f6;
  border-radius: 10px;
  font-family: monospace;
  font-size: 12px;
  color: #4b5563;
  word-break: break-all;
}

.type-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f3f4f6;
  border-radius: 10px;
}

.type-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-switch {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 10px;
}

.mode-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  color: #374151;
}

.mode-btn.active {
  background: #ffffff;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.test-connection-btn {
  width: 100%;
  justify-content: center;
  margin-top: 4px;
}

.test-result-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
}

.test-result-inline.success {
  background: #dcfce7;
  color: #166534;
}

.test-result-inline.failed {
  background: #fee2e2;
  color: #991b1b;
}

.test-result-inline .result-icon {
  font-weight: bold;
}

.test-result-inline .result-message {
  flex: 1;
}

.test-result-inline .duration {
  font-size: 12px;
  opacity: 0.8;
}

.test-result-inline .version {
  font-size: 12px;
  opacity: 0.8;
}

.test-result-inline .error-text {
  flex: 1 1 100%;
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
  word-break: break-word;
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
