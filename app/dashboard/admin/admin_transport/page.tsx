"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Bus, LayoutDashboard, FileText, Users, Route, Calendar, 
  TrendingUp, CreditCard, AlertCircle 
} from "lucide-react";
import Link from "next/link";

// ⭐ Interface pour les statistiques renvoyées par l'API
interface Stats {
  totalBus: number;
  totalInscrits: number;
  tauxRemplissage: number;
  recettesMois: number;
}

export default function AdminTransportDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ⭐ État pour stocker les données réelles
  const [stats, setStats] = useState<Stats>({
    totalBus: 0,
    totalInscrits: 0,
    tauxRemplissage: 0,
    recettesMois: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ⭐ Fonction pour récupérer les données réelles
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/transport');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Mettre à jour les statistiques avec les données réelles
      if (data.stats) {
        setStats({
          totalBus: data.stats.totalBus || 0,
          totalInscrits: data.stats.totalInscrits || 0,
          tauxRemplissage: data.stats.tauxRemplissage || 0,
          recettesMois: data.stats.recettesMois || 0
        });
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
      setError("Impossible de charger les données. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Effet pour la redirection et le chargement des données
  useEffect(() => {
    console.log("=== ADMIN TRANSPORT DASHBOARD ===");
    console.log("Session:", session);
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    // Charger les données si l'utilisateur est authentifié
    if (status === "authenticated") {
      fetchStats();
    }
  }, [session, status, router]);

  // Affichage du chargement
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirection si non authentifié
  if (!session) {
    return null;
  }

  // ⭐ Calcul du nombre de lignes (à partir des données de bus)
  const totalLignes = 0; // À calculer si nécessaire

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bus className="w-7 h-7 text-purple-600" />
            Dashboard Transport
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenue {session.user?.prenom} {session.user?.nom}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Dernière mise à jour : {new Date().toLocaleString()}
          </span>
          <button
            onClick={fetchStats}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium transition"
          >
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {/* ⭐ Message d'erreur si présent */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Erreur</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ⭐ Statistiques avec données réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Véhicules</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBus}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Lignes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBus}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Élèves inscrits</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalInscrits}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Taux d'occupation</p>
              <p className="text-3xl font-bold text-gray-900">{stats.tauxRemplissage}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ Deuxième ligne de stats avec données réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Recettes du mois</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.recettesMois.toLocaleString()} GNF
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Trajets aujourd'hui</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalBus > 0 ? stats.totalBus : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides et informations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
            Actions rapides
          </h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/admin_transport/transport"
              className="block w-full text-left bg-purple-50 text-purple-700 px-4 py-3 rounded-xl hover:bg-purple-100 transition font-medium text-sm flex items-center gap-2"
            >
              <Bus className="w-4 h-4" />
              ➕ Ajouter un véhicule
            </Link>
            <Link
              href="/dashboard/admin_transport/transport"
              className="block w-full text-left bg-blue-50 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-100 transition font-medium text-sm flex items-center gap-2"
            >
              <Route className="w-4 h-4" />
              ➕ Créer une ligne
            </Link>
            <Link
              href="/dashboard/admin_transport/transport"
              className="block w-full text-left bg-green-50 text-green-700 px-4 py-3 rounded-xl hover:bg-green-100 transition font-medium text-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              👥 Inscrire un élève
            </Link>
            <Link
              href="/dashboard/admin_transport/rapports"
              className="block w-full text-left bg-orange-50 text-orange-700 px-4 py-3 rounded-xl hover:bg-orange-100 transition font-medium text-sm flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              📊 Voir les rapports
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
            Informations
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">👤 Utilisateur</span>
              <span className="font-medium text-gray-900">{session.user?.prenom} {session.user?.nom}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">📧 Email</span>
              <span className="font-medium text-gray-900">{session.user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">🎯 Rôle</span>
              <span className="font-medium text-purple-600">{session.user?.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">🕐 Dernière connexion</span>
              <span className="font-medium text-gray-900">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">📊 Total véhicules</span>
              <span className="font-medium text-gray-900">{stats.totalBus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        <p>© {new Date().getFullYear()} E.I.E.F - Module Transport</p>
      </div>
    </div>
  );
}