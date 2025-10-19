import { NextResponse } from 'next/server'
import { createCompetitor, checkDuplicateCompetitor } from '@/lib/supabase/queries'
import { AppError, formatErrorResponse } from '@/lib/utils/errors'
import { ApiErrorCode } from '@/types/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST /api/competitors - Request body:', body)

    // Check for duplicates
    const isDuplicate = await checkDuplicateCompetitor(
      body.brand_id,
      body.competitor_domain
    )

    if (isDuplicate) {
      console.log('Duplicate competitor detected:', body.competitor_domain)
      throw new AppError(
        409,
        'This competitor already exists for this brand',
        ApiErrorCode.DUPLICATE_COMPETITOR
      )
    }

    const competitor = await createCompetitor(body)
    console.log('Competitor created successfully:', competitor)
    return NextResponse.json(competitor, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/competitors:', error)
    return NextResponse.json(formatErrorResponse(error), { status: error instanceof AppError ? error.statusCode : 400 })
  }
}
