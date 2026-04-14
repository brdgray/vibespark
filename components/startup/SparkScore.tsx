import { Zap } from 'lucide-react'

interface SparkScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function SparkScore({ score, size = 'md' }: SparkScoreProps) {
  const color =
    score >= 70 ? 'text-orange-500' :
    score >= 40 ? 'text-amber-500' :
    'text-slate-400'

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Zap className={`${size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} fill-current`} />
      <span className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
        {score}
      </span>
      <span className="text-xs text-muted-foreground font-normal">Spark</span>
    </div>
  )
}
