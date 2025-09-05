/* eslint-disable @typescript-eslint/no-explicit-any */
// 为 Electron API 声明全局类型
export interface ElectronAPI {
  user: {
    create: (userData: {
      username: string
      email: string
      fullName?: string
      avatar?: string
      status?: 'active' | 'inactive' | 'pending'
    }) => Promise<{ success: boolean; data?: any; error?: string }>
    getById: (userId: number) => Promise<{ success: boolean; data?: any; error?: string }>
    getByEmail: (email: string) => Promise<{ success: boolean; data?: any; error?: string }>
    getByUsername: (username: string) => Promise<{ success: boolean; data?: any; error?: string }>
    getAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>
    update: (id: number, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>
    delete: (id: number) => Promise<{ success: boolean; error?: string }>
    search: (query: string) => Promise<{ success: boolean; data?: any[]; error?: string }>
  }
}

declare global {
  interface Window {
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
    electronAPI: ElectronAPI
  }
}
