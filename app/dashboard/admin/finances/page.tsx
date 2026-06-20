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
  Droplet,
  Plus
} from "lucide-react";

export default function ComptabilitePage() {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("mois");
  const [data, setData] = useState<any>(null);
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [newDepense, setNewDepense] = useState({
    categorie: "Fournitures",
    montant: "",
    description: "",
  });

  const categoriesDisponibles = [
    "Fournitures",
    "Maintenance",
    "Eau/Électricité",
    "Équipement",
    "Transport",
    "Autre"
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [periode]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/comptable/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAjoutDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/finances/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDepense),
      });
      if (res.ok) {
        alert("Dépense enregistrée avec succès");
        setShowDepenseForm(false);
        setNewDepense({ categorie: "Fournitures", montant: "", description: "" });
        fetchDashboardData(); // Rafraîchir les stats
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout");
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement des données financières...</p>
        </div>
      </div>
    );
  }

  const { stats, derniersPaiements, impayes, categoriesRecettes, evolutionRecettes } = data;

  const getIconForCategory = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('inscription')) return Users;
    if (lower.includes('mensualit')) return GraduationCap;
    if (lower.includes('cantine')) return Utensils;
    if (lower.includes('transport')) return Bus;
    if (lower.includes('biblioth')) return BookOpen;
    return DollarSign;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
          <p className="text-gray-900">Gestion financière de l'école</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDepenseForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Sortie de caisse (Dépense)
          </button>
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
              <p className="text-gray-900 text-sm">Total recettes</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalRecettes.toLocaleString()} GNF</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Total dépenses (Salaires + autres)</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalDepenses.toLocaleString()} GNF</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Solde actuel</p>
              <p className={`text-2xl font-bold ${stats.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {stats.solde.toLocaleString()} GNF
              </p>
              <p className="text-sm text-gray-900 mt-1">Trésorerie disponible</p>
            </div>
            <div className={`${stats.solde >= 0 ? 'bg-blue-100' : 'bg-red-100'} p-3 rounded-lg`}>
              <Wallet className={`w-6 h-6 ${stats.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Taux de recouvrement</p>
              <p className="text-2xl font-bold text-purple-600">{stats.tauxRecouvrement}%</p>
              <p className="text-sm text-gray-900 mt-1">Impayés: {stats.encours.toLocaleString()} GNF</p>
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
          <h3 className="font-semibold text-gray-900 mb-4">Aperçu financier (Mois en cours)</h3>
          <div className="space-y-6">
             {evolutionRecettes.map((item: any, idx: number) => (
               <div key={idx} className="space-y-4">
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-medium text-green-700">Recettes ({item.mois})</span>
                     <span className="font-bold">{item.recettes.toLocaleString()} GNF</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div className="bg-green-500 h-2 rounded-full w-full"></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-medium text-red-700">Dépenses ({item.mois})</span>
                     <span className="font-bold">{item.depenses.toLocaleString()} GNF</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div className="bg-red-500 h-2 rounded-full w-full" style={{ width: `${Math.min(100, (item.depenses / (item.recettes || 1)) * 100)}%` }}></div>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Répartition des recettes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition des recettes</h3>
          <div className="space-y-3">
            {categoriesRecettes.map((cat: any, idx: number) => {
              const Icon = getIconForCategory(cat.name);
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-900" />
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
              );
            })}
            {categoriesRecettes.length === 0 && <p className="text-sm text-gray-500">Aucune recette valide pour l'instant.</p>}
          </div>
        </div>
      </div>

      {/* Derniers paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">10 Dernières rentrées de caisse</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {derniersPaiements.map((paiement: any) => (
                <tr key={paiement.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{paiement.eleve}</td>
                  <td className="px-6 py-4 text-gray-900">{paiement.classe}</td>
                  <td className="px-6 py-4 font-medium">{paiement.montant.toLocaleString()} GNF</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded-full">
                      {paiement.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{paiement.date}</td>
                  <td className="px-6 py-4">
                    {paiement.statut === "valide" ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Validé
                      </span>
                    ) : (
                      <span className="text-yellow-600 text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {paiement.statut}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {derniersPaiements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Aucun paiement récent.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout Dépense */}
      {showDepenseForm && (
        <div className="fixed inset-0 bg-black/50 text-black flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Enregistrer une sortie de caisse</h2>
            <form onSubmit={handleAjoutDepense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select 
                  value={newDepense.categorie}
                  onChange={(e) => setNewDepense({...newDepense, categorie: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Montant (GNF)</label>
                <input 
                  type="number"
                  required
                  value={newDepense.montant}
                  onChange={(e) => setNewDepense({...newDepense, montant: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description / Motif</label>
                <textarea 
                  value={newDepense.description}
                  onChange={(e) => setNewDepense({...newDepense, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">Enregistrer</button>
                <button type="button" onClick={() => setShowDepenseForm(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}