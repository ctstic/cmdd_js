/**
 * 卷烟数据服务层
 * 负责卷烟检测数据的所有业务逻辑操作
 * 包括卷烟数据的增删改查等功能
 */

import { db, schema } from '..'

/**
 * 卷烟数据业务逻辑服务类
 * 提供卷烟相关的所有数据操作方法
 */
export class CigarettesService {
  private sqlite = db.getSqliteInstance()

  /**
   * 获取所有卷烟数据
   * @returns 卷烟数据列表，按创建时间倒序排列
   */
  public getAllCigarettes(): schema.Cigarettes[] {
    const results = this.sqlite
      .prepare('SELECT * FROM cigarettes ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => this.mapToCigarettes(result))
  }

  /**
   * 根据编码搜索卷烟数据
   * @param code 卷烟编码（支持模糊搜索）
   * @returns 匹配的卷烟数据列表
   */
  public getCigarettes(code: string): schema.Cigarettes[] {
    const results = this.sqlite
      .prepare('SELECT * FROM cigarettes WHERE code like ? ORDER BY created_at DESC')
      .all(`%${code}%`) as Record<string, unknown>[]

    return results.map((result) => this.mapToCigarettes(result))
  }

  /**
   * 根据ID获取卷烟数据
   * @param id 卷烟数据ID
   * @returns 卷烟数据或undefined
   */
  public getCigarettesById(id: number): schema.Cigarettes | undefined {
    const result = this.sqlite.prepare('SELECT * FROM cigarettes WHERE id = ?').get(id) as Record<
      string,
      unknown
    >
    if (!result) return undefined

    return this.mapToCigarettes(result)
  }

  /**
   * 创建新的卷烟数据记录
   * @param obj 卷烟数据对象
   * @returns 创建的卷烟数据
   */
  public async createCigarettes(obj: schema.Cigarettes): Promise<schema.Cigarettes> {
    const now = new Date()
    const result = this.sqlite
      .prepare(
        `
      INSERT INTO cigarettes (
            code, filter_ventilation, filter_pressure_drop, permeability, quantitative,
            citrate, potassium_ratio, tar, nicotine, co, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        obj.code,
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

    return this.getCigarettesById(result.lastInsertRowid as number)!
  }

  /**
   * 删除卷烟数据记录
   * @param id 卷烟数据ID
   */
  public async deleteCigarettes(id: number): Promise<void> {
    const result = this.sqlite.prepare('DELETE FROM cigarettes WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('卷烟数据不存在')
    }
  }

  /**
   * 将数据库查询结果映射为Cigarettes对象
   * @param result 数据库查询结果
   * @returns Cigarettes对象
   */
  private mapToCigarettes(result: Record<string, unknown>): schema.Cigarettes {
    return {
      id: result.id as number,
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
