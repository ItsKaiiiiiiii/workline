export interface ComponentConfigField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'code' | 'list';
  required?: boolean;
  default?: any;
  placeholder?: string;
  description?: string;
  options?: { label: string; value: string }[];
  listFields?: ComponentConfigField[];
}

export interface ComponentConfig {
  type: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  inputs: string[];
  outputs: string[];
  fields: ComponentConfigField[];
  supportsScript?: boolean;
  defaultScript?: string;
}

// 组件配置定义
export const COMPONENT_CONFIGS: Record<string, ComponentConfig> = {
  TIMER: {
    type: 'TIMER',
    label: '定时器',
    icon: 'Clock',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'cron',
        label: 'Cron 表达式',
        type: 'string',
        placeholder: '0 0 2 * * ?',
        description: 'Cron 表达式，如：0 0 2 * * ?',
      },
      {
        name: 'period',
        label: '周期（毫秒）',
        type: 'number',
        placeholder: '3600000',
        description: '执行周期，单位毫秒',
      },
      {
        name: 'delay',
        label: '初始延迟（毫秒）',
        type: 'number',
        placeholder: '5000',
        description: '首次执行前的延迟时间',
      },
    ],
  },

  FILE: {
    type: 'FILE',
    label: '文件监听',
    icon: 'FileText',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'directory',
        label: '监听目录',
        type: 'string',
        default: 'data',
        placeholder: 'data',
        description: '监听目录路径',
      },
      {
        name: 'include',
        label: '包含文件（正则）',
        type: 'string',
        placeholder: '.*\\.csv$',
        description: '文件名正则匹配（包含）',
      },
      {
        name: 'exclude',
        label: '排除文件（正则）',
        type: 'string',
        placeholder: '.*\\.tmp$',
        description: '文件名正则匹配（排除）',
      },
      {
        name: 'recursive',
        label: '递归监听',
        type: 'boolean',
        default: false,
        description: '是否递归监听子目录',
      },
      {
        name: 'delay',
        label: '检查间隔（毫秒）',
        type: 'number',
        default: 500,
        placeholder: '500',
        description: '检查间隔（毫秒）',
      },
      {
        name: 'noop',
        label: '只读模式',
        type: 'boolean',
        default: false,
        description: '仅读取不移动/删除文件',
      },
      {
        name: 'delete',
        label: '处理后删除',
        type: 'boolean',
        default: false,
        description: '处理完是否删除文件',
      },
      {
        name: 'charset',
        label: '文件编码',
        type: 'string',
        default: 'UTF-8',
        placeholder: 'UTF-8',
        description: '文件编码',
      },
    ],
  },

  FTP: {
    type: 'FTP',
    label: 'FTP/SFTP',
    icon: 'Upload',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'host',
        label: '服务器地址',
        type: 'string',
        required: true,
        placeholder: 'ftp.example.com',
      },
      {
        name: 'port',
        label: '端口',
        type: 'number',
        default: 21,
        placeholder: '21',
      },
      {
        name: 'username',
        label: '用户名',
        type: 'string',
        placeholder: 'user',
      },
      {
        name: 'password',
        label: '密码',
        type: 'string',
        placeholder: 'password',
      },
      {
        name: 'directory',
        label: '远程目录',
        type: 'string',
        placeholder: '/upload',
      },
      {
        name: 'passiveMode',
        label: '被动模式',
        type: 'boolean',
        default: true,
      },
    ],
  },

  HTTP: {
    type: 'HTTP',
    label: 'HTTP 请求',
    icon: 'Globe',
    color: '#10b981',
    bgColor: '#ecfdf5',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'url',
        label: '请求 URL',
        type: 'string',
        required: true,
        placeholder: 'https://api.example.com/users',
      },
      {
        name: 'method',
        label: '请求方法',
        type: 'select',
        default: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      {
        name: 'headers',
        label: '请求头',
        type: 'code',
        placeholder: '{\n  "Content-Type": "application/json"\n}',
        description: 'JSON 格式的请求头',
      },
    ],
  },

  EMAIL: {
    type: 'EMAIL',
    label: '邮件',
    icon: 'Mail',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'to',
        label: '收件人',
        type: 'string',
        required: true,
        placeholder: 'user@example.com',
      },
      {
        name: 'cc',
        label: '抄送人',
        type: 'string',
        placeholder: 'manager@example.com',
      },
      {
        name: 'subject',
        label: '邮件主题',
        type: 'string',
        required: true,
        placeholder: '工作流通知',
      },
      {
        name: 'content',
        label: '邮件内容',
        type: 'textarea',
        required: true,
        placeholder: '这是邮件内容',
      },
    ],
  },

  SCRIPT: {
    type: 'SCRIPT',
    label: '脚本处理',
    icon: 'Code2',
    color: '#6366f1',
    bgColor: '#eef2ff',
    inputs: ['input'],
    outputs: ['output'],
    fields: [],
    supportsScript: true,
    defaultScript: `// 数据转换脚本
// msg: 输入消息对象
// metadata: 元数据（如 MQTT topic 等）
function transform(msg, metadata) {
  // 在这里编写你的转换逻辑
  // 例如：
  // return {
  //   ...msg,
  //   transformed: true,
  //   topic: metadata.topic
  // };

  return msg;
}`,
  },

  LOG: {
    type: 'LOG',
    label: '日志',
    icon: 'Terminal',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'logger',
        label: 'Logger 名称',
        type: 'string',
        default: 'connectX',
        placeholder: 'connectX',
        description: 'Logger 名称',
      },
      {
        name: 'level',
        label: '日志级别',
        type: 'select',
        default: 'INFO',
        options: [
          { label: 'TRACE', value: 'TRACE' },
          { label: 'DEBUG', value: 'DEBUG' },
          { label: 'INFO', value: 'INFO' },
          { label: 'WARN', value: 'WARN' },
          { label: 'ERROR', value: 'ERROR' },
        ],
      },
      {
        name: 'message',
        label: '自定义日志消息',
        type: 'string',
        placeholder: '处理完成 - ID: ${header.id}, 数据: ${body}',
        description: '支持 Simple 表达式，如 ${body}, ${header.name}, ${exchangeId}, ${date:now:yyyy-MM-dd}',
      },
      {
        name: 'showAll',
        label: '显示所有信息',
        type: 'boolean',
        default: false,
        description: '显示所有信息（包括消息体、头、属性等）',
      },
      {
        name: 'showBody',
        label: '显示消息体',
        type: 'boolean',
        default: true,
      },
      {
        name: 'showHeaders',
        label: '显示消息头',
        type: 'boolean',
        default: false,
      },
      {
        name: 'showExchangePattern',
        label: '显示交换模式',
        type: 'boolean',
        default: false,
      },
      {
        name: 'showProperties',
        label: '显示 Exchange 属性',
        type: 'boolean',
        default: false,
      },
    ],
  },

  DIRECT: {
    type: 'DIRECT',
    label: '直接调用',
    icon: 'Zap',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    inputs: [],
    outputs: ['output'],
    fields: [],
  },

  SET: {
    type: 'SET',
    label: '字段设置',
    icon: 'Settings',
    color: '#14b8a6',
    bgColor: '#f0fdfa',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'mappings',
        label: '字段映射',
        type: 'list',
        description: '配置字段映射关系',
        listFields: [
          {
            name: 'source',
            label: '源值',
            type: 'string',
            placeholder: '{{ $json.oldField }}',
            description: '支持表达式',
          },
          {
            name: 'target',
            label: '目标字段',
            type: 'string',
            placeholder: 'newField',
          },
        ],
      },
      {
        name: 'keepOtherFields',
        label: '保留其他字段',
        type: 'boolean',
        default: true,
      },
    ],
  },

  FUNCTION: {
    type: 'FUNCTION',
    label: '自定义脚本',
    icon: 'FunctionSquare',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'language',
        label: '脚本语言',
        type: 'select',
        default: 'javascript',
        options: [
          { label: 'JavaScript', value: 'javascript' },
        ],
      },
    ],
  },

  MERGE: {
    type: 'MERGE',
    label: '数据合并',
    icon: 'GitMerge',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    inputs: ['input1', 'input2'],
    outputs: ['output'],
    fields: [
      {
        name: 'mode',
        label: '合并模式',
        type: 'select',
        default: 'combine',
        options: [
          { label: '合并 (combine)', value: 'combine' },
          { label: '拼接 (concat)', value: 'concat' },
          { label: '拉链 (zip)', value: 'zip' },
          { label: '覆盖 (overwrite)', value: 'overwrite' },
        ],
      },
      {
        name: 'joinKey',
        label: '关联键',
        type: 'string',
        placeholder: 'id',
        description: '用于关联的字段名（可选）',
      },
    ],
  },

  JDBC: {
    type: 'JDBC',
    label: '数据库',
    icon: 'Database',
    color: '#f97316',
    bgColor: '#fff7ed',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'dataSource',
        label: '数据源',
        type: 'string',
        required: true,
        placeholder: 'myDataSource',
      },
      {
        name: 'query',
        label: 'SQL 语句',
        type: 'textarea',
        required: true,
        placeholder: 'INSERT INTO table (col1, col2) VALUES (:#val1, :#val2)',
        description: '参数使用 :#paramName 格式',
      },
    ],
  },

  SQL: {
    type: 'SQL',
    label: 'SQL 查询',
    icon: 'Table',
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'query',
        label: 'SQL 查询',
        type: 'textarea',
        required: true,
        placeholder: 'SELECT * FROM users WHERE id = :#id',
        description: '参数使用 :#paramName 格式',
      },
    ],
  },

  KAFKA: {
    type: 'KAFKA',
    label: 'Kafka',
    icon: 'MessageSquare',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'topic',
        label: 'Topic',
        type: 'string',
        required: true,
        placeholder: 'my-topic',
      },
      {
        name: 'brokers',
        label: '服务器地址',
        type: 'string',
        placeholder: 'localhost:9092',
      },
      {
        name: 'groupId',
        label: '消费者组 ID',
        type: 'string',
        placeholder: 'my-group',
      },
    ],
  },

  EXEC: {
    type: 'EXEC',
    label: '执行命令',
    icon: 'Play',
    color: '#ef4444',
    bgColor: '#fef2f2',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'executable',
        label: '可执行文件',
        type: 'string',
        required: true,
        placeholder: 'bash',
      },
      {
        name: 'args',
        label: '参数',
        type: 'code',
        placeholder: '["-c", "echo hello"]',
        description: 'JSON 数组格式',
      },
      {
        name: 'workingDir',
        label: '工作目录',
        type: 'string',
        placeholder: '/tmp',
      },
    ],
  },

  CSV: {
    type: 'CSV',
    label: 'CSV 处理',
    icon: 'FileSpreadsheet',
    color: '#84cc16',
    bgColor: '#f7fee7',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'useHeaders',
        label: '使用表头',
        type: 'boolean',
        default: true,
      },
      {
        name: 'delimiter',
        label: '分隔符',
        type: 'string',
        default: ',',
        placeholder: ',',
      },
      {
        name: 'quoteChar',
        label: '引号字符',
        type: 'string',
        default: '"',
        placeholder: '"',
      },
    ],
  },

  VALIDATOR: {
    type: 'VALIDATOR',
    label: '数据校验',
    icon: 'CheckSquare',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'schema',
        label: 'Schema 文件',
        type: 'string',
        placeholder: '/path/to/schema.json',
      },
      {
        name: 'schemaLanguage',
        label: 'Schema 语言',
        type: 'select',
        default: 'jsonSchema',
        options: [
          { label: 'JSON Schema', value: 'jsonSchema' },
        ],
      },
    ],
  },
};

// 获取组件配置
export function getComponentConfig(type: string): ComponentConfig | undefined {
  const upperType = type.toUpperCase();
  return COMPONENT_CONFIGS[upperType];
}
