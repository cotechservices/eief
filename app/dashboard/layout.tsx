"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Bus,
  Utensils,
  Library,
  BookMarked,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  UserCircle,
  FileText,
  UserPlus,
  RefreshCw,
  FileQuestionMark
} from "lucide-react";
import { Providers } from "./providers";

const menuItems = {
  SUPER_ADMIN: [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Inscriptions", href: "/dashboard/admin/preinscriptions", icon: Users },
    { name: "Réinscriptions", href: "/dashboard/admin/reinscriptions", icon: Users },
    { name: "Parents", href: "/dashboard/admin/parents", icon: Users },
    { name: "Élèves", href: "/dashboard/admin/eleves", icon: Users },
    { name: "Classes", href: "/dashboard/admin/classes", icon: GraduationCap },
    { name: "Personnel", href: "/dashboard/admin/personnel", icon: Users },
    { name: "Paiements", href: "/dashboard/admin/finances/paiements", icon: CreditCard },
    { name: "Salaires", href: "/dashboard/admin/salaires", icon: Users },
    { name: "Rapports", href: "/dashboard/admin/rapports", icon: FileText },
    { name: "Cantine", href: "/dashboard/admin/cantine", icon: Utensils },
    { name: "Transport", href: "/dashboard/admin/transport", icon: Bus },
    { name: "Bibliothèque", href: "/dashboard/admin/bibliotheque", icon: Library },
    { name: "Librairie", href: "/dashboard/admin/librairie", icon: BookMarked },
    { name: "Annonces", href: "/dashboard/admin/annonces", icon: Bell },
    { name: "Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
    { name: "Paramètres", href: "/dashboard/admin/parametres", icon: Settings },
  ],
  DIRECTEUR: [
    { name: "Dashboard", href: "/dashboard/directeur", icon: LayoutDashboard },
    { name: "Statistiques", href: "/dashboard/directeur/stats", icon: LayoutDashboard },
    { name: "Élèves", href: "/dashboard/directeur/eleves", icon: Users },
    { name: "Classes", href: "/dashboard/directeur/classes", icon: GraduationCap },
    { name: "Enseignants", href: "/dashboard/directeur/enseignants", icon: Users },
    { name: "Rapports", href: "/dashboard/directeur/rapports", icon: BookOpen },
    { name: "Personnel", href: "/dashboard/directeur/personnel", icon: Users },
    { name: "Bibliothèque", href: "/dashboard/directeur/bibliotheque", icon: Library },
    { name: "Annonces", href: "/dashboard/directeur/annonces", icon: Bell },
    { name: "Messages", href: "/dashboard/directeur/messages", icon: MessageSquare },
  ],
  COMPTABLE: [
    { name: "Dashboard", href: "/dashboard/comptable", icon: LayoutDashboard },
    { name: "Préinscriptions", href: "/dashboard/comptable/preinscriptions", icon: Users },
    { name: "Réinscriptions", href: "/dashboard/comptable/reinscriptions", icon: Users },
    { name: "Élèves", href: "/dashboard/comptable/eleves", icon: Users },
    { name: "Classes", href: "/dashboard/comptable/classes", icon: GraduationCap },
    { name: "Personnel", href: "/dashboard/comptable/personnel", icon: Users },
    { name: "Paiements", href: "/dashboard/comptable/paiements", icon: CreditCard },
    { name: "Salaires", href: "/dashboard/comptable/salaires", icon: Users },
    { name: "Rapports", href: "/dashboard/comptable/rapports", icon: FileText },
    { name: "Cantine", href: "/dashboard/comptable/cantine", icon: Utensils },
    { name: "Transport", href: "/dashboard/comptable/transport", icon: Bus },
    { name: "Bibliothèque", href: "/dashboard/comptable/bibliotheque", icon: Library },
    { name: "Librairie", href: "/dashboard/comptable/librairie", icon: BookMarked },
    { name: "Messages", href: "/dashboard/comptable/messages", icon: MessageSquare },
  ],
  ENSEIGNANT: [
    { name: "Dashboard", href: "/dashboard/enseignant", icon: LayoutDashboard },
    { name: "Classes", href: "/dashboard/enseignant/classes", icon: GraduationCap },
    { name: "Élèves", href: "/dashboard/enseignant/eleves", icon: Users },
    { name: "Leçons", href: "/dashboard/enseignant/lecons", icon: BookOpen },
    { name: "Devoirs", href: "/dashboard/enseignant/devoirs", icon: BookMarked },
    { name: "Évaluations", href: "/dashboard/enseignant/evaluations", icon: GraduationCap },
    { name: "Emploi", href: "/dashboard/enseignant/emploi", icon: Calendar },
    { name: "Salaire", href: "/dashboard/enseignant/salaire", icon: CreditCard },
    { name: "Messages", href: "/dashboard/enseignant/messages", icon: MessageSquare },
  ],
  PARENT: [
    { name: "Dashboard", href: "/dashboard/parent", icon: LayoutDashboard },
    { name: "Inscription", href: "/dashboard/parent/inscription", icon: UserPlus },
    { name: "Réinscription", href: "/dashboard/parent/reinscription", icon: RefreshCw },
    { name: "Mes enfants", href: "/dashboard/parent/enfants", icon: Users },
    { name: "Finances", href: "/dashboard/parent/finances", icon: CreditCard },
    { name: "Messages", href: "/dashboard/parent/messages", icon: MessageSquare },
    { name: "Librairie", href: "/dashboard/parent/librairie", icon: BookMarked},
  ],
  ELEVE: [
    { name: "Dashboard", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Mes cours", href: "/dashboard/eleve/cours", icon: BookOpen },
    { name: "Mes devoirs", href: "/dashboard/eleve/devoirs", icon: BookOpen },
    { name: "Mes évaluations", href: "/dashboard/eleve/examens", icon: BookOpen },
    { name: "Mes notes", href: "/dashboard/eleve/notes", icon: GraduationCap },
    { name: "Mes bulletins", href: "/dashboard/eleve/bulletins", icon: Calendar },
    { name: "Emploi", href: "/dashboard/eleve/emploi", icon: Calendar },
    { name: "Quiz", href: "/dashboard/eleve/quiz", icon: FileQuestionMark },
  ],
  ADMIN_CANTINE: [
    { name: "Dashboard", href: "/dashboard/admin_cantine", icon: LayoutDashboard },
    { name: "Cantine", href: "/dashboard/admin_cantine/cantine", icon: Utensils },
    //{ name: "Rapports", href: "/dashboard/admin_cantine/rapports", icon: FileText },
  ],
  ADMIN_TRANSPORT: [
    { name: "Dashboard", href: "/dashboard/admin_transport", icon: LayoutDashboard },
    { name: "Transport", href: "/dashboard/admin_transport/transport", icon: Bus },
    { name: "Rapports", href: "/dashboard/admin_transport/rapports", icon: FileText },
  ],
  ADMIN_BIBLIOTHEQUE: [
    { name: "Dashboard", href: "/dashboard/admin_bibliotheque", icon: LayoutDashboard },
    { name: "Bibliothèque", href: "/dashboard/admin_bibliotheque/bibliotheque", icon: Library },
    { name: "Rapports", href: "/dashboard/admin_bibliotheque/rapports", icon: FileText },
  ],
  ADMIN_LIBRAIRIE: [
    { name: "Dashboard", href: "/dashboard/admin_librairie", icon: LayoutDashboard },
    { name: "Librairie", href: "/dashboard/admin_librairie/librairie", icon: BookMarked },
    { name: "Rapports", href: "/dashboard/admin_librairie/rapports", icon: FileText },
  ],
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user) {
      setUserRole((session.user as any)?.role || "PARENT");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement...</p>
        </div>
      </div>
    );
  }

  const getMenuItems = () => {
    // ⭐ Tous les rôles possibles
    const roleMap: Record<string, any> = {
      "SUPER_ADMIN": menuItems.SUPER_ADMIN,
      "ADMIN": menuItems.SUPER_ADMIN,
      "DIRECTEUR_GENERAL": menuItems.DIRECTEUR,
      "DIRECTEUR_ETUDES": menuItems.DIRECTEUR,
      "COMPTABLE": menuItems.SUPER_ADMIN,
      "SECRETARIAT": menuItems.SUPER_ADMIN,
      "SURVEILLANT": menuItems.SUPER_ADMIN,
      "ENSEIGNANT": menuItems.ENSEIGNANT,
      "PARENT": menuItems.PARENT,
      "ELEVE": menuItems.ELEVE,
      "ADMIN_CANTINE": menuItems.ADMIN_CANTINE,
      "ADMIN_TRANSPORT": menuItems.ADMIN_TRANSPORT,
      "ADMIN_BIBLIOTHEQUE": menuItems.ADMIN_BIBLIOTHEQUE,
      "ADMIN_LIBRAIRIE": menuItems.ADMIN_LIBRAIRIE,
      "CHAUFFEUR": menuItems.ADMIN_TRANSPORT,
      "CANTINE": menuItems.ADMIN_CANTINE,
    };

    return roleMap[userRole] || menuItems.PARENT;
  };

  const items = getMenuItems();

  const isActive = (href: string) => {
    if (href === "/dashboard/admin" && pathname === "/dashboard/admin") return true;
    if (href !== "/dashboard/admin" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white shadow-lg ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            {sidebarOpen ? (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Image
                    src="/img/logo.jpg"
                    alt="Logo E.I.E.F"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="font-bold text-blue-900">E.I.E.F</span>
              </Link>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-300">
              {sidebarOpen ? <X className="w-5 h-5 text-black" /> : <Menu className="w-5 h-5 text-black" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition ${active
                    ? "bg-blue-600 text-white"
                    : "text-black hover:bg-blue-50 hover:text-blue-600"
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
                  {sidebarOpen && <span className="text-sm">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex justify-between items-center px-6 py-3">
            <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <UserCircle className="w-8 h-8 text-gray-900" />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                  <p className="text-xs text-gray-900">{userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  );
}