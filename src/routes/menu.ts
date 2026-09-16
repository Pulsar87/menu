import { Hono } from 'hono'
import { prisma } from '../../lib/prisma'
import { AppError } from '../middleware/error-handler'

export const menuRoutes = new Hono()

// GET /api/v1/restaurants/:slug/menu - Get full menu for a restaurant
menuRoutes.get('/', async (c) => {
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
    },
  })

  if (!restaurant) {
    throw new AppError('NOT_FOUND', 'Restaurant not found', 404)
  }

  return c.json({ 
    menu: {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        currency: restaurant.currency,
      },
      categories: restaurant.categories,
    }
  })
})

// GET /api/v1/restaurants/:slug/menu/search - Search menu items
menuRoutes.get('/search', async (c) => {
  const slug = c.req.param('slug')
  const query = c.req.query('q')
  
  if (!query) {
    return c.json({ items: [] })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  })

  if (!restaurant) {
    throw new AppError('NOT_FOUND', 'Restaurant not found', 404)
  }

  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId: restaurant.id,
      isAvailable: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  })

  return c.json({ items })
})
