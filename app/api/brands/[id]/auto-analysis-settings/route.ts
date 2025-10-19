import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/brands/[id]/auto-analysis-settings
 * Get auto-analysis settings for a brand
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: brand, error } = await supabase
      .from('brands')
      .select('id, auto_analysis_enabled, auto_analysis_interval, last_auto_analysis_at')
      .eq('id', params.id)
      .single()

    if (error || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Calculate next analysis time
    let next_analysis_at = null
    if (brand.last_auto_analysis_at) {
      // FORCE UTC: Database doesn't include 'Z', so add it
      const lastRunStr = brand.last_auto_analysis_at.endsWith('Z')
        ? brand.last_auto_analysis_at
        : brand.last_auto_analysis_at + 'Z'
      const lastRun = new Date(lastRunStr)
      const nextRun = new Date(lastRun.getTime() + (brand.auto_analysis_interval || 1440) * 60 * 1000)
      next_analysis_at = nextRun.toISOString()
    } else if (brand.auto_analysis_enabled) {
      // If never run before but auto-analysis is enabled, schedule from now
      const now = new Date()
      const nextRun = new Date(now.getTime() + (brand.auto_analysis_interval || 1440) * 60 * 1000)
      next_analysis_at = nextRun.toISOString()
    }

    const responseData = {
      auto_analysis_enabled: brand.auto_analysis_enabled ?? true,
      auto_analysis_interval: brand.auto_analysis_interval ?? 1440,
      next_analysis_at
    }

    console.log('[AUTO-ANALYSIS GET]', responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching auto-analysis settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/brands/[id]/auto-analysis-settings
 * Update auto-analysis settings for a brand
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { auto_analysis_enabled, auto_analysis_interval } = body

    // Validate interval (minimum 5 minutes, maximum 10080 minutes = 7 days)
    if (auto_analysis_interval !== undefined) {
      if (typeof auto_analysis_interval !== 'number' || auto_analysis_interval < 5 || auto_analysis_interval > 10080) {
        return NextResponse.json(
          { error: 'Invalid interval. Must be between 5 minutes and 7 days (10080 minutes)' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Update settings - ALWAYS reset last_auto_analysis_at to NOW when changing settings
    const updates: any = {
      last_auto_analysis_at: new Date().toISOString()
    }

    if (auto_analysis_enabled !== undefined) {
      updates.auto_analysis_enabled = auto_analysis_enabled
    }
    if (auto_analysis_interval !== undefined) {
      updates.auto_analysis_interval = auto_analysis_interval
    }

    console.log('[AUTO-ANALYSIS PUT] Updates:', updates)

    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Calculate next analysis time
    const nextRun = new Date(updates.last_auto_analysis_at)
    nextRun.setMinutes(nextRun.getMinutes() + (data.auto_analysis_interval || 1440))

    console.log('[AUTO-ANALYSIS PUT] Success:', {
      enabled: data.auto_analysis_enabled,
      interval: data.auto_analysis_interval,
      next_at: nextRun.toISOString()
    })

    return NextResponse.json({
      success: true,
      auto_analysis_enabled: data.auto_analysis_enabled,
      auto_analysis_interval: data.auto_analysis_interval,
      next_analysis_at: nextRun.toISOString()
    })
  } catch (error) {
    console.error('Error updating auto-analysis settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
