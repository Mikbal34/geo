'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Moon, Sun } from 'lucide-react'

import BrandForm from '@/components/brand/BrandForm'
import Navigation from '@/components/layout/Navigation'

type Theme = 'light' | 'dark'

const steps = [
  { title: 'Brand Info', state: 'current' as const },
  { title: 'Prompts', state: 'upcoming' as const },
  { title: 'Competitors', state: 'upcoming' as const },
  { title: 'Analysis', state: 'upcoming' as const },
]

export default function NewBrandPage() {
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
  const backLinkClass = [
    'inline-flex items-center gap-2 text-sm font-medium transition-colors',
    isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900',
  ].join(' ')
  const stepsPanelClass = [
    'rounded-3xl border px-6 py-5 shadow-sm transition-colors',
    isDark ? 'border-white/10 bg-white/5 backdrop-blur-xl' : 'border-slate-200 bg-white',
  ].join(' ')
  const stepConnectorClass = ['h-0.5 w-8 rounded-full transition-colors', isDark ? 'bg-white/20' : 'bg-slate-200'].join(' ')
  const stepCircleActiveClass = [
    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
    isDark ? 'bg-white text-black' : 'bg-slate-900 text-white',
  ].join(' ')
  const stepCircleInactiveClass = [
    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
    isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500',
  ].join(' ')
  const stepLabelActiveClass = ['text-xs font-semibold uppercase tracking-wide transition-colors', isDark ? 'text-white' : 'text-slate-900'].join(' ')
  const stepLabelInactiveClass = ['text-xs font-medium uppercase tracking-wide transition-colors', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')
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

  return (
    <>
      <Navigation theme={theme} />
      <main className={containerClass}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className={backLinkClass}>
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
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
              {steps.map((step, index) => (
                <div key={step.title} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={step.state === 'current' ? stepCircleActiveClass : stepCircleInactiveClass}>
                      {index + 1}
                    </div>
                    <span className={step.state === 'current' ? stepLabelActiveClass : stepLabelInactiveClass}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && <div className={stepConnectorClass} />}
                </div>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <div className="space-y-6">
              <div className="space-y-3">
                <span className={badgeClass}>Step 1 of 4</span>
                <h1 className={headingClass}>Create your brand profile</h1>
                <p className={descriptionClass}>
                  Let&apos;s start by setting up your brand&apos;s basic information. This ensures we tailor insights and analysis to your market and goals.
                </p>
              </div>

              <BrandForm theme={theme} />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
