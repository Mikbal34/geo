'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Globe2, Loader2, LogOut, Moon, Plus, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

interface Project {
  id: string
  brand_name: string
  domain: string
  region: string
  created_at: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
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

  const fetchProjects = async (token: string) => {
    try {
      const res = await fetch('/api/brands', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      if (!res.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await res.json()
      setProjects(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchProjects(token)
  }, [router])

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const containerClass = [
    'relative min-h-screen px-4 pb-16 pt-20 transition-colors',
    isDark
      ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900'
      : 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
  ].join(' ')

  const headingColor = isDark ? 'text-white' : 'text-slate-900'
  const subheadingColor = isDark ? 'text-slate-400' : 'text-slate-500'
  const panelClass = [
    'rounded-3xl border p-6 shadow-lg transition-all sm:p-8',
    isDark
      ? 'border-white/10 bg-white/5 shadow-black/30 backdrop-blur-xl'
      : 'border-slate-200 bg-white shadow-slate-200/70',
  ].join(' ')
  const badgeClass = [
    'inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
    isDark
      ? 'border-white/10 bg-white/10 text-slate-200'
      : 'border-slate-200 bg-white text-slate-600 shadow-sm',
  ].join(' ')
  const primaryButtonClass = [
    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    isDark
      ? 'bg-white text-black hover:bg-slate-100 focus:ring-white/70 focus:ring-offset-slate-950'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 focus:ring-offset-white',
  ].join(' ')
  const secondaryButtonClass = [
    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    isDark
      ? 'border border-white/10 text-slate-200 hover:border-red-400 hover:text-red-300 focus:ring-white/20 focus:ring-offset-slate-950'
      : 'border border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-500 focus:ring-slate-200 focus:ring-offset-white',
  ].join(' ')
  const toggleButtonClass = [
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2',
    isDark
      ? 'border-white/10 bg-white/10 text-slate-100 hover:bg-white/20 focus:ring-white/30 focus:ring-offset-0'
      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-800 shadow-sm focus:ring-slate-200 focus:ring-offset-2 focus:ring-offset-white',
  ].join(' ')
  const projectCardClass = [
    'group rounded-3xl border p-6 transition-all duration-300',
    isDark
      ? 'border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-xl hover:border-white/20 hover:shadow-black/40'
      : 'border-slate-200 bg-white shadow-lg shadow-slate-200/60 hover:border-slate-300 hover:shadow-slate-300/80',
  ].join(' ')
  const regionBadgeClass = [
    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
    isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600',
  ].join(' ')
  const metaTextClass = ['text-sm', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')
  const dividerClass = isDark ? 'border-white/10' : 'border-slate-200'
  const errorPanelClass = [
    'rounded-2xl border p-4',
    isDark ? 'border-red-900 bg-red-950/40' : 'border-red-200 bg-red-50',
  ].join(' ')
  const errorTextClass = ['text-sm', isDark ? 'text-red-400' : 'text-red-600'].join(' ')
  const emptyPanelClass = [
    'rounded-3xl border p-12 text-center transition-all',
    isDark
      ? 'border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-xl'
      : 'border-slate-200 bg-white shadow-xl shadow-slate-200/70',
  ].join(' ')
  const emptyIconWrapperClass = [
    'mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl',
    isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700',
  ].join(' ')
  const viewTextClass = [
    'text-sm font-semibold transition-colors',
    isDark ? 'text-white group-hover:text-slate-100' : 'text-slate-700 group-hover:text-slate-900',
  ].join(' ')

  if (loading) {
    return (
      <div className={containerClass}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className={panelClass}>
            <div className="flex flex-col items-center gap-4">
              <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-slate-900'}`} />
              <p className={`text-sm ${subheadingColor}`}>Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <div className={badgeClass}>Project overview</div>
            <div className="space-y-2">
              <h1 className={`text-3xl font-semibold sm:text-4xl ${headingColor}`}>
                My Projects
              </h1>
              <p className={`text-sm sm:text-base ${subheadingColor}`}>
                {user?.email ? `Signed in as ${user.email}` : 'Your latest brand insights live here.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/brands/new" className={primaryButtonClass}>
              <Plus className="h-4 w-4" />
              New project
            </Link>
            <button type="button" onClick={handleLogout} className={secondaryButtonClass}>
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className={errorPanelClass}>
            <div className="flex items-start gap-3">
              <svg
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-500'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={errorTextClass}>{error}</p>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className={emptyPanelClass}>
            <div className={emptyIconWrapperClass}>
              <Plus className="h-7 w-7" />
            </div>
            <h2 className={`text-2xl font-semibold ${headingColor}`}>No projects yet</h2>
            <p className={`mx-auto mt-2 max-w-md text-sm sm:text-base ${subheadingColor}`}>
              Create your first project to unlock AI-powered visibility tracking and competitive monitoring.
            </p>
            <Link href="/brands/new" className={`${primaryButtonClass} mt-6 inline-flex`}>
              <Plus className="h-4 w-4" />
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/brands/${project.id}`} className={projectCardClass}>
                <div className="flex items-start justify-between">
                  <div
                    className={[
                      'flex h-12 w-12 items-center justify-center rounded-2xl transition-transform',
                      isDark ? 'bg-white/10 text-white group-hover:scale-110' : 'bg-slate-100 text-slate-700 group-hover:scale-110',
                    ].join(' ')}
                  >
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <span className={regionBadgeClass}>{project.region}</span>
                </div>

                <h3
                  className={[
                    'mt-6 text-xl font-semibold transition-colors',
                    isDark ? 'text-white group-hover:text-slate-100' : 'text-slate-800 group-hover:text-slate-900',
                  ].join(' ')}
                >
                  {project.brand_name}
                </h3>

                <div className={`mt-3 flex items-center gap-2 ${metaTextClass}`}>
                  <Globe2 className="h-4 w-4 opacity-75" />
                  <span>{project.domain}</span>
                </div>

                <p className={`mt-1 text-xs ${subheadingColor}`}>
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>

                <div className={`mt-6 flex items-center justify-between border-t pt-4 transition-colors ${dividerClass}`}>
                  <span className={viewTextClass}>View project</span>
                  <ArrowRight
                    className={[
                      'h-5 w-5 transition-transform',
                      isDark ? 'text-white group-hover:translate-x-1' : 'text-slate-700 group-hover:translate-x-1',
                    ].join(' ')}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
