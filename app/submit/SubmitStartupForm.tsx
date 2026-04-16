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
import { toast } from 'sonner'
import { Plus, Trash2, CheckCircle2, Upload, X, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/** Walk react-hook-form / zod FieldErrors for the first string message (including nested field arrays). */
function firstNestedErrorMessage(errs: Record<string, unknown> | undefined): string | undefined {
  if (!errs) return undefined
  for (const v of Object.values(errs)) {
    if (v == null) continue
    if (typeof v === 'object' && !Array.isArray(v)) {
      const o = v as { message?: unknown; root?: { message?: unknown } }
      if (typeof o.message === 'string' && o.message) return o.message
      if (typeof o.root?.message === 'string' && o.root.message) return o.root.message
    }
    if (Array.isArray(v)) {
      for (const item of v) {
        const nested = firstNestedErrorMessage(item as Record<string, unknown>)
        if (nested) return nested
      }
      continue
    }
    if (typeof v === 'object') {
      const nested = firstNestedErrorMessage(v as Record<string, unknown>)
      if (nested) return nested
    }
  }
  return undefined
}

const schema = z.object({
  name: z.string().min(2).max(100),
  tagline: z.string().min(10).max(160),
  description: z.string().min(30).max(5000),
  websiteUrl: z.string().url('Enter a valid website URL'),
  founderName: z.string().min(2, 'Enter your name (shown on the listing)'),
  founderTitle: z.string().optional(),
  categoryId: z.string().uuid('Choose a category'),
  stageId: z.string().uuid('Choose a stage'),
  targetAudience: z.preprocess(
    v => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().max(300, 'Target audience must be at most 300 characters').optional(),
  ),
  pricingModel: z.string().optional(),
  foundedAt: z.string().optional(),
  location: z.string().optional(),
  teamSize: z.preprocess(
    val => {
      if (val === '' || val === null || val === undefined) return undefined
      const n = Number(val)
      return Number.isFinite(n) && n > 0 ? n : undefined
    },
    z.number().int().positive().optional(),
  ),
  aiStack: z.string().optional(),
  links: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string(),
      }),
    )
    .optional()
    .transform(rows =>
      (rows ?? []).filter(r => r.platform?.trim() && r.url?.trim()),
    )
    .pipe(
      z.array(
        z.object({
          platform: z.string().min(1),
          url: z.string().url('Each social link needs a valid URL'),
        }),
      ),
    ),
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedSlug, setSubmittedSlug] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([])
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([])
  const [showOptional, setShowOptional] = useState(false)
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
      founderName: '',
      founderTitle: '',
      targetAudience: '',
      foundedAt: '',
      location: '',
      aiStack: '',
      teamSize: undefined,
      categoryId: undefined,
      stageId: undefined,
      pricingModel: undefined,
      links: [],
    },
  })

  const { fields: linkFields, append: addLink, remove: removeLink } = useFieldArray({
    control: form.control,
    name: 'links',
  })

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

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    let slug = slugify(data.name)
    let startup: { id: string; slug: string } | null = null

    for (let attempt = 0; attempt < 8; attempt++) {
      const { data: row, error } = await (supabase.from('startups') as any)
        .insert({
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
          verification_status: 'verified',
        })
        .select('id, slug')
        .single()

      if (!error && row) {
        startup = row
        break
      }
      if (error?.message?.includes('unique') || error?.code === '23505') {
        slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 8)}`
        continue
      }
      toast.error(error?.message ?? 'Could not create startup. Check you are signed in and try again.')
      setIsSubmitting(false)
      return
    }

    if (!startup) {
      toast.error('Could not create startup after several tries. Try a slightly different product name.')
      setIsSubmitting(false)
      return
    }

    try {
      await (supabase.from('startup_team_members') as any).insert({
        startup_id: startup.id,
        name: data.founderName,
        title: data.founderTitle || null,
        linkedin_url: null,
        is_public: true,
      })

      const links = data.links ?? []
      if (links.length > 0) {
        await (supabase.from('startup_social_links') as any).insert(
          links.map((l: { platform: string; url: string }) => ({
            startup_id: startup.id,
            platform: l.platform,
            url: l.url,
          })),
        )
      }

      await (supabase.from('user_roles') as any).upsert({ user_id: userId, role: 'startup_owner' })

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

      for (let i = 0; i < screenshotFiles.length; i++) {
        const file = screenshotFiles[i]
        const ext = file.name.split('.').pop()
        const path = `${startup.id}/${i}_${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('startup-screenshots')
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('startup-screenshots').getPublicUrl(path)
          await (supabase.from('startup_screenshots') as any).insert({
            startup_id: startup.id,
            storage_path: publicUrl,
            display_order: i,
          })
        }
      }

      setSubmittedSlug(startup.slug)
      setSubmitted(true)
      toast.success('Your startup is live on VibeSpark!')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong saving related data.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function onInvalid() {
    const first = firstNestedErrorMessage(form.formState.errors as Record<string, unknown>)
    toast.error(first ?? 'Please fix the highlighted fields and try again.')
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl border p-10 text-center space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">You&apos;re live!</h2>
            <p className="text-muted-foreground mt-2 text-left text-sm leading-relaxed">
              Your startup is already visible in the directory and on your public profile. Our team may still spot-check
              new listings from the admin dashboard — no action is required from you.
            </p>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-left text-sm text-blue-900">
              <p className="font-semibold text-blue-950">Optional: Research Lab</p>
              <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                Research Lab lets other opted-in founders and testers leave structured feedback on your product (would
                they use it, short scores, optional notes). It is separate from going live in the directory. Turn it on
                anytime from your startup dashboard — you can explain what you want tested and pause it whenever you
                like.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center pt-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/startup')}>
              Open dashboard
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => router.push(`/startups/${submittedSlug}`)}>
              View public profile
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Want structured feedback?{' '}
            <Link href="/dashboard/startup" className="font-medium text-orange-600 hover:underline">
              Enable Research Lab from My Startup
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <form noValidate onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="divide-y">
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">List your startup</h2>
              <p className="text-sm text-muted-foreground mt-1">
                One short form — your profile goes live as soon as you submit. You can add screenshots, links, and
                Research Lab later from your dashboard.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Product name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. CodePilot AI" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tagline <span className="text-destructive">*</span></Label>
              <Input placeholder="One sentence that captures what you do" {...form.register('tagline')} />
              {form.formState.errors.tagline && (
                <p className="text-xs text-destructive">{form.formState.errors.tagline.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea
                rows={5}
                placeholder="What you build, who it is for, and why it matters (a few sentences is fine)."
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Website <span className="text-destructive">*</span></Label>
              <Input placeholder="https://yourproduct.com" {...form.register('websiteUrl')} />
              {form.formState.errors.websiteUrl && (
                <p className="text-xs text-destructive">{form.formState.errors.websiteUrl.message as string}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Your name <span className="text-destructive">*</span></Label>
                <Input placeholder="Shown as primary contact" {...form.register('founderName')} />
                {form.formState.errors.founderName && (
                  <p className="text-xs text-destructive">{form.formState.errors.founderName.message as string}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Your title</Label>
                <Input placeholder="e.g. CEO & Co-founder" {...form.register('founderTitle')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category <span className="text-destructive">*</span></Label>
              <select
                value={form.watch('categoryId') ?? ''}
                onChange={e => form.setValue('categoryId', e.target.value)}
                className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground"
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.categoryId && (
                <p className="text-xs text-destructive">{form.formState.errors.categoryId.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Stage <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stages.map((s: any) => {
                  const selected = form.watch('stageId') === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => form.setValue('stageId', s.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-all ${
                        selected ? 'border-orange-500 bg-orange-50' : 'border-border hover:border-orange-200'
                      }`}
                    >
                      <div className="font-medium text-sm">{s.name}</div>
                    </button>
                  )
                })}
              </div>
              {form.formState.errors.stageId && (
                <p className="text-xs text-destructive">{form.formState.errors.stageId.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Logo <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
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
                      onClick={() => {
                        setLogoFile(null)
                        setLogoPreview(null)
                      }}
                      className="ml-3 text-sm text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  )}
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
          </div>

          <div className="p-6 space-y-3">
            <button
              type="button"
              onClick={() => setShowOptional(v => !v)}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
            >
              Optional details, links & screenshots
              {showOptional ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showOptional && (
              <div className="space-y-5 pt-2">
                <div className="space-y-1.5">
                  <Label>Target audience</Label>
                  <Textarea rows={2} placeholder="Who is this for?" {...form.register('targetAudience')} />
                  {form.formState.errors.targetAudience && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.targetAudience.message as string}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Pricing</Label>
                    <select
                      value={form.watch('pricingModel') ?? ''}
                      onChange={e => form.setValue('pricingModel', e.target.value as any)}
                      className="w-full h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground"
                    >
                      <option value="">Not specified</option>
                      {PRICING_OPTIONS.map(p => (
                        <option key={p} value={p} className="capitalize">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Team size</Label>
                    <Input type="number" placeholder="Optional" {...form.register('teamSize')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Founded</Label>
                    <Input type="month" {...form.register('foundedAt')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input placeholder="City or Remote" {...form.register('location')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>AI stack / tools</Label>
                  <Input placeholder="Comma-separated, optional" {...form.register('aiStack')} />
                </div>

                <div className="space-y-2">
                  <Label>Social links</Label>
                  {linkFields.length === 0 && (
                    <p className="text-xs text-muted-foreground">Add Twitter, LinkedIn, etc. if you like.</p>
                  )}
                  {linkFields.map((field, i) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <select
                        value={form.watch(`links.${i}.platform`) ?? ''}
                        onChange={e => form.setValue(`links.${i}.platform`, e.target.value)}
                        className="w-36 h-9 appearance-none rounded-2xl border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer text-foreground"
                      >
                        <option value="" disabled>
                          Platform
                        </option>
                        {PLATFORM_OPTIONS.map(p => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <Input placeholder="https://..." className="flex-1" {...form.register(`links.${i}.url`)} />
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        className="mt-2.5 text-slate-400 hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addLink({ platform: '', url: '' })}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add link
                  </Button>
                  {form.formState.errors.links && (
                    <p className="text-xs text-destructive">{String(form.formState.errors.links?.message ?? 'Check link URLs')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Screenshots</Label>
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
                        </div>
                      ))}
                    </div>
                  )}
                  {screenshotFiles.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-400 p-6 text-center transition-colors group"
                    >
                      <Upload className="h-7 w-7 mx-auto text-slate-400 group-hover:text-orange-400 mb-2 transition-colors" />
                      <p className="text-sm font-medium text-slate-600">Upload screenshots</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — up to 6</p>
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
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end px-6 py-4 bg-slate-50/50">
            <Button type="submit" className="min-w-[200px] bg-orange-500 hover:bg-orange-600" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing…' : 'Publish startup'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
