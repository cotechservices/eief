import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { authOptions } from "@/lib/auth";

async function DashboardRedirect() {
  const session = await getServerSession(authOptions);
  
  console.log("=== DASHBOARD REDIRECT ===");
  console.log("Session:", session);
  console.log("Session user:", session?.user);
  console.log("Role:", (session?.user as any)?.role);

  if (!session) {
    console.log("Pas de session -> redirection vers login");
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  console.log("Rôle détecté:", role);

  // ⭐ Tous les rôles possibles
  const roleRedirectMap: Record<string, string> = {
    "SUPER_ADMIN": "/dashboard/admin",
    "ADMIN": "/dashboard/admin",
    "DIRECTEUR_GENERAL": "/dashboard/directeur",
    "DIRECTEUR_ETUDES": "/dashboard/directeur",
    "COMPTABLE": "/dashboard/admin",
    "SECRETARIAT": "/dashboard/admin",
    "SURVEILLANT": "/dashboard/admin",
    "ENSEIGNANT": "/dashboard/enseignant",
    "PARENT": "/dashboard/parent",
    "ELEVE": "/dashboard/eleve",
    "ADMIN_CANTINE": "/dashboard/admin_cantine",        // ⭐ Ajouté
    "ADMIN_TRANSPORT": "/dashboard/admin_transport",    // ⭐ Ajouté
    "ADMIN_BIBLIOTHEQUE": "/dashboard/admin_bibliotheque", // ⭐ Ajouté
    "ADMIN_LIBRAIRIE": "/dashboard/admin_librairie",    // ⭐ Ajouté
    "CHAUFFEUR": "/dashboard/admin_transport",          // ⭐ Ajouté
    "CANTINE": "/dashboard/admin_cantine",              // ⭐ Ajouté
  };

  const redirectPath = roleRedirectMap[role];

  if (redirectPath) {
    console.log(`✅ Redirection vers ${redirectPath}`);
    redirect(redirectPath);
  }

  console.log("❌ Rôle non reconnu -> redirection vers login");
  redirect("/login");
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DashboardRedirect />
    </Suspense>
  );
}