'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { FlaskConical } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResearchSettingsProps {
  userId: string
  isResearchParticipant: boolean
}

export default function ResearchSettings({ userId, isResearchParticipant: initial }: ResearchSettingsProps) {
  const [isParticipant, setIsParticipant] = useState(initial)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggleResearch() {
    setIsLoading(true)
    const { error } = await (supabase.from('profiles') as any)
      .update({ is_research_participant: !isParticipant })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to update settings')
    } else {
      setIsParticipant(!isParticipant)
      toast.success(isParticipant ? 'Research participation disabled' : 'Research participation enabled')
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-500" />
            Research Panel
          </CardTitle>
          <CardDescription>
            Control whether you participate in the Research Lab and help founders validate their products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <div className="font-medium text-slate-800">Research Participation</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {isParticipant
                  ? 'You are currently opted in to the research panel.'
                  : 'You are not currently participating in research.'}
              </div>
            </div>
            <Button
              onClick={toggleResearch}
              disabled={isLoading}
              variant={isParticipant ? 'outline' : 'default'}
              className={isParticipant ? '' : 'bg-blue-500 hover:bg-blue-600'}
            >
              {isLoading ? 'Updating...' : isParticipant ? 'Opt Out' : 'Opt In'}
            </Button>
          </div>
          {isParticipant && (
            <p className="text-xs text-muted-foreground">
              Your responses are anonymous to other community members. Founders only see aggregated demographic breakdowns, not your individual details.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
