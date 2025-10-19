export interface Competitor {
  id: string
  brand_id: string
  competitor_name: string
  competitor_domain: string
  region: string
  is_ai_generated: boolean
  created_at: string
}

export interface CreateCompetitorInput {
  brand_id: string
  competitor_name: string
  competitor_domain: string
  region: string
  is_ai_generated?: boolean
}

export interface SuggestCompetitorsInput {
  brand_id: string
  count?: number // Default: 5
}
