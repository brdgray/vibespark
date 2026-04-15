'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { toast } from 'sonner'
import { Plus, Trash2, Upload, ImageIcon } from 'lucide-react'

interface EditStartupFormProps {
  startup: any
  categories: any[]
  stages: any[]
  screenshots: Array<{ id: string; storage_path: string; display_order: number }>
  adminMode?: boolean
}

interface TeamMemberInput {
  id?: string
  name: string
  title: string
  linkedin_url: string
  is_public: boolean
}

interface SocialLinkInput {
  id?: string
  platform: string
  url: string
}

function parseMonth(date: string | null): string {
  if (!date) return ''
  return String(date).slice(0, 7)
}

export default function EditStartupForm({ startup, categories, stages, screenshots, adminMode = false }: EditStartupFormProps) {
  const supabase = createClient()
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(startup.name ?? '')
  const [tagline, setTagline] = useState(startup.tagline ?? '')
  const [description, setDescription] = useState(startup.description ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(startup.website_url ?? '')
  const [categoryId, setCategoryId] = useState(startup.category_id ?? '')
  const [stageId, setStageId] = useState(startup.stage_id ?? '')
  const [targetAudience, setTargetAudience] = useState(startup.target_audience ?? '')
  const [pricingModel, setPricingModel] = useState(startup.pricing_model ?? '')
  const [verificationStatus, setVerificationStatus] = useState(startup.verification_status ?? 'pending')
  const [foundedAt, setFoundedAt] = useState(parseMonth(startup.founded_at))
  const [location, setLocation] = useState(startup.location ?? '')
  const [teamSize, setTeamSize] = useState(startup.team_size ? String(startup.team_size) : '')
  const [aiStack, setAiStack] = useState((startup.ai_stack ?? []).join(', '))

  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>(
    (startup.startup_team_members ?? []).length > 0
      ? startup.startup_team_members.map((m: any) => ({
          id: m.id,
          name: m.name ?? '',
          title: m.title ?? '',
          linkedin_url: m.linkedin_url ?? '',
          is_public: !!m.is_public,
        }))
      : [{ name: '', title: '', linkedin_url: '', is_public: true }]
  )
  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>(
    (startup.startup_social_links ?? []).map((l: any) => ({
      id: l.id,
      platform: l.platform ?? '',
      url: l.url ?? '',
    }))
  )

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [existingShots, setExistingShots] = useState(screenshots)
  const [shotsToDelete, setShotsToDelete] = useState<string[]>([])
  const [newScreenshots, setNewScreenshots] = useState<File[]>([])
  const [newShotPreviews, setNewShotPreviews] = useState<string[]>([])

  const totalScreenshots = existingShots.length + newScreenshots.length

  const canSave = useMemo(
    () => !!name.trim() && !!tagline.trim() && !!description.trim() && !!websiteUrl.trim() && !!categoryId && !!stageId,
    [name, tagline, description, websiteUrl, categoryId, stageId]
  )

  function onAddScreenshot(files: FileList | null) {
    if (!files) return
    const remaining = Math.max(0, 6 - totalScreenshots)
    const picked = Array.from(files).slice(0, remaining)
    if (picked.length === 0) return
    setNewScreenshots(prev => [...prev, ...picked])
    setNewShotPreviews(prev => [...prev, ...picked.map(f => URL.createObjectURL(f))])
  }

  function removeNewScreenshot(index: number) {
    URL.revokeObjectURL(newShotPreviews[index])
    setNewScreenshots(prev => prev.filter((_, i) => i !== index))
    setNewShotPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function removeExistingScreenshot(id: string) {
    setExistingShots(prev => prev.filter(s => s.id !== id))
    setShotsToDelete(prev => [...prev, id])
  }

  async function handleSave() {
    if (!canSave) {
      toast.error('Please complete required startup fields first.')
      return
    }
    setIsSaving(true)

    const { error: startupError } = await (supabase.from('startups') as any)
      .update({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        website_url: websiteUrl.trim(),
        category_id: categoryId,
        stage_id: stageId,
        target_audience: targetAudience.trim() || null,
        pricing_model: pricingModel || null,
        founded_at: foundedAt ? `${foundedAt}-01` : null,
        location: location.trim() || null,
        team_size: teamSize ? Number(teamSize) : null,
        ai_stack: aiStack.trim() ? aiStack.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
        ...(adminMode ? { verification_status: verificationStatus } : {}),
      })
      .eq('id', startup.id)

    if (startupError) {
      toast.error(startupError.message)
      setIsSaving(false)
      return
    }

    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const logoPath = `${startup.id}/logo.${ext}`
      const { error: logoErr } = await supabase.storage
        .from('startup-logos')
        .upload(logoPath, logoFile, { cacheControl: '3600', upsert: true })
      if (logoErr) {
        toast.error(`Logo upload failed: ${logoErr.message}`)
        setIsSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('startup-logos').getPublicUrl(logoPath)
      await (supabase.from('startups') as any).update({ logo_path: publicUrl }).eq('id', startup.id)
    }

    if (shotsToDelete.length > 0) {
      await (supabase.from('startup_screenshots') as any).delete().in('id', shotsToDelete)
    }

    const baseOrder = existingShots.length
    for (let i = 0; i < newScreenshots.length; i++) {
      const file = newScreenshots[i]
      const ext = file.name.split('.').pop()
      const path = `${startup.id}/${Date.now()}_${i}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('startup-screenshots')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadErr) continue
      const { data: { publicUrl } } = supabase.storage.from('startup-screenshots').getPublicUrl(path)
      await (supabase.from('startup_screenshots') as any).insert({
        startup_id: startup.id,
        storage_path: publicUrl,
        display_order: baseOrder + i,
      })
    }

    await (supabase.from('startup_team_members') as any).delete().eq('startup_id', startup.id)
    const validTeam = teamMembers.filter(m => m.name.trim())
    if (validTeam.length > 0) {
      await (supabase.from('startup_team_members') as any).insert(
        validTeam.map(m => ({
          startup_id: startup.id,
          name: m.name.trim(),
          title: m.title.trim() || null,
          linkedin_url: m.linkedin_url.trim() || null,
          is_public: m.is_public,
        }))
      )
    }

    await (supabase.from('startup_social_links') as any).delete().eq('startup_id', startup.id)
    const validLinks = socialLinks.filter(l => l.platform.trim() && l.url.trim())
    if (validLinks.length > 0) {
      await (supabase.from('startup_social_links') as any).insert(
        validLinks.map(l => ({
          startup_id: startup.id,
          platform: l.platform.trim(),
          url: l.url.trim(),
        }))
      )
    }

    toast.success('Startup profile updated.')
    router.push(`/startups/${startup.slug}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Basic Info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {adminMode && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Status</Label>
              <select
                className="w-full h-9 rounded-md border px-3 text-sm"
                value={verificationStatus}
                onChange={e => setVerificationStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Inactive and suspended startups are hidden from the public live site.
              </p>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tagline *</Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description *</Label>
            <Textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Website *</Label>
            <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="" disabled>Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Stage *</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm" value={stageId} onChange={e => setStageId(e.target.value)}>
              <option value="" disabled>Select stage</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Target Audience</Label>
            <Textarea rows={2} value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pricing Model</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm" value={pricingModel} onChange={e => setPricingModel(e.target.value)}>
              <option value="">None</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
              <option value="enterprise">Enterprise</option>
              <option value="open-source">Open Source</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Founded</Label>
            <Input type="month" value={foundedAt} onChange={e => setFoundedAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Team Size</Label>
            <Input type="number" min={1} value={teamSize} onChange={e => setTeamSize(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>AI Stack (comma separated)</Label>
            <Input value={aiStack} onChange={e => setAiStack(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-slate-900">Logo</h2>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-xl border bg-slate-50 flex items-center justify-center">
            {logoPreview ? (
              <Image src={logoPreview} alt="New logo preview" width={64} height={64} className="h-full w-full object-contain" />
            ) : startup.logo_path ? (
              <Image src={startup.logo_path} alt={startup.name} width={64} height={64} className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-6 w-6 text-slate-300" />
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            Upload New Logo
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                setLogoFile(file)
                setLogoPreview(URL.createObjectURL(file))
              }}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">The logo shown on the profile updates when you save this form.</p>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Screenshots</h2>
          <Badge variant="secondary">{totalScreenshots}/6</Badge>
        </div>
        {existingShots.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {existingShots.map(s => (
              <div key={s.id} className="relative overflow-hidden rounded-xl border aspect-video">
                <Image src={s.storage_path} alt="Startup screenshot" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingScreenshot(s.id)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {newShotPreviews.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newShotPreviews.map((src, index) => (
              <div key={src} className="relative overflow-hidden rounded-xl border aspect-video">
                <Image src={src} alt="New screenshot preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewScreenshot(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {totalScreenshots < 6 && (
          <label className="block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground hover:border-orange-300 hover:text-slate-700">
            Add screenshots to your public gallery
            <input
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={e => onAddScreenshot(e.target.files)}
            />
          </label>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Team Members</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTeamMembers(prev => [...prev, { name: '', title: '', linkedin_url: '', is_public: true }])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Member
          </Button>
        </div>
        <div className="space-y-3">
          {teamMembers.map((member, index) => (
            <div key={`${member.id ?? 'new'}-${index}`} className="rounded-xl border p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Name"
                  value={member.name}
                  onChange={e => setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, name: e.target.value } : m))}
                />
                <Input
                  placeholder="Title"
                  value={member.title}
                  onChange={e => setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, title: e.target.value } : m))}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="LinkedIn URL"
                  value={member.linkedin_url}
                  onChange={e => setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, linkedin_url: e.target.value } : m))}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setTeamMembers(prev => prev.filter((_, i) => i !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Social Links</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSocialLinks(prev => [...prev, { platform: '', url: '' }])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Link
          </Button>
        </div>
        <div className="space-y-3">
          {socialLinks.map((link, index) => (
            <div key={`${link.id ?? 'new-link'}-${index}`} className="flex gap-2">
              <Input
                placeholder="Platform"
                value={link.platform}
                onChange={e => setSocialLinks(prev => prev.map((l, i) => i === index ? { ...l, platform: e.target.value } : l))}
              />
              <Input
                placeholder="https://..."
                value={link.url}
                onChange={e => setSocialLinks(prev => prev.map((l, i) => i === index ? { ...l, url: e.target.value } : l))}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => setSocialLinks(prev => prev.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={isSaving || !canSave} className="bg-orange-500 hover:bg-orange-600">
          {isSaving ? 'Saving…' : 'Save Startup Changes'}
        </Button>
        <LinkButton href={`/startups/${startup.slug}`} variant="outline">View Public Profile</LinkButton>
        <LinkButton href="/dashboard/startup" variant="outline">Back to Dashboard</LinkButton>
      </div>
    </div>
  )
}
