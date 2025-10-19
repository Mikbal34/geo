'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { Zap, CheckCircle2, AlertCircle, Sparkles, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AnalyzePage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string
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
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block mb-4">
              <span className="bg-slate-900 text-white text-sm font-bold tracking-wider uppercase px-3 py-1 rounded">
                Step 4 of 4
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center animate-pulse">
                <Zap className="w-9 h-9 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              AI Analysis
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Run comprehensive AI-powered analysis across 6 critical brand dimensions
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-4 h-4 text-slate-900" />
              <h2 className="text-xl font-bold text-slate-900">Analysis Status</h2>
            </div>
            {status && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900 mb-1">{status.state}</div>
                  <div className="text-sm text-slate-600">Current State</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900 mb-1">{status.promptCount}</div>
                  <div className="text-sm text-slate-600">Prompts Added</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900 mb-1">{status.scoreCount}</div>
                  <div className="text-sm text-slate-600">Previous Scores</div>
                </div>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-red-600 mb-1">Analysis Error</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Alert */}
          {!canAnalyze && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-yellow-600 mb-1">Not Ready</h3>
                  <p className="text-sm text-yellow-600">Please add at least one prompt before running analysis.</p>
                </div>
              </div>
            </div>
          )}

          {/* Dimensions Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-slate-900" />
              <h2 className="text-xl font-bold text-slate-900">Analysis Dimensions</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {dimensions.map((dimension, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-slate-900 font-medium text-sm">{dimension}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-slate-600 text-sm">
                GPT-4 Turbo will analyze your brand comprehensively across all these dimensions, providing detailed scores and actionable insights.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || analyzing}
              className={`group px-4 py-2.5 text-sm font-medium rounded-lg ${
                !canAnalyze || analyzing
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Analyzing... Please wait
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-colors" />
                  Run AI Analysis
                </>
              )}
            </Button>
            {analyzing && (
              <p className="text-slate-600 text-sm mt-4">
                This may take 15-30 seconds. Do not close this page.
              </p>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Brand Info</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-900" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Prompts</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-900" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Competitors</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-900" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                4
              </div>
              <span className="text-xs font-medium text-slate-900">Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
