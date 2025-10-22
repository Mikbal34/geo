'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  Activity,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Filter,
  MessageSquare,
  Minus,
  Moon,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import Navigation from '@/components/layout/Navigation'
import type { LLMRun, LLMProvider } from '@/types/llm'
import type { Prompt } from '@/types/prompt'

type TimeFilter = '24h' | '7d' | '30d' | 'custom'
type MonthlyView = 'daily' | 'weekly'
type Theme = 'light' | 'dark'

const LLM_OPTIONS: Array<{ value: LLMProvider; label: string }> = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'perplexity', label: 'Perplexity' },
]

const TIME_OPTIONS: Array<{ value: TimeFilter; label: string }> = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '1 Month' },
  { value: 'custom', label: 'Custom range' },
]

export default function AnalysisResultsPage() {
  const router = useRouter()
  const params = useParams()
  const brandId = params.id as string

  const [theme, setTheme] = useState<Theme>('light')
  const isDark = theme === 'dark'

  const [llmRuns, setLlmRuns] = useState<LLMRun[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [availableRuns, setAvailableRuns] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [selectedLLMs, setSelectedLLMs] = useState<LLMProvider[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h')
  const [monthlyView, setMonthlyView] = useState<MonthlyView>('daily')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [customRangeApplied, setCustomRangeApplied] = useState(false)
  const [openPrompts, setOpenPrompts] = useState<Set<string>>(new Set())

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
    const fetchPrompts = async () => {
      try {
        const res = await fetch(`/api/prompts/${brandId}`)
        const data = await res.json()
        setPrompts(data.prompts || [])
      } catch (error) {
        console.error('Error fetching prompts:', error)
      }
    }

    if (brandId) {
      fetchPrompts()
    }
  }, [brandId])

  const fetchLLMRunsForAnalyses = async (runs: any[]) => {
    try {
      setLoading(true)
      const runIds = runs.map((run) => run.id).filter(Boolean)

      if (!runIds.length) {
        setLlmRuns([])
        setLoading(false)
        return
      }

      const res = await fetch(`/api/llm-runs/${brandId}?analysis_run_ids=${runIds.join(',')}`)
      const data = await res.json()
      setLlmRuns(data.llm_runs || [])
    } catch (error) {
      console.error('Error fetching LLM runs:', error)
      setLlmRuns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchRuns = async () => {
      if (!brandId) return
      if (timeFilter === 'custom' && (!customRangeApplied || !startDate || !endDate)) {
        return
      }

      try {
        const urlParams = new URLSearchParams()
        urlParams.append('filter', timeFilter)

        if (timeFilter === 'custom' && startDate && endDate) {
          urlParams.append('from', startDate.toISOString())
          urlParams.append('to', endDate.toISOString())
        }

        if (timeFilter === '30d') {
          urlParams.append('view', monthlyView)
        }

        if (selectedLLMs.length === 1) {
          urlParams.append('llm', selectedLLMs[0])
        }

        const queryString = urlParams.toString() ? `?${urlParams.toString()}` : ''
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

    fetchRuns()
  }, [brandId, timeFilter, selectedLLMs, monthlyView, startDate, endDate, customRangeApplied])

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter)
    setStartDate(null)
    setEndDate(null)
    setCustomRangeApplied(false)

    if (filter === '30d') {
      setMonthlyView('daily')
    }
  }

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      setCustomRangeApplied(true)
    }
  }

  useEffect(() => {
    if (timeFilter === 'custom') {
      setCustomRangeApplied(false)
    }
  }, [startDate, endDate, timeFilter])

  const togglePrompt = (key: string) => {
    setOpenPrompts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const filteredRuns = useMemo(() => {
    if (selectedLLMs.length === 0 || selectedLLMs.length === LLM_OPTIONS.length) {
      return llmRuns
    }
    return llmRuns.filter((run) => selectedLLMs.includes(run.llm as LLMProvider))
  }, [llmRuns, selectedLLMs])

  const runsByAnalysis = useMemo(() => {
    return availableRuns
      .map((analysisRun) => {
        const runsByPrompt = prompts
          .map((prompt) => ({
            prompt,
            runs: filteredRuns.filter(
              (run) => run.analysis_run_id === analysisRun.id && run.prompt_id === prompt.id,
            ),
          }))
          .filter((group) => group.runs.length > 0)

        return {
          analysisRun,
          runsByPrompt,
        }
      })
      .filter((group) => group.runsByPrompt.length > 0)
  }, [availableRuns, prompts, filteredRuns])

  const totalAnalyses = runsByAnalysis.length
  const totalResponses = filteredRuns.length
  const totalPrompts = prompts.length

  const latestRun = availableRuns.length > 0 ? availableRuns[0] : null
  const previousRun = availableRuns.length > 1 ? availableRuns[1] : null
  const latestRunDate = latestRun?.created_at

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

  const promptsWithResponses = useMemo(() => {
    const ids = new Set<string>()
    filteredRuns.forEach((run) => ids.add(run.prompt_id))
    return ids
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

  const llmBreakdown = useMemo(() => {
    const counts: Record<LLMProvider, number> = {
      chatgpt: 0,
      gemini: 0,
      perplexity: 0,
    }
    filteredRuns.forEach((run) => {
      counts[run.llm] += 1
    })
    const entries = Object.entries(counts) as Array<[LLMProvider, number]>
    entries.sort((a, b) => b[1] - a[1])
    return entries
  }, [filteredRuns])

  const topLLMEntry = llmBreakdown[0]
  const positivePct = totalResponses ? Math.round((sentimentBreakdown.positive / totalResponses) * 100) : 0
  const neutralPct = totalResponses ? Math.round((sentimentBreakdown.neutral / totalResponses) * 100) : 0
  const negativePct = totalResponses ? Math.round((sentimentBreakdown.negative / totalResponses) * 100) : 0

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

  const containerClass = [
    'relative min-h-screen px-4 pb-16 pt-12 transition-colors',
    isDark
      ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900'
      : 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
  ].join(' ')

  const panelClass = [
    'rounded-3xl border p-6 shadow-lg transition-colors sm:p-8',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl shadow-black/30' : 'border-slate-200 bg-white shadow-slate-200/70',
  ].join(' ')

  const subPanelClass = [
    'rounded-2xl border p-4 transition-colors',
    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
  ].join(' ')

  const chipActiveClass = isDark
    ? 'border border-white/20 bg-slate-900 text-white'
    : 'border border-slate-900 bg-slate-900 text-white'
  const chipClass = isDark
    ? 'border border-white/10 bg-white/10 text-slate-200'
    : 'border border-slate-200 bg-white text-slate-600'
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-slate-500'
  const strongTextClass = isDark ? 'text-white' : 'text-slate-900'
  const dividerClass = isDark ? 'border-white/10' : 'border-slate-200'
  const bodyTextClass = isDark ? 'text-slate-200' : 'text-slate-700'

  const isAllLLMsSelected = selectedLLMs.length === 0 || selectedLLMs.length === LLM_OPTIONS.length

  if (loading && !availableRuns.length) {
    return (
      <>
        <Navigation theme={theme} />
        <div className={containerClass}>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div
              className={`h-10 w-10 animate-spin rounded-full border-4 ${
                isDark ? 'border-white/20 border-t-white' : 'border-slate-300 border-t-slate-900'
              }`}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation theme={theme} />
      <main className={containerClass}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/brands/${brandId}/dashboard`)}
                className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-90`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push(`/brands/${brandId}/settings`)}
                className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-90`}
              >
                Settings
              </button>
            </div>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          <div className={`${panelClass} space-y-6`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                  <Activity className="h-5 w-5" />
                </span>
                <div className="space-y-2">
                  <span
                    className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}
                  >
                    Run explorer
                  </span>
                  <h1 className={`text-3xl font-semibold ${strongTextClass}`}>Analysis results</h1>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Track how each LLM responded for your prompts, compare sentiment trends, and audit source references.
                  </p>
                </div>
              </div>
              <div className={`${subPanelClass} w-full space-y-2 sm:max-w-xs`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Latest completed run</p>
                <p className={`text-base font-semibold ${strongTextClass}`}>
                  {latestRunDate ? new Date(latestRunDate).toLocaleString() : 'Awaiting analyses'}
                </p>
                <p className={`text-xs ${mutedTextClass}`}>Filters reflect this time window and model selection.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`${subPanelClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Visibility score</p>
                  {visibilityDelta ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        visibilityDelta.positive
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
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
                <p className={`text-xs ${mutedTextClass}`}>Share of search surface captured by brand content.</p>
              </div>

              <div className={`${subPanelClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Sentiment</p>
                  {sentimentDelta ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        sentimentDelta.positive
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
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
                <p className={`text-xs ${mutedTextClass}`}>Overall positive tone detected in the latest run.</p>
              </div>

              <div className={`${subPanelClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Avg rank</p>
                  {positionDelta ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        positionDelta.positive
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
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
                <p className={`text-xs ${mutedTextClass}`}>Lower is better. Benchmarks across captured mentions.</p>
              </div>

              <div className={`${subPanelClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Mentions</p>
                  {mentionsDelta ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        mentionsDelta.positive
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
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
                <p className={`text-xs ${mutedTextClass}`}>Raw brand mentions captured across all prompts.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <div className={`${panelClass} space-y-6`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className={`text-sm font-semibold ${strongTextClass}`}>Filters</h2>
                  <p className={`text-xs ${mutedTextClass}`}>Tune the model mix and historical window for this view.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLLMs([])}
                  className={`${isAllLLMsSelected ? chipActiveClass : chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-90`}
                  disabled={isAllLLMsSelected}
                >
                  <Filter className="h-3.5 w-3.5" />
                  All models
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={`${subPanelClass} space-y-4`}>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>LLM selection</p>
                    <p className={`text-sm ${mutedTextClass}`}>Compare responses across supported providers.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LLM_OPTIONS.map((option) => {
                      const active = isAllLLMsSelected || selectedLLMs.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedLLMs((prev) => {
                              const prevAll = prev.length === 0 || prev.length === LLM_OPTIONS.length
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
                          className={`${active ? chipActiveClass : chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${getLLMColor(option.value)}`} />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className={`${subPanelClass} space-y-4`}>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Time window</p>
                    <p className={`text-sm ${mutedTextClass}`}>Shift the time horizon to explore historical runs.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((option) => {
                      const active = timeFilter === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTimeFilterChange(option.value)}
                          className={`${active ? chipActiveClass : chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                  {timeFilter === '30d' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-medium ${mutedTextClass}`}>Granularity:</span>
                      <div className={`inline-flex rounded-full border px-1 py-1 ${dividerClass}`}>
                        <button
                          type="button"
                          onClick={() => setMonthlyView('daily')}
                          className={`${monthlyView === 'daily' ? chipActiveClass : chipClass} rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                        >
                          Daily
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonthlyView('weekly')}
                          className={`${monthlyView === 'weekly' ? chipActiveClass : chipClass} rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
                        >
                          Weekly
                        </button>
                      </div>
                    </div>
                  )}
                  {timeFilter === 'custom' && (
                    <div className={`${subPanelClass} space-y-4`}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={`mb-2 block text-xs font-medium ${mutedTextClass}`}>Start date</label>
                          <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            maxDate={new Date()}
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
                            maxDate={new Date()}
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
                          Apply range
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`${panelClass} space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-sm font-semibold ${strongTextClass}`}>Quick insights</h2>
                  <p className={`text-xs ${mutedTextClass}`}>Snapshot of engagement across the selected filters.</p>
                </div>
                <span
                  className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide`}
                >
                  {totalResponses} responses
                </span>
              </div>

              <div className="space-y-3">
                <div className={`${subPanelClass} flex items-start gap-3`}>
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Prompts engaged</p>
                    <p className={`text-sm font-semibold ${strongTextClass}`}>
                      {promptsWithResponses.size} / {totalPrompts || '—'}
                    </p>
                    <p className={`text-xs ${mutedTextClass}`}>Active prompts with at least one response this period.</p>
                  </div>
                </div>

                <div className={`${subPanelClass} flex items-start gap-3`}>
                  <MessageSquare className="h-5 w-5 text-sky-400" />
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Avg response length</p>
                    <p className={`text-sm font-semibold ${strongTextClass}`}>
                      {averageResponseLength ? `${averageResponseLength} words` : '—'}
                    </p>
                    <p className={`text-xs ${mutedTextClass}`}>Textual depth captured across generated answers.</p>
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
                          <p className={`text-sm font-semibold text-emerald-400`}>{positivePct}%</p>
                          <p className={`text-[11px] ${mutedTextClass}`}>Positive</p>
                        </div>
                        <div className="rounded-xl bg-slate-500/10 py-2">
                          <p className={`text-sm font-semibold ${mutedTextClass}`}>{neutralPct}%</p>
                          <p className={`text-[11px] ${mutedTextClass}`}>Neutral</p>
                        </div>
                        <div className="rounded-xl bg-rose-500/10 py-2">
                          <p className={`text-sm font-semibold text-rose-400`}>{negativePct}%</p>
                          <p className={`text-[11px] ${mutedTextClass}`}>Negative</p>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-xs ${mutedTextClass}`}>Sentiment data appears once analyses are available.</p>
                    )}
                  </div>
                </div>

                <div className={`${subPanelClass} flex items-start gap-3`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Leading model</p>
                    <p className={`text-sm font-semibold ${strongTextClass}`}>
                      {topLLMEntry && topLLMEntry[1] > 0 ? (
                        <>
                          {LLM_OPTIONS.find((option) => option.value === topLLMEntry[0])?.label}{' '}
                          <span className={`text-xs ${mutedTextClass}`}>
                            ({Math.round((topLLMEntry[1] / (totalResponses || 1)) * 100)}%)
                          </span>
                        </>
                      ) : (
                        'Awaiting data'
                      )}
                    </p>
                    <p className={`text-xs ${mutedTextClass}`}>Highest share of responses within the current filters.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <section className={`${panelClass} space-y-6`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className={`text-sm font-semibold ${strongTextClass}`}>Detailed responses</h2>
                  <p className={`text-xs ${mutedTextClass}`}>Expand prompts to review per-model answers and source links.</p>
                </div>
                {totalAnalyses > 1 && (
                  <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold`}>
                    {totalAnalyses} analyses
                  </span>
                )}
              </div>

              {runsByAnalysis.length === 0 ? (
                <div className={`${subPanelClass} flex flex-col items-center gap-3 py-12 text-center`}>
                  <Sparkles className="h-6 w-6 text-amber-400" />
                  <p className={`text-sm font-semibold ${strongTextClass}`}>No responses yet</p>
                  <p className={`text-xs ${mutedTextClass}`}>
                    Trigger a new analysis from the dashboard to populate this view.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {runsByAnalysis.map(({ analysisRun, runsByPrompt }) => {
                    const runCreatedAt = analysisRun.created_at ? new Date(analysisRun.created_at).toLocaleString() : null
                    const summaryItems = [
                      {
                        label: 'Visibility',
                        value:
                          analysisRun.visibility_pct !== undefined && analysisRun.visibility_pct !== null
                            ? `${Math.round(analysisRun.visibility_pct)}%`
                            : '—',
                      },
                      {
                        label: 'Sentiment',
                        value:
                          analysisRun.sentiment_pct !== undefined && analysisRun.sentiment_pct !== null
                            ? `${Math.round(analysisRun.sentiment_pct)}%`
                            : '—',
                      },
                      {
                        label: 'Avg rank',
                        value:
                          analysisRun.avg_position_raw !== undefined && analysisRun.avg_position_raw !== null
                            ? `#${Number(analysisRun.avg_position_raw).toFixed(1)}`
                            : '—',
                      },
                      {
                        label: 'Mentions',
                        value:
                          analysisRun.mentions_raw_total !== undefined && analysisRun.mentions_raw_total !== null
                            ? Number(analysisRun.mentions_raw_total).toLocaleString()
                            : '—',
                      },
                    ]

                    return (
                      <div key={analysisRun.id} className={`${subPanelClass} space-y-4`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Analysis run</p>
                            <p className={`text-sm font-semibold ${strongTextClass}`}>
                              {runCreatedAt ?? 'Completed run'}
                            </p>
                            <p className={`text-xs ${mutedTextClass}`}>
                              {analysisRun.aggregation_type
                                ? `${analysisRun.aggregation_type === 'weekly' ? 'Weekly aggregate' : 'Daily aggregate'} • ${
                                    analysisRun.runs_count || 1
                                  } run${analysisRun.runs_count === 1 ? '' : 's'}`
                                : 'Individual analysis'}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-right sm:text-left md:grid-cols-4">
                            {summaryItems.map((item) => (
                              <div key={item.label} className="rounded-xl bg-white/5 px-3 py-2 text-left">
                                <p className={`text-[11px] uppercase tracking-wide ${mutedTextClass}`}>{item.label}</p>
                                <p className={`text-sm font-semibold ${strongTextClass}`}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {runsByPrompt.map(({ prompt, runs }) => {
                            const key = `${analysisRun.id}-${prompt.id}`
                            const isOpen = openPrompts.has(key)
                            return (
                              <div key={key} className={`${subPanelClass}`}>
                                <button
                                  type="button"
                                  onClick={() => togglePrompt(key)}
                                  className="flex w-full items-center justify-between gap-4 text-left"
                                >
                                  <div className="flex items-start gap-3">
                                    <Sparkles className="h-5 w-5 text-amber-400" />
                                    <div>
                                      <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Prompt</p>
                                      <p className={`text-sm font-semibold ${strongTextClass}`}>{prompt.prompt_text}</p>
                                    </div>
                                  </div>
                                  <span className={`text-xs font-semibold ${mutedTextClass}`}>
                                    {runs.length} response{runs.length === 1 ? '' : 's'}
                                  </span>
                                </button>

                                {isOpen && (
                                  <div className={`mt-4 space-y-4 border-t pt-4 ${dividerClass}`}>
                                    {runs.map((run) => (
                                      <div
                                        key={run.id}
                                        className={`rounded-2xl border p-4 transition-colors ${
                                          isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
                                        }`}
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span
                                              className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${getLLMColor(
                                                run.llm,
                                              )} px-3 py-1 text-xs font-semibold text-white`}
                                            >
                                              {run.llm.toUpperCase()}
                                            </span>
                                            <span className={`text-xs ${mutedTextClass} capitalize`}>
                                              {run.sentiment || 'neutral'}
                                            </span>
                                            {getSentimentIcon(run.sentiment)}
                                          </div>
                                          <span className={`text-xs ${mutedTextClass}`}>
                                            {new Date(run.created_at).toLocaleString()}
                                          </span>
                                        </div>

                                        <p className={`mt-3 text-sm leading-relaxed ${bodyTextClass}`}>
                                          {run.response_text}
                                        </p>

                                        {run.sources && run.sources.length > 0 && (
                                          <div className={`mt-4 border-t pt-3 ${dividerClass}`}>
                                            <p className={`text-xs font-semibold ${strongTextClass}`}>Sources</p>
                                            <div className="mt-2 space-y-1.5">
                                              {run.sources.slice(0, 5).map((source, idx) => (
                                                <a
                                                  key={idx}
                                                  href={source.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`flex items-center gap-2 text-xs transition-colors ${
                                                    isDark
                                                      ? 'text-slate-300 hover:text-white'
                                                      : 'text-slate-600 hover:text-slate-900'
                                                  }`}
                                                >
                                                  <ExternalLink className="h-3 w-3" />
                                                  <span className="truncate">{source.title || source.url}</span>
                                                  {source.rank && (
                                                    <span
                                                      className={`${chipClass} ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold`}
                                                    >
                                                      #{source.rank}
                                                    </span>
                                                  )}
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-6">
              <div className={`${panelClass} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-semibold ${strongTextClass}`}>Analysis timeline</h2>
                    <p className={`text-xs ${mutedTextClass}`}>Recent runs aligned with the current filters.</p>
                  </div>
                  <Calendar className={`h-4 w-4 ${mutedTextClass}`} />
                </div>
                {availableRuns.length === 0 ? (
                  <p className={`text-xs ${mutedTextClass}`}>Run history will appear after your first analysis.</p>
                ) : (
                  <div className="space-y-3">
                    {availableRuns.slice(0, 6).map((run: any) => (
                      <div
                        key={run.id}
                        className={`${subPanelClass} flex items-start justify-between gap-4`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${strongTextClass}`}>
                            {run.created_at ? new Date(run.created_at).toLocaleString() : 'Completed run'}
                          </p>
                          <p className={`text-xs ${mutedTextClass}`}>
                            {run.aggregation_type
                              ? `${run.aggregation_type === 'weekly' ? 'Weekly aggregate' : 'Daily aggregate'}${
                                  run.runs_count ? ` • ${run.runs_count} runs` : ''
                                }`
                              : 'Individual analysis'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${strongTextClass}`}>
                            {run.visibility_pct !== undefined && run.visibility_pct !== null
                              ? `${Math.round(run.visibility_pct)}% vis`
                              : '—'}
                          </p>
                          <p className={`text-xs ${mutedTextClass}`}>
                            {run.sentiment_pct !== undefined && run.sentiment_pct !== null
                              ? `${Math.round(run.sentiment_pct)}% pos`
                              : 'Sentiment pending'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`${panelClass} space-y-4`}>
                <div>
                  <h2 className={`text-sm font-semibold ${strongTextClass}`}>Model distribution</h2>
                  <p className={`text-xs ${mutedTextClass}`}>How many responses each provider produced.</p>
                </div>
                {totalResponses === 0 ? (
                  <p className={`text-xs ${mutedTextClass}`}>Run analyses to populate provider-level metrics.</p>
                ) : (
                  <div className="space-y-2">
                    {llmBreakdown.map(([provider, count]) => {
                      const label = LLM_OPTIONS.find((option) => option.value === provider)?.label ?? provider
                      const percentage = totalResponses ? Math.round((count / totalResponses) * 100) : 0
                      return (
                        <div key={provider} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`${strongTextClass}`}>{label}</span>
                            <span className={mutedTextClass}>
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/60">
                            <div
                              className={`h-full bg-gradient-to-r ${getLLMColor(provider)} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}

function getLLMColor(llm: LLMProvider) {
  switch (llm) {
    case 'chatgpt':
      return 'from-emerald-500 to-teal-400'
    case 'gemini':
      return 'from-blue-500 to-sky-400'
    case 'perplexity':
      return 'from-purple-500 to-pink-500'
    default:
      return 'from-slate-600 to-slate-500'
  }
}

function getSentimentIcon(sentiment: string | null) {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-emerald-400" />
    case 'negative':
      return <TrendingDown className="h-4 w-4 text-rose-400" />
    default:
      return <Minus className="h-4 w-4 text-slate-400" />
  }
}
