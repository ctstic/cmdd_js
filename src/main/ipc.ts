/**
 * @file ipc.ts
 * @description
 * 只负责注册主进程的所有 IPC 路由（ipcMain.handle / ipcMain.on）。
 * 将所有与后端逻辑（数据库、文件、系统 API）的交互集中在这里，
 * 便于统一管理、调试和测试；避免分散在多个入口文件。
 *
 * 更新说明：
 * 现在使用重构后的服务层进行业务逻辑处理，保持原有的API接口不变，
 * 但底层调用改为使用各个专门的服务类。
 *
 * 约定：
 *   - 所有 handle 的返回值都使用统一的 APIResponse 结构（success/data/error）
 *   - 尽量避免在渲染进程直接暴露底层细节（路径、连接串等）
 *   - channel 名称模块化前缀：user:* / harmful:* / cigarettes:*，便于归类检索
 */

import { ipcMain } from 'electron'
import { schema } from './database'
import { cigarettesService } from './database/service/cigarettesService'
import { harmfulService } from './database/service/harmfulService'
import { simulationPredictionService } from './database/service/SimulationPredictionService'
import { recAuxMaterials } from './database/service/recAuxMaterials'
import { ramMarkService } from './database/service/ramMarkService'
import { rfgMarkService } from './database/service/rfgMarkService'
import { recAuxMaterialsSaveService } from './database/service/RecAuxMaterialsSaveService'
import { simulationPredictionSaveService } from './database/service/simulationPredictionSaveService'

/**
 * 注册所有IPC处理程序
 * 将渲染进程的请求路由到相应的服务层方法
 */
export function registerIPC(): void {
  /* -------------------- 基础连通性测试 -------------------- */
  ipcMain.on('ping', () => console.log('[ipc] pong'))

  /* -------------------- 多因素卷烟管理 -------------------- */

  /**
   * 查询卷烟数据
   */
  ipcMain.handle('cigarettes:query', async (_evt, query: string, specimenName: string) => {
    try {
      return { success: true, data: cigarettesService.getCigarettes(query, specimenName) }
    } catch (error) {
      console.error('[ipc] cigarettes:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('cigarettes:getCigarettesType', async (_evt, specimenName: string) => {
    try {
      if (specimenName !== '') {
        return { success: true, data: cigarettesService.getCigarettesType(specimenName) }
      } else {
        if (cigarettesService.getCigarettesType(specimenName).length > 0) {
          return { success: false, error: '样本名称已存在' }
        } else {
          return { success: true, data: cigarettesService.getCigarettesType(specimenName) }
        }
      }
    } catch (error) {
      console.error('[ipc] cigarettes:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 删除卷烟数据
   */
  ipcMain.handle('cigarettes:delete', async (_evt, id: number) => {
    try {
      await cigarettesService.deleteCigarettes(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] cigarettes:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 删除样品数据
   */
  ipcMain.handle('cigarettes:deleteCigarettesType', async (_evt, specimenName: string) => {
    try {
      await cigarettesService.deleteCigarettesType(specimenName)
      return { success: true }
    } catch (error) {
      console.error('[ipc] cigarettes:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 从Web文件导入卷烟数据
   */
  ipcMain.handle('cigarettes:importFromWebFile', async (_evt, fileObj) => {
    try {
      const { specimenName, name, buffer } = fileObj
      const nodeBuffer = Buffer.from(buffer) // ✅ 转成 Node Buffer
      const result = await cigarettesService.importFromWebFile({
        specimenName,
        name,
        buffer: nodeBuffer
      })
      return { success: true, data: result }
    } catch (error) {
      console.error('[ipc] cigarettes:importFromWebFile failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 有害成分系数管理 -------------------- */

  /**
   * 查询有害成分系数
   */
  ipcMain.handle('harmful:query', async (_evt, query: string, specimenName: string) => {
    try {
      return { success: true, data: harmfulService.getHarmful(query, specimenName) }
    } catch (error) {
      console.error('[ipc] harmful:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 删除有害成分系数
   */
  ipcMain.handle('harmful:delete', async (_evt, id: number) => {
    try {
      await harmfulService.deleteHarmful(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] harmful:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 生成有害成分系数
   * 基于现有卷烟数据进行多元线性回归计算
   */
  ipcMain.handle('harmful:generate', async (_evt, specimenName: string) => {
    try {
      // 调用服务层的生成方法
      await harmfulService.generate(specimenName)
      return { success: true, message: '有害成分系数生成成功' }
    } catch (error) {
      console.error('[ipc] harmful:generate failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 仿真预测计算 -------------------- */
  /**
   * 仿真预测计算
   * 根据科学数据进行有害成分预测
   */
  ipcMain.handle(
    'simulation:prediction',
    async (_evt, scientificData: schema.ScientificDataDto) => {
      try {
        const result = await simulationPredictionService.calculatePredictions(scientificData)
        return { success: true, data: result }
      } catch (error) {
        console.error('[ipc] simulation:predict failed:', error)
        return { success: false, error: (error as Error).message }
      }
    }
  )

  /* -------------------- 辅材推荐计算 -------------------- */
  /**
   * 辅材推荐计算
   * 根据输入参数进行辅材推荐
   */
  ipcMain.handle('rec:auxMaterials', async (_evt, dto: schema.AuxMaterialsDto) => {
    try {
      const result = await recAuxMaterials.findMaterialDesign(dto)
      return { success: true, data: result }
    } catch (error) {
      console.error('[ipc] rec:auxMaterials failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 基准卷烟辅材参数牌号 -------------------- */

  /**
   * 查询基准卷烟辅材参数牌号
   */
  ipcMain.handle('ramMark:query', async (_evt, mark: string) => {
    try {
      return { success: true, data: ramMarkService.getRamMarks(mark) }
    } catch (error) {
      console.error('[ipc] ramMark:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 新增基准卷烟辅材参数牌号
   */
  ipcMain.handle('ramMark:create', async (_evt, dto: schema.RamMark) => {
    try {
      await ramMarkService.createRamMark(dto)
      return { success: true }
    } catch (error) {
      console.error('[ipc] ramMark:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 基准主流烟气牌号 -------------------- */

  /**
   * 查询基准卷烟辅材参数牌号
   */
  ipcMain.handle('rfgMark:query', async (_evt, mark: string) => {
    try {
      return { success: true, data: rfgMarkService.getRfgMarks(mark) }
    } catch (error) {
      console.error('[ipc] rfgMark:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 新增基准卷烟辅材参数牌号
   */
  ipcMain.handle('rfgMark:create', async (_evt, dto: schema.RfgMark) => {
    try {
      await rfgMarkService.createRfgMark(dto)
      return { success: true }
    } catch (error) {
      console.error('[ipc] rfgMark:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 仿真预测数据管理 -------------------- */

  /**
   * 查询基准卷烟辅材参数牌号
   */
  ipcMain.handle('simulationPredictionSave:query', async () => {
    try {
      return { success: true, data: simulationPredictionSaveService.getAllSimulationPredictions() }
    } catch (error) {
      console.error('[ipc] simulationPredictionSave:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 查询基准卷烟辅材参数牌号
   */
  ipcMain.handle('simulationPredictionSave:getId', async (_evt, id: number) => {
    try {
      return {
        success: true,
        data: simulationPredictionSaveService.getSimulationPredictionById(id)
      }
    } catch (error) {
      console.error('[ipc] simulationPredictionSave:getId failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 查询基准卷烟辅材参数牌号
   */
  ipcMain.handle('simulationPredictionSave:create', async (_evt, dto: schema.ScientificDataDto) => {
    try {
      return { success: true, data: simulationPredictionSaveService.create(dto) }
    } catch (error) {
      console.error('[ipc] simulationPredictionSave:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 新增基准卷烟辅材参数牌号
   */
  ipcMain.handle('simulationPredictionSave:delete', async (_evt, id: number) => {
    try {
      await simulationPredictionSaveService.deleteSimulationPrediction(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] simulationPredictionSave:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 辅材参数推荐管理 -------------------- */

  /**
   * 查询辅材参数推荐
   */
  ipcMain.handle('recAuxMaterialsSave:query', async () => {
    try {
      return { success: true, data: recAuxMaterialsSaveService.getAllRecAuxMaterials() }
    } catch (error) {
      console.error('[ipc] recAuxMaterialsSave:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * id查询辅材参数推荐
   */
  ipcMain.handle('recAuxMaterialsSave:getId', async (_evt, id: number) => {
    try {
      return { success: true, data: recAuxMaterialsSaveService.getRecAuxMaterialsById(id) }
    } catch (error) {
      console.error('[ipc] recAuxMaterialsSave:getId failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 辅材参数推荐保存
   */
  ipcMain.handle('recAuxMaterialsSave:create', async (_evt, dto: schema.AuxMaterialsDto) => {
    try {
      return { success: true, data: recAuxMaterialsSaveService.create(dto) }
    } catch (error) {
      console.error('[ipc] recAuxMaterialsSave:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 辅材参数推荐删除
   */
  ipcMain.handle('recAuxMaterialsSave:delete', async (_evt, id: number) => {
    try {
      await recAuxMaterialsSaveService.deleteRecAuxMaterials(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] recAuxMaterialsSave:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  console.log('[ipc] 所有IPC路由注册完成')
}
