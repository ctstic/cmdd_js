// // API请求封装
// // Stream相关类型定义
// interface SSEOutput {
//   [key: string]: any;
// }

// interface XReadableStream<R = SSEOutput> extends ReadableStream<R> {
//   [Symbol.asyncIterator]?: () => AsyncGenerator<R>;
// }

/**
 * 请求配置接口
 */
export interface RequestConfig extends RequestInit {
  /** 是否需要token认证 */
  needToken?: boolean;
  /** GET请求参数 */
  params?: Record<string, unknown>;
  /** POST/PUT请求数据 */
  data?: Record<string, unknown>;
  /** 基础URL */
  baseURL?: string;
  /** 超时时间(毫秒) */
  timeout?: number;
}

/**
 * 响应结果接口
 */
export interface ResponseResult<T = unknown> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

/**
 * API错误类
 */
export class ApiError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }
}

/**
 * 默认请求配置
 */
const defaultConfig: RequestConfig = {
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000,
  needToken: true,
};

/**
 * 获取认证token
 * @returns token字符串
 */
const getToken = (): string => {
  return localStorage.getItem('token') || '';
};

/**
 * 构建请求头
 * @param config 请求配置
 * @returns Headers对象
 */
const buildHeaders = (config: RequestConfig): Headers => {
  const headers = new Headers(config.headers);

  // 添加token认证
  if (config.needToken) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
};

/**
 * 构建请求URL
 * @param url 原始URL
 * @param config 请求配置
 * @returns 完整URL
 */
const buildUrl = (url: string, config: RequestConfig): string => {
  const baseUrl = config.baseURL || '';
  const fullUrl = baseUrl + url;

  // 处理GET请求参数
  if (config.params && Object.keys(config.params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return `${fullUrl}?${searchParams.toString()}`;
  }

  return fullUrl;
};

/**
 * 处理请求错误
 * @param error 捕获的错误
 */
const handleRequestError = (error: unknown): never => {
  // 处理请求超时
  if (error instanceof Error && error.name === 'AbortError') {
    throw new ApiError('请求超时', -1);
  }

  // 重新抛出已处理的API错误
  if (error instanceof ApiError) {
    throw error;
  }

  // 处理其他错误
  const errorMessage = error instanceof Error ? error.message : '请求发生错误';
  throw new ApiError(errorMessage, -1);
};

/**
 * 清除认证token
 */
const clearToken = (): void => {
  localStorage.removeItem('token');
};

/**
 * 处理响应错误
 * @param response fetch响应对象
 */
const handleResponseError = async (response: Response): Promise<never> => {
  // 处理401认证错误，清除token并跳转到登录页面
  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new ApiError('认证失败，请重新登录', 401);
  }

  let errorData;
  try {
    // 尝试解析错误响应
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  throw new ApiError(
    errorData.message || `请求失败: ${response.status}`,
    response.status,
    errorData
  );
};

/**
 * 创建请求
 * @param url 请求地址
 * @param config 请求配置
 * @returns Promise
 */
export async function request<T = unknown>(url: string, config: RequestConfig = {}): Promise<T> {
  // 合并配置
  const finalConfig: RequestConfig = { ...defaultConfig, ...config };
  const { timeout, data, ...restConfig } = finalConfig;

  // 构建请求URL和请求头
  const finalUrl = buildUrl(url, finalConfig);
  const headers = buildHeaders(finalConfig);

  // 处理请求体
  let body = restConfig.body;
  if (data && Object.keys(data).length > 0) {
    body = JSON.stringify(data);
  }

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 发起请求
    const response = await fetch(finalUrl, {
      ...restConfig,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 处理HTTP状态错误
    if (!response.ok) {
      await handleResponseError(response);
    }

    // 如果响应为空，直接返回
    if (response.status === 204) {
      return {} as T;
    }

    // 解析JSON响应
    const responseData = await response.json();

    // 处理业务逻辑错误
    if (responseData.code !== undefined && responseData.code !== 0 && responseData.code !== 200) {
      throw new ApiError(responseData.message || '请求失败', responseData.code, responseData);
    }

    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);
    return handleRequestError(error);
  }
}

// /**
//  * 流式请求
//  * @param url 请求地址
//  * @param config 请求配置
//  * @returns Stream
//  */
// export async function streamRequest(
//   url: string,
//   config: RequestConfig = {}
// ): Promise<XReadableStream<SSEOutput>> {
//   // 合并配置
//   const finalConfig: RequestConfig = { ...defaultConfig, ...config, method: 'POST' };
//   const { timeout, data, baseURL, ...restConfig } = finalConfig;

//   // 构建完整URL
//   const fullUrl = (baseURL || '') + url;

//   // 构建headers
//   const headers = buildHeaders(finalConfig);
//   headers.set('Accept', 'text/event-stream');

//   // 处理请求体
//   const body = data ? JSON.stringify(data) : restConfig.body;

//   // 创建AbortController用于超时控制
//   const controller = new AbortController();
//   const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

//   try {
//     // 发起请求
//     const response = await fetch(fullUrl, {
//       ...restConfig,
//       method: 'POST',
//       headers,
//       body,
//       signal: controller.signal,
//     });

//     // 处理HTTP状态错误
//     if (!response.ok) {
//       await handleResponseError(response);
//     }

//     // 检查响应体是否可用
//     if (!response.body) {
//       throw new ApiError('流式响应体不可用', -1);
//     }

//     // 使用Stream处理流式响应
//     const streamInstance = Stream({
//       readableStream: response.body,
//     });

//     return streamInstance;
//   } catch (error) {
//     // 清除超时
//     if (timeoutId !== null) {
//       clearTimeout(timeoutId);
//     }

//     return handleRequestError(error);
//   }
// }

/**
 * HTTP请求工具
 */
export const http = {
  /**
   * GET请求
   * @param url 请求地址
   * @param params 查询参数
   * @param config 其他配置
   */
  get: <T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'params'>
  ) => request<T>(url, { ...config, method: 'GET', params }),

  /**
   * POST请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 其他配置
   */
  post: <T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'data'>
  ) => request<T>(url, { ...config, method: 'POST', data }),

  /**
   * PUT请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 其他配置
   */
  put: <T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'data'>
  ) => request<T>(url, { ...config, method: 'PUT', data }),

  /**
   * DELETE请求
   * @param url 请求地址
   * @param params 请求参数
   * @param config 其他配置
   */
  delete: <T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'params'>
  ) => request<T>(url, { ...config, method: 'DELETE', params }),

  /**
   * PATCH请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 其他配置
   */
  patch: <T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'data'>
  ) => request<T>(url, { ...config, method: 'PATCH', data }),

  /**
   * 流式请求(POST)
   * @param url 请求地址
   * @param data 请求数据
   * @param config 其他配置
   */
  stream: async (
    url: string,
    data?: Record<string, unknown>,
    config?: Omit<RequestConfig, 'data'>
  ) => await streamRequest(url, { ...config, data }),
};

export default { http, request };
