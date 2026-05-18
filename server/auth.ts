import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import path from 'path'

const DB_PATH = path.resolve('auth.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `)

    // Upgrade schema if needed
    try {
      db.exec('ALTER TABLE users ADD COLUMN save_data TEXT;')
    } catch {
      // Column already exists, safe to ignore
    }
  }
  return db
}

export interface AuthUser {
  id: string
  name: string
  email: string
  createdAt: number
  saveData?: unknown
}

interface DbUser {
  id: string
  name: string
  email: string
  password: string
  created_at: number
  save_data?: string
}

// ─── User CRUD ─────────────────────────────────────────

export function registerUser(name: string, email: string, password: string): { success: boolean; error?: string; user?: AuthUser; token?: string } {
  const database = getDb()

  // Check duplicate email
  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return { success: false, error: 'Email sudah terdaftar' }
  }

  const id = crypto.randomUUID()
  const hashedPassword = bcrypt.hashSync(password, 10)
  const now = Date.now()

  database.prepare('INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)').run(id, name, email, hashedPassword, now)

  // Create session
  const token = crypto.randomUUID()
  database.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, id, now)

  return {
    success: true,
    token,
    user: { id, name, email, createdAt: now }
  }
}

export function loginUser(email: string, password: string): { success: boolean; error?: string; token?: string; user?: AuthUser } {
  const database = getDb()

  const row = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined
  if (!row) {
    return { success: false, error: 'Email atau password salah' }
  }

  if (!bcrypt.compareSync(password, row.password)) {
    return { success: false, error: 'Email atau password salah' }
  }

  // Create session
  const token = crypto.randomUUID()
  database.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, row.id, Date.now())

  return {
    success: true,
    token,
    user: { id: row.id, name: row.name, email: row.email, createdAt: row.created_at }
  }
}

export function getUserByToken(token: string): AuthUser | null {
  const database = getDb()

  const row = database.prepare(`
    SELECT u.id, u.name, u.email, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as (DbUser | undefined)

  if (!row) return null
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at }
}

export function logoutUser(token: string): void {
  const database = getDb()
  database.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function getAllUsers(): AuthUser[] {
  const database = getDb()
  const rows = database.prepare('SELECT id, name, email, created_at, save_data FROM users ORDER BY created_at DESC').all() as DbUser[]
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    createdAt: r.created_at,
    saveData: r.save_data ? JSON.parse(r.save_data) : null
  }))
}

export function deleteUser(userId: string): boolean {
  const database = getDb()
  const result = database.prepare('DELETE FROM users WHERE id = ?').run(userId)
  return result.changes > 0
}
