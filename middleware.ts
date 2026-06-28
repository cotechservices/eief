// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Configuration des rôles par route
const routeRoles: Record<string, string[]> = {
  "/admin": ["SUPER_ADMIN", "COMPTABLE"],
  "/dashboard/admin": ["SUPER_ADMIN", "COMPTABLE"],
  "/parent": ["PARENT"],
  "/dashboard/parent": ["PARENT"],
  "/eleve": ["ELEVE"],
  "/dashboard/eleve": ["ELEVE"],
  "/enseignant": ["ENSEIGNANT"],
  "/dashboard/enseignant": ["ENSEIGNANT"],
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Vérifier chaque route configurée
    for (const [route, allowedRoles] of Object.entries(routeRoles)) {
      if (path.startsWith(route)) {
        if (!token || !allowedRoles.includes(token.role as string)) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/parent/:path*",
    "/eleve/:path*",
    "/enseignant/:path*",
  ],
};