import { NextResponse } from 'next/server'
import { getLatestScoresByBrandId } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { brandId } = params
    const scores = await getLatestScoresByBrandId(brandId)

    return NextResponse.json({ scores })
  } catch (error: any) {
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    )
  }
}
