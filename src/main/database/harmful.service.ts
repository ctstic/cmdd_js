// harmful.service.ts
import { database } from './database'
import * as schema from './schema'
import { cigaretteService } from './cigarette.service'
import Decimal from 'decimal.js'
import MultivariateLinearRegression from 'ml-regression-multivariate-linear'

export class HarmfulService {
  // 卷烟有害成分 查询
  public getHarmfulbatchNo(batchNo: string): schema.HarmfulConstants[] {
    const results = database.sqlite
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
    const result = database.sqlite.prepare('DELETE FROM harmful_constants WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('harmful_constants not found')
    }
  }
  // 卷烟有害成分 id查询
  public getHarmfulById(id: number): schema.HarmfulConstants | undefined {
    const result = database.sqlite
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
    const result = database.sqlite
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

  // 生成有害成分系数
  public async generate(): Promise<void> {
    const harmful = database.sqlite
      .prepare('SELECT COUNT(*) as count FROM harmful_constants')
      .get() as {
      count: number
    }
    let batchNo = 0
    if (harmful.count !== 0) {
      // 查询出最大的type值
      const maxType = database.sqlite
        .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants')
        .get() as {
        batchNo: number
      }
      batchNo = maxType.batchNo + 1
    }
    const cigarettes = cigaretteService.getAllCigarettes()

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
      database.sqlite
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
}

export const harmfulService = new HarmfulService()
