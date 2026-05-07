<template>
  <div class="canvas-container">
    <div
      ref="canvasRef"
      class="canvas-wrapper"
      @dragover.prevent="onDragOver"
      @drop="onDrop"
    >
      <div
        v-for="node in nodes"
        :key="node.id"
        class="workflow-node"
        :style="{
          left: node.x + 'px',
          top: node.y + 'px',
          backgroundColor: node.bgColor,
          borderColor: node.color,
        }"
        :class="{
          selected: selectedNodeId === node.id,
          'test-selected': selectedTestNodeId === node.id,
        }"
        @mousedown="startDrag($event, node)"
        @click.stop="handleNodeClick(node)"
        @contextmenu.prevent="handleNodeContextMenu($event, node)"
      >
        <div v-if="getNodeStatus(node.id)" class="node-status-badge" :class="getNodeStatusClass(node.id)">
          <component :is="getNodeStatusIcon(node.id)" class="w-4 h-4" />
        </div>
        <button
          v-if="!getNodeStatus(node.id) && testStore.draftId"
          class="node-test-btn"
          @click.stop="handleTestNode(node.id)"
          title="从该节点测试"
        >
          <Play class="w-3 h-3" />
        </button>
        <div class="node-content">
          <div class="node-icon" :style="{ color: node.color }">
            <component :is="getIcon(node.icon)" class="w-5 h-5" />
          </div>
          <div class="node-label">{{ node.label }}</div>
        </div>
        <div
          v-for="input in node.inputs"
          :key="'in-' + input"
          class="port port-input"
          :data-node-id="node.id"
          :data-port-id="'in-' + input"
          @mousedown.stop="startConnect($event, node.id, 'in-' + input, 'input')"
        ></div>
        <div
          v-for="output in node.outputs"
          :key="'out-' + output"
          class="port port-output"
          :data-node-id="node.id"
          :data-port-id="'out-' + output"
          @mousedown.stop="startConnect($event, node.id, 'out-' + output, 'output')"
        ></div>
      </div>
      <svg class="edges-layer">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>
        <path
          v-for="edge in edges"
          :key="edge.id"
          :d="getEdgePath(edge)"
          stroke="#3b82f6"
          stroke-width="2"
          fill="none"
          marker-end="url(#arrowhead)"
        />
      </svg>
      <svg
        v-if="tempEdge"
        class="temp-edge-layer"
      >
        <line
          :x1="tempEdge.x1"
          :y1="tempEdge.y1"
          :x2="tempEdge.x2"
          :y2="tempEdge.y2"
          stroke="#3b82f6"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
      </svg>
    </div>
    <div class="canvas-toolbar">
      <button class="toolbar-btn" @click="zoomIn" title="放大">
        <ZoomIn class="w-4 h-4" />
      </button>
      <button class="toolbar-btn" @click="zoomOut" title="缩小">
        <ZoomOut class="w-4 h-4" />
      </button>
      <button class="toolbar-btn" @click="resetZoom" title="重置">
        <Maximize class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as Icons from 'lucide-vue-next';
import { ZoomIn, ZoomOut, Maximize, CheckCircle2, XCircle, Clock, Loader2, Play } from 'lucide-vue-next';
import { useWorkflowStore } from '../../stores/workflow';
import { useComponentsStore } from '../../stores/components';
import { useWorkflowTestStore } from '../../stores/workflowTest';
import { getComponentConfig } from '../../config/componentConfig';
import type { NodeConfig, NodeData, EdgeData } from '../../types';

const store = useWorkflowStore();
const componentsStore = useComponentsStore();
const testStore = useWorkflowTestStore();

const canvasRef = ref<HTMLDivElement>();
const nodes = ref<(NodeData & { x: number; y: number })[]>([]);
const edges = ref<EdgeData[]>([]);
const selectedNodeId = ref<string | null>(null);

const zoom = ref(1);

const emit = defineEmits<{
  (e: 'runTestFromNode', nodeId: string): void;
}>();

// 测试相关计算属性
const nodeStatusMap = computed(() => testStore.nodeStatusMap);
const selectedTestNodeId = computed(() => testStore.selectedTestNodeId);

function getNodeStatus(nodeId: string) {
  return nodeStatusMap.value.get(nodeId)?.status;
}

function getNodeStatusClass(nodeId: string) {
  const status = getNodeStatus(nodeId);
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'RUNNING':
      return 'running';
    case 'CANCELLED':
      return 'cancelled';
    case 'PAUSED':
      return 'paused';
    case 'WAITING_RETRY':
      return 'waiting-retry';
    case 'SKIPPED':
      return 'skipped';
    default:
      return 'pending';
  }
}

function getNodeStatusIcon(nodeId: string) {
  const status = getNodeStatus(nodeId);
  switch (status) {
    case 'COMPLETED':
      return CheckCircle2;
    case 'FAILED':
      return XCircle;
    case 'RUNNING':
      return Loader2;
    case 'CANCELLED':
      return XCircle;
    case 'PAUSED':
      return Clock;
    case 'WAITING_RETRY':
      return Clock;
    case 'SKIPPED':
      return Clock;
    default:
      return Clock;
  }
}

function handleNodeClick(node: any) {
  // 总是选中节点用于编辑
  selectNode(node);
  // 如果在测试模式下，同时选中测试节点用于查看测试结果
  if (testStore.currentTestExecution) {
    // 如果已经是选中的测试节点，保持选中状态（不要取消）
    if (selectedTestNodeId.value !== node.id) {
      testStore.selectTestNode(node.id);
    }
  }
}

function handleNodeContextMenu(_event: MouseEvent, node: any) {
  emit('runTestFromNode', node.id);
}

function handleTestNode(nodeId: string) {
  emit('runTestFromNode', nodeId);
}

// 与 store 同步
watch(() => store.nodes, (newNodes) => {
  nodes.value = newNodes as any;
}, { immediate: true });

watch(() => store.edges, (newEdges) => {
  edges.value = newEdges;
}, { immediate: true });

watch(() => store.selectedNodeId, (newId) => {
  selectedNodeId.value = newId;
});

const tempEdge = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
let isConnecting = false;
let connectingFrom = { nodeId: '', portId: '', type: '' };

let isDragging = false;
let dragNode: any = null;
let dragOffset = { x: 0, y: 0 };

function getIcon(iconName: string) {
  return (Icons as any)[iconName] || Icons.Circle;
}

function selectNode(node: any) {
  selectedNodeId.value = node.id;
  store.selectNode(node.id);
}

function handleKeyDown(event: KeyboardEvent) {
  // 如果焦点在输入框、文本域等可编辑元素中，不执行删除
  const target = event.target as HTMLElement;
  const isEditing = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable;

  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId.value && !isEditing) {
    store.removeNode(selectedNodeId.value);
  }
}

function startDrag(event: MouseEvent, node: any) {
  isDragging = true;
  dragNode = node;
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  dragOffset = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function startConnect(event: MouseEvent, nodeId: string, portId: string, type: string) {
  if (type !== 'output') return;

  isConnecting = true;
  connectingFrom = { nodeId, portId, type };

  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const canvasRect = canvasRef.value?.getBoundingClientRect();

  if (canvasRect) {
    tempEdge.value = {
      x1: rect.left - canvasRect.left + rect.width / 2,
      y1: rect.top - canvasRect.top + rect.height / 2,
      x2: rect.left - canvasRect.left + rect.width / 2,
      y2: rect.top - canvasRect.top + rect.height / 2,
    };
  }
}

function onMouseMove(event: MouseEvent) {
  const canvasRect = canvasRef.value?.getBoundingClientRect();
  if (!canvasRect) return;

  if (isDragging && dragNode) {
    const newX = event.clientX - canvasRect.left - dragOffset.x;
    const newY = event.clientY - canvasRect.top - dragOffset.y;
    store.updateNode(dragNode.id, { x: newX, y: newY });
  }

  if (isConnecting && tempEdge.value) {
    tempEdge.value.x2 = event.clientX - canvasRect.left;
    tempEdge.value.y2 = event.clientY - canvasRect.top;
  }
}

function onMouseUp(event: MouseEvent) {
  if (isConnecting) {
    const target = event.target as HTMLElement;
    const targetPort = target.closest('.port-input');

    if (targetPort) {
      const targetNodeId = targetPort.getAttribute('data-node-id');
      const targetPortId = targetPort.getAttribute('data-port-id');

      if (targetNodeId && targetPortId && targetNodeId !== connectingFrom.nodeId) {
        const newEdge: EdgeData = {
          id: `edge-${Date.now()}`,
          source: connectingFrom.nodeId,
          target: targetNodeId,
          sourceHandle: connectingFrom.portId,
          targetHandle: targetPortId,
        };
        store.addEdge(newEdge);
      }
    }
  }

  isDragging = false;
  isConnecting = false;
  dragNode = null;
  tempEdge.value = null;
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  const data = event.dataTransfer?.getData('application/json');
  if (!data) return;

  const nodeConfig: NodeConfig = JSON.parse(data);
  const canvasRect = canvasRef.value?.getBoundingClientRect();
  if (!canvasRect) return;

  const x = event.clientX - canvasRect.left - 90;
  const y = event.clientY - canvasRect.top - 36;

  const id = `${nodeConfig.type}-${Date.now()}`;
  const nodeConfigFull = componentsStore.getComponentByType(nodeConfig.type);
  const componentConfig = getComponentConfig(nodeConfig.type);

  // Initialize config with default values from componentConfig
  const defaultConfig: Record<string, any> = {};
  if (componentConfig) {
    for (const field of componentConfig.fields) {
      if (field.default !== undefined) {
        defaultConfig[field.name] = field.default;
      }
    }
  }

  // 解构 defaultParams，排除可能存在的旧 config 字段
  const { config: _oldConfig, ...cleanDefaultParams } = nodeConfig.defaultParams || {};

  const nodeData = {
    id,
    label: nodeConfig.label,
    type: nodeConfig.type,
    description: nodeConfig.description,
    params: {
      ...cleanDefaultParams,
      config: defaultConfig,
    },
    icon: nodeConfig.icon,
    color: nodeConfig.color,
    bgColor: nodeConfig.bgColor,
    inputs: nodeConfig.inputs,
    outputs: nodeConfig.outputs,
    inputMappings: {},
    outputTransform: nodeConfigFull?.defaultOutputTransform || nodeConfig.defaultOutputTransform || '',
    x,
    y,
  };

  store.addNode(nodeData);
}

function getEdgePath(edge: EdgeData) {
  const sourceNode = nodes.value.find((n) => n.id === edge.source);
  const targetNode = nodes.value.find((n) => n.id === edge.target);

  if (!sourceNode || !targetNode) return '';

  const x1 = sourceNode.x + 180;
  const y1 = sourceNode.y + 36;
  const x2 = targetNode.x;
  const y2 = targetNode.y + 36;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 2);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5);
}

function resetZoom() {
  zoom.value = 1;
}

function handleNodeDrop(_nodeConfig: NodeConfig, _event: DragEvent) {
  // 这个方法保持接口兼容，实际拖拽在onDrop中处理
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', handleKeyDown);

  // 在组件加载完成后获取组件列表
  if (componentsStore.allComponents.length === 0) {
    componentsStore.fetchComponents();
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('keydown', handleKeyDown);
});

defineExpose({
  handleNodeDrop,
});
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8fafc;
  background-image: linear-gradient(0deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent),
    linear-gradient(90deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent);
  background-size: 20px 20px;
  overflow: hidden;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.workflow-node {
  position: absolute;
  width: 180px;
  min-height: 72px;
  border: 2px solid;
  border-radius: 12px;
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s;
  z-index: 10;
}

.workflow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.workflow-node.selected {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.workflow-node.test-selected {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
}

.workflow-node.test-selected.success {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
}

.workflow-node.test-selected.error {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
}

.workflow-node.test-selected.cancelled {
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
}

.workflow-node.test-selected.paused,
.workflow-node.test-selected.waiting-retry,
.workflow-node.test-selected.skipped {
  box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.3);
}

.node-status-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  z-index: 25;
}

.node-status-badge.success {
  background: #dcfce7;
  border-color: #22c55e;
  color: #16a34a;
}

.node-status-badge.error {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}

.node-status-badge.running {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #2563eb;
  animation: spin 1s linear infinite;
}

.node-status-badge.pending {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #6b7280;
}

.node-status-badge.cancelled {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #d97706;
}

.node-status-badge.paused {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #6b7280;
}

.node-status-badge.waiting-retry {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #2563eb;
}

.node-status-badge.skipped {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #6b7280;
}

.node-test-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  border: 2px solid #ffffff;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transition: all 0.2s;
  z-index: 25;
  opacity: 0.6;
}

.workflow-node:hover .node-test-btn {
  opacity: 1;
}

.node-test-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.node-content {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-icon {
  flex-shrink: 0;
}

.node-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.port {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  cursor: crosshair;
  transition: all 0.2s;
  z-index: 20;
}

.port:hover {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: scale(1.3);
}

.port-input {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.port-input:hover {
  transform: translateY(-50%) scale(1.3);
}

.port-output {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.port-output:hover {
  transform: translateY(-50%) scale(1.3);
}

.edges-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.temp-edge-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.canvas-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}
</style>
