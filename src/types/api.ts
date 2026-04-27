// 通用枚举定义
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type DeploymentStatus = 'DEPLOYED' | 'UNDEPLOYED' | 'FAILED';
export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type NodeExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type ResourceType = 'WORKFLOW' | 'DEPLOYMENT' | 'USER' | 'ROLE' | 'PERMISSION' | 'ORGANIZATION';
export type DatasourceStatus = 'ACTIVE' | 'INACTIVE' | 'TESTING';
export type DatasourceTestResultStatus = 'SUCCESS' | 'FAILED';
export type DbType = 'MYSQL' | 'POSTGRESQL' | 'ORACLE' | 'SQLSERVER' | 'H2' | 'DB2';

// ========== 认证模块类型 ==========

export interface UserInfo {
  userId: number;
  username: string;
  realName: string;
  email: string;
  avatarUrl: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: UserInfo;
  organizationId: string;
  organizationName: string;
  needsOrganization: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface RegisterWithOrganizationRequest {
  username: string;
  password: string;
  email: string;
  realName?: string;
  organization: {
    name: string;
    description?: string;
  };
}

export interface CreateFirstOrganizationRequest {
  name: string;
  description?: string;
}

// ========== 组织管理模块类型 ==========

export interface Organization {
  organizationId: string;
  name: string;
  description: string;
  ownerId: number;
  ownerName: string;
  status: OrganizationStatus;
  currentUserRole: OrganizationRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface OrganizationMember {
  userId: number;
  username: string;
  realName: string;
  email: string;
  role: OrganizationRole;
  joinedAt: string;
}

export interface Invitation {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  invitedBy: number;
  invitedByName: string;
  invitedAt: string;
}

export interface SendInvitationRequest {
  email: string;
  role: OrganizationRole;
}

// ========== 工作流定义模块类型 ==========

export interface WorkflowDefinition {
  id: number;
  workflowId: string;
  name: string;
  description: string;
  version: number;
  definitionJson: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isLatest: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

// 包含部署状态的工作流列表项（新接口）
export interface WorkflowListItem {
  id: number;
  workflowId: string;
  name: string;
  description: string;
  version: number;
  definitionJson: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isLatest: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deploymentStatus?: 'DEPLOYED' | 'UNDEPLOYED' | 'FAILED';
  deployedVersion?: number | null;
  deployedAt?: string | null;
}

export interface WorkflowDefinitionNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, any>;
}

export interface WorkflowDefinitionEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
}

export interface WorkflowDefinitionData {
  nodes: WorkflowDefinitionNode[];
  edges: WorkflowDefinitionEdge[];
  metadata?: Record<string, any>;
}

export interface SaveWorkflowRequest {
  workflowId?: string;
  name: string;
  description?: string;
  createdBy?: string;
  definition: WorkflowDefinitionData;
}

// ========== 部署管理模块类型 ==========

export interface Deployment {
  deploymentId: string;
  workflowId: string;
  workflowVersion: number;
  routeId: string;
  status: DeploymentStatus;
  deployedBy: string;
  deployReason: string;
  deployedAt: string;
  undeployedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 执行追踪模块类型 ==========

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  workflowVersion: number;
  routeId: string;
  deploymentId: string;
  status: ExecutionStatus;
  startedAt: string;
  endedAt?: string;
  exchangeId: string;
  inputSummary?: string;
  outputSummary?: string;
  errorMessage?: string;
  failedNodeId?: string;
  failedNodeName?: string;
  durationMs: number;
  createdAt: string;
  updatedAt: string;
  nodes?: NodeExecution[];
}

export interface NodeExecution {
  nodeExecutionId: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: NodeExecutionStatus;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  inputSummary?: string;
  outputSummary?: string;
  errorMessage?: string;
  errorStack?: string;
  inputDataSource?: string;
  inputLineage: string[];
  dataMapping?: Record<string, any>;
  inputDataSnapshot?: string;
  outputDataSnapshot?: string;
  createdAt: string;
}

export interface ExecutionPage {
  content: WorkflowExecution[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ExecutionStats {
  tenantId: string;
  workflowId: string;
  statusCounts: Record<ExecutionStatus, number>;
}

// ========== 数据源管理模块类型 ==========

export interface DatasourceConfig {
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
  status: DatasourceStatus;
  lastTestedAt?: string;
  lastTestResult?: DatasourceTestResultStatus;
  lastTestError?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SaveDatasourceRequest {
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
}

export interface TestConnectionRequest {
  dbType: DbType;
  jdbcUrl: string;
  username?: string;
  password?: string;
  driverClass?: string;
  testQuery?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  error?: string;
  durationMs?: number;
  databaseVersion?: string;
}

// ========== 分页参数 ==========

export interface PageParams {
  page?: number;
  size?: number;
}
