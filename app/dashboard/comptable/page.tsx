// app/dashboard/comptable/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Eye,
  CreditCard,
  Smartphone,
  Wallet,
  Users,
  GraduationCap,
  Bus,
  Utensils,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Printer,
  Mail,
  BarChart3,
  PieChart,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,      // ← AJOUTER
  ChevronRight      // ← AJOUTER
} from "lucide-react";

export default function ComptableDashboard() {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("mois");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Données statistiques
  const stats = {
    totalRecettes: 12500000,
    totalDepenses: 4800000,
    solde: 7700000,
    encours: 3250000,
    previsionMois: 14500000,
    tauxRecouvrement: 78,
    nombreEleves: 1250,
    nombreClasses: 32,
    recettesMois: 12500000,
    depensesMois: 4800000,
    evolutionRecettes: +8,
    evolutionDepenses: +5,
    evolutionSolde: +12
  };

  // Évolution mensuelle des recettes
  const evolutionRecettes = [
    { mois: "Jan", recettes: 11200000, depenses: 4500000 },
    { mois: "Fév", recettes: 11800000, depenses: 4600000 },
    { mois: "Mar", recettes: 12100000, depenses: 4700000 },
    { mois: "Avr", recettes: 12300000, depenses: 4750000 },
    { mois: "Mai", recettes: 12500000, depenses: 4800000 },
    { mois: "Juin", recettes: 12800000, depenses: 4900000 },
  ];

  // Derniers paiements
  const derniersPaiements = [
    { id: 1, eleve: "Ibrahim Diallo", classe: "5ème A", montant: 150000, type: "Mensualité", date: "2025-05-20", statut: "payé", mode: "Mobile Money" },
    { id: 2, eleve: "Aïssatou Souaré", classe: "3ème A", montant: 200000, type: "Inscription", date: "2025-05-19", statut: "payé", mode: "Espèces" },
    { id: 3, eleve: "Mamadou Konaté", classe: "Terminale", montant: 150000, type: "Mensualité", date: "2025-05-18", statut: "en_attente", mode: "Carte" },
    { id: 4, eleve: "Fatoumata Barry", classe: "6ème A", montant: 100000, type: "Cantine", date: "2025-05-17", statut: "payé", mode: "Mobile Money" },
    { id: 5, eleve: "Mohamed Camara", classe: "4ème A", montant: 80000, type: "Transport", date: "2025-05-16", statut: "impayé", mode: "-" },
    { id: 6, eleve: "Aminata Diallo", classe: "2nd A", montant: 150000, type: "Mensualité", date: "2025-05-15", statut: "payé", mode: "Mobile Money" },
    { id: 7, eleve: "Ousmane Touré", classe: "1ère A", montant: 50000, type: "Bibliothèque", date: "2025-05-14", statut: "en_attente", mode: "Carte" },
  ];

  // Impayés
  const impayes = [
    { id: 1, eleve: "Mohamed Camara", classe: "4ème A", montant: 80000, type: "Transport", retard: 30 },
    { id: 2, eleve: "Aminata Touré", classe: "2nd A", montant: 150000, type: "Mensualité", retard: 45 },
    { id: 3, eleve: "Ousmane Keita", classe: "1ère A", montant: 100000, type: "Cantine", retard: 15 },
  ];

  // Répartition des recettes par catégorie
  const categoriesRecettes = [
    { name: "Inscriptions", montant: 2450000, pourcentage: 20, icon: Users, color: "bg-blue-500" },
    { name: "Mensualités", montant: 6250000, pourcentage: 50, icon: GraduationCap, color: "bg-green-500" },
    { name: "Cantine", montant: 1250000, pourcentage: 10, icon: Utensils, color: "bg-orange-500" },
    { name: "Transport", montant: 1000000, pourcentage: 8, icon: Bus, color: "bg-purple-500" },
    { name: "Bibliothèque", montant: 625000, pourcentage: 5, icon: BookOpen, color: "bg-teal-500" },
    { name: "Autres", montant: 875000, pourcentage: 7, icon: DollarSign, color: "bg-gray-500" },
  ];

  // Pagination
  const totalPages = Math.ceil(derniersPaiements.length / itemsPerPage);
  const paginatedPaiements = derniersPaiements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des données financières...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord comptable</h1>
          <p className="text-gray-500">Gestion financière de l'école</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={periode} 
            onChange={(e) => setPeriode(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mois">Ce mois</option>
            <option value="trimestre">Ce trimestre</option>
            <option value="annee">Cette année</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total recettes</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalRecettes.toLocaleString()} GNF</p>
              <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> +{stats.evolutionRecettes}% vs mois dernier
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total dépenses</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalDepenses.toLocaleString()} GNF</p>
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> +{stats.evolutionDepenses}% vs mois dernier
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Solde actuel</p>
              <p className="text-2xl font-bold text-blue-600">{stats.solde.toLocaleString()} GNF</p>
              <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> +{stats.evolutionSolde}% vs mois dernier
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Taux de recouvrement</p>
              <p className="text-2xl font-bold text-purple-600">{stats.tauxRecouvrement}%</p>
              <p className="text-sm text-gray-500 mt-1">Objectif: 95%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Évolution des recettes et dépenses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Évolution mensuelle
            </h3>
            <Link href="/dashboard/comptable/rapports" className="text-blue-600 text-sm hover:underline">Voir détails</Link>
          </div>
          <div className="space-y-4">
            {evolutionRecettes.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.mois}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">{item.recettes.toLocaleString()} GNF</span>
                    <span className="text-red-600">{item.depenses.toLocaleString()} GNF</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(item.recettes / 15000000) * 100}%` }}></div>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(item.depenses / 6000000) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Recettes</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Dépenses</span>
          </div>
        </div>

        {/* Répartition des recettes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Répartition des recettes
            </h3>
            <span className="text-xs text-gray-400">total {stats.totalRecettes.toLocaleString()} GNF</span>
          </div>
          <div className="space-y-3">
            {categoriesRecettes.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${cat.color} rounded-lg flex items-center justify-center`}>
                  <cat.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span>{cat.montant.toLocaleString()} GNF ({cat.pourcentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className={`${cat.color} h-1.5 rounded-full`} style={{ width: `${cat.pourcentage}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes impayés */}
      {impayes.length > 0 && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Paiements en retard ({impayes.length})
          </h3>
          <div className="space-y-2">
            {impayes.map((impaye) => (
              <div key={impaye.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div>
                  <p className="font-medium">{impaye.eleve} - {impaye.classe}</p>
                  <p className="text-sm text-gray-500">{impaye.type} • {impaye.montant.toLocaleString()} GNF</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-red-600 text-sm">{impaye.retard} jours de retard</span>
                  <button className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700">
                    Envoyer rappel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Derniers paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Derniers paiements</h3>
          <Link href="/dashboard/comptable/paiements" className="text-blue-600 text-sm hover:underline">Voir tous →</Link>
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
              {paginatedPaiements.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{paiement.eleve}</td>
                  <td className="px-6 py-4 text-gray-600">{paiement.classe}</td>
                  <td className="px-6 py-4 text-right font-medium">{paiement.montant.toLocaleString()} GNF</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{paiement.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{paiement.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {paiement.mode === "Mobile Money" && <Smartphone className="w-4 h-4 text-green-600" />}
                      {paiement.mode === "Espèces" && <Wallet className="w-4 h-4 text-blue-600" />}
                      {paiement.mode === "Carte" && <CreditCard className="w-4 h-4 text-purple-600" />}
                      <span className="text-sm">{paiement.mode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {paiement.statut === "payé" && (
                      <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>
                    )}
                    {paiement.statut === "en_attente" && (
                      <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>
                    )}
                    {paiement.statut === "impayé" && (
                      <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Impayé</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700"><Printer className="w-4 h-4" title="Imprimer reçu" /></button>
                      <button className="text-gray-600 hover:text-gray-700"><Eye className="w-4 h-4" title="Voir détail" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, derniersPaiements.length)} sur {derniersPaiements.length} paiements</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/comptable/paiements" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition">
            <CreditCard className="w-6 h-6 text-green-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-700">Encaisser</p>
        </Link>
        <Link href="/dashboard/comptable/rapports" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
            <FileText className="w-6 h-6 text-blue-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-700">Rapports</p>
        </Link>
        <Link href="/dashboard/comptable/frais" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition">
            <DollarSign className="w-6 h-6 text-purple-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-700">Frais scolaires</p>
        </Link>
        <Link href="/dashboard/comptable/salaires" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-600 transition">
            <Users className="w-6 h-6 text-orange-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-700">Salaires</p>
        </Link>
      </div>
    </div>
  );
}