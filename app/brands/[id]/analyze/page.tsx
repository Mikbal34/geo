'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import { Zap, CheckCircle2, AlertCircle, Sparkles, BarChart3 } from 'lucide-react'

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
    'Brand Awareness',
    'Consideration',
    'Preference',
    'Purchase Intent',
    'Loyalty',
    'Advocacy'
  ]

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Brand Info</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Prompts</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
              <span className="text-xs text-slate-400">Competitors</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white flex items-center justify-center text-black text-xs font-bold">
                4
              </div>
              <span className="text-xs font-medium text-white">Analysis</span>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-[#171717] shadow-xl border border-slate-800 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-4 h-4 text-white" />
              <h2 className="text-xl font-bold text-white">Analysis Status</h2>
            </div>
            {status && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] p-5 border border-slate-800">
                  <div className="text-2xl font-bold text-white mb-1">{status.state}</div>
                  <div className="text-sm text-slate-400">Current State</div>
                </div>
                <div className="bg-[#0a0a0a] p-5 border border-slate-800">
                  <div className="text-2xl font-bold text-white mb-1">{status.promptCount}</div>
                  <div className="text-sm text-slate-400">Prompts Added</div>
                </div>
                <div className="bg-[#0a0a0a] p-5 border border-slate-800">
                  <div className="text-2xl font-bold text-white mb-1">{status.scoreCount}</div>
                  <div className="text-sm text-slate-400">Previous Scores</div>
                </div>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-900/20 border-2 border-red-800 p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-red-400 mb-1">Analysis Error</h3>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Alert */}
          {!canAnalyze && (
            <div className="bg-yellow-900/20 border-2 border-yellow-800 p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-yellow-400 mb-1">Not Ready</h3>
                  <p className="text-sm text-yellow-400">Please add at least one prompt before running analysis.</p>
                </div>
              </div>
            </div>
          )}

          {/* Dimensions Grid */}
          <div className="bg-[#171717] shadow-xl border border-slate-800 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <h2 className="text-xl font-bold text-white">Analysis Dimensions</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {dimensions.map((dimension, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#0a0a0a] p-4 border border-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium text-sm">{dimension}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-slate-400 text-sm">
                GPT-4 Turbo will analyze your brand comprehensively across all these dimensions, providing detailed scores and actionable insights.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || analyzing}
              className={`group flex items-center justify-center gap-2 bg-white text-black px-6 py-3 hover:bg-slate-100 disabled:opacity-50 transition-colors mx-auto ${
                !canAnalyze || analyzing
                  ? 'cursor-not-allowed'
                  : ''
              }`}
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                  Analyzing... Please wait
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Run AI Analysis
                </>
              )}
            </button>
            {analyzing && (
              <p className="text-slate-400 text-sm mt-4">
                This may take 15-30 seconds. Do not close this page.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
