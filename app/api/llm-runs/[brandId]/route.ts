import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const supabase = await createClient()
    const { brandId } = params
    const { searchParams } = new URL(request.url)

    const analysisRunId = searchParams.get('analysis_run_id')

    // Build query with optional analysis_run_id filter
    let query = supabase
      .from('llm_runs')
      .select('*')
      .eq('brand_id', brandId)

    // Filter by specific analysis run if provided
    if (analysisRunId) {
      query = query.eq('analysis_run_id', analysisRunId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ llm_runs: data || [] })
  } catch (error) {
    console.error('Error fetching LLM runs:', error)
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
