// app/dashboard/layout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  FileQuestionMark,
  ArrowLeft,
  ChevronDown,
  UserCheck
} from "lucide-react";
import { Providers } from "./providers";

const menuItems = {
  SUPER_ADMIN: [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Inscriptions", href: "/dashboard/admin/preinscriptions", icon: Users },
    { name: "Réinscriptions", href: "/dashboard/admin/reinscriptions", icon: Users },
    { name: "Parents", href: "/dashboard/admin/parents", icon: Users },
    { name: "Finances", href: "/dashboard/admin/finances", icon: CreditCard },
    { name: "Élèves", href: "/dashboard/admin/eleves", icon: Users },
    { name: "Classes", href: "/dashboard/admin/classes", icon: GraduationCap },
    { name: "Personnel", href: "/dashboard/admin/personnel", icon: Users },
    { name: "Salaires", href: "/dashboard/admin/salaires", icon: Users },
    { name: "Cantine", href: "/dashboard/admin/cantine", icon: Utensils },
    { name: "Transport", href: "/dashboard/admin/transport", icon: Bus },
    { name: "Bibliothèque", href: "/dashboard/admin/bibliotheque", icon: Library },
    { name: "Librairie", href: "/dashboard/admin/librairie", icon: BookMarked },
    { name: "Annonces", href: "/dashboard/admin/annonces", icon: Bell },
   // { name: "Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
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
    //{ name: "Messages", href: "/dashboard/directeur/messages", icon: MessageSquare },
  ],
  DIRECTEUR_ETUDES: [
    { name: "Dashboard", href: "/dashboard/directeur_etudes", icon: LayoutDashboard },
    { name: "Notes", href: "/dashboard/directeur_etudes/notes", icon: FileText },
    { name: "Bulletins", href: "/dashboard/directeur_etudes/bulletins", icon: FileText },
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
    //{ name: "Messages", href: "/dashboard/comptable/messages", icon: MessageSquare },
  ],
  ENSEIGNANT: [
    { name: "Dashboard", href: "/dashboard/enseignant", icon: LayoutDashboard },
    { name: "Classes", href: "/dashboard/enseignant/classes", icon: GraduationCap },
    { name: "Leçons", href: "/dashboard/enseignant/lecons", icon: BookOpen },
    { name: "Devoirs", href: "/dashboard/enseignant/devoirs", icon: BookMarked },
    { name: "Évaluations", href: "/dashboard/enseignant/evaluations", icon: GraduationCap },
    { name: "Salaire", href: "/dashboard/enseignant/salaire", icon: CreditCard },
    //{ name: "Messages", href: "/dashboard/enseignant/messages", icon: MessageSquare },
  ],
  PARENT: [
    { name: "Dashboard", href: "/dashboard/parent", icon: LayoutDashboard },
    { name: "Inscription", href: "/dashboard/parent/inscription", icon: UserPlus },
    { name: "Réinscription", href: "/dashboard/parent/reinscription", icon: RefreshCw },
    { name: "Mes enfants", href: "/dashboard/parent/enfants", icon: Users },
    { name: "Cantine", href: "/dashboard/parent/cantine", icon: Utensils },
    { name: "Transport", href: "/dashboard/parent/transport", icon: Bus },
    { name: "Librairie", href: "/dashboard/parent/librairie", icon: BookMarked },
    { name: "Finances", href: "/dashboard/parent/finances", icon: CreditCard },
    //{ name: "Messages", href: "/dashboard/parent/messages", icon: MessageSquare },
  ],
  ELEVE: [
    { name: "Dashboard", href: "/dashboard/eleve", icon: LayoutDashboard },
    { name: "Mes cours", href: "/dashboard/eleve/cours", icon: BookOpen },
    { name: "Mes devoirs", href: "/dashboard/eleve/devoirs", icon: BookOpen },
    { name: "Mes évaluations", href: "/dashboard/eleve/examens", icon: BookOpen },
    { name: "Mes notes", href: "/dashboard/eleve/notes", icon: GraduationCap },
    { name: "Mes bulletins", href: "/dashboard/eleve/bulletin", icon: Calendar },
    { name: "Quiz", href: "/dashboard/eleve/quiz", icon: FileQuestionMark },
  ],
  ADMIN_CANTINE: [
    { name: "Dashboard", href: "/dashboard/admin_cantine", icon: LayoutDashboard },
    { name: "Cantine", href: "/dashboard/admin_cantine/cantine", icon: Utensils },
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
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [enfantsParent, setEnfantsParent] = useState<any[]>([]);
  const [activeEnfant, setActiveEnfant] = useState<any | null>(null);

  const isParentViewingEleve = userRole === "PARENT" && pathname.startsWith("/dashboard/eleve");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user) {
      setUserRole((session.user as any)?.role || "PARENT");
    }
  }, [status, session, router]);

  // Récupérer la liste des enfants si le compte est PARENT
  useEffect(() => {
    if (userRole === "PARENT") {
      fetch("/api/parent/enfants")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setEnfantsParent(data);
            const eleveIdParam = searchParams.get("eleveId");
            if (eleveIdParam) {
              const matched = data.find(
                (e) => (e.eleve_id || e.id) === parseInt(eleveIdParam)
              );
              if (matched) setActiveEnfant(matched);
            } else if (data.length > 0) {
              setActiveEnfant(data[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [userRole, searchParams]);

  const handleSelectEnfant = (enf: any) => {
    const id = enf.eleve_id || enf.id;
    document.cookie = `active_eleve_id=${id}; path=/; max-age=86400`;
    setActiveEnfant(enf);
    router.push(`/dashboard/eleve?eleveId=${id}`);
  };

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
    // Si parent en train de consulter le compte de son enfant, on affiche le menu ELEVE
    if (isParentViewingEleve) {
      return menuItems.ELEVE;
    }

    const roleMap: Record<string, any> = {
      "SUPER_ADMIN": menuItems.SUPER_ADMIN,
      "ADMIN": menuItems.SUPER_ADMIN,
      "DIRECTEUR_GENERAL": menuItems.DIRECTEUR,
      "DIRECTEUR_ETUDES": menuItems.DIRECTEUR_ETUDES,
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
    if (href === "/dashboard/eleve" && pathname === "/dashboard/eleve") return true;
    if (href !== "/dashboard/admin" && href !== "/dashboard/eleve" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white shadow-lg ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            {sidebarOpen ? (
              <Link href={isParentViewingEleve ? "/dashboard/eleve" : "/dashboard"} className="flex items-center gap-2">
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
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-gray-200">
              {sidebarOpen ? <X className="w-5 h-5 text-black" /> : <Menu className="w-5 h-5 text-black" />}
            </button>
          </div>

          {/* En-tête spécial si le parent consulte le compte de son enfant */}
          {isParentViewingEleve && sidebarOpen && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Compte Enfant
                </span>
                <Link
                  href="/dashboard/parent"
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-xs"
                  title="Revenir à l'espace parent"
                >
                  <ArrowLeft className="w-3 h-3" /> Quitter
                </Link>
              </div>

              {activeEnfant ? (
                <p className="text-xs font-bold text-gray-900 truncate">
                  {activeEnfant.prenom} {activeEnfant.nom}
                  {activeEnfant.classe_nom && <span className="block text-[11px] font-normal text-gray-900">{activeEnfant.classe_nom}</span>}
                </p>
              ) : (
                <p className="text-xs text-gray-900">Élève connecté</p>
              )}

              {/* Sélecteur si plusieurs enfants */}
              {enfantsParent.length > 1 && (
                <div className="mt-2">
                  <select
                    value={activeEnfant?.eleve_id || activeEnfant?.id || ""}
                    onChange={(e) => {
                      const selected = enfantsParent.find(
                        (enf) => (enf.eleve_id || enf.id) === parseInt(e.target.value)
                      );
                      if (selected) handleSelectEnfant(selected);
                    }}
                    className="w-full text-xs bg-white border border-blue-200 rounded p-1 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {enfantsParent.map((enf) => (
                      <option key={enf.eleve_id || enf.id} value={enf.eleve_id || enf.id}>
                        Changer: {enf.prenom} {enf.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <nav className="flex-1 overflow-y-auto p-4">
            {items.map((item) => {
              const active = isActive(item.href);
              const eleveQuery = isParentViewingEleve && activeEnfant ? `?eleveId=${activeEnfant.eleve_id || activeEnfant.id}` : "";
              const targetHref = isParentViewingEleve ? `${item.href}${eleveQuery}` : item.href;

              return (
                <div key={item.name}>
                  <Link
                    href={targetHref}
                    className={`flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition ${active
                      ? "bg-blue-600 text-white"
                      : "text-black hover:bg-blue-50 hover:text-blue-600"
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
                    {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>

                  {/* Liens directs vers chaque enfant dans l'espace parent */}
                  {!isParentViewingEleve && userRole === "PARENT" && item.href === "/dashboard/parent/enfants" && enfantsParent.length > 0 && sidebarOpen && (
                    <div className="ml-5 pl-2 border-l-2 border-blue-100 my-1 space-y-1">
                      {enfantsParent.map((enf) => {
                        const childId = enf.eleve_id || enf.id;
                        return (
                          <div key={childId} className="flex items-center justify-between group py-0.5">
                            <Link
                              href={`/dashboard/parent/enfants/${childId}`}
                              className="text-xs text-gray-600 hover:text-blue-600 truncate flex-1"
                              title={`${enf.prenom} ${enf.nom} (Dossier parent)`}
                            >
                              • {enf.prenom} {enf.nom}
                            </Link>
                            <Link
                              href={`/dashboard/eleve?eleveId=${childId}`}
                              onClick={() => {
                                document.cookie = `active_eleve_id=${childId}; path=/; max-age=86400`;
                              }}
                              className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-1.5 py-0.5 rounded font-bold transition ml-1"
                              title="Accéder directement au compte de cet élève"
                            >
                              Compte élève
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            {isParentViewingEleve && sidebarOpen && (
              <Link
                href="/dashboard/parent"
                className="flex items-center gap-2 w-full px-3 py-2 mb-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'espace Parent
              </Link>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {isParentViewingEleve
                  ? activeEnfant
                    ? `Espace Élève : ${activeEnfant.prenom} ${activeEnfant.nom}`
                    : "Espace Élève"
                  : "Tableau de bord"}
              </h1>

              {isParentViewingEleve && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <UserCheck className="w-3.5 h-3.5" /> Accès direct parent
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {isParentViewingEleve && (
                <Link
                  href="/dashboard/parent"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Espace parent
                </Link>
              )}

              <div className="flex items-center gap-3">
                <UserCircle className="w-8 h-8 text-gray-900" />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                  <p className="text-xs text-gray-900">
                    {isParentViewingEleve ? "PARENT (En mode élève)" : userRole}
                  </p>
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