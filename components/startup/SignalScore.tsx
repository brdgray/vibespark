import { TrendingUp } from 'lucide-react'

interface sparkScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function sparkScore({ score, size = 'md' }: sparkScoreProps) {
  const color =
    score >= 70 ? 'text-green-600' :
    score >= 40 ? 'text-orange-500' :
    'text-slate-500'

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <TrendingUp className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      <span className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
        {score}
      </span>
      <span className="text-xs text-muted-foreground font-normal">/ 100</span>
    </div>
  )
}
