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
import { userService } from './database/service/userService'
import { cigarettesService } from './database/service/cigarettesService'
import { harmfulService } from './database/service/harmfulService'

/**
 * 注册所有IPC处理程序
 * 将渲染进程的请求路由到相应的服务层方法
 */
export function registerIPC(): void {
  /* -------------------- 基础连通性测试 -------------------- */
  ipcMain.on('ping', () => console.log('[ipc] pong'))

  /* -------------------- 用户管理 -------------------- */

  /**
   * 创建新用户
   */
  ipcMain.handle('user:create', async (_evt, userData: schema.NewUser) => {
    try {
      const user = await userService.createUser(userData)
      return { success: true, data: user }
    } catch (error) {
      console.error('[ipc] user:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 根据ID获取用户
   */
  ipcMain.handle('user:get-by-id', async (_evt, userId: number) => {
    try {
      return { success: true, data: userService.getUserById(userId) }
    } catch (error) {
      console.error('[ipc] user:get-by-id failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 根据邮箱获取用户
   */
  ipcMain.handle('user:get-by-email', async (_evt, email: string) => {
    try {
      return { success: true, data: userService.getUserByEmail(email) }
    } catch (error) {
      console.error('[ipc] user:get-by-email failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 根据用户名获取用户
   */
  ipcMain.handle('user:get-by-username', async (_evt, username: string) => {
    try {
      return { success: true, data: userService.getUserByUsername(username) }
    } catch (error) {
      console.error('[ipc] user:get-by-username failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 获取所有用户
   */
  ipcMain.handle('user:get-all', async () => {
    try {
      return { success: true, data: userService.getAllUsers() }
    } catch (error) {
      console.error('[ipc] user:get-all failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 更新用户信息
   */
  ipcMain.handle('user:update', async (_evt, id: number, updates: Partial<schema.User>) => {
    try {
      const user = await userService.updateUser(id, updates)
      return { success: true, data: user }
    } catch (error) {
      console.error('[ipc] user:update failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 删除用户
   */
  ipcMain.handle('user:delete', async (_evt, id: number) => {
    try {
      await userService.deleteUser(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] user:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 搜索用户
   */
  ipcMain.handle('user:search', async (_evt, query: string) => {
    try {
      return { success: true, data: await userService.searchUsers(query) }
    } catch (error) {
      console.error('[ipc] user:search failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

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
   * 获取所有卷烟数据
   */
  ipcMain.handle('cigarettes:get-all', async () => {
    try {
      return { success: true, data: cigarettesService.getAllCigarettes() }
    } catch (error) {
      console.error('[ipc] cigarettes:get-all failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 根据ID获取卷烟数据
   */
  ipcMain.handle('cigarettes:get-by-id', async (_evt, id: number) => {
    try {
      return { success: true, data: cigarettesService.getCigarettesById(id) }
    } catch (error) {
      console.error('[ipc] cigarettes:get-by-id failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 创建卷烟数据
   */
  ipcMain.handle('cigarettes:create', async (_evt, obj: schema.Cigarettes) => {
    try {
      return { success: true, data: await cigarettesService.createCigarettes(obj) }
    } catch (error) {
      console.error('[ipc] cigarettes:create failed:', error)
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
   * 根据批次号查询有害成分系数
   */
  ipcMain.handle('harmful:query-by-batch', async (_evt, batchNo: string) => {
    try {
      return { success: true, data: harmfulService.getHarmfulbatchNo(batchNo) }
    } catch (error) {
      console.error('[ipc] harmful:query-by-batch failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 根据ID获取有害成分系数
   */
  ipcMain.handle('harmful:get-by-id', async (_evt, id: number) => {
    try {
      return { success: true, data: harmfulService.getHarmfulById(id) }
    } catch (error) {
      console.error('[ipc] harmful:get-by-id failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * 创建有害成分系数
   */
  ipcMain.handle('harmful:create', async (_evt, obj: schema.HarmfulConstants) => {
    try {
      return { success: true, data: await harmfulService.createHarmful(obj) }
    } catch (error) {
      console.error('[ipc] harmful:create failed:', error)
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

  /**
   * 仿真预测计算
   * 根据科学数据进行有害成分预测
   */
  ipcMain.handle('harmful:predict', async (_evt, scientificData: schema.ScientificDataDto) => {
    try {
      const result = await harmfulService.findDerivation(scientificData)
      return { success: true, data: result }
    } catch (error) {
      console.error('[ipc] harmful:predict failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  console.log('[ipc] 所有IPC路由注册完成')
}
