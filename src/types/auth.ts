export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  nodes: any[];
  edges: any[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  logs: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateUserRequest {
  nickname?: string;
  avatar?: string;
  phone?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}
