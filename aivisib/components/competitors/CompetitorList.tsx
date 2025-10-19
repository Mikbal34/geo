'use client'

import { Competitor } from '@/types/competitor'

export default function CompetitorList({ competitors }: { competitors: Competitor[] }) {
  return (
    <div className="space-y-2">
      {competitors.map((comp) => (
        <div key={comp.id} className="border p-3 rounded-lg">
          <p className="font-medium">{comp.competitor_name}</p>
          <p className="text-sm text-gray-600">{comp.competitor_domain}</p>
          <p className="text-sm text-gray-500">{comp.region}</p>
          {comp.is_ai_generated && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">
              AI Generated
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
