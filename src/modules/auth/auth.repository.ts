import { query, getClient } from '../../db/index.js';
import { User, UserWithPassword, UserRole } from '../../types/index.js';

export class AuthRepository {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const userRes = await query(
      `SELECT id, email, password_hash, first_name, last_name, title, is_active, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (!userRes.rowCount || userRes.rowCount === 0) {
      return null;
    }

    const row = userRes.rows[0];
    const rolesRes = await query(
      `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [row.id]
    );

    const roles = rolesRes.rows.map((r: any) => r.name as UserRole);

    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      first_name: row.first_name,
      last_name: row.last_name,
      title: row.title,
      is_active: row.is_active,
      roles,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  async findById(id: string): Promise<User | null> {
    const userRes = await query(
      `SELECT id, email, first_name, last_name, title, is_active, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (!userRes.rowCount || userRes.rowCount === 0) {
      return null;
    }

    const row = userRes.rows[0];
    const rolesRes = await query(
      `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [row.id]
    );

    const roles = rolesRes.rows.map((r: any) => r.name as UserRole);

    return {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      title: row.title,
      is_active: row.is_active,
      roles,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
