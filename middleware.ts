import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` augments your `Request` with the `auth` property.
  function middleware(req) {
    // console.log("req.nextUrl.pathname", req.nextUrl.pathname);
    // console.log("token", req.auth.token);
    // if (req.nextUrl.pathname.startsWith("/create-invoice") && req.auth.token?.role !== "admin") {
    //   return NextResponse.rewrite(
    //     new URL("/denied", req.url)
    //   );
    // }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "admin") {
          return false
        }
        return !!token
      },
    },
    pages: {
      signIn: "/login",
      error: "/error",
    },
  },
)

// Applies next-auth only to matching routes - can be regex
// Ref: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = { matcher: ["/admin/:path*", "/create-invoice"] }
