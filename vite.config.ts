import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Connect, Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const readRequestBody = async (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', chunk => {
      body += chunk
    })

    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }

  if (Array.isArray(value)) {
    return escapeCsvValue(value.map(item => (item ?? '')).join('|'))
  }

  if (typeof value === 'object') {
    return escapeCsvValue(JSON.stringify(value))
  }

  const stringValue = String(value)

  if (/[",\n\r]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"'
  }

  return stringValue
}

type CsvRow = Record<string, unknown>

interface CsvExportRequest {
  headers?: unknown
  rows?: unknown
  filename?: unknown
  viewMode?: unknown
}

const normaliseRows = (input: unknown): CsvRow[] => {
  if (!Array.isArray(input)) {
    return []
  }

  return input.filter((row): row is CsvRow => {
    return row !== null && typeof row === 'object' && !Array.isArray(row)
  })
}

const normaliseHeaders = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return []
  }

  return (input as unknown[])
    .map(header => String(header ?? '').trim())
    .filter(header => header.length > 0)
}

const createCsvExportMiddleware = (): Connect.NextHandleFunction => {
  return async (req: IncomingMessage, res: ServerResponse, _next: Connect.NextFunction) => {
    void _next

    if (req.method !== 'POST') {
      res.statusCode = req.method === 'OPTIONS' ? 200 : 405
      res.setHeader('Allow', 'POST')
      res.end(req.method === 'OPTIONS' ? '' : 'Method Not Allowed')
      return
    }

    try {
      const rawBody = await readRequestBody(req)

      if (!rawBody) {
        res.statusCode = 400
        res.end('Request body is required')
        return
      }

      try {
        const payload = JSON.parse(rawBody) as CsvExportRequest

        const rows = normaliseRows(payload.rows)
        const headerCandidates = normaliseHeaders(payload.headers)
        const headers = headerCandidates.length
          ? headerCandidates
          : Array.from(new Set(rows.flatMap(row => Object.keys(row ?? {}))))

        if (!headers.length) {
          res.statusCode = 400
          res.end('CSV headers are required')
          return
        }

        const lines = [headers.join(',')]

        rows.forEach(row => {
          const line = headers.map(header => escapeCsvValue(row[header]))
          lines.push(line.join(','))
        })

        const csvContent = lines.join('\n')

        const viewMode = typeof payload.viewMode === 'string' && payload.viewMode.trim().length
          ? payload.viewMode.trim()
          : 'data'

        const filenameBase = typeof payload.filename === 'string' && payload.filename.trim().length
          ? payload.filename.trim()
          : `energy-prices-${viewMode}`
        const filename = filenameBase.endsWith('.csv') ? filenameBase : `${filenameBase}.csv`
        const safeFilename = filename.replace(/[\r\n"]/g, '')

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`)
        res.end(csvContent)
      } catch {
        res.statusCode = 400
        res.end('Request body must be valid JSON')
        return
      }
    } catch (err) {
      console.error('Failed to generate CSV export', err)
      res.statusCode = 500
      res.end('Failed to generate CSV export')
    }
  }
}

const csvExportPlugin = (): Plugin => ({
  name: 'energy-csv-export-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/export', createCsvExportMiddleware())
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api/export', createCsvExportMiddleware())
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), csvExportPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'https://web-api.tp.entsoe.eu',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
