'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2, Moon, Sparkles, Sun } from 'lucide-react'

import Navigation from '@/components/layout/Navigation'
import PromptList from '@/components/prompts/PromptList'
import PromptForm from '@/components/prompts/PromptForm'
import SuggestPromptsButton from '@/components/prompts/SuggestPromptsButton'
import type { Prompt } from '@/types/prompt'

type Theme = 'light' | 'dark'
type StepState = 'completed' | 'current' | 'upcoming'

const stepConfig = [
  { title: 'Brand Info', state: 'completed' as StepState },
  { title: 'Prompts', state: 'current' as StepState },
  { title: 'Competitors', state: 'upcoming' as StepState },
  { title: 'Analysis', state: 'upcoming' as StepState },
]

export default function PromptsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const brandId = params.id

  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const storedTheme = localStorage.getItem('auth_theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('auth_theme', theme)
  }, [theme])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/prompts/${brandId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch prompts')
      }
      const data = await res.json()
      setPrompts(data.prompts)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (brandId) {
      fetchPrompts()
    }
  }, [brandId])

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

  const readyBadgeClass = [
    'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors border',
    isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-emerald-500/30 bg-emerald-50 text-emerald-600',
  ].join(' ')

  const listCardClass = [
    'rounded-3xl border p-6 shadow-lg transition-colors sm:p-8',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl shadow-black/30' : 'border-slate-200 bg-white shadow-slate-200/70',
  ].join(' ')

  const dividerClass = ['flex items-center gap-3 text-sm', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')

  const nextButtonClass = [
    'group inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/60 focus:ring-offset-slate-950'
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
      upcoming: [
        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
        isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500',
      ].join(' '),
    }
  }, [isDark])

  const stepLabelClasses = useMemo(() => {
    return {
      completed: ['text-xs font-medium uppercase tracking-wide transition-colors', isDark ? 'text-slate-200' : 'text-slate-700'].join(' '),
      current: ['text-xs font-semibold uppercase tracking-wide transition-colors', isDark ? 'text-white' : 'text-slate-900'].join(' '),
      upcoming: ['text-xs font-medium uppercase tracking-wide transition-colors', isDark ? 'text-slate-400' : 'text-slate-500'].join(' '),
    }
  }, [isDark])

  return (
    <>
      <Navigation theme={theme} />
      <main className={containerClass}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => router.back()} className={backButtonClass}>
              ← Back
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
            <div className="space-y-6">
              <div className="space-y-3">
                <span className={badgeClass}>Step 2 of 4</span>
                <h1 className={headingClass}>Craft prompts for precise analysis</h1>
                <p className={descriptionClass}>
                  Define the questions you want our AI to explore. Mix manual prompts with AI-generated suggestions to cover every angle.
                </p>
              </div>

              <div className="space-y-6">
                <PromptForm brandId={brandId} onAdded={fetchPrompts} theme={theme} />
                <div className={dividerClass}>
                  <span className="flex-1 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)' }} />
                  <span>or</span>
                  <span className="flex-1 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)' }} />
                </div>
                <SuggestPromptsButton brandId={brandId} onSuggested={fetchPrompts} theme={theme} />
              </div>
            </div>
          </div>

          <div className={listCardClass}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className={`text-xl font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Your Prompts ({prompts.length})
                </h2>
                <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Aim for at least three prompts to unlock the best insights.
                </p>
              </div>
              {prompts.length >= 3 && <span className={readyBadgeClass}>Ready</span>}
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-slate-900'}`} />
              </div>
            ) : prompts.length === 0 ? (
              <div className="py-12 text-center">
                <div
                  className={[
                    'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
                    isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700',
                  ].join(' ')}
                >
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className={`text-base font-semibold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No prompts yet
                </h3>
                <p className={`mt-2 text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Add your first prompt or let AI suggest ideas above.
                </p>
              </div>
            ) : (
              <PromptList prompts={prompts} onDelete={fetchPrompts} theme={theme} />
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/brands/${brandId}/competitors`)}
              className={nextButtonClass}
            >
              Next: add competitors
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
