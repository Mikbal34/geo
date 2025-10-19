import { Brand } from '@/types/brand'
import { Prompt } from '@/types/prompt'
import { LLMProvider, CreateLLMRunInput } from '@/types/llm'
import { queryChatGPT } from './clients/chatgpt'
import { queryGemini } from './clients/gemini'
import { queryPerplexity } from './clients/perplexity'

export interface LLMRunnerResult {
  llm_runs: CreateLLMRunInput[]
  errors: Array<{
    llm: LLMProvider
    prompt_id: string
    error: string
  }>
}

export async function runAllLLMs(
  brand: Brand,
  prompts: Prompt[]
): Promise<LLMRunnerResult> {
  const llm_runs: CreateLLMRunInput[] = []
  const errors: Array<{ llm: LLMProvider; prompt_id: string; error: string }> = []

  const llms: LLMProvider[] = ['chatgpt', 'gemini', 'perplexity']

  console.log(`Running ${prompts.length} prompts across ${llms.length} LLMs...`)

  // Run all LLMs in parallel for all prompts
  await Promise.allSettled(
    prompts.flatMap((prompt) =>
      llms.map(async (llm) => {
        try {
          console.log(`Running ${llm} for prompt: ${prompt.prompt_text.substring(0, 50)}...`)

          let response
          switch (llm) {
            case 'chatgpt':
              response = await queryChatGPT(prompt.prompt_text)
              break
            case 'gemini':
              response = await queryGemini(prompt.prompt_text)
              break
            case 'perplexity':
              response = await queryPerplexity(prompt.prompt_text)
              break
          }

          // Simple sentiment analysis based on response text
          const sentiment = detectSentiment(response.response_text, brand.domain)

          llm_runs.push({
            brand_id: brand.id,
            prompt_id: prompt.id,
            llm,
            response_text: response.response_text,
            sources: response.sources,
            sentiment,
          })

          console.log(`✓ ${llm} completed for prompt`)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          console.error(`✗ ${llm} failed for prompt:`, errorMsg)
          errors.push({
            llm,
            prompt_id: prompt.id,
            error: errorMsg,
          })
        }
      })
    )
  )

  console.log(`Completed: ${llm_runs.length} successful, ${errors.length} errors`)

  return { llm_runs, errors }
}

function detectSentiment(text: string, domain: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase()
  const lowerDomain = domain.toLowerCase().replace(/^www\./, '').split('.')[0]

  // Check if domain is mentioned
  if (!lowerText.includes(lowerDomain)) {
    return 'neutral'
  }

  // Positive keywords
  const positiveKeywords = [
    'excellent',
    'great',
    'best',
    'highly recommend',
    'top',
    'leader',
    'innovative',
    'quality',
    'trusted',
    'reliable',
    'popular',
    'successful',
  ]

  // Negative keywords
  const negativeKeywords = [
    'poor',
    'bad',
    'worst',
    'avoid',
    'not recommend',
    'disappointed',
    'failed',
    'issue',
    'problem',
    'concern',
  ]

  let positiveCount = 0
  let negativeCount = 0

  for (const keyword of positiveKeywords) {
    if (lowerText.includes(keyword)) positiveCount++
  }

  for (const keyword of negativeKeywords) {
    if (lowerText.includes(keyword)) negativeCount++
  }

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}
