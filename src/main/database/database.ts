// database.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'
import { app } from 'electron'
import { existsSync } from 'fs'
import * as schema from './schema'

class DatabaseService {
  private static instance: DatabaseService
  public sqlite: Database.Database
  public db: ReturnType<typeof drizzle>

  private constructor() {
    let dbPath: string
    if (typeof app !== 'undefined' && app.getPath) {
      dbPath = join(app.getPath('userData'), 'app-database.sqlite')
    } else {
      dbPath = join(process.cwd(), 'database.sqlite')
    }

    this.sqlite = new Database(dbPath)
    this.sqlite.pragma('journal_mode = WAL')
    this.db = drizzle(this.sqlite, { schema })
    this.runMigrations()
  }

  private runMigrations(): void {
    try {
      const migrationsPath = join(__dirname, 'migrations')
      if (existsSync(migrationsPath)) {
        migrate(this.db, { migrationsFolder: migrationsPath })
      }
    } catch (error) {
      console.error('Migration error:', error)
    }
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }
}

export const database = DatabaseService.getInstance()
