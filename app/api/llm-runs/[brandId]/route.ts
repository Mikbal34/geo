import { NextResponse } from 'next/server'
import { getLLMRunsByBrandId } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { brandId } = params

    const llmRuns = await getLLMRunsByBrandId(brandId)

    return NextResponse.json({ llm_runs: llmRuns })
  } catch (error) {
    console.error('Error fetching LLM runs:', error)
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
