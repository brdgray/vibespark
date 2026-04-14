'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Camera, FlaskConical, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Dropdown Options ──────────────────────────────────────────
const AGE_RANGES = ['under-18', '18-24', '25-34', '35-44', '45-54', '55+']

const PROFESSIONS = [
  'Software Engineer / Developer',
  'Product Manager',
  'UX / UI Designer',
  'Data Scientist / Analyst',
  'Marketing / Growth',
  'Sales / Business Development',
  'Entrepreneur / Founder',
  'Investor / VC',
  'Operations / Finance',
  'Researcher / Academic',
  'Student',
  'Other',
]

const INDUSTRIES = [
  'Artificial Intelligence / ML',
  'Technology / Software (SaaS)',
  'Fintech / Finance',
  'Healthcare / Biotech',
  'E-commerce / Retail',
  'Education / EdTech',
  'Real Estate / PropTech',
  'Media / Entertainment',
  'Legal / LegalTech',
  'HR / Recruiting',
  'Logistics / Supply Chain',
  'Climate / CleanTech',
  'Food / AgriTech',
  'Gaming',
  'Cybersecurity',
  'Consumer / Lifestyle',
  'Other',
]

const PERSONA_OPTIONS = [
  { key: 'founder',    label: '🚀 Founder' },
  { key: 'investor',   label: '💼 Investor' },
  { key: 'engineer',   label: '⚙️ Engineer / Dev' },
  { key: 'designer',   label: '🎨 Designer' },
  { key: 'pm',         label: '📋 Product Manager' },
  { key: 'marketing',  label: '📣 Marketing / Growth' },
  { key: 'student',    label: '🎓 Student' },
  { key: 'consumer',   label: '👤 Consumer / User' },
  { key: 'researcher', label: '🔬 Researcher' },
]

const TECH_LEVELS = ['non-technical', 'basic', 'intermediate', 'advanced']

interface ProfileEditClientProps {
  userId: string
  profile: any
  demographics: any
}

export default function ProfileEditClient({ userId, profile, demographics }: ProfileEditClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [isResearchParticipant, setIsResearchParticipant] = useState(profile?.is_research_participant ?? false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Demographics — initialize from existing data; track in state for live "Complete" badge
  const [ageRange, setAgeRange] = useState(demographics?.age_range ?? '')
  const [country, setCountry] = useState(demographics?.country ?? '')
  const [profession, setProfession] = useState(demographics?.profession ?? '')
  const [industry, setIndustry] = useState(demographics?.industry ?? '')
  // persona_type stored as comma-separated; split to array for multi-select
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(
    demographics?.persona_type
      ? demographics.persona_type.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []
  )
  const [technicalLevel, setTechnicalLevel] = useState(demographics?.technical_level ?? '')
  const [savingDemo, setSavingDemo] = useState(false)

  // "Complete" is computed from LIVE state so it updates as user fills fields
  const hasDemographics = !!(ageRange && country && profession && industry && selectedPersonas.length > 0)

  function togglePersona(key: string) {
    setSelectedPersonas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function handleAvatarChange(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (avatarPreview && avatarPreview !== profile?.avatar_url) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function saveProfile() {
    if (!username.trim()) { toast.error('@username is required so others can find you'); return }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      toast.error('Username must be 3–20 lowercase letters, numbers, or underscores')
      return
    }
    setSavingProfile(true)

    let avatarUrl = profile?.avatar_url ?? null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('user-avatars')
        .upload(path, avatarFile, { cacheControl: '3600', upsert: true })
      if (uploadErr) {
        toast.error('Failed to upload photo: ' + uploadErr.message)
        setSavingProfile(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('user-avatars').getPublicUrl(path)
      avatarUrl = publicUrl
    }

    const { error } = await (supabase.from('profiles') as any).update({
      display_name: displayName.trim() || null,
      username: username.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      is_research_participant: isResearchParticipant,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)

    if (error) {
      toast.error(error.message.includes('username') ? 'That username is already taken.' : error.message)
    } else {
      toast.success('Profile updated!')
      router.refresh()
    }
    setSavingProfile(false)
  }

  async function saveDemographics() {
    if (!ageRange || !country.trim() || !profession || !industry || selectedPersonas.length === 0) {
      toast.error('Please fill in all required fields: Age, Country, Profession, Industry, and I am a...')
      return
    }
    setSavingDemo(true)

    const payload = {
      user_id: userId,
      age_range: ageRange,
      country: country.trim(),
      profession,
      industry,
      persona_type: selectedPersonas.join(','),
      technical_level: technicalLevel || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await (supabase.from('research_demographics') as any)
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Demographics saved!')
      router.refresh()
    }
    setSavingDemo(false)
  }

  const initials = (displayName || username)
    ? (displayName || username).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'VS'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Update your profile and research demographics</p>
      </div>

      {/* ── Profile Info ── */}
      <div className="bg-white rounded-2xl border p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">Profile Information</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {avatarPreview ? <AvatarImage src={avatarPreview} /> : null}
              <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white shadow flex items-center justify-center bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          <div>
            <button type="button" onClick={() => avatarInputRef.current?.click()} className="text-sm font-medium text-orange-500 hover:text-orange-600">
              Change profile photo
            </button>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, or WebP — max 1 MB</p>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleAvatarChange(e.target.files)} />
        </div>

        {/* Username (primary public handle) */}
        <div className="space-y-1.5">
          <Label>
            @Handle / Username <span className="text-destructive">*</span>
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">— this is what others see</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="yourhandle"
              className="pl-7"
              maxLength={20}
            />
          </div>
          <p className="text-xs text-muted-foreground">3–20 chars, lowercase letters / numbers / underscores only</p>
        </div>

        {/* Display name (private / comms only) */}
        <div className="space-y-1.5">
          <Label>
            Full Name
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">— used in emails and admin communications only</span>
          </Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Jane Smith" />
        </div>

        <div className="space-y-1.5">
          <Label>Bio <span className="text-xs text-muted-foreground font-normal">(optional, shown on your public profile)</span></Label>
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell founders and the community a bit about yourself..."
            rows={3}
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
        </div>

        {/* Research participant toggle */}
        <div className="flex items-center justify-between rounded-2xl border p-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <FlaskConical className="h-4 w-4 text-blue-500" />
              Research Panel
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isResearchParticipant
                ? 'Opted in — founders can request your structured feedback.'
                : 'Opt in to give structured feedback to founders in the Research Lab.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsResearchParticipant(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isResearchParticipant ? 'bg-blue-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isResearchParticipant ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <Button onClick={saveProfile} disabled={savingProfile} className="bg-orange-500 hover:bg-orange-600 text-white">
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      {/* ── Demographics ── */}
      <div className="bg-white rounded-2xl border p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Research Demographics</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Required to participate in the Research Lab. Founders see aggregated breakdowns only — never your individual info.</p>
          </div>
          {hasDemographics ? (
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2.5 py-1 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Complete
            </span>
          ) : (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1 font-medium">
              Required
            </span>
          )}
        </div>

        {!hasDemographics && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            Complete your demographics to give research feedback and earn points for helping founders.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Age Range <span className="text-destructive">*</span></Label>
            <select
              value={ageRange}
              onChange={e => setAgeRange(e.target.value)}
              className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
            >
              <option value="" disabled>Select...</option>
              {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Country <span className="text-destructive">*</span></Label>
            <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="United States" />
          </div>

          <div className="space-y-1.5">
            <Label>Profession / Role <span className="text-destructive">*</span></Label>
            <select
              value={profession}
              onChange={e => setProfession(e.target.value)}
              className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
            >
              <option value="" disabled>Select your role...</option>
              {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Industry <span className="text-destructive">*</span></Label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
            >
              <option value="" disabled>Select your industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Technical Level</Label>
            <select
              value={technicalLevel}
              onChange={e => setTechnicalLevel(e.target.value)}
              className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer capitalize"
            >
              <option value="">Not specified</option>
              {TECH_LEVELS.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
            </select>
          </div>
        </div>

        {/* I am a... multi-select chips */}
        <div className="space-y-2">
          <Label>
            I am a... <span className="text-destructive">*</span>
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
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {opt.label}
                </button>
              )
            })}
          </div>
          {selectedPersonas.length === 0 && (
            <p className="text-xs text-muted-foreground">Select at least one that describes you</p>
          )}
        </div>

        <Button onClick={saveDemographics} disabled={savingDemo} className="bg-blue-500 hover:bg-blue-600 text-white">
          {savingDemo ? 'Saving...' : 'Save Demographics'}
        </Button>
      </div>
    </div>
  )
}
