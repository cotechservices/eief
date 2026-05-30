// app/dashboard/layout.tsx
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
  DollarSign,
  Euro,
  FileText
} from "lucide-react";
import { Providers } from "./providers";

const menuItems = {
  SUPER_ADMIN: [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },    
    { name: "Preinscriptions", href: "/dashboard/admin/preinscriptions", icon: Users },
    { name: "Élèves", href: "/dashboard/admin/eleves", icon: Users },
    { name: "Classes", href: "/dashboard/admin/classes", icon: GraduationCap },
    { name: "Enseignants", href: "/dashboard/admin/enseignants", icon: Users },
    { name: "Personnel", href: "/dashboard/admin/personnel", icon: Users },
    { name: "Paiements", href: "/dashboard/admin/finances/paiements", icon: CreditCard },
    { name: "Frais scolaires", href: "/dashboard/admin/frais", icon: Euro },
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
  { name: "Paiements", href: "/dashboard/comptable/paiements", icon: CreditCard },
  { name: "Frais scolaires", href: "/dashboard/comptable/frais", icon: Euro },
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
    { name: "Mes classes", href: "/dashboard/enseignant/classes", icon: GraduationCap },
    { name: "Leçons", href: "/dashboard/enseignant/lecons", icon: BookOpen },
    { name: "Devoirs", href: "/dashboard/enseignant/devoirs", icon: BookOpen },
    { name: "Emploi", href: "/dashboard/enseignant/emploi", icon: Calendar },
    { name: "Messages", href: "/dashboard/enseignant/messages", icon: MessageSquare },
  ],
  PARENT: [
    { name: "Dashboard", href: "/dashboard/parent", icon: LayoutDashboard },
    { name: "Mes enfants", href: "/dashboard/parent/enfants", icon: Users },
    { name: "Finances", href: "/dashboard/parent/finances", icon: CreditCard },
    { name: "Messages", href: "/dashboard/parent/messages", icon: MessageSquare },
    { name: "Transport", href: "/dashboard/parent/transport", icon: Bus },
    { name: "Cantine", href: "/dashboard/parent/cantine", icon: Utensils },
    
  ],
  ELEVE: [
    { name: "Dashboard", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Mes cours", href: "/dashboard/eleve/cours", icon: BookOpen },
    { name: "Mes devoirs", href: "/dashboard/eleve/devoirs", icon: BookOpen },
    { name: "Mes notes", href: "/dashboard/eleve/notes", icon: GraduationCap },
    { name: "Emploi", href: "/dashboard/eleve/emploi", icon: Calendar },
    { name: "Présences", href: "/dashboard/eleve/presences", icon: Calendar },
    { name: "Transport", href: "/dashboard/parent/transport", icon: Bus },
    { name: "Cantine", href: "/dashboard/parent/cantine", icon: Utensils },
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
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const getMenuItems = () => {
    // Utiliser les noms exacts des rôles dans votre base de données
    if (userRole === "SUPER_ADMIN") return menuItems.SUPER_ADMIN;
    if (userRole === "DIRECTEUR_GENERAL") return menuItems.DIRECTEUR;  // ← CORRIGÉ
    if (userRole === "COMPTABLE") return menuItems.COMPTABLE;
    if (userRole === "ENSEIGNANT") return menuItems.ENSEIGNANT;
    if (userRole === "PARENT") return menuItems.PARENT;
    if (userRole === "ELEVE") return menuItems.ELEVE;
    return menuItems.PARENT;
  };

  const items = getMenuItems();

  // Fonction pour vérifier si un lien est actif
  const isActive = (href: string) => {
    if (href === "/dashboard/admin" && pathname === "/dashboard/admin") return true;
    if (href !== "/dashboard/admin" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white shadow-lg ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
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
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-900">
              {sidebarOpen ? <X className="w-5 h-5 text-black" /> : <Menu className="w-5 h-5 text-black" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition ${
                    active 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
                  {sidebarOpen && <span className="text-sm">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
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

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex justify-between items-center px-6 py-3">
            <h1 className="text-xl font-semibold text-gray-800">Tableau de bord</h1>
            <div className="flex items-center gap-4">
              <button className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
              <div className="flex items-center gap-3">
                <UserCircle className="w-8 h-8 text-gray-600" />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
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