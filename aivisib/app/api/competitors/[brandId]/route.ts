import { NextResponse } from 'next/server'
import { getCompetitorsByBrandId } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const competitors = await getCompetitorsByBrandId(params.brandId)
    return NextResponse.json({ competitors })
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
