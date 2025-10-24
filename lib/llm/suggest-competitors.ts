import { openai } from './client'
import { SUGGEST_COMPETITORS_TEMPLATE } from './prompts'
import { Brand } from '@/types/brand'

export async function generateCompetitorSuggestions(
  brand: Brand,
  count: number = 10
): Promise<Array<{ name: string; domain: string; region: string }>> {
  try {
    const brandRegion = brand.region || 'Global'
    const prompt = SUGGEST_COMPETITORS_TEMPLATE
      .replace('{count}', count.toString())
      .replace('{brand_name}', brand.brand_name)
      .replace('{domain}', brand.domain || 'N/A')
      .replaceAll('{region}', brandRegion)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a market research expert. Identify real, direct competitors for brands. IMPORTANT: All competitors MUST be from the SAME REGION as the brand. Return only valid JSON in this format: {"competitors": [{"name": "...", "domain": "...", "region": "..."}]}',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the response
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      throw new Error(`Failed to parse OpenAI response: ${content}`)
    }

    // Handle both array and object responses
    const competitors = parsed.competitors || Object.values(parsed)

    if (!Array.isArray(competitors) || competitors.length === 0) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Validate structure and enforce region requirement
    const validCompetitors = competitors
      .filter((c: any) => c.name && c.domain)
      .map((c: any) => ({
        name: String(c.name),
        domain: String(c.domain),
        // Force all competitors to have the same region as the brand
        region: brandRegion,
      }))
      .slice(0, count)

    if (validCompetitors.length === 0) {
      throw new Error(`No valid competitors found for ${brand.brand_name} in ${brandRegion}`)
    }

    console.log(`✓ Generated ${validCompetitors.length} competitors for ${brand.brand_name} in ${brandRegion}`)
    return validCompetitors
  } catch (error) {
    console.error('Error generating competitor suggestions:', error)
    throw error
  }
}
