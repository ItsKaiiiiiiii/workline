import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import type { Datasource, DatasourceType, DatasourceTestResult } from '../types/datasource';

export const useDatasourceStore = defineStore('datasource', () => {
  const authStore = useAuthStore();
  const datasources = ref<Datasource[]>([]);
  const loading = ref(false);
  const testing = ref<Record<string, boolean>>({});

  const organizationDatasources = computed(() => {
    if (!authStore.currentOrganization) return [];
    return datasources.value.filter(
      (ds) => ds.organizationId === authStore.currentOrganization!.id
    );
  });

  async function fetchDatasources(): Promise<void> {
    loading.value = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (authStore.currentOrganization) {
        datasources.value = [
          {
            id: 'ds-1',
            name: '生产数据库',
            type: 'mysql',
            description: '主业务数据库',
            config: {
              host: '192.168.1.100',
              port: 3306,
              database: 'production',
              username: 'admin',
              password: '******',
            },
            organizationId: authStore.currentOrganization.id,
            createdBy: authStore.user?.id || '',
            createdAt: new Date(Date.now() - 86400000 * 7),
            updatedAt: new Date(Date.now() - 86400000 * 3),
            isShared: true,
          },
          {
            id: 'ds-2',
            name: 'Redis缓存',
            type: 'redis',
            description: '会话缓存',
            config: {
              host: '192.168.1.101',
              port: 6379,
              db: 0,
            },
            organizationId: authStore.currentOrganization.id,
            createdBy: authStore.user?.id || '',
            createdAt: new Date(Date.now() - 86400000 * 5),
            updatedAt: new Date(Date.now() - 86400000 * 2),
            isShared: true,
          },
          {
            id: 'ds-3',
            name: '测试环境',
            type: 'postgresql',
            description: '仅供测试使用',
            config: {
              host: 'localhost',
              port: 5432,
              database: 'test_db',
              username: 'test',
              password: '******',
            },
            organizationId: authStore.currentOrganization.id,
            createdBy: authStore.user?.id || '',
            createdAt: new Date(Date.now() - 86400000 * 2),
            updatedAt: new Date(Date.now() - 86400000),
            isShared: false,
          },
        ];
      }
    } finally {
      loading.value = false;
    }
  }

  async function createDatasource(
    name: string,
    type: DatasourceType,
    config: Record<string, any>,
    description?: string,
    isShared = false
  ): Promise<Datasource> {
    if (!authStore.currentOrganization) {
      throw new Error('No organization selected');
    }

    const datasource: Datasource = {
      id: 'ds-' + Date.now(),
      name,
      type,
      description,
      config,
      organizationId: authStore.currentOrganization.id,
      createdBy: authStore.user?.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared,
    };

    datasources.value.push(datasource);
    return datasource;
  }

  async function updateDatasource(
    id: string,
    data: Partial<Omit<Datasource, 'id' | 'createdAt' | 'createdBy' | 'organizationId'>>
  ): Promise<void> {
    const index = datasources.value.findIndex((ds) => ds.id === id);
    if (index !== -1) {
      datasources.value[index] = {
        ...datasources.value[index],
        ...data,
        updatedAt: new Date(),
      };
    }
  }

  async function deleteDatasource(id: string): Promise<void> {
    datasources.value = datasources.value.filter((ds) => ds.id !== id);
  }

  async function testDatasource(id: string): Promise<DatasourceTestResult> {
    testing.value[id] = true;
    try {
      const datasource = datasources.value.find((ds) => ds.id === id);
      if (!datasource) {
        return { success: false, message: '数据源不存在' };
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const success = Math.random() > 0.3;
      return {
        success,
        message: success ? '连接成功' : '连接失败：主机不可达',
        latency: success ? Math.floor(Math.random() * 100) + 10 : undefined,
      };
    } finally {
      testing.value[id] = false;
    }
  }

  function getDatasourceById(id: string): Datasource | undefined {
    return datasources.value.find((ds) => ds.id === id);
  }

  function getDatasourcesByType(type: DatasourceType): Datasource[] {
    return organizationDatasources.value.filter((ds) => ds.type === type);
  }

  return {
    datasources,
    loading,
    testing,
    organizationDatasources,
    fetchDatasources,
    createDatasource,
    updateDatasource,
    deleteDatasource,
    testDatasource,
    getDatasourceById,
    getDatasourcesByType,
  };
});
