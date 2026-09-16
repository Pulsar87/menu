import { Context, Next } from 'hono'

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 500,
    public details?: any[]
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    if (err instanceof AppError) {
      return c.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        err.status as any
      )
    }

    // Log error for debugging
    console.error('Unhandled error:', err)

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      500 as any
    )
  }
}
