import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { AppError } from '../middleware/error-handler'

export const reviewRoutes = new Hono()

// Schema for creating a review
const createReviewSchema = z.object({
  customerName: z.string().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().optional(),
  images: z.array(z.string()).optional(),
})

// GET /api/v1/restaurants/:slug/reviews - Get reviews for a restaurant
reviewRoutes.get('/', async (c) => {
  const slug = c.req.param('slug')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const sort = c.req.query('sort') || 'newest'

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  })

  if (!restaurant) {
    throw new AppError('NOT_FOUND', 'Restaurant not found', 404)
  }

  const orderBy = sort === 'highest' 
    ? { rating: 'desc' as const } 
    : sort === 'lowest'
    ? { rating: 'asc' as const }
    : { createdAt: 'desc' as const }

  const reviews = await prisma.review.findMany({
    where: { restaurantId: restaurant.id },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.review.count({
    where: { restaurantId: restaurant.id },
  })

  // Calculate average rating
  const aggregate = await prisma.review.aggregate({
    where: { restaurantId: restaurant.id },
    _avg: { rating: true },
    _count: true,
  })

  return c.json({
    reviews,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
    aggregate: {
      averageRating: aggregate._avg.rating || 0,
      totalReviews: aggregate._count,
    },
  })
})

// POST /api/v1/restaurants/:slug/reviews - Create a review
reviewRoutes.post('/', async (c) => {
  const slug = c.req.param('slug')
  
  try {
    const body = await c.req.json()
    const validated = createReviewSchema.parse(body)

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
    })

    if (!restaurant) {
      throw new AppError('NOT_FOUND', 'Restaurant not found', 404)
    }

    const review = await prisma.review.create({
      data: {
        restaurantId: restaurant.id,
        customerName: validated.customerName,
        rating: validated.rating,
        text: validated.text,
        images: validated.images || [],
      },
    })

    return c.json({ review }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('VALIDATION_ERROR', 'Invalid request body', 400, error.errors)
    }
    throw error
  }
})

// DELETE /api/v1/restaurants/:slug/reviews/:id - Delete a review (staff only)
reviewRoutes.delete('/:id', async (c) => {
  const reviewId = c.req.param('id')

  await prisma.review.delete({
    where: { id: reviewId },
  })

  return c.json({ success: true })
})
