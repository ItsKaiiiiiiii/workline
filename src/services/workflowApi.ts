import api, { type ApiResponse } from '../utils/api';
import type {
  WorkflowDefinition,
  WorkflowListItem,
  SaveWorkflowRequest,
  Deployment,
  WorkflowExecution,
  ExecutionPage,
  ExecutionStats,
  PageParams,
} from '../types/api';

// 工作流定义相关 API
export const workflowApi = {
  // ========== 工作流定义 ==========

  // 创建或更新工作流定义
  async saveWorkflow(data: SaveWorkflowRequest): Promise<ApiResponse<WorkflowDefinition>> {
    return api.post<WorkflowDefinition>('/workflow-definitions', data);
  },

  // 查询所有工作流的最新版本列表（旧接口）
  async getWorkflows(): Promise<ApiResponse<WorkflowDefinition[]>> {
    return api.get<WorkflowDefinition[]>('/workflow-definitions');
  },

  // 查询所有工作流的最新版本列表（包含部署状态，新接口）
  async getWorkflowList(): Promise<ApiResponse<WorkflowListItem[]>> {
    return api.get<WorkflowListItem[]>('/workflows');
  },

  // 根据 workflowId 查询最新版本
  async getLatestWorkflow(workflowId: string): Promise<ApiResponse<WorkflowDefinition>> {
    return api.get<WorkflowDefinition>(`/workflow-definitions/${workflowId}/latest`);
  },

  // 根据 workflowId 和版本号查询
  async getWorkflowVersion(workflowId: string, version: number): Promise<ApiResponse<WorkflowDefinition>> {
    return api.get<WorkflowDefinition>(`/workflow-definitions/${workflowId}/versions/${version}`);
  },

  // 查询某个 workflowId 的所有版本
  async getWorkflowVersions(workflowId: string): Promise<ApiResponse<WorkflowDefinition[]>> {
    return api.get<WorkflowDefinition[]>(`/workflow-definitions/${workflowId}/versions`);
  },

  // 删除工作流（软删除）
  async deleteWorkflow(workflowId: string, deletedBy?: string, isOwner?: boolean): Promise<ApiResponse<null>> {
    let url = `/workflow-definitions/${workflowId}`;
    const params: string[] = [];
    if (deletedBy !== undefined && deletedBy !== null) {
      params.push(`deletedBy=${encodeURIComponent(deletedBy)}`);
    }
    if (isOwner !== undefined) {
      params.push(`isOwner=${encodeURIComponent(String(isOwner))}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return api.delete<null>(url);
  },

  // 检查是否可以删除工作流
  async canDeleteWorkflow(workflowId: string, userId?: string, isOwner?: boolean): Promise<ApiResponse<boolean>> {
    let url = `/workflow-definitions/${workflowId}/can-delete`;
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (isOwner !== undefined) params.append('isOwner', String(isOwner));
    if (params.toString()) url += `?${params.toString()}`;
    return api.get<boolean>(url);
  },

  // ========== 部署管理 ==========

  // 部署工作流（最新版本）
  async deployWorkflow(
    workflowId: string,
    deployedBy?: string,
    deployReason?: string
  ): Promise<ApiResponse<Deployment>> {
    let url = `/deployments/${workflowId}`;
    const params = new URLSearchParams();
    if (deployedBy) params.append('deployedBy', deployedBy);
    if (deployReason) params.append('deployReason', deployReason);
    if (params.toString()) url += `?${params.toString()}`;
    return api.post<Deployment>(url);
  },

  // 部署工作流（指定版本）
  async deployWorkflowVersion(
    workflowId: string,
    version: number,
    deployedBy?: string,
    deployReason?: string
  ): Promise<ApiResponse<Deployment>> {
    let url = `/deployments/${workflowId}/versions/${version}`;
    const params = new URLSearchParams();
    if (deployedBy) params.append('deployedBy', deployedBy);
    if (deployReason) params.append('deployReason', deployReason);
    if (params.toString()) url += `?${params.toString()}`;
    return api.post<Deployment>(url);
  },

  // 取消部署工作流
  async undeployWorkflow(workflowId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/deployments/${workflowId}`);
  },

  // 查询当前部署状态
  async getCurrentDeployment(workflowId: string): Promise<ApiResponse<Deployment>> {
    return api.get<Deployment>(`/deployments/${workflowId}/current`);
  },

  // 查询部署历史
  async getDeploymentHistory(workflowId: string): Promise<ApiResponse<Deployment[]>> {
    return api.get<Deployment[]>(`/deployments/${workflowId}/history`);
  },

  // 查询所有已部署的工作流
  async getActiveDeployments(): Promise<ApiResponse<Deployment[]>> {
    return api.get<Deployment[]>('/deployments/active');
  },

  // ========== 执行追踪 ==========

  // 查询某个工作流的执行记录列表（分页）
  async getExecutions(
    workflowId: string,
    params?: PageParams
  ): Promise<ApiResponse<ExecutionPage>> {
    let url = '/workflow-executions';
    const searchParams = new URLSearchParams();
    searchParams.append('workflowId', workflowId);
    if (params?.page !== undefined) searchParams.append('page', String(params.page));
    if (params?.size !== undefined) searchParams.append('size', String(params.size));
    url += `?${searchParams.toString()}`;
    return api.get<ExecutionPage>(url);
  },

  // 查询执行详情（包含节点执行列表）
  async getExecutionDetail(executionId: string): Promise<ApiResponse<WorkflowExecution>> {
    return api.get<WorkflowExecution>(`/workflow-executions/${executionId}`);
  },

  // 查询某个工作流的最新执行记录
  async getLatestExecution(workflowId: string): Promise<ApiResponse<WorkflowExecution>> {
    return api.get<WorkflowExecution>(`/workflow-executions/workflow/${workflowId}/latest`);
  },

  // 统计某个工作流的执行情况
  async getExecutionStats(workflowId: string): Promise<ApiResponse<ExecutionStats>> {
    return api.get<ExecutionStats>(`/workflow-executions/workflow/${workflowId}/stats`);
  },
};

export default workflowApi;
