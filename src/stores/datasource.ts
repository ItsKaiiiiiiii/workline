import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import datasourceApi from '../services/datasourceApi';
import type { DatasourceConfig, TestConnectionResponse, SaveDatasourceRequest } from '../types/api';
import type { Datasource, DatasourceTestResult, DbType } from '../types/datasource';

// 转换 API 类型到本地类型
function mapDatasourceInfo(info: DatasourceConfig): Datasource {
  return {
    configId: info.configId,
    name: info.name,
    description: info.description,
    dbType: info.dbType,
    jdbcUrl: info.jdbcUrl,
    username: info.username,
    driverClass: info.driverClass,
    maxPoolSize: info.maxPoolSize,
    minIdle: info.minIdle,
    connectionTimeout: info.connectionTimeout,
    idleTimeout: info.idleTimeout,
    testQuery: info.testQuery,
    status: info.status,
    lastTestedAt: info.lastTestedAt ? new Date(info.lastTestedAt) : undefined,
    lastTestResult: info.lastTestResult,
    lastTestError: info.lastTestError,
    createdAt: new Date(info.createdAt),
    updatedAt: new Date(info.updatedAt),
    createdBy: info.createdBy,
    updatedBy: info.updatedBy,
  };
}

export const useDatasourceStore = defineStore('datasource', () => {
  const datasources = ref<Datasource[]>([]);
  const loading = ref(false);
  const testing = ref<Record<string, boolean>>({});

  const activeDatasources = computed(() => {
    return datasources.value.filter((ds) => ds.status === 'ACTIVE');
  });

  async function fetchDatasources(): Promise<void> {
    loading.value = true;
    try {
      const response = await datasourceApi.getDatasources();
      datasources.value = response.data.map(mapDatasourceInfo);
    } finally {
      loading.value = false;
    }
  }

  async function fetchActiveDatasources(): Promise<void> {
    loading.value = true;
    try {
      const response = await datasourceApi.getActiveDatasources();
      datasources.value = response.data.map(mapDatasourceInfo);
    } finally {
      loading.value = false;
    }
  }

  async function searchDatasources(name: string): Promise<Datasource[]> {
    const response = await datasourceApi.searchDatasources(name);
    return response.data.map(mapDatasourceInfo);
  }

  async function saveDatasource(data: {
    configId?: string;
    name: string;
    description?: string;
    dbType: DbType;
    jdbcUrl: string;
    username?: string;
    password?: string;
    driverClass?: string;
    maxPoolSize?: number;
    minIdle?: number;
    connectionTimeout?: number;
    idleTimeout?: number;
    testQuery?: string;
  }): Promise<Datasource> {
    const request: SaveDatasourceRequest = {
      ...data,
      maxPoolSize: data.maxPoolSize ?? 10,
      minIdle: data.minIdle ?? 2,
      connectionTimeout: data.connectionTimeout ?? 30000,
      idleTimeout: data.idleTimeout ?? 600000,
    };
    const response = await datasourceApi.saveDatasource(request);
    const newDs = mapDatasourceInfo(response.data);
    const index = datasources.value.findIndex((ds) => ds.configId === newDs.configId);
    if (index !== -1) {
      datasources.value[index] = newDs;
    } else {
      datasources.value.push(newDs);
    }
    return newDs;
  }

  async function deleteDatasource(configId: string): Promise<void> {
    await datasourceApi.deleteDatasource(configId);
    datasources.value = datasources.value.filter((ds) => ds.configId !== configId);
  }

  async function testDatasource(configId: string): Promise<DatasourceTestResult> {
    testing.value[configId] = true;
    try {
      const response = await datasourceApi.testDatasource(configId);
      // 更新本地数据源的测试状态
      const ds = datasources.value.find((d) => d.configId === configId);
      if (ds) {
        ds.lastTestedAt = new Date();
        ds.lastTestResult = response.data.success ? 'SUCCESS' : 'FAILED';
        ds.lastTestError = response.data.error;
      }
      return response.data;
    } finally {
      testing.value[configId] = false;
    }
  }

  async function testConnection(data: {
    dbType: DbType;
    jdbcUrl: string;
    username?: string;
    password?: string;
    driverClass?: string;
    testQuery?: string;
  }): Promise<TestConnectionResponse> {
    const response = await datasourceApi.testConnection(data);
    return response.data;
  }

  function getDatasourceById(configId: string): Datasource | undefined {
    return datasources.value.find((ds) => ds.configId === configId);
  }

  function getDatasourcesByType(dbType: DbType): Datasource[] {
    return activeDatasources.value.filter((ds) => ds.dbType === dbType);
  }

  return {
    datasources,
    loading,
    testing,
    activeDatasources,
    fetchDatasources,
    fetchActiveDatasources,
    searchDatasources,
    saveDatasource,
    deleteDatasource,
    testDatasource,
    testConnection,
    getDatasourceById,
    getDatasourcesByType,
  };
});
