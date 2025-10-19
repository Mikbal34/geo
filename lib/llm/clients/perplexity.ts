import { LLMSource } from '@/types/llm'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

if (!PERPLEXITY_API_KEY) {
  console.warn('PERPLEXITY_API_KEY not configured')
}

export interface PerplexityResponse {
  response_text: string
  sources: LLMSource[]
}

export async function queryPerplexity(prompt: string): Promise<PerplexityResponse> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured')
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`)
    }

    const data = await response.json()

    const message = data.choices?.[0]?.message
    const text = message?.content || ''

    // Perplexity provides citations in metadata
    const citations = data.citations || []
    const sources: LLMSource[] = citations.map((citation: any, index: number) => ({
      url: citation.url || citation,
      rank: index + 1,
      title: citation.title,
    }))

    return {
      response_text: text,
      sources,
    }
  } catch (error) {
    console.error('Perplexity API error:', error)
    throw error
  }
}
