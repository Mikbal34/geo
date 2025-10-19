'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function BrandRedirect() {
  const router = useRouter()
  const params = useParams()
  const brandId = params.id as string

  useEffect(() => {
    // Redirect to dashboard
    router.push(`/brands/${brandId}/dashboard`)
  }, [brandId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-purple-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}
