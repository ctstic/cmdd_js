import { db, schema } from '..'
import { dialog } from 'electron'
import XLSX from 'xlsx-js-style'

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
    const safeObj = JSON.parse(JSON.stringify(sima))
    return this.createSimulationPrediction(safeObj)
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
   * 导出仿真预测保存记录
   * @param id 记录ID
   */
  public async export(dto: schema.exportSimDto[]): Promise<any> {
    const timestamp = Date.now()
    const { filePath } = await dialog.showSaveDialog({
      title: '导出 Excel',
      defaultPath: `data_${timestamp}.xlsx`,
      filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
    })

    if (!filePath) {
      return { success: false, error: '用户取消导出' }
    }
    // // 3. 转换成 Excel
    // const worksheet = XLSX.utils.json_to_sheet(dto)
    // 1️⃣ 生成数据，保证列顺序
    const dtoOrdered = dto.map((item) => ({
      模型类别: item.模型类别,
      数据类别: item.数据类别,
      滤嘴通风率: item.滤嘴通风率,
      滤棒压降: item.滤棒压降,
      透气度: item.透气度,
      定量: item.定量,
      柠檬酸根: item.柠檬酸根,
      焦油: item.焦油,
      烟碱: item.烟碱,
      CO: item.CO
    }))

    // 2️⃣ 转换成 worksheet
    const worksheet = XLSX.utils.json_to_sheet(dtoOrdered, {
      header: [
        '模型类别',
        '数据类别',
        '滤嘴通风率',
        '滤棒压降',
        '透气度',
        '定量',
        '柠檬酸根',
        '焦油',
        '烟碱',
        'CO'
      ]
    })

    // 3️⃣ 设置列宽（可选）
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ]

    worksheet['!rows'] = [
      { hpt: 25 }, // 第一行表头 25 磅
      { hpt: 18 } // 数据行 18 磅
    ]
    // 只给第一行表头加样式（加粗+居中+灰色背景）
    for (let C = 0; C <= 20; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }) // 第一行 R=0
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: '000000' } }, // 黑色加粗
          alignment: { horizontal: 'center', vertical: 'center' }, // 居中
          fill: { fgColor: { rgb: 'DDDDDD' } } // 灰色背景
        }
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '仿真预测数据')

    // 4. 保存文件
    XLSX.writeFile(workbook, filePath)

    return { success: true, filePath }
  }

  /**
   * 根据ID获取仿真预测保存记录
   * @param id 记录ID
   * @returns 仿真预测保存记录
   */
  public async exportId(id: number): Promise<any> {
    const result = this.sqlite
      .prepare('SELECT * FROM simulation_prediction_save WHERE id = ?')
      .get(id) as Record<string, unknown>

    if (!result) {
      return { success: false, error: '数据不存在' }
    }
    const exports: schema.exportSimDto[] = []
    exports.push(this.mapToExportSimDto(result, '基准数据'))
    const profile =
      typeof result.profile === 'string'
        ? JSON.parse(result.profile)
        : Array.isArray(result.profile)
          ? result.profile
          : []
    profile.map((result) => {
      exports.push(this.mapToExportSimDto(result, '预测数据'))
    })
    const safeExports = JSON.parse(JSON.stringify(exports))
    this.export(safeExports)
    return { success: true, error: '' }
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
      profile: JSON.parse(result.profile as string),
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }

  private mapToExportSimDto(
    result: Record<string, unknown>,
    datatype: string
  ): schema.exportSimDto {
    return {
      模型类别: result.specimenName as string,
      数据类别: datatype as string,
      滤嘴通风率: result.filterVentilation as string,
      滤棒压降: result.filterPressureDrop as string,
      透气度: result.permeability as string,
      定量: result.quantitative as string,
      柠檬酸根: result.citrate as string,
      焦油: result.tar as string,
      烟碱: result.nicotine as string,
      CO: result.co as string
    }
  }
}

// 导出单例实例
export const simulationPredictionSaveService = new SimulationPredictionSaveService()
