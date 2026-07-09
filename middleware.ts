// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes protégées et rôles autorisés
const routeRoles: Record<string, string[]> = {
  // Routes spécifiques
  "/dashboard/admin_cantine": ["ADMIN_CANTINE"],
  "/admin_cantine": ["ADMIN_CANTINE"],

  "/dashboard/admin_transport": ["ADMIN_TRANSPORT"],
  "/admin_transport": ["ADMIN_TRANSPORT"],

  "/dashboard/admin_bibliotheque": ["ADMIN_BIBLIOTHEQUE"],
  "/admin_bibliotheque": ["ADMIN_BIBLIOTHEQUE"],

  "/dashboard/admin_librairie": ["ADMIN_LIBRAIRIE"],
  "/admin_librairie": ["ADMIN_LIBRAIRIE"],

  "/dashboard/parent": ["PARENT"],
  "/parent": ["PARENT"],

  "/dashboard/eleve": ["ELEVE"],
  "/eleve": ["ELEVE"],

  "/dashboard/enseignant": ["ENSEIGNANT"],
  "/enseignant": ["ENSEIGNANT"],

  // Routes génériques (toujours en dernier)
  "/dashboard/admin": ["SUPER_ADMIN", "COMPTABLE"],
  "/admin": ["SUPER_ADMIN", "COMPTABLE"],
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log("=== MIDDLEWARE ===");
    console.log("Path :", path);
    console.log("Role :", token?.role);

    for (const [route, allowedRoles] of Object.entries(routeRoles)) {
      if (path.startsWith(route)) {
        // Le token est normalement présent grâce à authorized()
        if (!token) {
          return NextResponse.redirect(new URL("/login", req.url));
        }

        if (!allowedRoles.includes(token.role as string)) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        return NextResponse.next();
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Seules les routes du matcher arrivent ici.
        // Si pas de token, NextAuth redirige automatiquement vers /login.
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/admin_cantine/:path*",
    "/admin_transport/:path*",
    "/admin_bibliotheque/:path*",
    "/admin_librairie/:path*",
    "/parent/:path*",
    "/eleve/:path*",
    "/enseignant/:path*",
  ],
};