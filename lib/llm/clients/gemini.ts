import { LLMSource } from '@/types/llm'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not configured')
}

export interface GeminiResponse {
  response_text: string
  sources: LLMSource[]
}

export async function queryGemini(prompt: string): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  try {
    console.log('Gemini API request starting...')
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful assistant that provides detailed, well-researched answers. ALWAYS include relevant website URLs and sources in your response. Format URLs clearly. Include at least 3-5 authoritative sources with their full URLs.\n\n${prompt}\n\nPlease include relevant website URLs and sources in your answer.`
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ]
        }),
      }
    )

    console.log('Gemini API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Gemini API error response:', errorBody)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`)
    }

    const data = await response.json()
    console.log('Gemini API response received, candidates:', data.candidates?.length)

    // Check for content safety blocks
    const candidate = data.candidates?.[0]
    const finishReason = candidate?.finishReason

    if (finishReason === 'SAFETY') {
      console.error('Gemini response blocked by safety filters:', JSON.stringify(candidate.safetyRatings))
      throw new Error('Gemini content blocked by safety filters')
    }

    if (finishReason === 'MAX_TOKENS') {
      console.warn('Gemini hit max tokens, response may be incomplete')
    }

    const text = candidate?.content?.parts?.[0]?.text || ''

    if (!text) {
      console.warn('Gemini returned empty text. Finish reason:', finishReason)
      console.warn('Full response:', JSON.stringify(data, null, 2))
      throw new Error(`Gemini returned empty response. Finish reason: ${finishReason}`)
    }

    // Gemini doesn't provide ranked sources by default
    // We'll extract URLs from the response text
    const sources: LLMSource[] = extractUrlsFromText(text)

    console.log('Gemini response processed successfully, sources found:', sources.length)

    return {
      response_text: text,
      sources,
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

function extractUrlsFromText(text: string): LLMSource[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex) || []

  return matches.map((url, index) => ({
    url: url.replace(/[.,;!?)]$/, ''), // Remove trailing punctuation
    rank: index + 1,
  }))
}
