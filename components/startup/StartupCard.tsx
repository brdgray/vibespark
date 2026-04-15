import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Zap, ArrowUp, FlaskConical, Star, Sparkles } from 'lucide-react'
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
  highlightBadge?: 'featured' | 'spotlight' | 'none'
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

function SparkRing({ score, featured }: { score: number; featured?: boolean }) {
  if (featured) {
    return (
      <div
        className={cn(
          'inline-flex flex-col items-center justify-center rounded-2xl border px-3 py-1.5 min-w-[56px]',
          'border-orange-300 bg-orange-50 shadow-sm',
        )}
      >
        <div className="flex items-center gap-0.5 text-orange-600">
          <Zap className="h-3.5 w-3.5 fill-orange-500 text-orange-600" />
          <span className="text-base font-extrabold tabular-nums leading-none tracking-tight text-orange-600">
            {score}
          </span>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-700/80 mt-0.5 leading-none">
          Spark
        </span>
      </div>
    )
  }

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
  highlightBadge,
  sparkScore = 0, wouldUsePct = 0, researchCount = 0, supportCount = 0,
}: StartupCardProps) {
  const isVerified = verificationStatus === 'verified'
  const stageKey = (stage ?? '').toLowerCase()
  const stageCfg = stageConfig[stageKey]

  const showTopAccent = isPromoted || isFeatured

  const badge: 'featured' | 'spotlight' | 'none' = !isFeatured
    ? 'none'
    : highlightBadge ?? 'featured'

  return (
    <Link
      href={`/startups/${slug}`}
      className={cn(
        'block group focus:outline-none focus-visible:ring-2 rounded-3xl',
        isFeatured ? 'focus-visible:ring-orange-400' : 'focus-visible:ring-orange-400',
      )}
    >
      <div
        className={cn(
          'relative h-full flex flex-col rounded-3xl border overflow-hidden',
          'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
          isFeatured
            ? 'bg-gradient-to-b from-slate-100 to-slate-50/95 border-slate-300/90 shadow-sm ring-1 ring-orange-200/50 hover:ring-orange-300/70 hover:border-orange-300/80'
            : 'bg-white border-slate-200/80 hover:border-orange-200 hover:shadow-slate-200/50',
          !isFeatured && isPromoted && 'border-orange-300',
        )}
      >
        {showTopAccent && (
          <div
            className={cn(
              'h-1 w-full shrink-0',
              isFeatured && isPromoted && 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500',
              isFeatured && !isPromoted && 'bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500',
              !isFeatured && isPromoted && 'bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400',
            )}
          />
        )}

        <div className="flex-1 p-5">
          <div className="flex flex-wrap gap-2 mb-3">
            {badge === 'featured' && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  'border-amber-300 bg-amber-50 text-amber-900',
                )}
              >
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-600" /> Featured
              </span>
            )}
            {badge === 'spotlight' && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  'border-sky-300 bg-sky-50 text-sky-900',
                )}
              >
                <Sparkles className="h-2.5 w-2.5 text-sky-600" /> Spotlight
              </span>
            )}
            {isPromoted && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  isFeatured
                    ? 'border-orange-300 bg-orange-50 text-orange-900'
                    : 'bg-orange-50 border border-orange-200 text-orange-600',
                )}
              >
                <Zap className="h-2.5 w-2.5" /> Promoted
              </span>
            )}
          </div>

          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                'shrink-0 w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm',
                isFeatured
                  ? 'bg-white border border-slate-200'
                  : 'border bg-slate-50',
              )}
            >
              {logoPath ? (
                <Image
                  src={logoPath}
                  alt={`${name} logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span
                  className={cn(
                    'text-lg font-bold select-none',
                    isFeatured ? 'text-slate-400' : 'text-slate-400',
                  )}
                >
                  {name[0]}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3
                  className={cn(
                    'font-bold leading-tight transition-colors',
                    isFeatured
                      ? 'text-slate-900 group-hover:text-orange-600'
                      : 'text-slate-900 group-hover:text-orange-500',
                  )}
                >
                  {name}
                </h3>
                {isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                )}
              </div>
            </div>

            <SparkRing score={sparkScore} featured={isFeatured} />
          </div>

          <p
            className={cn(
              'text-sm leading-relaxed line-clamp-2 mb-3',
              isFeatured ? 'text-slate-600' : 'text-slate-500',
            )}
          >
            {tagline}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {category && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                  isFeatured ? 'bg-white/80 border border-slate-200/80 text-slate-700' : 'bg-slate-100 text-slate-600',
                )}
              >
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

        <div
          className={cn(
            'border-t px-5 py-3 grid grid-cols-3 gap-2',
            isFeatured
              ? 'bg-slate-100/90 border-slate-300/60'
              : 'border-slate-200 bg-slate-50/70',
          )}
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-orange-500" />
              <span className="text-sm font-bold tabular-nums text-slate-800">{supportCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Supporters</span>
          </div>
          <div className={cn('flex flex-col items-center border-x', isFeatured ? 'border-slate-300/50' : 'border-slate-200')}>
            <div className="flex items-center gap-1">
              <FlaskConical className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-bold tabular-nums text-slate-800">{researchCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Research</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold tabular-nums text-green-600">{wouldUsePct}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Would Use</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
