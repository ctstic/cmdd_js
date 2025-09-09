/**
 * @file index.ts
 * @description Electron 预加载脚本。
 *              作用：通过 contextBridge 将安全的 API 注入到渲染进程（window.electronAPI）。
 *              所有 IPC 调用都经过这里转发，避免直接暴露 ipcRenderer，保证安全。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextBridge, ipcRenderer } from 'electron'
import { CigarettesAPI, ExposedElectronAPI, HarmfulAPI, UserAPI } from './types'

/** 开发模式下打印日志，生产环境保持安静 */
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL
const log = (...args: any[]): void => {
  if (isDev) console.log('[preload]', ...args)
}

/* -------------------- 工厂函数：封装 IPC 调用 -------------------- */

/** 用户管理 API：所有方法通过 ipcRenderer.invoke 转发到主进程 */
const createUserAPI = (): UserAPI => ({
  create: (userData) => ipcRenderer.invoke('user:create', userData),
  getById: (id) => ipcRenderer.invoke('user:get-by-id', id),
  getByEmail: (email) => ipcRenderer.invoke('user:get-by-email', email),
  getByUsername: (username) => ipcRenderer.invoke('user:get-by-username', username),
  getAll: () => ipcRenderer.invoke('user:get-all'),
  update: (id, updates) => ipcRenderer.invoke('user:update', id, updates),
  delete: (id) => ipcRenderer.invoke('user:delete', id),
  search: (q) => ipcRenderer.invoke('user:search', q)
})

/** 卷烟有害成分 API */
const createHarmfulAPI = (): HarmfulAPI => ({
  query: (q) => ipcRenderer.invoke('harmful:query', q),
  delete: (id) => ipcRenderer.invoke('harmful:delete', id),
  getById: (id) => ipcRenderer.invoke('harmful:get-by-id', id),
  generate: () => ipcRenderer.invoke('harmful:generate')
})

/** 多因素卷烟 API */
const createCigarettesAPI = (): CigarettesAPI => ({
  query: (q) => ipcRenderer.invoke('cigarettes:query', q),
  delete: (id) => ipcRenderer.invoke('cigarettes:delete', id),
  getById: (id) => ipcRenderer.invoke('cigarettes:get-by-id', id),
  create: (obj) => ipcRenderer.invoke('cigarettes:create', obj)
})

/* -------------------- 暴露给渲染进程的唯一对象 -------------------- */
const electronAPI: ExposedElectronAPI = {
  user: createUserAPI(),
  harmful: createHarmfulAPI(),
  cigarettes: createCigarettesAPI(),
  process: { versions: process.versions } // 额外信息：Node/Electron/Chrome 版本
}

/* -------------------- 安全注入到 window -------------------- */
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  log('electronAPI exposed successfully')
} catch (err) {
  console.error('[preload] expose failed:', err)
}
