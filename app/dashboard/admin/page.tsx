// app/dashboard/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CreditCard,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Loader2,
  DollarSign,
  UserCheck,
  UserX,
  Clock,
  UserPlus
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEleves: 0,
    totalEnseignants: 0,
    totalClasses: 0,
    totalParents: 0,
    totalPaiementsAnnee: 0,
    tauxPresence: 0,
    tauxReussite: 0,
    preinscriptionsEnAttente: 0,
    hommes: 0,
    femmes: 0
  });

  const [presenceHebdo, setPresenceHebdo] = useState<any[]>([]);
  const [classesPopulaires, setClassesPopulaires] = useState<any[]>([]);
  const [activitesRecentes, setActivitesRecentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Récupérer les statistiques générales
      const statsResponse = await fetch("/api/admin/dashboard/stats");
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Récupérer les présences hebdomadaires
      const presenceResponse = await fetch("/api/admin/dashboard/presence");
      const presenceData = await presenceResponse.json();
      setPresenceHebdo(presenceData);

      // Récupérer les classes les plus peuplées
      const classesResponse = await fetch("/api/admin/dashboard/classes-populaires");
      const classesData = await classesResponse.json();
      setClassesPopulaires(classesData);

      // Récupérer les activités récentes
      const activitesResponse = await fetch("/api/admin/dashboard/activites");
      const activitesData = await activitesResponse.json();
      setActivitesRecentes(activitesData);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total élèves", value: stats.totalEleves, icon: Users, color: "bg-blue-500", change: "+12%" },
    { title: "Enseignants", value: stats.totalEnseignants, icon: GraduationCap, color: "bg-green-500", change: "+5%" },
    { title: "Classes", value: stats.totalClasses, icon: BookOpen, color: "bg-purple-500", change: "+2" },
    { title: "Nombre de parents", value: stats.totalParents, icon: UserPlus, color: "bg-indigo-500", change: "+8%" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Tableau de bord administrateur</h1>
        <p className="text-gray-900">Vue d'ensemble de l'école</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
                <p className="text-green-600 text-sm mt-2">{stat.change} vs mois dernier</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{stats.preinscriptionsEnAttente}</p>
          <p className="text-xs opacity-75">en attente de validation</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-black"><Users className="w-5 h-5" /><p className="text-sm">Garçons</p></div>
          <p className="text-2xl font-bold text-blue-700">{stats.hommes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-black"><Users className="w-5 h-5" /><p className="text-sm">Filles</p></div>
          <p className="text-2xl font-bold text-pink-700">{stats.femmes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-black"><DollarSign className="w-5 h-5" /><p className="text-sm">Paiements année</p></div>
          <p className="text-lg font-bold text-green-600">{(stats.totalPaiementsAnnee / 1000000).toFixed(1)}M GNF</p>
        </div>
      </div>
    </div>
  );
}