import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import templateApi from '../services/templateApi';
import type {
  WorkflowTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateQueryParams,
  UseTemplateResponse,
} from '../types/api';

// 转换日期字符串为 Date 对象
function mapTemplate(template: WorkflowTemplate): WorkflowTemplate {
  return {
    ...template,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<WorkflowTemplate[]>([]);
  const popularTemplates = ref<WorkflowTemplate[]>([]);
  const latestTemplates = ref<WorkflowTemplate[]>([]);
  const officialTemplates = ref<WorkflowTemplate[]>([]);
  const myTemplates = ref<WorkflowTemplate[]>([]);
  const categories = ref<string[]>([]);
  const currentTemplate = ref<WorkflowTemplate | null>(null);

  const loading = ref(false);
  const loadingPopular = ref(false);
  const loadingLatest = ref(false);
  const loadingOfficial = ref(false);
  const loadingMy = ref(false);
  const loadingCategories = ref(false);
  const loadingDetail = ref(false);

  const totalElements = ref(0);
  const currentPage = ref(0);
  const pageSize = ref(20);

  // 分页查询模板列表
  async function fetchTemplates(params?: TemplateQueryParams): Promise<void> {
    loading.value = true;
    try {
      const response = await templateApi.getTemplates(params);
      templates.value = response.data.content.map(mapTemplate);
      totalElements.value = response.data.totalElements;
      currentPage.value = response.data.page;
      pageSize.value = response.data.size;
    } finally {
      loading.value = false;
    }
  }

  // 获取热门模板
  async function fetchPopularTemplates(limit?: number): Promise<void> {
    loadingPopular.value = true;
    try {
      const response = await templateApi.getPopularTemplates(limit);
      popularTemplates.value = response.data.map(mapTemplate);
    } finally {
      loadingPopular.value = false;
    }
  }

  // 获取最新模板
  async function fetchLatestTemplates(limit?: number): Promise<void> {
    loadingLatest.value = true;
    try {
      const response = await templateApi.getLatestTemplates(limit);
      latestTemplates.value = response.data.map(mapTemplate);
    } finally {
      loadingLatest.value = false;
    }
  }

  // 获取官方模板
  async function fetchOfficialTemplates(): Promise<void> {
    loadingOfficial.value = true;
    try {
      const response = await templateApi.getOfficialTemplates();
      officialTemplates.value = response.data.map(mapTemplate);
    } finally {
      loadingOfficial.value = false;
    }
  }

  // 获取我的模板
  async function fetchMyTemplates(): Promise<void> {
    loadingMy.value = true;
    try {
      const response = await templateApi.getMyTemplates();
      myTemplates.value = response.data.map(mapTemplate);
    } finally {
      loadingMy.value = false;
    }
  }

  // 获取所有分类
  async function fetchCategories(): Promise<void> {
    loadingCategories.value = true;
    try {
      const response = await templateApi.getCategories();
      categories.value = response.data;
    } finally {
      loadingCategories.value = false;
    }
  }

  // 获取模板详情
  async function fetchTemplate(templateId: number): Promise<WorkflowTemplate> {
    loadingDetail.value = true;
    try {
      const response = await templateApi.getTemplate(templateId);
      const template = mapTemplate(response.data);
      currentTemplate.value = template;
      return template;
    } finally {
      loadingDetail.value = false;
    }
  }

  // 创建模板
  async function createTemplate(data: CreateTemplateRequest): Promise<WorkflowTemplate> {
    const response = await templateApi.createTemplate(data);
    const template = mapTemplate(response.data);
    myTemplates.value.unshift(template);
    return template;
  }

  // 更新模板
  async function updateTemplate(templateId: number, data: UpdateTemplateRequest): Promise<WorkflowTemplate> {
    const response = await templateApi.updateTemplate(templateId, data);
    const template = mapTemplate(response.data);

    // 更新本地列表
    const updateList = (list: WorkflowTemplate[]) => {
      const index = list.findIndex(t => t.id === templateId);
      if (index !== -1) {
        list[index] = template;
      }
    };
    updateList(templates.value);
    updateList(popularTemplates.value);
    updateList(latestTemplates.value);
    updateList(officialTemplates.value);
    updateList(myTemplates.value);

    if (currentTemplate.value?.id === templateId) {
      currentTemplate.value = template;
    }

    return template;
  }

  // 删除模板
  async function deleteTemplate(templateId: number): Promise<void> {
    await templateApi.deleteTemplate(templateId);

    // 从本地列表移除
    const removeFromList = (list: WorkflowTemplate[]) => {
      const index = list.findIndex(t => t.id === templateId);
      if (index !== -1) {
        list.splice(index, 1);
      }
    };
    removeFromList(templates.value);
    removeFromList(popularTemplates.value);
    removeFromList(latestTemplates.value);
    removeFromList(officialTemplates.value);
    removeFromList(myTemplates.value);

    if (currentTemplate.value?.id === templateId) {
      currentTemplate.value = null;
    }
  }

  // 使用模板创建工作流
  async function useTemplate(templateId: number, workflowName?: string): Promise<UseTemplateResponse> {
    const response = await templateApi.useTemplate(templateId, workflowName);

    // 增加使用次数
    const incrementUsage = (list: WorkflowTemplate[]) => {
      const template = list.find(t => t.id === templateId);
      if (template) {
        template.usageCount++;
      }
    };
    incrementUsage(templates.value);
    incrementUsage(popularTemplates.value);
    incrementUsage(latestTemplates.value);
    incrementUsage(officialTemplates.value);
    incrementUsage(myTemplates.value);
    if (currentTemplate.value?.id === templateId) {
      currentTemplate.value.usageCount++;
    }

    return response.data;
  }

  // 点赞模板
  async function likeTemplate(templateId: number): Promise<void> {
    await templateApi.likeTemplate(templateId);

    // 更新本地状态
    const updateLike = (list: WorkflowTemplate[]) => {
      const template = list.find(t => t.id === templateId);
      if (template) {
        template.likedByCurrentUser = true;
        template.likesCount++;
      }
    };
    updateLike(templates.value);
    updateLike(popularTemplates.value);
    updateLike(latestTemplates.value);
    updateLike(officialTemplates.value);
    updateLike(myTemplates.value);
    if (currentTemplate.value?.id === templateId) {
      currentTemplate.value.likedByCurrentUser = true;
      currentTemplate.value.likesCount++;
    }
  }

  // 取消点赞
  async function unlikeTemplate(templateId: number): Promise<void> {
    await templateApi.unlikeTemplate(templateId);

    // 更新本地状态
    const updateLike = (list: WorkflowTemplate[]) => {
      const template = list.find(t => t.id === templateId);
      if (template) {
        template.likedByCurrentUser = false;
        template.likesCount--;
      }
    };
    updateLike(templates.value);
    updateLike(popularTemplates.value);
    updateLike(latestTemplates.value);
    updateLike(officialTemplates.value);
    updateLike(myTemplates.value);
    if (currentTemplate.value?.id === templateId) {
      currentTemplate.value.likedByCurrentUser = false;
      currentTemplate.value.likesCount--;
    }
  }

  // 设置官方模板（管理员）
  async function setOfficial(templateId: number, isOfficial: boolean): Promise<WorkflowTemplate> {
    const response = await templateApi.setOfficial(templateId, isOfficial);
    const template = mapTemplate(response.data);

    // 更新本地列表
    const updateList = (list: WorkflowTemplate[]) => {
      const index = list.findIndex(t => t.id === templateId);
      if (index !== -1) {
        list[index] = template;
      }
    };
    updateList(templates.value);
    updateList(popularTemplates.value);
    updateList(latestTemplates.value);

    if (isOfficial) {
      const exists = officialTemplates.value.find(t => t.id === templateId);
      if (!exists) {
        officialTemplates.value.unshift(template);
      }
    } else {
      const index = officialTemplates.value.findIndex(t => t.id === templateId);
      if (index !== -1) {
        officialTemplates.value.splice(index, 1);
      }
    }
    updateList(myTemplates.value);

    if (currentTemplate.value?.id === templateId) {
      currentTemplate.value = template;
    }

    return template;
  }

  // 根据 ID 获取模板
  function getTemplateById(templateId: number): WorkflowTemplate | undefined {
    const allTemplates = [
      ...templates.value,
      ...popularTemplates.value,
      ...latestTemplates.value,
      ...officialTemplates.value,
      ...myTemplates.value,
    ];
    return allTemplates.find(t => t.id === templateId);
  }

  return {
    templates,
    popularTemplates,
    latestTemplates,
    officialTemplates,
    myTemplates,
    categories,
    currentTemplate,
    loading,
    loadingPopular,
    loadingLatest,
    loadingOfficial,
    loadingMy,
    loadingCategories,
    loadingDetail,
    totalElements,
    currentPage,
    pageSize,
    fetchTemplates,
    fetchPopularTemplates,
    fetchLatestTemplates,
    fetchOfficialTemplates,
    fetchMyTemplates,
    fetchCategories,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    likeTemplate,
    unlikeTemplate,
    setOfficial,
    getTemplateById,
  };
});
