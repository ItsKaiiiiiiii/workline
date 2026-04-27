import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import datasourceApi from '../services/datasourceApi';
import type { DatasourceInfo } from '../types/api';
import type { Datasource, DatasourceType, DatasourceTestResult } from '../types/datasource';

// 转换 API 类型到本地类型
function mapDatasourceInfo(info: DatasourceInfo): Datasource {
  return {
    id: info.datasourceId,
    name: info.name,
    type: info.type as DatasourceType,
    description: info.description,
    config: info.config,
    organizationId: info.organizationId,
    createdBy: info.createdBy,
    createdAt: new Date(info.createdAt),
    updatedAt: new Date(info.updatedAt),
    isShared: info.isShared,
  };
}

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
      const response = await datasourceApi.getDatasources();
      if (response.success) {
        datasources.value = response.data.map(mapDatasourceInfo);
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
    const response = await datasourceApi.createDatasource({
      name,
      type,
      description,
      config,
      isShared,
    });
    if (response.success) {
      const newDs = mapDatasourceInfo(response.data);
      datasources.value.push(newDs);
      return newDs;
    }
    throw new Error('Failed to create datasource');
  }

  async function updateDatasource(
    id: string,
    data: Partial<Omit<Datasource, 'id' | 'createdAt' | 'createdBy' | 'organizationId'>>
  ): Promise<void> {
    const response = await datasourceApi.updateDatasource(id, {
      name: data.name,
      description: data.description,
      config: data.config,
      isShared: data.isShared,
    });
    if (response.success) {
      const index = datasources.value.findIndex((ds) => ds.id === id);
      if (index !== -1) {
        datasources.value[index] = mapDatasourceInfo(response.data);
      }
    }
  }

  async function deleteDatasource(id: string): Promise<void> {
    await datasourceApi.deleteDatasource(id);
    datasources.value = datasources.value.filter((ds) => ds.id !== id);
  }

  async function testDatasource(id: string): Promise<DatasourceTestResult> {
    testing.value[id] = true;
    try {
      const response = await datasourceApi.testDatasource(id);
      if (response.success) {
        return response.data;
      }
      return { success: false, message: '测试失败' };
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
