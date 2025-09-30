import { db, schema } from '..'
import { dialog } from 'electron'
import XLSX from 'xlsx-js-style'

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
    auxMaterialsDto.recommendedValue = [
      {
        key: '1759211849435',
        filterVentilation: '1',
        filterPressureDrop: '1',
        permeability: '1',
        quantitative: '1',
        citrate: '1',
        tar: '1',
        nicotine: '1',
        co: '1'
      }
    ]
    const aux = this.mapAuxMaterialsDtoToSave(auxMaterialsDto)
    return this.createRecAuxMaterials(aux)
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
        quantitative_ranger, citrate_ranger, profile,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
   * 根据ID获取仿真预测保存记录
   * @param id 记录ID
   * @returns 仿真预测保存记录
   */
  public async exportId(id: number): Promise<any> {
    const result = this.sqlite
      .prepare('SELECT * FROM rec_aux_materials_save WHERE id = ?')
      .get(id) as schema.RecAuxMaterialsSave

    if (!result) {
      return { success: false, error: '数据不存在' }
    }
    this.export(this.mapToRecAuxMaterialsSave(result))
    return { success: true, error: '' }
  }

  /**
   * 导出推荐辅材参数
   * @param id 记录ID
   */
  public async export(dto: schema.RecAuxMaterialsSave): Promise<any> {
    const timestamp = Date.now()
    const { filePath } = await dialog.showSaveDialog({
      title: '导出 Excel',
      defaultPath: `data_${timestamp}.xlsx`,
      filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
    })

    if (!filePath) {
      return { success: false, error: '用户取消导出' }
    }

    const profile =
      typeof dto.profile === 'string'
        ? JSON.parse(dto.profile)
        : Array.isArray(dto.profile)
          ? dto.profile
          : []
    const sheetData1: any[][] = [
      [
        '模型类别',
        '基准卷烟主流烟气',
        '基准卷烟主流烟气',
        '基准卷烟主流烟气',
        '目标主流烟气',
        '目标主流烟气',
        '目标主流烟气',
        '主流烟气权重设置',
        '主流烟气权重设置',
        '主流烟气权重设置',
        '基准卷烟辅材参数',
        '基准卷烟辅材参数',
        '基准卷烟辅材参数',
        '基准卷烟辅材参数',
        '基准卷烟辅材参数',
        '辅材参数个性化设计范围',
        '辅材参数个性化设计范围',
        '辅材参数个性化设计范围',
        '辅材参数个性化设计范围',
        '辅材参数个性化设计范围',
        '辅材参数个性化设计范围'
      ],
      [
        '模型类别',
        'J焦油(mg/支)',
        'J烟碱(mg/支)',
        'JCO(mg/支)',
        'M焦油(mg/支)',
        'M烟碱(mg/支)',
        'MCO(mg/支)',
        '焦油权重',
        '烟碱权重',
        'CO权重',
        '滤嘴通风率(%)',
        '滤棒压降(Pa)',
        '透气度(CU)',
        '定量(g/m²)',
        '柠檬酸根(含量)(%)',
        '生成推荐数量(条)',
        '滤嘴通风率(%)   步长值5',
        '滤棒压降(Pa)   步长值200',
        '透气度(CU)   步长值5',
        '定量(g/m²)   步长值2',
        '柠檬酸根(含量)(%)   步长值0.4'
      ],
      [
        dto.specimenName,
        dto.tar,
        dto.nicotine,
        dto.co,
        dto.targetTar,
        dto.targetNicotine,
        dto.targetCo,
        dto.tarWeight,
        dto.nicotineWeight,
        dto.coWeight,
        dto.filterVentilation,
        dto.filterPressureDrop,
        dto.permeability,
        dto.quantitative,
        dto.citrate,
        dto.recommendNumber,
        dto.filterVentilationRanger,
        dto.filterPressureDropRanger,
        dto.permeabilityRanger,
        dto.quantitativeRanger,
        dto.citrateRanger
      ]
    ]

    const sheetData2 = [
      [
        '滤嘴通风率(%)',
        '滤棒压降(Pa)',
        '透气度(CU)',
        '定量(g/m²)',
        '柠檬酸根(含量)(%)',
        '焦油(mg/支)',
        '烟碱(mg/支)',
        'CO(mg/支)'
      ],
      ...profile.map((result) => [
        result.filterVentilation,
        result.filterPressureDrop,
        result.permeability,
        result.quantitative,
        result.citrate,
        result.tar,
        result.nicotine,
        result.co
      ])
    ]

    // 转成 worksheet
    const worksheet1 = XLSX.utils.aoa_to_sheet(sheetData1)

    // 设置列宽
    worksheet1['!cols'] = [
      { wch: 20 }, // 模型类别
      { wch: 20 }, // 基准卷烟主流烟气 - 焦油
      { wch: 20 }, // 基准卷烟主流烟气 - 烟碱
      { wch: 20 }, // 基准卷烟主流烟气 - CO
      { wch: 20 }, // 目标主流烟气 - 焦油
      { wch: 20 }, // 目标主流烟气 - 烟碱
      { wch: 20 }, // 目标主流烟气 - CO
      { wch: 20 }, // 主流烟气权重 - 焦油
      { wch: 20 }, // 主流烟气权重 - 烟碱
      { wch: 20 }, // 主流烟气权重 - CO
      { wch: 25 }, // 基准卷烟辅材参数 - 滤嘴通风率
      { wch: 25 }, // 基准卷烟辅材参数 - 滤棒压降
      { wch: 25 }, // 基准卷烟辅材参数 - 透气度
      { wch: 25 }, // 基准卷烟辅材参数 - 定量
      { wch: 25 }, // 基准卷烟辅材参数 - 柠檬酸根
      { wch: 20 }, // 辅材参数个性化设计范围 - 生成推荐数量
      { wch: 40 }, // 辅材参数个性化设计范围 - 滤嘴通风率
      { wch: 40 }, // 辅材参数个性化设计范围 - 滤棒压降
      { wch: 40 }, // 辅材参数个性化设计范围 - 透气度
      { wch: 40 }, // 辅材参数个性化设计范围 - 定量
      { wch: 40 } // 辅材参数个性化设计范围 - 柠檬酸根
    ]

    // 设置前两行表头高度
    worksheet1['!rows'] = [
      { hpt: 25 }, // 第一行表头 25 磅
      { hpt: 20 }, // 第二行表头 20 磅
      { hpt: 18 } // 数据行 18 磅
    ]

    // 2. 合并单元格（第一行合并）
    // decode_range/encode_cell 不用，这里直接写
    worksheet1['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }, // "基准卷烟主流烟气" 跨 3 列
      { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } }, // "目标主流烟气" 跨 3 列
      { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } }, // "主流烟气权重设置" 跨 3 列
      { s: { r: 0, c: 10 }, e: { r: 0, c: 14 } }, // "基准卷烟辅材参数" 跨 5 列
      { s: { r: 0, c: 15 }, e: { r: 0, c: 20 } } // "辅材参数个性化设计范围" 跨 6 列
    ]

    // 给表头加样式（加粗+居中+背景色）
    for (let R = 0; R <= 1; ++R) {
      for (let C = 0; C <= 20; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (worksheet1[cellAddress]) {
          worksheet1[cellAddress].s = {
            font: { bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'DDDDDD' } } // 灰色背景
          }
        }
      }
    }

    // 转成 worksheet
    const worksheet2 = XLSX.utils.aoa_to_sheet(sheetData2)

    worksheet2['!rows'] = [
      { hpt: 25 }, // 第一行表头 25 磅
      { hpt: 18 } // 数据行 18 磅
    ]

    // 设置列宽
    worksheet2['!cols'] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ]

    // 只给第一行表头加样式（加粗+居中+灰色背景）
    for (let C = 0; C <= 20; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }) // 第一行 R=0
      if (worksheet2[cellAddress]) {
        worksheet2[cellAddress].s = {
          font: { bold: true, color: { rgb: '000000' } }, // 黑色加粗
          alignment: { horizontal: 'center', vertical: 'center' }, // 居中
          fill: { fgColor: { rgb: 'DDDDDD' } } // 灰色背景
        }
      }
    }
    const workbook = XLSX.utils.book_new()

    // 第一个 sheet
    XLSX.utils.book_append_sheet(workbook, worksheet1, '入参数据')

    // 第二个 sheet
    XLSX.utils.book_append_sheet(workbook, worksheet2, '推荐数据')

    // 4. 保存文件
    XLSX.writeFile(workbook, filePath)

    return { success: true, filePath }
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

  public mapAuxMaterialsDtoToSave(
    auxMaterialsDto: schema.AuxMaterialsDto
  ): schema.RecAuxMaterialsSave {
    const now = new Date()
    return {
      id: 0, // 未使用
      createdAt: now,
      updatedAt: now,
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
      targetNicotine: auxMaterialsDto.targetParams.nicotine,
      targetCo: auxMaterialsDto.targetParams.co,
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
  }
}

// 导出单例实例
export const recAuxMaterialsSaveService = new RecAuxMaterialsSaveService()
