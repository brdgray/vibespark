import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Zap, ArrowUp, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const stageConfig: Record<string, { label: string; color: string }> = {
  idea:        { label: 'Idea',        color: 'bg-slate-100 text-slate-600' },
  prototype:   { label: 'Prototype',   color: 'bg-blue-50 text-blue-600' },
  mvp:         { label: 'MVP',         color: 'bg-violet-50 text-violet-600' },
  live:        { label: 'Live',        color: 'bg-green-50 text-green-600' },
  growing:     { label: 'Growing',     color: 'bg-emerald-50 text-emerald-700' },
  monetizing:  { label: 'Monetizing', color: 'bg-amber-50 text-amber-700' },
  scaling:     { label: 'Scaling',     color: 'bg-orange-50 text-orange-700' },
}

function SparkRing({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-orange-500 bg-orange-50 border-orange-200' :
    score >= 40 ? 'text-amber-500 bg-amber-50 border-amber-200' :
                  'text-slate-400 bg-slate-50 border-slate-200'
  return (
    <div className={cn('inline-flex flex-col items-center justify-center rounded-2xl border px-3 py-1.5 min-w-[52px]', color)}>
      <div className="flex items-center gap-0.5">
        <Zap className="h-3 w-3 fill-current" />
        <span className="text-sm font-bold tabular-nums leading-none">{score}</span>
      </div>
      <span className="text-[9px] font-medium opacity-70 mt-0.5 leading-none">Spark</span>
    </div>
  )
}

export default function StartupCard({
  name, slug, tagline, logoPath, category, stage,
  verificationStatus, isPromoted, isFeatured,
  sparkScore = 0, wouldUsePct = 0, researchCount = 0, supportCount = 0,
}: StartupCardProps) {
  const isVerified = verificationStatus === 'verified'
  const stageKey = (stage ?? '').toLowerCase()
  const stageCfg = stageConfig[stageKey]

  return (
    <Link href={`/startups/${slug}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-3xl">
      <div
        className={cn(
          'relative h-full flex flex-col rounded-3xl border bg-white overflow-hidden',
          'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-200',
          isPromoted && 'border-orange-300',
          isFeatured && 'ring-2 ring-orange-400 ring-offset-1',
        )}
      >
        {/* Promoted ribbon */}
        {isPromoted && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />
        )}

        {/* Top accent gradient for featured */}
        {isFeatured && !isPromoted && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-400 via-orange-400 to-amber-400" />
        )}

        <div className="flex-1 p-5">
          {/* Promoted label */}
          {isPromoted && (
            <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-semibold text-orange-600 uppercase tracking-wide">
              <Zap className="h-2.5 w-2.5" /> Promoted
            </div>
          )}

          {/* Logo + Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0 w-12 h-12 rounded-2xl border bg-slate-50 overflow-hidden flex items-center justify-center shadow-sm">
              {logoPath ? (
                <Image
                  src={logoPath}
                  alt={`${name} logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-slate-400 select-none">{name[0]}</span>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 group-hover:text-orange-500 transition-colors leading-tight">
                  {name}
                </h3>
                {isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                )}
              </div>
            </div>

            {/* Spark score badge (top right) */}
            <SparkRing score={sparkScore} />
          </div>

          {/* Tagline */}
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3">
            {tagline}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {category && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {category}
              </span>
            )}
            {stageCfg && (
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', stageCfg.color)}>
                {stageCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Metrics footer */}
        <div className="border-t bg-slate-50/70 px-5 py-3 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-orange-400" />
              <span className="text-sm font-bold text-slate-800 tabular-nums">{supportCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Supporters</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200">
            <div className="flex items-center gap-1">
              <FlaskConical className="h-3 w-3 text-blue-400" />
              <span className="text-sm font-bold text-slate-800 tabular-nums">{researchCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Research</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-green-600 tabular-nums">{wouldUsePct}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Would Use</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
