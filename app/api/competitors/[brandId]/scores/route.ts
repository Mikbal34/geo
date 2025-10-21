import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const supabase = await createClient()
    const { brandId } = params

    // Get query params
    const { searchParams } = new URL(request.url)
    const llmFilter = searchParams.get('llm') || 'overall'
    const runId = searchParams.get('run_id') // Optional: specific analysis run

    // Get all competitors for this brand
    const { data: competitors, error: competitorsError } = await supabase
      .from('competitors')
      .select('*')
      .eq('brand_id', brandId)

    if (competitorsError) throw competitorsError

    // If run_id is provided, use it. Otherwise, get the latest run
    let targetRunId = runId
    if (!targetRunId) {
      const { data: latestRun } = await supabase
        .from('analysis_runs')
        .select('id')
        .eq('brand_id', brandId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      targetRunId = latestRun?.id
    }

    // Get competitor scores from competitor_scores table filtered by LLM and run_id
    const competitorScores = await Promise.all(
      competitors.map(async (competitor) => {
        let score = null

        // Try with analysis_run_id first
        if (targetRunId) {
          const { data } = await supabase
            .from('competitor_scores')
            .select('*')
            .eq('competitor_id', competitor.id)
            .eq('llm', llmFilter)
            .eq('analysis_run_id', targetRunId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          score = data
        }

        // Fallback: If no score found with run_id, get latest score (for legacy data)
        if (!score) {
          const { data } = await supabase
            .from('competitor_scores')
            .select('*')
            .eq('competitor_id', competitor.id)
            .eq('llm', llmFilter)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          score = data
          console.log(`[API] Fallback: Using latest score for ${competitor.competitor_name}`)
        }

        console.log(`[API] Competitor ${competitor.competitor_name} (${llmFilter}) - Raw DB score:`, score)

        if (!score) {
          console.log(`[API] No score found for ${competitor.competitor_name}`)
          return {
            competitor_name: competitor.competitor_name,
            competitor_domain: competitor.competitor_domain,
            visibility_pct: 0,
            mentions_total: 0,
            avg_position: 0,
            sentiment_pct: 0
          }
        }

        const result = {
          competitor_name: competitor.competitor_name,
          competitor_domain: competitor.competitor_domain,
          visibility_pct: Math.round(score.visibility_pct || 0),
          mentions_total: score.mentions_raw_total || 0,
          avg_position: score.avg_position_raw || 0,
          sentiment_pct: Math.round(score.sentiment_pct || 0)
        }

        console.log(`[API] Competitor ${competitor.competitor_name} - Formatted result:`, result)
        return result
      })
    )

    console.log('[API] All competitor scores:', competitorScores)

    // Also get brand's own scores for comparison
    // If llmFilter is 'overall', use scores_overall, otherwise use scores_llm
    let brandScore = null
    if (llmFilter === 'overall') {
      // Try with analysis_run_id first
      if (targetRunId) {
        const { data } = await supabase
          .from('scores_overall')
          .select('*')
          .eq('brand_id', brandId)
          .eq('analysis_run_id', targetRunId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        brandScore = data
      }

      // Fallback: Get latest score (for legacy data)
      if (!brandScore) {
        const { data } = await supabase
          .from('scores_overall')
          .select('*')
          .eq('brand_id', brandId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        brandScore = data
        if (brandScore) console.log('[API] Fallback: Using latest brand overall score')
      }
    } else {
      // Try with analysis_run_id first
      if (targetRunId) {
        const { data } = await supabase
          .from('scores_llm')
          .select('*')
          .eq('brand_id', brandId)
          .eq('llm', llmFilter)
          .eq('analysis_run_id', targetRunId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        brandScore = data
      }

      // Fallback: Get latest score (for legacy data)
      if (!brandScore) {
        const { data } = await supabase
          .from('scores_llm')
          .select('*')
          .eq('brand_id', brandId)
          .eq('llm', llmFilter)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        brandScore = data
        if (brandScore) console.log('[API] Fallback: Using latest brand LLM score')
      }
    }

    return NextResponse.json({
      brand_score: brandScore || null,
      competitor_scores: competitorScores,
      analysis_run_id: targetRunId
    })
  } catch (error: any) {
    console.error('[GET /api/competitors/:brandId/scores] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch competitor scores' },
      { status: 500 }
    )
  }
}
