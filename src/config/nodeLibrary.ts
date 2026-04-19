import type { NodeConfig } from '../types';

export const NODE_LIBRARY: NodeConfig[] = [
  {
    type: 'trigger',
    label: '触发器',
    icon: 'Zap',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    description: '工作流的起始点',
    defaultParams: { event: '' },
    inputs: [],
    outputs: ['output'],
    outputFields: [
      { name: 'event', label: '事件数据', type: 'object', description: '触发事件的完整数据' },
      { name: 'timestamp', label: '触发时间', type: 'number', description: '触发时间戳' },
    ],
    defaultOutputTransform: `// 自定义输出处理
// input: 节点原始输出数据
// return: 处理后的输出数据，供下游组件使用

return {
  ...input,
  timestamp: Date.now()
};`,
  },
  {
    type: 'action',
    label: '操作',
    icon: 'MousePointerClick',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    description: '执行特定操作',
    defaultParams: { action: '' },
    inputs: ['input'],
    outputs: ['output'],
    inputFields: [
      { name: 'data', label: '输入数据', type: 'any', required: true, description: '上游传入的数据' },
    ],
    outputFields: [
      { name: 'result', label: '操作结果', type: 'any', description: '操作执行后的结果' },
      { name: 'success', label: '是否成功', type: 'boolean', description: '操作是否成功' },
    ],
    defaultOutputTransform: `// 自定义输出处理
// input: 节点原始输出数据
// context: 上游节点的输出数据
// return: 处理后的输出数据

return {
  result: input,
  success: true
};`,
  },
  {
    type: 'condition',
    label: '条件判断',
    icon: 'GitBranch',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    description: '根据条件分支',
    defaultParams: { condition: '' },
    inputs: ['input'],
    outputs: ['true', 'false'],
    inputFields: [
      { name: 'value', label: '判断值', type: 'any', required: true, description: '用于条件判断的值' },
    ],
    outputFields: [
      { name: 'condition', label: '条件表达式', type: 'string', description: '条件表达式' },
      { name: 'result', label: '判断结果', type: 'boolean', description: 'true或false' },
    ],
    defaultOutputTransform: `// 自定义输出处理
// input: 节点原始输出数据
// 判断条件，返回true或false

return {
  result: !!input
};`,
  },
  {
    type: 'transform',
    label: '数据转换',
    icon: 'ArrowRightLeft',
    color: '#14b8a6',
    bgColor: '#f0fdfa',
    description: '转换数据格式',
    defaultParams: { mapping: '' },
    inputs: ['input'],
    outputs: ['output'],
    inputFields: [
      { name: 'data', label: '原始数据', type: 'any', required: true, description: '需要转换的原始数据' },
    ],
    outputFields: [
      { name: 'transformed', label: '转换后数据', type: 'any', description: '转换后的数据' },
    ],
    defaultOutputTransform: `// 自定义数据转换
// input: 上游节点的输出数据
// 示例：从input中提取指定字段

return {
  transformed: {
    // 自定义字段映射
    id: input.id,
    name: input.name || input.title,
    value: input.amount || input.value,
    // 添加你需要的字段...
  }
};`,
  },
  {
    type: 'api',
    label: 'API请求',
    icon: 'Globe',
    color: '#10b981',
    bgColor: '#ecfdf5',
    description: '调用外部API',
    defaultParams: { url: '', method: 'GET' },
    inputs: ['input'],
    outputs: ['success', 'error'],
    inputFields: [
      { name: 'body', label: '请求体', type: 'object', description: 'API请求的body数据' },
      { name: 'params', label: '请求参数', type: 'object', description: 'URL查询参数' },
      { name: 'headers', label: '请求头', type: 'object', description: '自定义请求头' },
    ],
    outputFields: [
      { name: 'data', label: '响应数据', type: 'any', description: 'API响应的data字段' },
      { name: 'status', label: '状态码', type: 'number', description: 'HTTP状态码' },
      { name: 'headers', label: '响应头', type: 'object', description: '响应头信息' },
    ],
    defaultOutputTransform: `// 自定义API响应处理
// input: API原始响应
// 从响应中提取需要的字段供下游使用

return {
  // 直接返回完整响应数据
  data: input.data || input,
  status: input.status || 200,
  // 可以添加自定义字段提取逻辑
  // 例如: userId: input.data?.user?.id
};`,
  },
  {
    type: 'database',
    label: '数据库',
    icon: 'Database',
    color: '#f97316',
    bgColor: '#fff7ed',
    description: '数据库操作',
    defaultParams: { datasourceId: '', query: '' },
    inputs: ['input'],
    outputs: ['output'],
    inputFields: [
      { name: 'params', label: '查询参数', type: 'object', description: 'SQL查询参数' },
      { name: 'data', label: '插入数据', type: 'object', description: '用于插入或更新的数据' },
    ],
    outputFields: [
      { name: 'rows', label: '结果行', type: 'array', description: '查询结果数组' },
      { name: 'count', label: '影响行数', type: 'number', description: '受影响的行数' },
      { name: 'first', label: '第一条', type: 'object', description: '第一条结果' },
    ],
    defaultOutputTransform: `// 自定义数据库结果处理
// input: 数据库原始查询结果
// 提取需要的字段供下游使用

return {
  rows: input.rows || input,
  count: input.rowCount || input.length || 0,
  first: (input.rows && input.rows[0]) || input[0] || null,
  // 自定义字段提取
  // 例如: userList: input.rows?.map(r => ({ id: r.id, name: r.name }))
};`,
  },
  {
    type: 'notification',
    label: '通知',
    icon: 'Bell',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    description: '发送通知消息',
    defaultParams: { message: '', channel: '' },
    inputs: ['input'],
    outputs: ['output'],
    inputFields: [
      { name: 'message', label: '消息内容', type: 'string', required: true, description: '通知消息内容' },
      { name: 'title', label: '消息标题', type: 'string', description: '通知标题' },
      { name: 'recipients', label: '接收人', type: 'array', description: '接收人列表' },
    ],
    outputFields: [
      { name: 'sent', label: '是否发送', type: 'boolean', description: '消息是否发送成功' },
      { name: 'messageId', label: '消息ID', type: 'string', description: '发送的消息ID' },
    ],
    defaultOutputTransform: `// 自定义通知结果处理
// input: 通知发送结果

return {
  sent: true,
  messageId: input.messageId || \`msg_\${Date.now()}\`,
  timestamp: Date.now()
};`,
  },
  {
    type: 'output',
    label: '输出',
    icon: 'CheckCircle',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    description: '工作流结束',
    defaultParams: {},
    inputs: ['input'],
    outputs: [],
    inputFields: [
      { name: 'data', label: '输出数据', type: 'any', required: true, description: '工作流最终输出数据' },
    ],
    defaultOutputTransform: `// 工作流最终输出处理
// input: 上游节点的输出
// return: 工作流的最终结果

return {
  finalResult: input,
  completedAt: new Date().toISOString()
};`,
  },
];
