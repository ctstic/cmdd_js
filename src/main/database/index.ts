/**
 * 数据库主入口文件
 * 负责数据库连接初始化、迁移管理和基础配置
 * 提供数据库实例的单例访问模式
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'
import { app } from 'electron'
import { existsSync } from 'fs'
import * as schema from './schema'

/**
 * 数据库服务主类
 * 采用单例模式，负责数据库的初始化、连接管理和基础操作
 */
class DatabaseService {
  private static instance: DatabaseService
  private sqlite: Database.Database
  public db: ReturnType<typeof drizzle>

  private constructor() {
    // 获取数据库文件路径
    let dbPath: string
    if (typeof app !== 'undefined' && app.getPath) {
      // Electron 环境下使用用户数据目录
      dbPath = join(app.getPath('userData'), 'app-database.sqlite')
    } else {
      // 非 Electron 环境中使用当前目录
      dbPath = join(process.cwd(), 'database.sqlite')
    }

    // 初始化 SQLite 数据库连接
    this.sqlite = new Database(dbPath)

    // 启用 WAL 模式以提高性能和并发性
    this.sqlite.pragma('journal_mode = WAL')

    // 创建 Drizzle ORM 实例
    this.db = drizzle(this.sqlite, { schema })

    // 执行数据库迁移
    this.runMigrations()

    // 初始化默认数据
    this.initializeDefaultData()
  }

  /**
   * 获取数据库服务单例实例
   * @returns DatabaseService实例
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  /**
   * 执行数据库迁移
   * 如果迁移失败，则回退到直接创建表的方式
   */
  private runMigrations(): void {
    try {
      const migrationsPath = join(__dirname, 'migrations')

      // 检查迁移目录是否存在
      if (!existsSync(migrationsPath)) {
        console.log('迁移目录不存在，直接创建表结构')
        this.createTables()
        return
      }

      // 执行迁移文件
      migrate(this.db, { migrationsFolder: migrationsPath })
      console.log('数据库迁移完成')
    } catch (error) {
      console.error('迁移执行失败:', error)
      console.log('回退到直接创建表结构')
      // 如果迁移失败，尝试直接创建表
      this.createTables()
    }
  }

  /**
   * 直接创建数据库表结构
   * 在迁移不可用时作为备用方案
   */
  private createTables(): void {
    try {
      // 创建卷烟检测结果表
      this.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS cigarettes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT NOT NULL UNIQUE,
          filter_ventilation TEXT NOT NULL,
          filter_pressure_drop INTEGER NOT NULL,
          permeability TEXT NOT NULL,
          quantitative TEXT NOT NULL,
          citrate TEXT NOT NULL,
          potassium_ratio TEXT NOT NULL,
          tar TEXT NOT NULL,
          nicotine TEXT NOT NULL,
          co TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)

      // 创建有害成分系数表
      this.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS harmful_constants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          batch_no TEXT NOT NULL,
          changliang TEXT NOT NULL,
          filter_vent_coef TEXT NOT NULL,
          filter_pressure_coef TEXT NOT NULL,
          permeability_coef TEXT NOT NULL,
          quantitative_coef TEXT NOT NULL,
          citrate_coef TEXT NOT NULL,
          potassium_coef TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)

      console.log('数据库表创建成功')
    } catch (error) {
      console.error('创建数据库表失败:', error)
    }
  }

  /**
   * 初始化默认数据
   * 检查各表是否为空，如果为空则插入默认数据
   */
  private async initializeDefaultData(): Promise<void> {
    try {
      const { harmfulService } = await import('./service/harmfulService')
      // 检查卷烟数据
      const cigarettesCount = this.sqlite
        .prepare('SELECT COUNT(*) as count FROM cigarettes')
        .get() as {
        count: number
      }

      // 检查有害成分系数数据
      const harmfulCount = this.sqlite
        .prepare('SELECT COUNT(*) as count FROM harmful_constants')
        .get() as {
        count: number
      }

      // 初始化卷烟默认数据
      if (cigarettesCount.count === 0) {
        console.log('正在初始化默认的卷烟数据...')
        const insertCigaretteStmt = this.sqlite.prepare(`
          INSERT INTO cigarettes (
            code,type, filter_ventilation, filter_pressure_drop, permeability, quantitative,
            citrate, potassium_ratio, tar, nicotine, co, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        const now = Date.now()
        for (const cigarettes of schema.defaultCigarettes) {
          insertCigaretteStmt.run(
            cigarettes.code,
            cigarettes.type,
            cigarettes.filterVentilation,
            cigarettes.filterPressureDrop,
            cigarettes.permeability,
            cigarettes.quantitative,
            cigarettes.citrate,
            cigarettes.potassiumRatio,
            cigarettes.tar,
            cigarettes.nicotine,
            cigarettes.co,
            now,
            now
          )
        }
        console.log('默认的卷烟数据初始化成功')
      }

      // 初始化有害成分系数数据
      if (harmfulCount.count === 0) {
        console.log('正在生成有害成分系数数据...')
        // 这里调用生成方法，具体实现在service层
        harmfulService.generate('多因素数据')
      }
    } catch (error) {
      console.error('初始化默认数据失败:', error)
    }
  }

  /**
   * 获取原始SQLite数据库实例
   * 供service层使用，进行原始SQL操作
   * @returns SQLite数据库实例
   */
  public getSqliteInstance(): Database.Database {
    return this.sqlite
  }

  /**
   * 关闭数据库连接
   * 应在应用程序退出时调用
   */
  public close(): void {
    if (this.sqlite) {
      this.sqlite.close()
      console.log('数据库连接已关闭')
    }
  }
}

// 导出数据库服务单例实例
export const db = DatabaseService.getInstance()
// 导出schema以供其他模块使用
export { schema }
