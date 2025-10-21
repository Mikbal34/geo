'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { LLMRun, LLMProvider } from '@/types/llm'
import { Prompt } from '@/types/prompt'
import { MessageSquare, Sparkles, ExternalLink, TrendingUp, TrendingDown, Minus, Calendar, Filter, ChevronDown } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type TimeFilter = '24h' | '7d' | '30d' | 'custom'
type MonthlyView = 'daily' | 'weekly'

export default function AnalysisResultsPage() {
  const params = useParams()
  const brandId = params.id as string
  const [llmRuns, setLlmRuns] = useState<LLMRun[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLLMs, setSelectedLLMs] = useState<LLMProvider[]>(['chatgpt', 'gemini', 'perplexity'])

  // Time filtering (Dashboard ile aynı)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h')
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [monthlyView, setMonthlyView] = useState<MonthlyView>('daily')

  // Analysis runs
  const [availableRuns, setAvailableRuns] = useState<any[]>([])
  const [isLLMDropdownOpen, setIsLLMDropdownOpen] = useState(false)
  const timeFilterRef = useRef<HTMLDivElement>(null)
  const llmDropdownRef = useRef<HTMLDivElement>(null)
  const [openPrompts, setOpenPrompts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAvailableRuns()
  }, [brandId, timeFilter, selectedLLMs, monthlyView, startDate, endDate])

  useEffect(() => {
    fetchPrompts()
  }, [brandId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeFilterRef.current && !timeFilterRef.current.contains(event.target as Node)) {
        setIsTimeFilterOpen(false)
      }
      if (llmDropdownRef.current && !llmDropdownRef.current.contains(event.target as Node)) {
        setIsLLMDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        // Fetch LLM runs for all runs
        await fetchLLMRunsForAllAnalyses(data.runs || [])
      }
    } catch (error) {
      console.error('Error fetching analysis runs:', error)
    }
  }

  const fetchLLMRunsForAllAnalyses = async (runs: any[]) => {
    try {
      setLoading(true)
      const runIds = runs.map(r => r.id).filter(Boolean).join(',')

      if (!runIds) {
        setLlmRuns([])
        setLoading(false)
        return
      }

      const res = await fetch(`/api/llm-runs/${brandId}?analysis_run_ids=${runIds}`)
      const data = await res.json()
      setLlmRuns(data.llm_runs || [])
    } catch (error) {
      console.error('Error fetching LLM runs:', error)
      setLlmRuns([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPrompts = async () => {
    try {
      const res = await fetch(`/api/prompts/${brandId}`)
      const data = await res.json()
      setPrompts(data.prompts || [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
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
      setMonthlyView('daily')
    }
  }

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      setShowDatePicker(false)
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

  const getRunLabel = (run: any) => {
    const date = new Date(run.created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    const type = run.run_type === 'manual' ? '(Manual)' : '(Auto)'
    return `${date} ${type}`
  }

  // Filter LLM runs by selected LLMs
  const filteredRuns = selectedLLMs.length === 0 || selectedLLMs.length === 3
    ? llmRuns
    : llmRuns.filter(run => selectedLLMs.includes(run.llm as LLMProvider))

  // Group runs by analysis_run_id, then by prompt
  const runsByAnalysis = availableRuns.map(analysisRun => ({
    analysisRun,
    runsByPrompt: prompts.map(prompt => ({
      prompt,
      runs: filteredRuns.filter(run =>
        run.analysis_run_id === analysisRun.id && run.prompt_id === prompt.id
      ),
    })).filter(group => group.runs.length > 0)
  })).filter(group => group.runsByPrompt.length > 0)

  const getLLMColor = (llm: LLMProvider) => {
    switch (llm) {
      case 'chatgpt': return 'from-slate-800 to-slate-700'
      case 'gemini': return 'from-slate-700 to-slate-600'
      case 'perplexity': return 'from-slate-600 to-slate-500'
    }
  }

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const togglePrompt = (uniqueKey: string) => {
    const newOpenPrompts = new Set(openPrompts)
    if (newOpenPrompts.has(uniqueKey)) {
      newOpenPrompts.delete(uniqueKey)
    } else {
      newOpenPrompts.add(uniqueKey)
    }
    setOpenPrompts(newOpenPrompts)
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-white" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#171717] border border-slate-800 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Analysis Results
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {prompts.length} prompts × 3 LLMs = {llmRuns.length} responses
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
              {/* Time Filter */}
              <div className="relative" ref={timeFilterRef}>
                <button
                  onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171717] border border-slate-800 text-xs font-medium text-slate-400 hover:bg-[#0a0a0a] transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {getTimeFilterLabel()}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTimeFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTimeFilterOpen && (
                  <div className="absolute left-0 mt-1 w-40 bg-[#171717] border border-slate-800 shadow-lg z-10">
                    <button
                      onClick={() => handleTimeFilterChange('24h')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                        timeFilter === '24h' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                      }`}
                    >
                      24 Hours
                    </button>
                    <button
                      onClick={() => handleTimeFilterChange('7d')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                        timeFilter === '7d' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => handleTimeFilterChange('30d')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                        timeFilter === '30d' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                      }`}
                    >
                      1 Month
                    </button>
                    <button
                      onClick={() => handleTimeFilterChange('custom')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#0a0a0a] text-slate-300 ${
                        timeFilter === 'custom' ? 'bg-[#0a0a0a] font-medium text-white' : ''
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                )}
              </div>

              {/* 30d Daily/Weekly Toggle */}
              {timeFilter === '30d' && (
                <div className="flex items-center gap-1 px-1.5 py-1.5 bg-[#171717] border border-slate-800">
                  <button
                    onClick={() => setMonthlyView('daily')}
                    className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                      monthlyView === 'daily'
                        ? 'bg-white text-black'
                        : 'bg-transparent text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setMonthlyView('weekly')}
                    className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                      monthlyView === 'weekly'
                        ? 'bg-white text-black'
                        : 'bg-transparent text-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              )}

              {/* LLM Checkbox Filter */}
              <div className="relative" ref={llmDropdownRef}>
                <button
                  onClick={() => setIsLLMDropdownOpen(!isLLMDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171717] border border-slate-800 text-xs font-medium text-slate-400 hover:bg-[#0a0a0a] transition-colors"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {selectedLLMs.length === 0 || selectedLLMs.length === 3
                    ? 'All LLMs'
                    : selectedLLMs.length === 1
                    ? selectedLLMs[0] === 'chatgpt' ? 'ChatGPT' : selectedLLMs[0] === 'gemini' ? 'Gemini' : 'Perplexity'
                    : `${selectedLLMs.length} LLMs`
                  }
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLLMDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLLMDropdownOpen && (
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
                        className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:bg-[#0a0a0a] rounded"
                      >
                        Select All
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>

          {/* Custom Date Picker Modal */}
          {showDatePicker && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-[#171717] border border-slate-800 shadow-2xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-white mb-4">Select Date Range</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={new Date()}
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">End Date</label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate ?? undefined}
                      maxDate={new Date()}
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDatePicker(false)
                      setTimeFilter('24h')
                      setStartDate(null)
                      setEndDate(null)
                    }}
                    className="flex-1 px-4 py-2 border border-slate-800 text-sm font-medium text-slate-300 hover:bg-[#0a0a0a]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomDateApply}
                    disabled={!startDate || !endDate}
                    className="flex-1 px-4 py-2 bg-white text-black text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid - Grouped by Analysis Run */}
          {runsByAnalysis.map(({ analysisRun, runsByPrompt }) => (
            <div key={analysisRun.id} className="mb-12">
              {/* Analysis Run Header */}
              <div className="mb-6 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <h2 className="text-xl font-bold text-white">
                    {new Date(analysisRun.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </h2>
                  <span className="px-2 py-1 text-xs font-medium bg-slate-800 text-slate-300">
                    {analysisRun.run_type === 'manual' ? 'Manual' : 'Auto'}
                  </span>
                </div>
              </div>

              {/* Prompts for this Analysis */}
              {runsByPrompt.map(({ prompt, runs }) => {
                const uniqueKey = `${analysisRun.id}-${prompt.id}`
                const isOpen = openPrompts.has(uniqueKey)
                return (
                  <div key={uniqueKey} className="mb-4">
                    <div className="bg-[#171717] shadow-xl border border-slate-800">
                      {/* Prompt Question - Clickable Header */}
                      <button
                        onClick={() => togglePrompt(uniqueKey)}
                        className="w-full p-6 flex items-center justify-between hover:bg-[#0a0a0a] transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1 text-left">
                          <Sparkles className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-white mb-1">Prompt</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">{prompt.prompt_text}</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* LLM Responses - Collapsible */}
                      {isOpen && (
                        <div className="border-t border-slate-800 p-6">
                          <div className="space-y-4">
                      {runs.map((run) => (
                        <div key={run.id} className="border border-slate-800 p-5 hover:border-slate-700 transition-colors bg-[#0a0a0a]">
                          {/* LLM Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`px-3 py-1.5 bg-gradient-to-r ${getLLMColor(run.llm)} text-white text-xs font-bold`}>
                                {run.llm.toUpperCase()}
                              </div>
                              {getSentimentIcon(run.sentiment)}
                              <span className="text-xs text-slate-400 capitalize">
                                {run.sentiment || 'neutral'} sentiment
                              </span>
                            </div>
                          </div>

                          {/* Response Text */}
                          <div className="mb-4">
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                              {run.response_text}
                            </p>
                          </div>

                          {/* Sources */}
                          {run.sources && run.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-800">
                              <h4 className="text-xs font-bold text-white mb-2">
                                Sources ({run.sources.length})
                              </h4>
                              <div className="space-y-1.5">
                                {run.sources.slice(0, 5).map((source, idx) => (
                                  <a
                                    key={idx}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="truncate">
                                      {source.title || source.url}
                                    </span>
                                    {source.rank && (
                                      <span className="ml-auto text-xs bg-slate-800 px-1.5 py-0.5">
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
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {filteredRuns.length === 0 && (
            <div className="bg-[#171717] shadow-xl border border-slate-800 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Results Yet</h3>
              <p className="text-slate-400">
                Run an analysis to see LLM responses here
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
