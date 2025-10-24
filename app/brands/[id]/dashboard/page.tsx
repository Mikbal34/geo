'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Download,
  ExternalLink,
  Filter,
  MessageSquare,
  Moon,
  Sparkles,
  Sun,
  TrendingUp,
} from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Navigation from '@/components/layout/Navigation'
import { exportDashboardToExcel } from '@/lib/utils/excel-export'
import type { Brand } from '@/types/brand'
import type { LLMRun, LLMProvider, ScoreLLM, ScoreOverall } from '@/types/llm'
import type { Prompt } from '@/types/prompt'

type Theme = 'light' | 'dark'
type TimeFilter = '24h' | '7d' | '30d' | 'custom'
type MonthlyView = 'daily' | 'weekly'

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
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const brandId = params.id

  const [theme, setTheme] = useState<Theme>('light')
  const isDark = theme === 'dark'

  const [brand, setBrand] = useState<Brand | null>(null)
  const [overallScore, setOverallScore] = useState<ScoreOverall | null>(null)
  const [llmScores, setLLMScores] = useState<ScoreLLM[]>([])

  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory | null>(null)
  const [availableRuns, setAvailableRuns] = useState<any[]>([])
  const [llmRuns, setLlmRuns] = useState<LLMRun[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])

  const [competitorScores, setCompetitorScores] = useState<CompetitorScore[]>([])
  const [loadingCompetitors, setLoadingCompetitors] = useState(true)

  const [selectedLLMs, setSelectedLLMs] = useState<LLMProvider[]>(['chatgpt', 'gemini', 'perplexity'])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h')
  const [monthlyView, setMonthlyView] = useState<MonthlyView>('daily')
  const [selectedChart, setSelectedChart] = useState<'trend' | 'metrics'>('trend')

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const [statusError, setStatusError] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  useEffect(() => {
    const storedTheme = localStorage.getItem('auth_theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('auth_theme', theme)
  }, [theme])

  useEffect(() => {
    if (!brandId) return

    fetchBrand()
    fetchScores()
    fetchAnalysisHistory()
  }, [brandId])

  useEffect(() => {
    if (!brandId) return
    fetchCompetitorScores()
  }, [brandId, selectedLLMs])

  useEffect(() => {
    if (!brandId) return

    const fetchPrompts = async () => {
      try {
        const res = await fetch(`/api/prompts/${brandId}`)
        const data = await res.json()
        setPrompts(data.prompts || [])
      } catch (error) {
        console.error('Error fetching prompts:', error)
      }
    }

    fetchPrompts()
  }, [brandId])

  useEffect(() => {
    if (!brandId) return
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

  const fetchScores = async () => {
    try {
      const res = await fetch(`/api/scores-overall/${brandId}`)
      const data = await res.json()
      setOverallScore(data.overall)
      setLLMScores(data.per_llm || [])
    } catch (error) {
      console.error('Error fetching scores:', error)
      setStatusError('Unable to load scores')
    } 
  }

  const fetchCompetitorScores = async () => {
    setLoadingCompetitors(true)
    try {
      const llmParam = selectedLLMs.length === 0 || selectedLLMs.length === 3 ? 'overall' : selectedLLMs[0]
      const res = await fetch(`/api/competitors/${brandId}/scores?llm=${llmParam}`)
      const data = await res.json()
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

  const fetchLLMRunsForAnalyses = async (runs: any[]) => {
    try {
      const runIds = runs.map((run: any) => run.id).filter(Boolean)
      if (!runIds.length) {
        setLlmRuns([])
        return
      }

      const res = await fetch(`/api/llm-runs/${brandId}?analysis_run_ids=${runIds.join(',')}`)
      const data = await res.json()
      setLlmRuns(data.llm_runs || [])
    } catch (error) {
      console.error('Error fetching LLM runs:', error)
      setLlmRuns([])
    }
  }

  const fetchAvailableRuns = async () => {
    try {
      const params = new URLSearchParams()
      params.append('filter', timeFilter)

      if (timeFilter === 'custom' && startDate && endDate) {
        params.append('from', startDate.toISOString())
        params.append('to', endDate.toISOString())
      }

      if (timeFilter === '30d') {
        params.append('view', monthlyView)
      }

      if (selectedLLMs.length === 1) {
        params.append('llm', selectedLLMs[0])
      }

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/analysis-runs/${brandId}${queryString}`)
      const data = await res.json()

      if (data.success) {
        setAvailableRuns(data.runs || [])
        await fetchLLMRunsForAnalyses(data.runs || [])
      }
    } catch (error) {
      console.error('Error fetching analysis runs:', error)
    }
  }

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter)

    if (filter === 'custom') {
      setShowDatePicker(true)
    } else {
      setStartDate(null)
      setEndDate(null)
      setShowDatePicker(false)
    }

    if (filter === '30d') {
      setMonthlyView('daily')
    }
  }

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      fetchAvailableRuns()
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
      selectedLLMs,
    })
  }

  const handleAnalyze = async (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setAnalyzeError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed')
      }
      router.push(`/brands/${brandId}/dashboard`)
    } catch (error) {
      console.error(error)
      setAnalyzeError(error instanceof Error ? error.message : 'Analysis failed unexpectedly')
    }
  }

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case '24h':
        return '24 Hours'
      case '7d':
        return '7 Days'
      case '30d':
        return '1 Month'
      case 'custom':
        if (startDate && endDate) {
          return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`
        }
        return 'Custom'
      default:
        return '24 Hours'
    }
  }

  const filteredRuns = useMemo(() => {
    if (selectedLLMs.length === 0 || selectedLLMs.length === 3) {
      return llmRuns
    }
    return llmRuns.filter((run) => selectedLLMs.includes(run.llm as LLMProvider))
  }, [llmRuns, selectedLLMs])

  const totalResponses = filteredRuns.length
  const totalPrompts = prompts.length

  const promptsWithResponsesCount = useMemo(() => {
    const ids = new Set<string>()
    filteredRuns.forEach((run) => ids.add(run.prompt_id))
    return ids.size
  }, [filteredRuns])

  const averageResponseLength = useMemo(() => {
    if (!filteredRuns.length) return 0
    const totalWords = filteredRuns.reduce((acc, run) => {
      if (!run.response_text) return acc
      const words = run.response_text.trim().split(/\s+/)
      if (words.length === 1 && words[0] === '') return acc
      return acc + words.length
    }, 0)
    return Math.round(totalWords / filteredRuns.length)
  }, [filteredRuns])

  const sentimentBreakdown = useMemo(() => {
    return filteredRuns.reduce(
      (acc, run) => {
        if (run.sentiment === 'positive') {
          acc.positive += 1
        } else if (run.sentiment === 'negative') {
          acc.negative += 1
        } else {
          acc.neutral += 1
        }
        return acc
      },
      { positive: 0, neutral: 0, negative: 0 },
    )
  }, [filteredRuns])

  const positivePct = totalResponses ? Math.round((sentimentBreakdown.positive / totalResponses) * 100) : 0
  const neutralPct = totalResponses ? Math.round((sentimentBreakdown.neutral / totalResponses) * 100) : 0
  const negativePct = totalResponses ? Math.round((sentimentBreakdown.negative / totalResponses) * 100) : 0

  const latestRun = availableRuns.length > 0 ? availableRuns[0] : null
  const previousRun = availableRuns.length > 1 ? availableRuns[1] : null
  const latestRunDate = latestRun?.created_at ?? null

  const visibilityDelta = useMemo(() => {
    if (
      !latestRun ||
      !previousRun ||
      latestRun.visibility_pct === undefined ||
      latestRun.visibility_pct === null ||
      previousRun.visibility_pct === undefined ||
      previousRun.visibility_pct === null
    ) {
      return null
    }
    const delta = latestRun.visibility_pct - previousRun.visibility_pct
    return {
      label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`,
      positive: delta >= 0,
    }
  }, [latestRun, previousRun])

  const sentimentDelta = useMemo(() => {
    if (
      !latestRun ||
      !previousRun ||
      latestRun.sentiment_pct === undefined ||
      latestRun.sentiment_pct === null ||
      previousRun.sentiment_pct === undefined ||
      previousRun.sentiment_pct === null
    ) {
      return null
    }
    const delta = latestRun.sentiment_pct - previousRun.sentiment_pct
    return {
      label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`,
      positive: delta >= 0,
    }
  }, [latestRun, previousRun])

  const positionDelta = useMemo(() => {
    if (
      !latestRun ||
      !previousRun ||
      latestRun.avg_position_raw === undefined ||
      latestRun.avg_position_raw === null ||
      previousRun.avg_position_raw === undefined ||
      previousRun.avg_position_raw === null
    ) {
      return null
    }
    const delta = latestRun.avg_position_raw - previousRun.avg_position_raw
    return {
      label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`,
      positive: delta <= 0,
    }
  }, [latestRun, previousRun])

  const mentionsDelta = useMemo(() => {
    if (
      !latestRun ||
      !previousRun ||
      latestRun.mentions_raw_total === undefined ||
      latestRun.mentions_raw_total === null ||
      previousRun.mentions_raw_total === undefined ||
      previousRun.mentions_raw_total === null
    ) {
      return null
    }
    const delta = latestRun.mentions_raw_total - previousRun.mentions_raw_total
    return {
      label: `${delta >= 0 ? '+' : ''}${delta}`,
      positive: delta >= 0,
    }
  }, [latestRun, previousRun])

  const getLLMColor = (llm: string) => {
    switch (llm) {
      case 'chatgpt':
        return { bg: 'from-emerald-500 to-teal-400', fill: '#10b981' }
      case 'gemini':
        return { bg: 'from-blue-500 to-sky-400', fill: '#3b82f6' }
      case 'perplexity':
        return { bg: 'from-purple-500 to-pink-500', fill: '#a855f7' }
      default:
        return { bg: 'from-slate-500 to-slate-600', fill: '#64748b' }
    }
  }

  const getLLMName = (llm: string) => {
    switch (llm) {
      case 'chatgpt':
        return 'ChatGPT'
      case 'gemini':
        return 'Gemini'
      case 'perplexity':
        return 'Perplexity'
      default:
        return llm
    }
  }

  const calculateAverageScore = (llms: LLMProvider[]): ScoreOverall | ScoreLLM | null => {
    if (llms.length === 0) return overallScore
    if (llms.length === 1) return llmScores.find((s) => s.llm === llms[0]) || null

    const selectedScores = llmScores.filter((s) => llms.includes(s.llm as LLMProvider))
    if (selectedScores.length === 0) return null

    const visibility_pct = selectedScores.reduce((sum, s) => sum + (s.visibility_pct || 0), 0) / selectedScores.length
    const sentiment_pct = selectedScores.reduce((sum, s) => sum + (s.sentiment_pct || 0), 0) / selectedScores.length

    const positions = selectedScores.map((s) => s.avg_position_raw).filter((p): p is number => p !== null)
    const avg_position_raw = positions.length > 0 ? positions.reduce((sum, p) => sum + p, 0) / positions.length : null

    const mentions_raw = selectedScores.reduce((sum, s) => sum + (s.mentions_raw || 0), 0)

    return {
      visibility_pct,
      sentiment_pct,
      avg_position_raw,
      mentions_raw,
      llm: 'custom' as any,
    } as any
  }

  const getFilteredScore = () => {
    if (selectedLLMs.length === 0 || selectedLLMs.length === 3) {
      return overallScore
    }
    if (selectedLLMs.length === 1) {
      return llmScores.find((s) => s.llm === selectedLLMs[0]) || null
    }
    return calculateAverageScore(selectedLLMs)
  }

  const filteredScore = getFilteredScore();

  const percentageMetrics = filteredScore
    ? [
        {
          category: 'Visibility',
          score: Math.round(filteredScore.visibility_pct || 0),
          description: 'Brand presence %',
        },
        {
          category: 'Sentiment',
          score: Math.round(filteredScore.sentiment_pct || 0),
          description: 'Positive sentiment %',
        },
      ]
    : [];

  const numericalMetrics = filteredScore
    ? [
        {
          category: 'Avg Position',
          value: filteredScore.avg_position_raw || 0,
          description: 'Average ranking (1-10)',
        },
        {
          category: 'Mentions',
          value: 'mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : (filteredScore as any).mentions_raw || 0,
          description: 'Total brand mentions',
        },
      ]
    : [];

  const trendData =
    availableRuns.length > 0
      ? availableRuns
          .map((run) => ({
            date: new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            Visibility: Math.round(run.visibility_pct || 0),
            Sentiment: Math.round(run.sentiment_pct || 0),
            Position: run.avg_position_raw ? Number(run.avg_position_raw.toFixed(1)) : 0,
            Mentions: run.mentions_raw_total || 0,
          }))
          .reverse()
      : filteredScore
        ? [
            {
              date: 'Current',
              Visibility: Math.round(filteredScore.visibility_pct || 0),
              Sentiment: Math.round(filteredScore.sentiment_pct || 0),
              Position: filteredScore.avg_position_raw ? Number(filteredScore.avg_position_raw.toFixed(1)) : 0,
              Mentions: 'mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total || 0 : (filteredScore as any).mentions_raw || 0,
            },
          ]
        : [];

  const competitorRankingData =
    filteredScore && competitorScores.length > 0
      ? (() => {
          const ownBrand = {
            rank: 1,
            brand: brand?.brand_name || 'Your Brand',
            visibility: Math.round(filteredScore.visibility_pct || 0),
            sentiment: Math.round(filteredScore.sentiment_pct || 0),
            position: filteredScore.avg_position_raw || 0,
            mentions: 'mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : 'mentions_raw' in filteredScore ? filteredScore.mentions_raw : 0,
            isOwn: true,
          }

          const competitors = competitorScores.map((comp, idx) => ({
            rank: idx + 2,
            brand: comp.competitor_name,
            visibility: comp.visibility_pct || 0,
            sentiment: comp.sentiment_pct || 0,
            position: comp.avg_position || 0,
            mentions: comp.mentions_total || 0,
            isOwn: false,
          }))

          const combined = [ownBrand, ...competitors];
          const sorted = combined.sort((a, b) => b.visibility - a.visibility);
          return sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
        })()
      : [];

  const llmPercentageData = llmScores.map((score) => ({
    llm: getLLMName(score.llm),
    'Visibility %': Math.round(score.visibility_pct || 0),
    'Sentiment %': Math.round(score.sentiment_pct || 0),
  }));

  const llmNumericalData = llmScores.map((score) => ({
    llm: getLLMName(score.llm),
    'Avg Position': score.avg_position_raw || 0,
    Mentions: score.mentions_raw || 0,
  }));

  const isDarkChartStroke = isDark ? '#475569' : '#cbd5f5';
  const axisTickColor = isDark ? '#cbd5f5' : '#475569';
  const tooltipWrapperStyle = {
    backgroundColor: isDark ? '#111827' : '#ffffff',
    borderRadius: '12px',
    border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
    color: isDark ? '#f8fafc' : '#1f2937',
  } as const;

  const containerClass = [
    'relative min-h-screen px-4 pb-16 pt-12 transition-colors',
    isDark ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
  ].join(' ');

  const toggleButtonClass = [
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2',
    isDark
      ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/20 focus:ring-white/30 focus:ring-offset-0'
      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-800 shadow-sm focus:ring-slate-200 focus:ring-offset-2 focus:ring-offset-white',
  ].join(' ');

  const backButtonClass = [
    'inline-flex items-center gap-2 text-sm font-medium transition-colors',
    isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900',
  ].join(' ');

  const panelClass = [
    'rounded-3xl border p-6 shadow-lg transition-colors sm:p-8',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl shadow-black/30' : 'border-slate-200 bg-white shadow-slate-200/70',
  ].join(' ');

  const subPanelClass = [
    'rounded-2xl border p-4 transition-colors',
    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
  ].join(' ');

  const softPanelClass = [
    'rounded-2xl border p-4 transition-colors',
    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white',
  ].join(' ');

  const mutedTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const strongTextClass = isDark ? 'text-white' : 'text-slate-900';
  const chipActiveClass = isDark ? 'border border-white/20 bg-slate-900 text-white' : 'border border-slate-900 bg-slate-900 text-white';
  const chipClass = isDark ? 'border border-white/10 bg-white/10 text-slate-200' : 'border border-slate-200 bg-white text-slate-600';
  const dividerClass = isDark ? 'border-white/10' : 'border-slate-200';
  const llmOptions: Array<{ value: LLMProvider; label: string }> = [
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'perplexity', label: 'Perplexity' },
  ];
  const timeOptions: Array<{ value: TimeFilter; label: string }> = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '1 Month' },
    { value: 'custom', label: 'Custom range' },
  ];
  const isAllLLMsSelected = selectedLLMs.length === 0 || selectedLLMs.length === llmOptions.length;

  return (
    <>
      <Navigation theme={theme} />
      <main className={containerClass}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => router.back()} className={backButtonClass}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => router.push(`/brands/${brandId}/results`)}
                className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-90`}
              >
                Prompts
              </button>
              <button
                type="button"
                onClick={() => router.push(`/brands/${brandId}/settings`)}
                className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-90`}
              >
                Settings
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportToExcel}
                disabled={!brand || !filteredScore}
                className={[
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                  isDark ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-900' : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
                ].join(' ')}
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              {brand?.domain && (
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isDark ? 'border-white/10 text-slate-100 hover:bg-white/10 focus:ring-white/30 focus:ring-offset-0' : 'border-slate-200 text-slate-600 hover:bg-slate-100 focus:ring-slate-200 focus:ring-offset-white',
                  ].join(' ')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit site
                </a>
              )}
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                className={toggleButtonClass}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                aria-pressed={isDark}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          </div>

          <div className={panelClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <span
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
                    isDark ? 'border-white/10 bg-white/10 text-slate-200' : 'border-slate-200 bg-white text-slate-600 shadow-sm',
                  ].join(' ')}
                >
                  Brand intelligence
                </span>
                <div>
                  <h1 className={`text-3xl font-semibold ${strongTextClass}`}>{brand?.brand_name || 'Dashboard'}</h1>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    Consolidated AI visibility across prompts, competitor signals, and historical performance.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${chipClass}`}>
                    <Filter className="h-3.5 w-3.5" />
                    {selectedLLMs.length === 0 || selectedLLMs.length === 3 ? 'All LLMs' : selectedLLMs.map(getLLMName).join(', ')}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${chipClass}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    {getTimeFilterLabel()}
                  </span>
                  {analysisHistory?.total_runs ? (
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${chipClass}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      {analysisHistory.total_runs} runs completed
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={`mt-6 grid gap-4 divide-y sm:grid-cols-5 sm:divide-y-0 sm:divide-x ${dividerClass}`}>
              <div className="space-y-1 px-0 sm:px-4">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Brand</p>
                <p className={`text-base font-semibold ${strongTextClass}`}>{brand?.brand_name || '—'}</p>
                <p className={`text-xs ${mutedTextClass}`}>{brand?.domain}</p>
              </div>
              <div className="space-y-1 px-0 sm:px-4">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Visibility</p>
                <p className={`text-base font-semibold ${strongTextClass}`}>
                  {filteredScore ? Math.round(filteredScore.visibility_pct || 0) : 0}%
                </p>
                <p className={`text-xs ${mutedTextClass}`}>Across selected LLMs</p>
              </div>
              <div className="space-y-1 px-0 sm:px-4">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Sentiment</p>
                <p className={`text-base font-semibold ${strongTextClass}`}>
                  {filteredScore ? Math.round(filteredScore.sentiment_pct || 0) : 0}%
                </p>
                <p className={`text-xs ${mutedTextClass}`}>Positive mention share</p>
              </div>
              <div className="space-y-1 px-0 sm:px-4">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Avg position</p>
                <p className={`text-base font-semibold ${strongTextClass}`}>
                  {filteredScore?.avg_position_raw ? filteredScore.avg_position_raw.toFixed(1) : '—'}
                </p>
                <p className={`text-xs ${mutedTextClass}`}>SERP rank (lower better)</p>
              </div>
              <div className="space-y-1 px-0 sm:px-4">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Mentions</p>
                <p className={`text-base font-semibold ${strongTextClass}`}>
                  {filteredScore ? ('mentions_raw_total' in filteredScore ? filteredScore.mentions_raw_total : (filteredScore as any).mentions_raw || 0) : 0}
                </p>
                <p className={`text-xs ${mutedTextClass}`}>Last run volume</p>
              </div>
          </div>
        </div>

        <div className={`${panelClass} space-y-6`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                  Run explorer
                </span>
                <h2 className={`text-3xl font-semibold ${strongTextClass}`}>Analysis results</h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Track how visibility, sentiment, ranking, and mentions evolve with your current filters.
                </p>
              </div>
            </div>
            <div className={`${subPanelClass} w-full space-y-2 sm:max-w-xs`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Latest completed run</p>
              <p className={`text-base font-semibold ${strongTextClass}`}>
                {latestRunDate ? new Date(latestRunDate).toLocaleString() : 'Awaiting analyses'}
              </p>
              <p className={`text-xs ${mutedTextClass}`}>Metrics reflect the selected time window and model mix.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`${subPanelClass} space-y-2`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Visibility</p>
                {visibilityDelta ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      visibilityDelta.positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {visibilityDelta.label}
                  </span>
                ) : (
                  <span className={`text-[10px] ${mutedTextClass}`}>—</span>
                )}
              </div>
              <p className={`text-2xl font-semibold ${strongTextClass}`}>
                {latestRun?.visibility_pct !== undefined && latestRun?.visibility_pct !== null
                  ? `${Math.round(latestRun.visibility_pct)}%`
                  : '—'}
              </p>
              <p className={`text-xs ${mutedTextClass}`}>Share of surfaced results mentioning your brand.</p>
            </div>

            <div className={`${subPanelClass} space-y-2`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Sentiment</p>
                {sentimentDelta ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      sentimentDelta.positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {sentimentDelta.label}
                  </span>
                ) : (
                  <span className={`text-[10px] ${mutedTextClass}`}>—</span>
                )}
              </div>
              <p className={`text-2xl font-semibold ${strongTextClass}`}>
                {latestRun?.sentiment_pct !== undefined && latestRun?.sentiment_pct !== null
                  ? `${Math.round(latestRun.sentiment_pct)}%`
                  : '—'}
              </p>
              <p className={`text-xs ${mutedTextClass}`}>Positive tone within retrieved answers.</p>
            </div>

            <div className={`${subPanelClass} space-y-2`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Avg rank</p>
                {positionDelta ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      positionDelta.positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {positionDelta.label}
                  </span>
                ) : (
                  <span className={`text-[10px] ${mutedTextClass}`}>—</span>
                )}
              </div>
              <p className={`text-2xl font-semibold ${strongTextClass}`}>
                {latestRun?.avg_position_raw !== undefined && latestRun?.avg_position_raw !== null
                  ? `#${latestRun.avg_position_raw.toFixed(1)}`
                  : '—'}
              </p>
              <p className={`text-xs ${mutedTextClass}`}>Lower is better. Average ranking across captured mentions.</p>
            </div>

            <div className={`${subPanelClass} space-y-2`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Mentions</p>
                {mentionsDelta ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      mentionsDelta.positive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {mentionsDelta.label}
                  </span>
                ) : (
                  <span className={`text-[10px] ${mutedTextClass}`}>—</span>
                )}
              </div>
              <p className={`text-2xl font-semibold ${strongTextClass}`}>
                {latestRun?.mentions_raw_total !== undefined && latestRun?.mentions_raw_total !== null
                  ? latestRun.mentions_raw_total.toLocaleString()
                  : '—'}
              </p>
              <p className={`text-xs ${mutedTextClass}`}>Raw brand mentions counted in the latest run.</p>
            </div>
          </div>
        </div>

        <div className={`${panelClass} space-y-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-semibold ${strongTextClass}`}>Quick insights</h2>
              <p className={`text-xs ${mutedTextClass}`}>Snapshot of engagement across the selected filters.</p>
            </div>
            <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide`}>
              {totalResponses} responses
            </span>
          </div>

          <div className="space-y-3">
            <div className={`${subPanelClass} flex items-start gap-3`}>
              <Sparkles className="h-5 w-5 text-amber-400" />
              <div>
                <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Prompts engaged</p>
                <p className={`text-sm font-semibold ${strongTextClass}`}>
                  {promptsWithResponsesCount} / {totalPrompts || '—'}
                </p>
                <p className={`text-xs ${mutedTextClass}`}>Prompts with at least one response in this window.</p>
              </div>
            </div>

            <div className={`${subPanelClass} flex items-start gap-3`}>
              <MessageSquare className="h-5 w-5 text-sky-400" />
              <div>
                <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Avg response length</p>
                <p className={`text-sm font-semibold ${strongTextClass}`}>
                  {averageResponseLength ? `${averageResponseLength} words` : '—'}
                </p>
                <p className={`text-xs ${mutedTextClass}`}>Textual depth across captured answers.</p>
              </div>
            </div>

            <div className={`${subPanelClass} flex items-start gap-3`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Sentiment mix</p>
                {totalResponses ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-emerald-500/10 py-2">
                      <p className="text-sm font-semibold text-emerald-400">{positivePct}%</p>
                      <p className={`text-[11px] ${mutedTextClass}`}>Positive</p>
                    </div>
                    <div className="rounded-xl bg-slate-500/10 py-2">
                      <p className={`text-sm font-semibold ${mutedTextClass}`}>{neutralPct}%</p>
                      <p className={`text-[11px] ${mutedTextClass}`}>Neutral</p>
                    </div>
                    <div className="rounded-xl bg-rose-500/10 py-2">
                      <p className="text-sm font-semibold text-rose-400">{negativePct}%</p>
                      <p className={`text-[11px] ${mutedTextClass}`}>Negative</p>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs ${mutedTextClass}`}>Run analyses to populate sentiment mix.</p>
                )}
              </div>
            </div>
          </div>
        </div>

          {statusError && (
            <div className={panelClass}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className={`text-sm font-semibold ${strongTextClass}`}>Score data unavailable</p>
                  <p className={`text-sm ${mutedTextClass}`}>{statusError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-10">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={`${softPanelClass} space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className={`text-sm font-semibold ${strongTextClass}`}>LLM selection</h2>
                    <p className={`text-xs ${mutedTextClass}`}>Choose which models contribute to combined metrics.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLLMs([])}
                    className={`${isAllLLMsSelected ? chipActiveClass : chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                    disabled={isAllLLMsSelected}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    All models
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {llmOptions.map((option) => {
                    const active = isAllLLMsSelected || selectedLLMs.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedLLMs((prev) => {
                            const prevAll = prev.length === 0 || prev.length === llmOptions.length
                            if (prevAll) {
                              return [option.value]
                            }
                            if (prev.includes(option.value)) {
                              const next = prev.filter((item) => item !== option.value)
                              return next.length ? next : []
                            }
                            return [...prev, option.value]
                          })
                        }}
                        className={`${active ? chipActiveClass : chipClass} inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${getLLMColor(option.value).bg}`} />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className={`${softPanelClass} space-y-4`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className={`text-sm font-semibold ${strongTextClass}`}>Time window</h2>
                    <p className={`text-xs ${mutedTextClass}`}>Adjust the horizon for historical charts.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map((option) => {
                    const active = timeFilter === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleTimeFilterChange(option.value)}
                        className={`${active ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : (isDark ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:text-slate-900')} rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                {timeFilter === '30d' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-medium ${mutedTextClass}`}>View granularity:</span>
                    <div className="inline-flex rounded-full border px-1 py-1">
                      <button
                        type="button"
                        onClick={() => setMonthlyView('daily')}
                        className={`${monthlyView === 'daily' ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : (isDark ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-900')} rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setMonthlyView('weekly')}
                        className={`${monthlyView === 'weekly' ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : (isDark ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-900')} rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>
                )}
                {timeFilter === 'custom' && showDatePicker && (
                  <div className={`rounded-2xl border border-dashed ${dividerClass} bg-transparent p-4 space-y-4`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={`mb-2 block text-xs font-medium ${mutedTextClass}`}>Start date</label>
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholderText="Select start"
                        />
                      </div>
                      <div>
                        <label className={`mb-2 block text-xs font-medium ${mutedTextClass}`}>End date</label>
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          minDate={startDate ?? undefined}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                          placeholderText="Select end"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleTimeFilterChange('24h')}
                        className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCustomDateApply}
                        disabled={!startDate || !endDate}
                        className={`${chipActiveClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={panelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className={`flex items-center gap-2 text-lg font-semibold ${strongTextClass}`}>
                    <TrendingUp className="h-4 w-4" />
                    Historical trends
                  </h2>
                  <p className={`text-sm ${mutedTextClass}`}>{availableRuns.length} runs in {getTimeFilterLabel()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChart('trend')}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                      selectedChart === 'trend'
                        ? isDark
                          ? 'bg-white text-black'
                          : 'bg-slate-900 text-white'
                        : isDark
                          ? 'bg-white/10 text-slate-200 hover:bg-white/15'
                          : 'bg-white text-slate-600 hover:text-slate-900',
                    ].join(' ')}
                  >
                    Visibility & sentiment
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChart('metrics')}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                      selectedChart === 'metrics'
                        ? isDark
                          ? 'bg-white text-black'
                          : 'bg-slate-900 text-white'
                        : isDark
                          ? 'bg-white/10 text-slate-200 hover:bg-white/15'
                          : 'bg-white text-slate-600 hover:text-slate-900',
                    ].join(' ')}
                  >
                    Position & mentions
                  </button>
                </div>
              </div>

              <div className="mt-6 h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChart === 'trend' ? (
                    <LineChart data={trendData} margin={{ top: 12, right: 24, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkChartStroke} />
                      <XAxis tick={{ fill: axisTickColor, fontSize: 11 }} dataKey="date" />
                      <YAxis yAxisId="left" tick={{ fill: axisTickColor, fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: axisTickColor, fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip wrapperStyle={tooltipWrapperStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="Visibility" stroke="#6366f1" strokeWidth={2.4} dot={false} activeDot={{ r: 5 }} yAxisId="right" />
                      <Line type="monotone" dataKey="Sentiment" stroke="#22d3ee" strokeWidth={2.2} dot={false} activeDot={{ r: 5 }} yAxisId="right" />
                    </LineChart>
                  ) : (
                    <BarChart data={trendData} margin={{ top: 12, right: 24, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkChartStroke} />
                      <XAxis tick={{ fill: axisTickColor, fontSize: 11 }} dataKey="date" />
                      <YAxis yAxisId="left" tick={{ fill: axisTickColor, fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: axisTickColor, fontSize: 11 }} />
                      <Tooltip wrapperStyle={tooltipWrapperStyle} />
                      <Legend />
                      <Bar dataKey="Position" fill="#8b5cf6" yAxisId="left" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="Position" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#8b5cf6' }} />
                      </Bar>
                      <Bar dataKey="Mentions" fill="#10b981" yAxisId="right" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="Mentions" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#10b981' }} />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className={`text-lg font-semibold ${strongTextClass}`}>LLM performance comparison</h2>
                  <p className={`text-sm ${mutedTextClass}`}>Visibility, sentiment, ranking, and mentions by AI model.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className={subPanelClass}>
                  <h3 className={`text-sm font-semibold ${strongTextClass}`}>Visibility & sentiment (%)</h3>
                  <div className="mt-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={llmPercentageData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkChartStroke} />
                        <XAxis type="number" tick={{ fill: axisTickColor }} />
                        <YAxis dataKey="llm" type="category" tick={{ fill: axisTickColor }} />
                        <Tooltip wrapperStyle={tooltipWrapperStyle} />
                        <Legend />
                        <Bar dataKey="Visibility %" fill="#6366f1" radius={[0, 10, 10, 0]} />
                        <Bar dataKey="Sentiment %" fill="#14b8a6" radius={[0, 10, 10, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className={subPanelClass}>
                  <h3 className={`text-sm font-semibold ${strongTextClass}`}>Position & mentions</h3>
                  <div className="mt-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={llmNumericalData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkChartStroke} />
                        <XAxis type="number" tick={{ fill: axisTickColor }} />
                        <YAxis dataKey="llm" type="category" tick={{ fill: axisTickColor }} />
                        <Tooltip wrapperStyle={tooltipWrapperStyle} />
                        <Legend />
                        <Bar dataKey="Avg Position" fill="#8b5cf6" radius={[0, 10, 10, 0]} />
                        <Bar dataKey="Mentions" fill="#10b981" radius={[0, 10, 10, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className={panelClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className={`text-lg font-semibold ${strongTextClass}`}>Industry ranking</h2>
                      <p className={`text-sm ${mutedTextClass}`}>Latest comparison between your brand and tracked competitors.</p>
                    </div>
                    {competitorRankingData.length > 0 && (
                      <button
                        type="button"
                        onClick={() => router.push(`/brands/${brandId}/competitors`)}
                        className={`${chipClass} inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors hover:opacity-90`}
                      >
                        Manage list
                      </button>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {loadingCompetitors ? (
                      <div className="flex h-32 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-slate-400" />
                      </div>
                    ) : competitorRankingData.length === 0 ? (
                      <p className={`text-center text-sm ${mutedTextClass}`}>No competitor data yet. Add competitors after your next analysis.</p>
                    ) : (
                      competitorRankingData.map((item) => {
                        const emphasisClass = item.isOwn
                          ? (isDark ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-emerald-200 bg-emerald-50')
                          : (isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')
                        return (
                          <div
                            key={item.rank}
                            className={`rounded-2xl border px-4 py-3 transition-colors shadow-sm ${emphasisClass}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.isOwn ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'} text-sm font-semibold`}>
                                  {item.brand.substring(0, 1).toUpperCase()}
                                </span>
                                <div>
                                  <p className={`text-sm font-semibold ${strongTextClass}`}>{item.brand}</p>
                                  <p className={`text-xs ${mutedTextClass}`}>Rank #{item.rank}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs ${mutedTextClass}`}>Visibility</p>
                                <p className="text-sm font-semibold text-emerald-400">{item.visibility}%</p>
                              </div>
                            </div>
                            <div className={`mt-3 grid gap-3 sm:grid-cols-4 text-xs ${mutedTextClass}`}>
                              <div>
                                <p className="uppercase tracking-wide">Sentiment</p>
                                <p className={`${strongTextClass} font-semibold`}>{item.sentiment}%</p>
                              </div>
                              <div>
                                <p className="uppercase tracking-wide">Position</p>
                                <p className={`${strongTextClass} font-semibold`}>{item.position > 0 ? item.position.toFixed(1) : '—'}</p>
                              </div>
                              <div>
                                <p className="uppercase tracking-wide">Mentions</p>
                                <p className={`${strongTextClass} font-semibold`}>{item.mentions}</p>
                              </div>
                              <div>
                                <p className="uppercase tracking-wide">Status</p>
                                <p className={`${strongTextClass} font-semibold`}>{item.isOwn ? 'Your brand' : 'Competitor'}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className={panelClass}>
                  <h2 className={`text-lg font-semibold ${strongTextClass}`}>Score breakdown</h2>
                  <div className="mt-4 grid gap-3">
                    {percentageMetrics.map((metric) => (
                      <div key={metric.category} className={subPanelClass}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${strongTextClass}`}>{metric.category}</p>
                            <p className={`text-xs ${mutedTextClass}`}>{metric.description}</p>
                          </div>
                          <span className="text-xl font-semibold text-emerald-400">{metric.score}%</span>
                        </div>
                      </div>
                    ))}
                    {numericalMetrics.map((metric) => (
                      <div key={metric.category} className={subPanelClass}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${strongTextClass}`}>{metric.category}</p>
                            <p className={`text-xs ${mutedTextClass}`}>{metric.description}</p>
                          </div>
                          <span className="text-xl font-semibold text-indigo-400">
                            {typeof metric.value === 'number' ? metric.value : metric.value || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!filteredScore && (
                      <p className={`text-center text-sm ${mutedTextClass}`}>Run at least one analysis to populate metrics.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {analyzeError && (
            <div className={panelClass}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className={`text-sm font-semibold ${strongTextClass}`}>Analysis error</p>
                  <p className={`text-sm ${mutedTextClass}`}>{analyzeError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${strongTextClass}`}>Need fresher numbers?</span>
              <span className={`text-sm ${mutedTextClass}`}>Trigger a new run to refresh all panels.</span>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              className={[
                'group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                isDark ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-900' : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
              ].join(' ')}
            >
              <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
              Run new analysis
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
