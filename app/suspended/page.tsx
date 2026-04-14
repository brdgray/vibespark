import Link from 'next/link'
import Image from 'next/image'
import { ShieldOff } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'

export const metadata = { title: 'Account Suspended' }

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border shadow-sm p-10 text-center space-y-5">
        <Link href="/">
          <Image src="/logo.png" alt="VibeSpark" width={140} height={40} className="h-10 w-auto mx-auto" />
        </Link>
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <ShieldOff className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Suspended</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Your account has been suspended due to a violation of our community guidelines.
            If you believe this is a mistake, please contact us.
          </p>
        </div>
        <LinkButton href="mailto:hello@vibespark.co" variant="outline" className="w-full">
          Contact Support
        </LinkButton>
      </div>
    </div>
  )
}
