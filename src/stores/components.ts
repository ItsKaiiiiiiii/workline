import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import componentApi, { type SystemComponent, type CustomComponent } from '../services/componentApi';
import type { NodeConfig } from '../types';

// 后端组件类型到前端配置的映射
const COMPONENT_CONFIG: Record<string, Partial<NodeConfig>> = {
  timer: {
    icon: 'Clock',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    defaultParams: {},
    inputs: [],
    outputs: ['output'],
  },
  file_listener: {
    icon: 'FileText',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    defaultParams: {},
    inputs: [],
    outputs: ['output'],
  },
  file_writer: {
    icon: 'FileText',
    color: '#1d4ed8',
    bgColor: '#eff6ff',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  ftp_listener: {
    icon: 'Upload',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    defaultParams: {},
    inputs: [],
    outputs: ['output'],
  },
  ftp_upload: {
    icon: 'Upload',
    color: '#6d28d9',
    bgColor: '#f5f3ff',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  http: {
    icon: 'Globe',
    color: '#10b981',
    bgColor: '#ecfdf5',
    defaultParams: { url: '', method: 'GET' },
    inputs: ['input'],
    outputs: ['output'],
  },
  email: {
    icon: 'Mail',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  script: {
    icon: 'Code2',
    color: '#6366f1',
    bgColor: '#eef2ff',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  log: {
    icon: 'Terminal',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  direct: {
    icon: 'Zap',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    defaultParams: {},
    inputs: [],
    outputs: ['output'],
  },
  set: {
    icon: 'Settings',
    color: '#14b8a6',
    bgColor: '#f0fdfa',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  function: {
    icon: 'FunctionSquare',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  merge: {
    icon: 'GitMerge',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    defaultParams: {},
    inputs: ['input1', 'input2'],
    outputs: ['output'],
  },
  jdbc: {
    icon: 'Database',
    color: '#f97316',
    bgColor: '#fff7ed',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  sql: {
    icon: 'Table',
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
    defaultParams: { query: '' },
    inputs: ['input'],
    outputs: ['output'],
  },
  kafka_consumer: {
    icon: 'MessageSquare',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    defaultParams: {},
    inputs: [],
    outputs: ['output'],
  },
  kafka_producer: {
    icon: 'MessageSquare',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  exec: {
    icon: 'Play',
    color: '#ef4444',
    bgColor: '#fef2f2',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
  csv: {
    icon: 'FileSpreadsheet',
    color: '#84cc16',
    bgColor: '#f7fee7',
    defaultParams: {},
    inputs: [],
    outputs: ['output'],
  },
  validator: {
    icon: 'CheckSquare',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    defaultParams: {},
    inputs: ['input'],
    outputs: ['output'],
  },
};

// 默认的输出转换代码
const DEFAULT_OUTPUT_TRANSFORM = `// 自定义输出处理
// input: 节点原始输出数据
// return: 处理后的输出数据

return input;
`;

function mapBackendComponentToNodeConfig(
  component: SystemComponent | CustomComponent
): NodeConfig {
  const config = COMPONENT_CONFIG[component.type] || {};

  return {
    type: component.type,
    label: component.name,
    description: component.description,
    icon: config.icon || 'Circle',
    color: config.color || '#6b7280',
    bgColor: config.bgColor || '#f3f4f6',
    defaultParams: config.defaultParams || {},
    inputs: config.inputs || (component.canBeSource ? [] : ['input']),
    outputs: config.outputs || ['output'],
    defaultOutputTransform: config.defaultOutputTransform || DEFAULT_OUTPUT_TRANSFORM,
    canBeSource: component.canBeSource,
    isVirtual: component.isVirtual,
    category: component.category,
  };
}

export const useComponentsStore = defineStore('components', () => {
  const systemComponents = ref<SystemComponent[]>([]);
  const customComponents = ref<CustomComponent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const allComponents = computed<NodeConfig[]>(() => {
    const system = systemComponents.value.map(mapBackendComponentToNodeConfig);
    const custom = customComponents.value.map(mapBackendComponentToNodeConfig);
    return [...system, ...custom];
  });

  const sourceComponents = computed<NodeConfig[]>(() => {
    return allComponents.value.filter(c => c.canBeSource);
  });

  async function fetchComponents(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await componentApi.getComponents();
      if (response.success) {
        systemComponents.value = response.data.systemComponents;
        customComponents.value = response.data.customComponents;
      }
    } catch (err) {
      console.error('Failed to fetch components:', err);
      error.value = '获取组件列表失败';
    } finally {
      isLoading.value = false;
    }
  }

  function getComponentByType(type: string): NodeConfig | undefined {
    return allComponents.value.find(c => c.type === type);
  }

  return {
    systemComponents,
    customComponents,
    allComponents,
    sourceComponents,
    isLoading,
    error,
    fetchComponents,
    getComponentByType,
  };
});
