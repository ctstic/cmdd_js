/**
 * @file index.ts
 * @description
 * 应用“唯一入口”。负责：
 *   1) 应用生命周期管理（whenReady / activate / window-all-closed / before-quit）
 *   2) 创建并管理 BrowserWindow（窗口配置、加载 URL/本地文件、DevTools、外链/导航拦截、CSP）
 *   3) 注册所有 IPC（import 并调用 registerIPC）
 *   4) 统一的资源清理（数据库关闭等）
 *   5) 生产环境硬化（禁用 F12/刷新/右键菜单/多实例）
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

/* ------------------------- 单实例锁（防止重复启动） ------------------------- */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
} else {
  app.on('second-instance', (_event, _argv, _cwd) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()
    }
  })
}

/* ------------------------- 创建主窗口 ------------------------- */
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
      // 安全建议：禁用 nodeIntegration，启用 contextIsolation
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // 如需启用 sandbox，请确保 preload 能正确工作
      webSecurity: true, // 启用同源策略等安全限制
      devTools: is.dev // 仅在开发环境默认开启 DevTools
    }
  })

  // 页面准备好后再显示窗口
  win.on('ready-to-show', () => win.show())

  // 生产环境：禁用菜单与 DevTools（双保险）
  if (!is.dev) {
    win.removeMenu()
    win.setMenuBarVisibility(false)
    win.webContents.on('devtools-opened', () => win.webContents.closeDevTools())
    // 禁用右键菜单（可按需保留）
    win.webContents.on('context-menu', (e) => e.preventDefault())
  }

  // 禁用生产环境下的常见调试/刷新快捷键
  win.webContents.on('before-input-event', (event, input) => {
    if (!is.dev) {
      const ctrlOrCmd = input.control || input.meta
      const shift = input.shift
      const key = input.key?.toLowerCase()

      // F12 或 Ctrl/Cmd+Shift+I -> DevTools
      if (key === 'f12' || (ctrlOrCmd && shift && key === 'i')) {
        event.preventDefault()
      }
      // 刷新：F5 / Ctrl/Cmd+R（含 Ctrl+Shift+R）
      if (key === 'f5' || (ctrlOrCmd && key === 'r')) {
        event.preventDefault()
      }
    }
  })

  // 拦截所有 window.open 的外部连接
  win.webContents.setWindowOpenHandler((details) => {
    console.warn('[main] 拦截 window.open 外部链接:', details.url)
    return { action: 'deny' } // 禁用所有外部链接的打开
  })

  // 阻止页面内导航（如 a[href]、window.location 变更）
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== win.webContents.getURL()) {
      e.preventDefault()
      console.warn('[main] 阻止页面内导航:', url)
    }
  })

  // 禁止 <webview>（若未使用则禁用）
  win.webContents.on('will-attach-webview', (e) => {
    e.preventDefault()
    console.warn('[main] 阻止附加 webview')
  })

  // 若仍通过 did-create-window 创建子窗口，直接销毁
  win.webContents.on('did-create-window', (child) => {
    console.warn('[main] 阻止创建子窗口并销毁')
    child.destroy()
  })

  // 注入 CSP（本地 file:// 通过响应头追加）
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const isLocal = details.url.startsWith('file://')
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'", // AntD/行内样式常见，必要时保留
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
    const headers = { ...details.responseHeaders }
    if (isLocal) headers['Content-Security-Policy'] = [csp]
    callback({ responseHeaders: headers })
  })

  // 加载渲染资源：开发环境走 dev server，生产加载本地文件
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
    // 开发环境可自动打开 DevTools，提高调试效率
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // electron-vite 默认输出到 ../renderer
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 监听加载失败，便于排查构建 / 路径问题
  win.webContents.on('did-fail-load', (_event, code, desc, url) => {
    console.error('[main] 页面加载失败:', code, desc, url)
    // 可选：加载兜底页
    // win.loadFile(join(__dirname, '../renderer/fallback.html')).catch(() => void 0)
  })

  // 窗口关闭时的处理
  win.on('closed', () => {
    mainWindow = null
  })

  return win
}

/* ------------------------- 数据库与资源清理 ------------------------- */
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
  void safeCloseDb()
  // 这里可以添加其他清理工作（清理临时文件、关闭网络连接等）
  console.log('[main] 应用资源清理完成')
}

/* ------------------------- 应用生命周期入口 ------------------------- */

app
  .whenReady()
  .then(() => {
    console.log('[main] 应用已准备好')

    // Windows 上设置 AppUserModelID，便于任务栏通知等
    electronApp.setAppUserModelId('com.cmdd.js')

    // 仅开发环境统一管理窗口快捷键
    app.on('browser-window-created', (_e, window) => {
      if (is.dev) {
        optimizer.watchWindowShortcuts(window)
      }
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

/* ------------------------- 全局异常处理 ------------------------- */

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
