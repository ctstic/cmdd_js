/**
 * 卷烟数据服务层
 * 负责卷烟检测数据的所有业务逻辑操作
 * 包括卷烟数据的增删改查等功能
 */

import { db, schema } from '..'
import * as XLSX from 'xlsx'
import { harmfulService } from './harmfulService'

/**
 * 卷烟数据业务逻辑服务类
 * 提供卷烟相关的所有数据操作方法
 */
export class CigarettesService {
  private sqlite = db.getSqliteInstance()

  /**
   * 根据编码搜索卷烟数据
   * @param code 卷烟编码（支持模糊搜索）
   * @param specimenName 样品名称
   * @returns 匹配的卷烟数据列表
   */
  public getCigarettes(code: string, specimenName: string): schema.Cigarettes[] {
    const results = this.sqlite
      .prepare(
        'SELECT * FROM cigarettes WHERE code like ? AND specimen_name = ? ORDER BY created_at DESC'
      )
      .all(`%${code}%`, specimenName) as Record<string, unknown>[]

    return results.map((result) => {
      result.tar = Number.parseFloat((result.tar as string).trim()).toFixed(2)

      result.nicotine = Number.parseFloat((result.nicotine as string).trim()).toFixed(2)

      result.co = Number.parseFloat((result.co as string).trim()).toFixed(2)

      return this.mapToCigarettes(result)
    })
  }

  /**
   * 根据编码搜索卷烟数据
   * @param code 卷烟编码（支持模糊搜索）
   * @param specimenName 样品名称
   * @returns 匹配的卷烟数据列表
   */
  public getCigarettesType(specimenName: string): string[] {
    const sql = `
        SELECT specimen_name FROM cigarettes
        WHERE (? = '' OR specimen_name = ?)
        GROUP BY specimen_name
        ORDER BY created_at DESC
      `
    const results = this.sqlite.prepare(sql).all(specimenName, specimenName) as Record<
      string,
      unknown
    >[]
    // 直接返回type字符串数组
    return results.map((result) => result.specimen_name as string)
  }

  public getCigarettesAll(specimenName: string): schema.Cigarettes[] {
    const results = this.sqlite
      .prepare('SELECT * FROM cigarettes WHERE specimen_name = ? ORDER BY created_at DESC')
      .all(specimenName) as Record<string, unknown>[]

    return results.map((result) => {
      return this.mapToCigarettes(result)
    })
  }

  /**
   * 删除卷烟数据记录
   * @param id 卷烟数据ID
   */
  public async deleteCigarettes(id: number): Promise<void> {
    let cigarettes = this.sqlite.prepare('SELECT * FROM cigarettes WHERE id = ?').get(id) as Record<string, unknown>
    cigarettes = this.mapToCigarettes(cigarettes)
    const length = this.getCigarettesAll(cigarettes.specimenName as string).length
    console.log(length)
    const result = this.sqlite.prepare('DELETE FROM cigarettes WHERE id = ?').run(id)
    if (length == 1) {
      harmfulService.deleteBySpecimenName(cigarettes.specimenName as string)
    }
    if (result.changes === 0) {
      throw new Error('卷烟数据不存在')
    }
  }

  /**
   * 根据编码搜索卷烟数据
   * @param code 卷烟编码（支持模糊搜索）
   * @param specimenName 样品名称
   * @returns 匹配的卷烟数据列表
   */
  public async deleteCigarettesType(specimenName: string): Promise<void> {
    const result = this.sqlite
      .prepare('DELETE FROM cigarettes WHERE specimen_name = ?')
      .run(specimenName)
    harmfulService.deleteBySpecimenName(specimenName)
    if (result.changes === 0) {
      throw new Error('卷烟数据不存在')
    }
  }

  /* 创建新的卷烟数据记录
   * @param obj 卷烟数据对象
   * @returns 创建的卷烟数据
   */
  public async createCigarettes(obj: schema.Cigarettes): Promise<void> {
    const now = new Date()
    this.sqlite
      .prepare(
        `
      INSERT INTO cigarettes (
            code, specimen_name, filter_ventilation, filter_pressure_drop, permeability, quantitative,
            citrate, potassium_ratio, tar, nicotine, co, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        obj.code,
        obj.specimenName,
        obj.filterVentilation,
        obj.filterPressureDrop,
        obj.permeability,
        obj.quantitative,
        obj.citrate,
        obj.potassiumRatio,
        obj.tar,
        obj.nicotine,
        obj.co,
        now.getTime(),
        now.getTime()
      )
  }

  /**
   * 从Web File对象或Blob导入Excel数据的便捷方法
   * @param file Web File对象或Blob
   * @returns 导入结果
   */
  public async importFromWebFile(fileObj: {
    specimenName: string
    name: string
    buffer: Uint8Array
  }): Promise<schema.ImportResult> {
    const fileName = fileObj.name

    try {
      // 将File/Blob转换为ArrayBuffer
      const buffer = Buffer.from(fileObj.buffer)

      // 调用主要的导入方法
      return await this.importFromExcel(buffer, fileObj.specimenName)
    } catch (error) {
      return {
        success: false,
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [
          `${fileName}: File reading failed - ${error instanceof Error ? error.message : String(error)}`
        ]
      }
    }
  }

  /**
   * 从Excel文件导入数据并生成有害成分系数
   * @param filePath Excel文件路径或Buffer
   * @returns 导入结果
   */
  public async importFromExcel(
    filePath: Buffer,
    specimenName: string
  ): Promise<schema.ImportResult> {
    const result: schema.ImportResult = {
      success: false,
      totalRows: 0,
      successRows: 0,
      failedRows: 0,
      errors: []
    }

    try {
      // 读取Excel文件
      const workbook = XLSX.read(filePath, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // 将Excel数据转换为JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        raw: true, // 获取原始数值，不受格式影响
        header: 1,
        defval: ''
      }) as string[][]

      if (rawData.length < 2) {
        result.errors.push('Excel文件为空或只有标题行')
        return result
      }
      // 获取标题行
      const headers = rawData[0] as string[]
      const dataRows = rawData.slice(1)
      result.totalRows = dataRows.length

      // 验证必需的列是否存在
      const requiredColumns = [
        '编号',
        '滤嘴通风率%',
        '滤棒压降(Pa)',
        '透气度/CU',
        '定量g/m2',
        '柠檬酸根(设计值）%',
        '钾盐占比',
        '焦油mg/支',
        '烟碱mg/支',
        'CO(mg/支)'
      ]

      const columnIndexes: { [key: string]: number } = {}

      for (const col of requiredColumns) {
        const index = headers.findIndex(
          (h) =>
            (h.includes('编号') && col.includes('编号')) ||
            (h.includes('滤嘴通风') && col.includes('滤嘴通风')) ||
            (h.includes('滤棒压降') && col.includes('滤棒压降')) ||
            (h.includes('透气度') && col.includes('透气度')) ||
            (h.includes('定量') && col.includes('定量')) ||
            (h.includes('柠檬酸') && col.includes('柠檬酸')) ||
            (h.includes('钾盐') && col.includes('钾盐')) ||
            (h.includes('焦油') && col.includes('焦油')) ||
            (h.includes('烟碱') && col.includes('烟碱')) ||
            (h.includes('CO') && col.includes('CO'))
        )

        if (index === -1) {
          result.errors.push(`The required column cannot be found: ${col}`)
          return result
        }
        columnIndexes[col] = index
      }
      const data: schema.Cigarettes[] = []
      // 解析数据行
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        console.log(row)
        const rowData: schema.Cigarettes = {
          id: 0,
          code: String(row[columnIndexes['编号']] || '').trim(),
          specimenName: specimenName,
          filterVentilation: String(
            Number(row[columnIndexes['滤嘴通风率%']]).toFixed(3) || ''
          ).trim(),
          filterPressureDrop: Number(row[columnIndexes['滤棒压降(Pa)']] || ''),
          permeability: String(row[columnIndexes['透气度/CU']] || '').trim(),
          quantitative: String(row[columnIndexes['定量g/m2']] || '').trim(),
          citrate: String(Number(row[columnIndexes['柠檬酸根(设计值）%']]).toFixed(3) || '').trim(),
          potassiumRatio: String(row[columnIndexes['钾盐占比']] || '').trim(),
          tar: String(row[columnIndexes['焦油mg/支']] || '').trim(),
          nicotine: String(row[columnIndexes['烟碱mg/支']] || '').trim(),
          co: String(row[columnIndexes['CO(mg/支)']] || '').trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // 验证数据完整性
        if (!rowData.code) {
          result.errors.push(`${rowData.code}编号不能为空`)
          return result
        }
        if (this.getCigarettes(rowData.code, rowData.specimenName).length > 0) {
          result.errors.push(`${rowData.code}编号已存在`)
          return result
        }
        data.push(rowData)
      }
      if (result.errors.length == 0) {
        for (const key in data) {
          console.log(data[key])
          this.createCigarettes(data[key])
        }
      }
      //生成默认计算系数
      harmfulService.generate(specimenName)
    } catch (error) {
      result.errors.push(
        `Excel文件处理失败：${error instanceof Error ? error.message : String(error)}`
      )
    }
    return result
  }

  /**
   * 将数据库查询结果映射为Cigarettes对象
   * @param result 数据库查询结果
   * @returns Cigarettes对象
   */
  private mapToCigarettes(result: Record<string, unknown>): schema.Cigarettes {
    return {
      id: result.id as number,
      specimenName: result.specimen_name as string,
      code: result.code as string,
      filterVentilation: result.filter_ventilation as string,
      filterPressureDrop: result.filter_pressure_drop as number,
      permeability: result.permeability as string,
      quantitative: result.quantitative as string,
      citrate: result.citrate as string,
      potassiumRatio: result.potassium_ratio as string,
      tar: result.tar as string,
      nicotine: result.nicotine as string,
      co: result.co as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
}

// 导出卷烟服务单例实例
export const cigarettesService = new CigarettesService()
