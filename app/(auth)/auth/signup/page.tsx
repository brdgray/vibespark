'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { demographicsSchema } from '@/lib/validations/auth'
import DemographicsFormFields from '@/components/user/DemographicsFormFields'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function demographicsStarted(
  ageRange: string,
  country: string,
  profession: string,
  industry: string,
  personas: string[],
) {
  return !!(ageRange || country.trim() || profession || industry || personas.length > 0)
}

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ageRange, setAgeRange] = useState('')
  const [country, setCountry] = useState('')
  const [profession, setProfession] = useState('')
  const [industry, setIndustry] = useState('')
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [technicalLevel, setTechnicalLevel] = useState('')

  function togglePersona(key: string) {
    setSelectedPersonas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    )
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    })
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()

    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3–20 lowercase letters, numbers, or underscores (same as profile).')
      return
    }
    if (!email) {
      setError('Email is required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    const started = demographicsStarted(ageRange, country, profession, industry, selectedPersonas)
    let demographicsPayload: Record<string, string> | undefined
    if (started) {
      const parsed = demographicsSchema.safeParse({
        ageRange,
        country: country.trim(),
        profession,
        industry,
        personaType: selectedPersonas.join(','),
        technicalLevel: technicalLevel || undefined,
      })
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Complete all research fields or clear them.')
        return
      }
      const d = parsed.data
      demographicsPayload = {
        ageRange: d.ageRange,
        country: d.country,
        profession: d.profession,
        industry: d.industry,
        personaType: selectedPersonas.join(','),
        technicalLevel: d.technicalLevel ?? '',
      }
    }

    setIsLoading(true)
    setError(null)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName: displayName.trim(),
        username: username.trim(),
        demographics: demographicsPayload,
      }),
    })
    const json = await res.json()

    if (!res.ok || json.error) {
      setError(json.error ?? 'Something went wrong. Please try again.')
      setIsLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Account created! Please sign in.')
      router.push('/auth/signin')
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border p-8 space-y-6">

        <div className="flex justify-center">
          <Link href="/">
            <Image src="/logo.png" alt="VibeSpark" width={160} height={44} className="h-12 w-auto" priority />
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Join the verified AI startup community</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Full name <span className="text-destructive">*</span></Label>
              <Input
                id="displayName"
                placeholder="Jane Smith"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Used for emails and admin only — not shown publicly</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">
                @Handle / Username <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="username"
                  placeholder="yourhandle"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="pl-7"
                  maxLength={20}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">3–20 chars — this is what others see</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Research Lab profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Same options as Edit Profile → Research Demographics. Optional: leave blank and add later.
              </p>
            </div>
            <DemographicsFormFields
              variant="signup"
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
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-semibold text-orange-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
