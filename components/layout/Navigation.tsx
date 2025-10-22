'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Sparkles, Home } from 'lucide-react'

type Theme = 'light' | 'dark'

interface NavigationProps {
  theme?: Theme
}

export default function Navigation({ theme = 'dark' }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isDark = theme === 'dark'

  const navClass = [
    'sticky top-0 z-50 backdrop-blur-xl border-b transition-colors',
    isDark ? 'bg-black border-slate-800/50 shadow-black/20' : 'bg-white/90 border-slate-200 shadow-slate-200/60',
  ].join(' ')
  const logoWrapperClass = [
    'flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
    isDark ? 'bg-white text-black' : 'bg-slate-900 text-white',
  ].join(' ')
  const brandTitleClass = ['text-xl font-bold transition-colors', isDark ? 'text-white' : 'text-slate-900'].join(' ')
  const taglineClass = ['text-xs transition-colors', isDark ? 'text-slate-400' : 'text-slate-500'].join(' ')
  const homeButtonClass = [
    'hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
    isDark ? 'text-white hover:text-slate-300' : 'text-slate-700 hover:text-slate-900',
  ].join(' ')
  const backButtonClass = [
    'hidden sm:flex items-center px-3 py-1.5 text-sm font-medium transition-colors rounded-lg',
    isDark ? 'bg-white text-black hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800',
  ].join(' ')

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 group"
          >
            <div className={logoWrapperClass}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className={brandTitleClass}>
                ai visibility
              </h1>
              <p className={`${taglineClass} -mt-1`}>AI-Powered Insights</p>
            </div>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            {!isHome && (
              <>
                <button
                  onClick={() => router.push('/')}
                  className={homeButtonClass}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
                <button
                  onClick={() => router.back()}
                  className={backButtonClass}
                >
                  ← Back
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
