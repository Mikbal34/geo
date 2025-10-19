import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandById, getPromptsByBrandId, getCompetitorsByBrandId } from '@/lib/supabase/queries'
import { createLLMRunsBatch, createScoresLLMBatch, createScoreOverall } from '@/lib/supabase/queries'
import { runAllLLMs } from '@/lib/llm/llm-runner'
import { computeScores } from '@/lib/llm/compute-scores'

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Vercel Cron Job Endpoint
 * Runs every 5 minutes (configured in vercel.json)
 * Analyzes brands based on their individual auto-analysis intervals
 */
export async function GET(request: Request) {
  try {
    // Optional security check - only if CRON_SECRET is set
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('[CRON] Unauthorized request - invalid secret')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[CRON v2 - TIMEZONE FIX] Starting auto-analysis run...')

    const supabase = await createClient()

    // Get all brands with auto-analysis enabled
    const { data: allBrands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .eq('auto_analysis_enabled', true)

    if (brandsError) throw brandsError

    console.log(`[CRON] Found ${allBrands.length} brands with auto-analysis enabled`)

    // Filter brands that need analysis based on their interval
    const now = new Date()
    const brands = allBrands.filter(brand => {
      const interval = brand.auto_analysis_interval || 1440 // default 24 hours

      // FORCE UTC: Database doesn't include 'Z', so add it
      let lastRun = null
      if (brand.last_auto_analysis_at) {
        const lastRunStr = brand.last_auto_analysis_at.endsWith('Z')
          ? brand.last_auto_analysis_at
          : brand.last_auto_analysis_at + 'Z'
        lastRun = new Date(lastRunStr)
      }

      // If never run before, run now
      if (!lastRun) {
        console.log(`[CRON] Brand ${brand.brand_name} - first run`)
        return true
      }

      // Check if enough time has passed
      const minutesSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60)
      const shouldRun = minutesSinceLastRun >= interval

      console.log(`[CRON] Brand ${brand.brand_name} - ${minutesSinceLastRun.toFixed(1)} minutes since last run (interval: ${interval}, shouldRun: ${shouldRun})`)

      return shouldRun
    })

    console.log(`[CRON] ${brands.length} brands need analysis now`)

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

        // Run ALL prompts through LLMs every time to get fresh, up-to-date data
        // LLMs access the internet and competitor landscape changes over time
        console.log(`[CRON] Running LLMs for ALL ${prompts.length} prompts to get fresh data`)

        let newRuns: any[] = []
        let errors: any[] = []

        const result = await runAllLLMs(brand, prompts)
        newRuns = result.llm_runs
        errors = result.errors

        // Add analysis_run_id to all new runs for historical tracking
        const runsWithAnalysisId = newRuns.map(run => ({
          ...run,
          analysis_run_id: analysisRun.id
        }))

        // Save new LLM runs
        if (runsWithAnalysisId.length > 0) {
          await createLLMRunsBatch(runsWithAnalysisId)
        }

        // Get the runs we just created for scoring
        const { data: allRuns } = await supabase
          .from('llm_runs')
          .select('*')
          .eq('analysis_run_id', analysisRun.id)

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

        // Update last_auto_analysis_at for the brand
        await supabase
          .from('brands')
          .update({ last_auto_analysis_at: new Date().toISOString() })
          .eq('id', brand.id)

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

    console.log('[CRON v2 - TIMEZONE FIX] Auto-analysis run completed')

    return NextResponse.json({
      success: true,
      version: 'v2-timezone-fix',
      timestamp: new Date().toISOString(),
      brands_with_auto_analysis: allBrands.length,
      brands_analyzed: brands.length,
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
