import api, { type ApiResponse } from '../utils/api';
import type {
  Organization,
  CreateOrganizationRequest,
  OrganizationMember,
  Invitation,
  SendInvitationRequest,
  OrganizationRole,
} from '../types/api';

// 组织管理相关 API
export const organizationApi = {
  // 创建组织
  async createOrganization(data: CreateOrganizationRequest): Promise<ApiResponse<Organization>> {
    return api.post<Organization>('/organizations', data);
  },

  // 获取用户所属的组织列表
  async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    return api.get<Organization[]>('/organizations');
  },

  // 获取组织详情
  async getOrganization(organizationId: string): Promise<ApiResponse<Organization>> {
    return api.get<Organization>(`/organizations/${organizationId}`);
  },

  // 切换到指定组织
  async switchOrganization(organizationId: string): Promise<ApiResponse<Organization>> {
    return api.post<Organization>(`/organizations/${organizationId}/switch`);
  },

  // 获取当前组织
  async getCurrentOrganization(): Promise<ApiResponse<Organization>> {
    return api.get<Organization>('/organizations/current');
  },

  // 获取组织成员列表
  async getMembers(organizationId: string): Promise<ApiResponse<OrganizationMember[]>> {
    return api.get<OrganizationMember[]>(`/organizations/${organizationId}/members`);
  },

  // 修改成员角色
  async updateMemberRole(
    organizationId: string,
    userId: number,
    role: OrganizationRole
  ): Promise<ApiResponse<null>> {
    return api.put<null>(`/organizations/${organizationId}/members/${userId}/role?role=${role}`);
  },

  // 移除成员
  async removeMember(organizationId: string, userId: number): Promise<ApiResponse<null>> {
    return api.delete<null>(`/organizations/${organizationId}/members/${userId}`);
  },

  // 发送邀请
  async sendInvitation(
    organizationId: string,
    data: SendInvitationRequest
  ): Promise<ApiResponse<Invitation>> {
    return api.post<Invitation>(`/organizations/${organizationId}/invitations`, data);
  },

  // 获取组织的邀请列表
  async getInvitations(organizationId: string): Promise<ApiResponse<Invitation[]>> {
    return api.get<Invitation[]>(`/organizations/${organizationId}/invitations`);
  },

  // 获取我的待处理邀请
  async getPendingInvitations(): Promise<ApiResponse<Invitation[]>> {
    return api.get<Invitation[]>('/organizations/invitations/pending');
  },

  // 接受邀请
  async acceptInvitation(invitationId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/organizations/invitations/${invitationId}/accept`);
  },

  // 拒绝邀请
  async rejectInvitation(invitationId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/organizations/invitations/${invitationId}/reject`);
  },
};

export default organizationApi;
