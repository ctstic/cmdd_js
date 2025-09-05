/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 定义用户管理 API
const userAPI = {
  create: (userData: Record<string, unknown>) => ipcRenderer.invoke('user:create', userData),
  getById: (userId: number) => ipcRenderer.invoke('user:get-by-id', userId),
  getByEmail: (email: string) => ipcRenderer.invoke('user:get-by-email', email),
  getByUsername: (username: string) => ipcRenderer.invoke('user:get-by-username', username),
  getAll: () => ipcRenderer.invoke('user:get-all'),
  update: (id: number, updates: Record<string, unknown>) =>
    ipcRenderer.invoke('user:update', id, updates),
  delete: (id: number) => ipcRenderer.invoke('user:delete', id),
  search: (query: string) => ipcRenderer.invoke('user:search', query)
}

const harmfulAPI = {
  query: (q) => ipcRenderer.invoke('harmful:query', q),
  delete: (id) => ipcRenderer.invoke('harmful:delete', id),
  getById: (id) => ipcRenderer.invoke('harmful:get-by-id', id),
  generate: () => ipcRenderer.invoke('harmful:generate')
}

// 多因素卷烟模块
const cigarettesAPI = {
  query: (q) => ipcRenderer.invoke('cigarettes:query', q),
  delete: (id) => ipcRenderer.invoke('cigarettes:delete', id),
  getById: (id) => ipcRenderer.invoke('cigarettes:get-by-id', id),
  create: (obj) => ipcRenderer.invoke('cigarettes:create', obj)
}

// 扩展 electronAPI 以包含 process 对象
const extendedElectronAPI = {
  ...electronAPI,
  process: {
    versions: process.versions
  },
  user: userAPI,
  harmful: harmfulAPI,
  cigarettes: cigarettesAPI
}

// 暴露 API 到渲染进程
if (process.contextIsolated) {
  try {
    // 确保API正确暴露
    contextBridge.exposeInMainWorld('electron', extendedElectronAPI)
    contextBridge.exposeInMainWorld('electronAPI', {
      user: userAPI,
      harmful: harmfulAPI,
      cigarettes: cigarettesAPI
    })
    console.log('预加载脚本: API已成功暴露到渲染进程')
  } catch (error) {
    console.error('预加载脚本: 暴露API失败:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = extendedElectronAPI
  // @ts-ignore (define in dts)
  window.electronAPI = { user: userAPI, harmful: harmfulAPI, cigarettes: cigarettesAPI }
  console.log('预加载脚本: 在非隔离上下文中设置API')
}
