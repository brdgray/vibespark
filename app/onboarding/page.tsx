'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { demographicsSchema, type DemographicsInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const steps = ['Welcome', 'Research Panel', 'Demographics']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [joinResearch, setJoinResearch] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DemographicsInput>({
    resolver: zodResolver(demographicsSchema),
  })

  const supabase = createClient()

  async function handleFinish(data?: DemographicsInput) {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/signin'); return }

    if (joinResearch && data) {
      await (supabase.from('profiles') as any).update({ is_research_participant: true }).eq('id', user.id)
      await (supabase.from('research_demographics') as any).upsert({
        user_id: user.id,
        age_range: data.ageRange,
        gender: data.gender || null,
        country: data.country,
        profession: data.profession,
        industry: data.industry,
        persona_type: data.personaType,
        technical_level: data.technicalLevel || null,
      })
    }

    router.push('/')
    router.refresh()
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        {/* Progress indicator */}
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
                onClick={() => { setJoinResearch(true); setStep(2) }}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-colors hover:border-orange-400 ${
                  joinResearch === true ? 'border-orange-500 bg-orange-50' : 'border-border'
                }`}
              >
                <div className="font-medium">Yes, I want to participate</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  I&apos;ll provide optional demographic info so founders can see segmented insights.
                </div>
              </button>
              <button
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
                This helps founders see which types of users respond to their products. All fields are optional
                except age range, country, profession, and persona.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleFinish)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Age Range</Label>
                    <select
                      onChange={e => setValue('ageRange', e.target.value as DemographicsInput['ageRange'])}
                      className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground"
                    >
                      <option value="" disabled selected>Select...</option>
                      {['under-18','18-24','25-34','35-44','45-54','55+'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {errors.ageRange && <p className="text-xs text-destructive">{errors.ageRange.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input placeholder="United States" {...register('country')} />
                    {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Profession / Role</Label>
                  <Input placeholder="e.g. Software Engineer, Designer, CEO" {...register('profession')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Industry</Label>
                    <Input placeholder="e.g. SaaS, Fintech, Healthcare" {...register('industry')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>I am a...</Label>
                    <select
                      onChange={e => setValue('personaType', e.target.value as DemographicsInput['personaType'])}
                      className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground capitalize"
                    >
                      <option value="" disabled selected>Select...</option>
                      {['founder','employee','student','consumer','investor'].map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Technical Level (optional)</Label>
                  <select
                    onChange={e => setValue('technicalLevel', e.target.value as DemographicsInput['technicalLevel'])}
                    className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground capitalize"
                  >
                    <option value="" disabled selected>Select...</option>
                    {['non-technical','basic','intermediate','advanced'].map(l => (
                      <option key={l} value={l} className="capitalize">{l}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={skipDemographics} disabled={isLoading}>
                    Skip for now
                  </Button>
                  <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Complete Setup'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
