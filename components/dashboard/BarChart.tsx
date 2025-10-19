'use client'

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Score } from '@/types/score'

interface BarChartProps {
  scores: Score[]
}

export default function BarChart({ scores }: BarChartProps) {
  const dimensionLabels: Record<string, string> = {
    awareness: 'Awareness',
    consideration: 'Consideration',
    preference: 'Preference',
    purchase_intent: 'Purchase Intent',
    loyalty: 'Loyalty',
    advocacy: 'Advocacy',
  }

  const data = scores.map((score) => ({
    dimension: dimensionLabels[score.dimension] || score.dimension,
    score: score.score,
    fill: getBarColor(score.score),
  }))

  function getBarColor(value: number) {
    if (value >= 80) return '#10b981' // green
    if (value >= 60) return '#3b82f6' // blue
    if (value >= 40) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Score Comparison</h3>
          <p className="text-sm text-slate-500">Side-by-side dimension analysis</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsBar data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="dimension"
            angle={-15}
            textAnchor="end"
            height={80}
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#cbd5e1"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
            cursor={{ fill: 'rgba(147, 51, 234, 0.1)' }}
          />
          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-slate-600">Excellent (80+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-600">Good (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-slate-600">Fair (40-59)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600">Poor (&lt;40)</span>
        </div>
      </div>
    </div>
  )
}
