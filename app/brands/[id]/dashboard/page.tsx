'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { ScoreLLM, ScoreOverall } from '@/types/llm'
import { BarChart3, ExternalLink, Filter, TrendingUp, ChevronDown, Calendar, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList } from 'recharts'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { exportDashboardToExcel } from '@/lib/utils/excel-export'
import { Brand } from '@/types/brand'

type LLMProvider = 'chatgpt' | 'gemini' | 'perplexity'
type TimeFilter = '24h' | '7d' | '30d' | 'custom'
type MonthlyView = 'daily' | 'weekly' // For 30d filter

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
  const [brand, setBrand] = useState<Brand | null>(null)
  const [overallScore, setOverallScore] = useState<ScoreOverall | null>(null)
  const [llmScores, setLLMScores] = useState<ScoreLLM[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLLMs, setSelectedLLMs] = useState<LLMProvider[]>(['chatgpt', 'gemini', 'perplexity']) // All selected by default
  const [competitorScores, setCompetitorScores] = useState<CompetitorScore[]>([])
  const [loadingCompetitors, setLoadingCompetitors] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory | null>(null)

  // Time filtering state (for Historical Trends only, ranking always shows latest)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h')
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [availableRuns, setAvailableRuns] = useState<any[]>([])
  const timeFilterRef = useRef<HTMLDivElement>(null)

  // Custom date range for 'custom' filter
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Monthly view toggle (daily/weekly) for 30d filter
  const [monthlyView, setMonthlyView] = useState<MonthlyView>('daily')

  // Chart type toggle for Historical Trends
  const [selectedChart, setSelectedChart] = useState<'trend' | 'metrics'>('trend')

  useEffect(() => {
    fetchBrand()
    fetchScores()
    fetchAnalysisHistory()
  }, [brandId])

  useEffect(() => {
    fetchCompetitorScores()
  }, [brandId, selectedLLMs])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (timeFilterRef.current && !timeFilterRef.current.contains(event.target as Node)) {
        setIsTimeFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchAvailableRuns()
  }, [brandId, timeFilter, selectedLLMs, monthlyView, startDate, endDate])

  const fetchBrand = async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}`)
      const data = await res.json()
      setBrand(data.brand)
    } catch (error) {
      console.error('Error fetching brand:', error)
    }
  }

  const handleExportToExcel = () => {
    if (!brand) {
      alert('Brand data not loaded yet')
      return
    }

    const filteredScore = getFilteredScore()

    exportDashboardToExcel({
      brand,
      overallScore: filteredScore as ScoreOverall,
      llmScores,
      historicalData: availableRuns,
      competitorScores,
      timeFilter,
      selectedLLMs
    })
  }

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
      // If all 3 selected or none selected, show overall
      const llmParam = selectedLLMs.length === 0 || selectedLLMs.length === 3 ? 'overall' : selectedLLMs[0]
      // Ranking always shows latest - no run_id filter
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

  const fetchAvailableRuns = async () => {
    try {
      const params = new URLSearchParams()

      params.append('filter', timeFilter)

      // Add custom date range params if applicable
      if (timeFilter === 'custom' && startDate && endDate) {
        params.append('from', startDate.toISOString())
        params.append('to', endDate.toISOString())
      }

      // Add monthly view param for 30d filter
      if (timeFilter === '30d') {
        params.append('view', monthlyView) // 'daily' or 'weekly'
      }

      // Add LLM filter only if single LLM selected
      if (selectedLLMs.length === 1) {
        params.append('llm', selectedLLMs[0])
      }

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/analysis-runs/${brandId}${queryString}`)
      const data = await res.json()

      if (data.success) {
        setAvailableRuns(data.runs || [])
        // Auto-select latest run if none selected
        if (!selectedRunId && data.latest_run) {
          setSelectedRunId(data.latest_run.id)
        }
      }
    } catch (error) {
      console.error('Error fetching analysis runs:', error)
    }
  }

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter)
    setIsTimeFilterOpen(false)

    if (filter === 'custom') {
      setShowDatePicker(true)
    } else {
      setStartDate(null)
      setEndDate(null)
      setShowDatePicker(false)
    }

    if (filter === '30d') {
      setMonthlyView('daily') // Reset to daily when selecting 30d
    }
  }

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      setShowDatePicker(false)
      fetchAvailableRuns() // Refresh data with custom range
    }
  }

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case '24h': return '24 Hours'
      case '7d': return '7 Days'
      case '30d': return '1 Month'
      case 'custom':
        if (startDate && endDate) {
          return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
        return 'Custom'
      default: return '24 Hours'
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

  // Calculate average score from multiple LLMs
  const calculateAverageScore = (llms: LLMProvider[]): ScoreOverall | ScoreLLM | null => {
    if (llms.length === 0) return overallScore
    if (llms.length === 1) return llmScores.find(s => s.llm === llms[0]) || null

    // Get selected LLM scores
    const selectedScores = llmScores.filter(s => llms.includes(s.llm as LLMProvider))
    if (selectedScores.length === 0) return null

    // Calculate averages
    const visibility_pct = selectedScores.reduce((sum, s) => sum + (s.visibility_pct || 0), 0) / selectedScores.length
    const sentiment_pct = selectedScores.reduce((sum, s) => sum + (s.sentiment_pct || 0), 0) / selectedScores.length

    // Position: average only non-null values
    const positions = selectedScores.map(s => s.avg_position_raw).filter(p => p !== null) as number[]
    const avg_position_raw = positions.length > 0 ? positions.reduce((sum, p) => sum + p, 0) / positions.length : null

    // Mentions: sum all
    const mentions_raw = selectedScores.reduce((sum, s) => sum + (s.mentions_raw || 0), 0)

    return {
      visibility_pct,
      sentiment_pct,
      avg_position_raw,
      mentions_raw,
      llm: 'custom' as any // Custom average
    } as any
  }

  // Get filtered scores
  const getFilteredScore = () => {
    // All selected or none selected = Overall
    if (selectedLLMs.length === 0 || selectedLLMs.length === 3) {
      return overallScore
    }
    // Single LLM selected
    if (selectedLLMs.length === 1) {
      return llmScores.find(s => s.llm === selectedLLMs[0]) || null
    }
    // Multiple LLMs selected = Calculate average
    return calculateAverageScore(selectedLLMs)
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

  // Visibility Trend Data - Use filtered runs from time filter
  const trendData = availableRuns.length > 0
    ? availableRuns.map(run => ({
        date: new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Visibility: Math.round(run.visibility_pct || 0),
        Sentiment: Math.round(run.sentiment_pct || 0),
        Position: run.avg_position_raw ? Number(run.avg_position_raw.toFixed(1)) : 0,
        Mentions: run.mentions_raw_total || 0
      })).reverse() // Reverse to show oldest to newest
    : filteredScore ? [
        {
          date: 'Current',
          Visibility: Math.round(filteredScore.visibility_pct || 0),
          Sentiment: Math.round(filteredScore.sentiment_pct || 0),
          Position: filteredScore.avg_position_raw ? Number(filteredScore.avg_position_raw.toFixed(1)) : 0,
          Mentions: 'mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total || 0 : (filteredScore as any).mentions_raw || 0
        }
      ] : []

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
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-6 py-4">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="inline-block mb-1">
                <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                  Brand Intelligence
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Action Buttons Group */}
              <div className="flex items-center gap-1 bg-[#0a0a0a] border border-slate-800 p-1">
                <button
                  onClick={handleExportToExcel}
                  disabled={!brand || !overallScore}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export to Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <div className="w-px h-4 bg-slate-800"></div>
                <button
                  onClick={() => router.push(`/brands/${brandId}/results`)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  title="View Results"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Results
                </button>
              </div>

              {/* Primary Action */}
              <button
                onClick={() => router.push(`/brands/${brandId}/prompts`)}
                className="inline-flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Prompts
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-white mb-4" />
                <p className="text-slate-400">Loading dashboard...</p>
              </div>
            </div>
          ) : !overallScore ? (
            <div className="bg-[#171717] shadow-xl border border-slate-800 p-12 text-center">
              <div className="w-20 h-20 bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">No Analysis Yet</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Add prompts to run your first AI-powered analysis and unlock deep insights into your brand's market position across 4 key dimensions.
              </p>
              <button
                onClick={() => router.push(`/brands/${brandId}/prompts`)}
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 font-semibold hover:bg-slate-100 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Prompts & Start
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center justify-end gap-3">
                {/* Time Filter Dropdown (only affects Historical Trends) */}
                <div className="relative" ref={timeFilterRef}>
                  <button
                    onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#171717] border border-slate-800 text-sm font-medium text-slate-300 hover:bg-[#0a0a0a] transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    {getTimeFilterLabel()}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isTimeFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTimeFilterOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-[#171717] border border-slate-800 shadow-lg z-10">
                      <button
                        onClick={() => handleTimeFilterChange('24h')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                          timeFilter === '24h' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                        }`}
                      >
                        Last 24 Hours
                      </button>
                      <button
                        onClick={() => handleTimeFilterChange('7d')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                          timeFilter === '7d' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                        }`}
                      >
                        Last 7 Days
                      </button>
                      <button
                        onClick={() => handleTimeFilterChange('30d')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                          timeFilter === '30d' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                        }`}
                      >
                        Last 30 Days
                      </button>
                      <button
                        onClick={() => handleTimeFilterChange('custom')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                          timeFilter === 'custom' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                        }`}
                      >
                        Custom Range
                      </button>
                    </div>
                  )}
                </div>

                {/* LLM Filter Checkbox Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#171717] border border-slate-800 text-sm font-medium text-slate-300 hover:bg-[#0a0a0a] transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    {selectedLLMs.length === 0 || selectedLLMs.length === 3
                      ? 'Overall'
                      : selectedLLMs.length === 1
                        ? getLLMName(selectedLLMs[0])
                        : `${selectedLLMs.length} LLMs`
                    }
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-[#171717] border border-slate-800 shadow-lg z-10 p-2">
                      <div className="text-xs font-medium text-slate-500 uppercase px-2 py-1 mb-1">
                        Select LLMs
                      </div>

                      {/* ChatGPT Checkbox */}
                      <label className="flex items-center gap-2 px-2 py-2 hover:bg-[#0a0a0a] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLLMs.includes('chatgpt')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLLMs([...selectedLLMs, 'chatgpt'])
                            } else {
                              setSelectedLLMs(selectedLLMs.filter(llm => llm !== 'chatgpt'))
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-300">ChatGPT</span>
                      </label>

                      {/* Gemini Checkbox */}
                      <label className="flex items-center gap-2 px-2 py-2 hover:bg-[#0a0a0a] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLLMs.includes('gemini')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLLMs([...selectedLLMs, 'gemini'])
                            } else {
                              setSelectedLLMs(selectedLLMs.filter(llm => llm !== 'gemini'))
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-300">Gemini</span>
                      </label>

                      {/* Perplexity Checkbox */}
                      <label className="flex items-center gap-2 px-2 py-2 hover:bg-[#0a0a0a] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLLMs.includes('perplexity')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLLMs([...selectedLLMs, 'perplexity'])
                            } else {
                              setSelectedLLMs(selectedLLMs.filter(llm => llm !== 'perplexity'))
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-300">Perplexity</span>
                      </label>

                      <div className="border-t border-slate-800 mt-2 pt-2">
                        <button
                          onClick={() => setSelectedLLMs(['chatgpt', 'gemini', 'perplexity'])}
                          className="w-full text-center px-2 py-1.5 text-xs text-slate-400 hover:bg-[#0a0a0a] rounded"
                        >
                          Select All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Date Picker Modal */}
              {showDatePicker && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                  <div className="bg-[#171717] border border-slate-800 shadow-xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-bold text-white mb-4">Select Custom Date Range</h3>

                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          className="w-full px-3 py-2 bg-[#0a0a0a] border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholderText="Select start date"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-400 mb-2">End Date</label>
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          minDate={startDate ?? undefined}
                          className="w-full px-3 py-2 bg-[#0a0a0a] border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholderText="Select end date"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setShowDatePicker(false)
                          setTimeFilter('24h')
                          setStartDate(null)
                          setEndDate(null)
                        }}
                        className="px-4 py-2 text-sm font-medium text-slate-300 border border-slate-800 hover:bg-[#0a0a0a] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCustomDateApply}
                        disabled={!startDate || !endDate}
                        className="px-4 py-2 text-sm font-medium bg-white text-black hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly View Toggle (only show for 30d filter) */}
              {timeFilter === '30d' && (
                <div className="flex items-center justify-center gap-2 bg-[#171717] border border-slate-800 p-2">
                  <span className="text-xs font-medium text-slate-400">View:</span>
                  <button
                    onClick={() => setMonthlyView('daily')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      monthlyView === 'daily'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#0a0a0a] text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Daily (30 points)
                  </button>
                  <button
                    onClick={() => setMonthlyView('weekly')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      monthlyView === 'weekly'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#0a0a0a] text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Weekly (4 points)
                  </button>
                </div>
              )}

              {/* Key Metrics Overview - Compact Single Row */}
              <div className="bg-[#171717] border border-slate-800 p-2.5 flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Visibility</div>
                  <div className="text-base font-bold text-white">
                    {filteredScore ? Math.round(filteredScore.visibility_pct || 0) : 0}%
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-800"></div>

                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Sentiment</div>
                  <div className="text-base font-bold text-white">
                    {filteredScore ? Math.round(filteredScore.sentiment_pct || 0) : 0}%
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-800"></div>

                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Position</div>
                  <div className="text-base font-bold text-white">
                    {filteredScore && filteredScore.avg_position_raw ? filteredScore.avg_position_raw.toFixed(1) : 'N/A'}
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-800"></div>

                <div className="flex items-center gap-2">
                  <div className="text-[9px] font-medium text-slate-500 uppercase">Mentions</div>
                  <div className="text-base font-bold text-white">
                    {filteredScore ? ('mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : (filteredScore as any).mentions_raw || 0) : 0}
                  </div>
                </div>
              </div>

              {/* Main Content: Left (Trend) + Right (Ranking) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* LEFT: Historical Trends (1/2 width) */}
                <div className="bg-[#171717] shadow-sm border border-slate-800 p-3 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      Historical Trends
                    </h2>
                    {availableRuns.length > 0 && (
                      <span className="text-[9px] text-slate-500">
                        {availableRuns.length} runs ({getTimeFilterLabel()})
                      </span>
                    )}
                  </div>

                  {/* Toggle Buttons */}
                  <div className="flex gap-1.5 mb-3">
                    <button
                      onClick={() => setSelectedChart('trend')}
                      className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                        selectedChart === 'trend'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#0a0a0a] text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-slate-400'
                      }`}
                    >
                      Visibility & Sentiment
                    </button>
                    <button
                      onClick={() => setSelectedChart('metrics')}
                      className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                        selectedChart === 'metrics'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#0a0a0a] text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-slate-400'
                      }`}
                    >
                      Position & Mentions
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">
                    {availableRuns.length > 0
                      ? (selectedChart === 'trend' ? 'Visibility & Sentiment over time' : 'Position & Mentions over time')
                      : 'Run multiple analyses to see trends'}
                  </p>

                  <div className="w-full h-48 flex-1" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {selectedChart === 'trend' ? (
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
                      ) : (
                        <BarChart
                          data={trendData}
                          margin={{ top: 20, right: 15, bottom: 10, left: -10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickLine={{ stroke: '#64748b' }}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickLine={{ stroke: '#64748b' }}
                            label={{ value: 'Position (lower = better)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickLine={{ stroke: '#64748b' }}
                            label={{ value: 'Mentions', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#64748b' } }}
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
                            iconType="rect"
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="Position"
                            fill="#8b5cf6"
                            name="Avg Position"
                            radius={[4, 4, 0, 0]}
                          >
                            <LabelList dataKey="Position" position="top" style={{ fontSize: 10, fill: '#8b5cf6', fontWeight: 600 }} />
                          </Bar>
                          <Bar
                            yAxisId="right"
                            dataKey="Mentions"
                            fill="#10b981"
                            name="Mentions"
                            radius={[4, 4, 0, 0]}
                          >
                            <LabelList dataKey="Mentions" position="top" style={{ fontSize: 10, fill: '#10b981', fontWeight: 600 }} />
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* RIGHT: Industry Ranking (1/2 width) - Vertical Layout */}
                <div className="bg-[#171717] shadow-sm border border-slate-800 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold text-white">Industry Ranking</h2>
                    <p className="text-[9px] text-slate-500">Latest analysis</p>
                  </div>

                  {/* Vertical Cards - Scrollable */}
                  <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '320px' }}>
                    {competitorRankingData.length > 0 ? competitorRankingData.map((item) => (
                      <div
                        key={item.rank}
                        className={`p-2 border ${
                          item.isOwn
                            ? 'bg-[#0a0a0a] border-slate-700'
                            : 'bg-black border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Brand Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-white">#{item.rank}</span>
                          <span className="w-5 h-5 bg-slate-800 flex items-center justify-center text-[9px] font-bold text-white">
                            {item.brand.substring(0, 1).toUpperCase()}
                          </span>
                          <span className="text-xs font-semibold text-white flex-1 truncate">{item.brand}</span>
                        </div>

                        {/* Metrics Grid - 4 columns */}
                        <div className="grid grid-cols-4 gap-2">
                          {/* Position */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Position</div>
                            <div className="text-sm font-semibold text-white">
                              {item.position > 0 ? item.position.toFixed(1) : 'N/A'}
                            </div>
                          </div>

                          {/* Sentiment */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Sentiment</div>
                            <div className="text-sm font-semibold text-white">
                              {item.sentiment}%
                            </div>
                          </div>

                          {/* Visibility */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Visibility</div>
                            <div className="text-sm font-bold text-white">{item.visibility}%</div>
                          </div>

                          {/* Mentions */}
                          <div className="text-left">
                            <div className="text-[8px] text-slate-500 uppercase mb-0.5">Mentions</div>
                            <div className="text-sm font-semibold text-white">{item.mentions}</div>
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
                      className="w-full text-center text-[10px] text-slate-400 hover:text-white font-medium mt-3 pt-2 border-t border-slate-800"
                    >
                      View all competitors
                    </button>
                  )}
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
