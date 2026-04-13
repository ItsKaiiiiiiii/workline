<template>
  <div
    class="node-item"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="node-icon" :style="{ backgroundColor: node.bgColor, color: node.color }">
      <component :is="iconComponent" class="w-4 h-4" />
    </div>
    <div class="node-info">
      <div class="node-label">{{ node.label }}</div>
      <div class="node-desc">{{ node.description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as Icons from 'lucide-vue-next';
import type { NodeConfig } from '../../types';

const props = defineProps<{
  node: NodeConfig;
}>();

const emit = defineEmits<{
  dragstart: [event: DragEvent, node: NodeConfig];
}>();

const iconComponent = computed(() => {
  return (Icons as any)[props.node.icon] || Icons.Circle;
});

function onDragStart(event: DragEvent) {
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('application/json', JSON.stringify(props.node));
  emit('dragstart', event, props.node);
}
</script>

<style scoped>
.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.node-item:active {
  cursor: grabbing;
}

.node-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.node-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
