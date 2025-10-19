import { ScoreReasoning, CreateScoreInput } from '@/types/score'

export function getMockAnalysis(brandId: string): CreateScoreInput[] {
  return [
    {
      brand_id: brandId,
      dimension: 'awareness',
      score: 75,
      reasoning: 'Strong brand recognition within target market segments',
    },
    {
      brand_id: brandId,
      dimension: 'consideration',
      score: 68,
      reasoning: 'Good consideration but room for improvement in decision-making phase',
    },
    {
      brand_id: brandId,
      dimension: 'preference',
      score: 72,
      reasoning: 'Brand is preferred in specific niches but not dominant overall',
    },
    {
      brand_id: brandId,
      dimension: 'purchase_intent',
      score: 65,
      reasoning: 'Moderate purchase intent, price sensitivity affects conversion',
    },
    {
      brand_id: brandId,
      dimension: 'loyalty',
      score: 80,
      reasoning: 'High customer loyalty among existing users with strong retention',
    },
    {
      brand_id: brandId,
      dimension: 'advocacy',
      score: 77,
      reasoning: 'Good word-of-mouth and social media engagement from advocates',
    },
  ]
}

export function getMockPrompts(): string[] {
  return [
    'How does the brand communicate its core values to customers?',
    'What makes this brand stand out from competitors?',
    'How consistent is the brand message across all channels?',
    'What emotional connection does the brand create with its audience?',
    'How well does the brand adapt to changing market trends?',
  ]
}

export function getMockCompetitors(): Array<{
  name: string
  domain: string
  region: string
}> {
  return [
    { name: 'GreenWash', domain: 'greenwash.com', region: 'North America' },
    { name: 'PureEarth', domain: 'pureearth.com', region: 'Global' },
    { name: 'EcoFriendly', domain: 'ecofriendly.com', region: 'Europe' },
  ]
}
