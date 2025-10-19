import { Score } from '@/types/score'

interface ScoreCardProps {
  score: Score
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const getScoreStyle = (value: number) => {
    if (value >= 80) return {
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      icon: '🌟'
    }
    if (value >= 60) return {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      icon: '✨'
    }
    if (value >= 40) return {
      gradient: 'from-yellow-500 to-orange-500',
      bg: 'from-yellow-50 to-orange-50',
      border: 'border-yellow-200',
      icon: '💡'
    }
    return {
      gradient: 'from-red-500 to-pink-500',
      bg: 'from-red-50 to-pink-50',
      border: 'border-red-200',
      icon: '🎯'
    }
  }

  const dimensionData: Record<string, { label: string; icon: string }> = {
    awareness: { label: 'Brand Awareness', icon: '👁️' },
    consideration: { label: 'Consideration', icon: '🤔' },
    preference: { label: 'Preference', icon: '❤️' },
    purchase_intent: { label: 'Purchase Intent', icon: '🛒' },
    loyalty: { label: 'Loyalty', icon: '🏆' },
    advocacy: { label: 'Advocacy', icon: '📢' },
  }

  const style = getScoreStyle(score.score)
  const dimension = dimensionData[score.dimension] || { label: score.dimension, icon: '📊' }

  return (
    <div className={`bg-gradient-to-br ${style.bg} border-2 ${style.border} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${style.gradient} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
            {dimension.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {dimension.label}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-20 bg-white/50 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${style.gradient}`}
                  style={{ width: `${score.score}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={`bg-gradient-to-r ${style.gradient} text-white px-4 py-2 rounded-xl font-bold text-xl`}>
          {score.score}
        </div>
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">
        {score.reasoning}
      </p>
    </div>
  )
}
