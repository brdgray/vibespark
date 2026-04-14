import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Zap } from 'lucide-react'

interface StartupCardProps {
  id: string
  name: string
  slug: string
  tagline: string
  logoPath?: string | null
  category?: string
  stage?: string
  verificationStatus: string
  isPromoted?: boolean
  isFeatured?: boolean
  sparkScore?: number
  wouldUsePct?: number
  researchCount?: number
  supportCount?: number
  saveCount?: number
}

const stageBadgeColors: Record<string, string> = {
  idea: 'bg-slate-100 text-slate-700',
  prototype: 'bg-blue-100 text-blue-700',
  mvp: 'bg-purple-100 text-purple-700',
  live: 'bg-green-100 text-green-700',
  growing: 'bg-emerald-100 text-emerald-700',
  monetizing: 'bg-amber-100 text-amber-700',
  scaling: 'bg-orange-100 text-orange-700',
}

export default function StartupCard({
  name,
  slug,
  tagline,
  logoPath,
  category,
  stage,
  verificationStatus,
  isPromoted,
  isFeatured,
  sparkScore = 0,
  wouldUsePct = 0,
  researchCount = 0,
  supportCount: _supportCount = 0,
  saveCount: _saveCount = 0,
}: StartupCardProps) {
  const isVerified = verificationStatus === 'verified'
  const stageKey = stage?.toLowerCase() ?? ''

  const sparkColor =
    sparkScore >= 70 ? 'text-orange-500' :
    sparkScore >= 40 ? 'text-amber-500' :
    'text-slate-400'

  return (
    <Link href={`/startups/${slug}`} className="block group">
      <Card className={`h-full transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isPromoted ? 'border-orange-300 bg-orange-50/30' : ''
      } ${isFeatured ? 'ring-1 ring-orange-400' : ''}`}>
        {isPromoted && (
          <div className="px-4 pt-2 pb-0">
            <span className="text-[10px] font-medium text-orange-600 uppercase tracking-wide flex items-center gap-1">
              <Zap className="h-3 w-3" /> Promoted
            </span>
          </div>
        )}
        <CardContent className="p-4 space-y-3">
          {/* Logo + Name row */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
              {logoPath ? (
                <Image
                  src={logoPath}
                  alt={`${name} logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xl font-bold text-slate-400">{name[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-slate-900 group-hover:text-orange-500 transition-colors truncate">
                  {name}
                </h3>
                {isVerified && (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{tagline}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {stage && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stageBadgeColors[stageKey] ?? 'bg-slate-100 text-slate-700'}`}>
                {stage}
              </span>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t">
            <div className="text-center">
              <div className={`text-sm font-bold flex items-center justify-center gap-0.5 ${sparkColor}`}>
                <Zap className="h-3 w-3 fill-current" />{sparkScore}
              </div>
              <div className="text-[10px] text-muted-foreground">Spark</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-green-600">{wouldUsePct}%</div>
              <div className="text-[10px] text-muted-foreground">Would Use</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-800">{researchCount}</div>
              <div className="text-[10px] text-muted-foreground">Research</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
