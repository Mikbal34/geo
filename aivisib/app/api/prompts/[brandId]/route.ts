import { NextResponse } from 'next/server'
import { getPromptsByBrandId } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const prompts = await getPromptsByBrandId(params.brandId)
    return NextResponse.json({ prompts })
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
