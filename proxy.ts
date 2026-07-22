import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Must be initialised before any early returns so the response object
  // can carry refreshed session cookies back to the browser.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward updated cookies to the request so downstream
          // Server Components see the refreshed session.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() silently refreshes the access token via the refresh token when
  // it has expired. Without this, server-side auth fails after ~1 hour and
  // getUser() in Server Components returns null even for active sessions.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup")
  const isApiRoute = pathname.startsWith("/api/")
  const isPublicRoute = pathname === "/" || isAuthRoute || isApiRoute

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export { proxy as default }

export const config = {
  matcher: [
    // Exclude PWA assets (manifest.json, sw.js) and other static files so they are
    // never redirected to /login. A redirected manifest/service worker is invalid
    // and breaks installability — on iOS especially, where the manifest is read at
    // "Add to Home Screen" time, often from the public login page.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
}
