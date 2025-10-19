'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Sparkles, Plus, Home, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  
  const isHome = pathname === '/'

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-900">
                Brand Decoder
              </h1>
              <p className="text-xs text-slate-500 -mt-1">AI-Powered Insights</p>
            </div>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            {!isHome && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="hidden md:flex"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="hidden sm:flex"
                >
                  ← Back
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={() => router.push('/brands/new')}
              className="group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="hidden sm:inline">New Brand</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
