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
 * - view: 'daily' | 'weekly' (for 30d filter, default: 'daily')
 * - llm: 'chatgpt' | 'gemini' | 'perplexity' (optional, if provided, fetches from scores_llm)
 */

/**
 * Helper: Group runs by day and calculate daily average
 */
function groupByDay(runs: any[]): any[] {
  const dayMap = new Map<string, any[]>()

  runs.forEach(run => {
    const date = new Date(run.created_at)
    const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, [])
    }
    dayMap.get(dayKey)!.push(run)
  })

  // Calculate average for each day
  const dailyRuns: any[] = []
  dayMap.forEach((dayRuns, dayKey) => {
    const avgRun = {
      id: dayRuns[0].id, // Use first run's ID
      brand_id: dayRuns[0].brand_id,
      visibility_pct: calculateAverage(dayRuns, 'visibility_pct'),
      sentiment_pct: calculateAverage(dayRuns, 'sentiment_pct'),
      avg_position_raw: calculateAverage(dayRuns, 'avg_position_raw', true), // can be null
      mentions_raw_total: Math.round(calculateAverage(dayRuns, 'mentions_raw_total')),
      created_at: dayKey + 'T12:00:00Z', // Set to noon UTC
      status: 'completed',
      llm: dayRuns[0].llm,
      aggregation_type: 'daily',
      runs_count: dayRuns.length
    }
    dailyRuns.push(avgRun)
  })

  return dailyRuns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * Helper: Group daily runs by week and calculate weekly average
 */
function groupByWeek(dailyRuns: any[]): any[] {
  const weekMap = new Map<number, any[]>()

  dailyRuns.forEach(run => {
    const date = new Date(run.created_at)
    const now = Date.now()

    // Calculate how many days ago this run was
    const daysAgo = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24))

    // Divide into weeks: 0-6 days ago = Week 0, 7-13 = Week 1, etc.
    const weekNumber = Math.min(Math.floor(daysAgo / 7), 3) // Max 4 weeks (0-3)

    if (!weekMap.has(weekNumber)) {
      weekMap.set(weekNumber, [])
    }
    weekMap.get(weekNumber)!.push(run)
  })

  // Calculate average for each week
  const weeklyRuns: any[] = []
  weekMap.forEach((weekRuns, weekNumber) => {
    // Sort week runs by date to get the latest one
    weekRuns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const avgRun = {
      id: weekRuns[0].id,
      brand_id: weekRuns[0].brand_id,
      visibility_pct: calculateAverage(weekRuns, 'visibility_pct'),
      sentiment_pct: calculateAverage(weekRuns, 'sentiment_pct'),
      avg_position_raw: calculateAverage(weekRuns, 'avg_position_raw', true),
      mentions_raw_total: Math.round(calculateAverage(weekRuns, 'mentions_raw_total')),
      created_at: weekRuns[0].created_at, // Use latest day in week
      status: 'completed',
      llm: weekRuns[0].llm,
      aggregation_type: 'weekly',
      week_number: weekNumber,
      runs_count: weekRuns.length
    }
    weeklyRuns.push(avgRun)
  })

  return weeklyRuns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * Helper: Calculate average of a field across runs
 */
function calculateAverage(runs: any[], field: string, allowNull = false): number | null {
  const values = runs.map(r => r[field]).filter(v => v !== null && v !== undefined)
  if (values.length === 0) return allowNull ? null : 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}
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
    const view = searchParams.get('view') || 'daily' // 'daily' or 'weekly'
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

    // Apply aggregation based on filter and view
    let aggregatedRuns = runs
    let aggregationType = 'none'

    if (filter === '24h') {
      // 24h: Return individual analyses (no aggregation)
      aggregatedRuns = runs
      aggregationType = 'none'
    } else if (filter === '7d' || filter === 'custom') {
      // 7d or custom: Calculate daily overall
      aggregatedRuns = groupByDay(runs)
      aggregationType = 'daily'
    } else if (filter === '30d') {
      if (view === 'weekly') {
        // 30d weekly: First group by day, then by week
        const dailyRuns = groupByDay(runs)
        aggregatedRuns = groupByWeek(dailyRuns)
        aggregationType = 'weekly'
      } else {
        // 30d daily: Calculate daily overall
        aggregatedRuns = groupByDay(runs)
        aggregationType = 'daily'
      }
    }

    // Get latest run ID for default selection
    const latestRun = aggregatedRuns && aggregatedRuns.length > 0 ? aggregatedRuns[0] : null

    return NextResponse.json({
      success: true,
      runs: aggregatedRuns,
      latest_run: latestRun,
      filter_applied: filter,
      view_applied: view,
      aggregation_type: aggregationType,
      llm_filter: llm || 'overall',
      count: aggregatedRuns?.length || 0,
      raw_count: runs?.length || 0
    })
  } catch (error: any) {
    console.error('[GET /api/analysis-runs/:brandId] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis runs' },
      { status: 500 }
    )
  }
}
