// app/dashboard/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  TrendingUp,
  TrendingDown,
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
  UserPlus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  FileText,
  Printer,
  Mail,
  Smartphone,
  Utensils,
  Bus,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  ArcElement
);
interface GraphData {
  niveaux: Array<{ niveau: string; total: number }>;
  evolutionPaiements: Array<{ mois: string; montant: number }>;
  tauxPresence: {
    present: number;
    absent: number;
    retard: number;
  };
}
interface DashboardStats {
  general: {
    totalEleves: number;
    totalEnseignants: number;
    totalClasses: number;
    totalParents: number;
    preinscriptionsEnAttente: number;
    hommes: number;
    femmes: number;
  };
  financieres: {
    totalRecettes: number;
    totalDepenses: number;
    solde: number;
    tauxRecouvrement: number;
    evolutionRecettes: Array<{ mois: string; recettes: number; depenses: number }>;
    categoriesRecettes: Array<{ name: string; montant: number; pourcentage: number }>;
    derniersPaiements: Array<{
      id: number;
      eleve: string;
      classe: string;
      montant: number;
      type: string;
      date: string;
      mode: string;
    }>;
    // ⭐ Nouveaux champs pour le total à payer
    totalScolarite: number;
    totalTransport: number;
    totalCantine: number;
    totalFournitures: number;
    totalAPayer: number;
    totalPaye: number;
    soldeRestant: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    general: {
      totalEleves: 0,
      totalEnseignants: 0,
      totalClasses: 0,
      totalParents: 0,
      preinscriptionsEnAttente: 0,
      hommes: 0,
      femmes: 0
    },
    financieres: {
      totalRecettes: 0,
      totalDepenses: 0,
      solde: 0,
      tauxRecouvrement: 0,
      evolutionRecettes: [],
      categoriesRecettes: [],
      derniersPaiements: [],
      totalScolarite: 0,
      totalTransport: 0,
      totalCantine: 0,
      totalFournitures: 0,
      totalAPayer: 0,
      totalPaye: 0,
      soldeRestant: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      
      setStats({
        general: data.general || stats.general,
        financieres: {
          ...data.financieres,
          totalAPayer: data.financieres?.totalAPayer || 0,
          totalPaye: data.financieres?.totalPaye || 0,
          soldeRestant: data.financieres?.soldeRestant || 0
        }
      });
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const general = stats.general || {};
  const financieres = stats.financieres || {};
  const derniersPaiements = financieres.derniersPaiements || [];
  const categoriesRecettes = financieres.categoriesRecettes || [];

  const iconMap: Record<string, any> = {
    Inscription: Users,
    Mensualité: GraduationCap,
    Cantine: Utensils,
    Transport: Bus,
    Bibliothèque: BookOpen,
    Autre: DollarSign,
  };
  const colorMap: Record<string, string> = {
    Inscription: "bg-blue-500",
    Mensualité: "bg-green-500",
    Cantine: "bg-orange-500",
    Transport: "bg-purple-500",
    Bibliothèque: "bg-teal-500",
    Autre: "bg-gray-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord administrateur</h1>
        <p className="text-gray-900">Vue d'ensemble de l'école</p>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Link href="/dashboard/admin/eleves" className="">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Total élèves</p>
              <p className="text-2xl font-bold text-gray-900">{general.totalEleves || 0}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg"><Users className="w-6 h-6 text-white" /></div>
          </div>
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Link href="/dashboard/admin/personnel" className="">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Enseignants</p>
              <p className="text-2xl font-bold text-gray-900">{general.totalEnseignants || 0}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg"><GraduationCap className="w-6 h-6 text-white" /></div>
          </div>
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Link href="/dashboard/admin/classes" className="">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{general.totalClasses || 0}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg"><BookOpen className="w-6 h-6 text-white" /></div>
          </div>
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Link href="/dashboard/admin/classes" className="">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Parents</p>
              <p className="text-2xl font-bold text-gray-900">{general.totalParents || 0}</p>
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg"><UserPlus className="w-6 h-6 text-white" /></div>
          </div>
          </Link>
        </div>
      </div>

      {/* Statistiques démographiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{general.preinscriptionsEnAttente || 0}</p>
          <p className="text-xs opacity-75">en attente de validation</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Users className="w-5 h-5" /><p className="text-sm">Garçons</p></div>
          <p className="text-2xl font-bold text-blue-600">{general.hommes || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Users className="w-5 h-5" /><p className="text-sm">Filles</p></div>
          <p className="text-2xl font-bold text-pink-600">{general.femmes || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><DollarSign className="w-5 h-5" /><p className="text-sm">Paiements année</p></div>
          <p className="text-lg font-bold text-green-600">{(financieres.totalRecettes / 1000000).toFixed(1)}M GNF</p>
        </div>
      </div>

      {/* Section Financière */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Statistiques financière
        </h2>
      </div>

      {/* Cartes financières */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Total recettes</p>
              <p className="text-lg font-bold text-green-600">{(financieres.totalRecettes || 0).toLocaleString()} GNF</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Total dépenses</p>
              <p className="text-lg font-bold text-red-600">{(financieres.totalDepenses || 0).toLocaleString()} GNF</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg"><TrendingDown className="w-4 h-4 text-red-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Total à payer</p>
              <p className="text-lg font-bold text-blue-600">{(financieres.totalAPayer || 0).toLocaleString()} GNF</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg"><DollarSign className="w-4 h-4 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Montant payé</p>
              <p className="text-lg font-bold text-orange-600">{(financieres.totalPaye || 0).toLocaleString()} GNF</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg"><Wallet className="w-4 h-4 text-orange-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Reste à payer</p>
              <p className={`text-lg font-bold ${(financieres.soldeRestant || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(financieres.soldeRestant || 0).toLocaleString()} GNF
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg"><CreditCard className="w-4 h-4 text-red-600" /></div>
          </div>
        </div>
      </div>

      {/* Évolution et répartition */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Évolution mensuelle
          </h3>
          <div className="space-y-4">
            {(financieres.evolutionRecettes || []).map((item: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.mois}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">{parseInt(item.recettes).toLocaleString()} GNF</span>
                    <span className="text-red-600">{parseInt(item.depenses).toLocaleString()} GNF</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((item.recettes / 15000000) * 100, 100)}%` }}></div>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((item.depenses / 6000000) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Répartition des recettes
          </h3>
          <div className="space-y-3">
            {categoriesRecettes.map((cat: any, idx: number) => {
              const Icon = iconMap[cat.name] || DollarSign;
              const color = colorMap[cat.name] || "bg-gray-500";
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span>{cat.montant.toLocaleString()} GNF ({cat.pourcentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${cat.pourcentage}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Statistiques graphiques */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Graphique - Répartition des élèves (Filles/Garçons) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Répartition des élèves (Filles/Garçons)
          </h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: ['Garçons', 'Filles'],
                datasets: [
                  {
                    data: [general.hommes || 0, general.femmes || 0],
                    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'],
                    borderWidth: 2,
                    borderColor: '#fff',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 10,
                      font: { size: 11 },
                    },
                  },
                },
                cutout: '60%',
              }}
            />
          </div>
        </div>

        {/* Graphique - Total des classes par niveau */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Total des classes par niveau
          </h3>
          <div className="h-64">
            <Bar
              data={{
                labels: ['Maternelle', 'Primaire', 'Collège', 'Lycée'],
                datasets: [
                  {
                    label: 'Nombre de classes',
                    data: [1, 6, 4, 3],
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.7)',
                      'rgba(16, 185, 129, 0.7)',
                      'rgba(139, 92, 246, 0.7)',
                      'rgba(245, 158, 11, 0.7)',
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(16, 185, 129)',
                      'rgb(139, 92, 246)',
                      'rgb(245, 158, 11)',
                    ],
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Graphique - Évolution des entrées/sorties de caisse */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Évolution des entrées/sorties de caisse
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                datasets: [
                  {
                    label: 'Entrées',
                    data: [12000000, 15000000, 18000000, 22000000, 19000000, 25000000],
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: 'Sorties',
                    data: [8000000, 9000000, 11000000, 10000000, 12000000, 14000000],
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 10,
                      font: { size: 11 },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${(value / 1000000).toFixed(0)}M`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Indicateurs rapides */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Indicateurs de l'établissement
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Bus className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">1</p>
              <p className="text-xs text-gray-600">Bus</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <BookOpen className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-xs text-gray-600">Livres</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <Utensils className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">1</p>
              <p className="text-xs text-gray-600">Menus cantine</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <ShoppingCart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">1</p>
              <p className="text-xs text-gray-600">Fournitures/Librairie</p>
            </div>
          </div>
        </div>

        {/* Graphique - Présence par classe */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Présence par classe
          </h3>
          <div className="h-64">
            <Bar
              data={{
                labels: ['1ère', '2ème', '3ème', '4ème', '5ème', '6ème', '7ème', '8ème', '9ème', '10ème', '11ème', '12ème', 'Term.', 'Mat.'],
                datasets: [
                  {
                    label: 'Présents',
                    data: [22, 20, 18, 23, 19, 21, 17, 22, 20, 18, 19, 16, 15, 22],
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1,
                  },
                  {
                    label: 'Absents',
                    data: [3, 5, 7, 2, 6, 4, 8, 3, 5, 7, 6, 9, 10, 3],
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 10,
                      font: { size: 11 },
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      font: { size: 10 },
                    },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 5,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
  </div>
);
}