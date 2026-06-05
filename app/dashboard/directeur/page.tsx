// app/dashboard/directeur/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  CheckCircle,
  Eye,
  AlertCircle,
  Download,
  BarChart3,
  PieChart,
  FileText
} from "lucide-react";

export default function DirecteurDashboard() {
  const [loading, setLoading] = useState(true);

  const stats = {
    totalEleves: 1250,
    totalEnseignants: 85,
    totalClasses: 32,
    tauxReussite: 98,
    tauxPresence: 92
  };

  const classesPopulaires = [
    { name: "6ème A", eleves: 28, capacite: 30, taux: 93 },
    { name: "5ème A", eleves: 30, capacite: 30, taux: 100 },
    { name: "4ème B", eleves: 25, capacite: 30, taux: 83 },
    { name: "Terminale S", eleves: 22, capacite: 25, taux: 88 },
  ];

  const activitesRecentes = [
    { id: 1, action: "Nouvel élève inscrit", utilisateur: "Mme Diallo", date: "Il y a 10 min", type: "success" },
    { id: 2, action: "Devoir publié", utilisateur: "Mme Barry", date: "Il y a 2 heures", type: "info" },
    { id: 3, action: "Absence signalée", utilisateur: "M. Konaté", date: "Il y a 3 heures", type: "warning" },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Directeur</h1>
        <p className="text-gray-900">Bienvenue dans l'espace de direction</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-90">Total élèves</p>
          <p className="text-3xl font-bold mt-2">{stats.totalEleves}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Enseignants</p><p className="text-2xl font-bold text-green-600">{stats.totalEnseignants}</p></div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Classes</p><p className="text-2xl font-bold text-purple-600">{stats.totalClasses}</p></div>
            <GraduationCap className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Taux de réussite</p><p className="text-2xl font-bold text-orange-600">{stats.tauxReussite}%</p></div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Classes les plus peuplées</h3>
          <div className="space-y-4">
            {classesPopulaires.map((classe, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div><p className="font-medium">{classe.name}</p><p className="text-sm text-gray-900">{classe.eleves}/{classe.capacite} élèves</p></div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${classe.taux >= 90 ? "bg-green-500" : "bg-yellow-500"}`} style={{ width: `${classe.taux}%` }}></div></div>
                  <span className="text-sm font-medium">{classe.taux}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Activités récentes</h3>
          <div className="space-y-3">
            {activitesRecentes.map((activite) => (
              <div key={activite.id} className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center gap-3">
                  {activite.type === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {activite.type === "warning" && <AlertCircle className="w-4 h-4 text-orange-500" />}
                  {activite.type === "info" && <Eye className="w-4 h-4 text-blue-500" />}
                  <div><p className="text-sm font-medium">{activite.action}</p><p className="text-xs text-gray-900">Par {activite.utilisateur}</p></div>
                </div>
                <span className="text-xs text-gray-900">{activite.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/directeur/rapports" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
          <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Rapports</p>
        </Link>
        <Link href="/dashboard/directeur/statistiques" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
          <BarChart3 className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Statistiques</p>
        </Link>
        <Link href="/dashboard/admin/classes" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
          <GraduationCap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Classes</p>
        </Link>
        <Link href="/dashboard/admin/enseignants" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
          <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <p className="text-sm font-medium">Enseignants</p>
        </Link>
      </div>
    </div>
  );
}