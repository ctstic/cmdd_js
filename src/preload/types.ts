/**
 * @file types.ts
 * @description 定义 preload 层和渲染进程共享的类型接口。
 */

import * as schema from '../main/database/schema'

/** 通用的 API 响应格式 */
export interface APIResponse<T> {
  success: boolean // 是否成功
  data?: T // 返回的数据
  error?: string // 错误信息（如果有）
}

/** 计算系数模块 API 定义 */
export interface HarmfulAPI {
  query: (
    query: string,
    specimenName: string
  ) => Promise<APIResponse<{ result: schema.HarmfulConstants[] }>>
  generate: (specimenName: string) => Promise<APIResponse<void>>
  delete: (id: number) => Promise<APIResponse<void>>
}

/** 多因素卷烟模块 API 定义 */
export interface CigarettesAPI {
  query: (
    query: string,
    specimenName: string
  ) => Promise<APIResponse<{ result: schema.Cigarettes[] }>>
  delete: (id: number) => Promise<APIResponse<void>>
  getCigarettesType: (specimenName: string) => Promise<APIResponse<{ result: string[] }>>
  deleteCigarettesType: (specimenName: string) => Promise<APIResponse<void>>
  importFromWebFile: (fileObj: {
    specimenName: string
    name: string
    buffer: Uint8Array
  }) => Promise<APIResponse<schema.ImportResult>>
}

/** 预测模块 API 定义 */
export interface SimulationAPI {
  prediction: (
    scientificData: schema.ScientificDataDto
  ) => Promise<APIResponse<{ result: schema.PredictionResults[] }>>
  exportResult: (scientificData: schema.ScientificDataDto) => Promise<APIResponse<any>>
}

/** 辅材推荐模块 API 定义 */
export interface RecAuxMaterialsAPI {
  auxMaterials: (dto: schema.AuxMaterialsDto) => Promise<APIResponse<any>>
  exportResult: (dto: schema.AuxMaterialsDto) => Promise<APIResponse<any>>
}

/** 基准卷烟主流烟气牌号模块 API 定义 */
export interface RfgMarkAPI {
  query: (query: string) => Promise<APIResponse<{ result: schema.RfgMark[] }>>
  createRfgMark: (obj: schema.RfgMarkDto) => Promise<APIResponse<void>>
}

/** 基准卷烟辅材参数牌号模块 API 定义 */
export interface RamMarkAPI {
  query: (query: string) => Promise<APIResponse<{ result: schema.RamMark[] }>>
  createRamMark: (obj: schema.RamMarkDto) => Promise<APIResponse<void>>
}

/** 基准卷烟主流烟气牌号模块 API 定义 */
export interface SimulationPredictionSaveAPI {
  query: () => Promise<APIResponse<{ result: schema.SimulationPredictionSave[] }>>
  getId: (id: number) => Promise<APIResponse<{ result: schema.SimulationPredictionSave }>>
  create: (obj: schema.ScientificDataDto) => Promise<APIResponse<void>>
  delete: (id: number) => Promise<APIResponse<void>>
  exportId: (id: number) => Promise<APIResponse<any>>
}

/** 辅材参数推荐管理 模块 API 定义 */
export interface RecAuxMaterialsSaveAPI {
  query: () => Promise<APIResponse<{ result: schema.RecAuxMaterialsSave[] }>>
  getId: (id: number) => Promise<APIResponse<{ result: schema.RecAuxMaterialsSave }>>
  create: (obj: schema.AuxMaterialsDto) => Promise<APIResponse<void>>
  delete: (id: number) => Promise<APIResponse<void>>
  exportId: (id: number) => Promise<APIResponse<any>>
}

/**
 * preload 层最终暴露到 window 上的总对象接口。
 * 渲染进程只需要通过 window.electronAPI 来访问这些方法。
 */
export interface ExposedElectronAPI {
  harmful: HarmfulAPI
  cigarettes: CigarettesAPI
  simulation: SimulationAPI
  rec: RecAuxMaterialsAPI
  rfgMark: RfgMarkAPI
  ramMark: RamMarkAPI
  simulationPredictionSaveAPI: SimulationPredictionSaveAPI
  recAuxMaterialsSaveAPI: RecAuxMaterialsSaveAPI
  process: { versions: NodeJS.ProcessVersions } // Node.js 版本信息，可用于调试
}
