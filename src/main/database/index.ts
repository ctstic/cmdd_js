// cspell:ignore Xdecimal Ydecimal Xmatrix Ymatrix
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'
import { app } from 'electron'
import { existsSync } from 'fs'
import * as schema from './schema'
import MultivariateLinearRegression from 'ml-regression-multivariate-linear'
import Decimal from 'decimal.js'

class DatabaseService {
  private static instance: DatabaseService
  private sqlite: Database.Database
  public db: ReturnType<typeof drizzle>

  private constructor() {
    // 获取数据库文件路径
    let dbPath: string
    if (typeof app !== 'undefined' && app.getPath) {
      dbPath = join(app.getPath('userData'), 'app-database.sqlite')
    } else {
      // 在非 Electron 环境中使用当前目录
      dbPath = join(process.cwd(), 'database.sqlite')
    }

    // 初始化 SQLite 数据库
    this.sqlite = new Database(dbPath)

    // 启用 WAL 模式以提高性能
    this.sqlite.pragma('journal_mode = WAL')

    // 创建 Drizzle 实例
    this.db = drizzle(this.sqlite, { schema })

    // 运行迁移
    this.runMigrations()

    // 初始化默认数据
    this.initializeDefaultData()
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private runMigrations(): void {
    try {
      const migrationsPath = join(__dirname, 'migrations')

      // 检查迁移目录是否存在
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
      // 如果迁移失败，尝试创建表
      this.createTables()
    }
  }

  private createTables(): void {
    try {
      // 创建用户表
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
      // 创建 卷烟检测结果表
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
      //有害成分系数表
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
      // 检查是否已有数据
      const userCount = this.sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as {
        count: number
      }

      // 检查是否已有数据
      const cigarettesCount = this.sqlite
        .prepare('SELECT COUNT(*) as count FROM cigarettes')
        .get() as {
        count: number
      }

      // 检查是否已有数据
      const harmfulCount = this.sqlite
        .prepare('SELECT COUNT(*) as count FROM harmful_constants')
        .get() as {
        count: number
      }
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
        this.generate()
      }

      if (userCount.count === 0) {
        console.log('Initializing default user data...')
        // 插入默认用户数据
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

  public close(): void {
    if (this.sqlite) {
      this.sqlite.close()
    }
  }

  // 用户相关方法
  public async createUser(userData: schema.NewUser): Promise<schema.User> {
    const now = new Date()
    const result = this.sqlite
      .prepare(
        `
      INSERT INTO users (username, email, full_name, avatar, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        userData.username,
        userData.email,
        userData.fullName || null,
        userData.avatar || null,
        userData.status || 'active',
        now.getTime(),
        now.getTime()
      )

    return this.getUserById(result.lastInsertRowid as number)!
  }

  public getUserById(id: number): schema.User | undefined {
    const result = this.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<
      string,
      unknown
    >
    if (!result) return undefined

    return {
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }

  public getUserByEmail(email: string): schema.User | undefined {
    const result = this.sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<
      string,
      unknown
    >
    if (!result) return undefined

    return {
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }

  public getUserByUsername(username: string): schema.User | undefined {
    const result = this.sqlite
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as Record<string, unknown>
    if (!result) return undefined

    return {
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }

  public getAllUsers(): schema.User[] {
    const results = this.sqlite
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => ({
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }

  public async updateUser(
    id: number,
    updates: Partial<Omit<schema.User, 'id' | 'createdAt'>>
  ): Promise<schema.User> {
    const now = new Date()
    const currentUser = this.getUserById(id)
    if (!currentUser) {
      throw new Error('User not found')
    }

    const updatedUser = { ...currentUser, ...updates, updatedAt: now }

    this.sqlite
      .prepare(
        `
      UPDATE users
      SET username = ?, email = ?, full_name = ?, avatar = ?, status = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(
        updatedUser.username,
        updatedUser.email,
        updatedUser.fullName,
        updatedUser.avatar,
        updatedUser.status,
        now.getTime(),
        id
      )

    return updatedUser
  }

  public async deleteUser(id: number): Promise<void> {
    const result = this.sqlite.prepare('DELETE FROM users WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('User not found')
    }
  }

  public async searchUsers(query: string): Promise<schema.User[]> {
    const results = this.sqlite
      .prepare(
        `
      SELECT * FROM users
      WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?
      ORDER BY created_at DESC
    `
      )
      .all(`%${query}%`, `%${query}%`, `%${query}%`) as Record<string, unknown>[]

    return results.map((result) => ({
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }

  // 卷烟有害成分 查询
  public getHarmful(type: string): schema.HarmfulConstants[] {
    const results = this.sqlite
      .prepare('SELECT * FROM harmful_constants WHERE type = ? ORDER BY created_at DESC')
      .all(`%${type}%`) as Record<string, unknown>[]

    return results.map((result) => ({
      id: result.id as number,
      type: result.type as string,
      batchNo: result.batch_no as string,
      changliang: result.changliang as string,
      filterVentCoef: result.filter_vent_coef as string,
      filterPressureCoef: result.filter_pressure_coef as string,
      permeabilityCoef: result.permeability_coef as string,
      quantitativeCoef: result.quantitative_coef as string,
      citrateCoef: result.citrate_coef as string,
      potassiumCoef: result.potassium_coef as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }

    // 卷烟有害成分 查询
  public getHarmfulbatchNo(batchNo: string): schema.HarmfulConstants[] {
    const results = this.sqlite
      .prepare('SELECT * FROM harmful_constants WHERE batch_no = ? ORDER BY created_at DESC')
      .all(batchNo) as Record<string, unknown>[]

    return results.map((result) => ({
      id: result.id as number,
      type: result.type as string,
      batchNo: result.batch_no as string,
      changliang: result.changliang as string,
      filterVentCoef: result.filter_vent_coef as string,
      filterPressureCoef: result.filter_pressure_coef as string,
      permeabilityCoef: result.permeability_coef as string,
      quantitativeCoef: result.quantitative_coef as string,
      citrateCoef: result.citrate_coef as string,
      potassiumCoef: result.potassium_coef as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }
  // 卷烟有害成分 删除
  public async deleteHarmful(id: number): Promise<void> {
    const result = this.sqlite.prepare('DELETE FROM harmful_constants WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('harmful_constants not found')
    }
  }
  // 卷烟有害成分 id查询
  public getHarmfulById(id: number): schema.HarmfulConstants | undefined {
    const result = this.sqlite
      .prepare('SELECT * FROM harmful_constants WHERE id = ?')
      .get(id) as Record<string, unknown>
    if (!result) return undefined

    return {
      id: result.id as number,
      type: result.type as string,
      batchNo: result.batch_no as string,
      changliang: result.changliang as string,
      filterVentCoef: result.filter_vent_coef as string,
      filterPressureCoef: result.filter_pressure_coef as string,
      permeabilityCoef: result.permeability_coef as string,
      quantitativeCoef: result.quantitative_coef as string,
      citrateCoef: result.citrate_coef as string,
      potassiumCoef: result.potassium_coef as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
  // 卷烟有害成分 新增
  public async createHarmful(obj: schema.HarmfulConstants): Promise<schema.HarmfulConstants> {
    const now = new Date()
    const result = this.sqlite
      .prepare(
        `
    INSERT INTO harmful_constants (
      type, batch_no, changliang,
      filter_vent_coef, filter_pressure_coef, permeability_coef,
      quantitative_coef, citrate_coef, potassium_coef,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
      )
      .run(
        obj.type,
        obj.batchNo,
        obj.changliang,
        obj.filterVentCoef,
        obj.filterPressureCoef,
        obj.permeabilityCoef,
        obj.quantitativeCoef,
        obj.citrateCoef,
        obj.potassiumCoef,
        now.getTime(),
        now.getTime()
      )

    return this.getHarmfulById(result.lastInsertRowid as number)!
  }
  // 多因素卷烟 查询所有
  public getAllCigarettes(): schema.Cigarettes[] {
    const results = this.sqlite
      .prepare('SELECT * FROM cigarettes ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => ({
      id: result.id as number,
      code: result.code as string,
      filterVentilation: result.filter_ventilation as string,
      filterPressureDrop: result.filter_pressure_drop as number,
      permeability: result.permeability as string,
      quantitative: result.quantitative as string,
      citrate: result.citrate as string,
      potassiumRatio: result.potassium_ratio as string,
      tar: result.tar as string,
      nicotine: result.nicotine as string,
      co: result.co as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }


  // 多因素卷烟 查询
  public getCigarettes(code: string): schema.Cigarettes[] {
    const results = this.sqlite
      .prepare('SELECT * FROM cigarettes WHERE code like ? ORDER BY created_at DESC')
      .all(`%${code}%`) as Record<string, unknown>[]
    return results.map((result) => ({
      id: result.id as number,
      code: result.code as string,
      filterVentilation: result.filter_ventilation as string,
      filterPressureDrop: result.filter_pressure_drop as number,
      permeability: result.permeability as string,
      quantitative: result.quantitative as string,
      citrate: result.citrate as string,
      potassiumRatio: result.potassium_ratio as string,
      tar: result.tar as string,
      nicotine: result.nicotine as string,
      co: result.co as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }
  // 多因素卷烟 单个删除
  public async deleteCigarettes(id: number): Promise<void> {
    const result = this.sqlite.prepare('DELETE FROM cigarettes WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('cigarettes not found')
    }
  }
  // 多因素卷烟 id查询
  public getCigarettesById(id: number): schema.Cigarettes | undefined {
    const result = this.sqlite.prepare('SELECT * FROM cigarettes WHERE id = ?').get(id) as Record<
      string,
      unknown
    >
    if (!result) return undefined

    return {
      id: result.id as number,
      code: result.code as string,
      filterVentilation: result.filter_ventilation as string,
      filterPressureDrop: result.filter_pressure_drop as number,
      permeability: result.permeability as string,
      quantitative: result.quantitative as string,
      citrate: result.citrate as string,
      potassiumRatio: result.potassium_ratio as string,
      tar: result.tar as string,
      nicotine: result.nicotine as string,
      co: result.co as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
  // 多因素卷烟 新增
  public async createCigarettes(obj: schema.Cigarettes): Promise<schema.Cigarettes> {
    const now = new Date()
    const result = this.sqlite
      .prepare(
        `
      INSERT INTO cigarettes (
            code, filter_ventilation, filter_pressure_drop, permeability, quantitative,
            citrate, potassium_ratio, tar, nicotine, co, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        obj.code,
        obj.filterVentilation,
        obj.filterPressureDrop,
        obj.permeability,
        obj.quantitative,
        obj.citrate,
        obj.potassiumRatio,
        obj.tar,
        obj.nicotine,
        obj.co,
        now.getTime(),
        now.getTime()
      )

    return this.getCigarettesById(result.lastInsertRowid as number)!
  }

  // 生成有害成分系数
  public async generate(): Promise<void> {
    const harmful = this.sqlite
      .prepare('SELECT COUNT(*) as count FROM harmful_constants')
      .get() as {
      count: number
    }
    let batchNo = 0
    if (harmful.count !== 0) {
      // 查询出最大的type值
      const maxType = this.sqlite
        .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants')
        .get() as {
        batchNo: number
      }
      batchNo = maxType.batchNo + 1
    }
    const cigarettes = this.getAllCigarettes()

    // X: 自变量 [filterVentilation, filterPressureDrop, permeability, quantitative, citrate]
    const X: number[][] = cigarettes.map((c: schema.Cigarettes) => [
      new Decimal(c.filterVentilation).toNumber(),
      new Decimal(c.filterPressureDrop).toNumber(),
      new Decimal(c.permeability).toNumber(),
      new Decimal(c.quantitative).toNumber(),
      new Decimal(c.citrate).toNumber()
    ])
    // Y 因变量矩阵
    const Y: number[][] = cigarettes.map((c: schema.Cigarettes) => [
      new Decimal(c.tar).toNumber(),
      new Decimal(c.nicotine).toNumber(),
      new Decimal(c.co).toNumber()
    ])

    // === 回归计算 ===
    const regression = new MultivariateLinearRegression(X, Y)

    // === 预测一个样本 ===
    if (X.length > 0) {
      const prediction = regression.predict(X[0])
      console.log('预测第一个样本的 Y:', prediction)
    }
    const targetNames = ['tar', 'nicotine', 'co']
    targetNames.forEach((_, targetIndex) => {
      // 截距是最后一行 常量
      const changliang = regression.weights[5]?.[targetIndex].toString() || '0'
      const filterVentCoef = regression.weights[0]?.[targetIndex]?.toString() || '0'
      const filterPressureCoef = regression.weights[1]?.[targetIndex].toString() || '0'
      const permeabilityCoef = regression.weights[2]?.[targetIndex].toString() || '0'
      const quantitativeCoef = regression.weights[3]?.[targetIndex].toString() || '0'
      const citrateCoef = regression.weights[4]?.[targetIndex].toString() || '0'

      // 创建有害物质常量实体
      const harmfulConstants: schema.HarmfulConstants = {
        id: 0, // Placeholder ID, will be replaced by the database
        createdAt: new Date(), // Current timestamp
        updatedAt: new Date(), // Current timestamp
        type: targetNames[targetIndex], // 根据实际情况设置类型
        batchNo: batchNo.toString(), // 生成批次号
        changliang: changliang.toString(),
        filterVentCoef: filterVentCoef.toString(),
        filterPressureCoef: filterPressureCoef.toString(),
        permeabilityCoef: permeabilityCoef.toString(),
        quantitativeCoef: quantitativeCoef.toString(),
        citrateCoef: citrateCoef.toString(),
        potassiumCoef: 'null' // Default value for potassiumCoef
      }
      const now = new Date()
      this.sqlite
        .prepare(
          `
    INSERT INTO harmful_constants (
      type, batch_no, changliang,
      filter_vent_coef, filter_pressure_coef, permeability_coef,
      quantitative_coef, citrate_coef, potassium_coef,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
        )
        .run(
          harmfulConstants.type,
          harmfulConstants.batchNo,
          harmfulConstants.changliang,
          harmfulConstants.filterVentCoef,
          harmfulConstants.filterPressureCoef,
          harmfulConstants.permeabilityCoef,
          harmfulConstants.quantitativeCoef,
          harmfulConstants.citrateCoef,
          harmfulConstants.potassiumCoef,
          now.getTime(),
          now.getTime()
        )
    })
  }

  // 仿真预测
  public async findDerivation(scientificData: schema.ScientificDataDto): Promise<void> {
    // 获取最新批次号
    const maxType = this.sqlite
      .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants')
      .get() as {
      batchNo: string
    }
    const batchNo = maxType.batchNo
    const harmfulConstants = this.getHarmfulbatchNo(batchNo)
    if (!harmfulConstants) {
      throw new Error('Harmful constants not found for the latest batch')
    }
    // 转换系数数据结构
    const coefficients = this.transformCoefficients(harmfulConstants)

    // 执行预测计算
    const result = this.calculatePredictions(scientificData, coefficients)

    return result
  }

  public async transformCoefficients(
    harmfulConstants: schema.HarmfulConstants[]
  ): Promise<schema.HarmfulConstants[]> {
    // 根据实际数据库结构调整字段映射
    return harmfulConstants.map((item) => ({
      id: item.id,
      type: item.type,
      batchNo: item.batchNo,
      changliang: item.changliang,
      filterVentCoef: item.filterVentCoef,
      filterPressureCoef: item.filterPressureCoef,
      permeabilityCoef: item.permeabilityCoef,
      quantitativeCoef: item.quantitativeCoef,
      citrateCoef: item.citrateCoef,
      potassiumCoef: item.potassiumCoef,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }
  // 预测计算
  public async calculatePredictions(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): Promise<any[]> {
    // const { auxiliary, auxiliaryList, harmful } = scientificData
    const byBatch = coefficients

    // 基准数据预测
    const actual = this.predicted(scientificData, byBatch)

    // 对每个辅助数据进行预测
    const actualfores = this.predicted(scientificData, byBatch)

    // 计算比例并处理数据
    const list = []
    for (let i = 0; i < actualfores.length; i++) {
      harmfulView.id = scientificData.auxiliaryList[i].id
       const harmfulView = this.dataProcessing(scientificData, actual, actualfores[i])
      list.push(harmfulView)
    }

    return list
  }

  // 基准参数函数
  public async predicted(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): Promise<number[]> {
    return coefficients.map(
      (coefficient) =>
        Number(coefficient.changliang) +
        Number(scientificData.filterVentilation1) * Number(coefficient.filterVentCoef) +
        Number(scientificData.filterPressureDrop1) * Number(coefficient.filterPressureCoef) +
        Number(scientificData.permeability1) * Number(coefficient.permeabilityCoef) +
        Number(scientificData.quantitative1) * Number(coefficient.quantitativeCoef) +
        Number(scientificData.citrate1) * Number(coefficient.citrateCoef)
    )
  }

  // 预测参数函数
  public async predicted2(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): Promise<number[]> {
    return coefficients.map(
      (coefficient) =>
        Number(coefficient.changliang) +
        Number(scientificData.filterVentilation2) * Number(coefficient.filterVentCoef) +
        Number(scientificData.filterPressureDrop2) * Number(coefficient.filterPressureCoef) +
        Number(scientificData.permeability2) * Number(coefficient.permeabilityCoef) +
        Number(scientificData.quantitative2) * Number(coefficient.quantitativeCoef) +
        Number(scientificData.citrate2) * Number(coefficient.citrateCoef)
    )
  }


  // 数据处理函数
  public async dataProcessing(actual, actualfores, harmful) {
    const harmfulView = {}

    // 格式化数字并计算比例
    const formatNumber = (num: number): number => parseFloat(num.toFixed(2))

    harmfulView.tar = formatNumber((harmful.tar / actual[1]) * actualfores[1])

    harmfulView.nicotine = formatNumber((harmful.nicotine / actual[2]) * actualfores[2])

    harmfulView.carbonMonoxide = formatNumber((harmful.carbonMonoxide / actual[3]) * actualfores[3])

    return harmfulView
  }
}

// 导出单例实例
export const db = DatabaseService.getInstance()
export { schema }
