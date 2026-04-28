<template>
  <div class="template-market">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">模板市场</h1>
        <p class="page-desc">发现和使用优质的工作流模板</p>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus class="w-4 h-4" />
          <span>创建模板</span>
        </button>
      </div>
    </div>

    <div class="market-content">
      <!-- 搜索和筛选栏 -->
      <div class="filter-bar">
        <div class="search-box">
          <Search class="w-4 h-4 search-icon" />
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索模板名称或描述..."
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-options">
          <select v-model="selectedCategory" class="filter-select" @change="handleFilter">
            <option value="">全部分类</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select v-model="selectedVisibility" class="filter-select" @change="handleFilter">
            <option value="">全部可见性</option>
            <option value="PUBLIC">公开</option>
            <option value="ORGANIZATION">组织内</option>
            <option value="PRIVATE">私有</option>
          </select>
          <select v-model="selectedSort" class="filter-select" @change="handleFilter">
            <option value="createdAt:DESC">最新创建</option>
            <option value="likesCount:DESC">最多点赞</option>
            <option value="usageCount:DESC">最多使用</option>
          </select>
        </div>
      </div>

      <!-- 快速导航标签 -->
      <div class="quick-nav">
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'all' }"
          @click="switchTab('all')"
        >
          全部模板
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'popular' }"
          @click="switchTab('popular')"
        >
          🔥 热门
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'latest' }"
          @click="switchTab('latest')"
        >
          ✨ 最新
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'official' }"
          @click="switchTab('official')"
        >
          🏛️ 官方
        </button>
        <button
          class="nav-tab"
          :class="{ active: activeTab === 'my' }"
          @click="switchTab('my')"
        >
          📝 我的
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
        <p class="loading-text">加载中...</p>
      </div>

      <!-- 模板列表 -->
      <div v-else-if="displayTemplates.length > 0" class="templates-grid">
        <div
          v-for="template in displayTemplates"
          :key="template.id"
          class="template-card"
          @click="viewTemplate(template)"
        >
          <div class="card-header">
            <div class="template-badges">
              <span v-if="template.isOfficial" class="badge official">官方</span>
              <span v-if="template.visibility === 'PUBLIC'" class="badge public">公开</span>
              <span v-else-if="template.visibility === 'ORGANIZATION'" class="badge organization">组织</span>
              <span v-else class="badge private">私有</span>
            </div>
            <button
              class="like-btn"
              :class="{ liked: template.likedByCurrentUser }"
              @click.stop="toggleLike(template)"
            >
              <Heart class="w-4 h-4" :fill="template.likedByCurrentUser ? 'currentColor' : 'none'" />
              <span class="like-count">{{ template.likesCount }}</span>
            </button>
          </div>

          <div class="card-body">
            <h3 class="template-name">{{ template.name }}</h3>
            <p class="template-desc">{{ template.description || '暂无描述' }}</p>

            <div v-if="template.tags?.length > 0" class="template-tags">
              <span v-for="tag in template.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>

            <div v-if="template.category" class="template-category">
              <Folder class="w-3 h-3" />
              <span>{{ template.category }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="template-meta">
              <span class="meta-item">
                <User class="w-3 h-3" />
                {{ template.createdByName }}
              </span>
              <span class="meta-item">
                <Download class="w-3 h-3" />
                {{ template.usageCount }} 次使用
              </span>
              <span class="meta-item">
                <Calendar class="w-3 h-3" />
                {{ formatDate(template.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <Package class="w-16 h-16" />
        </div>
        <h3 class="empty-title">暂无模板</h3>
        <p class="empty-desc">尝试其他筛选条件或创建新模板</p>
      </div>

      <!-- 分页器 -->
      <div v-if="activeTab === 'all' && totalElements > pageSize" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 0"
          @click="goToPage(currentPage - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="currentPage >= totalPages - 1"
          @click="goToPage(currentPage + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 模板详情模态框 -->
    <TemplateDetail
      v-if="showDetailModal"
      :template-id="selectedTemplateId"
      @close="showDetailModal = false; selectedTemplateId = null"
      @use="handleUseTemplate"
      @edit="openEditModal"
      @delete="handleDeleteTemplate"
    />

    <!-- 模板编辑/创建模态框 -->
    <TemplateEditor
      v-if="showEditorModal"
      :template-id="editingTemplateId"
      @close="showEditorModal = false; editingTemplateId = null"
      @saved="handleTemplateSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Plus,
  Search,
  Loader2,
  Heart,
  Folder,
  User,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-vue-next';
import { useTemplateStore } from '../../stores/template';
import { ApiError } from '../../utils/api';
import type { WorkflowTemplate } from '../../types/api';
import TemplateDetail from './TemplateDetail.vue';
import TemplateEditor from './TemplateEditor.vue';

const templateStore = useTemplateStore();

// 状态
const activeTab = ref<'all' | 'popular' | 'latest' | 'official' | 'my'>('all');
const searchKeyword = ref('');
const selectedCategory = ref('');
const selectedVisibility = ref('');
const selectedSort = ref('createdAt:DESC');
const showDetailModal = ref(false);
const showEditorModal = ref(false);
const selectedTemplateId = ref<number | null>(null);
const editingTemplateId = ref<number | null>(null);

// 计算属性
const templates = computed(() => templateStore.templates);
const popularTemplates = computed(() => templateStore.popularTemplates);
const latestTemplates = computed(() => templateStore.latestTemplates);
const officialTemplates = computed(() => templateStore.officialTemplates);
const myTemplates = computed(() => templateStore.myTemplates);
const categories = computed(() => templateStore.categories);
const totalElements = computed(() => templateStore.totalElements);
const currentPage = computed(() => templateStore.currentPage);
const pageSize = computed(() => templateStore.pageSize);
const totalPages = computed(() => Math.ceil(totalElements.value / pageSize.value));

const isLoading = computed(() => {
  switch (activeTab.value) {
    case 'popular':
      return templateStore.loadingPopular;
    case 'latest':
      return templateStore.loadingLatest;
    case 'official':
      return templateStore.loadingOfficial;
    case 'my':
      return templateStore.loadingMy;
    default:
      return templateStore.loading;
  }
});

const displayTemplates = computed(() => {
  switch (activeTab.value) {
    case 'popular':
      return popularTemplates.value;
    case 'latest':
      return latestTemplates.value;
    case 'official':
      return officialTemplates.value;
    case 'my':
      return myTemplates.value;
    default:
      return templates.value;
  }
});

// 方法
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

async function switchTab(tab: typeof activeTab.value): Promise<void> {
  activeTab.value = tab;
  switch (tab) {
    case 'popular':
      if (popularTemplates.value.length === 0) {
        await templateStore.fetchPopularTemplates(20);
      }
      break;
    case 'latest':
      if (latestTemplates.value.length === 0) {
        await templateStore.fetchLatestTemplates(20);
      }
      break;
    case 'official':
      if (officialTemplates.value.length === 0) {
        await templateStore.fetchOfficialTemplates();
      }
      break;
    case 'my':
      if (myTemplates.value.length === 0) {
        await templateStore.fetchMyTemplates();
      }
      break;
    default:
      await handleFilter();
  }
}

async function handleSearch(): Promise<void> {
  if (activeTab.value === 'all') {
    await handleFilter();
  }
}

async function handleFilter(): Promise<void> {
  const [sortBy, sortOrder] = selectedSort.value.split(':') as [string, 'ASC' | 'DESC'];
  await templateStore.fetchTemplates({
    keyword: searchKeyword.value || undefined,
    category: selectedCategory.value || undefined,
    visibility: (selectedVisibility.value as any) || undefined,
    sortBy,
    sortOrder,
    page: 0,
    size: 20,
  });
}

async function goToPage(page: number): Promise<void> {
  const [sortBy, sortOrder] = selectedSort.value.split(':') as [string, 'ASC' | 'DESC'];
  await templateStore.fetchTemplates({
    keyword: searchKeyword.value || undefined,
    category: selectedCategory.value || undefined,
    visibility: (selectedVisibility.value as any) || undefined,
    sortBy,
    sortOrder,
    page,
    size: 20,
  });
}

function viewTemplate(template: WorkflowTemplate): void {
  selectedTemplateId.value = template.id;
  showDetailModal.value = true;
}

async function toggleLike(template: WorkflowTemplate): Promise<void> {
  try {
    if (template.likedByCurrentUser) {
      await templateStore.unlikeTemplate(template.id);
    } else {
      await templateStore.likeTemplate(template.id);
    }
  } catch (e: unknown) {
    const error = e instanceof ApiError ? e.message : String(e);
    alert(`操作失败: ${error}`);
  }
}

function openCreateModal(): void {
  editingTemplateId.value = null;
  showEditorModal.value = true;
}

function openEditModal(templateId: number): void {
  editingTemplateId.value = templateId;
  showEditorModal.value = true;
  showDetailModal.value = false;
}

async function handleUseTemplate(workflowId: string): Promise<void> {
  alert(`已基于模板创建工作流: ${workflowId}`);
  showDetailModal.value = false;
}

async function handleDeleteTemplate(templateId: number): Promise<void> {
  if (!confirm('确定要删除此模板吗？')) return;
  try {
    await templateStore.deleteTemplate(templateId);
    showDetailModal.value = false;
  } catch (e: unknown) {
    const error = e instanceof ApiError ? e.message : String(e);
    alert(`删除失败: ${error}`);
  }
}

async function handleTemplateSaved(): Promise<void> {
  showEditorModal.value = false;
  // 刷新列表
  if (activeTab.value === 'my') {
    await templateStore.fetchMyTemplates();
  } else if (activeTab.value === 'all') {
    await handleFilter();
  }
}

onMounted(async () => {
  await Promise.all([
    templateStore.fetchCategories(),
    handleFilter(),
  ]);
});
</script>

<style scoped>
.template-market {
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

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.market-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  font-size: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-options {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 10px 12px;
  font-size: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  border-color: #3b82f6;
}

.quick-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.nav-tab {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tab:hover {
  background: #f3f4f6;
}

.nav-tab.active {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  border-color: transparent;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-text,
.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.empty-icon {
  color: #d1d5db;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.template-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 16px 0;
}

.template-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: #6b7280;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.like-btn:hover {
  background: #fef2f2;
}

.like-btn.liked {
  color: #ef4444;
}

.like-count {
  font-weight: 500;
}

.card-body {
  padding: 16px;
  flex: 1;
}

.template-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.template-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.tag {
  padding: 4px 8px;
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 6px;
}

.template-category {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.card-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid #f3f4f6;
}

.template-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}
</style>
