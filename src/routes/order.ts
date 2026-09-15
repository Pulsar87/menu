import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { AppError } from '../middleware/error-handler'

export const orderRoutes = new Hono()

// Schema for creating an order
const createOrderSchema = z.object({
  tableToken: z.string(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().min(1),
    modifiers: z.array(z.object({
      name: z.string(),
      extraPriceCents: z.number().optional(),
    })).optional(),
    specialInstructions: z.string().optional(),
  })),
  notes: z.string().optional(),
  tipCents: z.number().min(0).default(0),
})

// POST /api/v1/orders - Create a new order (guest with table token)
orderRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validated = createOrderSchema.parse(body)

    // Find table by token
    const table = await prisma.table.findUnique({
      where: { qrToken: validated.tableToken },
      include: { restaurant: true },
    })

    if (!table) {
      throw new AppError('NOT_FOUND', 'Invalid table token', 404)
    }

    // Calculate totals
    let subtotalCents = 0
    const orderItemsData = []

    for (const item of validated.items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      })

      if (!menuItem || !menuItem.isAvailable) {
        throw new AppError('BAD_REQUEST', `Menu item ${item.menuItemId} is not available`, 400)
      }

      const modifierTotal = item.modifiers?.reduce((sum, m) => sum + (m.extraPriceCents || 0), 0) || 0
      const lineTotalCents = (menuItem.priceCents + modifierTotal) * item.quantity
      subtotalCents += lineTotalCents

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        modifiers: item.modifiers || [],
        specialInstructions: item.specialInstructions,
        lineTotalCents,
      })
    }

    const taxCents = Math.round(subtotalCents * 0.1) // 10% tax
    const totalCents = subtotalCents + taxCents + validated.tipCents

    // Create order
    const order = await prisma.order.create({
      data: {
        restaurantId: table.restaurantId,
        tableId: table.id,
        status: 'PLACED',
        items: validated.items,
        notes: validated.notes,
        subtotalCents,
        taxCents,
        tipCents: validated.tipCents,
        totalCents,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        table: {
          include: { restaurant: true },
        },
        orderItems: {
          include: { menuItem: true },
        },
      },
    })

    // TODO: Emit WebSocket event to KDS
    // TODO: Queue notification job via BullMQ

    return c.json({ order }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('VALIDATION_ERROR', 'Invalid request body', 400, error.errors)
    }
    throw error
  }
})

// GET /api/v1/orders/:id - Get order details
orderRoutes.get('/:id', async (c) => {
  const orderId = c.req.param('id')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: {
        include: { restaurant: true },
      },
      orderItems: {
        include: { menuItem: true },
      },
    },
  })

  if (!order) {
    throw new AppError('NOT_FOUND', 'Order not found', 404)
  }

  return c.json({ order })
})

// PATCH /api/v1/orders/:id/status - Update order status (staff only)
orderRoutes.patch('/:id/status', async (c) => {
  const orderId = c.req.param('id')
  const { status } = await c.req.json()

  const validStatuses = ['PLACED', 'PREPARING', 'READY', 'DELIVERED', 'PAID', 'CANCELLED']
  if (!validStatuses.includes(status)) {
    throw new AppError('BAD_REQUEST', 'Invalid status', 400)
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      kitchenConfirmedAt: status === 'PREPARING' ? new Date() : undefined,
    },
    include: {
      table: true,
      orderItems: {
        include: { menuItem: true },
      },
    },
  })

  // TODO: Emit WebSocket event to guest and KDS
  // TODO: Queue notification job

  return c.json({ order })
})
