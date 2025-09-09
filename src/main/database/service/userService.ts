/**
 * 用户服务层
 * 负责用户相关的所有业务逻辑操作
 * 包括用户的增删改查、搜索等功能
 */

import { db, schema } from '..'

/**
 * 用户业务逻辑服务类
 * 提供用户相关的所有数据操作方法
 */
export class UserService {
  private sqlite = db.getSqliteInstance()

  /**
   * 创建新用户
   * @param userData 用户数据
   * @returns 创建的用户信息
   */
  public async createUser(userData: schema.NewUser): Promise<schema.User> {
    const now = new Date()
    const result = this.sqlite
      .prepare(
        `
      INSERT INTO users (username, email, full_name, avatar, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        userData.username,
        userData.email,
        userData.fullName || null,
        userData.avatar || null,
        userData.status || 'active',
        now.getTime(),
        now.getTime()
      )

    return this.getUserById(result.lastInsertRowid as number)!
  }

  /**
   * 根据ID获取用户信息
   * @param id 用户ID
   * @returns 用户信息或undefined
   */
  public getUserById(id: number): schema.User | undefined {
    const result = this.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<
      string,
      unknown
    >
    if (!result) return undefined

    return this.mapToUser(result)
  }

  /**
   * 根据邮箱获取用户信息
   * @param email 用户邮箱
   * @returns 用户信息或undefined
   */
  public getUserByEmail(email: string): schema.User | undefined {
    const result = this.sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<
      string,
      unknown
    >
    if (!result) return undefined

    return this.mapToUser(result)
  }

  /**
   * 根据用户名获取用户信息
   * @param username 用户名
   * @returns 用户信息或undefined
   */
  public getUserByUsername(username: string): schema.User | undefined {
    const result = this.sqlite
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as Record<string, unknown>
    if (!result) return undefined

    return this.mapToUser(result)
  }

  /**
   * 获取所有用户列表
   * @returns 用户列表，按创建时间倒序排列
   */
  public getAllUsers(): schema.User[] {
    const results = this.sqlite
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => this.mapToUser(result))
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updates 要更新的字段
   * @returns 更新后的用户信息
   */
  public async updateUser(
    id: number,
    updates: Partial<Omit<schema.User, 'id' | 'createdAt'>>
  ): Promise<schema.User> {
    const now = new Date()
    const currentUser = this.getUserById(id)
    if (!currentUser) {
      throw new Error('用户不存在')
    }

    const updatedUser = { ...currentUser, ...updates, updatedAt: now }

    this.sqlite
      .prepare(
        `
      UPDATE users
      SET username = ?, email = ?, full_name = ?, avatar = ?, status = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(
        updatedUser.username,
        updatedUser.email,
        updatedUser.fullName,
        updatedUser.avatar,
        updatedUser.status,
        now.getTime(),
        id
      )

    return updatedUser
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  public async deleteUser(id: number): Promise<void> {
    const result = this.sqlite.prepare('DELETE FROM users WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('用户不存在')
    }
  }

  /**
   * 搜索用户
   * @param query 搜索关键词，匹配用户名、邮箱或全名
   * @returns 匹配的用户列表
   */
  public async searchUsers(query: string): Promise<schema.User[]> {
    const results = this.sqlite
      .prepare(
        `
      SELECT * FROM users
      WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?
      ORDER BY created_at DESC
    `
      )
      .all(`%${query}%`, `%${query}%`, `%${query}%`) as Record<string, unknown>[]

    return results.map((result) => this.mapToUser(result))
  }

  /**
   * 将数据库查询结果映射为User对象
   * @param result 数据库查询结果
   * @returns User对象
   */
  private mapToUser(result: Record<string, unknown>): schema.User {
    return {
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }
  }
}

// 导出用户服务单例实例
export const userService = new UserService()
