'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { ScoreLLM, ScoreOverall } from '@/types/llm'
import { BarChart3, ExternalLink, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

type LLMFilter = 'all' | 'chatgpt' | 'gemini' | 'perplexity'

interface CompetitorScore {
  competitor_name: string
  competitor_domain: string
  visibility_pct: number
  mentions_total: number
  avg_position: number
  sentiment_pct: number
}

export default function DashboardPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string
  const [overallScore, setOverallScore] = useState<ScoreOverall | null>(null)
  const [llmScores, setLLMScores] = useState<ScoreLLM[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLLM, setSelectedLLM] = useState<LLMFilter>('all')
  const [competitorScores, setCompetitorScores] = useState<CompetitorScore[]>([])
  const [loadingCompetitors, setLoadingCompetitors] = useState(true)

  useEffect(() => {
    fetchScores()
  }, [brandId])

  useEffect(() => {
    fetchCompetitorScores()
  }, [brandId, selectedLLM])

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

  const fetchCompetitorScores = async () => {
    setLoadingCompetitors(true)
    try {
      const llmParam = selectedLLM === 'all' ? 'overall' : selectedLLM
      const res = await fetch(`/api/competitors/${brandId}/scores?llm=${llmParam}`)
      const data = await res.json()
      setCompetitorScores(data.competitor_scores || [])
    } catch (error) {
      console.error('Error fetching competitor scores:', error)
    } finally {
      setLoadingCompetitors(false)
    }
  }

  const getLLMColor = (llm: string) => {
    switch (llm) {
      case 'chatgpt':
        return { bg: 'from-green-500 to-emerald-500', fill: '#10b981' }
      case 'gemini':
        return { bg: 'from-blue-500 to-cyan-500', fill: '#3b82f6' }
      case 'perplexity':
        return { bg: 'from-purple-500 to-pink-500', fill: '#a855f7' }
      default:
        return { bg: 'from-slate-500 to-slate-600', fill: '#64748b' }
    }
  }

  const getLLMName = (llm: string) => {
    switch (llm) {
      case 'chatgpt': return 'ChatGPT'
      case 'gemini': return 'Gemini'
      case 'perplexity': return 'Perplexity'
      default: return llm
    }
  }

  // Get filtered scores
  const getFilteredScore = () => {
    if (selectedLLM === 'all') {
      return overallScore
    }
    return llmScores.find(s => s.llm === selectedLLM) || null
  }

  const filteredScore = getFilteredScore()

  // Prepare data for 4 category bar chart
  const categoryData = filteredScore ? [
    {
      category: 'Visibility',
      score: Math.round(filteredScore.visibility_pct || 0),
      description: 'Brand presence in responses'
    },
    {
      category: 'Position',
      score: Math.round(100 - ((filteredScore.avg_position_raw || 10) * 10)), // Convert rank to score
      description: 'Average ranking position'
    },
    {
      category: 'Sentiment',
      score: Math.round(filteredScore.sentiment_pct || 0),
      description: 'Positive sentiment percentage'
    },
    {
      category: 'Mentions',
      score: Math.round((('mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : filteredScore.mentions_raw) || 0) / 10 * 100), // Normalize to 100
      description: 'Total brand mentions'
    }
  ] : []

  // Prepare data for LLM comparison
  const llmComparisonData = llmScores.map(score => ({
    llm: getLLMName(score.llm),
    Visibility: Math.round(score.visibility_pct || 0),
    Position: Math.round(100 - ((score.avg_position_raw || 10) * 10)),
    Sentiment: Math.round(score.sentiment_pct || 0),
    Mentions: Math.round((score.mentions_raw || 0) / 10 * 100)
  }))

  // Radar chart data
  const radarData = categoryData.map(item => ({
    category: item.category,
    value: item.score
  }))

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/brands/${brandId}/prompts`)}
                className="inline-flex items-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-6 py-3 rounded-xl font-semibold hover:border-purple-300 hover:text-purple-600 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Prompts
              </button>
              <button
                onClick={() => router.push(`/brands/${brandId}/results`)}
                className="inline-flex items-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-6 py-3 rounded-xl font-semibold hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Results
              </button>
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
                Run your first AI-powered analysis to unlock deep insights into your brand's market position across 4 key dimensions.
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
              {/* LLM Filter */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900">Filter by LLM</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLLM('all')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedLLM === 'all'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Overall
                    </button>
                    <button
                      onClick={() => setSelectedLLM('chatgpt')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedLLM === 'chatgpt'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ChatGPT
                    </button>
                    <button
                      onClick={() => setSelectedLLM('gemini')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedLLM === 'gemini'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => setSelectedLLM('perplexity')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedLLM === 'perplexity'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Perplexity
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Category Scores - Bar Chart */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Performance by Category</h2>
                  <button
                    onClick={() => router.push(`/brands/${brandId}/results`)}
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                    />
                    <Bar dataKey="score" fill="#a855f7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {categoryData.map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-1">
                        {item.score}
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{item.category}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radar Chart - Overall View */}
              {selectedLLM === 'all' && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Overall Performance Radar</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="category" stroke="#64748b" />
                      <PolarRadiusAxis stroke="#64748b" />
                      <Radar name="Score" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Competitor Comparison */}
              {!loadingCompetitors && competitorScores.length > 0 && overallScore && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Competitor Comparison</h2>
                    <button
                      onClick={() => router.push(`/brands/${brandId}/competitors`)}
                      className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      <span>Manage Competitors</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={[
                        {
                          name: 'Your Brand',
                          visibility: Math.round(overallScore.visibility_pct || 0),
                          sentiment: Math.round(overallScore.sentiment_pct || 0),
                          mentions: overallScore.mentions_raw_total || 0,
                          isBrand: true
                        },
                        ...competitorScores.map(comp => ({
                          name: comp.competitor_name,
                          visibility: comp.visibility_pct,
                          sentiment: comp.sentiment_pct,
                          mentions: comp.mentions_total,
                          isBrand: false
                        }))
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '12px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="visibility" name="Visibility %" fill="#a855f7" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="sentiment" name="Sentiment %" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="mentions" name="Total Mentions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                        <span className="font-bold text-slate-800">Your Brand</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <div>Visibility: {Math.round(overallScore.visibility_pct || 0)}%</div>
                        <div>Sentiment: {Math.round(overallScore.sentiment_pct || 0)}%</div>
                        <div>Mentions: {overallScore.mentions_raw_total || 0}</div>
                      </div>
                    </div>
                    {competitorScores.map((comp, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                          <span className="font-bold text-slate-800">{comp.competitor_name}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <div>Visibility: {comp.visibility_pct}%</div>
                          <div>Sentiment: {comp.sentiment_pct}%</div>
                          <div>Mentions: {comp.mentions_total}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM Comparison Chart */}
              {selectedLLM === 'all' && llmScores.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">LLM Comparison</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={llmComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="llm" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '12px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Visibility" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Position" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Sentiment" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Mentions" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
