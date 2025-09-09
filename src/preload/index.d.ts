/**
 * @file index.d.ts
 * @description 声明渲染进程的全局变量 window.electronAPI。
 *              这样在 React/Vue 等渲染端项目里，可以获得类型提示和 TS 检查。
 */

import type { ExposedElectronAPI } from './types'

declare global {
  interface Window {
    /** 渲染进程唯一的 API 入口点 */
    electronAPI: ExposedElectronAPI
  }
}
