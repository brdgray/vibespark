'use client'

import { useState, useMemo } from 'react'
import StartupCard from '@/components/startup/StartupCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface DirectoryClientProps {
  startups: any[]
  categories: any[]
  stages: any[]
}

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'spark', label: 'Top Spark Score' },
  { value: 'would_use', label: 'Most Would Use' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_researched', label: 'Most Researched' },
  { value: 'featured', label: 'Featured First' },
]

export default function DirectoryClient({ startups, categories, stages }: DirectoryClientProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__')
  const [selectedStage, setSelectedStage] = useState<string>('__all__')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('trending')

  const filtered = useMemo(() => {
    let result = [...startups]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.startup_categories?.name?.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (selectedCategory && selectedCategory !== '__all__') {
      result = result.filter(s => s.category_id === selectedCategory)
    }

    // Stage filter
    if (selectedStage && selectedStage !== '__all__') {
      result = result.filter(s => s.stage_id === selectedStage)
    }

    // Verified only
    if (verifiedOnly) {
      result = result.filter(s => s.verification_status === 'verified')
    }

    // Sort
    result.sort((a, b) => {
      const am = a.startup_spark_score_metrics?.[0] ?? {}
      const bm = b.startup_spark_score_metrics?.[0] ?? {}
      switch (sortBy) {
        case 'trending':
          return (bm.trending_score ?? 0) - (am.trending_score ?? 0)
        case 'spark':
          return (bm.spark_score ?? 0) - (am.spark_score ?? 0)
        case 'would_use':
          return (bm.would_use_pct ?? 0) - (am.would_use_pct ?? 0)
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'most_researched':
          return (bm.total_research_responses ?? 0) - (am.total_research_responses ?? 0)
        case 'featured':
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
        default:
          return 0
      }
    })

    return result
  }, [startups, search, selectedCategory, selectedStage, verifiedOnly, sortBy])

  const hasFilters = search || (selectedCategory !== '__all__') || (selectedStage !== '__all__') || verifiedOnly

  function clearFilters() {
    setSearch('')
    setSelectedCategory('__all__')
    setSelectedStage('__all__')
    setVerifiedOnly(false)
    setSortBy('trending')
  }


  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Startup Directory</h1>
        <p className="text-muted-foreground mt-1.5">
          {filtered.length} verified AI-built startups
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search startups, categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative flex items-center">
            <SlidersHorizontal className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="h-9 w-full sm:w-44 appearance-none rounded-2xl border border-input bg-background pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="h-8 min-w-[130px] appearance-none rounded-full border border-input bg-background px-3 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
          >
            <option value="__all__">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="h-8 min-w-[110px] appearance-none rounded-full border border-input bg-background px-3 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
          >
            <option value="__all__">All Stages</option>
            {stages.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium transition-colors ${
              verifiedOnly ? 'bg-green-50 border-green-400 text-green-700' : 'border-border text-slate-600 hover:border-slate-400'
            }`}
          >
            {verifiedOnly && '✓ '}Verified Only
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-8 px-2 text-xs text-muted-foreground hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No startups found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s: any) => (
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
              isFeatured={s.is_featured}
              sparkScore={Math.round(s.startup_spark_score_metrics?.[0]?.spark_score ?? 0)}
              wouldUsePct={Math.round(s.startup_spark_score_metrics?.[0]?.would_use_pct ?? 0)}
              researchCount={s.startup_spark_score_metrics?.[0]?.total_research_responses ?? 0}
              supportCount={s.startup_spark_score_metrics?.[0]?.support_count ?? 0}
              saveCount={s.startup_spark_score_metrics?.[0]?.save_count ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
