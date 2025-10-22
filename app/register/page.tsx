'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      router.push('/projects')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const containerClass = [
    'relative min-h-screen flex items-center justify-center px-4 py-12',
    isDark
      ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900'
      : 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
  ].join(' ')

  const badgeClass = [
    'inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-medium transition-colors',
    isDark
      ? 'border-white/10 bg-white/10 text-slate-100'
      : 'border-slate-200 bg-white text-slate-600 shadow-sm',
  ].join(' ')

  const heroTitleClass = [
    'text-4xl font-semibold tracking-tight sm:text-5xl',
    isDark ? 'text-white' : 'text-slate-900',
  ].join(' ')

  const heroDescriptionClass = [
    'text-base leading-relaxed sm:text-lg',
    isDark ? 'text-slate-400' : 'text-slate-500',
  ].join(' ')

  const insightsTitleClass = [
    'font-semibold',
    isDark ? 'text-slate-200' : 'text-slate-600',
  ].join(' ')

  const insightsTextClass = isDark ? 'text-slate-400' : 'text-slate-400'

  const cardClass = [
    'w-full max-w-md rounded-3xl border p-8 sm:p-10 transition-colors',
    isDark
      ? 'border-white/10 bg-white/5 shadow-xl shadow-slate-900/40 backdrop-blur-xl'
      : 'border-slate-200 bg-white shadow-xl shadow-slate-200/60',
  ].join(' ')

  const cardTitleClass = [
    'text-2xl font-semibold',
    isDark ? 'text-white' : 'text-slate-900',
  ].join(' ')

  const cardDescriptionClass = [
    'mt-2 text-sm',
    isDark ? 'text-slate-400' : 'text-slate-500',
  ].join(' ')

  const labelClass = [
    'mb-2 block text-sm font-medium',
    isDark ? 'text-slate-200' : 'text-slate-700',
  ].join(' ')

  const inputClass = [
    'w-full rounded-xl border px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 transition-colors',
    isDark
      ? 'border-[#2a2a2a] bg-[#171717] text-white placeholder-slate-500 focus:border-slate-500 focus:ring-slate-600/50'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200',
  ].join(' ')

  const helperTextClass = [
    'mt-2 text-xs',
    isDark ? 'text-slate-400' : 'text-slate-500',
  ].join(' ')

  const errorContainerClass = [
    'rounded-2xl border p-4',
    isDark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50',
  ].join(' ')

  const errorIconClass = [
    'mt-0.5 h-5 w-5 flex-shrink-0',
    isDark ? 'text-red-400' : 'text-red-500',
  ].join(' ')

  const errorTextClass = ['text-sm', isDark ? 'text-red-400' : 'text-red-600'].join(' ')

  const buttonClass = [
    'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-950'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
  ].join(' ')

  const footerTextClass = [
    'mt-8 text-center text-sm',
    isDark ? 'text-slate-400' : 'text-slate-500',
  ].join(' ')

  const footerLinkClass = [
    'font-medium transition-colors',
    isDark ? 'text-white hover:text-slate-200' : 'text-slate-700 hover:text-slate-900',
  ].join(' ')

  const toggleButtonClass = [
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2',
    isDark
      ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/20 focus:ring-white/30 focus:ring-offset-0'
      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-800 shadow-sm focus:ring-slate-200 focus:ring-offset-2 focus:ring-offset-white',
  ].join(' ')

  return (
    <div className={containerClass}>
      <div className="absolute right-6 top-6">
        <button
          type="button"
          onClick={toggleTheme}
          className={toggleButtonClass}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-pressed={isDark}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      <div className="w-full max-w-5xl flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-6 text-center lg:text-left">
          <span className={badgeClass}>Create your workspace</span>
          <h1 className={heroTitleClass}>Your brand intelligence hub starts here</h1>
          <p className={heroDescriptionClass}>
            Register to launch AI-powered monitoring, collaborate with your team, and stay ahead of competitor
            moves—all from one control center.
          </p>
          <div className="hidden items-start gap-8 text-sm lg:flex">
            <div>
              <p className={insightsTitleClass}>Guided onboarding</p>
              <p className={insightsTextClass}>We’ll suggest competitors and prompts tailored to your industry.</p>
            </div>
            <div>
              <p className={insightsTitleClass}>Enterprise-ready</p>
              <p className={insightsTextClass}>Role-based access and audit trails as your team scales.</p>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-6">
            <h2 className={cardTitleClass}>Create your account</h2>
            <p className={cardDescriptionClass}>A few details and you’re ready to start tracking.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={labelClass}>Email address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputClass}
                placeholder="Password"
              />
              <p className={helperTextClass}>Use at least 8 characters with uppercase, lowercase, and numbers.</p>
            </div>

            <div>
              <label className={labelClass}>Confirm password</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className={inputClass}
                placeholder="Confirm password"
              />
            </div>

            {error && (
              <div className={errorContainerClass}>
                <div className="flex items-start gap-3">
                  <svg className={errorIconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={errorTextClass}>{error}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className={footerTextClass}>
            Already have an account?{' '}
            <Link href="/login" className={footerLinkClass}>
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
