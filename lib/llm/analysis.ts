import { openai } from './client'
import { BRAND_SCORING_PROMPT } from './prompts'
import { parseScoreResponse } from './parser'
import { Brand } from '@/types/brand'
import { Prompt } from '@/types/prompt'
import { Competitor } from '@/types/competitor'
import { ScoreDimension, ScoreReasoning, CreateScoreInput } from '@/types/score'

export interface AnalysisInput {
  brand: Brand
  prompts: Prompt[]
  competitors: Competitor[]
}

export interface AnalysisResult {
  scores: CreateScoreInput[]
}

export async function analyzeBrand(input: AnalysisInput): Promise<AnalysisResult> {
  const { brand, prompts, competitors } = input

  // Build the analysis prompt with placeholders replaced
  const systemPrompt = BRAND_SCORING_PROMPT
    .replace('{brand_name}', brand.brand_name)
    .replace('{domain}', brand.domain || 'N/A')
    .replace('{region}', brand.region || 'Global')
    .replace('{prompts}', prompts.map((p) => `- ${p.prompt_text}`).join('\n'))
    .replace('{competitors}', competitors.map((c) => `- ${c.competitor_name} (${c.competitor_domain})`).join('\n'))

  const userPrompt = 'Please analyze this brand and provide scores for all 6 dimensions.'

  // Retry logic with exponential backoff (max 3 attempts)
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Call OpenAI API with timeout
      const response = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM request timeout')), 30000)
        ),
      ])

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from LLM')
      }

      // Parse the response
      const parsed = parseScoreResponse(content)

      // Convert to database format
      const scores: CreateScoreInput[] = parsed.scores.map((s) => ({
        brand_id: brand.id,
        dimension: s.dimension,
        score: s.score,
        reasoning: s.reasoning,
      }))

      return { scores }
    } catch (error: any) {
      lastError = error
      console.error(`Analysis attempt ${attempt} failed:`, error.message)

      // Don't retry on the last attempt
      if (attempt < 3) {
        // Exponential backoff: 1s, 2s
        const delay = Math.pow(2, attempt - 1) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(
    `Analysis failed after 3 attempts: ${lastError?.message || 'Unknown error'}`
  )
}
