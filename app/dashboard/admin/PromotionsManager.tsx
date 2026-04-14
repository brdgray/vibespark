'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PromotionsManagerProps {
  promotions: any[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default function PromotionsManager({ promotions: initial }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function updatePromoStatus(id: string, status: string) {
    setLoading(id)
    const { error } = await (supabase.from('promotions') as any).update({ status }).eq('id', id)
    if (!error) {
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      toast.success(`Promotion ${status}`)
      router.refresh()
    }
    setLoading(null)
  }

  if (promotions.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No promotions yet</div>
  }

  return (
    <div className="space-y-3">
      {promotions.map(promo => (
        <div key={promo.id} className="bg-white rounded-2xl border p-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/startups/${promo.startups?.slug}`} className="font-medium hover:text-orange-500">
                {promo.startups?.name}
              </Link>
              <Badge className={`text-xs ${statusColors[promo.status] ?? ''}`}>{promo.status}</Badge>
              <Badge variant="outline" className="text-xs capitalize">{promo.promotion_type}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(promo.starts_at).toLocaleDateString()} — {new Date(promo.ends_at).toLocaleDateString()}
            </div>
          </div>
          {promo.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updatePromoStatus(promo.id, 'cancelled')}
                disabled={loading === promo.id}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => updatePromoStatus(promo.id, 'active')}
                disabled={loading === promo.id}
              >
                Approve
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
