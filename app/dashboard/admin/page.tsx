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
  Download
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEleves: 0,
    totalEnseignants: 0,
    totalClasses: 0,
    totalPaiementsMois: 0,
    tauxPresence: 0,
    tauxReussite: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation chargement données
    setTimeout(() => {
      setStats({
        totalEleves: 1250,
        totalEnseignants: 85,
        totalClasses: 32,
        totalPaiementsMois: 12500000,
        tauxPresence: 92,
        tauxReussite: 98
      });
      setLoading(false);
    }, 1000);
  }, []);

  const statCards = [
    { title: "Total élèves", value: stats.totalEleves, icon: Users, color: "bg-blue-500", change: "+12%" },
    { title: "Enseignants", value: stats.totalEnseignants, icon: GraduationCap, color: "bg-green-500", change: "+5%" },
    { title: "Classes", value: stats.totalClasses, icon: BookOpen, color: "bg-purple-500", change: "+2" },
    { title: "Paiements (mois)", value: `${(stats.totalPaiementsMois / 1000000).toFixed(1)}M GNF`, icon: CreditCard, color: "bg-orange-500", change: "+18%" },
  ];

  const activitesRecentes = [
    { id: 1, action: "Nouvel élève inscrit", utilisateur: "Mme Diallo", date: "Il y a 10 min", type: "success" },
    { id: 2, action: "Paiement effectué", utilisateur: "M. Camara", date: "Il y a 1 heure", type: "success" },
    { id: 3, action: "Devoir publié", utilisateur: "Mme Barry", date: "Il y a 2 heures", type: "info" },
    { id: 4, action: "Absence signalée", utilisateur: "M. Konaté", date: "Il y a 3 heures", type: "warning" },
  ];

  const classesPopulaires = [
    { name: "6ème A", eleves: 28, capacite: 30, taux: 93 },
    { name: "5ème A", eleves: 30, capacite: 30, taux: 100 },
    { name: "4ème B", eleves: 25, capacite: 30, taux: 83 },
    { name: "Terminale S", eleves: 22, capacite: 25, taux: 88 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord administrateur</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-green-600 text-sm mt-2">{stat.change} vs mois dernier</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Présence hebdomadaire</h3>
            <button className="text-blue-600 text-sm hover:underline">Voir détails</button>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Lundi</span>
                <span>94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Mardi</span>
                <span>91%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "91%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Mercredi</span>
                <span>89%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "89%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Jeudi</span>
                <span>95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "95%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vendredi</span>
                <span>90%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "90%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Classes les plus peuplées</h3>
            <button className="text-blue-600 text-sm hover:underline">Voir tout</button>
          </div>
          <div className="space-y-4">
            {classesPopulaires.map((classe, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{classe.name}</p>
                  <p className="text-sm text-gray-500">{classe.eleves}/{classe.capacite} élèves</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${classe.taux >= 90 ? "bg-green-500" : "bg-yellow-500"}`}
                      style={{ width: `${classe.taux}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{classe.taux}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activités récentes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">Activités récentes</h3>
        </div>
        <div className="divide-y">
          {activitesRecentes.map((activite) => (
            <div key={activite.id} className="px-6 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {activite.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
                {activite.type === "warning" && <XCircle className="w-5 h-5 text-orange-500" />}
                {activite.type === "info" && <Eye className="w-5 h-5 text-blue-500" />}
                <div>
                  <p className="text-sm text-gray-800">{activite.action}</p>
                  <p className="text-xs text-gray-500">Par {activite.utilisateur}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">{activite.date}</span>
                <button className="text-gray-400 hover:text-gray-600">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}