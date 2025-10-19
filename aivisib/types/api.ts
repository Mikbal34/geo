export interface ErrorResponse {
  error: string
  code?: string
  details?: Record<string, unknown>
}

export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_DOMAIN = 'DUPLICATE_DOMAIN',
  DUPLICATE_COMPETITOR = 'DUPLICATE_COMPETITOR',
  MISSING_PROMPTS = 'MISSING_PROMPTS',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  LLM_ERROR = 'LLM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ErrorResponse }
