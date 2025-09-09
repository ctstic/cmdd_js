/**
 * @file types.ts
 * @description 定义 preload 层和渲染进程共享的类型接口。
 *              所有 API 的入参/出参类型都在这里集中管理，避免散落在多个文件。
 *              这样既能让 TS 检查类型一致性，也能方便主进程/渲染端/预加载层协同开发。
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** 通用的 API 响应格式 */
export interface APIResponse<T> {
  success: boolean // 是否成功
  data?: T // 返回的数据
  error?: string // 错误信息（如果有）
}

/** 用户管理模块 API 定义 */
export interface UserAPI {
  create: (userData: {
    username: string
    email: string
    fullName?: string
    avatar?: string
    status?: 'active' | 'inactive' | 'pending'
  }) => Promise<APIResponse<any>>
  getById: (userId: number) => Promise<APIResponse<any>>
  getByEmail: (email: string) => Promise<APIResponse<any>>
  getByUsername: (username: string) => Promise<APIResponse<any>>
  getAll: () => Promise<APIResponse<any[]>>
  update: (id: number, updates: Partial<any>) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  search: (query: string) => Promise<APIResponse<any[]>>
}

/** 卷烟有害成分模块 API 定义 */
export interface HarmfulAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  getById: (id: number) => Promise<APIResponse<any>>
  generate: () => Promise<APIResponse<void>>
}

/** 多因素卷烟模块 API 定义 */
export interface CigarettesAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  getById: (id: number) => Promise<APIResponse<any>>
  create: (obj: Partial<any>) => Promise<APIResponse<any>>
}

/**
 * preload 层最终暴露到 window 上的总对象接口。
 * 渲染进程只需要通过 window.electronAPI 来访问这些方法。
 */
export interface ExposedElectronAPI {
  user: UserAPI
  harmful: HarmfulAPI
  cigarettes: CigarettesAPI
  process: { versions: NodeJS.ProcessVersions } // Node.js 版本信息，可用于调试
}
