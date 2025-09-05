import type { Config } from 'drizzle-kit'
import { join } from 'path'

export default {
  schema: './src/main/database/schema.ts',
  out: './src/main/database/migrations',
  dialect: 'sqlite', // ✅ 改成 better-sqlite3
  dbCredentials: {
    url: join(process.cwd(), 'database.sqlite') // ✅ SQLite 用 url 字段
  },
  verbose: true,
  strict: true
} satisfies Config
