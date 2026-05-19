// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }

    const role = (session.user as any)?.role;
    
    if (role === "SUPER_ADMIN" || role === "DIRECTEUR" || role === "COMPTABLE") {
      router.push("/dashboard/admin");
    } else if (role === "ENSEIGNANT") {
      router.push("/dashboard/enseignant");
    } else if (role === "PARENT") {
      router.push("/dashboard/parent");
    } else if (role === "ELEVE") {
      router.push("/dashboard/eleve");
    } else {
      router.push("/dashboard/parent");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection...</p>
      </div>
    </div>
  );
}