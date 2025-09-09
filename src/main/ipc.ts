/**
 * @file ipc.ts
 * @description
 * 只负责注册主进程的所有 IPC 路由（ipcMain.handle / ipcMain.on）。
 * 将所有与后端逻辑（数据库、文件、系统 API）的交互集中在这里，
 * 便于统一管理、调试和测试；避免分散在多个入口文件。
 *
 * 约定：
 *   - 所有 handle 的返回值都使用统一的 APIResponse 结构（success/data/error）
 *   - 尽量避免在渲染进程直接暴露底层细节（路径、连接串等）
 *   - channel 名称模块化前缀：user:* / harmful:* / cigarettes:*，便于归类检索
 */

import { ipcMain } from 'electron'
import { db, schema } from './database'

export function registerIPC(): void {
  /* -------------------- 基础连通性测试 -------------------- */
  ipcMain.on('ping', () => console.log('[ipc] pong'))

  /* -------------------- 用户管理 -------------------- */
  ipcMain.handle('user:create', async (_evt, userData: schema.NewUser) => {
    try {
      const user = await db.createUser(userData)
      return { success: true, data: user }
    } catch (error) {
      console.error('[ipc] user:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('user:get-by-id', async (_evt, userId: number) => {
    try {
      return { success: true, data: db.getUserById(userId) }
    } catch (error) {
      console.error('[ipc] user:get-by-id failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('user:get-by-email', async (_evt, email: string) => {
    try {
      return { success: true, data: db.getUserByEmail(email) }
    } catch (error) {
      console.error('[ipc] user:get-by-email failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('user:get-by-username', async (_evt, username: string) => {
    try {
      return { success: true, data: db.getUserByUsername(username) }
    } catch (error) {
      console.error('[ipc] user:get-by-username failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('user:get-all', async () => {
    try {
      return { success: true, data: db.getAllUsers() }
    } catch (error) {
      console.error('[ipc] user:get-all failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('user:update', async (_evt, id: number, updates: Partial<schema.User>) => {
    try {
      const user = await db.updateUser(id, updates)
      return { success: true, data: user }
    } catch (error) {
      console.error('[ipc] user:update failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('user:delete', async (_evt, id: number) => {
    try {
      await db.deleteUser(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] user:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('user:search', async (_evt, query: string) => {
    try {
      return { success: true, data: await db.searchUsers(query) }
    } catch (error) {
      console.error('[ipc] user:search failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 多因素卷烟 -------------------- */
  ipcMain.handle('cigarettes:query', async (_evt, query: string) => {
    try {
      return { success: true, data: await db.getCigarettes(query) }
    } catch (error) {
      console.error('[ipc] cigarettes:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('cigarettes:delete', async (_evt, id: number) => {
    try {
      await db.deleteCigarettes(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] cigarettes:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('cigarettes:create', async (_evt, obj: schema.Cigarettes) => {
    try {
      return { success: true, data: await db.createCigarettes(obj) }
    } catch (error) {
      console.error('[ipc] cigarettes:create failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('cigarettes:get-by-id', async (_evt, id: number) => {
    try {
      return { success: true, data: db.getCigarettesById(id) }
    } catch (error) {
      console.error('[ipc] cigarettes:get-by-id failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /* -------------------- 有害成分 -------------------- */
  ipcMain.handle('harmful:query', async (_evt, query: string) => {
    try {
      return { success: true, data: await db.getHarmful(query) }
    } catch (error) {
      console.error('[ipc] harmful:query failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('harmful:delete', async (_evt, id: number) => {
    try {
      await db.deleteHarmful(id)
      return { success: true }
    } catch (error) {
      console.error('[ipc] harmful:delete failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('harmful:get-by-id', async (_evt, id: number) => {
    try {
      return { success: true, data: db.getHarmfulById(id) }
    } catch (error) {
      console.error('[ipc] harmful:get-by-id failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('harmful:generate', async () => {
    try {
      // 生成计算系数 / 预计算数据等：实际实现由 database 模块提供
      await db.generate()
      return { success: true }
    } catch (error) {
      console.error('[ipc] harmful:generate failed:', error)
      return { success: false, error: (error as Error).message }
    }
  })
}
