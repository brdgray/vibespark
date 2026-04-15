'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AGE_RANGES,
  PROFESSIONS,
  INDUSTRIES,
  PERSONA_OPTIONS,
  TECH_LEVELS,
} from '@/lib/constants/research-demographics'

export interface DemographicsFormFieldsProps {
  ageRange: string
  setAgeRange: (v: string) => void
  country: string
  setCountry: (v: string) => void
  profession: string
  setProfession: (v: string) => void
  industry: string
  setIndustry: (v: string) => void
  selectedPersonas: string[]
  togglePersona: (key: string) => void
  technicalLevel: string
  setTechnicalLevel: (v: string) => void
  /** e.g. signup: slightly shorter helper copy */
  variant?: 'profile' | 'signup' | 'onboarding'
}

export default function DemographicsFormFields({
  ageRange,
  setAgeRange,
  country,
  setCountry,
  profession,
  setProfession,
  industry,
  setIndustry,
  selectedPersonas,
  togglePersona,
  technicalLevel,
  setTechnicalLevel,
  variant = 'profile',
}: DemographicsFormFieldsProps) {
  const isSignup = variant === 'signup'
  const showRequiredStars = variant !== 'signup'

  const helper =
    variant === 'profile'
      ? 'Required to participate in the Research Lab. Founders see aggregated breakdowns only.'
      : 'Optional — leave everything blank and add this later in your profile. If you enter anything here, finish every field so we can save your Research Lab demographics.'

  return (
    <div className="space-y-4">
      {isSignup && (
        <p className="text-xs text-muted-foreground leading-relaxed">{helper}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Age Range {showRequiredStars && <span className="text-destructive">*</span>}</Label>
          <select
            value={ageRange}
            onChange={e => setAgeRange(e.target.value)}
            className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
          >
            <option value="" disabled={!isSignup}>
              {isSignup ? 'Optional — select…' : 'Select...'}
            </option>
            {AGE_RANGES.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Country {showRequiredStars && <span className="text-destructive">*</span>}</Label>
          <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="United States" />
        </div>

        <div className="space-y-1.5">
          <Label>Profession / Role {showRequiredStars && <span className="text-destructive">*</span>}</Label>
          <select
            value={profession}
            onChange={e => setProfession(e.target.value)}
            className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
          >
            <option value="">{isSignup ? 'Optional — select…' : 'Select your role...'}</option>
            {PROFESSIONS.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Industry {showRequiredStars && <span className="text-destructive">*</span>}</Label>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
          >
            <option value="">{isSignup ? 'Optional — select…' : 'Select your industry...'}</option>
            {INDUSTRIES.map(i => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Technical Level</Label>
          <select
            value={technicalLevel}
            onChange={e => setTechnicalLevel(e.target.value)}
            className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer capitalize sm:max-w-md"
          >
            <option value="">Not specified</option>
            {TECH_LEVELS.map(l => (
              <option key={l} value={l} className="capitalize">
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          I am a... {showRequiredStars && <span className="text-destructive">*</span>}
          <span className="ml-1.5 text-xs text-muted-foreground font-normal">(select all that apply)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {PERSONA_OPTIONS.map(opt => {
            const active = selectedPersonas.includes(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => togglePersona(opt.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600',
                )}
              >
                {active && <Check className="h-3 w-3" />}
                {opt.label}
              </button>
            )
          })}
        </div>
        {selectedPersonas.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {isSignup ? 'Optional — pick any that describe you' : 'Select at least one that describes you'}
          </p>
        )}
      </div>
    </div>
  )
}
