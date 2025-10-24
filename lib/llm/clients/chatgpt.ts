import { openai } from '../client'
import { LLMSource } from '@/types/llm'

export interface ChatGPTResponse {
  response_text: string
  sources: LLMSource[]
}

export async function queryChatGPT(prompt: string): Promise<ChatGPTResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    })

    const text = completion.choices[0]?.message?.content || ''

    // Extract URLs from the response
    const sources: LLMSource[] = extractUrlsFromText(text)

    return {
      response_text: text,
      sources,
    }
  } catch (error) {
    console.error('ChatGPT API error:', error)
    throw error
  }
}

function extractUrlsFromText(text: string): LLMSource[] {
  // Match URLs in markdown links [text](url) and plain URLs
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
  const plainUrlRegex = /(?<!\]\()https?:\/\/[^\s\)]+/g

  const sources: LLMSource[] = []
  let rank = 1

  // Extract markdown links
  let match
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    sources.push({
      url: match[2].replace(/[.,;!?)]$/, ''),
      rank: rank++,
      title: match[1],
    })
  }

  // Extract plain URLs
  const plainUrls = text.match(plainUrlRegex) || []
  for (const url of plainUrls) {
    // Avoid duplicates
    if (!sources.some(s => s.url === url)) {
      sources.push({
        url: url.replace(/[.,;!?)]$/, ''),
        rank: rank++,
      })
    }
  }

  return sources
}
