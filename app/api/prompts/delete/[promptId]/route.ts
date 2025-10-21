import { NextResponse } from 'next/server'
import { deletePrompt } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function DELETE(
  request: Request,
  { params }: { params: { promptId: string } }
) {
  try {
    await deletePrompt(params.promptId)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
