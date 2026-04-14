export const metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">1. Information we collect</h2>
              <p className="mt-2">
                We collect account data (email, username, profile details), activity data (votes, saves, comments,
                research feedback), and optional demographic data you provide for research segmentation.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">2. How we use your information</h2>
              <p className="mt-2">
                We use data to operate VibeSpark, calculate Spark Scores, provide dashboards, moderate content,
                improve product quality, and communicate important account and service updates.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">3. Research data</h2>
              <p className="mt-2">
                Individual research responses may be visible to founders. Demographic insights are shown in aggregate
                where appropriate. We do not sell your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">4. Third-party services</h2>
              <p className="mt-2">
                We use Supabase, Vercel, and Google OAuth to power authentication, storage, and hosting.
                These services process data as needed to provide platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">5. Data retention and deletion</h2>
              <p className="mt-2">
                We retain data while your account is active or as required for compliance and abuse prevention.
                To request deletion, contact us via the contact form.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">6. Contact</h2>
              <p className="mt-2">
                For privacy requests, visit the Contact page and include “Privacy Request” in your subject line.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
