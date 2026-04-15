'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { WouldUse } from '@/lib/supabase/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowUp, Bookmark, BookmarkCheck, ExternalLink, FlaskConical } from 'lucide-react'

const WOULD_USE_LABEL: Record<WouldUse, string> = {
  yes: 'Yes, definitely',
  maybe: 'Maybe',
  no: 'Not for me',
}

interface StartupActionsProps {
  startupId: string
  startupSlug: string
  websiteUrl: string
  user: any
  hasVoted: boolean
  hasSaved: boolean
  /** Logged-in visitor’s saved profile vote (Research Lab answers are separate). */
  profileWouldUse?: WouldUse | null
  /** If set, this user already submitted Research Lab feedback for this startup; that answer drives metrics. */
  labWouldUseForMetrics?: WouldUse | null
  isOwnerProfile?: boolean
}

export default function StartupActions({
  startupId,
  startupSlug,
  websiteUrl,
  user,
  hasVoted: initialHasVoted,
  hasSaved: initialHasSaved,
  profileWouldUse: initialProfileWouldUse = null,
  labWouldUseForMetrics = null,
  isOwnerProfile = false,
}: StartupActionsProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [hasSaved, setHasSaved] = useState(initialHasSaved)
  const [profileWouldUse, setProfileWouldUse] = useState<WouldUse | null>(initialProfileWouldUse)
  const [wouldUseLoading, setWouldUseLoading] = useState(false)
  const [voteLoading, setVoteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setProfileWouldUse(initialProfileWouldUse ?? null)
  }, [initialProfileWouldUse])

  async function handleVote() {
    if (!user) { router.push(`/auth/signin?redirectTo=/startups/${startupSlug}`); return }
    setVoteLoading(true)
    if (hasVoted) {
      const { error } = await supabase.from('startup_votes')
        .delete()
        .eq('startup_id', startupId)
        .eq('user_id', user.id)
      if (!error) { setHasVoted(false); toast.success('Vote removed') }
    } else {
      const { error } = await supabase.from('startup_votes')
        .insert({ startup_id: startupId, user_id: user.id, vote_type: 'support' })
      if (!error) { setHasVoted(true); toast.success('Voted! Thanks for the support.') }
      else toast.error(error.message)
    }
    setVoteLoading(false)
    router.refresh()
  }

  async function handleSave() {
    if (!user) { router.push(`/auth/signin?redirectTo=/startups/${startupSlug}`); return }
    setSaveLoading(true)
    if (hasSaved) {
      const { error } = await supabase.from('startup_saves')
        .delete()
        .eq('startup_id', startupId)
        .eq('user_id', user.id)
      if (!error) { setHasSaved(false); toast.success('Removed from saved') }
    } else {
      const { error } = await supabase.from('startup_saves')
        .insert({ startup_id: startupId, user_id: user.id })
      if (!error) { setHasSaved(true); toast.success('Saved to your watchlist') }
      else toast.error(error.message)
    }
    setSaveLoading(false)
    router.refresh()
  }

  async function handleProfileWouldUse(value: WouldUse) {
    if (!user) {
      router.push(`/auth/signin?redirectTo=/startups/${startupSlug}`)
      return
    }
    setWouldUseLoading(true)
    const { error } = await supabase.from('startup_profile_would_use').upsert(
      { startup_id: startupId, user_id: user.id, would_use: value },
      { onConflict: 'startup_id,user_id' }
    )
    if (error) {
      const msg = (error as { message?: string }).message ?? ''
      if (/row-level security|RLS|violates|policy/i.test(msg)) {
        toast.error('You can’t submit this on your own listing.')
      } else {
        toast.error('Could not save your answer. Try again.')
      }
    } else {
      setProfileWouldUse(value)
      toast.success('Thanks — your take was saved.')
      router.refresh()
    }
    setWouldUseLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border p-5 space-y-3">
      <Button
        onClick={handleVote}
        disabled={voteLoading}
        className={`w-full ${hasVoted ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
        variant={hasVoted ? 'outline' : 'default'}
      >
        <ArrowUp className="mr-2 h-4 w-4" />
        {hasVoted ? 'Supported!' : 'Support this Startup'}
      </Button>
      <Button
        onClick={handleSave}
        disabled={saveLoading}
        variant="outline"
        className={`w-full ${hasSaved ? 'border-blue-300 text-blue-700 bg-blue-50' : ''}`}
      >
        {hasSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
        {hasSaved ? 'Saved to Watchlist' : 'Save to Watchlist'}
      </Button>

      {!isOwnerProfile && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 space-y-2.5">
          <p className="text-xs font-semibold text-slate-800">Would you use this product?</p>
          {!user && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => router.push(`/auth/signin?redirectTo=/startups/${startupSlug}`)}
            >
              Sign in to share your take
            </Button>
          )}
          {user && labWouldUseForMetrics && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your Research Lab answer ({WOULD_USE_LABEL[labWouldUseForMetrics]}) is what counts for Would Use on
              this page — same as in the lab, without filling this again.
            </p>
          )}
          {user && !labWouldUseForMetrics && (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { value: 'yes' as const, emoji: '👍', short: 'Yes' },
                  { value: 'maybe' as const, emoji: '🤔', short: 'Maybe' },
                  { value: 'no' as const, emoji: '👎', short: 'No' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={wouldUseLoading}
                    onClick={() => handleProfileWouldUse(opt.value)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 py-2 px-1 transition-all text-[10px] font-medium leading-tight',
                      profileWouldUse === opt.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-slate-200 bg-white hover:border-orange-200 text-slate-700',
                      wouldUseLoading && 'opacity-60 pointer-events-none'
                    )}
                  >
                    <span className="text-lg leading-none">{opt.emoji}</span>
                    <span>{opt.short}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Quick signal for founders — no Research Lab form required. For full structured feedback, use Research Lab below.
              </p>
            </>
          )}
        </div>
      )}

      <LinkButton
        href={`/research-lab?startup=${startupSlug}`}
        variant="outline"
        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
      >
        <FlaskConical className="mr-2 h-4 w-4" />
        Test in Research Lab
      </LinkButton>
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'w-full text-slate-600 hover:text-slate-900'
        )}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Visit Website
      </a>
    </div>
  )
}
