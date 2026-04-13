import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, Organization, AuthState } from '../types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const organizations = ref<Organization[]>([]);
  const currentOrganization = ref<Organization | null>(null);
  const isAuthenticated = computed(() => !!user.value);

  async function login(username: string, password: string): Promise<boolean> {
    // 模拟登录API
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (username && password) {
      const mockUser: User = {
        id: 'user-1',
        username,
        email: `${username}@example.com`,
      };

      const mockOrg: Organization = {
        id: 'org-1',
        name: `${username}的团队`,
        description: '默认组织',
        ownerId: 'user-1',
        members: ['user-1'],
        createdAt: new Date(),
      };

      user.value = mockUser;
      token.value = 'mock-token-' + Date.now();
      organizations.value = [mockOrg];
      currentOrganization.value = mockOrg;

      return true;
    }
    return false;
  }

  function logout() {
    user.value = null;
    token.value = null;
    organizations.value = [];
    currentOrganization.value = null;
  }

  function switchOrganization(orgId: string) {
    const org = organizations.value.find((o) => o.id === orgId);
    if (org) {
      currentOrganization.value = org;
    }
  }

  async function createOrganization(name: string, description?: string): Promise<Organization> {
    const newOrg: Organization = {
      id: 'org-' + Date.now(),
      name,
      description,
      ownerId: user.value!.id,
      members: [user.value!.id],
      createdAt: new Date(),
    };
    organizations.value.push(newOrg);
    return newOrg;
  }

  return {
    user,
    token,
    organizations,
    currentOrganization,
    isAuthenticated,
    login,
    logout,
    switchOrganization,
    createOrganization,
  };
});
