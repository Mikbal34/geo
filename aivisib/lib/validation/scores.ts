export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 100
}

export function validateAllScores(scores: {
  relevance: number
  clarity: number
  consistency: number
  creativity: number
  emotional_impact: number
}): boolean {
  return (
    isValidScore(scores.relevance) &&
    isValidScore(scores.clarity) &&
    isValidScore(scores.consistency) &&
    isValidScore(scores.creativity) &&
    isValidScore(scores.emotional_impact)
  )
}
