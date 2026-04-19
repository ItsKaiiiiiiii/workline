<template>
  <aside class="node-panel">
    <div class="panel-header">
      <div class="panel-title">
        <Package class="w-5 h-5" />
        <span>组件库</span>
      </div>
      <p class="panel-desc">拖拽组件到画布</p>
    </div>
    <div class="panel-content">
      <div v-if="componentsStore.isLoading" class="loading-state">
        <div class="loading-spinner" />
        <span>加载组件中...</span>
      </div>
      <div v-else-if="componentsStore.error" class="error-state">
        <span>{{ componentsStore.error }}</span>
        <button class="retry-btn" @click="componentsStore.fetchComponents">
          重试
        </button>
      </div>
      <template v-else>
        <div v-if="sourceComponents.length > 0" class="node-category">
          <div class="category-title">起点组件</div>
          <div class="node-grid">
            <NodeItem
              v-for="node in sourceComponents"
              :key="node.type"
              :node="node"
              @dragstart="handleDragStart"
            />
          </div>
        </div>
        <div v-if="virtualComponents.length > 0" class="node-category">
          <div class="category-title">数据变换</div>
          <div class="node-grid">
            <NodeItem
              v-for="node in virtualComponents"
              :key="node.type"
              :node="node"
              @dragstart="handleDragStart"
            />
          </div>
        </div>
        <div v-if="standardComponents.length > 0" class="node-category">
          <div class="category-title">标准组件</div>
          <div class="node-grid">
            <NodeItem
              v-for="node in standardComponents"
              :key="node.type"
              :node="node"
              @dragstart="handleDragStart"
            />
          </div>
        </div>
        <div v-if="customComponents.length > 0" class="node-category">
          <div class="category-title">自定义组件</div>
          <div class="node-grid">
            <NodeItem
              v-for="node in customComponents"
              :key="node.type"
              :node="node"
              @dragstart="handleDragStart"
            />
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Package } from 'lucide-vue-next';
import { useComponentsStore } from '../../stores/components';
import type { NodeConfig } from '../../types';
import NodeItem from '../node/NodeItem.vue';

const emit = defineEmits<{
  dragstart: [event: DragEvent, node: NodeConfig];
}>();

const componentsStore = useComponentsStore();

const sourceComponents = computed(() =>
  componentsStore.allComponents.filter((n) => n.canBeSource && !n.isVirtual)
);

const virtualComponents = computed(() =>
  componentsStore.allComponents.filter((n) => n.isVirtual)
);

const standardComponents = computed(() =>
  componentsStore.allComponents.filter((n) => !n.canBeSource && !n.isVirtual && n.category === 'SYSTEM')
);

const customComponents = computed(() =>
  componentsStore.allComponents.filter((n) => n.category === 'CUSTOM')
);

onMounted(() => {
  componentsStore.fetchComponents();
});

function handleDragStart(event: DragEvent, node: NodeConfig) {
  emit('dragstart', event, node);
}
</script>

<style scoped>
.node-panel {
  width: 260px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.panel-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}

.node-category {
  margin-bottom: 20px;
}

.node-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
  padding-left: 2px;
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}
</style>
