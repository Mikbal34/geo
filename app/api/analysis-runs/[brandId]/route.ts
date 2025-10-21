import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/analysis-runs/[brandId]
 * Fetch analysis runs for a brand with optional time filtering
 *
 * Query params:
 * - filter: '24h' | '7d' | '30d' | 'custom' (optional)
 * - from: ISO date string (for custom range)
 * - to: ISO date string (for custom range)
 * - llm: 'chatgpt' | 'gemini' | 'perplexity' (optional, if provided, fetches from scores_llm)
 */
export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const supabase = await createClient()
    const { brandId } = params
    const { searchParams } = new URL(request.url)

    const filter = searchParams.get('filter') || 'all'
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const llm = searchParams.get('llm') // 'chatgpt', 'gemini', or 'perplexity'

    // Apply time filter
    const now = new Date()
    let startDate: Date | null = null

    if (filter === '24h') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    } else if (filter === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (filter === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    let runs: any[] = []

    if (llm && llm !== 'overall') {
      // Fetch from scores_llm table for specific LLM
      let query = supabase
        .from('scores_llm')
        .select('*, analysis_run_id')
        .eq('brand_id', brandId)
        .eq('llm', llm)
        .order('created_at', { ascending: false })

      if (filter === 'custom' && from && to) {
        query = query.gte('created_at', from).lte('created_at', to)
      } else if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data: llmScores, error: llmError } = await query

      if (llmError) throw llmError

      // Transform to match analysis_runs format
      runs = (llmScores || []).map(score => ({
        id: score.analysis_run_id || score.id,
        brand_id: brandId,
        visibility_pct: score.visibility_pct,
        sentiment_pct: score.sentiment_pct,
        avg_position_raw: score.avg_position_raw,
        mentions_raw_total: score.mentions_raw,
        created_at: score.created_at,
        status: 'completed',
        llm: score.llm
      }))
    } else {
      // Fetch from analysis_runs table for overall
      let query = supabase
        .from('analysis_runs')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (filter === 'custom' && from && to) {
        query = query.gte('created_at', from).lte('created_at', to)
      } else if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      runs = data || []
    }

    // Get latest run ID for default selection
    const latestRun = runs && runs.length > 0 ? runs[0] : null

    return NextResponse.json({
      success: true,
      runs: runs,
      latest_run: latestRun,
      filter_applied: filter,
      llm_filter: llm || 'overall',
      count: runs?.length || 0
    })
  } catch (error: any) {
    console.error('[GET /api/analysis-runs/:brandId] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis runs' },
      { status: 500 }
    )
  }
}
