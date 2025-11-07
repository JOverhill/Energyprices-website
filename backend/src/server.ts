import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { csvExportRouter } from './routes/csvExport.js'
import { authRouter } from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Energy Prices API is running' })
})

app.use('/api/export', csvExportRouter)
app.use('/api/auth', authRouter)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 CSV Export: http://localhost:${PORT}/api/export`)
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`)
})
