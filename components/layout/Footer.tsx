import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Image src="/logo-dark.png" alt="VibeSpark" width={180} height={50} className="h-12 w-auto mb-3" />
            <p className="text-sm text-slate-400 leading-relaxed">
              The verified directory for AI-built startups. Real traction signals, real community feedback.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/directory" className="hover:text-orange-400 transition-colors">Directory</Link></li>
              <li><Link href="/trending" className="hover:text-orange-400 transition-colors">Trending</Link></li>
              <li><Link href="/research-lab" className="hover:text-orange-400 transition-colors">Research Lab</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Founders</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/submit" className="hover:text-orange-400 transition-colors">Submit Startup</Link></li>
              <li><Link href="/dashboard/startup" className="hover:text-orange-400 transition-colors">Startup Dashboard</Link></li>
              <li><Link href="/auth/signup" className="hover:text-orange-400 transition-colors">Create Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-orange-400 transition-colors">About</Link></li>
              <li><Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="mailto:hello@vibespark.co" className="hover:text-orange-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} VibeSpark. All rights reserved.</p>
          <p>Built for AI founders, by the community.</p>
        </div>
      </div>
    </footer>
  )
}
