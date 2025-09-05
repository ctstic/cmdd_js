/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextBridge, ipcRenderer } from 'electron'

console.log('Preload script is loading...')

/** 用户管理模块 */
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

/** 卷烟有害成分模块 */
export interface HarmfulAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  getById: (id: number) => Promise<APIResponse<any>>
  generate: () => Promise<APIResponse<void>>
}

/** 多因素卷烟模块 */
export interface CigarettesAPI {
  query: (query: string) => Promise<APIResponse<any>>
  delete: (id: number) => Promise<APIResponse<void>>
  getById: (id: number) => Promise<APIResponse<any>>
  create: (obj: Partial<any>) => Promise<APIResponse<any>>
}

// 定义 API 类型
export interface ElectronAPI {
  user: UserAPI
  harmful: HarmfulAPI
  cigarettes: CigarettesAPI
}

// API 响应类型
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

console.log('Defining electronAPI...')

/** 封装 IPC 调用 */
const createUserAPI = (): UserAPI => ({
  create: (userData) => ipcRenderer.invoke('user:create', userData),
  getById: (id) => ipcRenderer.invoke('user:get-by-id', id),
  getByEmail: (email) => ipcRenderer.invoke('user:get-by-email', email),
  getByUsername: (username) => ipcRenderer.invoke('user:get-by-username', username),
  getAll: () => ipcRenderer.invoke('user:get-all'),
  update: (id, updates) => ipcRenderer.invoke('user:update', id, updates),
  delete: (id) => ipcRenderer.invoke('user:delete', id),
  search: (query) => ipcRenderer.invoke('user:search', query)
})

const createHarmfulAPI = (): HarmfulAPI => ({
  query: (q) => ipcRenderer.invoke('harmful:query', q),
  delete: (id) => ipcRenderer.invoke('harmful:delete', id),
  getById: (id) => ipcRenderer.invoke('harmful:get-by-id', id),
  generate: () => ipcRenderer.invoke('harmful:generate')
})

const createCigarettesAPI = (): CigarettesAPI => ({
  query: (q) => ipcRenderer.invoke('cigarettes:query', q),
  delete: (id) => ipcRenderer.invoke('cigarettes:delete', id),
  getById: (id) => ipcRenderer.invoke('cigarettes:get-by-id', id),
  create: (obj) => ipcRenderer.invoke('cigarettes:create', obj)
})

// 暴露 API 到渲染进程
const electronAPI: ElectronAPI = {
  // 用户管理 API
  user: createUserAPI(),
  harmful: createHarmfulAPI(),
  cigarettes: createCigarettesAPI()
}

// 将 API 暴露给渲染进程
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  console.log('electronAPI exposed successfully')
} catch (error) {
  console.error('Failed to expose electronAPI:', error)
}

// 也暴露基础的 electron 对象（兼容现有代码）
try {
  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => {
        console.log('IPC send:', channel, args)
        ipcRenderer.send(channel, ...args)
      },
      invoke: (channel: string, ...args: any[]) => {
        console.log('IPC invoke:', channel, args)
        return ipcRenderer.invoke(channel, ...args)
      },
      on: (channel: string, func: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (_, ...args) => func(...args))
      },
      once: (channel: string, func: (...args: any[]) => void) => {
        ipcRenderer.once(channel, (_, ...args) => func(...args))
      }
    },
    process: {
      versions: process.versions
    }
  })
  console.log('electron object exposed successfully')
} catch (error) {
  console.error('Failed to expose electron object:', error)
}

console.log('Preload script completed')

// 为 TypeScript 声明全局类型
declare global {
  interface Window {
    electronAPI: ElectronAPI
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void
        invoke: (channel: string, ...args: any[]) => Promise<any>
        on: (channel: string, func: (...args: any[]) => void) => void
        once: (channel: string, func: (...args: any[]) => void) => void
      }
      process: {
        versions: NodeJS.ProcessVersions
      }
    }
  }
}
