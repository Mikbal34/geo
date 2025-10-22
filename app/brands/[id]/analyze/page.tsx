'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, BarChart3, Check, CheckCircle2, Loader2, Moon, Sparkles, Sun, Zap } from 'lucide-react'

import Navigation from '@/components/layout/Navigation'

type Theme = 'light' | 'dark'
type StepState = 'completed' | 'current'

interface AnalysisStatus {
  state: string
  promptCount: number
  scoreCount: number
}

const stepConfig: Array<{ title: string; state: StepState }> = [
  { title: 'Brand Info', state: 'completed' },
  { title: 'Prompts', state: 'completed' },
  { title: 'Competitors', state: 'completed' },
  { title: 'Analysis', state: 'current' },
]

const dimensions = ['Brand Awareness', 'Consideration', 'Preference', 'Purchase Intent', 'Loyalty', 'Advocacy']

export default function AnalyzePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const brandId = params.id

  const [theme, setTheme] = useState<Theme>('light')
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
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

  const fetchStatus = async () => {
    setStatusLoading(true)
    setStatusError(null)

    try {
      const res = await fetch(`/api/analyze/status?brandId=${brandId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch analysis status')
      }
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error(error)
      setStatusError(error instanceof Error ? error.message : 'Unable to fetch status')
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    if (brandId) {
      fetchStatus()
    }
  }, [brandId])

  const handleAnalyze = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!brandId) return

    setAnalyzing(true)
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
    } finally {
      setAnalyzing(false)
    }
  }

  const isDark = theme === 'dark'

  const containerClass = [
    'relative min-h-screen px-4 pb-16 pt-12 transition-colors',
    isDark
      ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900'
      : 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
  ].join(' ')

  const toggleButtonClass = [
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2',
    isDark
      ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/20 focus:ring-white/30 focus:ring-offset-0'
      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-800 shadow-sm focus:ring-slate-200 focus:ring-offset-2 focus:ring-offset-white',
  ].join(' ')

  const backButtonClass = [
    'inline-flex items-center gap-2 text-sm font-medium transition-colors',
    isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900',
  ].join(' ')

  const stepsPanelClass = [
    'rounded-3xl border px-6 py-5 shadow-sm transition-colors',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl' : 'border-slate-200 bg-white',
  ].join(' ')

  const stepConnectorClass = ['h-0.5 w-8 rounded-full transition-colors', isDark ? 'bg-white/20' : 'bg-slate-200'].join(' ')

  const badgeClass = [
    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
    isDark ? 'border-white/10 bg-white/10 text-slate-200' : 'border-slate-200 bg-white text-slate-600 shadow-sm',
  ].join(' ')

  const headingClass = ['text-3xl font-semibold transition-colors sm:text-4xl', isDark ? 'text-white' : 'text-slate-900'].join(' ')
  const descriptionClass = ['text-sm leading-relaxed sm:text-base transition-colors', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')

  const cardClass = [
    'rounded-3xl border p-8 shadow-xl transition-colors sm:p-10',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl shadow-black/30' : 'border-slate-200 bg-white shadow-slate-200/70',
  ].join(' ')

  const metricsCardClass = [
    'rounded-3xl border p-6 shadow-lg transition-colors sm:p-8',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl shadow-black/30' : 'border-slate-200 bg-white shadow-slate-200/70',
  ].join(' ')

  const metricTileClass = [
    'rounded-2xl border p-5 transition-colors',
    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
  ].join(' ')

  const errorContainerClass = [
    'rounded-2xl border p-6 transition-colors',
    isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-600',
  ].join(' ')

  const warningContainerClass = [
    'rounded-2xl border p-6 transition-colors',
    isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700',
  ].join(' ')

  const dimensionsCardClass = [
    'rounded-3xl border p-8 shadow-lg transition-colors sm:p-10',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl shadow-black/30' : 'border-slate-200 bg-white shadow-slate-200/70',
  ].join(' ')

  const dimensionItemClass = [
    'flex items-center gap-3 rounded-2xl border p-4 transition-colors',
    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50',
  ].join(' ')

  const dimensionIconClass = [
    'h-5 w-5 flex-shrink-0',
    isDark ? 'text-emerald-300' : 'text-emerald-600',
  ].join(' ')

  const actionButtonClass = [
    'group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-900'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
  ].join(' ')

  const stepCircleClasses = useMemo(() => {
    return {
      completed: [
        'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
        isDark ? 'border-white/20 bg-white/15 text-white' : 'border-slate-200 bg-slate-100 text-slate-800',
      ].join(' '),
      current: [
        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
        isDark ? 'bg-white text-black' : 'bg-slate-900 text-white',
      ].join(' '),
    }
  }, [isDark])

  const stepLabelClasses = useMemo(
    () => ({
      completed: ['text-xs font-medium uppercase tracking-wide transition-colors', isDark ? 'text-slate-200' : 'text-slate-700'].join(' '),
      current: ['text-xs font-semibold uppercase tracking-wide transition-colors', isDark ? 'text-white' : 'text-slate-900'].join(' '),
    }),
    [isDark],
  )

  const canAnalyze = status?.state === 'READY' || status?.state === 'ANALYZED'
  const promptCount = status?.promptCount ?? 0

  return (
    <>
      <Navigation theme={theme} />
      <main className={containerClass}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => router.back()} className={backButtonClass}>
              <ArrowLeft className="h-4 w-4" />
              Back a step
            </button>
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

          <div className={stepsPanelClass}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {stepConfig.map((step, index) => (
                <div key={step.title} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={stepCircleClasses[step.state]}>
                      {step.state === 'completed' ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={stepLabelClasses[step.state]}>{step.title}</span>
                  </div>
                  {index < stepConfig.length - 1 && <div className={stepConnectorClass} />}
                </div>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <div className="space-y-3">
              <span className={badgeClass}>Step 4 of 4</span>
              <h1 className={headingClass}>Run your brand analysis</h1>
              <p className={descriptionClass}>
                Kick off the AI analysis to generate updated scores, competitor benchmarks, and actionable recommendations for your brand.
              </p>
            </div>
          </div>

          <div className={metricsCardClass}>
            <div className="mb-6 flex items-center gap-3">
              <BarChart3 className={isDark ? 'h-5 w-5 text-white' : 'h-5 w-5 text-slate-900'} />
              <h2 className={`text-xl font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Analysis status</h2>
            </div>

            {statusLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-slate-900'}`} />
              </div>
            ) : statusError ? (
              <div className={errorContainerClass}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold">Status unavailable</h3>
                    <p className="text-sm opacity-90">{statusError}</p>
                  </div>
                </div>
              </div>
            ) : status ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className={metricTileClass}>
                  <div className={`text-2xl font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{status.state}</div>
                  <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current state</p>
                </div>
                <div className={metricTileClass}>
                  <div className={`text-2xl font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {status.promptCount}
                  </div>
                  <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Prompts added</p>
                </div>
                <div className={metricTileClass}>
                  <div className={`text-2xl font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {status.scoreCount}
                  </div>
                  <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Previous runs</p>
                </div>
              </div>
            ) : null}
          </div>

          {analyzeError && (
            <div className={errorContainerClass}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold">Analysis error</h3>
                  <p className="text-sm opacity-90">{analyzeError}</p>
                </div>
              </div>
            </div>
          )}

          {!statusLoading && !statusError && !canAnalyze && (
            <div className={warningContainerClass}>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold">Not ready yet</h3>
                  <p className="text-sm opacity-90">
                    Add at least one prompt to unlock analysis. You currently have {promptCount} configured.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className={dimensionsCardClass}>
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className={isDark ? 'h-5 w-5 text-white' : 'h-5 w-5 text-slate-900'} />
              <h2 className={`text-xl font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Analysis dimensions
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {dimensions.map((dimension) => (
                <div key={dimension} className={dimensionItemClass}>
                  <CheckCircle2 className={dimensionIconClass} />
                  <span className={`text-sm font-medium transition-colors ${isDark ? 'text-white' : 'text-slate-800'}`}>{dimension}</span>
                </div>
              ))}
            </div>
            <p className={`mt-6 border-t pt-6 text-sm transition-colors ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              GPT-4 Turbo evaluates your brand against each dimension, combining prompt responses and competitor benchmarks to surface
              actionable insights.
            </p>
          </div>

          <div className="text-center">
            <button type="button" className={actionButtonClass} onClick={handleAnalyze} disabled={!canAnalyze || analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Run AI analysis
                </>
              )}
            </button>
            {analyzing && (
              <p className={`mt-4 text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                This may take 15–30 seconds. Please keep this tab open.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
