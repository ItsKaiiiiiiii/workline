import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { NodeData, EdgeData, Workflow } from '../types';
import type { WorkflowDefinitionData } from '../types/api';
import { getComponentConfig } from '../config/componentConfig';
import { useComponentsStore } from './components';

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

  // 从API格式的工作流定义加载
  function loadFromWorkflowDefinition(definition: WorkflowDefinitionData, name?: string, description?: string) {
    const componentsStore = useComponentsStore();

    if (name !== undefined) {
      workflowName.value = name;
    }
    if (description !== undefined) {
      workflowDescription.value = description;
    }

    // 转换节点
    nodes.value = definition.nodes.map((apiNode, index) => {
      const nodeConfig = componentsStore.getComponentByType(apiNode.type);

      return {
        id: apiNode.id,
        label: apiNode.label,
        type: apiNode.type,
        description: nodeConfig?.description || '',
        params: {
          config: apiNode.config || {},
        },
        icon: nodeConfig?.icon || 'Circle',
        color: nodeConfig?.color || '#6b7280',
        bgColor: nodeConfig?.bgColor || '#f3f4f6',
        inputs: nodeConfig?.inputs || [],
        outputs: nodeConfig?.outputs || ['output'],
        inputMappings: {},
        outputTransform: nodeConfig?.defaultOutputTransform || '',
        x: 100 + (index % 3) * 220,
        y: 100 + Math.floor(index / 3) * 120,
      };
    });

    // 转换边
    edges.value = definition.edges.map((apiEdge) => ({
      id: apiEdge.id || `edge-${Date.now()}-${Math.random()}`,
      source: apiEdge.sourceNodeId,
      target: apiEdge.targetNodeId,
    }));

    selectedNodeId.value = null;
  }

  // 转换为API格式的工作流定义
  function getWorkflowDefinition(): WorkflowDefinitionData {
    return {
      nodes: nodes.value.map(node => {
        const componentConfig = getComponentConfig(node.type);
        // 解包 config.config 嵌套
        let currentConfig = node.params?.config || {};
        if (currentConfig && typeof currentConfig === 'object' && 'config' in currentConfig) {
          currentConfig = currentConfig.config;
        }
        const finalConfig: Record<string, any> = { ...currentConfig };

        // 填充缺失的默认值
        if (componentConfig) {
          for (const field of componentConfig.fields) {
            if (field.default !== undefined && finalConfig[field.name] === undefined) {
              finalConfig[field.name] = field.default;
            }
          }
        }

        return {
          id: node.id,
          type: node.type,
          label: node.label,
          config: finalConfig,
        };
      }),
      edges: edges.value.map(edge => ({
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        label: '',
      })),
    };
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
    loadFromWorkflowDefinition,
    getWorkflowDefinition,
    isSaving,
  };
});
