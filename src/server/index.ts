import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from './middleware/error-handler'
import { restaurantRoutes } from '../routes/restaurant'
import { menuRoutes } from '../routes/menu'
import { orderRoutes } from '../routes/order'
import { tableRoutes } from '../routes/table'
import { reviewRoutes } from '../routes/review'

export const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// Error handling
app.use('*', errorHandler)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/ready', (c) => {
  return c.json({ status: 'ready' })
})

// API routes
const apiRoutes = app.basePath('/api/v1')

// Public routes
apiRoutes.route('/restaurants', restaurantRoutes)
apiRoutes.route('/restaurants/:slug/menu', menuRoutes)
apiRoutes.route('/restaurants/:slug/reviews', reviewRoutes)

// Protected routes will be added with auth middleware
apiRoutes.route('/orders', orderRoutes)
apiRoutes.route('/restaurants/:slug/tables', tableRoutes)

export type AppType = typeof app
