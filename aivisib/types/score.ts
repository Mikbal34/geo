export type ScoreDimension =
  | 'awareness'
  | 'consideration'
  | 'preference'
  | 'purchase_intent'
  | 'loyalty'
  | 'advocacy'

export interface ScoreReasoning {
  Relevance: {
    score: number
    reason: string
  }
  Clarity: {
    score: number
    reason: string
  }
  Consistency: {
    score: number
    reason: string
  }
  Creativity: {
    score: number
    reason: string
  }
  Emotional_Impact: {
    score: number
    reason: string
  }
}

export interface Score {
  id: string
  brand_id: string
  dimension: ScoreDimension
  score: number
  reasoning: string
  created_at: string
}

export interface CreateScoreInput {
  brand_id: string
  dimension: ScoreDimension
  score: number
  reasoning: string
}
