/**
 * @file types.ts
 * @description 定义 preload 层和渲染进程共享的类型接口。
 */

/** 通用的 API 响应格式 */
export interface APIResponse<T> {
  success: boolean // 是否成功
  data?: T // 返回的数据
  error?: string // 错误信息（如果有）
}

export interface HarmfulAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
}

/** 多因素卷烟模块 API 定义 */
export interface CigarettesAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  generate: () => Promise<APIResponse<void>>
}

/**
 * preload 层最终暴露到 window 上的总对象接口。
 * 渲染进程只需要通过 window.electronAPI 来访问这些方法。
 */
export interface ExposedElectronAPI {
  harmful: HarmfulAPI
  cigarettes: CigarettesAPI
  process: { versions: NodeJS.ProcessVersions } // Node.js 版本信息，可用于调试
}
