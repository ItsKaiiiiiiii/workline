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

// 驼峰转下划线大写（fileRead -> FILE_READ）
function camelToSnakeUpper(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toUpperCase();
}

// 组件配置定义
const COMPONENT_CONFIGS_BASE: Record<string, ComponentConfig> = {
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

  FILE_LISTENER: {
    type: 'FILE_LISTENER',
    label: '文件监听',
    icon: 'File',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'directory',
        label: '目录',
        type: 'string',
        default: 'data',
        placeholder: 'data',
        description: '目录路径',
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

  FILE_WRITER: {
    type: 'FILE_WRITER',
    label: '文件写入',
    icon: 'FileText',
    color: '#1d4ed8',
    bgColor: '#eff6ff',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'directory',
        label: '目录',
        type: 'string',
        default: 'data',
        placeholder: 'data',
        description: '目录路径',
      },
      {
        name: 'fileName',
        label: '文件名',
        type: 'string',
        placeholder: 'result-${date:now:yyyyMMdd-HHmmss}.json',
        description: '文件名（支持表达式）',
      },
      {
        name: 'fileExist',
        label: '文件存在策略',
        type: 'select',
        default: 'Override',
        options: [
          { label: '覆盖 (Override)', value: 'Override' },
          { label: '追加 (Append)', value: 'Append' },
          { label: '抛出异常 (Fail)', value: 'Fail' },
          { label: '忽略 (Ignore)', value: 'Ignore' },
          { label: '移动旧文件 (Move)', value: 'Move' },
        ],
        description: '文件存在时的策略',
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

  FTP_LISTENER: {
    type: 'FTP_LISTENER',
    label: 'FTP/SFTP 监听',
    icon: 'Download',
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
        placeholder: '21 (FTP) / 22 (SFTP)',
        description: 'FTP:21, SFTP:22',
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
        default: '/',
        placeholder: '/',
      },
      {
        name: 'include',
        label: '包含文件（正则）',
        type: 'string',
        placeholder: '.*\\.xml$',
        description: '文件名正则（包含）',
      },
      {
        name: 'exclude',
        label: '排除文件（正则）',
        type: 'string',
        placeholder: '.*\\.tmp$',
        description: '文件名正则（排除）',
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
        name: 'delete',
        label: '下载后删除',
        type: 'boolean',
        default: false,
        description: '下载后是否删除远程文件',
      },
      {
        name: 'binary',
        label: '二进制模式',
        type: 'boolean',
        default: true,
        description: '是否二进制模式',
      },
      {
        name: 'passiveMode',
        label: '被动模式',
        type: 'boolean',
        default: true,
        description: 'FTP 被动模式',
      },
      {
        name: 'secure',
        label: '使用 SFTP',
        type: 'boolean',
        default: false,
        description: '是否使用 SFTP',
      },
      {
        name: 'sftp',
        label: '使用 SFTP（兼容）',
        type: 'boolean',
        default: false,
        description: '是否使用 SFTP（兼容）',
      },
    ],
  },

  FTP_UPLOAD: {
    type: 'FTP_UPLOAD',
    label: 'FTP/SFTP 上传',
    icon: 'Upload',
    color: '#6d28d9',
    bgColor: '#f5f3ff',
    inputs: ['input'],
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
        placeholder: '21 (FTP) / 22 (SFTP)',
        description: 'FTP:21, SFTP:22',
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
        default: '/',
        placeholder: '/',
      },
      {
        name: 'fileName',
        label: '远程文件名',
        type: 'string',
        placeholder: 'data.json',
        description: '远程文件名',
      },
      {
        name: 'fileExist',
        label: '文件存在策略',
        type: 'select',
        default: 'Override',
        options: [
          { label: '覆盖 (Override)', value: 'Override' },
          { label: '追加 (Append)', value: 'Append' },
          { label: '抛出异常 (Fail)', value: 'Fail' },
          { label: '忽略 (Ignore)', value: 'Ignore' },
          { label: '移动旧文件 (Move)', value: 'Move' },
        ],
        description: '文件存在时的策略',
      },
      {
        name: 'binary',
        label: '二进制模式',
        type: 'boolean',
        default: true,
        description: '是否二进制模式',
      },
      {
        name: 'passiveMode',
        label: '被动模式',
        type: 'boolean',
        default: true,
        description: 'FTP 被动模式',
      },
      {
        name: 'secure',
        label: '使用 SFTP',
        type: 'boolean',
        default: false,
        description: '是否使用 SFTP',
      },
      {
        name: 'sftp',
        label: '使用 SFTP（兼容）',
        type: 'boolean',
        default: false,
        description: '是否使用 SFTP（兼容）',
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
        description: '请求 URL（包含 http/https）',
      },
      {
        name: 'method',
        label: 'HTTP 方法',
        type: 'select',
        default: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'PATCH', value: 'PATCH' },
        ],
      },
      {
        name: 'connectTimeout',
        label: '连接超时（毫秒）',
        type: 'number',
        default: 5000,
        placeholder: '5000',
      },
      {
        name: 'socketTimeout',
        label: '读取超时（毫秒）',
        type: 'number',
        default: 30000,
        placeholder: '30000',
      },
      {
        name: 'bridgeEndpoint',
        label: '桥接模式',
        type: 'boolean',
        default: true,
        description: '桥接模式（保留 header）',
      },
      {
        name: 'throwExceptionOnFailure',
        label: '错误时抛异常',
        type: 'boolean',
        default: true,
        description: 'HTTP 错误时抛出异常',
      },
    ],
  },

  EMAIL: {
    type: 'EMAIL',
    label: '邮件发送',
    icon: 'Mail',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'host',
        label: 'SMTP 服务器地址',
        type: 'string',
        required: true,
        placeholder: 'smtp.example.com',
      },
      {
        name: 'port',
        label: '端口',
        type: 'number',
        default: 25,
        placeholder: '25 (SMTP) / 465 (SMTPS)',
        description: 'SMTP:25, SMTPS:465',
      },
      {
        name: 'username',
        label: '用户名',
        type: 'string',
        placeholder: 'user@example.com',
      },
      {
        name: 'password',
        label: '密码',
        type: 'string',
        placeholder: 'password',
      },
      {
        name: 'from',
        label: '发件人',
        type: 'string',
        placeholder: 'noreply@example.com',
      },
      {
        name: 'to',
        label: '收件人',
        type: 'string',
        placeholder: 'user@example.com',
        description: '多个用逗号分隔',
      },
      {
        name: 'cc',
        label: '抄送人',
        type: 'string',
        placeholder: 'manager@example.com',
      },
      {
        name: 'bcc',
        label: '密送人',
        type: 'string',
        placeholder: 'hidden@example.com',
      },
      {
        name: 'subject',
        label: '邮件主题',
        type: 'string',
        placeholder: '工作流执行完成',
      },
      {
        name: 'contentType',
        label: '内容类型',
        type: 'select',
        default: 'text/plain',
        options: [
          { label: 'text/plain', value: 'text/plain' },
          { label: 'text/html', value: 'text/html' },
        ],
      },
      {
        name: 'charset',
        label: '编码',
        type: 'string',
        default: 'UTF-8',
        placeholder: 'UTF-8',
      },
      {
        name: 'ssl',
        label: '使用 SSL (SMTPS)',
        type: 'boolean',
        default: false,
      },
      {
        name: 'starttls',
        label: '使用 STARTTLS',
        type: 'boolean',
        default: false,
      },
      {
        name: 'connectionTimeout',
        label: '连接超时（毫秒）',
        type: 'number',
        default: 30000,
        placeholder: '30000',
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
    label: '数据库操作',
    icon: 'Database',
    color: '#f97316',
    bgColor: '#fff7ed',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'configId',
        label: '数据源',
        type: 'string',
        required: true,
        placeholder: '选择数据源',
        description: '从已配置的数据源中选择',
      },
      {
        name: 'query',
        label: 'SQL 语句',
        type: 'textarea',
        required: true,
        placeholder: 'INSERT INTO orders (id, amount, status) VALUES (?, ?, ?)',
        description: '执行数据库操作（INSERT/UPDATE/DELETE）',
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
        name: 'configId',
        label: '数据源',
        type: 'string',
        required: true,
        placeholder: '选择数据源',
        description: '从已配置的数据源中选择',
      },
      {
        name: 'query',
        label: 'SELECT 查询语句',
        type: 'textarea',
        required: true,
        placeholder: 'SELECT * FROM users WHERE created_at > ?',
        description: '执行 SQL 查询并返回结果',
      },
      {
        name: 'outputType',
        label: '输出类型',
        type: 'select',
        default: 'SelectList',
        options: [
          { label: 'SelectList', value: 'SelectList' },
        ],
      },
      {
        name: 'batch',
        label: '批量处理',
        type: 'boolean',
        default: false,
      },
    ],
  },

  KAFKA_CONSUMER: {
    type: 'KAFKA_CONSUMER',
    label: 'Kafka 消费者',
    icon: 'MessageSquare',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'brokers',
        label: 'Kafka 服务器地址',
        type: 'string',
        required: true,
        placeholder: 'kafka1:9092,kafka2:9092',
        description: 'Kafka 服务器地址，逗号分隔',
      },
      {
        name: 'topic',
        label: '主题名称',
        type: 'string',
        required: true,
        placeholder: 'orders',
      },
      {
        name: 'groupId',
        label: '消费者组 ID',
        type: 'string',
        placeholder: 'connectx-group',
      },
      {
        name: 'offset',
        label: '起始偏移',
        type: 'select',
        default: 'latest',
        options: [
          { label: 'earliest', value: 'earliest' },
          { label: 'latest', value: 'latest' },
        ],
        description: '起始偏移：earliest/latest',
      },
      {
        name: 'autoCommit',
        label: '自动提交偏移',
        type: 'boolean',
        default: true,
      },
      {
        name: 'concurrentConsumers',
        label: '并发消费者数量',
        type: 'number',
        default: 1,
        placeholder: '1',
      },
    ],
  },

  KAFKA_PRODUCER: {
    type: 'KAFKA_PRODUCER',
    label: 'Kafka 生产者',
    icon: 'Send',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'brokers',
        label: 'Kafka 服务器地址',
        type: 'string',
        required: true,
        placeholder: 'kafka1:9092,kafka2:9092',
        description: 'Kafka 服务器地址，逗号分隔',
      },
      {
        name: 'topic',
        label: '主题名称',
        type: 'string',
        required: true,
        placeholder: 'orders',
      },
      {
        name: 'key',
        label: '消息 Key',
        type: 'string',
        placeholder: '${header.id}',
        description: '消息 Key（支持表达式）',
      },
      {
        name: 'partitionKey',
        label: '分区 Key',
        type: 'string',
        placeholder: '${body.partition}',
        description: '分区 Key（支持表达式）',
      },
    ],
  },

  EXEC: {
    type: 'EXEC',
    label: '本地命令执行',
    icon: 'Play',
    color: '#ef4444',
    bgColor: '#fef2f2',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'command',
        label: '可执行文件路径',
        type: 'string',
        required: true,
        placeholder: '/path/to/script.sh',
      },
      {
        name: 'args',
        label: '命令参数',
        type: 'string',
        placeholder: '-v -f input.txt',
      },
      {
        name: 'workingDir',
        label: '工作目录',
        type: 'string',
        placeholder: '/tmp',
      },
      {
        name: 'timeout',
        label: '超时时间（毫秒）',
        type: 'number',
        default: 60000,
        placeholder: '60000',
      },
      {
        name: 'useStderrOnEmptyStdout',
        label: 'stdout 为空时使用 stderr',
        type: 'boolean',
        default: false,
      },
    ],
  },

  CSV: {
    type: 'CSV',
    label: 'CSV 文件监听',
    icon: 'FileSpreadsheet',
    color: '#84cc16',
    bgColor: '#f7fee7',
    inputs: [],
    outputs: ['output'],
    fields: [
      {
        name: 'directory',
        label: '监听目录',
        type: 'string',
        default: 'data',
        placeholder: 'data',
      },
      {
        name: 'include',
        label: '文件名匹配',
        type: 'string',
        default: '.*\\.csv$',
        placeholder: '.*\\.csv$',
      },
      {
        name: 'delimiter',
        label: '列分隔符',
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
      {
        name: 'escapeChar',
        label: '转义字符',
        type: 'string',
        default: '\\',
        placeholder: '\\',
      },
      {
        name: 'headerPresent',
        label: '第一行为表头',
        type: 'boolean',
        default: true,
      },
      {
        name: 'skipHeader',
        label: '跳过表头',
        type: 'boolean',
        default: true,
      },
      {
        name: 'charset',
        label: '文件编码',
        type: 'string',
        default: 'UTF-8',
        placeholder: 'UTF-8',
      },
      {
        name: 'delete',
        label: '处理后删除',
        type: 'boolean',
        default: false,
        description: '处理后删除文件',
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

  IF: {
    type: 'IF',
    label: '条件分支',
    icon: 'GitBranch',
    color: '#f97316',
    bgColor: '#fff7ed',
    inputs: ['input'],
    outputs: ['output'],
    fields: [
      {
        name: 'value1',
        label: '比较值 1',
        type: 'string',
        required: true,
        placeholder: '${body.status}',
        description: '比较的第一个值（支持表达式）',
      },
      {
        name: 'operator',
        label: '比较操作符',
        type: 'select',
        default: 'equals',
        options: [
          { label: 'equals / equal (相等)', value: 'equals' },
          { label: 'notEquals / notEqual (不相等)', value: 'notEquals' },
          { label: 'contains (包含)', value: 'contains' },
          { label: 'notContains (不包含)', value: 'notContains' },
          { label: 'greaterThan / gt (大于)', value: 'greaterThan' },
          { label: 'lessThan / lt (小于)', value: 'lessThan' },
          { label: 'greaterThanOrEqual / gte (大于等于)', value: 'greaterThanOrEqual' },
          { label: 'lessThanOrEqual / lte (小于等于)', value: 'lessThanOrEqual' },
          { label: 'isEmpty / empty (为空)', value: 'isEmpty' },
          { label: 'isNotEmpty / notEmpty (不为空)', value: 'isNotEmpty' },
        ],
        description: '比较操作符',
      },
      {
        name: 'value2',
        label: '比较值 2',
        type: 'string',
        placeholder: 'active',
        description: '比较的第二个值（支持表达式）',
      },
    ],
  },
};

// 创建完整的组件配置对象，同时支持两种命名方式
export const COMPONENT_CONFIGS: Record<string, ComponentConfig> = {
  ...COMPONENT_CONFIGS_BASE,
  FILE_READ: { ...COMPONENT_CONFIGS_BASE.FILE_LISTENER, type: 'FILE_READ', label: '文件读取' },
  FILE_WRITE: { ...COMPONENT_CONFIGS_BASE.FILE_WRITER, type: 'FILE_WRITE', label: '文件写入' },
  FTP_READ: { ...COMPONENT_CONFIGS_BASE.FTP_LISTENER, type: 'FTP_READ', label: 'FTP 读取' },
  FTP_WRITE: { ...COMPONENT_CONFIGS_BASE.FTP_UPLOAD, type: 'FTP_WRITE', label: 'FTP 写入' },
  KAFKA_CONSUME: { ...COMPONENT_CONFIGS_BASE.KAFKA_CONSUMER, type: 'KAFKA_CONSUME', label: 'Kafka 消费者' },
  KAFKA_PRODUCE: { ...COMPONENT_CONFIGS_BASE.KAFKA_PRODUCER, type: 'KAFKA_PRODUCE', label: 'Kafka 生产者' },
  KAFKA_WRITE: { ...COMPONENT_CONFIGS_BASE.KAFKA_PRODUCER, type: 'KAFKA_WRITE', label: 'Kafka 生产者' },
  CSV_READ: { ...COMPONENT_CONFIGS_BASE.CSV, type: 'CSV_READ', label: 'CSV 读取' },
  CSV_WRITE: { ...COMPONENT_CONFIGS_BASE.CSV, type: 'CSV_WRITE', label: 'CSV 写入' },
};

// 获取组件配置
export function getComponentConfig(type: string): ComponentConfig | undefined {
  const upperType = type.toUpperCase();
  const snakeType = camelToSnakeUpper(type);

  const config = COMPONENT_CONFIGS[upperType] || COMPONENT_CONFIGS[snakeType] || COMPONENT_CONFIGS[type];
  console.log('getComponentConfig:', { type, upperType, snakeType, configExists: !!config });
  return config;
}
