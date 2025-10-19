'use client'

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Score } from '@/types/score'

interface RadarChartProps {
  scores: Score[]
}

export default function RadarChart({ scores }: RadarChartProps) {
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
  }))

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Performance Radar</h3>
          <p className="text-sm text-slate-500">360° view of all dimensions</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsRadar data={data}>
          <PolarGrid stroke="#e2e8f0" strokeWidth={1.5} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
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
            itemStyle={{ color: '#a855f7' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="url(#colorGradient)"
            strokeWidth={3}
            fill="url(#colorGradient)"
            fillOpacity={0.6}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  )
}
