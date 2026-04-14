export type DatasourceType =
  | 'mysql'
  | 'postgresql'
  | 'mongodb'
  | 'redis'
  | 'elasticsearch'
  | 'http'
  | 'oracle'
  | 'sqlserver';

export interface DatasourceConfig {
  type: DatasourceType;
  label: string;
  icon: string;
  color: string;
  defaultConfig: Record<string, any>;
  configFields: DatasourceConfigField[];
}

export interface DatasourceConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

export interface Datasource {
  id: string;
  name: string;
  type: DatasourceType;
  description?: string;
  config: Record<string, any>;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isShared: boolean;
}

export interface DatasourceTestResult {
  success: boolean;
  message: string;
  latency?: number;
}
