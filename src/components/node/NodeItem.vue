<template>
  <div
    class="node-item"
    draggable="true"
    @dragstart="onDragStart"
    :title="node.description"
  >
    <div class="node-icon" :style="{ backgroundColor: node.bgColor, color: node.color }">
      <component :is="iconComponent" class="w-4 h-4" />
    </div>
    <div class="node-label">{{ node.label }}</div>
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.2s;
  min-height: 76px;
}

.node-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.node-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.node-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.node-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  line-height: 1.2;
}
</style>
