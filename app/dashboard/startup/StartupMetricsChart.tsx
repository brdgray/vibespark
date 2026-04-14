'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StartupMetricsChartProps {
  wouldUseYes: number
  wouldUseMaybe: number
  wouldUseNo: number
}

const COLORS = ['#22c55e', '#f59e0b', '#94a3b8']

export default function StartupMetricsChart({ wouldUseYes, wouldUseMaybe, wouldUseNo }: StartupMetricsChartProps) {
  const data = [
    { name: 'Would Use', value: wouldUseYes },
    { name: 'Maybe', value: wouldUseMaybe },
    { name: 'Would Not Use', value: wouldUseNo },
  ].filter(d => d.value > 0)

  const total = wouldUseYes + wouldUseMaybe + wouldUseNo

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Would-Use Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const num = Number(value)
                  return [`${num} (${Math.round((num / total) * 100)}%)`, '']
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 min-w-[160px]">
            {[
              { label: 'Would Use', count: wouldUseYes, color: 'bg-green-500' },
              { label: 'Maybe', count: wouldUseMaybe, color: 'bg-amber-400' },
              { label: 'Would Not Use', count: wouldUseNo, color: 'bg-slate-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-slate-600 flex-1">{item.label}</span>
                <span className="font-medium">{item.count}</span>
                <span className="text-muted-foreground text-xs">
                  ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
