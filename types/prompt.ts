export interface Prompt {
  id: string
  brand_id: string
  prompt_text: string
  is_ai_generated: boolean
  created_at: string
}

export interface CreatePromptInput {
  brand_id: string
  prompt_text: string
  is_ai_generated?: boolean
}

export interface SuggestPromptsInput {
  brand_id: string
  count?: number // Default: 5
}
