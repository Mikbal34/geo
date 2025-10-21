import { Brand } from '@/types/brand'
import { Prompt } from '@/types/prompt'
import { Competitor } from '@/types/competitor'
import { LLMProvider, CreateLLMRunInput } from '@/types/llm'
import { queryChatGPT } from './clients/chatgpt'
import { queryGemini } from './clients/gemini'
import { queryPerplexity } from './clients/perplexity'
import { analyzeBatchResponse, BrandAnalysisResult } from './analyzer-batch'

export interface CompetitorAnalysisMap {
  // Key: llm_run_id (unique identifier for each LLM response)
  // Value: Analysis results for all brands (target + competitors)
  [key: string]: BrandAnalysisResult[]
}

export interface LLMRunnerResult {
  llm_runs: CreateLLMRunInput[]
  competitor_analysis: CompetitorAnalysisMap
  errors: Array<{
    llm: LLMProvider
    prompt_id: string
    error: string
  }>
}

export async function runAllLLMs(
  brand: Brand,
  prompts: Prompt[],
  competitors: Competitor[] = []
): Promise<LLMRunnerResult> {
  const llm_runs: CreateLLMRunInput[] = []
  const competitor_analysis: CompetitorAnalysisMap = {}
  const errors: Array<{ llm: LLMProvider; prompt_id: string; error: string }> = []

  const llms: LLMProvider[] = ['chatgpt', 'gemini', 'perplexity']

  console.log(`Running ${prompts.length} prompts across ${llms.length} LLMs...`)
  console.log(`Brand: ${brand.brand_name}, Competitors: ${competitors.map(c => c.competitor_name).join(', ') || 'None'}`)

  // Prepare brands list for batch analyzer
  const brands = [
    { name: brand.brand_name, is_target: true },
    ...competitors.map(c => ({ name: c.competitor_name, is_target: false }))
  ]

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

          console.log(`Analyzing ${llm} response with GPT-4o-mini (batch mode for ${brands.length} brands)...`)

          // Use batch analyzer to analyze target brand + all competitors in ONE call
          const batchAnalysis = await analyzeBatchResponse({
            response_text: response.response_text,
            brands
          })

          // Find target brand analysis
          const targetAnalysis = batchAnalysis.results.find(r => r.brand_name === brand.brand_name)

          if (!targetAnalysis) {
            throw new Error(`Batch analyzer did not return analysis for target brand: ${brand.brand_name}`)
          }

          console.log(`✓ ${llm} analysis complete: target=${targetAnalysis.brand_name}, mentioned=${targetAnalysis.mentioned}, position=${targetAnalysis.position}, sentiment=${targetAnalysis.sentiment}`)

          // Generate unique key for this LLM run
          const runKey = `${brand.id}-${prompt.id}-${llm}`

          // Store all brand analysis results (including competitors)
          competitor_analysis[runKey] = batchAnalysis.results

          // Save target brand results to llm_runs
          llm_runs.push({
            brand_id: brand.id,
            prompt_id: prompt.id,
            llm,
            response_text: response.response_text,
            sources: response.sources,
            sentiment: targetAnalysis.sentiment,
            position: targetAnalysis.position,
            mentions_count: targetAnalysis.mentions_count,
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
  console.log(`Competitor analysis cached for ${Object.keys(competitor_analysis).length} LLM runs`)

  return { llm_runs, competitor_analysis, errors }
}
