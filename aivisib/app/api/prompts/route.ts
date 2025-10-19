import { NextResponse } from 'next/server'
import { createPrompt } from '@/lib/supabase/queries'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prompt = await createPrompt(body)
    return NextResponse.json(prompt, { status: 201 })
  } catch (error) {
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
