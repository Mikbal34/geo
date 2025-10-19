import { z } from 'zod'
import { ScoreReasoning, ScoreDimension, CreateScoreInput } from '@/types/score'

// Schema for individual dimension score from GPT-4
const DimensionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string().min(10),
})

// Schema for GPT-4 response (flat object with dimensions as keys)
const GPTResponseSchema = z.object({
  awareness: DimensionScoreSchema,
  consideration: DimensionScoreSchema,
  preference: DimensionScoreSchema,
  purchase_intent: DimensionScoreSchema,
  loyalty: DimensionScoreSchema,
  advocacy: DimensionScoreSchema,
})

const ScoreItemSchema = z.object({
  dimension: z.enum(['awareness', 'consideration', 'preference', 'purchase_intent', 'loyalty', 'advocacy']),
  score: z.number().min(0).max(100),
  reasoning: z.string().min(10),
})

const ScoresResponseSchema = z.object({
  scores: z.array(ScoreItemSchema),
})

export function parseScoreResponse(content: string): { scores: Array<{ dimension: ScoreDimension; score: number; reasoning: string }> } {
  try {
    const parsed = JSON.parse(content)

    // Validate the GPT response format
    const validated = GPTResponseSchema.parse(parsed)

    // Convert flat object to array format
    const scores: Array<{ dimension: ScoreDimension; score: number; reasoning: string }> = [
      { dimension: 'awareness', score: validated.awareness.score, reasoning: validated.awareness.reasoning },
      { dimension: 'consideration', score: validated.consideration.score, reasoning: validated.consideration.reasoning },
      { dimension: 'preference', score: validated.preference.score, reasoning: validated.preference.reasoning },
      { dimension: 'purchase_intent', score: validated.purchase_intent.score, reasoning: validated.purchase_intent.reasoning },
      { dimension: 'loyalty', score: validated.loyalty.score, reasoning: validated.loyalty.reasoning },
      { dimension: 'advocacy', score: validated.advocacy.score, reasoning: validated.advocacy.reasoning },
    ]

    return { scores }
  } catch (error) {
    console.error('Failed to parse GPT response:', content)
    throw new Error(`Invalid GPT response format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function parseSuggestedPrompts(json: string): string[] {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) {
    throw new Error('Expected array of prompts')
  }
  return parsed.filter((p): p is string => typeof p === 'string')
}

export function parseSuggestedCompetitors(
  json: string
): Array<{ name: string; domain: string; region: string }> {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) {
    throw new Error('Expected array of competitors')
  }
  return parsed
}
