import { NextResponse } from 'next/server'
import { deleteCompetitor } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function DELETE(
  request: Request,
  { params }: { params: { competitorId: string } }
) {
  try {
    await deleteCompetitor(params.competitorId)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
