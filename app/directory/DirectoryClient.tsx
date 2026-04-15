'use client'

import { useState, useMemo } from 'react'
import StartupCard from '@/components/startup/StartupCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal, X, CheckCircle2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DirectoryClientProps {
  startups: any[]
  categories: any[]
  stages: any[]
}

const sortOptions = [
  { value: 'trending',       label: '🔥 Trending' },
  { value: 'spark',          label: '⚡ Top Spark Score' },
  { value: 'would_use',      label: '👍 Most Would Use' },
  { value: 'newest',         label: '🆕 Newest' },
  { value: 'most_researched',label: '🔬 Most Researched' },
  { value: 'featured',       label: '⭐ Featured First' },
]

export default function DirectoryClient({ startups, categories, stages }: DirectoryClientProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__')
  const [selectedStage, setSelectedStage] = useState<string>('__all__')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('trending')

  const filtered = useMemo(() => {
    let result = [...startups]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.startup_categories?.name?.toLowerCase().includes(q)
      )
    }

    if (selectedCategory && selectedCategory !== '__all__') {
      result = result.filter(s => s.category_id === selectedCategory)
    }

    if (selectedStage && selectedStage !== '__all__') {
      result = result.filter(s => s.stage_id === selectedStage)
    }

    if (verifiedOnly) {
      result = result.filter(s => s.verification_status === 'verified')
    }

    result.sort((a, b) => {
      const am = a.startup_spark_score_metrics?.[0] ?? {}
      const bm = b.startup_spark_score_metrics?.[0] ?? {}
      switch (sortBy) {
        case 'trending':       return (bm.trending_score ?? 0) - (am.trending_score ?? 0)
        case 'spark':          return (bm.spark_score ?? 0) - (am.spark_score ?? 0)
        case 'would_use':      return (bm.would_use_pct ?? 0) - (am.would_use_pct ?? 0)
        case 'newest':         return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'most_researched':return (bm.total_research_responses ?? 0) - (am.total_research_responses ?? 0)
        case 'featured':       return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        default:               return 0
      }
    })

    return result
  }, [startups, search, selectedCategory, selectedStage, verifiedOnly, sortBy])

  const hasFilters = search || (selectedCategory !== '__all__') || (selectedStage !== '__all__') || verifiedOnly

  const { featuredInResults, spotlightRows, othersInResults } = useMemo(() => {
    const featured = filtered.filter((s: any) => !!s.is_featured)
    if (featured.length > 0) {
      const others = filtered.filter((s: any) => !s.is_featured)
      return { featuredInResults: featured, spotlightRows: [] as any[], othersInResults: others }
    }
    // No DB-featured rows in this result set: spotlight top 3 so dark cards still appear on /directory
    const spotlight = filtered.slice(0, Math.min(3, filtered.length))
    const sid = new Set(spotlight.map((s: any) => s.id))
    const others = filtered.filter((s: any) => !sid.has(s.id))
    return { featuredInResults: [], spotlightRows: spotlight, othersInResults: others }
  }, [filtered])

  const highlightedRows = featuredInResults.length > 0 ? featuredInResults : spotlightRows
  const isDbFeatured = featuredInResults.length > 0

  function renderCard(
    s: any,
    cardFeatured: boolean,
    highlightBadge: 'featured' | 'spotlight' | 'none' = 'none',
  ) {
    return (
      <StartupCard
        key={s.id}
        id={s.id}
        name={s.name}
        slug={s.slug}
        tagline={s.tagline}
        logoPath={s.logo_path}
        category={s.startup_categories?.name}
        stage={s.startup_stages?.name}
        verificationStatus={s.verification_status}
        isPromoted={s.is_promoted}
        isFeatured={cardFeatured}
        highlightBadge={cardFeatured ? highlightBadge : 'none'}
        sparkScore={Math.round(s.startup_spark_score_metrics?.[0]?.spark_score ?? 0)}
        wouldUsePct={Math.round(s.startup_spark_score_metrics?.[0]?.would_use_pct ?? 0)}
        researchCount={s.startup_spark_score_metrics?.[0]?.total_research_responses ?? 0}
        supportCount={s.startup_spark_score_metrics?.[0]?.support_count ?? 0}
        saveCount={s.startup_spark_score_metrics?.[0]?.save_count ?? 0}
      />
    )
  }

  function clearFilters() {
    setSearch('')
    setSelectedCategory('__all__')
    setSelectedStage('__all__')
    setVerifiedOnly(false)
    setSortBy('trending')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Startup Directory</h1>
          <p className="text-muted-foreground mt-1.5">
            Verified AI-built startups ranked by real community traction
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 mb-6 space-y-3">
          {/* Search + sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name, category, or keyword..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="relative flex items-center">
              <SlidersHorizontal className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-9 w-full sm:w-52 appearance-none rounded-xl border border-input bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter pills row */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-8 min-w-[130px] appearance-none rounded-full border border-input bg-background px-3 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
            >
              <option value="__all__">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="h-8 min-w-[110px] appearance-none rounded-full border border-input bg-background px-3 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
            >
              <option value="__all__">All Stages</option>
              {stages.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium transition-all',
                verifiedOnly
                  ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                  : 'border-border text-slate-600 hover:border-slate-400 hover:bg-slate-50'
              )}
            >
              <CheckCircle2 className={cn('h-3.5 w-3.5', verifiedOnly ? 'text-green-500' : 'text-slate-400')} />
              Verified Only
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 h-8 px-2 text-xs text-muted-foreground hover:text-slate-700 transition-colors ml-auto"
              >
                <X className="h-3.5 w-3.5" /> Clear all
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="text-xs text-muted-foreground pt-0.5">
            {filtered.length} {filtered.length === 1 ? 'startup' : 'startups'} found
            {hasFilters && ' matching filters'}
          </p>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-16 text-center text-muted-foreground">
            <p className="text-lg font-semibold text-slate-700">No startups found</p>
            <p className="text-sm mt-1.5">Try adjusting your search or filters.</p>
            {hasFilters && (
              <Button variant="outline" className="mt-5 rounded-full" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {highlightedRows.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-amber-600 shadow-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {isDbFeatured ? 'Featured on VibeSpark' : 'Community spotlight'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {isDbFeatured
                        ? 'Dark cards — highlighted by the team'
                        : 'Top picks from your current sort & filters'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {highlightedRows.map((s: any) =>
                    renderCard(s, true, isDbFeatured ? 'featured' : 'spotlight'),
                  )}
                </div>
              </section>
            )}

            {othersInResults.length > 0 && (
              <section>
                {highlightedRows.length > 0 && (
                  <h2 className="text-lg font-bold text-slate-900 mb-4">All listings</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {othersInResults.map((s: any) => renderCard(s, false))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
