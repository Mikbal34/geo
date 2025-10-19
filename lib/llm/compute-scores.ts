import { Brand } from '@/types/brand'
import { Prompt } from '@/types/prompt'
import { LLMRun, LLMProvider, ScoringConfig, ScoringOutput, LLMScoreResult } from '@/types/llm'
import { Competitor } from '@/types/competitor'

const DEFAULT_CONFIG: ScoringConfig = {
  domain_variants: [],
  weights: { visibility: 1, position: 1, sentiment: 1, mentions: 1 },
  llm_weights: { chatgpt: 1, gemini: 1, perplexity: 1 },
  max_rank: 10,
  mentions_cap: 20,
}

export function computeScores(
  brand: Brand,
  prompts: Prompt[],
  llm_runs: LLMRun[],
  config: Partial<ScoringConfig> = {},
  competitors: Competitor[] = []
): ScoringOutput & { competitor_scores?: any[] } {
  const finalConfig: ScoringConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    domain_variants: config.domain_variants || generateDomainVariants(brand.domain),
  }

  const llms: LLMProvider[] = ['chatgpt', 'gemini', 'perplexity']
  const per_llm: Record<LLMProvider, LLMScoreResult> = {} as any

  // Compute scores for each LLM
  for (const llm of llms) {
    const llmRuns = llm_runs.filter(r => r.llm === llm)
    per_llm[llm] = computeLLMScores(llmRuns, prompts, finalConfig, brand.brand_name)
  }

  // Compute overall scores by aggregating
  const overall = computeOverallScores(per_llm, finalConfig)

  // Compute competitor scores if competitors are provided
  const competitor_scores = competitors.map(competitor => {
    const competitorConfig: ScoringConfig = {
      ...finalConfig,
      domain_variants: generateDomainVariants(competitor.competitor_domain),
    }

    const competitor_per_llm: Record<LLMProvider, LLMScoreResult> = {} as any

    // Compute scores for each LLM
    for (const llm of llms) {
      const llmRuns = llm_runs.filter(r => r.llm === llm)
      competitor_per_llm[llm] = computeLLMScores(llmRuns, prompts, competitorConfig, competitor.competitor_name)
    }

    // Compute overall scores
    const competitor_overall = computeOverallScores(competitor_per_llm, competitorConfig)

    return {
      competitor_id: competitor.id,
      competitor_name: competitor.competitor_name,
      competitor_domain: competitor.competitor_domain,
      per_llm: competitor_per_llm,
      overall: competitor_overall,
    }
  })

  return {
    per_llm,
    overall,
    meta: {
      brand_domain: brand.domain,
      total_prompts: prompts.length,
      llm_weights: finalConfig.llm_weights,
      params: {
        max_rank: finalConfig.max_rank,
        mentions_cap: finalConfig.mentions_cap,
      },
    },
    competitor_scores: competitor_scores.length > 0 ? competitor_scores : undefined,
  }
}

function computeLLMScores(
  llm_runs: LLMRun[],
  prompts: Prompt[],
  config: ScoringConfig,
  brandName: string
): LLMScoreResult {
  if (llm_runs.length === 0) {
    return {
      visibility_pct: 0,
      avg_position_raw: null,
      sentiment_pct: 50,
      mentions_raw: 0,
    }
  }

  // 1. Visibility Score
  const visiblePrompts = new Set<string>()
  llm_runs.forEach(run => {
    if (isBrandMentioned(run, config.domain_variants, brandName)) {
      visiblePrompts.add(run.prompt_id)
    }
  })
  const visibility_pct = (visiblePrompts.size / prompts.length) * 100

  // 2. Average Position (brand text'te kaçıncı sırada bahsedildi)
  const positions: number[] = []
  llm_runs.forEach(run => {
    const position = getBrandPositionInText(run.response_text, brandName, config.domain_variants)
    if (position !== null) {
      positions.push(position)
    }
  })

  const avg_position_raw = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null

  // 3. Sentiment Score
  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0

  llm_runs.forEach(run => {
    if (run.sentiment === 'positive') positiveCount++
    else if (run.sentiment === 'negative') negativeCount++
    else neutralCount++
  })

  const total = positiveCount + negativeCount + neutralCount
  const sentiment_pct =
    total > 0 ? clamp(((positiveCount - negativeCount) / Math.max(1, total)) * 100, 0, 100) : 50

  // 4. Mentions (SADECE brand name'in response_text'te kaç kez geçtiği)
  let mentions_raw = 0

  llm_runs.forEach(run => {
    // Sadece brand name mentions - URL/domain saymıyoruz
    mentions_raw += countBrandMentions(run.response_text, brandName)
  })

  return {
    visibility_pct: Number(visibility_pct.toFixed(2)),
    avg_position_raw: avg_position_raw !== null ? Number(avg_position_raw.toFixed(2)) : null,
    sentiment_pct: Number(sentiment_pct.toFixed(2)),
    mentions_raw,
  }
}

function computeOverallScores(
  per_llm: Record<LLMProvider, LLMScoreResult>,
  config: ScoringConfig
) {
  const llms: LLMProvider[] = ['chatgpt', 'gemini', 'perplexity']

  // Weighted averages
  const visibility_pct = weightedMean(
    llms.map(llm => per_llm[llm].visibility_pct),
    llms.map(llm => config.llm_weights[llm])
  )

  // Position: ortalama rank (yüzdelik yok)
  const position_values = llms.map(llm => per_llm[llm].avg_position_raw).filter(v => v !== null) as number[]
  const position_weights = llms
    .filter(llm => per_llm[llm].avg_position_raw !== null)
    .map(llm => config.llm_weights[llm])

  const avg_position_raw = position_values.length > 0 ? weightedMean(position_values, position_weights) : null

  const sentiment_pct = weightedMean(
    llms.map(llm => per_llm[llm].sentiment_pct),
    llms.map(llm => config.llm_weights[llm])
  )

  // Mentions: toplam raw count (yüzdelik yok)
  const mentions_raw_total = llms.reduce((sum, llm) => sum + per_llm[llm].mentions_raw, 0)

  return {
    visibility_pct: Number(visibility_pct.toFixed(2)),
    avg_position_raw: avg_position_raw !== null ? Number(avg_position_raw.toFixed(2)) : null,
    sentiment_pct: Number(sentiment_pct.toFixed(2)),
    mentions_raw_total,
  }
}

// Helper functions
function generateDomainVariants(domain: string): string[] {
  const normalized = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')

  return [
    normalized,
    `www.${normalized}`,
    `https://${normalized}`,
    `http://${normalized}`,
    `https://www.${normalized}`,
    `http://www.${normalized}`,
  ]
}

function canonicalizeDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return url.toLowerCase().replace(/^www\./, '').split('/')[0]
  }
}

function matchesDomainVariant(url: string, variants: string[]): boolean {
  const canonical = canonicalizeDomain(url)
  return variants.some(variant => canonicalizeDomain(variant) === canonical)
}

function isBrandMentioned(run: LLMRun, variants: string[], brandName: string): boolean {
  const lowerText = run.response_text.toLowerCase()
  const lowerBrandName = brandName.toLowerCase()

  // Check 1: Brand name in response text
  if (lowerText.includes(lowerBrandName)) {
    return true
  }

  // Check 2: Domain in response text
  if (variants.some(v => lowerText.includes(canonicalizeDomain(v)))) {
    return true
  }

  // Check 3: Domain in sources
  return run.sources.some(source => matchesDomainVariant(source.url, variants))
}

function isDomainMentioned(run: LLMRun, variants: string[]): boolean {
  // Check in response text
  const lowerText = run.response_text.toLowerCase()
  if (variants.some(v => lowerText.includes(canonicalizeDomain(v)))) {
    return true
  }

  // Check in sources
  return run.sources.some(source => matchesDomainVariant(source.url, variants))
}

/**
 * Brand'in response text'inde kaçıncı sırada bahsedildiğini bulur
 * Örnek: "1. Turkcell 2. Vodafone" → Turkcell için 1 döner
 */
function getBrandPositionInText(text: string, brandName: string, domainVariants: string[]): number | null {
  const lowerText = text.toLowerCase()
  const lowerBrand = brandName.toLowerCase()

  console.log(`[Position Debug] Analyzing text for brand: ${brandName}`)

  // Method 1: Numbered lists (1., 2., 3. veya 1) 2) 3))
  const numberedListRegex = /(\d+)[\.)]\s*([^\n.]+)/g
  let match
  let position = 1

  while ((match = numberedListRegex.exec(text)) !== null) {
    const listNumber = parseInt(match[1])
    const itemText = match[2].toLowerCase()

    console.log(`[Position Debug] Found list item ${listNumber}: "${match[2].substring(0, 50)}..."`)

    // Check if brand name is in this list item
    if (itemText.includes(lowerBrand)) {
      console.log(`[Position Debug] ✓ Brand found at position ${listNumber}`)
      return listNumber
    }

    // Check if domain is in this list item
    if (domainVariants.some(v => itemText.includes(canonicalizeDomain(v)))) {
      console.log(`[Position Debug] ✓ Domain found at position ${listNumber}`)
      return listNumber
    }
  }

  // Method 2: Brand ilk bahsediliş sırası (paragraph-based)
  // Text'i cümlelere veya paragraflara böl, brand'in kaçıncı paragrafta geçtiğini bul
  const paragraphs = text.split(/\n\n+/)
  for (let i = 0; i < paragraphs.length; i++) {
    const paraLower = paragraphs[i].toLowerCase()

    // Her paragrafta brand name veya domain var mı?
    if (paraLower.includes(lowerBrand) || domainVariants.some(v => paraLower.includes(canonicalizeDomain(v)))) {
      console.log(`[Position Debug] ✓ Brand found in paragraph ${i + 1}`)
      return i + 1
    }
  }

  // Method 3: Sentence-based (daha granular)
  const sentences = text.split(/[.!?]+/)
  for (let i = 0; i < sentences.length; i++) {
    const sentLower = sentences[i].toLowerCase()

    if (sentLower.includes(lowerBrand) || domainVariants.some(v => sentLower.includes(canonicalizeDomain(v)))) {
      console.log(`[Position Debug] ✓ Brand found in sentence ${i + 1}`)
      return i + 1
    }
  }

  console.log(`[Position Debug] ✗ Brand not found in text`)
  return null
}

function countBrandMentions(text: string, brandName: string): number {
  const lowerText = text.toLowerCase()
  const lowerBrandName = brandName.toLowerCase()

  // Use word boundaries to avoid partial matches (e.g. "adidas" not matching "adidasssss")
  const regex = new RegExp(`\\b${lowerBrandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  const matches = lowerText.match(regex)

  return matches ? matches.length : 0
}

function countDomainMentions(text: string, variants: string[]): number {
  const lowerText = text.toLowerCase()
  let count = 0

  variants.forEach(variant => {
    const canonical = canonicalizeDomain(variant)
    const regex = new RegExp(canonical.replace(/\./g, '\\.'), 'gi')
    const matches = lowerText.match(regex)
    if (matches) count += matches.length
  })

  return count
}

function weightedMean(values: number[], weights: number[]): number {
  if (values.length === 0) return 0

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0)

  return weightedSum / totalWeight
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
