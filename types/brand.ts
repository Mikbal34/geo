export interface Brand {
  id: string
  brand_name: string
  domain: string
  region: string
  user_id: string
  created_at: string
  updated_at: string
  auto_analysis_enabled?: boolean
  auto_analysis_interval?: number // in minutes
  last_auto_analysis_at?: string | null
}

export interface CreateBrandInput {
  brand_name: string
  domain: string
  region: string
}
