import { db, schema } from '..'

export class RamMarkService {
  private sqlite = db.getSqliteInstance()

  /**
   * 获取所有基准卷烟辅材参数牌号
   * @returns 基准卷烟辅材参数牌号列表
   */
  public getRamMarks(mark: string): schema.RamMark[] {
    const results = this.sqlite
      .prepare('SELECT * FROM ram_mark  WHERE mark = ? ORDER BY created_at DESC')
      .get(mark) as Record<string, unknown>[]

    return results.map((result) => this.mapToRamMark(result))
  }

  /**
   * 创建新的基准卷烟辅材参数牌号
   * @param obj 基准卷烟辅材参数对象
   */
  public async createRamMark(obj: schema.RamMark): Promise<void> {
    const now = new Date()
    this.sqlite
      .prepare(
        `
      INSERT INTO ram_mark (
        mark, filter_ventilation, filter_pressure_drop, permeability,
        quantitative, citrate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        obj.mark,
        obj.filterVentilation,
        obj.filterPressureDrop,
        obj.permeability,
        obj.quantitative,
        obj.citrate,
        now.getTime(),
        now.getTime()
      )
  }

  /**
   * 将数据库查询结果映射为RamMark对象
   * @param result 数据库查询结果
   * @returns RamMark对象
   */
  private mapToRamMark(result: Record<string, unknown>): schema.RamMark {
    return {
      id: result.id as number,
      mark: result.mark as string,
      filterVentilation: result.filter_ventilation as string,
      filterPressureDrop: result.filter_pressure_drop as number,
      permeability: result.permeability as string,
      quantitative: result.quantitative as string,
      citrate: result.citrate as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
}
// 导出单例实例
export const ramMarkService = new RamMarkService()
