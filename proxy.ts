import { NextResponse, type NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup")
  const isApiRoute = pathname.startsWith("/api/")
  const isPublicRoute = pathname === "/" || isAuthRoute || isApiRoute

  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace("https://", "")
    .split(".")[0]

  const hasSession =
    request.cookies.has(`sb-${projectRef}-auth-token`) ||
    request.cookies.has(`sb-${projectRef}-auth-token.0`)

  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export { proxy as default }

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
