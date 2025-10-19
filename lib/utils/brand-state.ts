export type BrandState = 'INCOMPLETE' | 'READY' | 'ANALYZING' | 'ANALYZED'

export function getBrandState(
  promptCount: number,
  scoreCount: number,
  hasActiveAnalysis: boolean
): BrandState {
  if (hasActiveAnalysis) return 'ANALYZING'
  if (scoreCount > 0) return 'ANALYZED'
  if (promptCount === 0) return 'INCOMPLETE'
  return 'READY'
}
