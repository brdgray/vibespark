'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Zap } from 'lucide-react'

interface HistoryPoint {
  spark_score: number
  recorded_date: string
}

interface SparkScoreChartProps {
  history: HistoryPoint[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SparkScoreChart({ history }: SparkScoreChartProps) {
  const data = history.map(h => ({
    date: formatDate(h.recorded_date),
    score: h.spark_score,
  }))

  const latest = data[data.length - 1]?.score ?? 0
  const first = data[0]?.score ?? 0
  const delta = latest - first
  const isUp = delta >= 0

  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-orange-500 fill-orange-500" />
          Score History
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
        }`}>
          {isUp ? '+' : ''}{delta} pts
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Last {data.length} days</p>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value) => [`${value}`, 'Spark Score']}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#sparkGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
