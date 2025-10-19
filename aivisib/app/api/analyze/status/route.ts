import { NextResponse } from 'next/server'
import { getPromptsByBrandId, getScoresByBrandId } from '@/lib/supabase/queries'
import { getBrandState } from '@/lib/utils/brand-state'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      )
    }

    const [prompts, scores] = await Promise.all([
      getPromptsByBrandId(brandId),
      getScoresByBrandId(brandId),
    ])

    const state = getBrandState(prompts.length, scores.length, false)

    return NextResponse.json({
      state,
      promptCount: prompts.length,
      scoreCount: scores.length,
      hasScores: scores.length > 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    )
  }
}
