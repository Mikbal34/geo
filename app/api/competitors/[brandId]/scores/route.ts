import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const supabase = await createClient()
    const { brandId } = params

    // Get llm filter from query params (default: 'overall')
    const { searchParams } = new URL(request.url)
    const llmFilter = searchParams.get('llm') || 'overall'

    // Get all competitors for this brand
    const { data: competitors, error: competitorsError } = await supabase
      .from('competitors')
      .select('*')
      .eq('brand_id', brandId)

    if (competitorsError) throw competitorsError

    // Get competitor scores from competitor_scores table filtered by LLM
    const competitorScores = await Promise.all(
      competitors.map(async (competitor) => {
        const { data: score } = await supabase
          .from('competitor_scores')
          .select('*')
          .eq('competitor_id', competitor.id)
          .eq('llm', llmFilter)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

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
      const { data } = await supabase
        .from('scores_overall')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      brandScore = data
    } else {
      const { data } = await supabase
        .from('scores_llm')
        .select('*')
        .eq('brand_id', brandId)
        .eq('llm', llmFilter)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      brandScore = data
    }

    return NextResponse.json({
      brand_score: brandScore || null,
      competitor_scores: competitorScores
    })
  } catch (error: any) {
    console.error('[GET /api/competitors/:brandId/scores] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch competitor scores' },
      { status: 500 }
    )
  }
}
