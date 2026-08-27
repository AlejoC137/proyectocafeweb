import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { visualizer } from 'rollup-plugin-visualizer'
import { buildSystemPrompt, buildUserMessage, parseClaudeResponse } from './api/_claudeHelpers.js'

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
