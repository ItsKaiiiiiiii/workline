import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import type {
  User,
  Organization,
  AuthState,
  LoginRequest,
  RegisterRequest,
  UpdateUserRequest,
  CreateOrganizationRequest,
} from '../types/auth';

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10分钟

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const tokenExpiresAt = ref<Date | null>(null);
  const organizations = ref<Organization[]>([]);
  const currentOrganization = ref<Organization | null>(null);
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

  // 登录
  async function login(credentials: LoginRequest): Promise<boolean> {
    isLoading.value = true;
    try {
      // TODO: 替换为真实后端API调用
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 模拟登录成功
      const mockUser: User = {
        id: 'user-' + Date.now(),
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        nickname: credentials.username,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      user.value = mockUser;
      token.value = 'token-' + Date.now();
      refreshToken.value = 'refresh-token-' + Date.now();
      tokenExpiresAt.value = new Date(Date.now() + TOKEN_REFRESH_INTERVAL + 60000); // 11分钟后过期

      // 检查用户是否有组织
      // TODO: 替换为真实后端API调用获取用户组织列表
      organizations.value = [];
      needsOrganization.value = true;

      saveToStorage();
      startTokenRefresh();

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 注册
  async function register(data: RegisterRequest): Promise<boolean> {
    isLoading.value = true;
    try {
      // TODO: 替换为真实后端API调用
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 模拟注册成功
      const mockUser: User = {
        id: 'user-' + Date.now(),
        username: data.username,
        email: data.email,
        nickname: data.nickname || data.username,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      user.value = mockUser;
      token.value = 'token-' + Date.now();
      refreshToken.value = 'refresh-token-' + Date.now();
      tokenExpiresAt.value = new Date(Date.now() + TOKEN_REFRESH_INTERVAL + 60000);

      // 新注册用户需要创建组织
      organizations.value = [];
      needsOrganization.value = true;

      saveToStorage();
      startTokenRefresh();

      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUser(): Promise<void> {
    try {
      // TODO: 替换为真实后端API调用
      await new Promise((resolve) => setTimeout(resolve, 300));
      // 如果已在本地存储中有用户信息，则不需要重新获取
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  }

  // 更新用户信息
  async function updateUser(data: UpdateUserRequest): Promise<boolean> {
    isLoading.value = true;
    try {
      // TODO: 替换为真实后端API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (user.value) {
        user.value = {
          ...user.value,
          ...data,
          updatedAt: new Date(),
        };
        saveToStorage();
      }

      return true;
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // 登出
  function logout() {
    // TODO: 调用后端登出API
    clearAuth();
  }

  // 刷新令牌
  async function refreshTokens(): Promise<boolean> {
    if (!refreshToken.value) return false;

    try {
      // TODO: 替换为真实后端API调用
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 模拟刷新成功
      token.value = 'token-' + Date.now();
      refreshToken.value = 'refresh-token-' + Date.now();
      tokenExpiresAt.value = new Date(Date.now() + TOKEN_REFRESH_INTERVAL + 60000);

      saveToStorage();
      return true;
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
        // 在令牌过期前1分钟刷新
        if (timeUntilExpiry < 60000) {
          refreshTokens();
        }
      }
    }, 60000); // 每分钟检查一次
  }

  // 停止令牌自动刷新
  function stopTokenRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // 切换组织
  function switchOrganization(orgId: string) {
    const org = organizations.value.find((o) => o.id === orgId);
    if (org) {
      currentOrganization.value = org;
      saveToStorage();
    }
  }

  // 创建组织
  async function createOrganization(data: CreateOrganizationRequest): Promise<Organization | null> {
    isLoading.value = true;
    try {
      // TODO: 替换为真实后端API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newOrg: Organization = {
        id: 'org-' + Date.now(),
        name: data.name,
        description: data.description,
        ownerId: user.value!.id,
        members: [user.value!.id],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      organizations.value.push(newOrg);
      currentOrganization.value = newOrg;
      needsOrganization.value = false;
      saveToStorage();

      return newOrg;
    } catch (error) {
      console.error('Failed to create organization:', error);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取用户组织列表
  async function fetchOrganizations(): Promise<void> {
    try {
      // TODO: 替换为真实后端API调用
      await new Promise((resolve) => setTimeout(resolve, 300));
      // 已在本地存储中有组织信息的话不需要重新获取
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }

  // 初始化
  restoreFromStorage();
  if (isAuthenticated.value) {
    startTokenRefresh();
  }

  onUnmounted(() => {
    stopTokenRefresh();
  });

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
    register,
    logout,
    refreshTokens,
    fetchCurrentUser,
    updateUser,
    switchOrganization,
    createOrganization,
    fetchOrganizations,
  };
});
