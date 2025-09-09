/**
 * 有害成分系数服务层
 * 负责有害成分系数的业务逻辑操作
 * 包括系数的增删改查、生成、预测计算等功能
 */

import { db, schema } from '..'
import { cigarettesService } from './cigarettesService'
import MultivariateLinearRegression from 'ml-regression-multivariate-linear'
import Decimal from 'decimal.js'

/**
 * 有害成分系数业务逻辑服务类
 * 提供有害成分系数相关的所有数据操作和计算方法
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
      .prepare('SELECT * FROM harmful_constants WHERE type = ? ORDER BY created_at DESC')
      .all(`%${type}%`) as Record<string, unknown>[]

    return results.map((result) => this.mapToHarmfulConstants(result))
  }

  /**
   * 根据批次号查询有害成分系数
   * @param batchNo 批次号
   * @returns 有害成分系数列表
   */
  public getHarmfulbatchNo(batchNo: string): schema.HarmfulConstants[] {
    const results = this.sqlite
      .prepare('SELECT * FROM harmful_constants WHERE batch_no = ? ORDER BY created_at DESC')
      .all(batchNo) as Record<string, unknown>[]

    return results.map((result) => this.mapToHarmfulConstants(result))
  }

  /**
   * 根据ID获取有害成分系数
   * @param id 系数ID
   * @returns 有害成分系数或undefined
   */
  public getHarmfulById(id: number): schema.HarmfulConstants | undefined {
    const result = this.sqlite
      .prepare('SELECT * FROM harmful_constants WHERE id = ?')
      .get(id) as Record<string, unknown>
    if (!result) return undefined

    return this.mapToHarmfulConstants(result)
  }

  /**
   * 创建新的有害成分系数记录
   * @param obj 有害成分系数对象
   * @returns 创建的有害成分系数
   */
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
      .get() as {
      count: number
    }

    let batchNo = 0
    if (harmful.count !== 0) {
      // 查询出最大的批次号
      const maxType = this.sqlite
        .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants')
        .get() as {
        batchNo: number
      }
      batchNo = maxType.batchNo + 1
    }

    // 获取所有卷烟数据进行回归分析
    const cigarettes = cigarettesService.getAllCigarettes()

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
      const changliang = regression.weights[5]?.[targetIndex].toString() || '0' // 截距（常量项）
      const filterVentCoef = regression.weights[0]?.[targetIndex]?.toString() || '0'
      const filterPressureCoef = regression.weights[1]?.[targetIndex].toString() || '0'
      const permeabilityCoef = regression.weights[2]?.[targetIndex].toString() || '0'
      const quantitativeCoef = regression.weights[3]?.[targetIndex].toString() || '0'
      const citrateCoef = regression.weights[4]?.[targetIndex].toString() || '0'

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
   * 仿真预测计算
   * 根据科学数据和最新的系数进行有害成分预测
   * @param scientificData 科学数据输入
   * @returns 预测结果列表
   */
  public async findDerivation(scientificData: schema.ScientificDataDto): Promise<any[]> {
    // 获取最新批次号的系数
    const maxType = this.sqlite
      .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants')
      .get() as {
      batchNo: string
    }

    const batchNo = maxType.batchNo
    const harmfulConstants = this.getHarmfulbatchNo(batchNo)

    if (!harmfulConstants || harmfulConstants.length === 0) {
      throw new Error('未找到最新批次的有害成分系数数据')
    }

    // 转换系数数据结构
    const coefficients = this.transformCoefficients(harmfulConstants)

    // 执行预测计算
    const result = this.calculatePredictions(scientificData, coefficients)

    return result
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
   * 预测计算核心逻辑
   * @param scientificData 科学数据输入
   * @param coefficients 系数数据
   * @returns 预测结果数组
   */
  public calculatePredictions(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): any[] {
    // 基准数据预测
    const actual = this.predicted(scientificData, coefficients)

    // 预测数据计算
    const actualfores = this.predicted2(scientificData, coefficients)

    // 处理每个辅助数据并计算比例
    const list = []
    for (let i = 0; i < scientificData.auxiliaryList.length; i++) {
      const harmfulView = this.dataProcessing(
        scientificData,
        actual,
        actualfores,
        scientificData.auxiliaryList[i]
      )
      harmfulView.id = scientificData.auxiliaryList[i].id
      list.push(harmfulView)
    }

    return list
  }

  /**
   * 基准参数预测函数
   * 使用第一组参数进行预测计算
   * @param scientificData 科学数据
   * @param coefficients 系数数据
   * @returns 预测结果数组
   */
  public predicted(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): number[] {
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

  /**
   * 预测参数函数
   * 使用第二组参数进行预测计算
   * @param scientificData 科学数据
   * @param coefficients 系数数据
   * @returns 预测结果数组
   */
  public predicted2(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): number[] {
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

  /**
   * 数据处理函数
   * 根据基准值和预测值计算最终的有害成分含量
   * @param scientificData 科学数据
   * @param actual 基准预测值
   * @param actualfores 目标预测值
   * @param harmful 有害成分数据
   * @returns 处理后的有害成分数据
   */
  public dataProcessing(
    scientificData: schema.ScientificDataDto,
    actual: number[],
    actualfores: number[],
    harmful: any
  ): any {
    const harmfulView: any = {}

    // 格式化数字并计算比例的辅助函数
    const formatNumber = (num: number): number => parseFloat(num.toFixed(2))

    // 计算焦油含量 (索引0对应tar)
    harmfulView.tar = formatNumber((harmful.tar / actual[0]) * actualfores[0])

    // 计算尼古丁含量 (索引1对应nicotine)
    harmfulView.nicotine = formatNumber((harmful.nicotine / actual[1]) * actualfores[1])

    // 计算一氧化碳含量 (索引2对应co)
    harmfulView.carbonMonoxide = formatNumber((harmful.carbonMonoxide / actual[2]) * actualfores[2])

    return harmfulView
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

// 导出有害成分服务单例实例
export const harmfulService = new HarmfulService()
