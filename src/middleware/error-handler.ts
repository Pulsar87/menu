import { Context } from 'hono'

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

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.status
    )
  }

  // Log error for debugging
  console.error('Unhandled error:', err)

  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    500
  )
}
