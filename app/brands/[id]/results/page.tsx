'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
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

type PromptSentimentBreakdown = {
  positive: number
  neutral: number
  negative: number
}

type PromptSummary = {
  prompt: Prompt
  runs: LLMRun[]
  latestRunDate: string | null
  sentiments: PromptSentimentBreakdown
}

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
  const [activePromptId, setActivePromptId] = useState<string | null>(null)

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

  const filteredRuns = useMemo(() => {
    if (selectedLLMs.length === 0 || selectedLLMs.length === LLM_OPTIONS.length) {
      return llmRuns
    }
    return llmRuns.filter((run) => selectedLLMs.includes(run.llm as LLMProvider))
  }, [llmRuns, selectedLLMs])

  const runsByPromptMap = useMemo(() => {
    const map = new Map<string, LLMRun[]>()
    filteredRuns.forEach((run) => {
      if (!map.has(run.prompt_id)) {
        map.set(run.prompt_id, [])
      }
      map.get(run.prompt_id)!.push(run)
    })
    map.forEach((runs) => {
      runs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    })
    return map
  }, [filteredRuns])

  const promptSummaries = useMemo<PromptSummary[]>(() => {
    return prompts.map((prompt) => {
      const runs = runsByPromptMap.get(prompt.id) ?? []
      const sentiments = runs.reduce<PromptSentimentBreakdown>(
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
      const latestRun = runs[0] ?? null
      return {
        prompt,
        runs,
        latestRunDate: latestRun ? latestRun.created_at : null,
        sentiments,
      }
    })
  }, [prompts, runsByPromptMap])

  const promptsWithResponsesCount = useMemo(() => {
    return promptSummaries.filter((summary) => summary.runs.length > 0).length
  }, [promptSummaries])

  const totalResponses = filteredRuns.length
  const totalPrompts = prompts.length

  useEffect(() => {
    if (promptSummaries.length === 0) {
      if (activePromptId !== null) {
        setActivePromptId(null)
      }
      return
    }

    const existing = activePromptId
      ? promptSummaries.find((summary) => summary.prompt.id === activePromptId)
      : undefined

    if (existing) {
      return
    }

    const fallback = promptSummaries.find((summary) => summary.runs.length > 0) ?? promptSummaries[0]
    setActivePromptId(fallback.prompt.id)
  }, [promptSummaries, activePromptId])

  const activePromptSummary = useMemo(() => {
    if (!activePromptId) return null
    return promptSummaries.find((summary) => summary.prompt.id === activePromptId) ?? null
  }, [promptSummaries, activePromptId])

  const activePromptRuns = useMemo(() => {
    if (!activePromptSummary) return []
    return [...activePromptSummary.runs].reverse()
  }, [activePromptSummary])

  const activePromptPositivePct = useMemo(() => {
    if (!activePromptSummary || activePromptSummary.runs.length === 0) return null
    const { sentiments } = activePromptSummary
    return Math.round((sentiments.positive / activePromptSummary.runs.length) * 100)
  }, [activePromptSummary])

  const llmBreakdown = useMemo(() => {
    const counts: Record<LLMProvider, number> = {
      chatgpt: 0,
      gemini: 0,
      perplexity: 0,
    }
    filteredRuns.forEach((run) => {
      counts[run.llm] += 1
    })
    return Object.entries(counts) as Array<[LLMProvider, number]>
  }, [filteredRuns])

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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
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
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                  Prompt workspace
                </span>
                <div>
                  <h1 className={`text-3xl font-semibold ${strongTextClass}`}>Prompts</h1>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    Review prompt history, filter by provider, and inspect model answers in a chat-style timeline.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium`}>
                    <Filter className="h-3.5 w-3.5" />
                    {isAllLLMsSelected ? 'All models' : selectedLLMs.map((llm) => llm.toUpperCase()).join(', ')}
                  </span>
                  <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium`}>
                    <Calendar className="h-3.5 w-3.5" />
                    {timeFilter === 'custom'
                      ? customRangeApplied && startDate && endDate
                        ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                        : 'Custom range'
                      : TIME_OPTIONS.find((option) => option.value === timeFilter)?.label}
                  </span>
                </div>
              </div>

              <div className={`${subPanelClass} w-full space-y-3 md:max-w-xs`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Snapshot</p>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={mutedTextClass}>Prompts</span>
                    <span className={`font-semibold ${strongTextClass}`}>{totalPrompts || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={mutedTextClass}>Active prompts</span>
                    <span className={`font-semibold ${strongTextClass}`}>{promptsWithResponsesCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={mutedTextClass}>Responses</span>
                    <span className={`font-semibold ${strongTextClass}`}>{totalResponses || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <aside className="flex w-full flex-col gap-6 lg:max-w-sm">
              <div className={`${panelClass} space-y-6`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-sm font-semibold ${strongTextClass}`}>Filters</h2>
                    <p className={`text-xs ${mutedTextClass}`}>Tune the model mix and historical window.</p>
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

                <div className="space-y-4">
                  <div className={`${subPanelClass} space-y-3`}>
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>LLM selection</p>
                      <p className={`text-xs ${mutedTextClass}`}>Compare responses across supported providers.</p>
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

                  <div className={`${subPanelClass} space-y-3`}>
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-wide ${mutedTextClass}`}>Time window</p>
                      <p className={`text-xs ${mutedTextClass}`}>Shift the time horizon to explore historical runs.</p>
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
                  </div>

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

              <div className={`${panelClass} flex h-full flex-col`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-sm font-semibold ${strongTextClass}`}>Prompts</h2>
                    <p className={`text-xs ${mutedTextClass}`}>Select a prompt to inspect responses.</p>
                  </div>
                  <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide`}>
                    {promptsWithResponsesCount}/{totalPrompts || '—'} active
                  </span>
                </div>
                <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                  {promptSummaries.length ? (
                    promptSummaries.map((summary) => {
                      const isActive = summary.prompt.id === activePromptId
                      const total = summary.runs.length
                      const positivePct = total ? Math.round((summary.sentiments.positive / total) * 100) : 0
                      const neutralPct = total ? Math.round((summary.sentiments.neutral / total) * 100) : 0
                      const negativePct = total ? Math.round((summary.sentiments.negative / total) * 100) : 0
                      return (
                        <button
                          key={summary.prompt.id}
                          type="button"
                          onClick={() => setActivePromptId(summary.prompt.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition-all ${
                            isActive
                              ? isDark
                                ? 'border-white/30 bg-white/10 shadow-lg shadow-black/30'
                                : 'border-slate-900 bg-slate-900/5 shadow-lg shadow-slate-200/80'
                              : isDark
                                ? 'border-white/10 bg-white/5 hover:border-white/20'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${strongTextClass}`}>{summary.prompt.prompt_text}</p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className={mutedTextClass}>{total} response{total === 1 ? '' : 's'}</span>
                            <span className={mutedTextClass}>
                              {summary.latestRunDate
                                ? new Date(summary.latestRunDate).toLocaleString()
                                : 'Awaiting responses'}
                            </span>
                          </div>
                          {total ? (
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                              <div className="rounded-xl bg-emerald-500/10 px-2 py-2">
                                <p className="font-semibold text-emerald-400">{positivePct}%</p>
                                <p className={mutedTextClass}>Positive</p>
                              </div>
                              <div className="rounded-xl bg-slate-500/10 px-2 py-2">
                                <p className="font-semibold text-slate-400">{neutralPct}%</p>
                                <p className={mutedTextClass}>Neutral</p>
                              </div>
                              <div className="rounded-xl bg-rose-500/10 px-2 py-2">
                                <p className="font-semibold text-rose-400">{negativePct}%</p>
                                <p className={mutedTextClass}>Negative</p>
                              </div>
                            </div>
                          ) : (
                            <p className={`mt-3 text-xs ${mutedTextClass}`}>No responses during this window.</p>
                          )}
                        </button>
                      )
                    })
                  ) : (
                    <p className={`text-sm ${mutedTextClass}`}>Prompts will appear here once created.</p>
                  )}
                </div>
              </div>

              <div className={`${panelClass} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-semibold ${strongTextClass}`}>Run history</h2>
                    <p className={`text-xs ${mutedTextClass}`}>Latest completed analyses under current filters.</p>
                  </div>
                  <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide`}>
                    {availableRuns.length}
                  </span>
                </div>
                {availableRuns.length === 0 ? (
                  <p className={`text-xs ${mutedTextClass}`}>Run at least one analysis to populate history.</p>
                ) : (
                  <div className="space-y-3">
                    {availableRuns.slice(0, 5).map((run) => (
                      <div key={run.id} className={`${subPanelClass} flex items-center justify-between gap-3`}>
                        <div>
                          <p className={`text-sm font-semibold ${strongTextClass}`}>
                            {new Date(run.created_at).toLocaleString()}
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
                            <span className={strongTextClass}>{label}</span>
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

            <section className="flex-1">
              <div className={`${panelClass} flex h-full flex-col`}>
                {activePromptSummary ? (
                  <>
                    <div className={`flex flex-col gap-4 border-b pb-4 ${dividerClass}`}>
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div className="space-y-1">
                          <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Prompt</p>
                          <h2 className={`text-xl font-semibold ${strongTextClass}`}>
                            {activePromptSummary.prompt.prompt_text}
                          </h2>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold`}>
                          <MessageSquare className="h-3.5 w-3.5" />
                          {activePromptSummary.runs.length} response{activePromptSummary.runs.length === 1 ? '' : 's'}
                        </span>
                        {activePromptPositivePct !== null && (
                          <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold`}>
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                            {activePromptPositivePct}% positive
                          </span>
                        )}
                        {activePromptSummary.latestRunDate && (
                          <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold`}>
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(activePromptSummary.latestRunDate).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
                      {activePromptRuns.length ? (
                        activePromptRuns.map((run) => {
                          const llmLabel = LLM_OPTIONS.find((option) => option.value === run.llm)?.label ?? run.llm
                          return (
                            <div key={run.id} className="space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${getLLMColor(run.llm)} px-3 py-1 text-xs font-semibold text-white`}>
                                    {llmLabel}
                                  </span>
                                  <span className={`text-xs capitalize ${mutedTextClass}`}>{run.sentiment ?? 'neutral'}</span>
                                  {getSentimentIcon(run.sentiment)}
                                </div>
                                <span className={`text-xs ${mutedTextClass}`}>
                                  {new Date(run.created_at).toLocaleString()}
                                </span>
                              </div>

                              <div className={`rounded-2xl border p-4 transition-colors ${
                                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
                              }`}>
                                <p className={`text-sm leading-relaxed ${bodyTextClass}`}>{run.response_text}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                  {run.position !== null && run.position !== undefined ? (
                                    <span className={`${chipClass} inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold`}>
                                      #{run.position} rank
                                    </span>
                                  ) : null}
                                  <span className={`${chipClass} inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold`}>
                                    {run.mentions_count} mentions
                                  </span>
                                </div>
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
                                            <span className={`${chipClass} ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold`}>
                                              #{source.rank}
                                            </span>
                                          )}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-400/40">
                          <p className={`text-sm ${mutedTextClass}`}>
                            This prompt does not have responses within the selected filters.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center">
                    <p className={`text-sm ${mutedTextClass}`}>Add prompts to start collecting answers.</p>
                  </div>
                )}
              </div>
            </section>
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
    case 'neutral':
    default:
      return <Minus className="h-4 w-4 text-slate-400" />
  }
}
