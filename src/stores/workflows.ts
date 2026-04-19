import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import workflowApi from '../services/workflowApi';
import type { WorkflowDefinition, SaveWorkflowRequest, WorkflowDefinitionData } from '../types/api';
import { useAuthStore } from './auth';

// 转换 API 的 WorkflowDefinition 到本地格式
function mapWorkflowDefinition(wf: WorkflowDefinition) {
  let definitionData: WorkflowDefinitionData | null = null;
  try {
    definitionData = JSON.parse(wf.definitionJson);
  } catch {
    definitionData = { nodes: [], edges: [] };
  }

  return {
    id: wf.workflowId,
    name: wf.name,
    description: wf.description,
    organizationId: '', // 需要从 auth store 获取
    createdBy: wf.createdBy || '',
    status: wf.isDeleted ? 'archived' : (wf.isLatest ? 'published' : 'draft'),
    nodes: definitionData?.nodes || [],
    edges: definitionData?.edges || [],
    createdAt: new Date(wf.createdAt),
    updatedAt: new Date(wf.updatedAt),
    publishedAt: wf.isLatest ? new Date(wf.updatedAt) : undefined,
    version: wf.version,
  };
}

// 本地 Workflow 类型
interface LocalWorkflow {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  nodes: any[];
  edges: any[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  version?: number;
}

interface LocalWorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  logs: string[];
}

export const useWorkflowsStore = defineStore('workflows', () => {
  const authStore = useAuthStore();
  const workflows = ref<LocalWorkflow[]>([]);
  const executions = ref<LocalWorkflowExecution[]>([]);
  const currentWorkflow = ref<LocalWorkflow | null>(null);
  const isLoading = ref(false);

  const publishedWorkflows = computed(() =>
    workflows.value.filter((w) => w.status === 'published')
  );

  const draftWorkflows = computed(() =>
    workflows.value.filter((w) => w.status === 'draft')
  );

  async function fetchWorkflows(): Promise<void> {
    isLoading.value = true;
    try {
      const response = await workflowApi.getWorkflows();
      if (response.success) {
        workflows.value = response.data.map(mapWorkflowDefinition);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      isLoading.value = false;
    }
  }

  function getExecutionsForWorkflow(workflowId: string): LocalWorkflowExecution[] {
    return executions.value.filter((e) => e.workflowId === workflowId);
  }

  function setCurrentWorkflow(workflow: LocalWorkflow | null) {
    currentWorkflow.value = workflow;
  }

  async function createWorkflow(
    name: string,
    description?: string
  ): Promise<LocalWorkflow> {
    if (!authStore.currentOrganization) {
      throw new Error('No organization selected');
    }

    const newWorkflow: SaveWorkflowRequest = {
      name,
      description,
      definition: {
        nodes: [],
        edges: [],
      },
    };

    const response = await workflowApi.saveWorkflow(newWorkflow);
    if (response.success) {
      const created = mapWorkflowDefinition(response.data);
      workflows.value.push(created);
      return created;
    }
    throw new Error('Failed to create workflow');
  }

  async function updateWorkflow(id: string, data: Partial<LocalWorkflow>): Promise<void> {
    const index = workflows.value.findIndex((w) => w.id === id);
    if (index !== -1) {
      const existing = workflows.value[index];
      const updateData: SaveWorkflowRequest = {
        workflowId: id,
        name: data.name || existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        definition: {
          nodes: data.nodes || existing.nodes,
          edges: data.edges || existing.edges,
        },
      };

      const response = await workflowApi.saveWorkflow(updateData);
      if (response.success) {
        workflows.value[index] = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
      }
    }
  }

  async function saveWorkflowDefinition(
    workflowId: string | null,
    name: string,
    description: string,
    definition: WorkflowDefinitionData
  ): Promise<string> {
    const request: SaveWorkflowRequest = {
      name,
      description,
      definition,
    };
    if (workflowId) {
      request.workflowId = workflowId;
    }

    const response = await workflowApi.saveWorkflow(request);
    if (response.success) {
      const saved = mapWorkflowDefinition(response.data);
      const index = workflows.value.findIndex((w) => w.id === saved.id);
      if (index !== -1) {
        workflows.value[index] = saved;
      } else {
        workflows.value.push(saved);
      }
      return saved.id;
    }
    throw new Error('Failed to save workflow');
  }

  async function publishWorkflow(id: string): Promise<void> {
    // 发布实际上是保存最新版本
    const workflow = workflows.value.find((w) => w.id === id);
    if (workflow) {
      await updateWorkflow(id, { status: 'published' });
    }
  }

  async function deleteWorkflow(id: string): Promise<void> {
    const response = await workflowApi.deleteWorkflow(id);
    if (response.success) {
      workflows.value = workflows.value.filter((w) => w.id !== id);
      if (currentWorkflow.value?.id === id) {
        currentWorkflow.value = null;
      }
    }
  }

  async function loadWorkflow(workflowId: string): Promise<LocalWorkflow | null> {
    try {
      const response = await workflowApi.getLatestWorkflow(workflowId);
      if (response.success) {
        const workflow = mapWorkflowDefinition(response.data);
        const index = workflows.value.findIndex((w) => w.id === workflow.id);
        if (index !== -1) {
          workflows.value[index] = workflow;
        } else {
          workflows.value.push(workflow);
        }
        currentWorkflow.value = workflow;
        return workflow;
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
    return null;
  }

  return {
    workflows,
    executions,
    currentWorkflow,
    isLoading,
    publishedWorkflows,
    draftWorkflows,
    fetchWorkflows,
    getExecutionsForWorkflow,
    setCurrentWorkflow,
    createWorkflow,
    updateWorkflow,
    publishWorkflow,
    deleteWorkflow,
    saveWorkflowDefinition,
    loadWorkflow,
  };
});
