import { ApiErrorCode, ErrorResponse } from '@/types/api'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: ApiErrorCode
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: ApiErrorCode.INTERNAL_ERROR,
    }
  }

  return {
    error: 'An unexpected error occurred',
    code: ApiErrorCode.INTERNAL_ERROR,
  }
}
