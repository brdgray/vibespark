import { AGE_RANGES } from '@/lib/constants/research-demographics'

export type DemographicsFieldState = {
  ageRange: string
  country: string
  profession: string
  industry: string
  personaKeys: string[]
  technicalLevel: string
}

/** True if the user started the research demographics block but did not finish it. */
export function hasPartialResearchDemographicsInput(s: DemographicsFieldState): boolean {
  return (
    !!s.ageRange.trim() ||
    !!s.country.trim() ||
    !!s.profession.trim() ||
    !!s.industry.trim() ||
    s.personaKeys.length > 0 ||
    !!s.technicalLevel.trim()
  )
}

/** True when all fields required to save `research_demographics` are present and valid. */
export function isResearchDemographicsComplete(s: DemographicsFieldState): boolean {
  const ageOk = (AGE_RANGES as readonly string[]).includes(s.ageRange)
  return (
    ageOk &&
    s.country.trim().length >= 2 &&
    !!s.profession.trim() &&
    !!s.industry.trim() &&
    s.personaKeys.length >= 1
  )
}
