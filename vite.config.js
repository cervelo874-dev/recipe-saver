import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ローカル開発サーバー用の内蔵CORSプロキシプラグイン
function localCorsProxyPlugin() {
  return {
    name: 'local-cors-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/proxy')) {
          const parsedUrl = new URL(req.url, 'http://localhost')
          const targetUrl = parsedUrl.searchParams.get('url')
          if (!targetUrl) {
            res.statusCode = 400
            res.end('Missing url parameter')
            return
          }
          try {
            const fetchRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            })
            const text = await fetchRes.text()
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(text)
          } catch (e) {
            res.statusCode = 500
            res.end(e.message)
          }
          return
        }
        next()
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localCorsProxyPlugin()],
  base: process.env.NODE_ENV === 'production' ? '/recipe-saver/' : '/',
  build: {
    emptyOutDir: false
  }
})
