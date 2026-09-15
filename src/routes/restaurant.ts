import { Hono } from 'hono'
import { prisma } from '../../lib/prisma'
import { AppError } from '../middleware/error-handler'

export const restaurantRoutes = new Hono()

// GET /api/v1/restaurants/:slug - Get restaurant by slug
restaurantRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          menuItems: {
            where: { isAvailable: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      tables: true,
    },
  })

  if (!restaurant) {
    throw new AppError('NOT_FOUND', 'Restaurant not found', 404)
  }

  return c.json({ restaurant })
})

// GET /api/v1/restaurants - List all restaurants (for admin)
restaurantRoutes.get('/', async (c) => {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      address: true,
    },
  })

  return c.json({ restaurants })
})
