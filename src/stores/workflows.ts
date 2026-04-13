import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workflow, WorkflowExecution } from '../types/auth';
import { useAuthStore } from './auth';

export const useWorkflowsStore = defineStore('workflows', () => {
  const authStore = useAuthStore();
  const workflows = ref<Workflow[]>([]);
  const executions = ref<WorkflowExecution[]>([]);
  const currentWorkflow = ref<Workflow | null>(null);

  const publishedWorkflows = computed(() =>
    workflows.value.filter((w) => w.status === 'published')
  );

  const draftWorkflows = computed(() =>
    workflows.value.filter((w) => w.status === 'draft')
  );

  async function fetchWorkflows(): Promise<void> {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (authStore.currentOrganization) {
      // 模拟数据
      workflows.value = [
        {
          id: 'wf-1',
          name: '每日数据同步',
          description: '同步各系统数据',
          organizationId: authStore.currentOrganization.id,
          createdBy: authStore.user?.id || '',
          status: 'published',
          nodes: [],
          edges: [],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
          publishedAt: new Date(Date.now() - 86400000),
        },
        {
          id: 'wf-2',
          name: '新员工入职流程',
          description: '自动化新员工入职手续',
          organizationId: authStore.currentOrganization.id,
          createdBy: authStore.user?.id || '',
          status: 'published',
          nodes: [],
          edges: [],
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 172800000),
          publishedAt: new Date(Date.now() - 172800000),
        },
        {
          id: 'wf-3',
          name: '未完成的工作流',
          description: '正在编辑中...',
          organizationId: authStore.currentOrganization.id,
          createdBy: authStore.user?.id || '',
          status: 'draft',
          nodes: [],
          edges: [],
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 3600000),
        },
      ];

      executions.value = [
        {
          id: 'exec-1',
          workflowId: 'wf-1',
          status: 'success',
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(Date.now() - 3540000),
          logs: ['开始执行', '处理数据', '完成同步'],
        },
        {
          id: 'exec-2',
          workflowId: 'wf-1',
          status: 'running',
          startedAt: new Date(Date.now() - 60000),
          logs: ['开始执行', '正在处理...'],
        },
        {
          id: 'exec-3',
          workflowId: 'wf-2',
          status: 'failed',
          startedAt: new Date(Date.now() - 7200000),
          completedAt: new Date(Date.now() - 7180000),
          logs: ['开始执行', '错误：连接失败'],
        },
      ];
    }
  }

  function getExecutionsForWorkflow(workflowId: string): WorkflowExecution[] {
    return executions.value.filter((e) => e.workflowId === workflowId);
  }

  function setCurrentWorkflow(workflow: Workflow | null) {
    currentWorkflow.value = workflow;
  }

  async function createWorkflow(
    name: string,
    description?: string
  ): Promise<Workflow> {
    if (!authStore.currentOrganization) {
      throw new Error('No organization selected');
    }

    const workflow: Workflow = {
      id: 'wf-' + Date.now(),
      name,
      description,
      organizationId: authStore.currentOrganization.id,
      createdBy: authStore.user?.id || '',
      status: 'draft',
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    workflows.value.push(workflow);
    return workflow;
  }

  async function updateWorkflow(id: string, data: Partial<Workflow>): Promise<void> {
    const index = workflows.value.findIndex((w) => w.id === id);
    if (index !== -1) {
      workflows.value[index] = {
        ...workflows.value[index],
        ...data,
        updatedAt: new Date(),
      };
    }
  }

  async function publishWorkflow(id: string): Promise<void> {
    await updateWorkflow(id, {
      status: 'published',
      publishedAt: new Date(),
    });
  }

  async function deleteWorkflow(id: string): Promise<void> {
    workflows.value = workflows.value.filter((w) => w.id !== id);
    if (currentWorkflow.value?.id === id) {
      currentWorkflow.value = null;
    }
  }

  return {
    workflows,
    executions,
    currentWorkflow,
    publishedWorkflows,
    draftWorkflows,
    fetchWorkflows,
    getExecutionsForWorkflow,
    setCurrentWorkflow,
    createWorkflow,
    updateWorkflow,
    publishWorkflow,
    deleteWorkflow,
  };
});
