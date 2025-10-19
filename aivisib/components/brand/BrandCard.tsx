import { Brand } from '@/types/brand'
import { formatDate } from '@/lib/utils/formatting'
import { Globe, MapPin, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface BrandCardProps {
  brand: Brand
}

export default function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link href={`/brands/${brand.id}/dashboard`}>
      <div className="group bg-white rounded-2xl shadow-lg shadow-slate-200/50 border-2 border-slate-200 p-6 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-200/50 transition-all duration-300 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-gradient transition-colors">
              {brand.brand_name}
            </h2>
            <div className="flex items-center gap-2 text-slate-600">
              <Globe className="w-4 h-4" />
              <span className="text-sm">{brand.domain}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowRight className="w-6 h-6 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Region</p>
              <p className="text-sm font-semibold text-slate-900">{brand.region}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Created</p>
              <p className="text-sm font-semibold text-slate-900">{formatDate(brand.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Hover Effect Indicator */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium text-purple-600">View Dashboard</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </Link>
  )
}
