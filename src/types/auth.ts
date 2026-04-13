export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
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
  organizations: Organization[];
  currentOrganization: Organization | null;
}
