<template>
  <div class="workflow-detail">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="page-title">工作流详情</h1>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
      <p class="loading-text">加载中...</p>
    </div>

    <div v-else-if="workflow" class="detail-container">
      <div class="info-card">
        <div class="card-header">
          <div class="workflow-icon">
            <Workflow class="w-6 h-6" />
          </div>
          <div class="workflow-basic">
            <h2 class="workflow-name">{{ workflow.name }}</h2>
            <p class="workflow-version">版本 v{{ workflow.version }}</p>
          </div>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">工作流 ID</div>
              <div class="info-value mono">{{ workflow.workflowId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">描述</div>
              <div class="info-value">{{ workflow.description || '暂无描述' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">创建人</div>
              <div class="info-value">{{ workflow.createdBy }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">创建时间</div>
              <div class="info-value">{{ formatDateTime(workflow.createdAt) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">更新时间</div>
              <div class="info-value">{{ formatDateTime(workflow.updatedAt) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">是否最新</div>
              <div class="info-value">
                <span :class="workflow.isLatest ? 'badge-success' : 'badge-warning'">
                  {{ workflow.isLatest ? '是' : '否' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="workflowDefinition" class="graph-card">
        <div class="card-header">
          <h3 class="card-title">工作流预览</h3>
          <div class="graph-controls">
            <button class="zoom-btn" @click="zoomOut" title="缩小">
              <Minus class="w-4 h-4" />
            </button>
            <div class="zoom-level">{{ Math.round(scale * 100) }}%</div>
            <button class="zoom-btn" @click="zoomIn" title="放大">
              <Plus class="w-4 h-4" />
            </button>
            <button class="zoom-btn" @click="resetView" title="重置视图">
              <RefreshCw class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="graph-wrapper" ref="graphContainer" :class="{ 'grabbing': isPanning }">
          <svg
            :width="viewWidth"
            :height="viewHeight"
            :viewBox="viewBox"
            class="graph-svg"
            @mousedown="startPan"
            @mousemove="pan"
            @mouseup="endPan"
            @mouseleave="endPan"
            :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
          >
            <defs>
              <marker id="arrowhead-workflow" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
                <polygon points="0 0, 12 4, 0 8" fill="#9ca3af" />
              </marker>
            </defs>
            <g :transform="`translate(${panX}, ${panY}) scale(${scale})`">
              <g class="edges">
                <line
                  v-for="edge in graphEdges"
                  :key="edge.id"
                  :x1="edge.x1"
                  :y1="edge.y1"
                  :x2="edge.x2"
                  :y2="edge.y2"
                  class="edge-line"
                  marker-end="url(#arrowhead-workflow)"
                />
              </g>
              <g class="nodes">
                <g
                  v-for="node in graphNodes"
                  :key="node.id"
                  :transform="`translate(${node.x}, ${node.y})`"
                  class="graph-node"
                >
                  <rect
                    :width="nodeWidth"
                    :height="nodeHeight"
                    :rx="16"
                    class="node-bg"
                    :style="{ fill: node.bgColor, stroke: node.color }"
                  />
                  <text
                    :x="nodeWidth / 2"
                    :y="30"
                    text-anchor="middle"
                    class="node-name"
                  >
                    {{ node.name }}
                  </text>
                  <text
                    :x="nodeWidth / 2"
                    :y="52"
                    text-anchor="middle"
                    class="node-type"
                  >
                    {{ node.type }}
                  </text>
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div v-if="workflowDefinition" class="definition-card">
        <div class="card-header">
          <h3 class="card-title">工作流定义</h3>
        </div>
        <div class="definition-content">
          <div class="definition-section">
            <h4 class="section-title">节点 ({{ workflowDefinition.nodes?.length || 0 }})</h4>
            <div v-if="workflowDefinition.nodes?.length > 0" class="nodes-list">
              <div v-for="node in workflowDefinition.nodes" :key="node.id" class="node-item">
                <div class="node-id mono">{{ node.id }}</div>
                <div class="node-label">{{ node.label }}</div>
                <div class="node-type">{{ node.type }}</div>
              </div>
            </div>
            <div v-else class="empty-text">暂无节点</div>
          </div>

          <div class="definition-section">
            <h4 class="section-title">边 ({{ workflowDefinition.edges?.length || 0 }})</h4>
            <div v-if="workflowDefinition.edges?.length > 0" class="edges-list">
              <div v-for="edge in workflowDefinition.edges" :key="edge.id" class="edge-item">
                <div class="edge-source mono">{{ edge.sourceNodeId || edge.source }}</div>
                <ArrowRight class="w-4 h-4 arrow-icon" />
                <div class="edge-target mono">{{ edge.targetNodeId || edge.target }}</div>
              </div>
            </div>
            <div v-else class="empty-text">暂无边</div>
          </div>
        </div>
      </div>
    </div>

    <Toast
      :show="showErrorToast"
      :message="toastMessage"
      type="error"
      @close="showErrorToast = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Loader2, Workflow, ArrowRight, RefreshCw, Plus, Minus } from 'lucide-vue-next';
import workflowApi from '../../services/workflowApi';
import { getComponentConfig } from '../../config/componentConfig';
import Toast from '../common/Toast.vue';

const router = useRouter();
const route = useRoute();

const workflowId = ref(route.params.workflowId as string);
const loading = ref(true);
const workflow = ref<any>(null);
const workflowDefinition = ref<any>(null);
const graphContainer = ref<HTMLElement | null>(null);

const showErrorToast = ref(false);
const toastMessage = ref('');

const panX = ref(0);
const panY = ref(0);
const scale = ref(1);
const isPanning = ref(false);
const startPanX = ref(0);
const startPanY = ref(0);
const startMouseX = ref(0);
const startMouseY = ref(0);

const nodeWidth = 200;
const nodeHeight = 64;
const nodeSpacingX = 260;
const nodeSpacingY = 100;

const graphNodes = computed(() => {
  if (!workflowDefinition.value?.nodes) return [];

  const nodes = workflowDefinition.value.nodes as any[];

  const positionedNodes = nodes.map((node, index) => {
    const config = getComponentConfig(node.type);
    return {
      id: node.id,
      name: node.label?.length > 12 ? node.label.substring(0, 12) + '...' : node.label || node.id,
      fullName: node.label || node.id,
      type: node.type,
      color: config?.color || '#3b82f6',
      bgColor: config?.bgColor || '#eff6ff',
      x: 40,
      y: 40,
      rawNode: node,
    };
  });

  const columns: any[][] = [];
  positionedNodes.forEach((node, index) => {
    const colIndex = Math.floor(index / 3);
    if (!columns[colIndex]) columns[colIndex] = [];
    columns[colIndex].push(node);
  });

  columns.forEach((col, colIndex) => {
    col.forEach((node, rowIndex) => {
      node.x = 50 + colIndex * nodeSpacingX;
      node.y = 50 + rowIndex * nodeSpacingY;
    });
  });

  return positionedNodes;
});

const graphEdges = computed(() => {
  if (!workflowDefinition.value?.edges) return [];

  const edges: any[] = [];
  const nodes = graphNodes.value;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  workflowDefinition.value.edges.forEach((edge: any) => {
    const sourceId = edge.sourceNodeId || edge.source;
    const targetId = edge.targetNodeId || edge.target;
    if (sourceId && targetId && nodeMap.has(sourceId) && nodeMap.has(targetId)) {
      const source = nodeMap.get(sourceId)!;
      const target = nodeMap.get(targetId)!;
      edges.push({
        id: edge.id || `${sourceId}-${targetId}`,
        x1: source.x + nodeWidth,
        y1: source.y + nodeHeight / 2,
        x2: target.x,
        y2: target.y + nodeHeight / 2,
      });
    }
  });

  return edges;
});

const graphWidth = computed(() => {
  if (!graphNodes.value.length) return 800;
  const maxX = Math.max(...graphNodes.value.map(n => n.x)) + nodeWidth + 60;
  return Math.max(800, maxX);
});

const graphHeight = computed(() => {
  if (!graphNodes.value.length) return 400;
  const maxY = Math.max(...graphNodes.value.map(n => n.y)) + nodeHeight + 60;
  return Math.max(400, maxY);
});

const viewWidth = computed(() => graphWidth.value);
const viewHeight = computed(() => graphHeight.value);

const viewBox = computed(() => {
  const margin = 50;
  const minX = -margin;
  const minY = -margin;
  const width = graphWidth.value + margin * 2;
  const height = graphHeight.value + margin * 2;
  return `${minX} ${minY} ${width} ${height}`;
});

function goBack() {
  router.back();
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function showError(message: string) {
  toastMessage.value = message;
  showErrorToast.value = true;
}

function startPan(event: MouseEvent) {
  isPanning.value = true;
  startPanX.value = panX.value;
  startPanY.value = panY.value;
  startMouseX.value = event.clientX;
  startMouseY.value = event.clientY;
}

function pan(event: MouseEvent) {
  if (!isPanning.value) return;
  const dx = event.clientX - startMouseX.value;
  const dy = event.clientY - startMouseY.value;
  panX.value = startPanX.value + dx;
  panY.value = startPanY.value + dy;
}

function endPan() {
  isPanning.value = false;
}

function zoomIn() {
  scale.value = Math.min(scale.value + 0.1, 2);
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.1, 0.3);
}

function resetView() {
  scale.value = 1;
  centerView();
}

function centerView() {
  if (!graphContainer.value || graphNodes.value.length === 0) {
    panX.value = 0;
    panY.value = 0;
    return;
  }

  const containerWidth = graphContainer.value.clientWidth || 800;
  const containerHeight = graphContainer.value.clientHeight || 400;

  const minX = Math.min(...graphNodes.value.map(n => n.x));
  const maxX = Math.max(...graphNodes.value.map(n => n.x)) + nodeWidth;
  const minY = Math.min(...graphNodes.value.map(n => n.y));
  const maxY = Math.max(...graphNodes.value.map(n => n.y)) + nodeHeight;

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const centerX = minX + contentWidth / 2;
  const centerY = minY + contentHeight / 2;

  panX.value = (containerWidth / 2) - centerX;
  panY.value = (containerHeight / 2) - centerY;
}

watch(graphNodes, () => {
  setTimeout(() => {
    centerView();
  }, 100);
}, { immediate: true });

async function loadWorkflowDetail() {
  loading.value = true;
  try {
    const response = await workflowApi.getLatestWorkflow(workflowId.value);
    if (response.success) {
      workflow.value = response.data;
      try {
        if (response.data.definitionJson) {
          workflowDefinition.value = JSON.parse(response.data.definitionJson);
        }
      } catch (e) {
        console.error('Failed to parse definitionJson:', e);
      }
    }
  } catch (err: any) {
    console.error('Failed to load workflow detail:', err);
    showError(err.message || '加载工作流详情失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWorkflowDetail();
});
</script>

<style scoped>
.workflow-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8fafc;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 24px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border: none;
  border-radius: 10px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.detail-container {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  min-height: 0;
}

.info-card,
.definition-card,
.graph-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-bottom: 1px solid #e5e7eb;
}

.graph-card .card-header {
  justify-content: space-between;
}

.workflow-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.workflow-basic {
  flex: 1;
}

.workflow-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.workflow-version {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.graph-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-level {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  min-width: 42px;
  text-align: center;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.info-section {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  word-break: break-all;
}

.mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.badge-success {
  display: inline-block;
  padding: 2px 8px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-warning {
  display: inline-block;
  padding: 2px 8px;
  background: #fef3c7;
  color: #d97706;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.graph-wrapper {
  padding: 32px;
  overflow: hidden;
  background: #f9fafb;
  min-height: 400px;
  position: relative;
}

.graph-wrapper.grabbing {
  user-select: none;
}

.graph-svg {
  display: block;
  overflow: visible;
}

.edge-line {
  stroke: #9ca3af;
  stroke-width: 2;
  fill: none;
}

.graph-node {
  cursor: pointer;
}

.graph-node:hover .node-bg {
  filter: brightness(0.98);
}

.node-bg {
  fill: #ffffff;
  stroke: #e5e7eb;
  stroke-width: 2;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  fill: #1f2937;
}

.node-type {
  font-size: 11px;
  fill: #6b7280;
}

.definition-content {
  padding: 20px;
}

.definition-section {
  margin-bottom: 24px;
}

.definition-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.nodes-list,
.edges-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.node-id {
  font-size: 12px;
  color: #6b7280;
  min-width: 120px;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  flex: 1;
}

.node-type {
  font-size: 12px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 999px;
}

.edge-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.edge-source,
.edge-target {
  font-size: 12px;
  color: #374151;
  min-width: 120px;
}

.arrow-icon {
  color: #9ca3af;
}

.empty-text {
  font-size: 14px;
  color: #9ca3af;
  padding: 20px;
  text-align: center;
}
</style>
