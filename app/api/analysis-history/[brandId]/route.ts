import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Get analysis history for a brand
 * Returns last 30 days of analysis runs with trend data
 */
export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const supabase = await createClient()
    const { brandId } = params

    // Get last 30 days of completed analysis runs
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: analysisRuns, error } = await supabase
      .from('analysis_runs')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Format data for charts
    const trendData = analysisRuns.map(run => ({
      date: new Date(run.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      timestamp: run.created_at,
      visibility: Math.round(run.visibility_pct || 0),
      sentiment: Math.round(run.sentiment_pct || 0),
      position: run.avg_position_raw || 0,
      mentions: run.mentions_raw_total || 0,
      run_type: run.run_type
    }))

    // Get latest run
    const latestRun = analysisRuns.length > 0 ? analysisRuns[analysisRuns.length - 1] : null

    // Calculate trends (compare latest with 7 days ago)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const runsLastWeek = analysisRuns.filter(run =>
      new Date(run.created_at) >= sevenDaysAgo
    )

    const previousRun = runsLastWeek.length > 1 ? runsLastWeek[0] : null

    const trends = latestRun && previousRun ? {
      visibility_change: latestRun.visibility_pct - previousRun.visibility_pct,
      sentiment_change: latestRun.sentiment_pct - previousRun.sentiment_pct,
      position_change: previousRun.avg_position_raw - latestRun.avg_position_raw, // Lower is better
      mentions_change: latestRun.mentions_raw_total - previousRun.mentions_raw_total
    } : null

    return NextResponse.json({
      success: true,
      trend_data: trendData,
      latest_run: latestRun,
      trends,
      total_runs: analysisRuns.length
    })

  } catch (error: any) {
    console.error('[GET /api/analysis-history/:brandId] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis history' },
      { status: 500 }
    )
  }
}
