import { schema } from '..'
import { harmfulService } from './harmfulService'
import { simulationPredictionSaveService } from './simulationPredictionSaveService'

/**
 * 仿真预测计算服务类
 * 处理预测计算相关的业务逻辑
 */
export class SimulationPredictionService {
  /**
   * 仿真预测计算主方法
   * 根据科学数据进行有害成分预测
   * @param scientificData 科学数据输入
   * @returns 预测结果列表
   */
  public async calculatePredictions(scientificData: schema.ScientificDataDto): Promise<any> {
    const result: any = {
      success: false,
      errors: '',
      data: []
    }
    scientificData.standardParams.filterVentilation = (
      Number(scientificData.standardParams.filterVentilation) / 100
    )
      .toFixed(3)
      .toString()
    scientificData.standardParams.citrate = (Number(scientificData.standardParams.citrate) / 100)
      .toFixed(3)
      .toString()

    for (const param of scientificData.predictionParams) {
      param.filterVentilation = (Number(param.filterVentilation) / 100).toFixed(3).toString()
      param.citrate = (Number(param.citrate) / 100).toFixed(3).toString()
    }

    console.log('🚀 ~ scientificData:', scientificData)
    // 获取最新批次的系数
    const harmfulConstants = harmfulService.getLatestBatchCoefficients(scientificData.specimenName)

    if (!harmfulConstants || harmfulConstants.length === 0) {
      result.errors = '未找到最新批次的有害成分系数数据'
      return result
    }

    // 转换系数数据结构
    const coefficients = harmfulService.transformCoefficients(harmfulConstants)

    // 执行预测计算
    // const result = this.performPredictionCalculation(scientificData, coefficients)
    result.success = true
    result.data = await this.performPredictionCalculation(scientificData, coefficients)
    return result
  }

  /**
   * 执行预测计算核心逻辑
   * @param scientificData 科学数据输入
   * @param coefficients 系数系数数据
   * @returns 预测结果数组
   */
  public async performPredictionCalculation(
    scientificData: schema.ScientificDataDto,
    coefficients: schema.HarmfulConstants[]
  ): Promise<schema.StandardParams[]> {
    // 基准数据预测（使用标准参数）
    const baselinePredictions = this.predictBaseline(scientificData.standardParams, coefficients)

    const results: schema.StandardParams[] = []

    // 对每组预测参数进行计算
    for (let i = 0; i < scientificData.predictionParams.length; i++) {
      const predictionParam = scientificData.predictionParams[i]

      // 目标参数预测数据计算（使用当前预测参数对象）
      const targetPredictions = this.predictTarget(predictionParam, coefficients)

      // 计算有害成分预测结果
      const harmfulPrediction = this.processHarmfulData(
        scientificData.standardParams,
        baselinePredictions,
        targetPredictions,
        predictionParam
      )

      results.push(harmfulPrediction)
    }

    return results
  }

  /**
   * 基准参数预测函数
   * 使用标准参数进行预测计算
   * @param standardParams 标准参数
   * @param coefficients 系数数据
   * @returns 预测结果数组
   */
  public predictBaseline(
    standardParams: schema.StandardParams,
    coefficients: schema.HarmfulConstants[]
  ): number[] {
    return coefficients.map(
      (coefficient) =>
        Number(coefficient.changliang) +
        Number(standardParams.filterVentilation) * Number(coefficient.filterVentCoef) +
        Number(standardParams.filterPressureDrop) * Number(coefficient.filterPressureCoef) +
        Number(standardParams.permeability) * Number(coefficient.permeabilityCoef) +
        Number(standardParams.quantitative) * Number(coefficient.quantitativeCoef) +
        Number(standardParams.citrate) * Number(coefficient.citrateCoef)
    )
  }

  /**
   * 目标参数预测函数
   * 使用预测参数对象进行预测计算
   * @param predictionParam 预测参数对象
   * @param coefficients 系数数据
   * @returns 预测结果数组
   */
  private predictTarget(
    predictionParam: schema.PredictionParams,
    coefficients: schema.HarmfulConstants[]
  ): number[] {
    return coefficients.map(
      (coefficient) =>
        Number(coefficient.changliang) +
        Number(predictionParam.filterVentilation) * Number(coefficient.filterVentCoef) +
        Number(predictionParam.filterPressureDrop) * Number(coefficient.filterPressureCoef) +
        Number(predictionParam.permeability) * Number(coefficient.permeabilityCoef) +
        Number(predictionParam.quantitative) * Number(coefficient.quantitativeCoef) +
        Number(predictionParam.citrate) * Number(coefficient.citrateCoef)
    )
  }

  /**
   * 有害成分数据处理函数
   * 根据基准值和预测值计算最终的有害成分含量
   * @param standardParams 标准参数
   * @param baselinePredictions 基准预测值
   * @param targetPredictions 目标预测值
   * @param index 当前处理的索引
   * @returns 处理后的有害成分数据
   */
  private processHarmfulData(
    standardParams: schema.StandardParams,
    baselinePredictions: number[],
    targetPredictions: number[],
    predictionParam: schema.StandardParams
  ): schema.StandardParams {
    // 格式化数字并计算比例的辅助函数
    const formatNumber = (num: number): number => parseFloat(num.toFixed(2))

    // 获取基准值（标准参数中的有害成分值）
    const baselineTar = Number(standardParams.tar) || 1
    const baselineNicotine = Number(standardParams.nicotine) || 1
    const baselineCo = Number(standardParams.co) || 1

    // 防止除零错误的安全除法
    const safeDivision = (numerator: number, denominator: number): number => {
      return denominator === 0 ? 0 : numerator / denominator
    }

    // 计算一氧化碳含量 (索引0对应co)
    predictionParam.co = formatNumber(
      safeDivision(baselineCo, baselinePredictions[0]) * targetPredictions[0]
    ).toString()

    // 计算尼古丁含量 (索引1对应nicotine)
    predictionParam.nicotine = formatNumber(
      safeDivision(baselineNicotine, baselinePredictions[1]) * targetPredictions[1]
    ).toString()

    // 计算焦油含量 (索引2对应tar)
    predictionParam.tar = formatNumber(
      safeDivision(baselineTar, baselinePredictions[2]) * targetPredictions[2]
    ).toString()
    return predictionParam
  }

  /**
   * 导出预测结果
   * 根据基准值和预测值计算最终的有害成分含量
   * @param scientificData 标准参数
   * @returns 处理后的有害成分数据
   */
  public async exportResult(scientificData: schema.ScientificDataDto): Promise<any> {
    const results: schema.exportSimDto[] = []
    scientificData.standardParams.key = scientificData.specimenName
    results.push(this.mapToExportSimDto(scientificData.standardParams, '基准数据'))
    scientificData.predictionParams.map((result) => {
      result.key = scientificData.specimenName
      results.push(this.mapToExportSimDto(result, '预测数据'))
    })
    simulationPredictionSaveService.export(results)
  }

  private mapToExportSimDto(result: schema.StandardParams, datatype: string): schema.exportSimDto {
    return {
      模型类别: result.key as string,
      数据类别: datatype as string,
      滤嘴通风率: result.filterVentilation as string,
      滤棒压降: result.filterPressureDrop as string,
      卷烟纸透气度: result.permeability as string,
      卷烟纸定量: result.quantitative as string,
      卷烟纸助燃剂含量: result.citrate as string,
      焦油: result.tar as string,
      烟碱: result.nicotine as string,
      CO: result.co as string
    }
  }
}
// 导出仿真预测服务单例实例
export const simulationPredictionService = new SimulationPredictionService()
