import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import fs from "fs"
import { visualizer } from 'rollup-plugin-visualizer'
import { buildSystemPrompt, buildUserMessage, parseClaudeResponse } from './api/_claudeHelpers.js'

function localAudioDevPlugin() {
  return {
    name: 'local-audio-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/bat-status', (req, res) => {
        try {
          const hbFile = 'G:\\Mi unidad\\Radio\\bat_heartbeat.json'
          if (fs.existsSync(hbFile)) {
            const stat = fs.statSync(hbFile)
            if (Date.now() - stat.mtimeMs < 4000) {
              const data = fs.readFileSync(hbFile, 'utf8')
              res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              })
              res.end(data)
              return
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify({ online: false }))
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify({ online: false }))
        }
      })

      server.middlewares.use('/api/local-catalog', (req, res) => {
        try {
          const catalogPath = 'G:\\Mi unidad\\Radio\\catalog.json'
          if (!fs.existsSync(catalogPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
            res.end(JSON.stringify({ error: 'Catalog file not found' }))
            return
          }
          let content = fs.readFileSync(catalogPath, 'utf8')
          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1)
          }
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          })
          res.end(content)
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      server.middlewares.use('/api/local-audio', (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost')
          let targetPath = urlObj.searchParams.get('path')
          const fileName = urlObj.searchParams.get('file')

          if (!targetPath && fileName) {
            const baseDir = 'G:\\Mi unidad\\Radio'
            if (fs.existsSync(baseDir)) {
              const findFile = (dir) => {
                const entries = fs.readdirSync(dir, { withFileTypes: true })
                for (const e of entries) {
                  const full = path.join(dir, e.name)
                  if (e.isDirectory()) {
                    const found = findFile(full)
                    if (found) return found
                  } else if (e.name.toLowerCase() === fileName.toLowerCase() || decodeURIComponent(fileName).toLowerCase() === e.name.toLowerCase()) {
                    return full
                  }
                }
                return null
              }
              targetPath = findFile(baseDir)
            }
          }

          if (!targetPath || !fs.existsSync(targetPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Audio file not found' }))
            return
          }

          const stat = fs.statSync(targetPath)
          const fileSize = stat.size
          const range = req.headers.range

          const ext = path.extname(targetPath).toLowerCase()
          const mimeTypes = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp'
          }
          const contentType = mimeTypes[ext] || 'application/octet-stream'

          if (range) {
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
            const chunksize = (end - start) + 1
            const file = fs.createReadStream(targetPath, { start, end })
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*'
            })
            file.pipe(res)
          } else {
            res.writeHead(200, {
              'Content-Length': fileSize,
              'Content-Type': contentType,
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*'
            })
            fs.createReadStream(targetPath).pipe(res)
          }
        } catch (err) {
          console.error('[local-audio-dev error]', err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  }
}

function claudeDevPlugin(env) {
  return {
    name: 'claude-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/claude', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          try {
            const { recipeType, porciones = 1, sources = [], itemsAlmacen = [], produccionInterna = [] } = JSON.parse(body)
            const apiKey = env.ANTHROPIC_API_KEY
            if (!apiKey) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Agrega ANTHROPIC_API_KEY en tu archivo .env' }))
              return
            }
            const { default: Anthropic } = await import('@anthropic-ai/sdk')
            const client = new Anthropic({ apiKey })
            const response = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: buildSystemPrompt({ recipeType, porciones, itemsAlmacen, produccionInterna }),
              messages: [{ role: 'user', content: buildUserMessage(sources) }],
            })
            const payload = parseClaudeResponse(response.content[0].text)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(payload))
          } catch (err) {
            console.error('[claude-dev]', err.message)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      localAudioDevPlugin(),
      claudeDevPlugin(env),
      visualizer({ open: false, filename: 'dist/stats.html', gzipSize: true }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
            'vendor-redux':   ['@reduxjs/toolkit', 'react-redux', 'redux'],
            'vendor-ui':      ['framer-motion', 'lucide-react', 'react-icons'],
            'vendor-radix':   [
              '@radix-ui/react-checkbox', '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu', '@radix-ui/react-select',
              '@radix-ui/react-tabs', '@radix-ui/react-switch',
              '@radix-ui/react-scroll-area',
            ],
            'vendor-pdf':     ['jspdf', 'html2canvas', 'pdfjs-dist'],
            'vendor-supabase':['@supabase/supabase-js'],
            'vendor-xlsx':    ['xlsx'],
          },
        },
      },
    },
  }
})
