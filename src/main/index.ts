/**
 * @file index.ts
 * @description
 * 应用“唯一入口”。负责：
 *   1) 应用生命周期管理（whenReady / activate / window-all-closed / before-quit）
 *   2) 创建并管理 BrowserWindow（窗口配置、加载 URL/本地文件、DevTools、外链拦截）
 *   3) 注册所有 IPC（import 并调用 registerIPC）
 *   4) 统一的资源清理（数据库关闭等）
 */

import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db } from './database'
import { registerIPC } from './ipc'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mainWindow: BrowserWindow | null = null

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

  // 拦截 window.open / target="_blank"，改为外部系统浏览器打开
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
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
    console.error('[main] Page failed to load:', code, desc)
  })

  return win
}

/**
 * 安全关闭数据库。集中在唯一入口调用，避免多处竞争性 close。
 * 将所有外部资源（DB/文件句柄/网络连接）统一在这里收口，便于维护。
 */
function safeCloseDb(): void {
  try {
    db.close()
  } catch (e) {
    console.error('[main] close db error:', e)
  }
}

/* ------------------------- 应用生命周期入口 ------------------------- */

app.whenReady().then(() => {
  // Windows 上设置 AppUserModelID，便于任务栏通知等
  electronApp.setAppUserModelId('com.yourcompany.yourapp')

  // 统一管理窗口快捷键：开发环境 F12 打开 DevTools、生产禁用刷新等
  app.on('browser-window-created', (_e, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册所有 IPC，只需调用一次；把 handle/on 都放到 ipc.ts
  registerIPC()

  // 创建主窗口
  mainWindow = createMainWindow()

  // macOS：无窗口时点击 Dock 图标再创建一个
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

// 所有窗口关闭时退出（macOS 保留进程，等待用户显式退出）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    safeCloseDb()
    app.quit()
  }
})

// 退出前的收尾清理（尽量保证资源释放）
app.on('before-quit', () => {
  safeCloseDb()
})
