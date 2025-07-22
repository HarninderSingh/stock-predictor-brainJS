import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { Request } from "next/dist/server/web/types"

export default withAuth(
  function middleware(req: Request) {
    // Example: Only allow admins to access /admin routes
    if (req.nextUrl.pathname.startsWith("/admin") && req.nextauth.token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access to /login, /register, /reset, /api/auth
        if (
          token ||
          req.nextUrl.pathname.startsWith("/login") ||
          req.nextUrl.pathname.startsWith("/register") ||
          req.nextUrl.pathname.startsWith("/reset") ||
          req.nextUrl.pathname.startsWith("/api/auth") ||
          req.nextUrl.pathname === "/" // Allow root to handle redirection
        ) {
          return true
        }
        // Redirect unauthenticated users to login for protected routes
        return false
      },
    },
    pages: {
      signIn: "/login",
    },
  },
)

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*", "/api/register", "/api/reset/:path*"],
}
