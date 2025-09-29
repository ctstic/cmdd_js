import { db, schema } from '..'

export class RfgMarkService {
  private sqlite = db.getSqliteInstance()

  /**
   * 获取所有基准卷烟主流烟气牌号
   * @param mark 牌号（可选，用于筛选特定牌号）
   * @returns 基准卷烟主流烟气牌号列表
   */
  public getRfgMarks(mark: string): schema.RfgMark[] {
    const sql = `
        SELECT * FROM rfg_mark
        WHERE (? = '' OR mark = ?)
        ORDER BY created_at DESC
      `
    const results = this.sqlite.prepare(sql).all(mark, mark) as Record<string, unknown>[]

    return results.map((result) => this.mapToRfgMark(result))
  }

  /**
   * 创建新的基准卷烟主流烟气牌号
   * @param obj 基准卷烟主流烟气牌号对象
   */
  public async createRfgMark(obj: schema.RfgMarkDto): Promise<void> {
    const now = new Date()
    this.sqlite
      .prepare(
        `
      INSERT INTO rfg_mark (
        mark, tar, nicotine, co, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(obj.mark, obj.tar, obj.nicotine, obj.co, now.getTime(), now.getTime())
  }

  /**
   * 将数据库查询结果映射为RfgMark对象
   * @param result 数据库查询结果
   * @returns RfgMark对象
   */
  private mapToRfgMark(result: Record<string, unknown>): schema.RfgMark {
    return {
      id: result.id as number,
      mark: result.mark as string,
      tar: result.tar as string,
      nicotine: result.nicotine as string,
      co: result.co as string,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
}

// 导出单例实例
export const rfgMarkService = new RfgMarkService()
