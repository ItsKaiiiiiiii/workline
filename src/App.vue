<template>
  <div class="app-container">
    <Header />
    <div class="main-content">
      <NodePanel @dragstart="handleNodeDragStart" />
      <div class="canvas-area">
        <CanvasEditor ref="canvasEditorRef" />
      </div>
      <PropertiesPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Header from './components/layout/Header.vue';
import NodePanel from './components/layout/NodePanel.vue';
import CanvasEditor from './components/canvas/CanvasEditor.vue';
import PropertiesPanel from './components/layout/PropertiesPanel.vue';
import type { NodeConfig } from './types';

const canvasEditorRef = ref<InstanceType<typeof CanvasEditor>>();

function handleNodeDragStart(event: DragEvent, node: NodeConfig) {
  canvasEditorRef.value?.handleNodeDrop(node, event);
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  overflow: hidden;
}
</style>
