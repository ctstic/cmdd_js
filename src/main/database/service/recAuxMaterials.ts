import { schema } from '..'
import { harmfulService } from './harmfulService'
import { simulationPredictionService } from './simulationPredictionService'

// 工具方法：区间 + 步长 → 数组
function generateRange(start: number, end: number, step: number): number[] {
  const values: number[] = []
  for (let v = start; v <= end; v = parseFloat((v + step).toFixed(10))) {
    values.push(v)
  }
  return values
}

/**
 * 推荐辅材参数计算类
 */
export class RecAuxMaterials {
  private stepParams = {
    filterVentilation: 0.05, // 滤嘴通风率步长
    filterPressureDrop: 200, // 滤棒压降步长
    permeability: 5, // 透气度步长
    quantitative: 2, // 定量步长
    citrate: 0.004 // 柠檬酸根步长
  }
  /**
   * 查找推荐辅材设计
   * @param dto 输入参数（基准 + 目标 + 范围）
   */
  async findMaterialDesign(dto: schema.AuxMaterialsDto): Promise<any[]> {
    const result: any = {
      success: false,
      errors: '',
      data: []
    }
    dto.standardParams.filterVentilation = (Number(dto.standardParams.filterVentilation) / 100)
      .toFixed(3)
      .toString()
    dto.standardParams.citrate = (Number(dto.standardParams.citrate) / 100).toFixed(3).toString()

    dto.standardDesignParams.filterVentilation = dto.standardDesignParams.filterVentilation.map(
      (v) => parseFloat((v / 100).toFixed(3))
    ) as [number, number]
    dto.standardDesignParams.citrate = dto.standardDesignParams.citrate.map((v) =>
      parseFloat((v / 100).toFixed(3))
    ) as [number, number]
    // 1️⃣ 获取最新批次的有害成分系数
    const harmfulConstants = harmfulService.getLatestBatchCoefficients()

    if (!harmfulConstants || harmfulConstants.length === 0) {
      result.errors = '未找到最新批次的有害成分系数数据'
      return result
    }

    // 转换系数数据结构
    const coefficients = harmfulService.transformCoefficients(harmfulConstants)

    const { standardParams, targetParams, standardDesignParams } = dto
    const results: any[] = []

    // ⚡ 根据范围+步长生成数组
    const fvList = generateRange(
      standardDesignParams.filterVentilation[0],
      standardDesignParams.filterVentilation[1],
      this.stepParams.filterVentilation
    )
    const fpList = generateRange(
      standardDesignParams.filterPressureDrop[0],
      standardDesignParams.filterPressureDrop[1],
      this.stepParams.filterPressureDrop
    )
    const pmList = generateRange(
      standardDesignParams.permeability[0],
      standardDesignParams.permeability[1],
      this.stepParams.permeability
    )
    const qtList = generateRange(
      standardDesignParams.quantitative[0],
      standardDesignParams.quantitative[1],
      this.stepParams.quantitative
    )
    const ctList = generateRange(
      standardDesignParams.citrate[0],
      standardDesignParams.citrate[1],
      this.stepParams.citrate
    )
    // 3️⃣ 预测基准有害成分
    const prediction = await simulationPredictionService.predictBaseline(
      standardParams,
      coefficients
    )

    // 4️⃣ 计算基准比例
    const scaledPrediction = {
      co: Number(standardParams.co) / Number(prediction[0]),
      nicotine: Number(standardParams.nicotine) / Number(prediction[1]),
      tar: Number(standardParams.tar) / Number(prediction[2])
    }
    // 穷举所有组合
    for (const fv of fvList) {
      for (const fp of fpList) {
        for (const pm of pmList) {
          for (const qt of qtList) {
            for (const ct of ctList) {
              const designParams = {
                ...targetParams,
                filterVentilation: fv.toString(),
                filterPressureDrop: fp.toString(),
                permeability: pm.toString(),
                quantitative: qt.toString(),
                citrate: ct.toString()
              }
              // 调用预测服务
              const prediction = await simulationPredictionService.predictBaseline(
                designParams,
                coefficients
              )
              // 计算与目标的加权误差
              const diff =
                Number(targetParams.tarWeight) *
                  Math.abs((scaledPrediction.tar * prediction[2]) / Number(targetParams.tar) - 1) +
                Number(targetParams.nicotineWeight) *
                  Math.abs(
                    (scaledPrediction.nicotine * prediction[1]) / Number(targetParams.nicotine) - 1
                  ) +
                Number(targetParams.coWeight) *
                  Math.abs((scaledPrediction.co * prediction[0]) / Number(targetParams.co) - 1)
              // 存储结果
              results.push({ designParams, prediction, diff })
            }
          }
        }
      }
    }

    // 按 diff 从小到大排序（绝对值最小的最优）
    results.sort((a, b) => a.diff - b.diff)
    const topResults = results.slice(0, dto.count || 100)
    result.success = true
    result.data = topResults
    return result
  }
}

export const recAuxMaterials = new RecAuxMaterials()
