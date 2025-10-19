import { NextResponse } from 'next/server'
import { getBrandById } from '@/lib/supabase/queries'
import { generatePromptSuggestions } from '@/lib/llm/suggest-prompts'
import { formatErrorResponse } from '@/lib/utils/errors'

export async function POST(request: Request) {
  try {
    const { brand_id, count = 5 } = await request.json()

    // Get brand details
    const brand = await getBrandById(brand_id)
    if (!brand) {
      throw new Error('Brand not found')
    }

    // Generate AI-powered prompt suggestions (don't save yet)
    const suggestions = await generatePromptSuggestions(brand, count)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error in suggest prompts:', error)
    return NextResponse.json(formatErrorResponse(error), { status: 400 })
  }
}
