import { supabase } from './client'
import { Brand, CreateBrandInput } from '@/types/brand'
import { Prompt, CreatePromptInput } from '@/types/prompt'
import { Competitor, CreateCompetitorInput } from '@/types/competitor'
import { Score, CreateScoreInput } from '@/types/score'
import { LLMRun, CreateLLMRunInput, ScoreLLM, CreateScoreLLMInput, ScoreOverall, CreateScoreOverallInput } from '@/types/llm'

// Brand queries
export async function createBrand(input: CreateBrandInput) {
  const { data, error } = await supabase
    .from('brands')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Brand
}

export async function getBrandById(id: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Brand
}

export async function getBrandsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Brand[]
}

export async function getBrandWithRelations(id: string) {
  const { data, error } = await supabase
    .from('brands')
    .select(`
      *,
      prompts (*),
      competitors (*),
      scores (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Prompt queries
export async function createPrompt(input: CreatePromptInput) {
  const { data, error } = await supabase
    .from('prompts')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Prompt
}

export async function getPromptsByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Prompt[]
}

export async function createPromptsBatch(inputs: CreatePromptInput[]) {
  const { data, error } = await supabase
    .from('prompts')
    .insert(inputs)
    .select()

  if (error) throw error
  return data as Prompt[]
}

// Competitor queries
export async function createCompetitor(input: CreateCompetitorInput) {
  const { data, error } = await supabase
    .from('competitors')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Competitor
}

export async function getCompetitorsByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Competitor[]
}

export async function checkDuplicateCompetitor(
  brandId: string,
  domain: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('competitors')
    .select('id')
    .eq('brand_id', brandId)
    .eq('competitor_domain', domain)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

// Score queries
export async function createScore(input: CreateScoreInput) {
  const { data, error } = await supabase
    .from('scores')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as Score
}

export async function createScoresBatch(inputs: CreateScoreInput[]) {
  const { data, error } = await supabase
    .from('scores')
    .insert(inputs)
    .select()

  if (error) throw error
  return data as Score[]
}

export async function getScoresByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Score[]
}

export async function getLatestScoresByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) throw error
  return data as Score[]
}

export async function deleteScoresByBrandId(brandId: string) {
  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('brand_id', brandId)

  if (error) throw error
}

// LLM Run queries
export async function createLLMRun(input: CreateLLMRunInput) {
  const { data, error } = await supabase
    .from('llm_runs')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as LLMRun
}

export async function createLLMRunsBatch(inputs: CreateLLMRunInput[]) {
  const { data, error } = await supabase
    .from('llm_runs')
    .insert(inputs)
    .select()

  if (error) throw error
  return data as LLMRun[]
}

export async function getLLMRunsByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('llm_runs')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as LLMRun[]
}

export async function getLatestLLMRunsByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('llm_runs')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(100) // Get latest analysis runs

  if (error) throw error
  return data as LLMRun[]
}

// LLM Score queries
export async function createScoreLLM(input: CreateScoreLLMInput) {
  const { data, error } = await supabase
    .from('scores_llm')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as ScoreLLM
}

export async function createScoresLLMBatch(inputs: CreateScoreLLMInput[]) {
  const { data, error } = await supabase
    .from('scores_llm')
    .insert(inputs)
    .select()

  if (error) throw error
  return data as ScoreLLM[]
}

export async function getLatestScoresLLMByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('scores_llm')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(3) // Latest scores for 3 LLMs

  if (error) throw error
  return data as ScoreLLM[]
}

// Overall Score queries
export async function createScoreOverall(input: CreateScoreOverallInput) {
  const { data, error } = await supabase
    .from('scores_overall')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as ScoreOverall
}

export async function getLatestScoreOverallByBrandId(brandId: string) {
  const { data, error } = await supabase
    .from('scores_overall')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] as ScoreOverall | null
}
