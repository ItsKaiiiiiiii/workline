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
      <div class="node-category">
        <div class="category-title">开始</div>
        <div class="node-list">
          <NodeItem
            v-for="node in triggerNodes"
            :key="node.type"
            :node="node"
            @dragstart="handleDragStart"
          />
        </div>
      </div>
      <div class="node-category">
        <div class="category-title">处理</div>
        <div class="node-list">
          <NodeItem
            v-for="node in processNodes"
            :key="node.type"
            :node="node"
            @dragstart="handleDragStart"
          />
        </div>
      </div>
      <div class="node-category">
        <div class="category-title">结束</div>
        <div class="node-list">
          <NodeItem
            v-for="node in endNodes"
            :key="node.type"
            :node="node"
            @dragstart="handleDragStart"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Package } from 'lucide-vue-next';
import { NODE_LIBRARY } from '../../config/nodeLibrary';
import type { NodeConfig } from '../../types';
import NodeItem from '../node/NodeItem.vue';

const emit = defineEmits<{
  dragstart: [event: DragEvent, node: NodeConfig];
}>();

const triggerNodes = computed(() =>
  NODE_LIBRARY.filter((n) => n.type === 'trigger')
);

const processNodes = computed(() =>
  NODE_LIBRARY.filter((n) =>
    ['action', 'condition', 'transform', 'api', 'database'].includes(n.type)
  )
);

const endNodes = computed(() =>
  NODE_LIBRARY.filter((n) => ['notification', 'output'].includes(n.type))
);

function handleDragStart(event: DragEvent, node: NodeConfig) {
  emit('dragstart', event, node);
}
</script>

<style scoped>
.node-panel {
  width: 280px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.panel-desc {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.node-category {
  margin-bottom: 24px;
}

.category-title {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
