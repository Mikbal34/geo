import { openai } from './client'

export interface BrandAnalysisInput {
  name: string
  is_target: boolean // true for the main brand, false for competitors
}

export interface BrandAnalysisResult {
  brand_name: string
  mentioned: boolean
  position: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  mentions_count: number
}

export interface BatchAnalyzerInput {
  response_text: string
  brands: BrandAnalysisInput[]
}

export interface BatchAnalyzerResult {
  results: BrandAnalysisResult[]
}

/**
 * Analyzes a single LLM response for MULTIPLE brands (target + competitors) at once
 * This is more efficient than calling the analyzer separately for each brand
 */
export async function analyzeBatchResponse(input: BatchAnalyzerInput): Promise<BatchAnalyzerResult> {
  const { response_text, brands } = input

  try {
    const brandNames = brands.map(b => b.name).join(', ')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI analyzer that examines a single LLM response to extract brand mention data for MULTIPLE brands at once.

Given:
- List of brand names (including 1 target brand and multiple competitors)
- An LLM response text

For EACH brand, analyze and return:
1. **mentioned**: Is this brand mentioned? (true/false)
2. **position**: If mentioned in a numbered list or ranking, what position? (1 = first, 2 = second, etc., or null if not in a ranked list)
3. **sentiment**: Overall sentiment toward the brand ("positive", "neutral", "negative")
   - "positive" if praised, recommended, described with positive attributes (leader, innovative, reliable, excellent, best, top, etc.)
   - "negative" if criticized, warned against, described negatively (poor, avoid, worst, issues, problems, etc.)
   - "neutral" if merely mentioned factually without clear positive/negative tone
4. **mentions_count**: How many times is the brand name explicitly mentioned in the text?

Rules:
- Focus on brand NAMES in the main text, ignore URLs/domains/website addresses
- For position: Look for numbered lists (1., 2., 3.) or bullet points with clear ranking
- If brand is mentioned but not in a ranked format, position = null
- Case-insensitive matching
- Treat brand name variations as the same (e.g., "Ziraat Katılım" = "Ziraat Katılım Bankası")
- Analyze ALL brands independently

Return ONLY valid JSON, no additional text:
{
  "results": [
    {
      "brand_name": "Brand A",
      "mentioned": boolean,
      "position": number | null,
      "sentiment": "positive" | "neutral" | "negative",
      "mentions_count": number
    },
    ...
  ]
}`
        },
        {
          role: 'user',
          content: `Brands to analyze: ${brandNames}

LLM Response to Analyze:
"""
${response_text}
"""

Analyze this response for ALL brands and return the JSON result with a "results" array containing analysis for each brand.`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const result = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(result)

    // Validate and return with defaults
    const results: BrandAnalysisResult[] = []

    for (const brand of brands) {
      // Find the result for this brand
      const brandResult = parsed.results?.find(
        (r: any) => r.brand_name?.toLowerCase() === brand.name.toLowerCase()
      )

      results.push({
        brand_name: brand.name,
        mentioned: brandResult?.mentioned ?? false,
        position: brandResult?.position ?? null,
        sentiment: ['positive', 'neutral', 'negative'].includes(brandResult?.sentiment)
          ? brandResult.sentiment
          : 'neutral',
        mentions_count: typeof brandResult?.mentions_count === 'number' ? brandResult.mentions_count : 0
      })
    }

    return { results }

  } catch (error) {
    console.error('[Batch Analyzer] Error analyzing response:', error)

    // Fallback: return neutral results for all brands
    return {
      results: brands.map(b => ({
        brand_name: b.name,
        mentioned: false,
        position: null,
        sentiment: 'neutral' as const,
        mentions_count: 0
      }))
    }
  }
}
