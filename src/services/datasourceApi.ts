import api, { type ApiResponse } from '../utils/api';
import type {
  DatasourceInfo,
  CreateDatasourceRequest,
  UpdateDatasourceRequest,
  DatasourceTestResult,
} from '../types/api';

// 数据源相关 API
export const datasourceApi = {
  // 获取组织的所有数据源
  async getDatasources(): Promise<ApiResponse<DatasourceInfo[]>> {
    return api.get<DatasourceInfo[]>('/datasources');
  },

  // 获取单个数据源详情
  async getDatasource(datasourceId: string): Promise<ApiResponse<DatasourceInfo>> {
    return api.get<DatasourceInfo>(`/datasources/${datasourceId}`);
  },

  // 创建数据源
  async createDatasource(data: CreateDatasourceRequest): Promise<ApiResponse<DatasourceInfo>> {
    return api.post<DatasourceInfo>('/datasources', data);
  },

  // 更新数据源
  async updateDatasource(
    datasourceId: string,
    data: UpdateDatasourceRequest
  ): Promise<ApiResponse<DatasourceInfo>> {
    return api.put<DatasourceInfo>(`/datasources/${datasourceId}`, data);
  },

  // 删除数据源
  async deleteDatasource(datasourceId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/datasources/${datasourceId}`);
  },

  // 测试数据源连接
  async testDatasource(datasourceId: string): Promise<ApiResponse<DatasourceTestResult>> {
    return api.post<DatasourceTestResult>(`/datasources/${datasourceId}/test`);
  },

  // 测试连接（不保存，直接测试配置）
  async testConnection(config: {
    type: string;
    config: Record<string, any>;
  }): Promise<ApiResponse<DatasourceTestResult>> {
    return api.post<DatasourceTestResult>('/datasources/test-connection', config);
  },
};

export default datasourceApi;
