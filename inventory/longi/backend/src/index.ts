import { config } from './config/config'

// Set DATABASE_URL before any Prisma imports
process.env.DATABASE_URL = config.databaseUrl

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { ApiError } from './utils/ApiError'
import { logger } from './utils/logger'

import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import inventoryRoutes from './routes/inventory'
import warehouseRoutes from './routes/warehouses'
import orderRoutes from './routes/orders'
import userRoutes from './routes/users'
import permissionRoutes from './routes/permissions'
import productGroupRoutes from './routes/productGroups'

const app = express()

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet())
app.use(morgan('combined'))
app.use(cookieParser())
app.use(express.json())

app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}))

// ─── Routes ─────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/warehouses', warehouseRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/product-groups', productGroupRoutes)

// ─── Global Error Handler ───────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message })
    return
  }
  logger.error('Unhandled error', { error: err.message })
  res.status(500).json({ success: false, message: 'Internal server error' })
})

// ─── Start ──────────────────────────────────────────────────────────────────

app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Inventory API server running on port ${config.port}`)
})
