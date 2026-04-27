import api, { type ApiResponse } from '../utils/api';
import type {
  DatasourceConfig,
  SaveDatasourceRequest,
  TestConnectionRequest,
  TestConnectionResponse,
} from '../types/api';

// 数据源相关 API
export const datasourceApi = {
  // 查询所有数据源
  async getDatasources(): Promise<ApiResponse<DatasourceConfig[]>> {
    return api.get<DatasourceConfig[]>('/data-sources');
  },

  // 查询可用数据源（ACTIVE状态）
  async getActiveDatasources(): Promise<ApiResponse<DatasourceConfig[]>> {
    return api.get<DatasourceConfig[]>('/data-sources/active');
  },

  // 查询当前用户的数据源
  async getMyDatasources(): Promise<ApiResponse<DatasourceConfig[]>> {
    return api.get<DatasourceConfig[]>('/data-sources/my');
  },

  // 搜索数据源
  async searchDatasources(name: string): Promise<ApiResponse<DatasourceConfig[]>> {
    return api.get<DatasourceConfig[]>(`/data-sources/search?name=${encodeURIComponent(name)}`);
  },

  // 查询单个数据源
  async getDatasource(configId: string): Promise<ApiResponse<DatasourceConfig>> {
    return api.get<DatasourceConfig>(`/data-sources/${configId}`);
  },

  // 保存数据源（创建或更新）
  async saveDatasource(data: SaveDatasourceRequest): Promise<ApiResponse<DatasourceConfig>> {
    return api.post<DatasourceConfig>('/data-sources', data);
  },

  // 删除数据源
  async deleteDatasource(configId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/data-sources/${configId}`);
  },

  // 测试已保存的数据源连接
  async testDatasource(configId: string): Promise<ApiResponse<TestConnectionResponse>> {
    return api.post<TestConnectionResponse>(`/data-sources/${configId}/test`);
  },

  // 测试连接（不保存）
  async testConnection(data: TestConnectionRequest): Promise<ApiResponse<TestConnectionResponse>> {
    return api.post<TestConnectionResponse>('/data-sources/test', data);
  },
};

export default datasourceApi;
