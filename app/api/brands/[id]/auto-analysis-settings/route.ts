import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    // Apply defaults BEFORE checking conditions (NULL values are falsy!)
    const isEnabled = brand.auto_analysis_enabled ?? true
    const interval = brand.auto_analysis_interval ?? 1440

    let next_analysis_at = null
    if (brand.last_auto_analysis_at) {
      // FORCE UTC: Database doesn't include 'Z', so add it
      const lastRunStr = brand.last_auto_analysis_at.endsWith('Z')
        ? brand.last_auto_analysis_at
        : brand.last_auto_analysis_at + 'Z'
      const lastRun = new Date(lastRunStr)
      const nextRun = new Date(lastRun.getTime() + interval * 60 * 1000)
      next_analysis_at = nextRun.toISOString()
    } else if (isEnabled) {
      // If never run before but auto-analysis is enabled, schedule from now
      const now = new Date()
      const nextRun = new Date(now.getTime() + interval * 60 * 1000)
      next_analysis_at = nextRun.toISOString()
    }

    const responseData = {
      auto_analysis_enabled: isEnabled,
      auto_analysis_interval: interval,
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

    // Update settings - DO NOT touch last_auto_analysis_at
    // It should only be updated when an actual analysis runs (cron or manual)
    const updates: any = {}

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
    let next_analysis_at = null
    if (data.last_auto_analysis_at) {
      const lastRunStr = data.last_auto_analysis_at.endsWith('Z')
        ? data.last_auto_analysis_at
        : data.last_auto_analysis_at + 'Z'
      const lastRun = new Date(lastRunStr)
      const nextRun = new Date(lastRun.getTime() + (data.auto_analysis_interval || 1440) * 60 * 1000)
      next_analysis_at = nextRun.toISOString()
    } else if (data.auto_analysis_enabled) {
      // If never run before but auto-analysis is enabled, schedule from now
      const now = new Date()
      const nextRun = new Date(now.getTime() + (data.auto_analysis_interval || 1440) * 60 * 1000)
      next_analysis_at = nextRun.toISOString()
    }

    console.log('[AUTO-ANALYSIS PUT] Success:', {
      enabled: data.auto_analysis_enabled,
      interval: data.auto_analysis_interval,
      last_analysis_at: data.last_auto_analysis_at,
      next_at: next_analysis_at
    })

    // Revalidate the cache for this brand's settings page
    revalidatePath(`/brands/${params.id}/settings`)
    revalidatePath(`/api/brands/${params.id}/auto-analysis-settings`)

    return NextResponse.json({
      success: true,
      auto_analysis_enabled: data.auto_analysis_enabled,
      auto_analysis_interval: data.auto_analysis_interval,
      next_analysis_at
    })
  } catch (error) {
    console.error('Error updating auto-analysis settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
