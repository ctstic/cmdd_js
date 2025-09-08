// prediction.service.ts
import { harmfulService } from './harmful.service'
import { database } from './database'
import * as schema from './schema'

interface PredictionResult {
  id?: string
  tar: number
  nicotine: number
  carbonMonoxide: number
}

// 单个预测参数接口（用于内部计算）
interface SinglePredictionData {
  filterVentilation1: string
  filterPressureDrop1: string
  permeability1: string
  quantitative1: string
  citrate1: string
  tar1: string
  nicotine1: string
  co1: string
  // 单个预测值（非数组）
  filterVentilation2: string
  filterPressureDrop2: string
  permeability2: string
  quantitative2: string
  citrate2: string
}

export class PredictionService {
  public async findDerivation(
    scientificData: schema.ScientificDataDto
  ): Promise<PredictionResult[]> {
    try {
      // 获取最新批次号
      const maxType = database.sqlite
        .prepare('SELECT MAX(batch_no) as batchNo FROM harmful_constants')
        .get() as { batchNo: string }

      const batchNo = maxType.batchNo
      const harmfulConstants = harmfulService.getHarmfulbatchNo(batchNo)

      if (!harmfulConstants) {
        throw new Error('Harmful constants not found for the latest batch')
      }

      // 转换系数数据结构
      const coefficients = await this.transformCoefficients(harmfulConstants)

      // 执行预测计算
      const result = await this.calculatePredictions(scientificData, coefficients)

      return result
    } catch (error) {
      console.error('仿真预测失败:', error)
      throw error
    }
  }

  // 预测计算（修改后支持数组）
  public async calculatePredictions(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): Promise<PredictionResult[]> {
    // 基准数据预测
    const baselinePrediction = await this.predictBaseline(scientificData, coefficients)

    // 验证数组长度一致性
    const arrayLength = scientificData.filterVentilation2.length
    const arrays = [
      scientificData.filterVentilation2,
      scientificData.filterPressureDrop2,
      scientificData.permeability2,
      scientificData.quantitative2,
      scientificData.citrate2
    ]

    // 检查所有数组长度是否一致
    if (!arrays.every((arr) => arr.length === arrayLength)) {
      throw new Error('所有预测参数数组长度必须一致')
    }

    // 对每组预测参数进行计算
    const results: PredictionResult[] = []

    for (let i = 0; i < arrayLength; i++) {
      // 构建当前索引的预测数据
      const currentPredictionData = {
        ...scientificData,
        filterVentilation2: scientificData.filterVentilation2[i],
        filterPressureDrop2: scientificData.filterPressureDrop2[i],
        permeability2: scientificData.permeability2[i],
        quantitative2: scientificData.quantitative2[i],
        citrate2: scientificData.citrate2[i]
      }

      // 对当前数据进行预测
      const currentPrediction = await this.predictParameters(currentPredictionData, coefficients)

      // 数据处理和比例计算
      const harmfulView = await this.dataProcessing(baselinePrediction, currentPrediction, {
        tar: Number(scientificData.tar1),
        nicotine: Number(scientificData.nicotine1),
        carbonMonoxide: Number(scientificData.co1)
      })

      // 如果有ID信息，可以设置
      // harmfulView.id = scientificData.auxiliaryList?.[i]?.id

      results.push(harmfulView)
    }

    return results
  }

  // 基准参数预测函数
  public async predictBaseline(
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
      // + Number(scientificData.potassiumRatio1) * Number(coefficient.potassiumCoef)
    )
  }

  // 预测参数函数（修改为支持单个值）
  public async predictParameters(
    scientificData: SinglePredictionData,
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

  // 数据处理函数（修复了变量声明错误）
  public async dataProcessing(
    baselinePrediction: number[],
    currentPrediction: number[],
    harmfulData: { tar: number; nicotine: number; carbonMonoxide: number }
  ): Promise<PredictionResult> {
    // 格式化数字函数
    const formatNumber = (num: number): number => {
      if (isNaN(num) || !isFinite(num)) return 0
      return parseFloat(num.toFixed(2))
    }

    // 安全的除法运算
    const safeDivision = (numerator: number, denominator: number): number => {
      if (denominator === 0 || isNaN(denominator)) return 0
      return numerator / denominator
    }

    const result: PredictionResult = {
      tar: formatNumber(
        harmfulData.tar * safeDivision(currentPrediction[0] || 0, baselinePrediction[0] || 1)
      ),
      nicotine: formatNumber(
        harmfulData.nicotine * safeDivision(currentPrediction[1] || 0, baselinePrediction[1] || 1)
      ),
      carbonMonoxide: formatNumber(
        harmfulData.carbonMonoxide *
          safeDivision(currentPrediction[2] || 0, baselinePrediction[2] || 1)
      )
    }

    return result
  }
  // 转换系数数据结构
  public async transformCoefficients(
    harmfulConstants: schema.HarmfulConstants[]
  ): Promise<schema.HarmfulConstants[]> {
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
}

export const predictionService = new PredictionService()
