// user.service.ts
import { database } from './database'
import * as schema from './schema'

export class UserService {
  createUser(userData: schema.NewUser): schema.User {
    const now = Date.now()
    const result = database.sqlite
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
        now,
        now
      )
    return this.getUserById(result.lastInsertRowid as number)!
  }

  public getUserById(id: number): schema.User | undefined {
    const result = database.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<
      string,
      unknown
    >
    if (!result) return undefined

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

  public getAllUsers(): schema.User[] {
    const results = database.sqlite
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all() as Record<string, unknown>[]

    return results.map((result) => ({
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }

  public async deleteUser(id: number): Promise<void> {
    const result = database.sqlite.prepare('DELETE FROM users WHERE id = ?').run(id)
    if (result.changes === 0) {
      throw new Error('User not found')
    }
  }

  public async searchUsers(query: string): Promise<schema.User[]> {
    const results = database.sqlite
      .prepare(
        `
        SELECT * FROM users
        WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?
        ORDER BY created_at DESC
      `
      )
      .all(`%${query}%`, `%${query}%`, `%${query}%`) as Record<string, unknown>[]

    return results.map((result) => ({
      id: result.id as number,
      username: result.username as string,
      email: result.email as string,
      fullName: result.full_name as string | null,
      avatar: result.avatar as string | null,
      status: result.status as 'active' | 'inactive' | 'pending',
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    }))
  }
}

export const userService = new UserService()
