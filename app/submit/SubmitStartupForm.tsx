'use client'

import { useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Plus, Trash2, CheckCircle2, Upload, X, FileText, Users, Layers, Link2, ImageIcon, ClipboardCheck, FlaskConical } from 'lucide-react'
import Image from 'next/image'

const STEPS = [
  { label: 'Basic Info',  icon: FileText },
  { label: 'Team',        icon: Users },
  { label: 'Details',     icon: Layers },
  { label: 'Links',       icon: Link2 },
  { label: 'Screenshots', icon: ImageIcon },
  { label: 'Review',      icon: ClipboardCheck },
]

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const schema = z.object({
  name: z.string().min(2).max(100),
  tagline: z.string().min(10).max(160),
  description: z.string().min(50).max(5000),
  websiteUrl: z.string().url(),
  teamMembers: z.array(z.object({
    name: z.string().min(2),
    title: z.string().optional(),
    linkedinUrl: z.string().optional(),
    isPublic: z.boolean().default(true),
  })).min(1),
  categoryId: z.string().uuid(),
  stageId: z.string().uuid(),
  targetAudience: z.string().max(300).optional(),
  pricingModel: z.string().optional(),
  foundedAt: z.string().optional(),
  location: z.string().optional(),
  teamSize: z.coerce.number().int().positive().optional(),
  aiStack: z.string().optional(),
  links: z.array(z.object({ platform: z.string(), url: z.string().url() })).optional(),
})

type FormData = z.infer<typeof schema>

const PLATFORM_OPTIONS = ['Twitter/X', 'LinkedIn', 'GitHub', 'Product Hunt', 'Discord', 'YouTube', 'Website']
const PRICING_OPTIONS = ['free', 'freemium', 'paid', 'enterprise', 'open-source']

interface SubmitStartupFormProps {
  userId: string
  categories: any[]
  stages: any[]
}

export default function SubmitStartupForm({ userId, categories, stages }: SubmitStartupFormProps) {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedSlug, setSubmittedSlug] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([])
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([])
  const [enableResearchLab, setEnableResearchLab] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    shouldUnregister: false,
    defaultValues: {
      name: '',
      tagline: '',
      description: '',
      websiteUrl: '',
      targetAudience: '',
      foundedAt: '',
      location: '',
      aiStack: '',
      teamSize: undefined,
      categoryId: undefined,
      stageId: undefined,
      pricingModel: undefined,
      teamMembers: [{ name: '', title: '', linkedinUrl: '', isPublic: true }],
      links: [],
    },
  })

  const { fields: teamFields, append: addTeam, remove: removeTeam } = useFieldArray({
    control: form.control, name: 'teamMembers',
  })
  const { fields: linkFields, append: addLink, remove: removeLink } = useFieldArray({
    control: form.control, name: 'links',
  })

  const totalSteps = STEPS.length
  const progress = Math.round(((step + 1) / totalSteps) * 100)

  async function goNext() {
    let valid = false
    if (step === 0) valid = await form.trigger(['name', 'tagline', 'description', 'websiteUrl'])
    else if (step === 1) valid = await form.trigger(['teamMembers'])
    else if (step === 2) valid = await form.trigger(['categoryId', 'stageId'])
    else valid = true
    if (valid) setStep(s => Math.min(s + 1, totalSteps - 1))
  }

  function handleLogoChange(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function addScreenshots(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 6 - screenshotFiles.length)
    const newPreviews = newFiles.map(f => URL.createObjectURL(f))
    setScreenshotFiles(prev => [...prev, ...newFiles])
    setScreenshotPreviews(prev => [...prev, ...newPreviews])
  }

  function removeScreenshot(idx: number) {
    URL.revokeObjectURL(screenshotPreviews[idx])
    setScreenshotFiles(prev => prev.filter((_, i) => i !== idx))
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(data: any) {
    setIsSubmitting(true)
    const slug = slugify(data.name)

    const { data: startup, error } = await (supabase.from('startups') as any).insert({
      name: data.name,
      slug,
      tagline: data.tagline,
      description: data.description,
      website_url: data.websiteUrl,
      category_id: data.categoryId,
      stage_id: data.stageId,
      target_audience: data.targetAudience || null,
      pricing_model: data.pricingModel || null,
      founded_at: data.foundedAt ? `${data.foundedAt}-01` : null,
      location: data.location || null,
      team_size: data.teamSize || null,
      ai_stack: data.aiStack ? data.aiStack.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
      created_by: userId,
      verification_status: 'pending',
    }).select('id, slug').single()

    if (error) {
      toast.error(error.message.includes('unique') ? 'A startup with this name already exists.' : error.message)
      setIsSubmitting(false)
      return
    }

    // Team members
    if (data.teamMembers?.length > 0) {
      await (supabase.from('startup_team_members') as any).insert(
        data.teamMembers.map((m: any) => ({
          startup_id: startup.id, name: m.name,
          title: m.title || null, linkedin_url: m.linkedinUrl || null, is_public: m.isPublic,
        }))
      )
    }

    // Social links
    if (data.links?.length > 0) {
      await (supabase.from('startup_social_links') as any).insert(
        data.links.map((l: any) => ({ startup_id: startup.id, platform: l.platform, url: l.url }))
      )
    }

    // Grant startup_owner role
    await (supabase.from('user_roles') as any).upsert({ user_id: userId, role: 'startup_owner' })

    // Create research request if opted in (listed in Research Lab; viewing others’ lab stats still requires 3 feedbacks)
    if (enableResearchLab) {
      await (supabase.from('research_requests') as any).insert({
        startup_id: startup.id,
        title: `Feedback on ${data.name}`,
        created_by: userId,
        is_active: true,
      })
    }

    // Upload logo
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const logoPath = `${startup.id}/logo.${ext}`
      const { error: logoErr } = await supabase.storage
        .from('startup-logos')
        .upload(logoPath, logoFile, { cacheControl: '3600', upsert: true })
      if (!logoErr) {
        const { data: { publicUrl } } = supabase.storage.from('startup-logos').getPublicUrl(logoPath)
        await (supabase.from('startups') as any).update({ logo_path: publicUrl }).eq('id', startup.id)
      }
    }

    // Upload screenshots
    for (let i = 0; i < screenshotFiles.length; i++) {
      const file = screenshotFiles[i]
      const ext = file.name.split('.').pop()
      const path = `${startup.id}/${i}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('startup-screenshots')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('startup-screenshots')
          .getPublicUrl(path)
        await (supabase.from('startup_screenshots') as any).insert({
          startup_id: startup.id, storage_path: publicUrl, display_order: i,
        })
      }
    }

    setSubmittedSlug(startup.slug)
    setSubmitted(true)
    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl border p-10 text-center space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Startup Submitted!</h2>
            <p className="text-muted-foreground mt-2">
              Your startup is now pending verification. Our team will review it within 1–3 business days.
              Once approved, it will appear in the VibeSpark directory.
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/startup')}>
              View Dashboard
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => router.push(`/startups/${submittedSlug}`)}>
              View Profile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Single progress bar */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <StepIcon className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Step {step + 1} of {totalSteps}</p>
              <p className="font-semibold text-slate-900 text-sm">{STEPS[step].label}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-orange-500">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
        {/* Step dots */}
        <div className="flex items-center gap-1 mt-3">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < step ? 'bg-orange-500' : i === step ? 'bg-orange-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tell us about your startup</h2>
                <p className="text-sm text-muted-foreground mt-1">The basics — name, what it does, and where to find it.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Product Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. CodePilot AI" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Tagline <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">(10–160 characters)</span></Label>
                <Input placeholder="One sentence that captures what you do" {...form.register('tagline')} />
                {form.formState.errors.tagline && <p className="text-xs text-destructive">{form.formState.errors.tagline.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Full Description <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">(min 50 characters)</span></Label>
                <Textarea rows={6} placeholder="Describe your product, the problem it solves, and who it's for. Be specific — the more detail, the better your community feedback." {...form.register('description')} />
                {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Website URL <span className="text-destructive">*</span></Label>
                <Input placeholder="https://yourproduct.com" {...form.register('websiteUrl')} />
                {form.formState.errors.websiteUrl && <p className="text-xs text-destructive">{form.formState.errors.websiteUrl.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Logo <span className="text-xs text-muted-foreground font-normal">(optional — PNG, JPG, WebP, max 2 MB)</span></Label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="relative flex-shrink-0 w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-slate-50 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors overflow-hidden"
                  >
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-1" />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-sm font-medium text-orange-500 hover:text-orange-600"
                    >
                      {logoPreview ? 'Change logo' : 'Upload logo'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                        className="ml-3 text-sm text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Square image works best</p>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={e => handleLogoChange(e.target.files)}
                />
              </div>
            </div>
          )}

          {/* Step 1: Team */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Who built this?</h2>
                <p className="text-sm text-muted-foreground mt-1">Add the founders and key team members. At least one is required.</p>
              </div>
              {teamFields.map((field, i) => (
                <div key={field.id} className="rounded-2xl border p-4 space-y-3 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">
                      {i === 0 ? 'Primary Founder' : `Team Member ${i + 1}`}
                    </span>
                    {i > 0 && (
                      <button type="button" onClick={() => removeTeam(i)} className="text-slate-400 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
                      <Input placeholder="Jane Smith" {...form.register(`teamMembers.${i}.name`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input placeholder="CEO & Co-founder" {...form.register(`teamMembers.${i}.title`)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">LinkedIn URL</Label>
                    <Input placeholder="https://linkedin.com/in/..." {...form.register(`teamMembers.${i}.linkedinUrl`)} />
                  </div>
                </div>
              ))}
              {form.formState.errors.teamMembers && (
                <p className="text-xs text-destructive">At least one team member is required</p>
              )}
              <Button type="button" variant="outline" size="sm"
                onClick={() => addTeam({ name: '', title: '', linkedinUrl: '', isPublic: true })}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Team Member
              </Button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Product details</h2>
                <p className="text-sm text-muted-foreground mt-1">Category, stage, audience, and the tools you used.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <select
                  value={form.watch('categoryId') ?? ''}
                  onChange={e => form.setValue('categoryId', e.target.value)}
                  className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground"
                >
                  <option value="" disabled>Select a category...</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {form.formState.errors.categoryId && <p className="text-xs text-destructive">Please select a category</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Current Stage <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stages.map((s: any) => {
                    const selected = form.watch('stageId') === s.id
                    return (
                      <button key={s.id} type="button"
                        onClick={() => form.setValue('stageId', s.id)}
                        className={`text-left rounded-xl border-2 p-3 transition-all ${
                          selected ? 'border-orange-500 bg-orange-50' : 'border-border hover:border-orange-200'
                        }`}>
                        <div className="font-medium text-sm">{s.name}</div>
                      </button>
                    )
                  })}
                </div>
                {form.formState.errors.stageId && <p className="text-xs text-destructive">Please select a stage</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Textarea rows={2} placeholder="e.g. Solo developers, marketing teams at SMBs, non-technical founders..." {...form.register('targetAudience')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Pricing Model</Label>
                  <select
                    value={form.watch('pricingModel') ?? ''}
                    onChange={e => form.setValue('pricingModel', e.target.value as any)}
                    className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground"
                  >
                    <option value="" disabled>Select...</option>
                    {PRICING_OPTIONS.map(p => (
                      <option key={p} value={p} className="capitalize">{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Team Size</Label>
                  <Input type="number" min="1" placeholder="3" {...form.register('teamSize')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Founded</Label>
                  <Input type="month" {...form.register('foundedAt')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input placeholder="San Francisco or Remote" {...form.register('location')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>AI Stack / Tools Used</Label>
                <Input placeholder="e.g. GPT-4o, Claude, Supabase, Cursor (comma-separated)" {...form.register('aiStack')} />
              </div>
            </div>
          )}

          {/* Step 3: Links */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Social links</h2>
                <p className="text-sm text-muted-foreground mt-1">Add links to your social profiles, GitHub, or community spaces. Optional.</p>
              </div>
              {linkFields.length === 0 && (
                <div className="text-center py-8 rounded-2xl border border-dashed text-muted-foreground text-sm">
                  No links yet — add your first one below.
                </div>
              )}
              {linkFields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <select
                    value={form.watch(`links.${i}.platform`) ?? ''}
                    onChange={e => form.setValue(`links.${i}.platform`, e.target.value)}
                    className="w-36 h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground"
                  >
                    <option value="" disabled>Platform</option>
                    {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <Input placeholder="https://..." className="flex-1" {...form.register(`links.${i}.url`)} />
                  <button type="button" onClick={() => removeLink(i)} className="mt-2.5 text-slate-400 hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addLink({ platform: '', url: '' })}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Link
              </Button>
            </div>
          )}

          {/* Step 4: Screenshots */}
          {step === 4 && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Product screenshots</h2>
                <p className="text-sm text-muted-foreground mt-1">Upload up to 6 screenshots of your product. These appear in a gallery on your profile. Optional but highly recommended.</p>
              </div>

              {screenshotPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {screenshotPreviews.map((src, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border aspect-video bg-slate-50">
                      <Image src={src} alt={`Screenshot ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                      <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] rounded-full px-1.5 py-0.5">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {screenshotFiles.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-400 p-8 text-center transition-colors group"
                >
                  <Upload className="h-8 w-8 mx-auto text-slate-400 group-hover:text-orange-400 mb-2 transition-colors" />
                  <p className="text-sm font-medium text-slate-600">Click to upload screenshots</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — up to 6 images, max 5MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => addScreenshots(e.target.files)}
                  />
                </button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {screenshotFiles.length}/6 screenshots added
              </p>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Review & Submit</h2>
                <p className="text-sm text-muted-foreground mt-1">Almost there! Check your details below.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border divide-y text-sm">
                {[
                  { label: 'Name', value: form.watch('name') },
                  { label: 'Tagline', value: form.watch('tagline') },
                  { label: 'Website', value: form.watch('websiteUrl') },
                  { label: 'Team members', value: `${form.watch('teamMembers')?.length ?? 0} added` },
                  { label: 'Links', value: `${form.watch('links')?.length ?? 0} added` },
                  { label: 'Screenshots', value: `${screenshotFiles.length} uploaded` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-slate-800 text-right max-w-[55%] truncate">{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Research Lab opt-in toggle */}
              <div
                className={`rounded-2xl border p-4 flex items-start justify-between gap-4 transition-colors ${
                  enableResearchLab ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${enableResearchLab ? 'bg-blue-100' : 'bg-slate-200'}`}>
                    <FlaskConical className={`h-4 w-4 ${enableResearchLab ? 'text-blue-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">Include in Research Lab</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      This is ON by default so you can receive structured community feedback later. Turn it OFF if you do not want Research Lab for this startup.
                    </p>
                    <p className="text-xs mt-1 text-blue-700">
                      You can turn Research Lab on anytime. To read incoming feedback on your own startup from the Lab and unlock full research stats, give structured feedback on 3 other startups first.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableResearchLab(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                    enableResearchLab ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    enableResearchLab ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
                <p className="font-semibold">Verification Notice</p>
                <p className="mt-0.5">Your startup will be reviewed by our team within 1–3 business days. Once approved, it will appear in the VibeSpark directory.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between px-6 pb-6 pt-2 border-t bg-slate-50/50">
            <Button type="button" variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </Button>
            {step < totalSteps - 1 ? (
              <Button type="button" className="bg-orange-500 hover:bg-orange-600" onClick={goNext}>
                Continue →
              </Button>
            ) : (
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 min-w-40" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit for Verification'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
