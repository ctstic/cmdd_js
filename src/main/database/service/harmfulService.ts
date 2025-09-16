/**
 * 有害成分系数业务逻辑服务类
 * 负责有害成分系数的基本CRUD操作和系数生成
 * 包括系数的增删改查、生成等功能
 */

import { db, schema } from '..'
import { cigarettesService } from './cigarettesService'
import MultivariateLinearRegression from 'ml-regression-multivariate-linear'
import Decimal from 'decimal.js'

/**
 * 有害成分系数业务逻辑服务类
 * 提供有害成分系数相关的数据操作方法
 */
export class HarmfulService {
  private sqlite = db.getSqliteInstance()

  /**
   * 根据类型查询有害成分系数
   * @param type 有害成分类型
   * @returns 有害成分系数列表
   */
  public getHarmful(type: string): schema.HarmfulConstants[] {
    const results = this.sqlite
      .prepare('SELECT * FROM harmful_constants WHERE type like ? ORDER BY created_at DESC')
      .all(`%${type}%`) as Record<string, unknown>[]

    return results.map((result) => this.mapToHarmfulConstants(result))
  }

  /**
   * 根据批次号查询有害成分系数
   * @param batchNo 批次号
   * @returns 有害成分系数列表
   */
  public getHarmfulByBatchNo(batchNo: string): schema.HarmfulConstants[] {
    const results = this.sqlite
      .prepare('SELECT * FROM harmful_constants WHERE batch_no = ? ORDER BY type')
      .all(batchNo) as Record<string, unknown>[]

    return results.map((result) => this.mapToHarmfulConstants(result))
  }

  /**
   * 获取最新批次号的有害成分系数
   * @returns 最新批次的有害成分系数列表
   */
  public getLatestBatchCoefficients(): schema.HarmfulConstants[] {
    const maxBatchResult = this.sqlite
      .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants ORDER BY created_at DESC')
      .get() as { batchNo: string }

    if (!maxBatchResult.batchNo) {
      return []
    }

    return this.getHarmfulByBatchNo(maxBatchResult.batchNo)
  }

  /**
   * 删除有害成分系数记录
   * @param id 系数ID
   */
  public async deleteHarmful(id: number): Promise<void> {
    const result = this.sqlite.prepare('DELETE FROM harmful_constants WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('有害成分系数不存在')
    }
  }

  /**
   * 生成有害成分系数
   * 基于现有卷烟数据，使用多元线性回归算法生成系数
   */
  public async generate(): Promise<void> {
    // 检查现有系数数量，确定新批次号
    const harmful = this.sqlite
      .prepare('SELECT COUNT(*) as count FROM harmful_constants')
      .get() as { count: number }

    let batchNo = 1
    if (harmful.count !== 0) {
      // 查询出最大的批次号
      const maxType = this.sqlite
        .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants')
        .get() as { batchNo: number }
      batchNo = Number(maxType.batchNo) + 1
    }

    // 获取所有卷烟数据进行回归分析
    const cigarettes = cigarettesService.getCigarettesAll()

    // 构建自变量矩阵 X: [滤嘴通风度, 滤嘴压降, 透气度, 定量, 柠檬酸盐]
    const X: number[][] = cigarettes.map((c: schema.Cigarettes) => [
      new Decimal(c.filterVentilation).toNumber(),
      new Decimal(c.filterPressureDrop).toNumber(),
      new Decimal(c.permeability).toNumber(),
      new Decimal(c.quantitative).toNumber(),
      new Decimal(c.citrate).toNumber()
    ])

    // 构建因变量矩阵 Y: [焦油, 尼古丁, 一氧化碳]
    const Y: number[][] = cigarettes.map((c: schema.Cigarettes) => [
      new Decimal(c.tar).toNumber(),
      new Decimal(c.nicotine).toNumber(),
      new Decimal(c.co).toNumber()
    ])

    // 执行多元线性回归计算
    const regression = new MultivariateLinearRegression(X, Y)

    // 验证预测结果（可选，用于调试）
    if (X.length > 0) {
      const prediction = regression.predict(X[0])
      console.log('预测第一个样本的 Y:', prediction)
    }

    // 为每个目标变量（焦油、尼古丁、一氧化碳）保存系数
    const targetNames = ['tar', 'nicotine', 'co']
    targetNames.forEach((_, targetIndex) => {
      // 获取回归系数
      const changliang = regression.weights[5]?.[targetIndex]?.toString() || '0' // 截距（常量项）
      const filterVentCoef = regression.weights[0]?.[targetIndex]?.toString() || '0'
      const filterPressureCoef = regression.weights[1]?.[targetIndex]?.toString() || '0'
      const permeabilityCoef = regression.weights[2]?.[targetIndex]?.toString() || '0'
      const quantitativeCoef = regression.weights[3]?.[targetIndex]?.toString() || '0'
      const citrateCoef = regression.weights[4]?.[targetIndex]?.toString() || '0'

      // 创建有害物质系数记录
      const harmfulConstants: schema.HarmfulConstants = {
        id: 0, // 占位符ID，将由数据库自动生成
        createdAt: new Date(),
        updatedAt: new Date(),
        type: targetNames[targetIndex],
        batchNo: batchNo.toString(),
        changliang: changliang.toString(),
        filterVentCoef: filterVentCoef.toString(),
        filterPressureCoef: filterPressureCoef.toString(),
        permeabilityCoef: permeabilityCoef.toString(),
        quantitativeCoef: quantitativeCoef.toString(),
        citrateCoef: citrateCoef.toString(),
        potassiumCoef: 'null' // 钾离子系数默认值
      }

      // 插入数据库
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

    console.log(`有害成分系数生成完成，批次号: ${batchNo}`)
  }

  /**
   * 转换系数数据结构
   * @param harmfulConstants 有害成分系数原始数据
   * @returns 转换后的系数数据
   */
  public transformCoefficients(
    harmfulConstants: schema.HarmfulConstants[]
  ): schema.HarmfulConstants[] {
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

  /**
   * 将数据库查询结果映射为HarmfulConstants对象
   * @param result 数据库查询结果
   * @returns HarmfulConstants对象
   */
  private mapToHarmfulConstants(result: Record<string, unknown>): schema.HarmfulConstants {
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
}

// 导出有害成分系数服务单例实例
export const harmfulService = new HarmfulService()
