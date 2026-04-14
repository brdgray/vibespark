export const metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="mt-8 space-y-6 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">1. Acceptance of terms</h2>
              <p className="mt-2">
                By using VibeSpark, you agree to these Terms and our Privacy Policy. If you do not agree,
                do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">2. User accounts</h2>
              <p className="mt-2">
                You are responsible for safeguarding your account credentials and for all activity under your account.
                You must provide accurate information and comply with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">3. Content and conduct</h2>
              <p className="mt-2">
                Do not post unlawful, abusive, fraudulent, or misleading content. We may remove content or suspend
                accounts that violate platform policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">4. Founder submissions</h2>
              <p className="mt-2">
                Startup submissions are subject to verification and moderation. Submission does not guarantee approval,
                featuring, ranking position, or ongoing visibility.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">5. Platform availability</h2>
              <p className="mt-2">
                We may modify, suspend, or discontinue parts of the service at any time. We are not liable for
                interruptions, delays, or data loss beyond what is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">6. Contact</h2>
              <p className="mt-2">
                Questions about these Terms can be submitted through the Contact page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
