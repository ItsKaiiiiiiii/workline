<template>
  <div class="execution-detail">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="page-title">执行详情</h1>
          <div class="header-meta">
            <span class="execution-id-mono">{{ executionId }}</span>
            <span v-if="execution" class="execution-status-badge" :class="getStatusClass(execution.status)">
              {{ getStatusText(execution.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 class="w-12 h-12 animate-spin text-blue-500" />
      <p class="loading-text">加载执行数据中...</p>
    </div>

    <div v-else-if="execution" class="detail-container">
      <div v-if="execution.errorMessage" class="error-banner">
        <AlertCircle class="w-6 h-6" />
        <div class="error-banner-content">
          <div class="error-banner-title">执行失败</div>
          <div class="error-banner-message">{{ execution.errorMessage }}</div>
          <div v-if="execution.failedNodeName" class="error-banner-node">
            失败节点: <span class="mono">{{ execution.failedNodeName }}</span> ({{ execution.failedNodeId }})
          </div>
        </div>
      </div>

      <div class="graph-section">
        <div class="graph-header">
          <h2 class="graph-title">执行流程</h2>
          <div class="legend">
            <div class="legend-item">
              <span class="legend-dot status-success"></span>
              <span class="legend-text">成功</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot status-failed"></span>
              <span class="legend-text">失败</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot status-running"></span>
              <span class="legend-text">运行中</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot status-pending"></span>
              <span class="legend-text">等待中</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot status-skipped"></span>
              <span class="legend-text">已跳过</span>
            </div>
          </div>
        </div>
        <div class="graph-wrapper" ref="graphContainer" :class="{ 'grabbing': isPanning }">
          <div class="graph-controls">
            <button class="zoom-btn" @click="resetView" title="重置视图">
              <RefreshCw class="w-4 h-4" />
            </button>
          </div>
          <svg
            :width="viewWidth"
            :height="viewHeight"
            class="graph-svg"
            @mousedown="startPan"
            @mousemove="pan"
            @mouseup="endPan"
            @mouseleave="endPan"
            :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
          >
            <defs>
              <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
                <polygon points="0 0, 12 4, 0 8" fill="#9ca3af" />
              </marker>
              <marker id="arrowhead-failed" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto">
                <polygon points="0 0, 12 4, 0 8" fill="#ef4444" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g :transform="`translate(${panX}, ${panY})`">
              <g class="edges">
                <line
                  v-for="edge in graphEdges"
                  :key="edge.id"
                  :x1="edge.x1"
                  :y1="edge.y1"
                  :x2="edge.x2"
                  :y2="edge.y2"
                  :class="['edge-line', edge.class]"
                  :marker-end="edge.isFailed ? 'url(#arrowhead-failed)' : 'url(#arrowhead)'"
                />
              </g>
              <g class="nodes">
                <g
                  v-for="node in graphNodes"
                  :key="node.id"
                  :transform="`translate(${node.x}, ${node.y})`"
                  :class="['graph-node', node.class]"
                >
                  <rect
                    v-if="node.isFailed"
                    :width="nodeWidth"
                    :height="nodeHeight"
                    :rx="16"
                    class="node-failure-glow"
                    filter="url(#glow)"
                  />
                  <rect
                    :width="nodeWidth"
                    :height="nodeHeight"
                    :rx="16"
                    class="node-bg"
                  />
                  <circle
                    :cx="24"
                    :cy="24"
                    r="12"
                    :class="['node-status-circle', node.statusClass]"
                  />
                  <text
                    :x="24"
                    :y="28"
                    text-anchor="middle"
                    class="node-status-icon"
                  >
                    {{ node.statusIcon }}
                  </text>
                  <text
                    :x="44"
                    :y="28"
                    class="node-name"
                  >
                    {{ node.name }}
                  </text>
                  <text
                    :x="44"
                    :y="48"
                    class="node-type"
                  >
                    {{ node.type }}
                  </text>
                  <text
                    v-if="node.duration"
                    :x="nodeWidth / 2"
                    :y="66"
                    text-anchor="middle"
                    class="node-duration"
                  >
                    {{ node.duration }}
                  </text>
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div class="quick-stats">
        <div class="stat-card">
          <div class="stat-value">{{ execution.nodes?.length || 0 }}</div>
          <div class="stat-label">总节点</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-value">{{ successCount }}</div>
          <div class="stat-label">成功</div>
        </div>
        <div class="stat-card stat-failed" v-if="failedCount > 0">
          <div class="stat-value">{{ failedCount }}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatDuration(execution.durationMs) }}</div>
          <div class="stat-label">总耗时</div>
        </div>
      </div>

      <div class="collapsible-section">
        <button class="section-toggle" @click="showDetails = !showDetails">
          <span class="toggle-icon" :class="{ 'rotated': showDetails }">
            <ChevronDown class="w-5 h-5" />
          </span>
          <span class="toggle-text">详细信息</span>
        </button>
        <div v-show="showDetails" class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">工作流 ID</div>
              <div class="info-value mono">{{ execution.workflowId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">版本</div>
              <div class="info-value">v{{ execution.workflowVersion }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">开始时间</div>
              <div class="info-value">{{ formatDateTime(execution.startedAt) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">结束时间</div>
              <div class="info-value">{{ formatDateTime(execution.endedAt) }}</div>
            </div>
            <div class="info-item" v-if="execution.routeId">
              <div class="info-label">路由 ID</div>
              <div class="info-value mono">{{ execution.routeId }}</div>
            </div>
            <div class="info-item" v-if="execution.deploymentId">
              <div class="info-label">部署 ID</div>
              <div class="info-value mono">{{ execution.deploymentId }}</div>
            </div>
          </div>

          <div v-if="execution.inputSummary || execution.outputSummary" class="summaries-section">
            <div v-if="execution.inputSummary" class="summary-box">
              <div class="summary-title">输入摘要</div>
              <div class="summary-content">{{ execution.inputSummary }}</div>
            </div>
            <div v-if="execution.outputSummary" class="summary-box">
              <div class="summary-title">输出摘要</div>
              <div class="summary-content">{{ execution.outputSummary }}</div>
            </div>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Loader2, AlertCircle, ChevronDown, RefreshCw } from 'lucide-vue-next';
import workflowApi from '../../services/workflowApi';
import Toast from '../common/Toast.vue';

const router = useRouter();
const route = useRoute();

const executionId = ref(route.params.executionId as string);
const loading = ref(true);
const execution = ref<any>(null);
const graphContainer = ref<HTMLElement | null>(null);
const showDetails = ref(false);

// 平移相关状态
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const startPanX = ref(0);
const startPanY = ref(0);
const startMouseX = ref(0);
const startMouseY = ref(0);

const nodeWidth = 240;
const nodeHeight = 64;
const nodeSpacingX = 300;
const nodeSpacingY = 110;

const successCount = computed(() => {
  if (!execution.value?.nodes) return 0;
  return execution.value.nodes.filter((n: any) => n.status === 'COMPLETED').length;
});

const failedCount = computed(() => {
  if (!execution.value?.nodes) return 0;
  return execution.value.nodes.filter((n: any) => n.status === 'FAILED').length;
});

const graphWidth = computed(() => {
  if (!graphNodes.value.length) return 900;
  const maxX = Math.max(...graphNodes.value.map(n => n.x)) + nodeWidth + 60;
  return Math.max(900, maxX);
});

const graphHeight = computed(() => {
  if (!graphNodes.value.length) return 450;
  const maxY = Math.max(...graphNodes.value.map(n => n.y)) + nodeHeight + 60;
  return Math.max(450, maxY);
});

const viewWidth = computed(() => graphWidth.value);
const viewHeight = computed(() => graphHeight.value);

const graphNodes = computed(() => {
  if (!execution.value?.nodes) return [];

  const nodes = execution.value.nodes as any[];

  const positionedNodes = nodes.map((node, index) => {
    const statusClass = getNodeStatusClass(node.status);
    const isFailed = node.status === 'FAILED';

    let statusIcon = '○';
    if (node.status === 'COMPLETED') statusIcon = '✓';
    else if (node.status === 'FAILED') statusIcon = '✕';
    else if (node.status === 'RUNNING') statusIcon = '●';
    else if (node.status === 'SKIPPED') statusIcon = '→';

    return {
      id: node.nodeId,
      name: node.nodeName.length > 16 ? node.nodeName.substring(0, 16) + '...' : node.nodeName,
      fullName: node.nodeName,
      type: node.nodeType,
      status: node.status,
      statusClass,
      statusIcon,
      class: isFailed ? 'node-failed' : statusClass.replace('status-', 'node-'),
      isFailed,
      x: 40,
      y: 40,
      duration: node.durationMs ? formatDuration(node.durationMs) : null,
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
  if (!execution.value?.nodes) return [];

  const edges: any[] = [];
  const nodes = graphNodes.value;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  execution.value.nodes.forEach((node: any) => {
    if (node.inputDataSource && nodeMap.has(node.inputDataSource) && nodeMap.has(node.nodeId)) {
      const source = nodeMap.get(node.inputDataSource)!;
      const target = nodeMap.get(node.nodeId)!;
      const isFailed = target.status === 'FAILED' || source.status === 'FAILED';

      edges.push({
        id: `${source.id}-${target.id}`,
        x1: source.x + nodeWidth,
        y1: source.y + nodeHeight / 2,
        x2: target.x,
        y2: target.y + nodeHeight / 2,
        class: isFailed ? 'edge-failed' : 'edge-normal',
        isFailed,
      });
    }
  });

  return edges;
});

const showErrorToast = ref(false);
const toastMessage = ref('');

function goBack() {
  router.back();
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    RUNNING: 'status-running',
    COMPLETED: 'status-success',
    FAILED: 'status-failed',
    CANCELLED: 'status-cancelled',
  };
  return classes[status] || 'status-pending';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    RUNNING: '运行中',
    COMPLETED: '已完成',
    FAILED: '失败',
    CANCELLED: '已取消',
  };
  return texts[status] || '未知';
}

function getNodeStatusClass(status: string): string {
  const classes: Record<string, string> = {
    PENDING: 'status-pending',
    RUNNING: 'status-running',
    COMPLETED: 'status-success',
    FAILED: 'status-failed',
    SKIPPED: 'status-skipped',
  };
  return classes[status] || 'status-pending';
}

function getNodeStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: '等待中',
    RUNNING: '运行中',
    COMPLETED: '已完成',
    FAILED: '失败',
    SKIPPED: '已跳过',
  };
  return texts[status] || '未知';
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function formatDuration(ms: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function formatJson(jsonStr: string): string {
  if (!jsonStr) return '';
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
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

function resetView() {
  panX.value = 0;
  panY.value = 0;
}

function panToFailedNode() {
  if (!execution.value?.nodes) return;
  const failedNode = graphNodes.value.find(n => n.isFailed);
  if (failedNode) {
    // 平移到失败节点，让它在视图中居中
    const containerWidth = graphContainer.value?.clientWidth || 800;
    const containerHeight = graphContainer.value?.clientHeight || 400;
    panX.value = (containerWidth / 2) - failedNode.x - (nodeWidth / 2);
    panY.value = (containerHeight / 2) - failedNode.y - (nodeHeight / 2);
  }
}

async function loadExecutionDetail() {
  loading.value = true;
  try {
    const response = await workflowApi.getExecutionDetail(executionId.value);
    if (response.success) {
      execution.value = response.data;
      if (response.data.nodes?.some((n: any) => n.status === 'FAILED')) {
        showDetails.value = true;
      }
      // 等待 DOM 更新后平移到失败节点
      setTimeout(() => {
        panToFailedNode();
      }, 100);
    }
  } catch (err: any) {
    console.error('Failed to load execution detail:', err);
    showError(err.message || '加载执行详情失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadExecutionDetail();
});
</script>

<style scoped>
.execution-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 20px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
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
  width: 44px;
  height: 44px;
  background: #f3f4f6;
  border: none;
  border-radius: 12px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.execution-id-mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #6b7280;
}

.execution-status-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-running {
  background: #dbeafe;
  color: #2563eb;
}

.status-success {
  background: #dcfce7;
  color: #16a34a;
}

.status-failed {
  background: #fee2e2;
  color: #dc2626;
}

.status-cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.status-skipped {
  background: #f3f4f6;
  color: #6b7280;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 20px;
  background: #f8fafc;
}

.loading-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.detail-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-radius: 16px;
  color: #dc2626;
}

.error-banner-content {
  flex: 1;
}

.error-banner-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}

.error-banner-message {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 6px;
}

.error-banner-node {
  font-size: 13px;
  opacity: 0.9;
}

.mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.graph-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 1px solid #e5e7eb;
}

.graph-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.legend {
  display: flex;
  gap: 20px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.legend-text {
  font-size: 13px;
  color: #6b7280;
}

.graph-wrapper {
  padding: 32px;
  overflow: hidden;
  background: #f9fafb;
  min-height: 350px;
  max-height: 500px;
  position: relative;
}

.graph-wrapper.grabbing {
  user-select: none;
}

.graph-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.zoom-btn:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.graph-svg {
  display: block;
}

.edge-line {
  stroke: #9ca3af;
  stroke-width: 2;
  fill: none;
}

.edge-normal {
  stroke: #9ca3af;
}

.edge-failed {
  stroke: #ef4444;
  stroke-width: 3;
}

.graph-node {
  cursor: pointer;
}

.graph-node:hover .node-bg {
  filter: brightness(0.98);
}


.node-failure-glow {
  fill: none;
  stroke: #ef4444;
  stroke-width: 2;
  opacity: 0.7;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.node-bg {
  fill: #ffffff;
  stroke: #e5e7eb;
  stroke-width: 2;
}

.node-status-circle {
  stroke: #ffffff;
  stroke-width: 2;
}

.node-status-circle.status-success {
  fill: #22c55e;
}

.node-status-circle.status-failed {
  fill: #ef4444;
}

.node-status-circle.status-running {
  fill: #3b82f6;
}

.node-status-circle.status-pending {
  fill: #fbbf24;
}

.node-status-circle.status-skipped {
  fill: #9ca3af;
}

.node-status-icon {
  font-size: 14px;
  font-weight: 700;
  fill: #ffffff;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  fill: #1f2937;
}

.node-type {
  font-size: 12px;
  fill: #6b7280;
}

.node-duration {
  font-size: 11px;
  fill: #9ca3af;
}

.node-failed .node-bg {
  stroke: #ef4444;
  stroke-width: 3;
  fill: #fef2f2;
}

.node-success .node-bg {
  stroke: #22c55e;
}

.node-running .node-bg {
  stroke: #3b82f6;
}

.node-pending .node-bg {
  stroke: #fbbf24;
}

.node-skipped .node-bg {
  stroke: #9ca3af;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.stat-success {
  border-color: #22c55e;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.stat-failed {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.collapsible-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: transparent;
  border: none;
  color: #1f2937;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.section-toggle:hover {
  background: #f9fafb;
}

.toggle-icon {
  transition: transform 0.2s;
  color: #6b7280;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.toggle-text {
  flex: 1;
  text-align: left;
}

.section-content {
  padding: 0 24px 24px 24px;
  border-top: 1px solid #e5e7eb;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  padding: 20px 0;
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
  word-break: break-word;
  overflow-wrap: anywhere;
}

.summaries-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.summary-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.summary-title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.summary-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

</style>
