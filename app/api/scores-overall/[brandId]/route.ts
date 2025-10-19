import { NextResponse } from 'next/server'
import { getLatestScoreOverallByBrandId, getLatestScoresLLMByBrandId } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { brandId } = params

    const [overallScore, llmScores] = await Promise.all([
      getLatestScoreOverallByBrandId(brandId),
      getLatestScoresLLMByBrandId(brandId),
    ])

    return NextResponse.json({
      overall: overallScore,
      per_llm: llmScores,
    })
  } catch (error: any) {
    return NextResponse.json(formatErrorResponse(error), { status: 500 })
  }
}
