import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import workflowApi from '../services/workflowApi';
import type {
  WorkflowTestExecution,
  ParsedWorkflowTestExecution,
  ParsedTestNodeExecution,
  TestExecutionStatus,
} from '../types/api';

function parseJsonSafely(jsonString: string | null | undefined): any {
  if (!jsonString) return undefined;
  try {
    return JSON.parse(jsonString);
  } catch {
    return jsonString;
  }
}

function parseTestExecution(execution: WorkflowTestExecution): ParsedWorkflowTestExecution {
  return {
    ...execution,
    testInputData: parseJsonSafely(execution.testInput),
    testOutputData: parseJsonSafely(execution.testOutput),
    nodes: execution.nodes.map((node): ParsedTestNodeExecution => {
      const { nodeConfigSnapshot, inputDataSnapshot, outputDataSnapshot, ...rest } = node;
      return {
        ...rest,
        nodeConfig: parseJsonSafely(nodeConfigSnapshot) || {},
        inputData: parseJsonSafely(inputDataSnapshot),
        outputData: parseJsonSafely(outputDataSnapshot),
      };
    }),
  };
}

export const useWorkflowTestStore = defineStore('workflowTest', () => {
  const currentTestExecution = ref<ParsedWorkflowTestExecution | null>(null);
  const isRunning = ref(false);
  const isPolling = ref(false);
  const showTestResultPanel = ref(false);
  const selectedTestNodeId = ref<string | null>(null);
  const draftId = ref<string>('');

  let pollingTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentPollingId: string | null = null;

  const testStatus = computed((): TestExecutionStatus | null => {
    return currentTestExecution.value?.status || null;
  });

  const nodeStatusMap = computed((): Map<string, ParsedTestNodeExecution> => {
    const map = new Map();
    if (currentTestExecution.value) {
      for (const node of currentTestExecution.value.nodes) {
        map.set(node.nodeId, node);
      }
    }
    return map;
  });

  const selectedTestNode = computed((): ParsedTestNodeExecution | null => {
    if (!selectedTestNodeId.value) return null;
    return nodeStatusMap.value.get(selectedTestNodeId.value) || null;
  });

  const totalDuration = computed((): number | null => {
    return currentTestExecution.value?.durationMs || null;
  });

  const successNodeCount = computed((): number => {
    if (!currentTestExecution.value) return 0;
    return currentTestExecution.value.nodes.filter(n => n.status === 'COMPLETED').length;
  });

  const failedNodeCount = computed((): number => {
    if (!currentTestExecution.value) return 0;
    return currentTestExecution.value.nodes.filter(n => n.status === 'FAILED').length;
  });

  function setDraftId(id: string) {
    draftId.value = id;
  }

  function openTestResultPanel() {
    showTestResultPanel.value = true;
  }

  function closeTestResultPanel() {
    showTestResultPanel.value = false;
  }

  function selectTestNode(nodeId: string | null) {
    selectedTestNodeId.value = nodeId;
  }

  async function runTest(startNodeId?: string) {
    if (!draftId.value) {
      throw new Error('请先保存草稿');
    }

    isRunning.value = true;
    try {
      const response = await workflowApi.runWorkflowTest({
        draftId: draftId.value,
        startNodeId,
      });

      currentTestExecution.value = parseTestExecution(response.data);
      openTestResultPanel();

      const status = response.data.status;
      if (status === 'RUNNING' || status === 'PENDING' || status === 'WAITING_RETRY') {
        startPolling(response.data.testExecutionId);
      }

      return response.data;
    } finally {
      isRunning.value = false;
    }
  }

  async function fetchTestExecution(testExecutionId: string) {
    const response = await workflowApi.getTestExecution(testExecutionId);
    currentTestExecution.value = parseTestExecution(response.data);
    return response.data;
  }

  async function fetchLatestTestExecution(draftIdParam?: string) {
    const id = draftIdParam || draftId.value;
    if (!id) return null;

    try {
      const response = await workflowApi.getLatestTestExecution(id);
      currentTestExecution.value = parseTestExecution(response.data);
      return response.data;
    } catch {
      return null;
    }
  }

  function startPolling(testExecutionId: string) {
    stopPolling();
    currentPollingId = testExecutionId;
    isPolling.value = true;
    pollWithBackoff(testExecutionId, 500);
  }

  async function pollWithBackoff(testExecutionId: string, interval: number) {
    if (currentPollingId !== testExecutionId) {
      return;
    }

    try {
      const execution = await fetchTestExecution(testExecutionId);
      const status = execution.status;

      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED' || status === 'PAUSED' || status === 'SKIPPED') {
        stopPolling();
        return;
      }

      const nextInterval = Math.min(interval * 1.5, 2000);
      pollingTimeout = setTimeout(() => {
        pollWithBackoff(testExecutionId, nextInterval);
      }, nextInterval);
    } catch (err) {
      console.error('Polling failed:', err);
      stopPolling();
    }
  }

  function stopPolling() {
    isPolling.value = false;
    currentPollingId = null;
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      pollingTimeout = null;
    }
  }

  async function cleanupTestResources(draftIdParam?: string) {
    const id = draftIdParam || draftId.value;
    if (!id) return;

    await workflowApi.cleanupTestResources(id);
    currentTestExecution.value = null;
    selectedTestNodeId.value = null;
  }

  function clearTestResults() {
    currentTestExecution.value = null;
    selectedTestNodeId.value = null;
    stopPolling();
  }

  return {
    currentTestExecution,
    isRunning,
    isPolling,
    showTestResultPanel,
    selectedTestNodeId,
    draftId,

    testStatus,
    nodeStatusMap,
    selectedTestNode,
    totalDuration,
    successNodeCount,
    failedNodeCount,

    setDraftId,
    openTestResultPanel,
    closeTestResultPanel,
    selectTestNode,
    runTest,
    fetchTestExecution,
    fetchLatestTestExecution,
    startPolling,
    stopPolling,
    cleanupTestResources,
    clearTestResults,
  };
});
