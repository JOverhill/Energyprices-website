import { Router, Request, Response } from 'express'

const router = Router()

type CsvRow = Record<string, unknown>

interface CsvExportRequest {
  headers?: unknown
  rows?: unknown
  filename?: unknown
  viewMode?: unknown
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

router.post('/', (req: Request, res: Response) => {
  try {
    const payload = req.body as CsvExportRequest

    const rows = normaliseRows(payload.rows)
    const headerCandidates = normaliseHeaders(payload.headers)
    const headers = headerCandidates.length
      ? headerCandidates
      : Array.from(new Set(rows.flatMap(row => Object.keys(row ?? {}))))

    if (!headers.length) {
      res.status(400).send('CSV headers are required')
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

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`)
    res.send(csvContent)
  } catch (error) {
    console.error('CSV export error:', error)
    res.status(500).send('Failed to generate CSV export')
  }
})

export { router as csvExportRouter }
