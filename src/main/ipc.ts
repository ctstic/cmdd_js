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
import { simulationPredictionService } from './database/service/simulationPredictionService'
import { recAuxMaterials } from './database/service/recAuxMaterials'

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
  ipcMain.handle('cigarettes:query', async (_evt, query: string) => {
    try {
      return { success: true, data: cigarettesService.getCigarettes(query) }
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

  /* -------------------- 有害成分系数管理 -------------------- */

  /**
   * 查询有害成分系数
   */
  ipcMain.handle('harmful:query', async (_evt, query: string) => {
    try {
      return { success: true, data: harmfulService.getHarmful(query) }
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
  ipcMain.handle('harmful:generate', async () => {
    try {
      // 调用服务层的生成方法
      await harmfulService.generate()
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

  console.log('[ipc] 所有IPC路由注册完成')
}
