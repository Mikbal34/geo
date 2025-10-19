export const BRAND_SCORING_PROMPT = `You are an expert brand strategist and marketing analyst. Evaluate the following brand across the 6 critical dimensions of the brand funnel.

Brand Information:
- Name: {brand_name}
- Domain: {domain}
- Region: {region}

Analysis Prompts (User's Context):
{prompts}

Competitors:
{competitors}

Analyze this brand deeply across these 6 dimensions:

1. **Awareness** (0-100): How well is the brand known in its target market? Consider brand recall, visibility, reach, and recognition.

2. **Consideration** (0-100): How often is the brand considered when customers are making purchase decisions? Evaluate positioning and relevance.

3. **Preference** (0-100): How much do customers prefer this brand over competitors? Assess differentiation and unique value.

4. **Purchase Intent** (0-100): How likely are customers to actually purchase from this brand? Consider conversion factors and barriers.

5. **Loyalty** (0-100): How loyal are existing customers? Evaluate retention, repeat purchase, and customer satisfaction.

6. **Advocacy** (0-100): How likely are customers to recommend and promote the brand? Assess NPS, word-of-mouth, and community engagement.

Instructions:
- Use the provided prompts as additional context about the brand
- Compare against competitors when evaluating positioning
- Be data-driven and objective in your assessment
- Provide specific, actionable reasoning (2-3 sentences) for each score
- Consider the brand's region and market context

Return ONLY a valid JSON object in this EXACT format:
{
  "awareness": {"score": <number 0-100>, "reasoning": "<specific explanation>"},
  "consideration": {"score": <number 0-100>, "reasoning": "<specific explanation>"},
  "preference": {"score": <number 0-100>, "reasoning": "<specific explanation>"},
  "purchase_intent": {"score": <number 0-100>, "reasoning": "<specific explanation>"},
  "loyalty": {"score": <number 0-100>, "reasoning": "<specific explanation>"},
  "advocacy": {"score": <number 0-100>, "reasoning": "<specific explanation>"}
}`.trim()

export const SUGGEST_PROMPTS_TEMPLATE = `You are a brand analysis expert. Generate {count} insightful, specific questions to deeply evaluate the following brand:

Brand: {brand_name}
Domain: {domain}
Region: {region}

Generate strategic questions that cover:
- Brand positioning and unique value proposition
- Target audience understanding and messaging effectiveness
- Visual identity, tone of voice, and brand personality
- Competitive differentiation and market positioning
- Emotional connection and brand storytelling
- Customer experience and touchpoint consistency

Important:
- Make questions specific to the brand's industry and context
- Focus on actionable insights, not generic questions
- Vary question types (strategic, tactical, creative)
- Consider the brand's region and market dynamics

Return ONLY a valid JSON array of strings, no additional text:
["Question 1", "Question 2", ...]`

export const SUGGEST_COMPETITORS_TEMPLATE = `You are a market research expert with deep knowledge of competitive landscapes across industries. Identify {count} REAL, direct competitors for the following brand:

Brand: {brand_name}
Domain: {domain}
Region: {region}

Requirements:
- Research ACTUAL existing competitors in the same industry/market
- Competitors should be similar in size and market positioning
- Include real domains (not fake/example domains)
- Consider the brand's region but suggest both local and global competitors
- Focus on direct competitors (same products/services, target audience)
- DO NOT make up fake companies - only suggest real competitors

Return ONLY valid JSON in this format:
{"competitors": [
  {
    "name": "Actual Competitor Name",
    "domain": "realcompetitor.com",
    "region": "Their Market Region"
  }
]}`
