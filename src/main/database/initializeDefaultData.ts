import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'
import { app } from 'electron'
import { existsSync } from 'fs'
import { harmfulService } from './harmful.service'
import * as schema from './schema'

class DatabaseInitializer {
  private static instance: DatabaseInitializer
  private sqlite: Database.Database
  public db: ReturnType<typeof drizzle>

  private constructor() {
    // 获取数据库文件路径
    let dbPath: string
    if (typeof app !== 'undefined' && app.getPath) {
      dbPath = join(app.getPath('userData'), 'app-database.sqlite')
    } else {
      dbPath = join(process.cwd(), 'database.sqlite')
    }

    // 初始化 SQLite
    this.sqlite = new Database(dbPath)

    // 开启 WAL 模式
    this.sqlite.pragma('journal_mode = WAL')

    // 创建 drizzle 实例
    this.db = drizzle(this.sqlite, { schema })

    // 运行迁移或建表
    this.runMigrations()

    // 初始化默认数据
    this.initializeDefaultData()
  }

  public static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer()
    }
    return DatabaseInitializer.instance
  }

  private runMigrations(): void {
    try {
      const migrationsPath = join(__dirname, 'migrations')
      if (!existsSync(migrationsPath)) {
        console.log('Migrations directory not found, creating tables directly')
        this.createTables()
        return
      }
      migrate(this.db, { migrationsFolder: migrationsPath })
      console.log('Database migrations completed')
    } catch (error) {
      console.error('Migration error:', error)
      console.log('Falling back to direct table creation')
      this.createTables()
    }
  }

  private createTables(): void {
    try {
      this.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT,
          avatar TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `)

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

      console.log('Tables created successfully')
    } catch (error) {
      console.error('Failed to create tables:', error)
    }
  }

  private async initializeDefaultData(): Promise<void> {
    try {
      const userCount = this.sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as {
        count: number
      }
      const cigarettesCount = this.sqlite
        .prepare('SELECT COUNT(*) as count FROM cigarettes')
        .get() as { count: number }
      const harmfulCount = this.sqlite
        .prepare('SELECT COUNT(*) as count FROM harmful_constants')
        .get() as { count: number }

      if (cigarettesCount.count === 0) {
        const insertCigaretteStmt = this.sqlite.prepare(`
          INSERT INTO cigarettes (
            code, filter_ventilation, filter_pressure_drop, permeability, quantitative,
            citrate, potassium_ratio, tar, nicotine, co, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        const now = Date.now()
        for (const cigarettes of schema.defaultCigarettes) {
          insertCigaretteStmt.run(
            cigarettes.code,
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
      }

      if (harmfulCount.count === 0) {
        harmfulService.generate()
      }

      if (userCount.count === 0) {
        console.log('Initializing default user data...')
        const insertStmt = this.sqlite.prepare(`
          INSERT INTO users (username, email, full_name, avatar, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        const now = Date.now()
        for (const user of schema.defaultUsers) {
          insertStmt.run(
            user.username,
            user.email,
            user.fullName,
            user.avatar,
            user.status,
            now,
            now
          )
        }
        console.log('Default user data initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize default data:', error)
    }
  }
}

export const dbInit = DatabaseInitializer.getInstance()
