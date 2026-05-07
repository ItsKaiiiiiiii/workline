<template>
  <div v-if="visible" class="test-result-panel">
    <div class="panel-header">
      <div class="panel-title-section">
        <h3 class="panel-title">测试结果</h3>
        <div v-if="testStatus" class="status-badge" :class="statusClass">
          <component :is="statusIcon" class="w-4 h-4" />
          <span>{{ statusText }}</span>
        </div>
      </div>
      <div class="panel-header-buttons">
        <button v-if="!testStore.isRunning && !testStore.isPolling" class="panel-rerun-btn" @click="handleRerun">
          <Play class="w-4 h-4" />
          <span>重新测试</span>
        </button>
        <button class="panel-close-btn" @click="handleClose">
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div v-if="testExecution" class="panel-body">
      <!-- 摘要信息 -->
      <div class="summary-section">
        <div class="summary-item">
          <span class="summary-label">总耗时</span>
          <span class="summary-value">{{ formatDuration(totalDuration) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">成功节点</span>
          <span class="summary-value success">{{ successNodeCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">失败节点</span>
          <span class="summary-value error">{{ failedNodeCount }}</span>
        </div>
      </div>

      <!-- 整体错误信息 -->
      <div v-if="testExecution.errorMessage" class="error-section">
        <div class="error-header">
          <AlertCircle class="w-5 h-5" />
          <span>执行错误</span>
        </div>
        <div class="error-message">{{ testExecution.errorMessage }}</div>
        <div v-if="testExecution.errorStacktrace" class="stacktrace-toggle">
          <button @click="showStacktrace = !showStacktrace" class="toggle-btn">
            <ChevronDown v-if="!showStacktrace" class="w-4 h-4" />
            <ChevronUp v-else class="w-4 h-4" />
            <span>{{ showStacktrace ? '隐藏堆栈' : '查看堆栈' }}</span>
          </button>
          <pre v-if="showStacktrace" class="stacktrace">{{ testExecution.errorStacktrace }}</pre>
        </div>
      </div>

      <!-- 节点列表 -->
      <div class="nodes-section">
        <h4 class="section-title">节点执行情况</h4>
        <div class="nodes-list">
          <div
            v-for="node in sortedNodes"
            :key="node.nodeId"
            class="node-item"
            :class="{ selected: selectedTestNodeId === node.nodeId }"
            @click="handleSelectNode(node.nodeId)"
          >
            <div class="node-status-indicator" :class="getNodeStatusClass(node.status)">
              <component :is="getNodeStatusIcon(node.status)" class="w-4 h-4" />
            </div>
            <div class="node-info">
              <div class="node-name">{{ node.nodeName }}</div>
              <div class="node-type">{{ node.nodeType }}</div>
            </div>
            <div class="node-duration">{{ formatDuration(node.durationMs) }}</div>
          </div>
        </div>
      </div>

      <!-- 选中节点详情 -->
      <div v-if="selectedNode" class="node-detail-section">
        <div class="detail-header">
          <div class="detail-header-left">
            <h4 class="section-title">{{ selectedNode.nodeName }}</h4>
            <span class="node-type-badge">{{ selectedNode.nodeType }}</span>
          </div>
          <span class="status-badge" :class="getNodeStatusClass(selectedNode.status)">
            {{ statusText }}
          </span>
        </div>

        <!-- 执行耗时 -->
        <div v-if="selectedNode.durationMs" class="info-row">
          <span class="info-label">执行耗时:</span>
          <span class="info-value">{{ formatDuration(selectedNode.durationMs) }}</span>
        </div>

        <!-- 节点状态错误信息 -->
        <div v-if="selectedNode.errorMessage" class="node-error-section">
          <div class="error-header">
            <AlertCircle class="w-4 h-4" />
            <span>❌ 节点错误</span>
          </div>
          <div class="error-message">{{ selectedNode.errorMessage }}</div>
          <div v-if="selectedNode.errorStacktrace" class="stacktrace-toggle">
            <button @click="showNodeStacktrace = !showNodeStacktrace" class="toggle-btn">
              <ChevronDown v-if="!showNodeStacktrace" class="w-4 h-4" />
              <ChevronUp v-else class="w-4 h-4" />
              <span>{{ showNodeStacktrace ? '隐藏堆栈' : '查看堆栈' }}</span>
            </button>
            <pre v-if="showNodeStacktrace" class="stacktrace">{{ selectedNode.errorStacktrace }}</pre>
          </div>
        </div>

        <!-- 配置快照 -->
        <div class="data-section">
          <div class="data-header" @click="toggleSection('config')">
            <ChevronRight class="w-4 h-4 chevron" :class="{ expanded: expandedSections.config }" />
            <div class="data-title">
              <span>⚙️ 节点配置</span>
            </div>
            <button class="copy-btn" @click.stop="copyToClipboard(selectedNode.nodeConfig)">📋 复制</button>
          </div>
          <pre v-if="expandedSections.config" class="data-content">{{ formatJson(selectedNode.nodeConfig) }}</pre>
        </div>

        <!-- 输入数据 -->
        <div v-if="selectedNode.inputData" class="data-section">
          <div class="data-header" @click="toggleSection('input')">
            <ChevronRight class="w-4 h-4 chevron" :class="{ expanded: expandedSections.input }" />
            <div class="data-title">
              <span>📥 节点输入</span>
              <span class="data-hint">(上一个节点的输出)</span>
            </div>
            <button class="copy-btn" @click.stop="copyToClipboard(selectedNode.inputData)">📋 复制</button>
          </div>
          <pre v-if="expandedSections.input" class="data-content">{{ formatJson(selectedNode.inputData) }}</pre>
        </div>

        <!-- 输出数据 -->
        <div v-if="selectedNode.outputData" class="data-section">
          <div class="data-header" @click="toggleSection('output')">
            <ChevronRight class="w-4 h-4 chevron" :class="{ expanded: expandedSections.output }" />
            <div class="data-title">
              <span>📤 节点输出</span>
              <span class="data-hint">(当前节点的真实返回)</span>
            </div>
            <button class="copy-btn" @click.stop="copyToClipboard(selectedNode.outputData)">📋 复制</button>
          </div>
          <pre v-if="expandedSections.output" class="data-content">{{ formatJson(selectedNode.outputData) }}</pre>
        </div>
      </div>
    </div>

    <div v-else class="panel-body empty-state">
      <div class="empty-icon">
        <PlayCircle class="w-12 h-12" />
      </div>
      <p class="empty-text">运行测试来查看结果</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Loader2,
  Play,
} from 'lucide-vue-next';
import { useWorkflowTestStore } from '../../stores/workflowTest';
import type { ParsedTestNodeExecution, TestExecutionStatus } from '../../types/api';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'rerun'): void;
}>();

const testStore = useWorkflowTestStore();

const showStacktrace = ref(false);
const showNodeStacktrace = ref(false);
const expandedSections = ref<{ [key: string]: boolean }>({
  input: true,
  output: true,
  config: false,
});

// 计算属性
const testExecution = computed(() => testStore.currentTestExecution);
const testStatus = computed(() => testStore.testStatus);
const selectedTestNodeId = computed(() => testStore.selectedTestNodeId);
const totalDuration = computed(() => testStore.totalDuration);
const successNodeCount = computed(() => testStore.successNodeCount);
const failedNodeCount = computed(() => testStore.failedNodeCount);

const sortedNodes = computed(() => {
  if (!testExecution.value) return [];
  return [...testExecution.value.nodes].sort((a, b) => a.executionOrder - b.executionOrder);
});

const selectedNode = computed((): ParsedTestNodeExecution | null => {
  return testStore.selectedTestNode;
});

const statusClass = computed(() => {
  switch (testStatus.value) {
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
});

const statusIcon = computed(() => {
  switch (testStatus.value) {
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
});

const statusText = computed(() => {
  switch (testStatus.value) {
    case 'COMPLETED':
      return '成功';
    case 'FAILED':
      return '失败';
    case 'RUNNING':
      return '运行中';
    case 'CANCELLED':
      return '已取消';
    case 'PAUSED':
      return '已暂停';
    case 'WAITING_RETRY':
      return '等待重试';
    case 'SKIPPED':
      return '已跳过';
    default:
      return '等待中';
  }
});

// 方法
function handleClose() {
  emit('close');
}

function handleRerun() {
  emit('rerun');
}

function handleSelectNode(nodeId: string) {
  testStore.selectTestNode(nodeId === selectedTestNodeId.value ? null : nodeId);
}

function toggleSection(section: string) {
  expandedSections.value[section] = !expandedSections.value[section];
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

function copyToClipboard(data: any) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    // 可以加个小提示
  }).catch(err => {
    console.error('复制失败:', err);
  });
}

function getNodeStatusClass(status: TestExecutionStatus): string {
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

function getNodeStatusIcon(status: TestExecutionStatus) {
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
</script>

<style scoped>
.test-result-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.panel-header-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-rerun-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.panel-rerun-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.success {
  background: #dcfce7;
  color: #166534;
}

.status-badge.error {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.running {
  background: #dbeafe;
  color: #1e40af;
  animation: pulse 2s infinite;
}

.status-badge.pending {
  background: #f3f4f6;
  color: #4b5563;
}

.status-badge.cancelled {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.paused {
  background: #f3f4f6;
  color: #4b5563;
}

.status-badge.waiting-retry {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.skipped {
  background: #f3f4f6;
  color: #6b7280;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.panel-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.panel-close-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.panel-body.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-icon {
  color: #d1d5db;
}

.empty-text {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.summary-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.summary-value.success {
  color: #16a34a;
}

.summary-value.error {
  color: #dc2626;
}

.error-section {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
}

.node-error-section {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 8px;
}

.error-message {
  font-size: 13px;
  color: #7f1d1d;
  line-height: 1.5;
}

.stacktrace-toggle {
  margin-top: 8px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  color: #991b1b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #fee2e2;
}

.stacktrace {
  margin-top: 8px;
  padding: 10px;
  background: #1f2937;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.5;
  color: #e5e7eb;
  overflow-x: auto;
  white-space: pre-wrap;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.nodes-section {
  margin-bottom: 20px;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.node-item.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.node-status-indicator {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.node-status-indicator.success {
  background: #dcfce7;
  color: #16a34a;
}

.node-status-indicator.error {
  background: #fee2e2;
  color: #991b1b;
}

.node-status-indicator.running {
  background: #dbeafe;
  color: #1e40af;
  animation: spin 1s linear infinite;
}

.node-status-indicator.pending {
  background: #f3f4f6;
  color: #6b7280;
}

.node-status-indicator.cancelled {
  background: #fef3c7;
  color: #92400e;
}

.node-status-indicator.paused {
  background: #f3f4f6;
  color: #4b5563;
}

.node-status-indicator.waiting-retry {
  background: #dbeafe;
  color: #1e40af;
}

.node-status-indicator.skipped {
  background: #f3f4f6;
  color: #6b7280;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.node-type {
  font-size: 12px;
  color: #6b7280;
}

.node-duration {
  font-size: 12px;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.node-detail-section {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-type-badge {
  padding: 2px 8px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
  border-radius: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #6b7280;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.data-section {
  margin-bottom: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.data-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  transition: color 0.2s;
}

.data-header:hover {
  color: #1f2937;
}

.data-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.data-hint {
  font-size: 11px;
  font-weight: normal;
  color: #6b7280;
}

.copy-btn {
  padding: 4px 10px;
  font-size: 11px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.chevron {
  transition: transform 0.2s;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.data-content {
  margin: 8px 0 0 0;
  padding: 12px;
  background: #1f2937;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #e5e7eb;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
