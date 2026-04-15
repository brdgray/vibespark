/** Structured feedback on startups the user does not own (Research Lab give-back). */
export const RESEARCH_GIVEBACK_REQUIRED = 3

export function founderResearchGivebackMet(feedbackToOthersCount: number): boolean {
  return feedbackToOthersCount >= RESEARCH_GIVEBACK_REQUIRED
}

/** Count of research_responses by this user for startups they do not own. */
export async function fetchFeedbackToOthersCount(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<number> {
  const { data: myStartups } = await supabase.from('startups').select('id').eq('created_by', userId)
  const ownedIds = ((myStartups ?? []) as { id: string }[]).map(s => s.id).filter(Boolean)

  let q = supabase.from('research_responses').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  if (ownedIds.length > 0) {
    q = q.not('startup_id', 'in', `(${ownedIds.join(',')})`)
  }
  const { count } = await q
  return count ?? 0
}
