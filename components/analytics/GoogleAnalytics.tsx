'use client'

import { useEffect } from 'react'

const GA_MEASUREMENT_ID = 'G-6BTGGGWEG9'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
    __vibespark_ga_init?: boolean
  }
}

/**
 * Loads gtag after mount without Next.js {@link Script}, so the browser does not
 * add a link preload that triggers "preloaded but not used" warnings.
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.__vibespark_ga_init) return
    window.__vibespark_ga_init = true

    window.dataLayer = window.dataLayer || []
    // Match Google's stub — queues until gtag.js loads (uses `arguments`, not rest).
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments as unknown)
    }

    window.gtag('js', new Date())
    window.gtag('config', GA_MEASUREMENT_ID)

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)
  }, [])

  return null
}
