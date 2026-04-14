'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Send } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, subject, message }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-3xl border p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Contact</h1>
            <p className="text-muted-foreground mt-1">
              Questions, feedback, partnerships, or support requests.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
              <div className="flex items-center gap-2 font-semibold">
                <Mail className="h-4 w-4" />
                Message sent
              </div>
              <p className="text-sm mt-2">
                Thanks for contacting VibeSpark. Your message has been sent to the admin inbox and we will reply soon.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Company (optional)</Label>
                <Input value={company} onChange={e => setCompany(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} required />
              </div>

              <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
