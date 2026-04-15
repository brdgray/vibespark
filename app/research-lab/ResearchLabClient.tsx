'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  FlaskConical, CheckCircle2, Lock, ChevronRight,
  ExternalLink, Globe,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ResearchScoreSliders from '@/components/research/ResearchScoreSliders'
import {
  DEFAULT_RESEARCH_CRITERIA_SCORES,
  type ResearchCriteriaScores,
  valueClarityToLegacyClarity,
} from '@/lib/constants/research-criteria'

const FEEDBACK_TO_UNLOCK_INSIGHTS = 3

interface ResearchLabClientProps {
  requests: any[]
  user: any
  isResearchParticipant: boolean
  respondedIds: string[]
  /** Feedback given on startups the user does not own */
  feedbackToOthersCount?: number
  /** Startups this user created (cannot submit Research Lab feedback on own listings) */
  ownedStartupIds?: string[]
  preselectedRequest?: any | null
  requestedStartupSlug?: string | null
}

export default function ResearchLabClient({
  requests,
  user,
  isResearchParticipant,
  respondedIds,
  feedbackToOthersCount = 0,
  ownedStartupIds = [],
  preselectedRequest,
  requestedStartupSlug,
}: ResearchLabClientProps) {
  const canViewOthersLabStats = feedbackToOthersCount >= FEEDBACK_TO_UNLOCK_INSIGHTS
  /** Logged-in users under the threshold cannot see others’ response totals; guests still see them. */
  const showOthersInsights = !user || canViewOthersLabStats
  const remainingToUnlock = Math.max(0, FEEDBACK_TO_UNLOCK_INSIGHTS - feedbackToOthersCount)
  const [activeRequest, setActiveRequest] = useState<any | null>(null)
  const [submitted, setSubmitted] = useState<string[]>(respondedIds)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [wouldUse, setWouldUse] = useState<'yes' | 'maybe' | 'no' | ''>('')
  const [criteriaScores, setCriteriaScores] = useState<ResearchCriteriaScores>({ ...DEFAULT_RESEARCH_CRITERIA_SCORES })
  const [missingFeatures, setMissingFeatures] = useState('')
  const [frictionPoints, setFrictionPoints] = useState('')
  const [targetUserGuess, setTargetUserGuess] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const supabase = createClient()

  const isOwnListing = (request: { startup_id?: string }) =>
    !!request?.startup_id && ownedStartupIds.includes(request.startup_id)

  // Auto-open modal when coming from a startup page (never for your own listing)
  useEffect(() => {
    if (preselectedRequest && !isOwnListing(preselectedRequest)) {
      openFeedback(preselectedRequest)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm() {
    setWouldUse('')
    setCriteriaScores({ ...DEFAULT_RESEARCH_CRITERIA_SCORES })
    setMissingFeatures('')
    setFrictionPoints('')
    setTargetUserGuess('')
    setFormErrors({})
  }

  function openFeedback(request: any) {
    if (!user) {
      router.push('/auth/signin?redirectTo=/research-lab')
      return
    }
    resetForm()
    setActiveRequest(request)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!wouldUse) errors.wouldUse = 'Please select an option'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    const clarityLegacy = valueClarityToLegacyClarity(criteriaScores.valueClarity)
    const { error } = await (supabase.from('research_responses') as any).insert({
      research_request_id: activeRequest.id,
      startup_id: activeRequest.startup_id,
      user_id: user.id,
      would_use: wouldUse,
      clarity_score: clarityLegacy,
      usability_score: criteriaScores.usability,
      scalability_score: criteriaScores.scalability,
      value_clarity_score: criteriaScores.valueClarity,
      desirability_score: criteriaScores.desirability,
      trust_score: criteriaScores.trust,
      missing_features: missingFeatures || null,
      friction_points: frictionPoints || null,
      target_user_guess: targetUserGuess || null,
    })

    if (error) {
      const msg = (error as { message?: string }).message ?? ''
      if (/row-level security|RLS|violates|policy/i.test(msg)) {
        toast.error('You can’t submit feedback on this listing (e.g. your own startup).')
      } else {
        toast.error('Failed to submit feedback. Please try again.')
      }
    } else {
      setSubmitted(prev => [...prev, activeRequest.id])
      setActiveRequest(null)
      toast.success('Feedback submitted! Thank you for helping this founder.')
      router.refresh()
    }
    setIsSubmitting(false)
  }

  const pending = requests.filter(r => !submitted.includes(r.id) && !isOwnListing(r))
  const done = requests.filter(r => submitted.includes(r.id))
  const ownPending = requests.filter(r => !submitted.includes(r.id) && isOwnListing(r))

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <FlaskConical className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-slate-900">Research Lab</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Help AI founders validate their products. Your structured feedback gives founders real signals
              from real users — segmented by who you are.
            </p>
            {!user && (
              <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800">Sign in to participate</p>
                  <p className="text-sm text-blue-600">Create an account and opt in to the research panel to give feedback.</p>
                </div>
                <LinkButton href="/auth/signup" size="sm" className="bg-blue-500 hover:bg-blue-600">
                  Join Now
                </LinkButton>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-full overflow-x-hidden px-4 py-8 sm:max-w-4xl">
        {user && !showOthersInsights && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-amber-900">Unlock Research Lab insights</p>
                <p className="mt-1 text-sm text-amber-800">
                  Your own startup can still appear in the Lab from your dashboard. After you give structured feedback on{' '}
                  {remainingToUnlock === 1 ? 'one more startup' : `${remainingToUnlock} more startups`} you don&apos;t own, you can see response totals here and read incoming feedback on your own listings (database + dashboard).
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-amber-900">
                {feedbackToOthersCount}/{FEEDBACK_TO_UNLOCK_INSIGHTS}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            { label: 'Awaiting Feedback', value: pending.length, color: 'text-blue-600' },
            { label: 'Completed', value: done.length, color: 'text-green-600' },
            {
              label: 'Products in Lab',
              value: showOthersInsights ? requests.length : '—',
              color: showOthersInsights ? 'text-slate-700' : 'text-amber-600',
              sub: !showOthersInsights && user ? 'Unlock at 3 feedbacks' : undefined,
            },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              {'sub' in s && s.sub && (
                <div className="mt-1 text-[10px] font-medium text-amber-700">{s.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Deep-linked to own startup that has an active request — do not auto-open modal; explain */}
        {user && requestedStartupSlug && preselectedRequest && isOwnListing(preselectedRequest) && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="font-semibold text-slate-800">This is your startup</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Research Lab feedback must come from other founders and testers, not from your own account. Browse other products below.
            </p>
          </div>
        )}

        {/* Banner: startup came from profile page but has no active research request */}
        {requestedStartupSlug && !preselectedRequest && (
          <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-200 p-5 flex items-start gap-4">
            <FlaskConical className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800">This startup hasn&apos;t opened a research request yet.</p>
              <p className="text-sm text-blue-600 mt-0.5">
                The founder can enable Research Lab feedback from their dashboard. In the meantime, browse other startups below.
              </p>
            </div>
          </div>
        )}

        {/* Own listings still in the lab (not eligible for self-feedback) */}
        {user && ownPending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Your startups in the Lab</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              You can&apos;t submit structured feedback on your own listing. Others will see it here when they opt in.
            </p>
            <div className="space-y-3 opacity-80">
              {ownPending.map(request => (
                <Card key={request.id} className="border-dashed">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white">
                        {request.startups?.logo_path ? (
                          <Image src={request.startups.logo_path} alt="" width={48} height={48} className="object-contain" />
                        ) : (
                          <span className="text-lg font-bold text-slate-300">{request.startups?.name?.[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">{request.startups?.name}</div>
                        <div className="text-xs text-muted-foreground">Your listing — self-feedback disabled</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit shrink-0">Yours</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending requests */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Awaiting Your Feedback</h2>
            <div className="space-y-3">
              {pending.map(request => (
                <Card key={request.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="w-12 h-12 rounded-2xl border bg-white flex items-center justify-center flex-shrink-0">
                        {request.startups?.logo_path ? (
                          <Image src={request.startups.logo_path} alt="" width={48} height={48} className="object-contain" />
                        ) : (
                          <span className="text-lg font-bold text-slate-300">{request.startups?.name?.[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link href={`/startups/${request.startups?.slug}`} className="font-semibold text-slate-900 hover:text-orange-500">
                            {request.startups?.name}
                          </Link>
                          {request.startups?.startup_stages?.name && (
                            <Badge variant="secondary" className="text-xs">{request.startups.startup_stages.name}</Badge>
                          )}
                          {request.startups?.startup_categories?.name && (
                            <Badge variant="outline" className="text-xs">{request.startups.startup_categories.name}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{request.startups?.tagline}</p>
                        {request.startups?.website_url && (
                          <a
                            href={request.startups.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
                          >
                            <Globe className="h-3 w-3" />
                            Visit product
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {request.prompt && (
                          <p className="text-sm text-slate-600 mt-2 bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                            <span className="font-medium">Founder asks: </span>{request.prompt}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {showOthersInsights ? (
                            <span>
                              {request.startups?.startup_spark_score_metrics?.[0]?.total_research_responses ?? 0} responses so far
                            </span>
                          ) : (
                            <span className="text-amber-700">
                              Response total hidden — give {remainingToUnlock} more structured feedback
                              {remainingToUnlock === 1 ? '' : 's'} on other startups to unlock
                            </span>
                          )}
                          {request.ends_at && (
                            <span>Ends {new Date(request.ends_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => openFeedback(request)}
                        size="sm"
                        className={`w-full shrink-0 sm:w-auto ${!isResearchParticipant ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                      >
                        {!user ? (
                          <><Lock className="mr-1.5 h-3.5 w-3.5" /> Sign in</>
                        ) : !isResearchParticipant ? (
                          <><Lock className="mr-1.5 h-3.5 w-3.5" /> Opt In</>
                        ) : (
                          <>Give Feedback <ChevronRight className="ml-1 h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No active requests but came from a startup page */}
        {requests.length === 0 && preselectedRequest === null && (
          <div className="text-center py-16 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No research requests yet</p>
            <p className="text-sm mt-1">Founders will add products here soon. Check back!</p>
          </div>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Feedback Given ({done.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {done.map(request => (
                <div key={request.id} className="bg-white rounded-2xl border border-green-100 p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div>
                    <Link href={`/startups/${request.startups?.slug}`} className="font-medium text-sm hover:text-orange-500">
                      {request.startups?.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">Feedback submitted</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <Dialog open={!!activeRequest} onOpenChange={(open) => { if (!open) setActiveRequest(null) }}>
        <DialogContent
          showCloseButton
          className="!flex min-h-0 h-[min(92dvh,760px)] w-[min(100vw-1rem,28rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:h-[min(90dvh,720px)] sm:w-[min(100vw-2rem,40rem)]"
        >
          <div className="shrink-0 border-b bg-popover px-4 pb-3 pt-4 sm:px-5">
            <DialogHeader className="gap-1 space-y-0 text-left">
              <DialogTitle className="flex items-start gap-2 pr-8 text-left text-base leading-snug sm:text-lg">
                <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                <span className="min-w-0 break-words">Give feedback: {activeRequest?.startups?.name}</span>
              </DialogTitle>
            </DialogHeader>
          </div>

          {activeRequest && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-5">
              {/* Startup context card */}
              <div className="space-y-2 rounded-2xl border bg-slate-50 p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white">
                    {activeRequest.startups?.logo_path ? (
                      <Image src={activeRequest.startups.logo_path} alt="" width={40} height={40} className="object-contain" />
                    ) : (
                      <span className="text-base font-bold text-slate-300">{activeRequest.startups?.name?.[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{activeRequest.startups?.name}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{activeRequest.startups?.tagline}</div>
                  </div>
                  {activeRequest.startups?.website_url && (
                    <a
                      href={activeRequest.startups.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Try it</span>
                    </a>
                  )}
                </div>
                {activeRequest.startups?.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {activeRequest.startups.description}
                  </p>
                )}
                {activeRequest.prompt && (
                  <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Founder&apos;s question:</p>
                    <p className="text-xs text-blue-600">{activeRequest.prompt}</p>
                  </div>
                )}
              </div>

              <form id="research-feedback-form" onSubmit={handleSubmit} className="space-y-6 pt-2">
                {/* Q1: Would you use this? */}
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Would you use this product? <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {([
                      { value: 'yes', emoji: '👍', label: 'Yes, definitely' },
                      { value: 'maybe', emoji: '🤔', label: 'Maybe' },
                      { value: 'no', emoji: '👎', label: 'Not for me' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setWouldUse(opt.value); setFormErrors(e => ({ ...e, wouldUse: '' })) }}
                        className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2.5 transition-all sm:p-3 ${
                          wouldUse === opt.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-border hover:border-orange-200'
                        }`}
                      >
                        <span className="text-xl sm:text-2xl">{opt.emoji}</span>
                        <span className="text-center text-[11px] font-medium leading-tight sm:text-xs">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  {formErrors.wouldUse && <p className="text-xs text-destructive mt-1">{formErrors.wouldUse}</p>}
                </div>

                <ResearchScoreSliders scores={criteriaScores} onChange={setCriteriaScores} disabled={isSubmitting} />

                {/* Q3: What's missing? */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    What&apos;s missing or could be improved? <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Missing features, pricing concerns, unclear value..."
                    value={missingFeatures}
                    onChange={e => setMissingFeatures(e.target.value)}
                  />
                </div>

                {/* Q4: What would stop you? */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    What would stop you from trying it? <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Price, trust, complexity, existing alternatives..."
                    value={frictionPoints}
                    onChange={e => setFrictionPoints(e.target.value)}
                  />
                </div>

                {/* Q5: Who is it for? */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Who do you think this is built for? <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Solo developers, non-technical founders, marketing teams..."
                    value={targetUserGuess}
                    onChange={e => setTargetUserGuess(e.target.value)}
                  />
                </div>

              </form>
              </div>

              <div className="shrink-0 border-t bg-slate-50/95 px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="w-full sm:w-auto sm:min-w-[7rem]" onClick={() => setActiveRequest(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="research-feedback-form"
                    className="w-full bg-blue-500 hover:bg-blue-600 sm:w-auto sm:min-w-[10rem]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit feedback'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
