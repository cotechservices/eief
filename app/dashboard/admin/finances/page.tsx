// app/dashboard/admin/finances/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  Wrench,      
  Droplet     
} from "lucide-react";

export default function ComptabilitePage() {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("mois");
  const [filter, setFilter] = useState("all");

  // Données simulées - À remplacer par vos données réelles
  const stats = {
    totalRecettes: 12500000,
    totalDepenses: 4800000,
    solde: 7700000,
    encours: 3250000,
    previsionMois: 14500000,
    tauxRecouvrement: 78,
    nombreEleves: 1250,
    nombreClasses: 32
  };

  const recettesParMois = [
    { mois: "Oct", montant: 12000000, prevision: 12500000 },
    { mois: "Nov", montant: 11800000, prevision: 12500000 },
    { mois: "Déc", montant: 11500000, prevision: 12500000 },
    { mois: "Jan", montant: 12200000, prevision: 12500000 },
    { mois: "Fév", montant: 11900000, prevision: 12500000 },
    { mois: "Mar", montant: 12100000, prevision: 12500000 },
    { mois: "Avr", montant: 12300000, prevision: 12500000 },
  ];

  const derniersPaiements = [
    { id: 1, eleve: "Ibrahim Diallo", classe: "5ème A", montant: 150000, type: "Mensualité", date: "2025-05-20", statut: "payé", mode: "Mobile Money" },
    { id: 2, eleve: "Aïssatou Souaré", classe: "3ème A", montant: 200000, type: "Inscription", date: "2025-05-19", statut: "payé", mode: "Espèces" },
    { id: 3, eleve: "Mamadou Konaté", classe: "Terminale", montant: 150000, type: "Mensualité", date: "2025-05-18", statut: "en_attente", mode: "Carte" },
    { id: 4, eleve: "Fatoumata Barry", classe: "6ème A", montant: 100000, type: "Cantine", date: "2025-05-17", statut: "payé", mode: "Mobile Money" },
    { id: 5, eleve: "Mohamed Camara", classe: "4ème A", montant: 80000, type: "Transport", date: "2025-05-16", statut: "impayé", mode: "-" },
  ];

  const categoriesRecettes = [
    { name: "Inscriptions", montant: 2450000, pourcentage: 20, icon: Users },
    { name: "Mensualités", montant: 6250000, pourcentage: 50, icon: GraduationCap },
    { name: "Cantine", montant: 1250000, pourcentage: 10, icon: Utensils },
    { name: "Transport", montant: 1000000, pourcentage: 8, icon: Bus },
    { name: "Bibliothèque", montant: 625000, pourcentage: 5, icon: BookOpen },
    { name: "Autres", montant: 875000, pourcentage: 7, icon: DollarSign },
  ];

  const depensesParCategorie = [
    { name: "Salaires", montant: 2500000, pourcentage: 52, icon: Users },
    { name: "Fournitures", montant: 800000, pourcentage: 17, icon: BookOpen },
    { name: "Maintenance", montant: 500000, pourcentage: 10, icon: Wrench },  // ← Changé
    { name: "Eau/Électricité", montant: 400000, pourcentage: 8, icon: Droplet },
    { name: "Transport", montant: 350000, pourcentage: 7, icon: Bus },
    { name: "Autres", montant: 250000, pourcentage: 6, icon: DollarSign },
    ];

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
          <h1 className="text-2xl font-bold text-gray-800">Comptabilité</h1>
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
              <p className="text-sm text-green-500 mt-1">+8% vs année dernièrer</p>
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
              <p className="text-sm text-red-500 mt-1">+5% vs année dernière</p>
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
              <p className="text-sm text-gray-500 mt-1">Disponible</p>
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

      {/* Graphiques et répartition */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Évolution des recettes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Évolution des recettes</h3>
          <div className="space-y-3">
            {recettesParMois.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.mois}</span>
                  <span>{item.montant.toLocaleString()} GNF</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(item.montant / item.prevision) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition des recettes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Répartition des recettes</h3>
          <div className="space-y-3">
            {categoriesRecettes.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <cat.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span>{cat.montant.toLocaleString()} GNF ({cat.pourcentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${cat.pourcentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Derniers paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Derniers paiements</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="p-1.5 border rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {derniersPaiements.map((paiement) => (
                <tr key={paiement.id}>
                  <td className="px-6 py-4 font-medium text-gray-800">{paiement.eleve}</td>
                  <td className="px-6 py-4 text-gray-600">{paiement.classe}</td>
                  <td className="px-6 py-4 font-medium">{paiement.montant.toLocaleString()} GNF</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {paiement.type}
                    </span>
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
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Payé
                      </span>
                    )}
                    {paiement.statut === "en_attente" && (
                      <span className="text-yellow-600 text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" /> En attente
                      </span>
                    )}
                    {paiement.statut === "impayé" && (
                      <span className="text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Impayé
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-700 mr-2">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-700">
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">Affichage 5 sur 45 paiements</p>
          <button className="text-blue-600 text-sm hover:underline">Voir tous les paiements →</button>
        </div>
      </div>

      {/* Alertes et impayés */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Paiements en retard
          </h3>
          <p className="text-yellow-700 text-sm mb-4">3 familles ont des paiements en retard</p>
          <button className="text-yellow-800 text-sm font-medium hover:underline">
            Envoyer des rappels →
          </button>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Prochains échéances
          </h3>
          <p className="text-blue-700 text-sm mb-4">Mensualités de Mai à payer avant le 31/05</p>
          <button className="text-blue-800 text-sm font-medium hover:underline">
            Générer les factures →
          </button>
        </div>
      </div>
    </div>
  );
}