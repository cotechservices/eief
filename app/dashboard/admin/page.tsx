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
  Bus
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    general: {},
    financieres: {}
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      setStats(data);
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

  const totalPages = Math.ceil(derniersPaiements.length / itemsPerPage);
  const paginatedPaiements = derniersPaiements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord administrateur</h1>
        <p className="text-gray-500">Vue d'ensemble de l'école</p>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total élèves</p>
              <p className="text-2xl font-bold text-gray-800">{general.totalEleves || 0}</p>
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> +12% vs année dernière</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg"><Users className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Enseignants</p>
              <p className="text-2xl font-bold text-gray-800">{general.totalEnseignants || 0}</p>
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> +5% vs année dernière</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg"><GraduationCap className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Classes</p>
              <p className="text-2xl font-bold text-gray-800">{general.totalClasses || 0}</p>
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> +2 vs année dernière</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg"><BookOpen className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Parents</p>
              <p className="text-2xl font-bold text-gray-800">{general.totalParents || 0}</p>
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1"><ArrowUpRight className="w-4 h-4" /> +8% vs année dernière</p>
            </div>
            <div className="bg-indigo-500 p-3 rounded-lg"><UserPlus className="w-6 h-6 text-white" /></div>
          </div>
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
          <div className="flex items-center gap-2 mb-1 text-gray-500"><Users className="w-5 h-5" /><p className="text-sm">Garçons</p></div>
          <p className="text-2xl font-bold text-blue-600">{general.hommes || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><Users className="w-5 h-5" /><p className="text-sm">Filles</p></div>
          <p className="text-2xl font-bold text-pink-600">{general.femmes || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><DollarSign className="w-5 h-5" /><p className="text-sm">Paiements année</p></div>
          <p className="text-lg font-bold text-green-600">{(financieres.totalRecettes / 1000000).toFixed(1)}M GNF</p>
        </div>
      </div>

      {/* Section Financière */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Gestion financière
        </h2>
      </div>

      {/* Cartes financières */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total recettes</p>
              <p className="text-2xl font-bold text-green-600">{(financieres.totalRecettes || 0).toLocaleString()} GNF</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg"><TrendingUp className="w-6 h-6 text-green-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total dépenses</p>
              <p className="text-2xl font-bold text-red-600">{(financieres.totalDepenses || 0).toLocaleString()} GNF</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg"><TrendingDown className="w-6 h-6 text-red-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Solde actuel</p>
              <p className="text-2xl font-bold text-blue-600">{(financieres.solde || 0).toLocaleString()} GNF</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg"><Wallet className="w-6 h-6 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Taux de recouvrement</p>
              <p className="text-2xl font-bold text-purple-600">{financieres.tauxRecouvrement || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Objectif: 95%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-purple-600" /></div>
          </div>
        </div>
      </div>

      {/* Évolution et répartition */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
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
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
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

      {/* Derniers paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Derniers paiements</h3>
          <button className="text-blue-600 text-sm hover:underline">Voir tous →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPaiements.map((paiement: any) => (
                <tr key={paiement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{paiement.eleve}</td>
                  <td className="px-6 py-4 text-gray-600">{paiement.classe}</td>
                  <td className="px-6 py-4 text-right font-medium">{parseInt(paiement.montant).toLocaleString()} GNF</td>
                  <td className="px-6 py-4"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{paiement.type}</span></td>
                  <td className="px-6 py-4 text-gray-600">{new Date(paiement.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {paiement.mode === "mobile_money" && <Smartphone className="w-4 h-4 text-green-600" />}
                      {paiement.mode === "especes" && <Wallet className="w-4 h-4 text-blue-600" />}
                      {paiement.mode === "carte" && <CreditCard className="w-4 h-4 text-purple-600" />}
                      <span className="text-sm">{paiement.mode === "mobile_money" ? "Orange Money" : paiement.mode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600"><Printer className="w-4 h-4"  /></button>
                      <button className="text-gray-600"><Eye className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/admin/paiements" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition">
            <CreditCard className="w-6 h-6 text-green-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Paiements</p>
        </Link>
        <Link href="/dashboard/admin/rapports" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
            <FileText className="w-6 h-6 text-blue-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Rapports</p>
        </Link>
        <Link href="/dashboard/admin/frais-scolaires" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition">
            <DollarSign className="w-6 h-6 text-purple-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Frais scolaires</p>
        </Link>
        <Link href="/dashboard/admin/preinscriptions" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-yellow-600 transition">
            <Clock className="w-6 h-6 text-yellow-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Pré-inscriptions</p>
        </Link>
      </div>
    </div>
  );
}