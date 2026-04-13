import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { NodeData, EdgeData, Workflow } from '../types';

export const useWorkflowStore = defineStore('workflow', () => {
  const workflowName = ref('我的工作流');
  const workflowDescription = ref('');
  const nodes = ref<NodeData[]>([]);
  const edges = ref<EdgeData[]>([]);
  const selectedNodeId = ref<string | null>(null);
  const isSaving = ref(false);

  const selectedNode = computed(() => {
    return nodes.value.find((n) => n.id === selectedNodeId.value) || null;
  });

  function setWorkflowName(name: string) {
    workflowName.value = name;
  }

  function setWorkflowDescription(description: string) {
    workflowDescription.value = description;
  }

  function setNodes(newNodes: NodeData[]) {
    nodes.value = newNodes;
  }

  function setEdges(newEdges: EdgeData[]) {
    edges.value = newEdges;
  }

  function addNode(node: NodeData) {
    nodes.value.push(node);
  }

  function updateNode(id: string, data: Partial<NodeData>) {
    const index = nodes.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      nodes.value[index] = { ...nodes.value[index], ...data };
    }
  }

  function removeNode(id: string) {
    nodes.value = nodes.value.filter((n) => n.id !== id);
    edges.value = edges.value.filter((e) => e.source !== id && e.target !== id);
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null;
    }
  }

  function addEdge(edge: EdgeData) {
    edges.value.push(edge);
  }

  function removeEdge(id: string) {
    edges.value = edges.value.filter((e) => e.id !== id);
  }

  function selectNode(id: string | null) {
    selectedNodeId.value = id;
  }

  function clearCanvas() {
    nodes.value = [];
    edges.value = [];
    selectedNodeId.value = null;
  }

  function exportWorkflow(): Workflow {
    return {
      id: Date.now().toString(),
      name: workflowName.value,
      description: workflowDescription.value,
      nodes: [...nodes.value],
      edges: [...edges.value],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  function loadWorkflow(workflow: Workflow) {
    workflowName.value = workflow.name;
    workflowDescription.value = workflow.description;
    nodes.value = [...workflow.nodes];
    edges.value = [...workflow.edges];
    selectedNodeId.value = null;
  }

  return {
    workflowName,
    workflowDescription,
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    setWorkflowName,
    setWorkflowDescription,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    selectNode,
    clearCanvas,
    exportWorkflow,
    loadWorkflow,
    isSaving,
  };
});
