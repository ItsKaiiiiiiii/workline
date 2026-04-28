import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '../router';
import authApi from '../services/authApi';
import organizationApi from '../services/organizationApi';
import type {
  UserInfo,
  Organization,
  LoginRequest,
  RegisterWithOrganizationRequest,
  CreateFirstOrganizationRequest,
} from '../types/api';

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10分钟

// 转换 API 的 UserInfo 到本地 User 格式
function mapUserInfoToUser(userInfo: UserInfo) {
  return {
    id: String(userInfo.userId),
    username: userInfo.username,
    email: userInfo.email,
    avatar: userInfo.avatarUrl,
    nickname: userInfo.realName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 转换 API 的 Organization 到本地格式
function mapOrganization(org: Organization) {
  return {
    id: org.organizationId,
    organizationId: org.organizationId,
    name: org.name,
    description: org.description,
    ownerId: String(org.ownerId),
    currentUserRole: org.currentUserRole,
    members: [], // 这个需要单独获取
    createdAt: new Date(org.createdAt),
    updatedAt: new Date(org.updatedAt),
  };
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<ReturnType<typeof mapUserInfoToUser> | null>(null);
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const tokenExpiresAt = ref<Date | null>(null);
  const organizations = ref<ReturnType<typeof mapOrganization>[]>([]);
  const currentOrganization = ref<ReturnType<typeof mapOrganization> | null>(null);
  const isLoading = ref(false);
  const needsOrganization = ref(false);

  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  const isAuthenticated = computed(() => !!user.value && !!token.value);

  // 从本地存储恢复认证状态
  function restoreFromStorage() {
    const savedToken = localStorage.getItem('auth_token');
    const savedRefreshToken = localStorage.getItem('auth_refresh_token');
    const savedTokenExpiresAt = localStorage.getItem('auth_token_expires_at');
    const savedUser = localStorage.getItem('auth_user');
    const savedOrganizations = localStorage.getItem('auth_organizations');
    const savedCurrentOrg = localStorage.getItem('auth_current_organization');

    if (savedToken) {
      token.value = savedToken;
    }
    if (savedRefreshToken) {
      refreshToken.value = savedRefreshToken;
    }
    if (savedTokenExpiresAt) {
      tokenExpiresAt.value = new Date(savedTokenExpiresAt);
    }
    if (savedUser) {
      user.value = JSON.parse(savedUser);
    }
    if (savedOrganizations) {
      organizations.value = JSON.parse(savedOrganizations);
    }
    if (savedCurrentOrg) {
      currentOrganization.value = JSON.parse(savedCurrentOrg);
    }
  }

  // 保存认证状态到本地存储
  function saveToStorage() {
    if (token.value) {
      localStorage.setItem('auth_token', token.value);
    } else {
      localStorage.removeItem('auth_token');
    }
    if (refreshToken.value) {
      localStorage.setItem('auth_refresh_token', refreshToken.value);
    } else {
      localStorage.removeItem('auth_refresh_token');
    }
    if (tokenExpiresAt.value) {
      localStorage.setItem('auth_token_expires_at', tokenExpiresAt.value.toISOString());
    } else {
      localStorage.removeItem('auth_token_expires_at');
    }
    if (user.value) {
      localStorage.setItem('auth_user', JSON.stringify(user.value));
    } else {
      localStorage.removeItem('auth_user');
    }
    if (organizations.value.length > 0) {
      localStorage.setItem('auth_organizations', JSON.stringify(organizations.value));
    } else {
      localStorage.removeItem('auth_organizations');
    }
    if (currentOrganization.value) {
      localStorage.setItem('auth_current_organization', JSON.stringify(currentOrganization.value));
    } else {
      localStorage.removeItem('auth_current_organization');
    }
  }

  // 清除认证状态
  function clearAuth() {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    tokenExpiresAt.value = null;
    organizations.value = [];
    currentOrganization.value = null;
    needsOrganization.value = false;
    stopTokenRefresh();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_token_expires_at');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_organizations');
    localStorage.removeItem('auth_current_organization');
  }

  // 处理登录响应
  function handleAuthResponse(response: Awaited<ReturnType<typeof authApi.login>>) {
    const data = response.data;
    token.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    tokenExpiresAt.value = new Date(Date.now() + data.expiresIn * 1000);
    user.value = mapUserInfoToUser(data.userInfo);
    needsOrganization.value = data.needsOrganization;

    if (data.organizationId) {
      const org: Organization = {
        organizationId: data.organizationId,
        name: data.organizationName,
        description: '',
        ownerId: data.userInfo.userId,
        ownerName: data.userInfo.realName,
        status: 'ACTIVE',
        currentUserRole: 'OWNER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentOrganization.value = mapOrganization(org);
    }

    saveToStorage();
    startTokenRefresh();
  }

  // 登录
  async function login(credentials: LoginRequest): Promise<boolean> {
    isLoading.value = true;
    try {
      const response = await authApi.login(credentials);
      if (response.success) {
        handleAuthResponse(response);
        // 获取组织列表
        await fetchOrganizations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 注册并创建组织
  async function registerWithOrganization(data: RegisterWithOrganizationRequest): Promise<boolean> {
    isLoading.value = true;
    try {
      const response = await authApi.registerWithOrganization(data);
      if (response.success) {
        handleAuthResponse(response);
        await fetchOrganizations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // 为已注册用户创建第一个组织
  async function createFirstOrganization(data: CreateFirstOrganizationRequest): Promise<boolean> {
    isLoading.value = true;
    try {
      const response = await authApi.createFirstOrganization(data);
      if (response.success) {
        const newOrg = mapOrganization(response.data);
        organizations.value.push(newOrg);
        currentOrganization.value = newOrg;
        needsOrganization.value = false;
        saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUser(): Promise<void> {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success) {
        user.value = mapUserInfoToUser(response.data);
        saveToStorage();
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  }

  // 登出
  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuth();
      // 立即跳转到登录页
      router.push('/login');
    }
  }

  // 刷新令牌
  async function refreshTokens(): Promise<boolean> {
    if (!refreshToken.value) return false;

    try {
      const response = await authApi.refreshToken({ refreshToken: refreshToken.value });
      if (response.success) {
        const data = response.data;
        token.value = data.accessToken;
        refreshToken.value = data.refreshToken;
        tokenExpiresAt.value = new Date(Date.now() + data.expiresIn * 1000);
        saveToStorage();
        return true;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }

  // 启动令牌自动刷新
  function startTokenRefresh() {
    stopTokenRefresh();
    refreshTimer = setInterval(() => {
      if (tokenExpiresAt.value) {
        const timeUntilExpiry = tokenExpiresAt.value.getTime() - Date.now();
        if (timeUntilExpiry < 60000) {
          refreshTokens();
        }
      }
    }, 60000);
  }

  // 停止令牌自动刷新
  function stopTokenRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // 切换组织
  async function switchOrganization(orgId: string): Promise<boolean> {
    try {
      const response = await organizationApi.switchOrganization(orgId);
      if (response.success) {
        currentOrganization.value = mapOrganization(response.data);
        saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to switch organization:', error);
      return false;
    }
  }

  // 创建组织
  async function createOrganization(data: { name: string; description?: string }): Promise<boolean> {
    isLoading.value = true;
    try {
      const response = await organizationApi.createOrganization(data);
      if (response.success) {
        const newOrg = mapOrganization(response.data);
        organizations.value.push(newOrg);
        currentOrganization.value = newOrg;
        needsOrganization.value = false;
        saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取用户组织列表
  async function fetchOrganizations(): Promise<void> {
    try {
      const response = await organizationApi.getOrganizations();
      if (response.success) {
        organizations.value = response.data.map(mapOrganization);
        if (organizations.value.length > 0 && !currentOrganization.value) {
          currentOrganization.value = organizations.value[0];
        }
        saveToStorage();
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }

  // 检查是否需要创建组织
  async function checkNeedsOrganization(): Promise<void> {
    try {
      const response = await authApi.needsOrganization();
      if (response.success) {
        needsOrganization.value = response.data;
      }
    } catch (error) {
      console.error('Failed to check needs organization:', error);
    }
  }

  // 初始化
  restoreFromStorage();
  if (isAuthenticated.value) {
    startTokenRefresh();
  }

  return {
    user,
    token,
    refreshToken,
    tokenExpiresAt,
    organizations,
    currentOrganization,
    isAuthenticated,
    isLoading,
    needsOrganization,
    login,
    registerWithOrganization,
    logout,
    refreshTokens,
    fetchCurrentUser,
    switchOrganization,
    createOrganization,
    createFirstOrganization,
    fetchOrganizations,
    checkNeedsOrganization,
  };
});
