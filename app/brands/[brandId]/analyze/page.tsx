'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { Zap, CheckCircle2, AlertCircle, Sparkles, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AnalyzePage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.brandId as string
  const [status, setStatus] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [brandId])

  const fetchStatus = async () => {
    const res = await fetch(`/api/analyze/status?brandId=${brandId}`)
    const data = await res.json()
    setStatus(data)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)

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

      // Redirect to dashboard on success
      router.push(`/brands/${brandId}/dashboard`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const canAnalyze = status?.state === 'READY' || status?.state === 'ANALYZED'
  const dimensions = [
    '👁️ Brand Awareness',
    '🤔 Consideration',
    '❤️ Preference',
    '🛒 Purchase Intent',
    '🏆 Loyalty',
    '📢 Advocacy'
  ]

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text text-sm font-bold tracking-wider uppercase">
                Step 4 of 4
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-pulse">
                <Zap className="w-9 h-9 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              AI Analysis
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Run comprehensive AI-powered analysis across 6 critical brand dimensions
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Analysis Status</h2>
            </div>
            {status && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-1">{status.state}</div>
                  <div className="text-sm text-slate-400">Current State</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-3xl font-bold text-purple-400 mb-1">{status.promptCount}</div>
                  <div className="text-sm text-slate-400">Prompts Added</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-3xl font-bold text-pink-400 mb-1">{status.scoreCount}</div>
                  <div className="text-sm text-slate-400">Previous Scores</div>
                </div>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 backdrop-blur-xl border-2 border-red-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-1">Analysis Error</h3>
                  <p className="text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Alert */}
          {!canAnalyze && (
            <div className="bg-yellow-500/10 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-1">Not Ready</h3>
                  <p className="text-yellow-200">Please add at least one prompt before running analysis.</p>
                </div>
              </div>
            </div>
          )}

          {/* Dimensions Grid */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Analysis Dimensions</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {dimensions.map((dimension, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">{dimension}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-300 text-sm">
                GPT-4 Turbo will analyze your brand comprehensively across all these dimensions, providing detailed scores and actionable insights.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mb-8">
            <Button
              size="xl"
              onClick={handleAnalyze}
              disabled={!canAnalyze || analyzing}
              className={`group ${
                !canAnalyze || analyzing
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Analyzing... Please wait
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Run AI Analysis
                </>
              )}
            </Button>
            {analyzing && (
              <p className="text-slate-400 text-sm mt-4">
                This may take 15-30 seconds. Do not close this page.
              </p>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mt-12 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <span className="text-sm text-slate-400">Brand Info</span>
            </div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <span className="text-sm text-slate-400">Prompts</span>
            </div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <span className="text-sm text-slate-400">Competitors</span>
            </div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                4
              </div>
              <span className="text-sm font-medium text-white">Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
