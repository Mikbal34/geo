import { openai } from './client'

export interface AnalyzerResult {
  mentioned: boolean
  position: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  mentions_count: number
  competitors_mentioned: string[]
}

export interface AnalyzerInput {
  response_text: string
  brand_name: string
  competitor_names: string[]
}

/**
 * Analyzes a single LLM response using GPT-4o-mini to extract:
 * - Brand mention (yes/no)
 * - Position (1st, 2nd, 3rd... or null)
 * - Sentiment (positive/neutral/negative)
 * - Mention count
 * - Competitors mentioned
 */
export async function analyzeResponse(input: AnalyzerInput): Promise<AnalyzerResult> {
  const { response_text, brand_name, competitor_names } = input

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI analyzer that examines a single LLM response to extract brand mention data.

Given:
- Target brand name
- List of competitor names
- An LLM response text

Analyze and return:
1. **mentioned**: Is the target brand mentioned? (true/false)
2. **position**: If mentioned in a numbered list or ranking, what position? (1 = first, 2 = second, etc., or null if not in a ranked list)
3. **sentiment**: Overall sentiment toward the brand ("positive", "neutral", "negative")
   - "positive" if praised, recommended, described with positive attributes (leader, innovative, reliable, excellent, best, top, etc.)
   - "negative" if criticized, warned against, described negatively (poor, avoid, worst, issues, problems, etc.)
   - "neutral" if merely mentioned factually without clear positive/negative tone
4. **mentions_count**: How many times is the brand name explicitly mentioned in the text?
5. **competitors_mentioned**: List of competitor names (from the provided list) found in the response

Rules:
- Focus on brand NAMES in the main text, ignore URLs/domains/website addresses
- For position: Look for numbered lists (1., 2., 3.) or bullet points with clear ranking
- If brand is mentioned but not in a ranked format, position = null
- Case-insensitive matching
- Treat brand name variations as the same (e.g., "Ziraat Katılım" = "Ziraat Katılım Bankası")
- Be strict: only return competitors that are explicitly mentioned by name

Return ONLY valid JSON, no additional text:
{
  "mentioned": boolean,
  "position": number | null,
  "sentiment": "positive" | "neutral" | "negative",
  "mentions_count": number,
  "competitors_mentioned": ["Competitor A", "Competitor B"]
}`
        },
        {
          role: 'user',
          content: `Target Brand: ${brand_name}
Competitors: ${competitor_names.join(', ') || 'None'}

LLM Response to Analyze:
"""
${response_text}
"""

Analyze this response and return the JSON result.`
        }
      ],
      temperature: 0.1, // Low temperature for consistent, factual analysis
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const result = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(result)

    // Validate and return with defaults
    return {
      mentioned: parsed.mentioned ?? false,
      position: parsed.position ?? null,
      sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      mentions_count: typeof parsed.mentions_count === 'number' ? parsed.mentions_count : 0,
      competitors_mentioned: Array.isArray(parsed.competitors_mentioned)
        ? parsed.competitors_mentioned
        : []
    }

  } catch (error) {
    console.error('[Analyzer] Error analyzing response:', error)

    // Fallback to simple keyword-based detection
    return fallbackAnalysis(response_text, brand_name, competitor_names)
  }
}

/**
 * Fallback analysis using simple keyword matching (original logic)
 * Used if GPT-4o-mini analyzer fails
 */
function fallbackAnalysis(
  text: string,
  brandName: string,
  competitorNames: string[]
): AnalyzerResult {
  const lowerText = text.toLowerCase()
  const lowerBrand = brandName.toLowerCase()

  // Check if mentioned
  const mentioned = lowerText.includes(lowerBrand)

  // Simple position detection (numbered list)
  let position: number | null = null
  const numberedListRegex = /(\d+)[\.)]\s*([^\n.]+)/g
  let match
  while ((match = numberedListRegex.exec(text)) !== null) {
    const itemText = match[2].toLowerCase()
    if (itemText.includes(lowerBrand)) {
      position = parseInt(match[1])
      break
    }
  }

  // Simple sentiment detection
  const positiveKeywords = ['excellent', 'great', 'best', 'highly recommend', 'top', 'leader', 'innovative', 'quality', 'trusted', 'reliable']
  const negativeKeywords = ['poor', 'bad', 'worst', 'avoid', 'not recommend', 'disappointed', 'failed', 'issue', 'problem']

  let positiveCount = 0
  let negativeCount = 0

  positiveKeywords.forEach(kw => { if (lowerText.includes(kw)) positiveCount++ })
  negativeKeywords.forEach(kw => { if (lowerText.includes(kw)) negativeCount++ })

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (mentioned) {
    if (positiveCount > negativeCount) sentiment = 'positive'
    else if (negativeCount > positiveCount) sentiment = 'negative'
  }

  // Count mentions
  const regex = new RegExp(`\\b${lowerBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  const matches = text.match(regex)
  const mentions_count = matches ? matches.length : 0

  // Find competitors
  const competitors_mentioned = competitorNames.filter(comp =>
    lowerText.includes(comp.toLowerCase())
  )

  return {
    mentioned,
    position,
    sentiment,
    mentions_count,
    competitors_mentioned
  }
}
