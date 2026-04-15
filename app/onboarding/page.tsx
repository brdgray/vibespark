'use client'

import { useState } from 'react'
import { demographicsSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DemographicsFormFields from '@/components/user/DemographicsFormFields'

const steps = ['Welcome', 'Research Panel', 'Demographics']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [joinResearch, setJoinResearch] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [ageRange, setAgeRange] = useState('')
  const [country, setCountry] = useState('')
  const [profession, setProfession] = useState('')
  const [industry, setIndustry] = useState('')
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [technicalLevel, setTechnicalLevel] = useState('')

  const supabase = createClient()

  function togglePersona(key: string) {
    setSelectedPersonas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    )
  }

  async function saveDemographicsAndFinish() {
    setFormError(null)
    const parsed = demographicsSchema.safeParse({
      ageRange,
      country: country.trim(),
      profession,
      industry,
      personaType: selectedPersonas.join(','),
      technicalLevel: technicalLevel || undefined,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please check the form')
      return
    }
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }
    const d = parsed.data
    await (supabase.from('profiles') as any).update({ is_research_participant: true }).eq('id', user.id)
    await (supabase.from('research_demographics') as any).upsert({
      user_id: user.id,
      age_range: d.ageRange,
      gender: null,
      country: d.country,
      profession: d.profession,
      industry: d.industry,
      persona_type: selectedPersonas.join(','),
      technical_level: d.technicalLevel || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    router.push('/')
    router.refresh()
  }

  async function handleFinish() {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      router.push('/auth/signin')
      return
    }
    router.push('/')
    router.refresh()
    setIsLoading(false)
  }

  async function skipDemographics() {
    setIsLoading(true)
    if (joinResearch) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await (supabase.from('profiles') as any).update({ is_research_participant: true }).eq('id', user.id)
      }
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-xl">
        <div className="px-6 pt-6">
          <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-orange-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 0 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to VibeSpark</CardTitle>
              <CardDescription>
                The verified directory for AI-built startups with real community traction signals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-slate-100 p-4 space-y-2 text-sm text-slate-700">
                <p>✅ Browse verified AI startups by stage</p>
                <p>📊 See real traction signals and community scores</p>
                <p>🧪 Test products and give feedback to founders</p>
                <p>⭐ Save your favorites and vote for the best</p>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setStep(1)}>
                Get Started
              </Button>
            </CardContent>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Join the Research Panel?</CardTitle>
              <CardDescription>
                Help founders validate their products. Your feedback shapes the next generation of AI startups.
                Participation is completely optional and you can change this anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => { setJoinResearch(true); setStep(2) }}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-colors hover:border-orange-400 ${
                  joinResearch === true ? 'border-orange-500 bg-orange-50' : 'border-border'
                }`}
              >
                <div className="font-medium">Yes, I want to participate</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  I&apos;ll provide demographic info (same options as your profile) so founders can see segmented insights.
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setJoinResearch(false); handleFinish() }}
                className="w-full text-left rounded-2xl border-2 border-border p-4 transition-colors hover:border-slate-400"
              >
                <div className="font-medium">No thanks, skip for now</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  I can join later from my profile settings.
                </div>
              </button>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>About You</CardTitle>
              <CardDescription>
                Same fields as Edit Profile → Research Demographics. Required to join the Research Panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <DemographicsFormFields
                variant="onboarding"
                ageRange={ageRange}
                setAgeRange={setAgeRange}
                country={country}
                setCountry={setCountry}
                profession={profession}
                setProfession={setProfession}
                industry={industry}
                setIndustry={setIndustry}
                selectedPersonas={selectedPersonas}
                togglePersona={togglePersona}
                technicalLevel={technicalLevel}
                setTechnicalLevel={setTechnicalLevel}
              />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={skipDemographics} disabled={isLoading}>
                  Skip for now
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={isLoading}
                  onClick={saveDemographicsAndFinish}
                >
                  {isLoading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
