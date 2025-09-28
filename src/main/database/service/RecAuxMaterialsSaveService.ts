import { db, schema } from '..'

export class RecAuxMaterialsSaveService {
  private sqlite = db.getSqliteInstance()

  /**
   * 获取所有推荐辅材参数保存记录
   * @returns 推荐辅材参数保存记录列表
   */
  public getAllRecAuxMaterials(): schema.RecAuxMaterialsSave[] {
    const results = this.sqlite
      .prepare('SELECT * FROM rec_aux_materials_save ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => this.mapToRecAuxMaterialsSave(result))
  }

  /**
   * 根据ID获取推荐辅材参数保存记录
   * @param id 记录ID
   * @returns 推荐辅材参数保存记录
   */
  public getRecAuxMaterialsById(id: number): schema.RecAuxMaterialsSave | null {
    const result = this.sqlite
      .prepare('SELECT * FROM rec_aux_materials_save WHERE id = ?')
      .get(id) as Record<string, unknown>

    if (!result) {
      return null
    }

    return this.mapToRecAuxMaterialsSave(result)
  }

  public async create(auxMaterialsDto: schema.AuxMaterialsDto): Promise<any> {
    const now = new Date()
    const aux: schema.RecAuxMaterialsSave = {
      id: 0, // 未使用数据
      createdAt: now, // 未使用数据
      updatedAt: now, // 未使用数据
      recommendNumber: auxMaterialsDto.count.toString(),
      specimenName: auxMaterialsDto.specimenName,
      filterVentilation: auxMaterialsDto.standardParams.filterVentilation,
      filterPressureDrop: Number(auxMaterialsDto.standardParams.filterPressureDrop),
      permeability: auxMaterialsDto.standardParams.permeability,
      quantitative: auxMaterialsDto.standardParams.quantitative,
      citrate: auxMaterialsDto.standardParams.citrate,
      tar: auxMaterialsDto.standardParams.tar,
      nicotine: auxMaterialsDto.standardParams.nicotine,
      co: auxMaterialsDto.standardParams.co,
      targetTar: auxMaterialsDto.targetParams.tar,
      targetNicotine: auxMaterialsDto.targetParams.tar,
      targetCo: auxMaterialsDto.targetParams.tar,
      tarWeight: auxMaterialsDto.targetParams.tarWeight,
      nicotineWeight: auxMaterialsDto.targetParams.nicotineWeight,
      coWeight: auxMaterialsDto.targetParams.coWeight,
      filterVentilationRanger: auxMaterialsDto.standardDesignParams.filterVentilation.join('-'),
      filterPressureDropRanger: auxMaterialsDto.standardDesignParams.filterPressureDrop.join('-'),
      permeabilityRanger: auxMaterialsDto.standardDesignParams.permeability.join('-'),
      quantitativeRanger: auxMaterialsDto.standardDesignParams.quantitative.join('-'),
      citrateRanger: auxMaterialsDto.standardDesignParams.citrate.join('-'),
      profile: auxMaterialsDto.recommendedValue
    }
    this.createRecAuxMaterials(aux)
  }

  /**
   * 创建新的推荐辅材参数保存记录
   * @param obj 推荐辅材参数保存记录对象
   * @returns 新创建的记录ID
   */
  public async createRecAuxMaterials(obj: schema.RecAuxMaterialsSave): Promise<number> {
    const now = new Date()
    const result = this.sqlite
      .prepare(
        `
      INSERT INTO rec_aux_materials_save (
        specimen_name, recommend_number, filter_ventilation, filter_pressure_drop,
        permeability, quantitative, citrate, tar, nicotine, co, target_tar,
        target_nicotine, target_co, tar_weight, nicotine_weight, co_weight,
        filter_ventilation_ranger, filter_pressure_drop_ranger, permeability_ranger,
        quantitative_ranger, citrate_ranger, potassium_ratio_ranger, profile,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        obj.specimenName,
        obj.recommendNumber,
        obj.filterVentilation,
        obj.filterPressureDrop,
        obj.permeability,
        obj.quantitative,
        obj.citrate,
        obj.tar,
        obj.nicotine,
        obj.co,
        obj.targetTar,
        obj.targetNicotine,
        obj.targetCo,
        obj.tarWeight,
        obj.nicotineWeight,
        obj.coWeight,
        obj.filterVentilationRanger,
        obj.filterPressureDropRanger,
        obj.permeabilityRanger,
        obj.quantitativeRanger,
        obj.citrateRanger,
        JSON.stringify(obj.profile),
        now.getTime(),
        now.getTime()
      )

    return result.lastInsertRowid as number
  }

  /**
   * 删除推荐辅材参数保存记录
   * @param id 记录ID
   */
  public async deleteRecAuxMaterials(id: number): Promise<void> {
    this.sqlite.prepare('DELETE FROM rec_aux_materials_save WHERE id = ?').run(id)
  }

  /**
   * 将数据库查询结果映射为RecAuxMaterialsSave对象
   * @param result 数据库查询结果
   * @returns RecAuxMaterialsSave对象
   */
  private mapToRecAuxMaterialsSave(result: Record<string, unknown>): schema.RecAuxMaterialsSave {
    return {
      id: result.id as number,
      specimenName: result.specimen_name as string,
      recommendNumber: result.recommend_number as string,
      filterVentilation: result.filter_ventilation as string,
      filterPressureDrop: result.filter_pressure_drop as number,
      permeability: result.permeability as string,
      quantitative: result.quantitative as string,
      citrate: result.citrate as string,
      tar: result.tar as string,
      nicotine: result.nicotine as string,
      co: result.co as string,
      targetTar: result.target_tar as string,
      targetNicotine: result.target_nicotine as string,
      targetCo: result.target_co as string,
      tarWeight: result.tar_weight as string,
      nicotineWeight: result.nicotine_weight as string,
      coWeight: result.co_weight as string,
      filterVentilationRanger: result.filter_ventilation_ranger as string,
      filterPressureDropRanger: result.filter_pressure_drop_ranger as string,
      permeabilityRanger: result.permeability_ranger as string,
      quantitativeRanger: result.quantitative_ranger as string,
      citrateRanger: result.citrate_ranger as string,
      profile:
        typeof result.profile === 'string' ? JSON.parse(result.profile as string) : result.profile,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
}

// 导出单例实例
export const recAuxMaterialsSaveService = new RecAuxMaterialsSaveService()
