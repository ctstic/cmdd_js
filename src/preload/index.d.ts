/* eslint-disable @typescript-eslint/no-explicit-any */
import { ElectronAPI } from '@electron-toolkit/preload'

// API 响应类型
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 用户管理
interface UserAPI {
  create: (userData: { username: string; email: string }) => Promise<APIResponse<any>>
  getById: (userId: number) => Promise<APIResponse<any>>
  getAll: () => Promise<APIResponse<any>>
  search: (query: string) => Promise<APIResponse<any>>
  update: (id: number, updates: Partial<any>) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  getByEmail: (email: string) => Promise<APIResponse<any>>
  getByUsername: (username: string) => Promise<APIResponse<any>>
}

// 卷烟有害成分
interface HarmfulAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  getById: (id: number) => Promise<APIResponse<any>>
  create: (obj: Partial<any>) => Promise<APIResponse<any>>
  generate: () => Promise<APIResponse<void>>
}

// 多因素卷烟
interface CigarettesAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  getById: (id: number) => Promise<APIResponse<any>>
  create: (obj: Partial<any>) => Promise<APIResponse<any>>
}

// 自定义 ElectronAPI 接口
interface CustomElectronAPI {
  // 用户管理
  user: UserAPI
  // 卷烟有害成分
  harmful: HarmfulAPI
  // 多因素卷烟
  cigarettes: CigarettesAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: CustomElectronAPI
  }
}
