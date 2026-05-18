import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { registerUser, loginUser, getUserByToken, logoutUser, getAllUsers, deleteUser, getDb } from './auth'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function getToken(req: IncomingMessage): string | null {
  const auth = req.headers['authorization']
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export function authApiPlugin(): Plugin {
  return {
    name: 'auth-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/auth')) return next()

        try {
          // POST /api/auth/register
          if (req.url === '/api/auth/register' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req))
            const { name, email, password } = body

            if (!name || !email || !password) {
              return json(res, 400, { error: 'Semua field harus diisi' })
            }
            if (password.length < 6) {
              return json(res, 400, { error: 'Password minimal 6 karakter' })
            }
            if (password.length > 50) {
              return json(res, 400, { error: 'Password maksimal 50 karakter' })
            }
            if (email.length > 100) {
              return json(res, 400, { error: 'Email maksimal 100 karakter' })
            }
            if (name.length > 50) {
              return json(res, 400, { error: 'Nama maksimal 50 karakter' })
            }

            const result = registerUser(name.trim(), email.trim().toLowerCase(), password)
            if (!result.success) {
              return json(res, 409, { error: result.error })
            }
            return json(res, 201, { user: result.user, token: result.token })
          }

          // POST /api/auth/login
          if (req.url === '/api/auth/login' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req))
            const { email, password } = body

            if (!email || !password) {
              return json(res, 400, { error: 'Email dan password harus diisi' })
            }

            const result = loginUser(email.trim().toLowerCase(), password)
            if (!result.success) {
              return json(res, 401, { error: result.error })
            }
            return json(res, 200, { token: result.token, user: result.user })
          }

          // GET /api/auth/me
          if (req.url === '/api/auth/me' && req.method === 'GET') {
            const token = getToken(req)
            if (!token) return json(res, 401, { error: 'Token tidak ditemukan' })

            const user = getUserByToken(token)
            if (!user) return json(res, 401, { error: 'Sesi tidak valid' })

            return json(res, 200, { user })
          }

          // POST /api/auth/logout
          if (req.url === '/api/auth/logout' && req.method === 'POST') {
            const token = getToken(req)
            if (token) logoutUser(token)
            return json(res, 200, { success: true })
          }

          // GET /api/auth/save
          if (req.url === '/api/auth/save' && req.method === 'GET') {
            const token = getToken(req)
            if (!token) return json(res, 401, { error: 'Token tidak ditemukan' })
            const user = getUserByToken(token)
            if (!user) return json(res, 401, { error: 'Sesi tidak valid' })

            const database = getDb()
            const row = database.prepare('SELECT save_data FROM users WHERE id = ?').get(user.id) as { save_data?: string } | undefined
            return json(res, 200, { saveData: row?.save_data ? JSON.parse(row.save_data) : null })
          }

          // POST /api/auth/save
          if (req.url === '/api/auth/save' && req.method === 'POST') {
            const token = getToken(req)
            if (!token) return json(res, 401, { error: 'Token tidak ditemukan' })
            const user = getUserByToken(token)
            if (!user) return json(res, 401, { error: 'Sesi tidak valid' })

            const body = JSON.parse(await readBody(req))
            const { saveData } = body

            const database = getDb()
            database.prepare('UPDATE users SET save_data = ? WHERE id = ?').run(JSON.stringify(saveData), user.id)
            return json(res, 200, { success: true })
          }

          // GET /api/auth/users (admin)
          if (req.url === '/api/auth/users' && req.method === 'GET') {
            const users = getAllUsers()
            return json(res, 200, { users })
          }

          // DELETE /api/auth/users/:id
          if (req.url?.startsWith('/api/auth/users/') && req.method === 'DELETE') {
            const userId = req.url.replace('/api/auth/users/', '')
            const deleted = deleteUser(userId)
            if (!deleted) return json(res, 404, { error: 'User tidak ditemukan' })
            return json(res, 200, { success: true })
          }

          return next()
        } catch (e) {
          console.error('Auth API error:', e)
          return json(res, 500, { error: 'Internal server error' })
        }
      })
    }
  }
}
