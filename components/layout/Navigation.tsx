'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Sparkles, Home } from 'lucide-react'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  const isHome = pathname === '/'

  return (
    <nav className="sticky top-0 z-50 bg-black backdrop-blur-xl border-b border-slate-800/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">
                ai visibility
              </h1>
              <p className="text-xs text-slate-400 -mt-1">AI-Powered Insights</p>
            </div>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            {!isHome && (
              <>
                <button
                  onClick={() => router.push('/')}
                  className="hidden md:flex items-center gap-1.5 text-white px-3 py-1.5 text-sm font-medium hover:text-slate-300 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
                <button
                  onClick={() => router.back()}
                  className="hidden sm:flex items-center bg-white text-black px-3 py-1.5 text-sm font-medium hover:bg-slate-100 transition-colors"
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
