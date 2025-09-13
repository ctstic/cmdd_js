/* scripts/afterPack-prune-locales.js
 * 仅保留英语语言资源以缩小体积：
 * - Chromium/Electron locales：保留 en-US.pak
 * - macOS .lproj：保留 en.lproj
 */
const fs = require('fs')
const path = require('path')

function safeRm(target) {
  try {
    if (fs.existsSync(target)) {
      const stat = fs.lstatSync(target)
      if (stat.isDirectory()) {
        fs.rmSync(target, { recursive: true, force: true })
      } else {
        fs.unlinkSync(target)
      }
      console.log('[prune-locales] removed:', target)
    }
  } catch (e) {
    console.warn('[prune-locales] remove failed:', target, e?.message)
  }
}

function pruneDirKeepOnly(dir, keeperNames = []) {
  if (!fs.existsSync(dir)) {
    console.log('[prune-locales] skip (not exist):', dir)
    return
  }
  const items = fs.readdirSync(dir)
  for (const item of items) {
    if (!keeperNames.includes(item)) {
      safeRm(path.join(dir, item))
    }
  }
}

exports.default = async function (context) {
  const { appOutDir, electronPlatformName, packager } = context
  console.log('[prune-locales] start, platform =', electronPlatformName)
  console.log('[prune-locales] appOutDir =', appOutDir)

  // ---- 计算 resources 目录 ----
  let resourcesDir
  if (electronPlatformName === 'darwin') {
    resourcesDir = path.join(
      appOutDir,
      `${packager.appInfo.productFilename}.app`,
      'Contents',
      'Resources'
    )
  } else {
    // Windows & Linux
    resourcesDir = path.join(appOutDir, 'resources')
  }
  console.log('[prune-locales] resourcesDir =', resourcesDir)

  // ---- 计算 locales 目录（不同平台位置不同）----
  let localesDir
  if (electronPlatformName === 'win32') {
    // Windows：<appOutDir>/locales
    localesDir = path.join(appOutDir, 'locales')
  } else if (electronPlatformName === 'linux') {
    // Linux：<appOutDir>/resources/locales
    localesDir = path.join(resourcesDir, 'locales')
  } else if (electronPlatformName === 'darwin') {
    // macOS：主 app 的 Resources/locales
    localesDir = path.join(resourcesDir, 'locales')
  }
  console.log('[prune-locales] localesDir =', localesDir)

  // 仅保留 en-US.pak
  pruneDirKeepOnly(localesDir, ['en-US.pak'])

  // ---- macOS 专项：.lproj 和 Framework 内部 locales ----
  if (electronPlatformName === 'darwin') {
    const lprojKeep = ['en.lproj']

    // 1) <App>.app/Contents/Resources/*.lproj
    if (fs.existsSync(resourcesDir)) {
      const entries = fs.readdirSync(resourcesDir)
      for (const entry of entries) {
        if (entry.endsWith('.lproj') && !lprojKeep.includes(entry)) {
          safeRm(path.join(resourcesDir, entry))
        }
      }
    }

    // 2) Electron Framework 内的 locales（路径可能有 Versions/A）
    const fwBase = path.join(
      appOutDir,
      `${packager.appInfo.productFilename}.app`,
      'Contents',
      'Frameworks',
      'Electron Framework.framework'
    )

    const fwCandidates = [
      path.join(fwBase, 'Resources', 'locales'),
      path.join(fwBase, 'Versions', 'A', 'Resources', 'locales')
    ]

    for (const fwLocales of fwCandidates) {
      console.log('[prune-locales] framework locales candidate =', fwLocales)
      pruneDirKeepOnly(fwLocales, ['en-US.pak'])
    }
  }

  console.log('[prune-locales] done')
}
