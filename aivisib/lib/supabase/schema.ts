import { Brand } from '@/types/brand'
import { Prompt } from '@/types/prompt'
import { Competitor } from '@/types/competitor'
import { Score } from '@/types/score'

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: Brand
        Insert: Omit<Brand, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Brand, 'id' | 'created_at' | 'updated_at'>>
      }
      prompts: {
        Row: Prompt
        Insert: Omit<Prompt, 'id' | 'created_at'>
        Update: Partial<Omit<Prompt, 'id' | 'created_at'>>
      }
      competitors: {
        Row: Competitor
        Insert: Omit<Competitor, 'id' | 'created_at'>
        Update: Partial<Omit<Competitor, 'id' | 'created_at'>>
      }
      scores: {
        Row: Score
        Insert: Omit<Score, 'id' | 'created_at'>
        Update: Partial<Omit<Score, 'id' | 'created_at'>>
      }
    }
  }
}
