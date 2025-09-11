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
  query: (query: string) => Promise<APIResponse<{ result: schema.HarmfulConstants[] }>>
  generate: () => Promise<APIResponse<void>>
  delete: (id: number) => Promise<APIResponse<void>>
}

/** 多因素卷烟模块 API 定义 */
export interface CigarettesAPI {
  query: (query: string) => Promise<APIResponse<{ result: schema.Cigarettes[] }>>
  delete: (id: number) => Promise<APIResponse<void>>
}

/** 预测模块 API 定义 */
export interface SimulationAPI {
  prediction: (
    scientificData: schema.ScientificDataDto
  ) => Promise<APIResponse<{ result: schema.PredictionResults[] }>>
}

/** 辅材推荐模块 API 定义 */
export interface RecAuxMaterialsAPI {
  auxMaterials: (dto: schema.AuxMaterialsDto) => Promise<APIResponse<any>>
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
  process: { versions: NodeJS.ProcessVersions } // Node.js 版本信息，可用于调试
}
