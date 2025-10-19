import { openai } from './client'
import { Brand } from '@/types/brand'
import { getRegionConfig } from '@/lib/constants/regions'

export async function generatePromptSuggestions(
  brand: Brand,
  count: number = 5
): Promise<string[]> {
  try {
    const regionConfig = getRegionConfig(brand.region || 'Global')
    const language = regionConfig.language
    const languageName = regionConfig.languageName

    const userPrompt = `Generate ${count} visibility-testing prompts for this brand:

Brand: ${brand.brand_name}
Region: ${brand.region || 'Global'}
Language: ${languageName}

IMPORTANT:
- Generate prompts in ${languageName}
- DO NOT include the brand name in any prompt
- Understand the industry automatically
- Create natural, indirect questions
- Keep under 15 words each
- Target the ${brand.region || 'global'} market`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a multilingual prompt generator that creates visibility-testing questions in the target language to test how prominently a brand appears in AI responses.

Goal:
Generate natural, indirect prompts in the SPECIFIED LANGUAGE that reveal the AI's perception of a given brand *without mentioning the brand or domain.*

Input:
- brand_name (e.g. "Turkcell", "Zara")
- region (e.g. "Turkey", "France", "Global")
- language (e.g. "Turkish", "French", "English")

Your task:
1. Understand what sector or industry the brand belongs to
2. Generate prompts in the EXACT language specified
3. Target the specific region/market mentioned
4. Create 5–10 short prompts that indirectly assess brand visibility

Rules:
1. NEVER include the brand name or domain
2. Write prompts in the SPECIFIED LANGUAGE (Turkish for Turkey, French for France, etc.)
3. Keep each under 15 words
4. Mix discovery, ranking, and comparison styles
5. Focus on: popularity, leadership, trust, quality, innovation
6. Use natural phrasing for native speakers of that language

Example 1 (Turkey - Turkish):
{
  "brand_name": "Turkcell",
  "region": "Turkey",
  "language": "Turkish",
  "prompts": [
    "Türkiye'de en iyi mobil operatörler hangileridir?",
    "En geniş kapsama alanına sahip telecom şirketleri",
    "5G teknolojisinde öne çıkan operatörler",
    "Türkiye'de en çok tercih edilen mobil internet sağlayıcılar",
    "Telekomünikasyon sektöründe lider markalar"
  ]
}

Example 2 (France - French):
{
  "brand_name": "Zara",
  "region": "France",
  "language": "French",
  "prompts": [
    "Quelles sont les meilleures marques de mode en France?",
    "Marques de vêtements les plus populaires",
    "Où acheter des vêtements tendance à bon prix?",
    "Enseignes de mode préférées des français",
    "Leaders du fast fashion en France"
  ]
}

Example 3 (Global - English):
{
  "brand_name": "Nike",
  "region": "Global",
  "language": "English",
  "prompts": [
    "Top sportswear brands worldwide",
    "Most popular athletic footwear companies",
    "Leading sports equipment manufacturers",
    "Best brands for running shoes",
    "Global leaders in athletic apparel"
  ]
}

Output format (JSON):
{
  "prompts": [
    "prompt in target language",
    "another prompt in target language",
    ...
  ]
}`,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the response - GPT should return {questions: [...]} or just [...]
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      throw new Error(`Failed to parse OpenAI response: ${content}`)
    }

    // Handle both array and object responses
    const questions = Array.isArray(parsed)
      ? parsed
      : parsed.questions || parsed.prompts || Object.values(parsed)

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format from OpenAI')
    }

    return questions.slice(0, count).map((q) => String(q))
  } catch (error) {
    console.error('Error generating prompt suggestions:', error)
    throw error
  }
}
