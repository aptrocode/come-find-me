import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function adminApiPlugin() {
  return {
    name: 'admin-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/admin-config')) {
          return next()
        }

        const configPath = path.resolve('admin-config.json')

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            if (fs.existsSync(configPath)) {
              const data = fs.readFileSync(configPath, 'utf-8')
              res.end(data)
            } else {
              res.end(JSON.stringify(null))
            }
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(e) }))
          }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              fs.writeFileSync(configPath, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(e) }))
            }
          })
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminApiPlugin()],
  server: {
    host: true,
    port: 5678,
    allowedHosts: ['n8n.nmxavw.com'],
  },
})

