/**
 * API Contract Types for Brand Analysis Platform
 *
 * This file defines TypeScript interfaces for all API requests and responses.
 * It ensures type safety between frontend and backend (API routes).
 *
 * Generated from: api-contracts.yaml
 * Date: 2025-10-15
 */

// ============================================================================
// BRAND TYPES
// ============================================================================

export interface CreateBrandRequest {
  brand_name: string // 1-255 chars
  domain: string // Valid domain format
  region: string // 1-100 chars
}

export interface BrandResponse {
  id: string // UUID
  brand_name: string
  domain: string
  region: string
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

export interface BrandDetailResponse extends BrandResponse {
  prompts: PromptResponse[]
  competitors: CompetitorResponse[]
  latest_score: AnalysisResponse | null
}

// ============================================================================
// PROMPT TYPES
// ============================================================================

export interface CreatePromptRequest {
  brand_id: string // UUID
  prompt_text: string // 10-2000 chars
}

export interface PromptResponse {
  id: string // UUID
  brand_id: string // UUID
  prompt_text: string
  is_ai_generated: boolean
  created_at: string // ISO 8601
}

export interface SuggestPromptsRequest {
  brand_id: string // UUID
  count?: number // 1-10, default 5
}

export interface SuggestPromptsResponse {
  prompts: PromptResponse[]
}

// ============================================================================
// COMPETITOR TYPES
// ============================================================================

export interface CreateCompetitorRequest {
  brand_id: string // UUID
  competitor_name: string // 1-255 chars
  competitor_domain: string // Valid domain format
  region: string // 1-100 chars
}

export interface CompetitorResponse {
  id: string // UUID
  brand_id: string // UUID
  competitor_name: string
  competitor_domain: string
  region: string
  is_ai_generated: boolean
  created_at: string // ISO 8601
}

export interface SuggestCompetitorsRequest {
  brand_id: string // UUID
  count?: number // 1-10, default 5
}

export interface SuggestCompetitorsResponse {
  competitors: CompetitorResponse[]
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export interface RunAnalysisRequest {
  brand_id: string // UUID
}

export interface ScoreDimension {
  score: number // 0-100
  reason: string // Min 10 chars
}

export interface ScoreReasoning {
  Relevance: ScoreDimension
  Clarity: ScoreDimension
  Consistency: ScoreDimension
  Creativity: ScoreDimension
  Emotional_Impact: ScoreDimension
}

export interface AnalysisResponse {
  id: string // UUID
  brand_id: string // UUID
  relevance: number // 0-100
  clarity: number // 0-100
  consistency: number // 0-100
  creativity: number // 0-100
  emotional_impact: number // 0-100
  reasoning_json: ScoreReasoning
  model_used: string // e.g., "gpt-4-turbo-preview"
  analysis_duration_ms: number | null
  created_at: string // ISO 8601
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorResponse {
  error: string // Human-readable message
  code?: string // Machine-readable code
  details?: Record<string, unknown> // Additional context
}

// ============================================================================
// API ERROR CODES
// ============================================================================

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

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Domain validation regex (matches OpenAPI pattern)
 */
export const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/

/**
 * Validates domain format
 */
export function isValidDomain(domain: string): boolean {
  return DOMAIN_REGEX.test(domain)
}

/**
 * Validates score is in range 0-100
 */
export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 100
}

/**
 * Validates prompt text length
 */
export function isValidPromptText(text: string): boolean {
  return text.length >= 10 && text.length <= 2000
}

/**
 * Validates brand name length
 */
export function isValidBrandName(name: string): boolean {
  return name.length >= 1 && name.length <= 255
}

/**
 * Validates region text length
 */
export function isValidRegion(region: string): boolean {
  return region.length >= 1 && region.length <= 100
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for ErrorResponse
 */
export function isErrorResponse(obj: unknown): obj is ErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    typeof (obj as ErrorResponse).error === 'string'
  )
}

/**
 * Type guard for BrandResponse
 */
export function isBrandResponse(obj: unknown): obj is BrandResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'brand_name' in obj &&
    'domain' in obj &&
    'region' in obj
  )
}

/**
 * Type guard for AnalysisResponse
 */
export function isAnalysisResponse(obj: unknown): obj is AnalysisResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'relevance' in obj &&
    'clarity' in obj &&
    'consistency' in obj &&
    'creativity' in obj &&
    'emotional_impact' in obj &&
    'reasoning_json' in obj
  )
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API response wrapper for consistent error handling
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ErrorResponse }

/**
 * Extract score values as array for charting
 */
export type ScoreArray = [
  relevance: number,
  clarity: number,
  consistency: number,
  creativity: number,
  emotional_impact: number
]

/**
 * Convert AnalysisResponse to ScoreArray for charts
 */
export function toScoreArray(analysis: AnalysisResponse): ScoreArray {
  return [
    analysis.relevance,
    analysis.clarity,
    analysis.consistency,
    analysis.creativity,
    analysis.emotional_impact,
  ]
}

/**
 * Dimension names in display order
 */
export const SCORE_DIMENSIONS = [
  'Relevance',
  'Clarity',
  'Consistency',
  'Creativity',
  'Emotional Impact',
] as const

export type ScoreDimensionName = typeof SCORE_DIMENSIONS[number]

/**
 * Map dimension names to score values
 */
export function getScoreByDimension(
  analysis: AnalysisResponse,
  dimension: ScoreDimensionName
): number {
  const map: Record<ScoreDimensionName, number> = {
    Relevance: analysis.relevance,
    Clarity: analysis.clarity,
    Consistency: analysis.consistency,
    Creativity: analysis.creativity,
    'Emotional Impact': analysis.emotional_impact,
  }
  return map[dimension]
}

/**
 * Map dimension names to reasoning
 */
export function getReasoningByDimension(
  analysis: AnalysisResponse,
  dimension: ScoreDimensionName
): ScoreDimension {
  const map: Record<ScoreDimensionName, ScoreDimension> = {
    Relevance: analysis.reasoning_json.Relevance,
    Clarity: analysis.reasoning_json.Clarity,
    Consistency: analysis.reasoning_json.Consistency,
    Creativity: analysis.reasoning_json.Creativity,
    'Emotional Impact': analysis.reasoning_json.Emotional_Impact,
  }
  return map[dimension]
}

// ============================================================================
// HTTP CLIENT TYPES (for fetch/axios wrappers)
// ============================================================================

/**
 * Standard HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Brands
  CREATE_BRAND: '/api/brands',
  GET_BRAND: (brandId: string) => `/api/brands/${brandId}`,

  // Prompts
  CREATE_PROMPT: '/api/prompts',
  SUGGEST_PROMPTS: '/api/prompts/suggest',
  LIST_PROMPTS: (brandId: string) => `/api/prompts/${brandId}`,

  // Competitors
  CREATE_COMPETITOR: '/api/competitors',
  SUGGEST_COMPETITORS: '/api/competitors/suggest',
  LIST_COMPETITORS: (brandId: string) => `/api/competitors/${brandId}`,

  // Analysis
  RUN_ANALYSIS: '/api/analysis',
  MOCK_ANALYSIS: '/api/analysis/mock',
  LATEST_ANALYSIS: (brandId: string) => `/api/analysis/${brandId}/latest`,
} as const

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl?: string // Default: '' (relative)
  timeout?: number // Request timeout in ms
  headers?: Record<string, string> // Additional headers
}
