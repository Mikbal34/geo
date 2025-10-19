'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { ScoreLLM, ScoreOverall } from '@/types/llm'
import { TrendingUp, TrendingDown, Eye, MapPin, MessageSquare, Hash, BarChart3, ExternalLink } from 'lucide-react'

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.brandId as string
  const [overallScore, setOverallScore] = useState<ScoreOverall | null>(null)
  const [llmScores, setLLMScores] = useState<ScoreLLM[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScores()
  }, [brandId])

  const fetchScores = async () => {
    try {
      const res = await fetch(`/api/scores-overall/${brandId}`)
      const data = await res.json()
      setOverallScore(data.overall)
      setLLMScores(data.per_llm || [])
    } catch (error) {
      console.error('Error fetching scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLLMColor = (llm: string) => {
    switch (llm) {
      case 'chatgpt':
        return 'from-green-500 to-emerald-500'
      case 'gemini':
        return 'from-blue-500 to-cyan-500'
      case 'perplexity':
        return 'from-purple-500 to-pink-500'
      default:
        return 'from-slate-500 to-slate-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-blue-600'
    if (score >= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Calculate overall scores
  const avgVisibility = overallScore?.visibility_pct || 0
  const avgPosition = overallScore?.avg_position_raw || 0  // Artık ortalama rank
  const avgSentiment = overallScore?.sentiment_pct || 0
  const totalMentions = overallScore?.mentions_raw_total || 0  // Artık raw count

  // Overall performance score (sadece yüzdelik metrikler)
  const overallPerformance = Math.round((avgVisibility + avgSentiment) / 2)

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <div className="inline-block mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text text-sm font-bold tracking-wider uppercase">
                  Brand Intelligence
                </span>
              </div>
              <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            </div>
            <button
              onClick={() => router.push(`/brands/${brandId}/analyze`)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run New Analysis
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4" />
                <p className="text-slate-600">Loading dashboard...</p>
              </div>
            </div>
          ) : !overallScore ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Analysis Yet</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Run your first AI-powered analysis to unlock deep insights into your brand's market position across 6 key dimensions.
              </p>
              <button
                onClick={() => router.push(`/brands/${brandId}/analyze`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Analysis
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overall Performance Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Overall AI Visibility Score</h2>
                  <button
                    onClick={() => router.push(`/brands/${brandId}/results`)}
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    <span>View Detailed Results</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-5 gap-6">
                  <div className="col-span-2">
                    <div className="text-7xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-2">
                      {overallPerformance}
                    </div>
                    <p className="text-slate-500 text-sm">Combined score across all LLMs</p>
                  </div>
                  <div className="col-span-3 grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                      <Eye className="w-6 h-6 text-blue-600 mb-2" />
                      <div className={`text-2xl font-bold ${getScoreColor(avgVisibility)}`}>
                        {avgVisibility.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Visibility</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <MapPin className="w-6 h-6 text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {avgPosition > 0 ? `#${avgPosition.toFixed(1)}` : 'N/A'}
                      </div>
                      <div className="text-sm text-slate-600">Avg Position</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <MessageSquare className="w-6 h-6 text-purple-600 mb-2" />
                      <div className={`text-2xl font-bold ${getScoreColor(avgSentiment)}`}>
                        {avgSentiment.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">Sentiment</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                      <Hash className="w-6 h-6 text-orange-600 mb-2" />
                      <div className="text-2xl font-bold text-orange-600">
                        {totalMentions}
                      </div>
                      <div className="text-sm text-slate-600">Total Mentions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LLM Comparison */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-slate-700" />
                  <h2 className="text-2xl font-bold text-slate-900">LLM Performance Comparison</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {llmScores.map((llmScore) => (
                    <div
                      key={llmScore.id}
                      className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 hover:shadow-2xl transition-shadow"
                    >
                      {/* LLM Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getLLMColor(llmScore.llm)} text-white font-bold text-sm`}>
                          {llmScore.llm.toUpperCase()}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="space-y-4">
                        {/* Visibility */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-slate-500" />
                              <span className="text-sm text-slate-600">Visibility</span>
                            </div>
                            <span className={`font-bold ${getScoreColor(llmScore.visibility_pct)}`}>
                              {llmScore.visibility_pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${getLLMColor(llmScore.llm)}`}
                              style={{ width: `${llmScore.visibility_pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Position */}
                        {llmScore.avg_position_raw !== null && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-600">Avg Position</span>
                              </div>
                              <span className="font-bold text-green-600">
                                #{llmScore.avg_position_raw.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Lower is better (rank position)
                            </div>
                          </div>
                        )}

                        {/* Sentiment */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-slate-500" />
                              <span className="text-sm text-slate-600">Sentiment</span>
                            </div>
                            <span className={`font-bold ${getScoreColor(llmScore.sentiment_pct)}`}>
                              {llmScore.sentiment_pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${getLLMColor(llmScore.llm)}`}
                              style={{ width: `${llmScore.sentiment_pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Mentions */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-slate-500" />
                              <span className="text-sm text-slate-600">Mentions</span>
                            </div>
                            <span className="font-bold text-orange-600">
                              {llmScore.mentions_raw}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Total brand mentions across responses
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Key Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                    <p className="text-slate-700">
                      Your brand appears in <strong>{avgVisibility.toFixed(1)}%</strong> of AI responses across all prompts
                    </p>
                  </div>
                  {avgPosition > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                      <p className="text-slate-700">
                        When mentioned, your brand averages position <strong>#{avgPosition.toFixed(1)}</strong> in source rankings
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                    <p className="text-slate-700">
                      Sentiment analysis shows <strong>{avgSentiment.toFixed(1)}%</strong> positive sentiment across LLM responses
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                    <p className="text-slate-700">
                      Your brand received <strong>{overallScore?.mentions_raw_total || 0}</strong> total mentions across all responses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
