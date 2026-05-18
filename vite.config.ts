import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import type { ViteDevServer, Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { authApiPlugin } from './server/authPlugin'

function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        // Handle 3D model uploads
        if (req.url?.startsWith('/api/upload-model') && req.method === 'POST') {
          const filename = (req.headers['x-filename'] as string) || 'model.glb'
          const timestamp = Math.floor(Date.now() / 1000)
          const safeName = `${timestamp}_${filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`
          const modelsDir = path.resolve('public', 'models')
          const finalPath = path.join(modelsDir, safeName)

          if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true })
          }

          const fileStream = fs.createWriteStream(finalPath)
          req.pipe(fileStream)
          
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, url: `/models/${safeName}` }))
          })

          req.on('error', (err: Error) => {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          })
          return
        }

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
  plugins: [react(), adminApiPlugin(), authApiPlugin()],
  server: {
    host: true,
    port: 5678,
    allowedHosts: ['n8n.nmxavw.com'],
  },
})

