'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReportedContentProps {
  reports: any[]
}

export default function ReportedContent({ reports: initial }: ReportedContentProps) {
  const [reports, setReports] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function updateReport(id: string, status: 'resolved' | 'dismissed') {
    setLoading(id)
    const { error } = await (supabase.from('reports') as any).update({ status }).eq('id', id)
    if (!error) {
      setReports(prev => prev.filter(r => r.id !== id))
      toast.success(`Report ${status}`)
      router.refresh()
    }
    setLoading(null)
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No open reports
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map(report => (
        <div key={report.id} className="bg-white rounded-2xl border border-red-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs capitalize">{report.entity_type}</Badge>
                <span className="text-xs text-muted-foreground">
                  Reported by {report.profiles?.display_name ?? 'Unknown'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800">{report.reason}</p>
              {report.details && <p className="text-sm text-muted-foreground mt-0.5">{report.details}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateReport(report.id, 'dismissed')}
                disabled={loading === report.id}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600"
                onClick={() => updateReport(report.id, 'resolved')}
                disabled={loading === report.id}
              >
                Resolve
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
