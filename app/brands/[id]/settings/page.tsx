'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import AutoAnalysisSettings from '@/components/brands/AutoAnalysisSettings'
import { Settings as SettingsIcon, ArrowLeft, Sparkles, Moon, Sun } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const params = useParams()
  const brandId = params.id as string

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const isDark = theme === 'dark'

  useEffect(() => {
    const storedTheme = localStorage.getItem('auth_theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('auth_theme', theme)
  }, [theme])

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

  return (
    <>
      <Navigation theme={theme} />
      <main className={containerClass}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          <div className={panelClass}>
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                <SettingsIcon className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <h1 className={`text-3xl font-semibold ${strongTextClass}`}>Brand settings</h1>
                <p className={`text-sm ${mutedTextClass}`}>
                  Configure automatic analysis cadence, future notifications, and workspace preferences.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={panelClass}>
              <h2 className={`text-lg font-semibold ${strongTextClass}`}>Automatic analysis</h2>
              <p className={`text-sm ${mutedTextClass}`}>Control cadence and timing of automated runs.</p>
              <div className={`mt-4 ${subPanelClass}`}>
                <AutoAnalysisSettings brandId={brandId} />
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex items-center gap-3 border-b pb-4">
                <span className={`${chipClass} inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                  Coming soon
                </span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div className={`mt-4 grid gap-4 sm:grid-cols-2`}>
                <div className={subPanelClass}>
                  <h3 className={`text-sm font-semibold ${strongTextClass}`}>Notifications</h3>
                  <p className={`text-xs ${mutedTextClass}`}>
                    Configure Slack, email, and webhook alerts for run completions.
                  </p>
                </div>
                <div className={subPanelClass}>
                  <h3 className={`text-sm font-semibold ${strongTextClass}`}>Team access</h3>
                  <p className={`text-xs ${mutedTextClass}`}>
                    Manage collaborators and fine-grained permissions for this brand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
