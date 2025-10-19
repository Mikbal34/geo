'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { ScoreLLM, ScoreOverall } from '@/types/llm'
import { BarChart3, ExternalLink, Filter, TrendingUp, ChevronDown, Clock, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

type LLMFilter = 'all' | 'chatgpt' | 'gemini' | 'perplexity'

interface CompetitorScore {
  competitor_name: string
  competitor_domain: string
  visibility_pct: number
  mentions_total: number
  avg_position: number
  sentiment_pct: number
}

interface AnalysisHistory {
  trend_data: Array<{
    date: string
    timestamp: string
    visibility: number
    sentiment: number
    position: number
    mentions: number
    run_type: string
  }>
  latest_run: any
  trends: {
    visibility_change: number
    sentiment_change: number
    position_change: number
    mentions_change: number
  } | null
  total_runs: number
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory | null>(null)
  const [timeUntilNextRun, setTimeUntilNextRun] = useState<string>('')

  useEffect(() => {
    fetchScores()
    fetchAnalysisHistory()
  }, [brandId])

  // Calculate time until next scheduled run (daily at 03:00 UTC)
  useEffect(() => {
    const calculateTimeUntilNextRun = () => {
      const now = new Date()
      const nextRun = new Date()

      // Set to 03:00 UTC
      nextRun.setUTCHours(3, 0, 0, 0)

      // If it's already past 03:00 UTC today, set to tomorrow
      if (now.getTime() > nextRun.getTime()) {
        nextRun.setDate(nextRun.getDate() + 1)
      }

      const diff = nextRun.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeUntilNextRun(`${hours}h ${minutes}m`)
    }

    calculateTimeUntilNextRun()
    const interval = setInterval(calculateTimeUntilNextRun, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchCompetitorScores()
  }, [brandId, selectedLLM])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      console.log('Competitor scores API response:', data)
      console.log('Competitor scores data:', data.competitor_scores)
      setCompetitorScores(data.competitor_scores || [])
    } catch (error) {
      console.error('Error fetching competitor scores:', error)
    } finally {
      setLoadingCompetitors(false)
    }
  }

  const fetchAnalysisHistory = async () => {
    try {
      const res = await fetch(`/api/analysis-history/${brandId}`)
      const data = await res.json()
      if (data.success) {
        setAnalysisHistory(data)
      }
    } catch (error) {
      console.error('Error fetching analysis history:', error)
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

  // Generate Executive Summary
  const generateExecutiveSummary = (score: ScoreOverall | ScoreLLM | null) => {
    if (!score) return ''

    const visibility = Math.round(score.visibility_pct || 0)
    const sentiment = Math.round(score.sentiment_pct || 0)
    const mentions = 'mentions_raw_total' in score ? score.mentions_raw_total : score.mentions_raw
    const position = score.avg_position_raw || 0

    let summaryParts = []

    // Visibility assessment
    if (visibility >= 70) {
      summaryParts.push(`Strong market presence with ${visibility}% visibility across AI platforms`)
    } else if (visibility >= 40) {
      summaryParts.push(`Moderate visibility at ${visibility}%, indicating room for improvement`)
    } else {
      summaryParts.push(`Low visibility at ${visibility}%, requires immediate strategic attention`)
    }

    // Sentiment assessment
    if (sentiment >= 60) {
      summaryParts.push(`positive sentiment (${sentiment}%)`)
    } else if (sentiment >= 40) {
      summaryParts.push(`neutral sentiment (${sentiment}%)`)
    } else {
      summaryParts.push(`concerning sentiment (${sentiment}%)`)
    }

    // Position assessment
    if (position > 0 && position <= 3) {
      summaryParts.push(`achieving top-3 average ranking`)
    } else if (position > 3 && position <= 5) {
      summaryParts.push(`ranking in top-5 positions`)
    }

    return summaryParts.join(', ') + '.'
  }

  const generateCompetitorSummary = () => {
    if (!overallScore || competitorScores.length === 0) return ''

    const brandVisibility = Math.round(overallScore.visibility_pct || 0)
    const avgCompetitorVisibility = Math.round(
      competitorScores.reduce((sum, c) => sum + c.visibility_pct, 0) / competitorScores.length
    )

    const brandSentiment = Math.round(overallScore.sentiment_pct || 0)
    const topCompetitor = competitorScores.reduce((max, c) =>
      c.visibility_pct > max.visibility_pct ? c : max
    )

    if (brandVisibility > avgCompetitorVisibility) {
      return `Your brand outperforms competitors with ${brandVisibility}% visibility vs. market average of ${avgCompetitorVisibility}%. Key competitor ${topCompetitor.competitor_name} shows ${topCompetitor.visibility_pct}% visibility, requiring continuous monitoring.`
    } else {
      return `Competitive gap identified: Your brand at ${brandVisibility}% visibility trails market average of ${avgCompetitorVisibility}%. ${topCompetitor.competitor_name} leads with ${topCompetitor.visibility_pct}%, presenting strategic opportunities for differentiation.`
    }
  }

  // Prepare data - AYRI: Yüzdelik metrikler vs Sayısal metrikler
  const percentageMetrics = filteredScore ? [
    {
      category: 'Visibility',
      score: Math.round(filteredScore.visibility_pct || 0),
      description: 'Brand presence %'
    },
    {
      category: 'Sentiment',
      score: Math.round(filteredScore.sentiment_pct || 0),
      description: 'Positive sentiment %'
    }
  ] : []

  const numericalMetrics = filteredScore ? [
    {
      category: 'Avg Position',
      value: filteredScore.avg_position_raw || 0,
      description: 'Average ranking (1-10)'
    },
    {
      category: 'Mentions',
      value: 'mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : (filteredScore as any).mentions_raw || 0,
      description: 'Total brand name mentions'
    }
  ] : []

  // Prepare data for LLM comparison - AYRI grafikler
  const llmPercentageData = llmScores.map(score => ({
    llm: getLLMName(score.llm),
    'Visibility %': Math.round(score.visibility_pct || 0),
    'Sentiment %': Math.round(score.sentiment_pct || 0)
  }))

  const llmNumericalData = llmScores.map(score => ({
    llm: getLLMName(score.llm),
    'Avg Position': score.avg_position_raw || 0,
    'Mentions': score.mentions_raw || 0
  }))

  // Visibility Trend Data - Use historical data if available
  const trendData = analysisHistory && analysisHistory.trend_data.length > 0
    ? analysisHistory.trend_data.map(item => ({
        date: item.date,
        Visibility: item.visibility,
        Sentiment: item.sentiment
      }))
    : llmScores.length > 0 ? (
        selectedLLM === 'all' && overallScore ? [
          {
            date: 'Current',
            Visibility: Math.round(overallScore.visibility_pct || 0),
            Sentiment: Math.round(overallScore.sentiment_pct || 0)
          }
        ] : [
          {
            date: 'Current',
            Visibility: llmScores.find(s => s.llm === selectedLLM)?.visibility_pct || 0,
            Sentiment: llmScores.find(s => s.llm === selectedLLM)?.sentiment_pct || 0
          }
        ]
      ) : []

  // Competitor Ranking Table Data
  const competitorRankingData = filteredScore && competitorScores.length > 0 ? (() => {
    const ownBrand = {
      rank: 1,
      brand: 'Your Brand',
      visibility: Math.round(filteredScore.visibility_pct || 0),
      sentiment: Math.round(filteredScore.sentiment_pct || 0),
      position: filteredScore.avg_position_raw || 0,
      mentions: 'mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : ('mentions_raw' in filteredScore ? filteredScore.mentions_raw : 0),
      isOwn: true
    }

    const competitors = competitorScores.map((comp, idx) => {
      console.log('Mapping competitor:', comp.competitor_name, {
        visibility: comp.visibility_pct,
        sentiment: comp.sentiment_pct,
        position: comp.avg_position,
        mentions: comp.mentions_total
      })
      return {
        rank: idx + 2,
        brand: comp.competitor_name,
        visibility: comp.visibility_pct || 0,
        sentiment: comp.sentiment_pct || 0,
        position: comp.avg_position || 0,
        mentions: comp.mentions_total || 0,
        isOwn: false
      }
    })

    const combined = [ownBrand, ...competitors]
    const sorted = combined.sort((a, b) => b.visibility - a.visibility)
    const ranked = sorted.map((item, idx) => ({ ...item, rank: idx + 1 }))

    console.log('Final competitor ranking data:', ranked)
    return ranked
  })() : []

  // LLM Performance Table Data
  const llmTableData = llmScores.map(score => ({
    llm: getLLMName(score.llm),
    llmKey: score.llm,
    visibility: Math.round(score.visibility_pct || 0),
    sentiment: Math.round(score.sentiment_pct || 0),
    position: score.avg_position_raw || 0,
    mentions: score.mentions_raw || 0
  }))

  // Helper function for status badge
  const getStatusBadge = (value: number, type: 'percentage' | 'position') => {
    if (type === 'percentage') {
      if (value >= 70) return '🟢'
      if (value >= 40) return '🟡'
      return '🔴'
    } else {
      if (value <= 3) return '🟢'
      if (value <= 5) return '🟡'
      return '🔴'
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 py-4">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="inline-block mb-1">
                <span className="text-slate-600 text-xs font-semibold tracking-wider uppercase">
                  Brand Intelligence
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/brands/${brandId}/results`)}
                className="inline-flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Results
              </button>
              <button
                onClick={() => router.push(`/brands/${brandId}/prompts`)}
                className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Prompts & Analyze
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900 mb-4" />
                <p className="text-slate-600">Loading dashboard...</p>
              </div>
            </div>
          ) : !overallScore ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Analysis Yet</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Add prompts to run your first AI-powered analysis and unlock deep insights into your brand's market position across 4 key dimensions.
              </p>
              <button
                onClick={() => router.push(`/brands/${brandId}/prompts`)}
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Prompts & Start
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* LLM Filter + Next Analysis Info */}
              <div className="flex items-center justify-between gap-3">
                {/* Next Scheduled Analysis */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium text-slate-700">Next Auto-Analysis:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-indigo-900">{timeUntilNextRun}</span>
                    <span className="text-[10px] text-slate-500">(Daily 06:00)</span>
                  </div>
                </div>

                {/* LLM Filter Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    {selectedLLM === 'all' ? 'Overall' : selectedLLM === 'chatgpt' ? 'ChatGPT' : selectedLLM === 'gemini' ? 'Gemini' : 'Perplexity'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => { setSelectedLLM('all'); setIsDropdownOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg ${
                          selectedLLM === 'all' ? 'bg-slate-100 font-medium' : ''
                        }`}
                      >
                        Overall
                      </button>
                      <button
                        onClick={() => { setSelectedLLM('chatgpt'); setIsDropdownOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                          selectedLLM === 'chatgpt' ? 'bg-slate-100 font-medium' : ''
                        }`}
                      >
                        ChatGPT
                      </button>
                      <button
                        onClick={() => { setSelectedLLM('gemini'); setIsDropdownOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                          selectedLLM === 'gemini' ? 'bg-slate-100 font-medium' : ''
                        }`}
                      >
                        Gemini
                      </button>
                      <button
                        onClick={() => { setSelectedLLM('perplexity'); setIsDropdownOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 last:rounded-b-lg ${
                          selectedLLM === 'perplexity' ? 'bg-slate-100 font-medium' : ''
                        }`}
                      >
                        Perplexity
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Metrics Overview - Compact Single Row */}
              <div className="bg-white rounded-md border border-slate-200 p-2.5 flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Visibility</div>
                  <div className="text-base font-bold text-slate-900">
                    {filteredScore ? Math.round(filteredScore.visibility_pct || 0) : 0}%
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Sentiment</div>
                  <div className="text-base font-bold text-slate-900">
                    {filteredScore ? Math.round(filteredScore.sentiment_pct || 0) : 0}%
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Position</div>
                  <div className="text-base font-bold text-slate-900">
                    {filteredScore && filteredScore.avg_position_raw ? filteredScore.avg_position_raw.toFixed(1) : 'N/A'}
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Mentions</div>
                  <div className="text-base font-bold text-slate-900">
                    {filteredScore ? ('mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : (filteredScore as any).mentions_raw || 0) : 0}
                  </div>
                </div>
              </div>

              {/* Main Content: Left (Trend) + Right (Ranking) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* LEFT: Historical Trends (1/2 width) */}
                <div className="bg-white rounded-md shadow-sm border border-slate-200 p-3 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Historical Trends
                    </h2>
                    {analysisHistory && analysisHistory.total_runs > 0 && (
                      <span className="text-[9px] text-slate-500">
                        {analysisHistory.total_runs} runs (30 days)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    {analysisHistory && analysisHistory.trend_data.length > 0
                      ? 'Visibility & Sentiment over time'
                      : 'Run multiple analyses to see trends'}
                  </p>

                  <div className="w-full h-48 flex-1" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{ top: 10, right: 15, bottom: 10, left: -10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickLine={{ stroke: '#64748b' }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickLine={{ stroke: '#64748b' }}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                            padding: '8px 12px'
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '10px' }}
                          iconType="line"
                        />
                        <Line
                          type="monotone"
                          dataKey="Visibility"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ fill: '#6366f1', r: 3 }}
                          activeDot={{ r: 5 }}
                          name="Visibility %"
                        />
                        <Line
                          type="monotone"
                          dataKey="Sentiment"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 3 }}
                          activeDot={{ r: 5 }}
                          name="Sentiment %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* RIGHT: Industry Ranking (1/2 width) - Vertical Layout */}
                <div className="bg-white rounded-md shadow-sm border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold text-slate-900">Industry Ranking</h2>
                    <p className="text-[9px] text-slate-500">Brands with highest visibility</p>
                  </div>

                  {/* Vertical Cards */}
                  <div className="space-y-2">
                    {competitorRankingData.length > 0 ? competitorRankingData.map((item) => (
                      <div
                        key={item.rank}
                        className={`p-2 rounded border ${
                          item.isOwn
                            ? 'bg-slate-50 border-slate-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Brand Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-900">#{item.rank}</span>
                          <span className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-900">
                            {item.brand.substring(0, 1).toUpperCase()}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 flex-1 truncate">{item.brand}</span>
                        </div>

                        {/* Metrics Grid - 4 columns */}
                        <div className="grid grid-cols-4 gap-2">
                          {/* Position */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Position</div>
                            <div className="text-sm font-semibold text-slate-900">
                              {item.position > 0 ? item.position.toFixed(1) : 'N/A'}
                            </div>
                          </div>

                          {/* Sentiment */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Sentiment</div>
                            <div className="text-sm font-semibold text-slate-900">
                              {item.sentiment}%
                            </div>
                          </div>

                          {/* Visibility */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Visibility</div>
                            <div className="text-sm font-bold text-slate-900">{item.visibility}%</div>
                          </div>

                          {/* Mentions */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Mentions</div>
                            <div className="text-sm font-semibold text-slate-900">{item.mentions}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-[10px] text-slate-500 text-center py-4">No competitor data</p>
                    )}
                  </div>

                  {/* View All Link */}
                  {competitorRankingData.length > 0 && (
                    <button
                      onClick={() => router.push(`/brands/${brandId}/competitors`)}
                      className="w-full text-center text-[10px] text-slate-600 hover:text-slate-900 font-medium mt-3 pt-2 border-t border-slate-200"
                    >
                      View all competitors
                    </button>
                  )}
                </div>
              </div>

              {/* LLM Performance Table - Compact */}
              {selectedLLM === 'all' && llmTableData.length > 0 && (
                <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-xs font-semibold text-slate-900">Platform Performance</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left py-1.5 px-3 font-medium text-slate-600 uppercase text-[9px]">Platform</th>
                          <th className="text-center py-1.5 px-3 font-medium text-slate-600 uppercase text-[9px]">Visibility</th>
                          <th className="text-center py-1.5 px-3 font-medium text-slate-600 uppercase text-[9px]">Sentiment</th>
                          <th className="text-center py-1.5 px-3 font-medium text-slate-600 uppercase text-[9px]">Position</th>
                          <th className="text-center py-1.5 px-3 font-medium text-slate-600 uppercase text-[9px]">Mentions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {llmTableData.map((row) => (
                          <tr key={row.llmKey} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-900">{row.llm}</td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-semibold text-slate-900">{row.visibility}%</span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-semibold text-slate-900">{row.sentiment}%</span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="font-semibold text-slate-900">{row.position.toFixed(1)}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-900">{row.mentions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
