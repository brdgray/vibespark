import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FlaskConical, Shield, TrendingUp, Users } from 'lucide-react'

export const metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
        <section className="bg-white rounded-3xl border p-6 sm:p-10">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">About VibeSpark</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
            Verified AI startups, ranked by real Spark Scores
          </h1>
          <p className="text-slate-600 mt-4 leading-relaxed max-w-3xl">
            VibeSpark is a trust-first platform where founders submit AI products, our team verifies them,
            and the community provides structured feedback. Spark Scores reflect real engagement and usefulness,
            not vanity metrics.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: Shield,
              title: 'Verified submissions',
              desc: 'Every startup is reviewed for authenticity and quality before broader visibility.',
            },
            {
              icon: TrendingUp,
              title: 'Spark Scores',
              desc: 'Scores combine support, saves, feedback quality, and activity to highlight real traction.',
            },
            {
              icon: FlaskConical,
              title: 'Research Lab',
              desc: 'Founders can collect structured product feedback from community members and demographics.',
            },
            {
              icon: Users,
              title: 'Founder + community ecosystem',
              desc: 'Users can support startups, founders can learn from users, and both earn reputation over time.',
            },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl border p-5">
              <item.icon className="h-6 w-6 text-orange-500" />
              <h2 className="font-semibold text-slate-900 mt-3">{item.title}</h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-semibold text-slate-900">Our principles</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            {[
              'Quality over hype',
              'Community contribution should be rewarded',
              'Founders deserve actionable feedback',
              'Transparency and fair moderation',
            ].map(point => (
              <li key={point} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
