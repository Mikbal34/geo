// LLM Types
export type LLMProvider = 'chatgpt' | 'gemini' | 'perplexity'

export type SentimentType = 'positive' | 'neutral' | 'negative'

export interface LLMSource {
  url: string
  rank?: number
  title?: string
}

export interface LLMRun {
  id: string
  brand_id: string
  prompt_id: string
  llm: LLMProvider
  response_text: string
  sources: LLMSource[]
  sentiment: SentimentType | null
  created_at: string
}

export interface CreateLLMRunInput {
  brand_id: string
  prompt_id: string
  llm: LLMProvider
  response_text: string
  sources?: LLMSource[]
  sentiment?: SentimentType
}

export interface ScoreLLM {
  id: string
  brand_id: string
  llm: LLMProvider
  visibility_pct: number
  avg_position_raw: number | null
  sentiment_pct: number
  mentions_raw: number
  created_at: string
}

export interface CreateScoreLLMInput {
  brand_id: string
  llm: LLMProvider
  visibility_pct: number
  avg_position_raw: number | null
  sentiment_pct: number
  mentions_raw: number
}

export interface ScoreOverall {
  id: string
  brand_id: string
  visibility_pct: number
  avg_position_raw: number | null
  sentiment_pct: number
  mentions_raw_total: number
  created_at: string
}

export interface CreateScoreOverallInput {
  brand_id: string
  visibility_pct: number
  avg_position_raw: number | null
  sentiment_pct: number
  mentions_raw_total: number
}

// Scoring Configuration
export interface ScoringConfig {
  domain_variants: string[]
  weights: {
    visibility: number
    position: number
    sentiment: number
    mentions: number
  }
  llm_weights: {
    chatgpt: number
    gemini: number
    perplexity: number
  }
  max_rank: number
  mentions_cap: number
}

// Scoring Results
export interface LLMScoreResult {
  visibility_pct: number
  avg_position_raw: number | null
  sentiment_pct: number
  mentions_raw: number
}

export interface ScoringOutput {
  per_llm: {
    chatgpt: LLMScoreResult
    gemini: LLMScoreResult
    perplexity: LLMScoreResult
  }
  overall: {
    visibility_pct: number
    avg_position_raw: number | null
    sentiment_pct: number
    mentions_raw_total: number
  }
  meta: {
    brand_domain: string
    total_prompts: number
    llm_weights: Record<LLMProvider, number>
    params: {
      max_rank: number
      mentions_cap: number
    }
  }
}
