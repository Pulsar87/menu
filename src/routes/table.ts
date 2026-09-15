import { Hono } from 'hono'
import { prisma } from '../../lib/prisma'
import { AppError } from '../middleware/error-handler'
import crypto from 'crypto'

export const tableRoutes = new Hono()

// GET /api/v1/restaurants/:slug/tables - Get all tables for a restaurant (staff only)
tableRoutes.get('/', async (c) => {
  const slug = c.req.param('slug')

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      tables: {
        orderBy: { number: 'asc' },
      },
    },
  })

  if (!restaurant) {
    throw new AppError('NOT_FOUND', 'Restaurant not found', 404)
  }

  return c.json({ tables: restaurant.tables })
})

// POST /api/v1/restaurants/:slug/tables - Create a new table (staff only)
tableRoutes.post('/', async (c) => {
  const slug = c.req.param('slug')
  const { number, seats, zone } = await c.req.json()

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  })

  if (!restaurant) {
    throw new AppError('NOT_FOUND', 'Restaurant not found', 404)
  }

  // Generate unique QR token
  const qrToken = crypto.randomBytes(32).toString('hex')

  const table = await prisma.table.create({
    data: {
      restaurantId: restaurant.id,
      number,
      seats,
      zone,
      qrToken,
    },
  })

  return c.json({ table }, 201)
})

// POST /api/v1/restaurants/:slug/tables/:tableId/regenerate-qr - Regenerate QR token
tableRoutes.post('/:tableId/regenerate-qr', async (c) => {
  const tableId = c.req.param('tableId')

  const qrToken = crypto.randomBytes(32).toString('hex')

  const table = await prisma.table.update({
    where: { id: tableId },
    data: { qrToken },
  })

  return c.json({ table, qrUrl: `/m/${c.req.param('slug')}/t/${qrToken}` })
})

// DELETE /api/v1/restaurants/:slug/tables/:tableId - Delete a table
tableRoutes.delete('/:tableId', async (c) => {
  const tableId = c.req.param('tableId')

  await prisma.table.delete({
    where: { id: tableId },
  })

  return c.json({ success: true })
})
