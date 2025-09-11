/**
 * @file index.ts
 * @description
 * 应用"唯一入口"。负责：
 *   1) 应用生命周期管理（whenReady / activate / window-all-closed / before-quit）
 *   2) 创建并管理 BrowserWindow（窗口配置、加载 URL/本地文件、DevTools、外链拦截）
 *   3) 注册所有 IPC（import 并调用 registerIPC）
 *   4) 统一的资源清理（数据库关闭等）
 *   5) 解决编码问题和重复关闭数据库的问题
 */

import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db } from './database'
import { registerIPC } from './ipc'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mainWindow: BrowserWindow | null = null

// 数据库关闭状态标记，防止重复关闭
let isDbClosed = false

/**
 * 创建主窗口（合并了原先 window.ts 中的职责）
 * - 仅在需要时调用一次；macOS 下可在 activate 时重建
 * - 统一开发/生产的资源加载与 DevTools 策略
 * - 做好安全配置（contextIsolation, nodeIntegration=false 等）
 */
function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    show: false, // 等页面准备好后再展示，避免白屏闪烁
    autoHideMenuBar: true, // 隐藏菜单栏（可按 Alt 显示）
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      // 指向编译后的 preload 脚本（构建后为 .js）
      preload: join(__dirname, '../preload/index.js'),
      // 安全相关建议：禁用 nodeIntegration，启用 contextIsolation
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // 如需启用 sandbox，请确保 preload 能正确工作
      webSecurity: true, // 启用同源策略等安全限制
      devTools: is.dev // 仅在开发环境默认开启 DevTools
    }
  })

  // 页面准备好后再显示窗口
  win.on('ready-to-show', () => win.show())

  // 拦截所有 window.open 的外部连接
  win.webContents.setWindowOpenHandler((details) => {
    console.warn('[main] 拦截了所有外部链接:', details.url)
    return { action: 'deny' } // 禁用所有外部链接的打开
  })

  // 加载渲染资源：开发环境走 Vite/webpack dev server，生产加载本地文件
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
    // 开发环境可自动打开 DevTools，提高调试效率（可按需注释）
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 注意：此路径需与构建产物保持一致（electron-vite 默认输出到 ../renderer）
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 监听加载失败，便于排查构建 / 路径问题
  win.webContents.on('did-fail-load', (_event, code, desc) => {
    console.error('[main] 页面加载失败:', code, desc)
  })

  // 窗口关闭时的处理
  win.on('closed', () => {
    mainWindow = null
  })

  return win
}

/**
 * 安全关闭数据库
 * 集中在唯一入口调用，避免多处竞争性 close
 * 增加状态检查，防止重复关闭
 */
async function safeCloseDb(): Promise<void> {
  if (isDbClosed) {
    console.log('[main] 数据库已经关闭，跳过关闭操作...')
    return
  }

  try {
    console.log('[main] 正在关闭数据库连接...')
    await db.close()
    console.log('[main] 数据库成功关闭')
  } catch (error) {
    console.error('[main] 关闭数据库时出错:', error)
  } finally {
    isDbClosed = true // 确保数据库关闭标记在任何情况下都被更新
  }
}

/**
 * 应用退出清理函数
 * 统一处理所有资源清理工作
 */
function cleanup(): void {
  console.log('[main] 开始清理应用资源...')

  // 关闭数据库连接
  safeCloseDb()

  // 这里可以添加其他清理工作
  // 例如：清理临时文件、关闭网络连接等

  console.log('[main] 应用资源清理完成')
}

/* ------------------------- 应用生命周期入口 ------------------------- */

app
  .whenReady()
  .then(() => {
    console.log('[main] 应用已准备好')

    // Windows 上设置 AppUserModelID，便于任务栏通知等
    electronApp.setAppUserModelId('com.yourcompany.yourapp')

    // 统一管理窗口快捷键：开发环境 F12 打开 DevTools、生产禁用刷新等
    app.on('browser-window-created', (_e, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // 注册所有 IPC，只需调用一次；把 handle/on 都放到 ipc.ts
    try {
      registerIPC()
      console.log('[main] IPC 处理程序注册成功')
    } catch (error) {
      console.error('[main] 注册 IPC 处理程序失败:', error)
    }

    // 创建主窗口
    mainWindow = createMainWindow()

    // macOS：无窗口时点击 Dock 图标再创建一个
    app.on('activate', () => {
      console.log('[main] 应用已激活')
      if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = createMainWindow()
      }
      mainWindow.show() // 确保在激活时显示窗口
    })
  })
  .catch((error) => {
    console.error('[main] 应用初始化失败:', error)
  })

// 所有窗口关闭时的处理
app.on('window-all-closed', () => {
  console.log('[main] 所有窗口已关闭')

  // macOS 平台保留进程，等待用户显式退出
  if (process.platform !== 'darwin') {
    console.log('[main] 应用退出 (非 macOS)')
    cleanup()
    app.quit()
  } else {
    console.log('[main] macOS: 保持应用运行，无窗口时等待用户操作')
  }
})

// 应用即将退出时的清理
app.on('before-quit', () => {
  console.log('[main] 应用即将退出')

  if (!isDbClosed) {
    console.log('[main] 在退出前执行清理操作...')
    cleanup()
  }
})

// 应用即将退出时的最后清理（备用）
app.on('will-quit', (event) => {
  console.log('[main] 应用将退出')

  if (!isDbClosed) {
    // 如果数据库还没关闭，阻止退出并先清理
    event.preventDefault()
    cleanup()
    // 清理完成后重新退出
    setTimeout(() => {
      app.quit()
    }, 100)
  }
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('[main] 未捕获的异常:', error)
  cleanup()
  process.exit(1)
})

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('[main] 未处理的 Promise 拒绝 at:', promise, '原因:', reason)
  // 不立即退出，记录错误继续运行
})

// 关闭信号处理（Linux/macOS）
if (process.platform !== 'win32') {
  process.on('SIGTERM', () => {
    console.log('[main] 接收到 SIGTERM，正在关闭')
    cleanup()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('[main] 接收到 SIGINT，正在关闭')
    cleanup()
    process.exit(0)
  })
}
