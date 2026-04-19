import api, { type ApiResponse } from '../utils/api';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  RegisterWithOrganizationRequest,
  CreateFirstOrganizationRequest,
  UserInfo,
  Organization,
} from '../types/api';

// 认证相关 API
export const authApi = {
  // 登录
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return api.post<LoginResponse>('/auth/login', data, { requireAuth: false });
  },

  // 刷新令牌
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<LoginResponse>> {
    return api.post<LoginResponse>('/auth/refresh', data, { requireAuth: false });
  },

  // 登出
  async logout(): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/logout');
  },

  // 修改密码
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    return api.post<null>('/auth/change-password', data);
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    return api.get<UserInfo>('/auth/me');
  },

  // 注册并创建组织
  async registerWithOrganization(data: RegisterWithOrganizationRequest): Promise<ApiResponse<LoginResponse>> {
    return api.post<LoginResponse>('/auth/register-with-organization', data, { requireAuth: false });
  },

  // 为已注册用户创建第一个组织
  async createFirstOrganization(data: CreateFirstOrganizationRequest): Promise<ApiResponse<Organization>> {
    return api.post<Organization>('/organizations', data);
  },

  // 检查是否需要创建组织
  async needsOrganization(): Promise<ApiResponse<boolean>> {
    return api.get<boolean>('/auth/needs-organization');
  },
};

export default authApi;
