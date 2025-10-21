'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { LLMRun, LLMProvider } from '@/types/llm'
import { Prompt } from '@/types/prompt'
import { MessageSquare, Sparkles, ExternalLink, TrendingUp, TrendingDown, Minus, Calendar, Filter, ChevronDown } from 'lucide-react'

export default function AnalysisResultsPage() {
  const params = useParams()
  const brandId = params.id as string
  const [llmRuns, setLlmRuns] = useState<LLMRun[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLLM, setSelectedLLM] = useState<LLMProvider | 'all'>('all')

  // Analysis run filtering
  const [availableRuns, setAvailableRuns] = useState<any[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [isRunDropdownOpen, setIsRunDropdownOpen] = useState(false)
  const [isLLMDropdownOpen, setIsLLMDropdownOpen] = useState(false)
  const runDropdownRef = useRef<HTMLDivElement>(null)
  const llmDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAvailableRuns()
  }, [brandId])

  useEffect(() => {
    if (selectedRunId) {
      fetchData()
    }
  }, [brandId, selectedRunId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (runDropdownRef.current && !runDropdownRef.current.contains(event.target as Node)) {
        setIsRunDropdownOpen(false)
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
      const res = await fetch(`/api/analysis-runs/${brandId}`)
      const data = await res.json()
      if (data.success) {
        setAvailableRuns(data.runs || [])
        // Auto-select latest run
        if (data.latest_run) {
          setSelectedRunId(data.latest_run.id)
        }
      }
    } catch (error) {
      console.error('Error fetching analysis runs:', error)
    }
  }

  const fetchData = async () => {
    try {
      const runParam = selectedRunId ? `?analysis_run_id=${selectedRunId}` : ''
      const [runsRes, promptsRes] = await Promise.all([
        fetch(`/api/llm-runs/${brandId}${runParam}`),
        fetch(`/api/prompts/${brandId}`),
      ])

      const runsData = await runsRes.json()
      const promptsData = await promptsRes.json()

      setLlmRuns(runsData.llm_runs || [])
      setPrompts(promptsData.prompts || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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

  const filteredRuns = selectedLLM === 'all'
    ? llmRuns
    : llmRuns.filter(run => run.llm === selectedLLM)

  // Group runs by prompt
  const runsByPrompt = prompts.map(prompt => ({
    prompt,
    runs: llmRuns.filter(run => run.prompt_id === prompt.id),
  }))

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

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-slate-900" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                  Analysis Results
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  {prompts.length} prompts × 3 LLMs = {llmRuns.length} responses
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              {/* Analysis Run Dropdown */}
              <div className="relative" ref={runDropdownRef}>
                <button
                  onClick={() => setIsRunDropdownOpen(!isRunDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  {selectedRunId
                    ? getRunLabel(availableRuns.find(r => r.id === selectedRunId) || {})
                    : 'Select Analysis'
                  }
                  <ChevronDown className={`w-4 h-4 transition-transform ${isRunDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRunDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                    {availableRuns.map((run, index) => (
                      <button
                        key={run.id}
                        onClick={() => { setSelectedRunId(run.id); setIsRunDropdownOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                          index === 0 ? 'rounded-t-lg' : ''
                        } ${index === availableRuns.length - 1 ? 'rounded-b-lg' : ''} ${
                          selectedRunId === run.id ? 'bg-slate-100 font-medium' : ''
                        }`}
                      >
                        {getRunLabel(run)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LLM Filter Dropdown */}
              <div className="relative" ref={llmDropdownRef}>
                <button
                  onClick={() => setIsLLMDropdownOpen(!isLLMDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {selectedLLM === 'all' ? 'All LLMs' : selectedLLM === 'chatgpt' ? 'ChatGPT' : selectedLLM === 'gemini' ? 'Gemini' : 'Perplexity'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isLLMDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLLMDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => { setSelectedLLM('all'); setIsLLMDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg ${
                        selectedLLM === 'all' ? 'bg-slate-100 font-medium' : ''
                      }`}
                    >
                      All LLMs
                    </button>
                    <button
                      onClick={() => { setSelectedLLM('chatgpt'); setIsLLMDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                        selectedLLM === 'chatgpt' ? 'bg-slate-100 font-medium' : ''
                      }`}
                    >
                      ChatGPT
                    </button>
                    <button
                      onClick={() => { setSelectedLLM('gemini'); setIsLLMDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                        selectedLLM === 'gemini' ? 'bg-slate-100 font-medium' : ''
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => { setSelectedLLM('perplexity'); setIsLLMDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 last:rounded-b-lg ${
                        selectedLLM === 'perplexity' ? 'bg-slate-100 font-medium' : ''
                      }`}
                    >
                      Perplexity
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {runsByPrompt.map(({ prompt, runs }) => (
            <div key={prompt.id} className="mb-8">
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
                {/* Prompt Question */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-slate-900 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Prompt</h3>
                      <p className="text-slate-700 text-sm leading-relaxed">{prompt.prompt_text}</p>
                    </div>
                  </div>
                </div>

                {/* LLM Responses */}
                <div className="space-y-6">
                  {runs
                    .filter(run => selectedLLM === 'all' || run.llm === selectedLLM)
                    .map((run) => (
                      <div key={run.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                        {/* LLM Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${getLLMColor(run.llm)} text-white text-xs font-bold`}>
                              {run.llm.toUpperCase()}
                            </div>
                            {getSentimentIcon(run.sentiment)}
                            <span className="text-xs text-slate-600 capitalize">
                              {run.sentiment || 'neutral'} sentiment
                            </span>
                          </div>
                        </div>

                        {/* Response Text */}
                        <div className="mb-4">
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {run.response_text}
                          </p>
                        </div>

                        {/* Sources */}
                        {run.sources && run.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <h4 className="text-xs font-bold text-slate-900 mb-2">
                              Sources ({run.sources.length})
                            </h4>
                            <div className="space-y-1.5">
                              {run.sources.slice(0, 5).map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span className="truncate">
                                    {source.title || source.url}
                                  </span>
                                  {source.rank && (
                                    <span className="ml-auto text-xs bg-slate-100 px-1.5 py-0.5 rounded">
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
            </div>
          ))}

          {filteredRuns.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Results Yet</h3>
              <p className="text-slate-600">
                Run an analysis to see LLM responses here
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
