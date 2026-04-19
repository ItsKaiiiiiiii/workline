import api, { type ApiResponse } from '../utils/api';

export interface SystemComponent {
  type: string;
  name: string;
  description: string;
  canBeSource: boolean;
  isVirtual: boolean;
  category: 'SYSTEM';
}

export interface CustomComponent {
  type: string;
  name: string;
  description: string;
  canBeSource: boolean;
  isVirtual: boolean;
  category: 'CUSTOM';
}

export interface ComponentsResponse {
  systemComponents: SystemComponent[];
  customComponents: CustomComponent[];
}

// 组件管理相关 API
export const componentApi = {
  // 获取所有组件
  async getComponents(): Promise<ApiResponse<ComponentsResponse>> {
    return api.get<ComponentsResponse>('/components');
  },
};

export default componentApi;
