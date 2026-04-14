'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowUp, Bookmark, BookmarkCheck, ExternalLink, FlaskConical } from 'lucide-react'

interface StartupActionsProps {
  startupId: string
  startupSlug: string
  websiteUrl: string
  user: any
  hasVoted: boolean
  hasSaved: boolean
}

export default function StartupActions({
  startupId,
  startupSlug,
  websiteUrl,
  user,
  hasVoted: initialHasVoted,
  hasSaved: initialHasSaved,
}: StartupActionsProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [hasSaved, setHasSaved] = useState(initialHasSaved)
  const [voteLoading, setVoteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
