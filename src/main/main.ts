/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { db, schema } from './database'

let mainWindow: BrowserWindow

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // 先不显示窗口，等准备好后再显示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // preload 路径指向编译后的 .js 文件
      preload: join(__dirname, '../preload/index.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      // 启用开发者工具
      devTools: true
    }
  })
  // 打开开发者工具
  mainWindow.webContents.openDevTools()
  // 加载应用页面
  if (process.env.NODE_ENV === 'dev') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    console.log('生产环境: 加载本地文件')
    mainWindow.loadFile(join(__dirname, '../../src/renderer/index.html'))
  }

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription)
  })

  return mainWindow
}

// 应用准备就绪时
app.whenReady().then(async () => {
  console.log('App is ready, creating main window...')
  createMainWindow()

  // 在开发环境下运行数据库测试
  if (process.env.NODE_ENV === 'dev') {
    try {
      console.log('Database test completed')
    } catch (error) {
      console.error('数据库测试失败，但应用将继续运行:', error)
    }
  }

  // macOS 特殊处理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// 关闭所有窗口时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 关闭数据库连接
    try {
      db.close()
    } catch (error) {
      console.error('Error closing database:', error)
    }
    app.quit()
  }
})

// 基础 IPC 测试
ipcMain.on('ping', () => {
  console.log('Received ping from renderer process')
})

// IPC 处理程序 - 用户管理
ipcMain.handle('user:create', async (_, userData: schema.NewUser) => {
  try {
    const user = await db.createUser(userData)
    return { success: true, data: user }
  } catch (error) {
    console.error('Failed to create user:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('user:get-by-id', async (_, userId: number) => {
  try {
    const user = db.getUserById(userId)
    return { success: true, data: user }
  } catch (error) {
    console.error('Failed to get user:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('user:get-by-email', async (_, email: string) => {
  try {
    const user = db.getUserByEmail(email)
    return { success: true, data: user }
  } catch (error) {
    console.error('Failed to get user by email:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('user:get-by-username', async (_, username: string) => {
  try {
    const user = db.getUserByUsername(username)
    return { success: true, data: user }
  } catch (error) {
    console.error('Failed to get user by username:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('user:get-all', async () => {
  try {
    const users = db.getAllUsers()
    return { success: true, data: users }
  } catch (error) {
    console.error('Failed to get all users:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('user:update', async (_, id: number, updates: Partial<schema.User>) => {
  try {
    const user = await db.updateUser(id, updates)
    return { success: true, data: user }
  } catch (error) {
    console.error('Failed to update user:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('user:delete', async (_, id: number) => {
  try {
    await db.deleteUser(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('user:search', async (_, query: string) => {
  try {
    const users = await db.searchUsers(query)
    return { success: true, data: users }
  } catch (error) {
    console.error('Failed to search users:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('cigarettes:query', async (_, query: string) => {
  try {
    const cigarettes = await db.getCigarettes(query)
    return { success: true, data: cigarettes }
  } catch (error) {
    console.error('Failed to search cigarettes:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('cigarettes:delete', async (_, id: number) => {
  try {
    await db.deleteCigarettes(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete cigarettes:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('cigarettes:create', async (_, obj: schema.Cigarettes) => {
  try {
    const cigarettes = await db.createCigarettes(obj)
    return { success: true, data: cigarettes }
  } catch (error) {
    console.error('Failed to create cigarettes:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('cigarettes:get-by-id', async (_, id: number) => {
  try {
    const cigarettes = db.getCigarettesById(id)
    return { success: true, data: cigarettes }
  } catch (error) {
    console.error('Failed to get cigarettes:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 有害成分
ipcMain.handle('harmful:query', async (_, query: string) => {
  try {
    const harmful = await db.getHarmful(query)
    return { success: true, data: harmful }
  } catch (error) {
    console.error('Failed to search harmful:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('harmful:delete', async (_, id: number) => {
  try {
    await db.deleteHarmful(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete harmful:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 生成计算系数
ipcMain.handle('harmful:generate', async () => {
  try {
    // TODO 调用调用生成有害成分系数进行插入
    await db.generate()
    return { success: true }
  } catch (error) {
    console.error('Failed to create harmful:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('harmful:get-by-id', async (_, id: number) => {
  try {
    const harmful = db.getHarmfulById(id)
    return { success: true, data: harmful }
  } catch (error) {
    console.error('Failed to get harmful:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 处理应用退出前的清理工作
app.on('before-quit', () => {
  try {
    db.close()
  } catch (error) {
    console.error('Error closing database on quit:', error)
  }
})
