'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  function goHome() {
    setIsLoading(true)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to VibeSpark</CardTitle>
          <CardDescription>
            You&apos;re signed in. Explore the directory, save startups you like, or list your own product.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-slate-100 p-4 space-y-2 text-sm text-slate-700">
            <p>Browse AI startups by stage, vote, and read community signals.</p>
            <p className="text-xs text-muted-foreground">
              Optional: later, add Research Lab demographics from your profile if you want to give structured feedback
              and unlock segmented insights.
            </p>
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={goHome} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Go to VibeSpark'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Want the Research Lab panel?{' '}
            <Link href="/dashboard/user/profile" className="font-medium text-orange-600 hover:underline">
              Open profile settings
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
