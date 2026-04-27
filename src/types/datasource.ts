import type { DbType } from './api';

export type DatasourceType = DbType | string;

export interface DatasourceConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

export interface DatasourceLibraryConfig {
  dbType: DbType;
  label: string;
  icon: string;
  color: string;
  defaultJdbcUrl: string;
  defaultConfig: Record<string, any>;
  configFields: DatasourceConfigField[];
  buildJdbcUrl: (config: Record<string, any>) => string;
}

export interface Datasource {
  configId: string;
  name: string;
  description?: string;
  dbType: DbType;
  jdbcUrl: string;
  username?: string;
  driverClass?: string;
  maxPoolSize: number;
  minIdle: number;
  connectionTimeout: number;
  idleTimeout: number;
  testQuery?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  lastTestedAt?: Date;
  lastTestResult?: 'SUCCESS' | 'FAILED';
  lastTestError?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface DatasourceTestResult {
  success: boolean;
  message: string;
  error?: string;
  durationMs?: number;
  databaseVersion?: string;
}
