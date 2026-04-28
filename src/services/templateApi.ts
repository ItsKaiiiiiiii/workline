import api, { type ApiResponse } from '../utils/api';
import type {
  WorkflowTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateQueryParams,
  TemplatePageResponse,
  UseTemplateResponse,
} from '../types/api';

// 模板相关 API
export const templateApi = {
  // 创建模板
  async createTemplate(data: CreateTemplateRequest): Promise<ApiResponse<WorkflowTemplate>> {
    return api.post<WorkflowTemplate>('/workflow-templates', data);
  },

  // 更新模板
  async updateTemplate(templateId: number, data: UpdateTemplateRequest): Promise<ApiResponse<WorkflowTemplate>> {
    return api.put<WorkflowTemplate>(`/workflow-templates/${templateId}`, data);
  },

  // 删除模板
  async deleteTemplate(templateId: number): Promise<ApiResponse<null>> {
    return api.delete<null>(`/workflow-templates/${templateId}`);
  },

  // 获取模板详情
  async getTemplate(templateId: number): Promise<ApiResponse<WorkflowTemplate>> {
    return api.get<WorkflowTemplate>(`/workflow-templates/${templateId}`);
  },

  // 分页查询模板列表
  async getTemplates(params?: TemplateQueryParams): Promise<ApiResponse<TemplatePageResponse>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    return api.get<TemplatePageResponse>(`/workflow-templates${queryString ? `?${queryString}` : ''}`);
  },

  // 获取热门模板
  async getPopularTemplates(limit?: number): Promise<ApiResponse<WorkflowTemplate[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return api.get<WorkflowTemplate[]>(`/workflow-templates/popular${query}`);
  },

  // 获取最新模板
  async getLatestTemplates(limit?: number): Promise<ApiResponse<WorkflowTemplate[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return api.get<WorkflowTemplate[]>(`/workflow-templates/latest${query}`);
  },

  // 获取官方模板
  async getOfficialTemplates(): Promise<ApiResponse<WorkflowTemplate[]>> {
    return api.get<WorkflowTemplate[]>('/workflow-templates/official');
  },

  // 获取我的模板
  async getMyTemplates(): Promise<ApiResponse<WorkflowTemplate[]>> {
    return api.get<WorkflowTemplate[]>('/workflow-templates/my');
  },

  // 获取所有分类
  async getCategories(): Promise<ApiResponse<string[]>> {
    return api.get<string[]>('/workflow-templates/categories');
  },

  // 使用模板创建工作流
  async useTemplate(templateId: number, workflowName?: string): Promise<ApiResponse<UseTemplateResponse>> {
    const query = workflowName ? `?workflowName=${encodeURIComponent(workflowName)}` : '';
    return api.post<UseTemplateResponse>(`/workflow-templates/${templateId}/use${query}`);
  },

  // 点赞模板
  async likeTemplate(templateId: number): Promise<ApiResponse<null>> {
    return api.post<null>(`/workflow-templates/${templateId}/like`);
  },

  // 取消点赞
  async unlikeTemplate(templateId: number): Promise<ApiResponse<null>> {
    return api.delete<null>(`/workflow-templates/${templateId}/like`);
  },

  // 设置官方模板（管理员）
  async setOfficial(templateId: number, isOfficial: boolean): Promise<ApiResponse<WorkflowTemplate>> {
    return api.put<WorkflowTemplate>(`/workflow-templates/${templateId}/official?isOfficial=${isOfficial}`);
  },
};

export default templateApi;
