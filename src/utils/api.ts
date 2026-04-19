const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 统一响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  detail: string | null;
  data: T;
}

// API 错误类
export class ApiError extends Error {
  code: number;
  detail: string | null;
  data: any;

  constructor(response: ApiResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.code = response.code;
    this.detail = response.detail;
    this.data = response.data;
  }
}

// 请求配置
interface RequestConfig extends RequestInit {
  requireAuth?: boolean;
}

// 获取 token
function getAccessToken(): string | null {
  return localStorage.getItem('auth_token');
}

// 统一请求函数
async function request<T>(
  url: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { requireAuth = true, headers: customHeaders, ...restConfig } = config;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // 添加认证头
  if (requireAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  try {
    const response = await fetch(fullUrl, {
      headers,
      ...restConfig,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    if (!result.success) {
      throw new ApiError(result);
    }

    return result;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 便捷方法
export const api = {
  get: <T>(url: string, config?: RequestConfig) =>
    request<T>(url, { method: 'GET', ...config }),

  post: <T>(url: string, data?: any, config?: RequestConfig) =>
    request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    }),

  put: <T>(url: string, data?: any, config?: RequestConfig) =>
    request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    }),

  delete: <T>(url: string, config?: RequestConfig) =>
    request<T>(url, { method: 'DELETE', ...config }),
};

export default api;
