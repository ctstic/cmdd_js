import { db, schema } from '..'

export class SimulationPredictionSaveService {
  private sqlite = db.getSqliteInstance()

  /**
   * 获取所有仿真预测保存记录
   * @returns 仿真预测保存记录列表
   */
  public getAllSimulationPredictions(): schema.SimulationPredictionSave[] {
    const results = this.sqlite
      .prepare('SELECT * FROM simulation_prediction_save ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => this.mapToSimulationPredictionSave(result))
  }

  /**
   * 根据ID获取仿真预测保存记录
   * @param id 记录ID
   * @returns 仿真预测保存记录
   */
  public getSimulationPredictionById(id: number): schema.SimulationPredictionSave | null {
    const result = this.sqlite
      .prepare('SELECT * FROM simulation_prediction_save WHERE id = ?')
      .get(id) as Record<string, unknown>

    if (!result) {
      return null
    }

    return this.mapToSimulationPredictionSave(result)
  }

  public async create(scientificData: schema.ScientificDataDto): Promise<any> {
    const now = new Date()
    const sima: schema.SimulationPredictionSave = {
      id: 0, // 未使用数据
      createdAt: now, // 未使用数据
      updatedAt: now, // 未使用数据
      specimenName: scientificData.specimenName,
      filterVentilation: scientificData.standardParams.filterVentilation,
      filterPressureDrop: Number(scientificData.standardParams.filterPressureDrop),
      permeability: scientificData.standardParams.permeability,
      quantitative: scientificData.standardParams.quantitative,
      citrate: scientificData.standardParams.citrate,
      tar: scientificData.standardParams.tar,
      nicotine: scientificData.standardParams.nicotine,
      co: scientificData.standardParams.co,
      profile: scientificData.predictionParams
    }
    this.createSimulationPrediction(sima)
  }

  /**
   * 创建新的仿真预测保存记录
   * @param obj 仿真预测保存记录对象
   * @returns 新创建的记录ID
   */
  public async createSimulationPrediction(obj: schema.SimulationPredictionSave): Promise<number> {
    const now = new Date()
    const result = this.sqlite
      .prepare(
        `
      INSERT INTO simulation_prediction_save (
        specimen_name,filter_ventilation, filter_pressure_drop, permeability, quantitative,
        citrate, tar, nicotine, co, profile, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        obj.specimenName,
        obj.filterVentilation,
        obj.filterPressureDrop,
        obj.permeability,
        obj.quantitative,
        obj.citrate,
        obj.tar,
        obj.nicotine,
        obj.co,
        JSON.stringify(obj.profile),
        now.getTime(),
        now.getTime()
      )

    return result.lastInsertRowid as number
  }

  /**
   * 删除仿真预测保存记录
   * @param id 记录ID
   */
  public async deleteSimulationPrediction(id: number): Promise<void> {
    this.sqlite.prepare('DELETE FROM simulation_prediction_save WHERE id = ?').run(id)
  }

  /**
   * 将数据库查询结果映射为SimulationPredictionSave对象
   * @param result 数据库查询结果
   * @returns SimulationPredictionSave对象
   */
  private mapToSimulationPredictionSave(
    result: Record<string, unknown>
  ): schema.SimulationPredictionSave {
    return {
      id: result.id as number,
      specimenName: result.specimen_name as string,
      filterVentilation: result.filter_ventilation as string,
      filterPressureDrop: result.filter_pressure_drop as number,
      permeability: result.permeability as string,
      quantitative: result.quantitative as string,
      citrate: result.citrate as string,
      tar: result.tar as string,
      nicotine: result.nicotine as string,
      co: result.co as string,
      profile:
        typeof result.profile === 'string' ? JSON.parse(result.profile as string) : result.profile,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
}

// 导出单例实例
export const simulationPredictionSaveService = new SimulationPredictionSaveService()
