/**
 * Origin for post-auth redirects (OAuth / magic-link callback).
 * Prefers proxy headers so Vercel / ngrok match the URL the user actually opened.
 * If localhost still lands on production, add that origin under Supabase → Auth → Redirect URLs.
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url)

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')

  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim()
    let proto = (forwardedProto ?? 'https').split(',')[0].trim().toLowerCase()
    if (proto !== 'http' && proto !== 'https') {
      proto = url.protocol === 'http:' ? 'http' : 'https'
    }
    return `${proto}://${host}`
  }

  return url.origin
}
