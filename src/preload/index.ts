/**
 * @file index.ts
 * @description Electron 预加载脚本。
 *              通过 contextBridge 将安全的 API 注入到渲染进程（window.electronAPI）。
 */

import { contextBridge, ipcRenderer } from 'electron'
import {
  HarmfulAPI,
  CigarettesAPI,
  SimulationAPI,
  RecAuxMaterialsAPI,
  RfgMarkAPI,
  RamMarkAPI,
  SimulationPredictionSaveAPI,
  RecAuxMaterialsSaveAPI,
  ExposedElectronAPI
} from './types'

/** 开发模式下打印日志，生产环境保持安静 */
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL
const log = (...args: any[]): void => {
  if (isDev) console.log('[preload]', ...args)
}

/* -------------------- 工厂函数：封装 IPC 调用 -------------------- */

/**
 * 创建 API 的工厂函数
 * @param channels 每个 API 方法对应的 IPC 通道
 */
const createAPI = <T>(channels: { [K in keyof T]: string }): T => {
  const api = {} as T
  for (const [key, channel] of Object.entries(channels)) {
    api[key as keyof T] = (...args: any[]) => ipcRenderer.invoke(channel, ...args)
  }
  return api
}

/* -------------------- 暴露给渲染进程的唯一对象 -------------------- */
const electronAPI: ExposedElectronAPI = {
  harmful: createAPI<HarmfulAPI>({
    query: 'harmful:query',
    generate: 'harmful:generate',
    delete: 'harmful:delete'
  }),
  cigarettes: createAPI<CigarettesAPI>({
    query: 'cigarettes:query',
    delete: 'cigarettes:delete',
    importFromWebFile: 'cigarettes:importFromWebFile',
    getCigarettesType: 'cigarettes:getCigarettesType',
    deleteCigarettesType: 'cigarettes:deleteCigarettesType'
  }),
  simulation: createAPI<SimulationAPI>({
    prediction: 'simulation:prediction',
    exportResult: 'simulation:exportResult'
  }),
  rec: createAPI<RecAuxMaterialsAPI>({
    auxMaterials: 'rec:auxMaterials',
    exportResult: 'rec:exportResult'
  }),
  rfgMark: createAPI<RfgMarkAPI>({
    query: 'rfgMark:query',
    createRfgMark: 'rfgMark:create'
  }),
  ramMark: createAPI<RamMarkAPI>({
    query: 'ramMark:query',
    createRamMark: 'ramMark:create'
  }),
  simulationPredictionSaveAPI: createAPI<SimulationPredictionSaveAPI>({
    query: 'simulationPredictionSave:query',
    getId: 'simulationPredictionSave:getId',
    create: 'simulationPredictionSave:create',
    delete: 'simulationPredictionSave:delete',
    exportId: 'simulationPredictionSave:exportId'
  }),
  recAuxMaterialsSaveAPI: createAPI<RecAuxMaterialsSaveAPI>({
    query: 'recAuxMaterialsSave:query',
    getId: 'recAuxMaterialsSave:getId',
    create: 'recAuxMaterialsSave:create',
    delete: 'recAuxMaterialsSave:delete',
    exportId: 'recAuxMaterialsSave:exportId'
  }),
  process: { versions: process.versions }
}

/* -------------------- 安全注入到 window -------------------- */
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  log('electronAPI exposed successfully')
} catch (err) {
  console.error('[preload] expose failed:', err)
}
