import type { DatasourceLibraryConfig } from '../types/datasource';
import type { DbType } from '../types/api';

export const DATASOURCE_LIBRARY: DatasourceLibraryConfig[] = [
  {
    dbType: 'MYSQL',
    label: 'MySQL',
    icon: 'Database',
    color: '#4479A1',
    defaultJdbcUrl: 'jdbc:mysql://localhost:3306/',
    defaultConfig: {
      host: 'localhost',
      port: 3306,
      database: '',
      username: '',
      password: '',
      useSSL: false,
      serverTimezone: 'Asia/Shanghai',
    },
    configFields: [
      { name: 'host', label: '主机地址', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: '端口', type: 'number', required: true, defaultValue: 3306 },
      { name: 'database', label: '数据库名', type: 'text', required: true, placeholder: 'mydb' },
      { name: 'username', label: '用户名', type: 'text', required: true },
      { name: 'password', label: '密码', type: 'password' },
      { name: 'useSSL', label: '使用SSL', type: 'checkbox' },
      { name: 'serverTimezone', label: '时区', type: 'text', defaultValue: 'Asia/Shanghai' },
    ],
    buildJdbcUrl: (config: Record<string, any>) => {
      const host = config.host || 'localhost';
      const port = config.port || 3306;
      const database = config.database || '';
      const params: string[] = [];
      if (config.useSSL) params.push('useSSL=true');
      if (config.serverTimezone) params.push(`serverTimezone=${encodeURIComponent(config.serverTimezone)}`);
      const paramStr = params.length > 0 ? `?${params.join('&')}` : '';
      return `jdbc:mysql://${host}:${port}/${database}${paramStr}`;
    },
  },
  {
    dbType: 'POSTGRESQL',
    label: 'PostgreSQL',
    icon: 'Database',
    color: '#336791',
    defaultJdbcUrl: 'jdbc:postgresql://localhost:5432/',
    defaultConfig: {
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    },
    configFields: [
      { name: 'host', label: '主机地址', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: '端口', type: 'number', required: true, defaultValue: 5432 },
      { name: 'database', label: '数据库名', type: 'text', required: true, placeholder: 'mydb' },
      { name: 'username', label: '用户名', type: 'text', required: true },
      { name: 'password', label: '密码', type: 'password', required: true },
      { name: 'ssl', label: '启用SSL', type: 'checkbox' },
    ],
    buildJdbcUrl: (config: Record<string, any>) => {
      const host = config.host || 'localhost';
      const port = config.port || 5432;
      const database = config.database || '';
      const params: string[] = [];
      if (config.ssl) params.push('ssl=true');
      const paramStr = params.length > 0 ? `?${params.join('&')}` : '';
      return `jdbc:postgresql://${host}:${port}/${database}${paramStr}`;
    },
  },
  {
    dbType: 'ORACLE',
    label: 'Oracle',
    icon: 'Database',
    color: '#F80000',
    defaultJdbcUrl: 'jdbc:oracle:thin:@localhost:1521:',
    defaultConfig: {
      host: 'localhost',
      port: 1521,
      serviceName: '',
      username: '',
      password: '',
    },
    configFields: [
      { name: 'host', label: '主机地址', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: '端口', type: 'number', required: true, defaultValue: 1521 },
      { name: 'serviceName', label: '服务名/SID', type: 'text', required: true },
      { name: 'username', label: '用户名', type: 'text', required: true },
      { name: 'password', label: '密码', type: 'password', required: true },
    ],
    buildJdbcUrl: (config: Record<string, any>) => {
      const host = config.host || 'localhost';
      const port = config.port || 1521;
      const serviceName = config.serviceName || '';
      return `jdbc:oracle:thin:@${host}:${port}:${serviceName}`;
    },
  },
  {
    dbType: 'SQLSERVER',
    label: 'SQL Server',
    icon: 'Database',
    color: '#CC2927',
    defaultJdbcUrl: 'jdbc:sqlserver://localhost:1433;',
    defaultConfig: {
      host: 'localhost',
      port: 1433,
      database: '',
      username: '',
      password: '',
      encrypt: false,
      trustServerCertificate: true,
    },
    configFields: [
      { name: 'host', label: '服务器地址', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: '端口', type: 'number', required: true, defaultValue: 1433 },
      { name: 'database', label: '数据库名', type: 'text', required: true },
      { name: 'username', label: '用户名', type: 'text', required: true },
      { name: 'password', label: '密码', type: 'password', required: true },
      { name: 'encrypt', label: '启用加密', type: 'checkbox' },
      { name: 'trustServerCertificate', label: '信任服务器证书', type: 'checkbox', defaultValue: true },
    ],
    buildJdbcUrl: (config: Record<string, any>) => {
      const host = config.host || 'localhost';
      const port = config.port || 1433;
      const database = config.database || '';
      const params: string[] = [];
      if (database) params.push(`databaseName=${database}`);
      if (config.encrypt) params.push('encrypt=true');
      if (config.trustServerCertificate) params.push('trustServerCertificate=true');
      const paramStr = params.length > 0 ? `;${params.join(';')}` : '';
      return `jdbc:sqlserver://${host}:${port}${paramStr}`;
    },
  },
  {
    dbType: 'H2',
    label: 'H2',
    icon: 'Database',
    color: '#0000BB',
    defaultJdbcUrl: 'jdbc:h2:mem:testdb',
    defaultConfig: {
      mode: 'memory',
      database: 'testdb',
      file: '',
      username: 'sa',
      password: '',
    },
    configFields: [
      {
        name: 'mode',
        label: '运行模式',
        type: 'select',
        required: true,
        defaultValue: 'memory',
        options: [
          { label: '内存模式 (Memory)', value: 'memory' },
          { label: '文件模式 (File)', value: 'file' },
        ],
      },
      { name: 'database', label: '数据库名', type: 'text', required: true, placeholder: 'testdb' },
      { name: 'file', label: '文件路径 (文件模式)', type: 'text', placeholder: './data/testdb' },
      { name: 'username', label: '用户名', type: 'text', defaultValue: 'sa' },
      { name: 'password', label: '密码', type: 'password' },
    ],
    buildJdbcUrl: (config: Record<string, any>) => {
      const mode = config.mode || 'memory';
      const database = config.database || 'testdb';
      if (mode === 'file') {
        const file = config.file || `./data/${database}`;
        return `jdbc:h2:file:${file}`;
      }
      return `jdbc:h2:mem:${database}`;
    },
  },
  {
    dbType: 'DB2',
    label: 'DB2',
    icon: 'Database',
    color: '#052FAD',
    defaultJdbcUrl: 'jdbc:db2://localhost:50000/',
    defaultConfig: {
      host: 'localhost',
      port: 50000,
      database: '',
      username: '',
      password: '',
    },
    configFields: [
      { name: 'host', label: '主机地址', type: 'text', required: true, placeholder: 'localhost' },
      { name: 'port', label: '端口', type: 'number', required: true, defaultValue: 50000 },
      { name: 'database', label: '数据库名', type: 'text', required: true, placeholder: 'sample' },
      { name: 'username', label: '用户名', type: 'text', required: true },
      { name: 'password', label: '密码', type: 'password', required: true },
    ],
    buildJdbcUrl: (config: Record<string, any>) => {
      const host = config.host || 'localhost';
      const port = config.port || 50000;
      const database = config.database || '';
      return `jdbc:db2://${host}:${port}/${database}`;
    },
  },
];
