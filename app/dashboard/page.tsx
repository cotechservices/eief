// app/dashboard/page.tsx
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

  if (
    role === "SUPER_ADMIN" ||
    role === "DIRECTEUR" ||
    role === "COMPTABLE"
  ) {
    console.log("Redirection vers /dashboard/admin");
    redirect("/dashboard/admin");
  }

  if (role === "ENSEIGNANT") {
    console.log("Redirection vers /dashboard/enseignant");
    redirect("/dashboard/enseignant");
  }

  if (role === "PARENT") {
    console.log("Redirection vers /dashboard/parent");
    redirect("/dashboard/parent");
  }

  if (role === "ELEVE") {
    console.log("Redirection vers /dashboard/eleve");
    redirect("/dashboard/eleve");
  }

  console.log("Rôle non reconnu -> redirection vers login");
  redirect("/login");
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DashboardRedirect />
    </Suspense>
  );
}