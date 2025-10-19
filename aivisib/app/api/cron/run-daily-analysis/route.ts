import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandById, getPromptsByBrandId, getCompetitorsByBrandId } from '@/lib/supabase/queries'
import { createLLMRunsBatch, createScoresLLMBatch, createScoreOverall } from '@/lib/supabase/queries'
import { runAllLLMs } from '@/lib/llm/llm-runner'
import { computeScores } from '@/lib/llm/compute-scores'

/**
 * Vercel Cron Job Endpoint
 * Runs daily at scheduled time (configured in vercel.json)
 * Analyzes all active brands automatically
 */
export async function GET(request: Request) {
  try {
    // Verify this is called by Vercel Cron (security check)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CRON] Starting daily analysis run...')

    const supabase = await createClient()

    // Get all brands
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')

    if (brandsError) throw brandsError

    console.log(`[CRON] Found ${brands.length} brands to analyze`)

    const results = []

    // Process each brand
    for (const brand of brands) {
      try {
        console.log(`[CRON] Processing brand: ${brand.brand_name}`)

        // Get prompts
        const prompts = await getPromptsByBrandId(brand.id)

        if (prompts.length === 0) {
          console.log(`[CRON] Skipping ${brand.brand_name} - no prompts`)
          continue
        }

        // Create analysis run record
        const { data: analysisRun, error: runError } = await supabase
          .from('analysis_runs')
          .insert({
            brand_id: brand.id,
            run_type: 'scheduled',
            status: 'running',
            total_prompts: prompts.length,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (runError) throw runError

        console.log(`[CRON] Created analysis run ${analysisRun.id} for ${brand.brand_name}`)

        // Check which prompts need LLM runs
        const { data: existingRuns } = await supabase
          .from('llm_runs')
          .select('prompt_id, llm')
          .in('prompt_id', prompts.map(p => p.id))

        const existingRunsByPrompt = new Map<string, Set<string>>()
        existingRuns?.forEach(run => {
          if (!existingRunsByPrompt.has(run.prompt_id)) {
            existingRunsByPrompt.set(run.prompt_id, new Set())
          }
          existingRunsByPrompt.get(run.prompt_id)!.add(run.llm)
        })

        const promptsNeedingRuns = prompts.filter(prompt => {
          const existingLLMs = existingRunsByPrompt.get(prompt.id)
          if (!existingLLMs) return true
          return existingLLMs.size < 3 ||
                 !existingLLMs.has('chatgpt') ||
                 !existingLLMs.has('gemini') ||
                 !existingLLMs.has('perplexity')
        })

        let newRuns: any[] = []
        let errors: any[] = []

        // Run LLMs only for new prompts
        if (promptsNeedingRuns.length > 0) {
          console.log(`[CRON] Running LLMs for ${promptsNeedingRuns.length} prompts`)
          const result = await runAllLLMs(brand, promptsNeedingRuns)
          newRuns = result.llm_runs
          errors = result.errors

          if (newRuns.length > 0) {
            await createLLMRunsBatch(newRuns)
          }
        }

        // Get all runs for scoring
        const { data: allRuns } = await supabase
          .from('llm_runs')
          .select('*')
          .in('prompt_id', prompts.map(p => p.id))

        const savedRuns = allRuns || []

        // Get competitors
        const competitors = await getCompetitorsByBrandId(brand.id)

        // Compute scores
        const scoringOutput = computeScores(brand, prompts, savedRuns, {}, competitors)

        // Save scores
        const llmScores = [
          { brand_id: brand.id, llm: 'chatgpt' as const, ...scoringOutput.per_llm.chatgpt },
          { brand_id: brand.id, llm: 'gemini' as const, ...scoringOutput.per_llm.gemini },
          { brand_id: brand.id, llm: 'perplexity' as const, ...scoringOutput.per_llm.perplexity },
        ]

        await createScoresLLMBatch(llmScores)

        const overallScore = await createScoreOverall({
          brand_id: brand.id,
          ...scoringOutput.overall,
        })

        // Save competitor scores
        if (scoringOutput.competitor_scores && scoringOutput.competitor_scores.length > 0) {
          await supabase
            .from('competitor_scores')
            .delete()
            .eq('brand_id', brand.id)

          const competitorScoreRecords = scoringOutput.competitor_scores.flatMap((compScore) => {
            const llmScores = [
              {
                competitor_id: compScore.competitor_id,
                brand_id: brand.id,
                llm: 'chatgpt',
                visibility_pct: compScore.per_llm.chatgpt.visibility_pct,
                avg_position_raw: compScore.per_llm.chatgpt.avg_position_raw,
                sentiment_pct: compScore.per_llm.chatgpt.sentiment_pct,
                mentions_raw_total: compScore.per_llm.chatgpt.mentions_raw,
                created_at: new Date().toISOString(),
              },
              {
                competitor_id: compScore.competitor_id,
                brand_id: brand.id,
                llm: 'gemini',
                visibility_pct: compScore.per_llm.gemini.visibility_pct,
                avg_position_raw: compScore.per_llm.gemini.avg_position_raw,
                sentiment_pct: compScore.per_llm.gemini.sentiment_pct,
                mentions_raw_total: compScore.per_llm.gemini.mentions_raw,
                created_at: new Date().toISOString(),
              },
              {
                competitor_id: compScore.competitor_id,
                brand_id: brand.id,
                llm: 'perplexity',
                visibility_pct: compScore.per_llm.perplexity.visibility_pct,
                avg_position_raw: compScore.per_llm.perplexity.avg_position_raw,
                sentiment_pct: compScore.per_llm.perplexity.sentiment_pct,
                mentions_raw_total: compScore.per_llm.perplexity.mentions_raw,
                created_at: new Date().toISOString(),
              },
            ]

            const overallScoreRecord = {
              competitor_id: compScore.competitor_id,
              brand_id: brand.id,
              llm: 'overall',
              visibility_pct: compScore.overall.visibility_pct,
              avg_position_raw: compScore.overall.avg_position_raw,
              sentiment_pct: compScore.overall.sentiment_pct,
              mentions_raw_total: compScore.overall.mentions_raw_total,
              created_at: new Date().toISOString(),
            }

            return [...llmScores, overallScoreRecord]
          })

          await supabase.from('competitor_scores').insert(competitorScoreRecords)
        }

        // Update analysis run with results
        await supabase
          .from('analysis_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            visibility_pct: scoringOutput.overall.visibility_pct,
            sentiment_pct: scoringOutput.overall.sentiment_pct,
            avg_position_raw: scoringOutput.overall.avg_position_raw,
            mentions_raw_total: scoringOutput.overall.mentions_raw_total,
            successful_llm_runs: newRuns.length,
            failed_llm_runs: errors.length,
            error_message: errors.length > 0 ? JSON.stringify(errors) : null
          })
          .eq('id', analysisRun.id)

        console.log(`[CRON] Completed analysis for ${brand.brand_name}`)

        results.push({
          brand_id: brand.id,
          brand_name: brand.brand_name,
          status: 'completed',
          new_runs: newRuns.length,
          errors: errors.length
        })

      } catch (error: any) {
        console.error(`[CRON] Error analyzing brand ${brand.brand_name}:`, error)

        // Try to update run status to failed
        try {
          await supabase
            .from('analysis_runs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error.message
            })
            .eq('brand_id', brand.id)
            .eq('status', 'running')
        } catch (updateError) {
          console.error('[CRON] Failed to update analysis run status:', updateError)
        }

        results.push({
          brand_id: brand.id,
          brand_name: brand.brand_name,
          status: 'failed',
          error: error.message
        })
      }
    }

    console.log('[CRON] Daily analysis run completed')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      brands_processed: brands.length,
      results
    })

  } catch (error: any) {
    console.error('[CRON] Daily analysis run failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run daily analysis' },
      { status: 500 }
    )
  }
}
