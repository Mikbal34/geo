export interface Brand {
  id: string
  brand_name: string
  domain: string
  region: string
  created_at: string
  updated_at: string
}

export interface CreateBrandInput {
  brand_name: string
  domain: string
  region: string
}
