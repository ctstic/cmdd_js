import { database } from './database'
import * as schema from './schema'

export class CigaretteService {
  // 多因素卷烟 查询所有
  public getAllCigarettes(): schema.Cigarettes[] {
    const results = database.sqlite
      .prepare('SELECT * FROM cigarettes ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => ({
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
    }))
  }

  // 多因素卷烟 查询
  public getCigarettes(code: string): schema.Cigarettes[] {
    const results = database.sqlite
      .prepare('SELECT * FROM cigarettes WHERE code like ? ORDER BY created_at DESC')
      .all(`%${code}%`) as Record<string, unknown>[]
    return results.map((result) => ({
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
    }))
  }
  // 多因素卷烟 单个删除
  public async deleteCigarettes(id: number): Promise<void> {
    const result = database.sqlite.prepare('DELETE FROM cigarettes WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('cigarettes not found')
    }
  }
  // 多因素卷烟 id查询
  public getCigarettesById(id: number): schema.Cigarettes | undefined {
    const result = database.sqlite
      .prepare('SELECT * FROM cigarettes WHERE id = ?')
      .get(id) as Record<string, unknown>
    if (!result) return undefined

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
  // 多因素卷烟 新增
  public async createCigarettes(obj: schema.Cigarettes): Promise<schema.Cigarettes> {
    const now = new Date()
    const result = database.sqlite
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
}

export const cigaretteService = new CigaretteService()
