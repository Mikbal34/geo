import { NextResponse } from 'next/server'
import { getBrandById, getPromptsByBrandId, getCompetitorsByBrandId } from '@/lib/supabase/queries'
import { createLLMRunsBatch, createScoresLLMBatch, createScoreOverall } from '@/lib/supabase/queries'
import { runAllLLMs } from '@/lib/llm/llm-runner'
import { computeScores } from '@/lib/llm/compute-scores'
import { formatErrorResponse, AppError } from '@/lib/utils/errors'
import { ApiErrorCode } from '@/types/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brandId } = body

    if (!brandId) {
      return NextResponse.json(
        formatErrorResponse(
          new AppError(400, 'Brand ID is required', ApiErrorCode.VALIDATION_ERROR)
        ),
        { status: 400 }
      )
    }

    // Fetch brand, prompts, and competitors
    const [brand, prompts, competitors] = await Promise.all([
      getBrandById(brandId),
      getPromptsByBrandId(brandId),
      getCompetitorsByBrandId(brandId),
    ])

    // Validate prerequisites
    if (prompts.length === 0) {
      return NextResponse.json(
        formatErrorResponse(
          new AppError(
            400,
            'At least one prompt is required for analysis',
            ApiErrorCode.VALIDATION_ERROR
          )
        ),
        { status: 400 }
      )
    }

    console.log(`Starting analysis for brand ${brand.brand_name} with ${prompts.length} prompts`)

    // Step 0: Create analysis run record
    const { supabase } = await import('@/lib/supabase/client')

    const { data: analysisRun, error: runError } = await supabase
      .from('analysis_runs')
      .insert({
        brand_id: brandId,
        run_type: 'manual',
        status: 'running',
        total_prompts: prompts.length,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (runError) {
      console.error('Failed to create analysis run:', runError)
    }

    // Step 1: Find prompts that don't have LLM runs yet
    const { data: existingRuns } = await supabase
      .from('llm_runs')
      .select('prompt_id, llm')
      .in('prompt_id', prompts.map(p => p.id))

    // Group existing runs by prompt_id
    const existingRunsByPrompt = new Map<string, Set<string>>()
    existingRuns?.forEach(run => {
      if (!existingRunsByPrompt.has(run.prompt_id)) {
        existingRunsByPrompt.set(run.prompt_id, new Set())
      }
      existingRunsByPrompt.get(run.prompt_id)!.add(run.llm)
    })

    // Filter prompts that need LLM runs (don't have all 3 LLMs)
    const promptsNeedingRuns = prompts.filter(prompt => {
      const existingLLMs = existingRunsByPrompt.get(prompt.id)
      if (!existingLLMs) return true // No runs at all
      // Need all 3 LLMs: chatgpt, gemini, perplexity
      return existingLLMs.size < 3 ||
             !existingLLMs.has('chatgpt') ||
             !existingLLMs.has('gemini') ||
             !existingLLMs.has('perplexity')
    })

    console.log(`${promptsNeedingRuns.length} prompts need new LLM runs`)

    let newRuns: any[] = []
    let errors: any[] = []

    // Step 1: Run LLMs only for prompts that need it
    if (promptsNeedingRuns.length > 0) {
      const result = await runAllLLMs(brand, promptsNeedingRuns)
      newRuns = result.llm_runs
      errors = result.errors

      // Step 2: Save new LLM runs to database
      if (newRuns.length > 0) {
        await createLLMRunsBatch(newRuns)
      }
    }

    // Step 3: Get all LLM runs for scoring (existing + new)
    const { data: allRuns } = await supabase
      .from('llm_runs')
      .select('*')
      .in('prompt_id', prompts.map(p => p.id))

    const savedRuns = allRuns || []

    // Step 3: Compute scores (including competitor scores)
    console.log(`Computing scores with ${competitors.length} competitors`)
    const scoringOutput = computeScores(brand, prompts, savedRuns, {}, competitors)
    console.log(`Competitor scores computed:`, scoringOutput.competitor_scores?.length || 0)

    // Step 4: Save scores to database
    const llmScores = [
      { brand_id: brandId, llm: 'chatgpt' as const, ...scoringOutput.per_llm.chatgpt },
      { brand_id: brandId, llm: 'gemini' as const, ...scoringOutput.per_llm.gemini },
      { brand_id: brandId, llm: 'perplexity' as const, ...scoringOutput.per_llm.perplexity },
    ]

    await createScoresLLMBatch(llmScores)

    const overallScore = await createScoreOverall({
      brand_id: brandId,
      ...scoringOutput.overall,
    })

    // Step 5: Save competitor scores if available
    if (scoringOutput.competitor_scores && scoringOutput.competitor_scores.length > 0) {
      const { supabase } = await import('@/lib/supabase/client')

      // Delete old competitor scores for this brand
      await supabase
        .from('competitor_scores')
        .delete()
        .eq('brand_id', brandId)

      const competitorScoreRecords = scoringOutput.competitor_scores.flatMap((compScore) => {
        // Save per-LLM scores
        const llmScores = [
          {
            competitor_id: compScore.competitor_id,
            brand_id: brandId,
            llm: 'chatgpt',
            visibility_pct: compScore.per_llm.chatgpt.visibility_pct,
            avg_position_raw: compScore.per_llm.chatgpt.avg_position_raw,
            sentiment_pct: compScore.per_llm.chatgpt.sentiment_pct,
            mentions_raw_total: compScore.per_llm.chatgpt.mentions_raw,
            created_at: new Date().toISOString(),
          },
          {
            competitor_id: compScore.competitor_id,
            brand_id: brandId,
            llm: 'gemini',
            visibility_pct: compScore.per_llm.gemini.visibility_pct,
            avg_position_raw: compScore.per_llm.gemini.avg_position_raw,
            sentiment_pct: compScore.per_llm.gemini.sentiment_pct,
            mentions_raw_total: compScore.per_llm.gemini.mentions_raw,
            created_at: new Date().toISOString(),
          },
          {
            competitor_id: compScore.competitor_id,
            brand_id: brandId,
            llm: 'perplexity',
            visibility_pct: compScore.per_llm.perplexity.visibility_pct,
            avg_position_raw: compScore.per_llm.perplexity.avg_position_raw,
            sentiment_pct: compScore.per_llm.perplexity.sentiment_pct,
            mentions_raw_total: compScore.per_llm.perplexity.mentions_raw,
            created_at: new Date().toISOString(),
          },
        ]

        // Save overall score
        const overallScore = {
          competitor_id: compScore.competitor_id,
          brand_id: brandId,
          llm: 'overall',
          visibility_pct: compScore.overall.visibility_pct,
          avg_position_raw: compScore.overall.avg_position_raw,
          sentiment_pct: compScore.overall.sentiment_pct,
          mentions_raw_total: compScore.overall.mentions_raw_total,
          created_at: new Date().toISOString(),
        }

        return [...llmScores, overallScore]
      })

      // Batch insert all competitor scores
      console.log(`Inserting ${competitorScoreRecords.length} competitor score records`)
      const { data, error: insertError } = await supabase.from('competitor_scores').insert(competitorScoreRecords)
      if (insertError) {
        console.error('Failed to insert competitor scores:', JSON.stringify(insertError, null, 2))
      } else {
        console.log(`Successfully inserted ${data?.length || competitorScoreRecords.length} competitor scores`)
      }
    }

    console.log(`Analysis complete: ${newRuns.length} new runs, ${savedRuns.length} total runs, ${errors.length} errors`)

    // Update analysis run with results
    if (analysisRun) {
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
    }

    return NextResponse.json(
      {
        success: true,
        new_runs_count: newRuns.length,
        total_runs_count: savedRuns.length,
        errors_count: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        overall_score: overallScore,
        competitor_scores: scoringOutput.competitor_scores,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Analysis error:', error)

    // Try to mark analysis run as failed
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const body = await request.json()
      const { brandId } = body

      await supabase
        .from('analysis_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message || 'Unknown error'
        })
        .eq('brand_id', brandId)
        .eq('status', 'running')
    } catch (updateError) {
      console.error('Failed to update analysis run status:', updateError)
    }

    return NextResponse.json(
      formatErrorResponse(error),
      { status: error.status || 500 }
    )
  }
}
