// app/dashboard/admin/cantine/page.tsx - Version sans colonnes Inscrits, Présents, Recette réelle

"use client";

import { useState, useEffect } from "react";
import {
  Utensils, Calendar, Users, CreditCard, Plus, Edit, Trash2,
  Eye, Search, Download, Check, X, TrendingUp, TrendingDown,
  User, UserCheck, DollarSign, BarChart3, FileText, UserPlus, RefreshCw,
  ClipboardList, BookOpen, Wallet, Clock, AlertCircle, PieChart
} from "lucide-react";

interface Menu {
  id: number;
  date: string;
  plat: string;
  accompagnement: string;
  dessert: string;
  regime_special: boolean;
  prix: number | null;
  prix_annuel: number | null;
  inscrits: number;
  presents: number;
  recette_reelle: number;
}

// Interfaces pour les inscriptions
interface PreinscriptionCantine {
  id: number;
  numero_dossier: string;
  enfant_nom: string;
  enfant_prenom: string;
  classe: string;
  statut: string;
  menu_plat: string;
  prix_cantine: number;
  frais_statut: string;
  date: string;
}

interface ReinscriptionCantine {
  id: number;
  numero_dossier: string;
  enfant_nom: string;
  enfant_prenom: string;
  classe_nom: string;
  statut: string;
  montant_cantine: number;
  frais_statut: string;
  date: string;
}

interface CantineStats {
  totalInscrits: number;
  totalGarcons: number;
  totalFilles: number;
  moyenneJour: number;
  recettesMois: number;
  recettesAnnuel: number;
  recetteTotaleReelle: number;
  tauxPresence: number;
  totalMenus: number;
  nbMenusAvecPrix: number;
  recetteMoyenneParMenu: number;
  presentsGarcons: number;
  presentsFilles: number;
  preinscriptions?: PreinscriptionCantine[];
  reinscriptions?: ReinscriptionCantine[];
  totalPreinscriptions?: number;
  totalReinscriptions?: number;
  preinscriptionsPayees?: number;
  reinscriptionsPayees?: number;
  montantTotalPaye?: number;
  montantTotalEnAttente?: number;
  montantTotalNonPaye?: number;
  tauxPaiement?: number;
  pourcentagePaye?: number;
  pourcentageEnAttente?: number;
  pourcentageNonPaye?: number;
}

export default function CantinePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [stats, setStats] = useState<CantineStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'preinscriptions' | 'reinscriptions'>('preinscriptions');

  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    plat: "",
    accompagnement: "",
    dessert: "",
    regime_special: false,
    prix: "" as string,
    prix_annuel: "" as string
  });

  const fetchCantine = async () => {
    try {
      const response = await fetch('/api/admin/cantine');
      if (response.ok) {
        const data = await response.json();
        setMenus(data.menus || []);
        
        const preinscriptions = data.stats?.preinscriptions || [];
        const reinscriptions = data.stats?.reinscriptions || [];
        
        const preinscriptionsPayees = preinscriptions.filter((p: any) => p.frais_statut === 'paye');
        const reinscriptionsPayees = reinscriptions.filter((r: any) => r.frais_statut === 'paye');
        
        const montantTotalPaye = preinscriptionsPayees.reduce((sum: number, p: any) => sum + (p.prix_cantine || 0), 0) +
                                 reinscriptionsPayees.reduce((sum: number, r: any) => sum + (r.montant_cantine || 0), 0);
        
        const montantTotal = preinscriptions.reduce((sum: number, p: any) => sum + (p.prix_cantine || 0), 0) +
                            reinscriptions.reduce((sum: number, r: any) => sum + (r.montant_cantine || 0), 0);
        
        const montantTotalEnAttente = montantTotal - montantTotalPaye;
        const montantTotalNonPaye = montantTotalEnAttente;
        
        const tauxPaiement = montantTotal > 0 ? Math.round((montantTotalPaye / montantTotal) * 100) : 0;
        const pourcentagePaye = montantTotal > 0 ? Math.round((montantTotalPaye / montantTotal) * 100) : 0;
        const pourcentageEnAttente = montantTotal > 0 ? Math.round((montantTotalEnAttente / montantTotal) * 100) : 0;
        const pourcentageNonPaye = montantTotal > 0 ? Math.round((montantTotalNonPaye / montantTotal) * 100) : 0;
        
        setStats({
          totalInscrits: data.stats?.totalInscrits || 0,
          totalGarcons: data.stats?.totalGarcons || 0,
          totalFilles: data.stats?.totalFilles || 0,
          moyenneJour: data.stats?.moyenneJour || 0,
          recettesMois: data.stats?.recettesMois || 0,
          recettesAnnuel: data.stats?.recettesAnnuel || 0,
          recetteTotaleReelle: data.stats?.recetteTotaleReelle || 0,
          tauxPresence: data.stats?.tauxPresence || 0,
          totalMenus: data.stats?.totalMenus || 0,
          nbMenusAvecPrix: data.stats?.nbMenusAvecPrix || 0,
          recetteMoyenneParMenu: data.stats?.recetteMoyenneParMenu || 0,
          presentsGarcons: data.stats?.presentsGarcons || 0,
          presentsFilles: data.stats?.presentsFilles || 0,
          preinscriptions: preinscriptions,
          reinscriptions: reinscriptions,
          totalPreinscriptions: preinscriptions.length,
          totalReinscriptions: reinscriptions.length,
          preinscriptionsPayees: preinscriptionsPayees.length,
          reinscriptionsPayees: reinscriptionsPayees.length,
          montantTotalPaye: montantTotalPaye,
          montantTotalEnAttente: montantTotalEnAttente,
          montantTotalNonPaye: montantTotalNonPaye,
          tauxPaiement: tauxPaiement,
          pourcentagePaye: pourcentagePaye,
          pourcentageEnAttente: pourcentageEnAttente,
          pourcentageNonPaye: pourcentageNonPaye
        });
      }
    } catch (error) {
      console.error("Erreur chargement cantine:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCantine();
  }, []);

  const handleOpenAdd = () => {
    setEditingMenu(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      plat: "",
      accompagnement: "",
      dessert: "",
      regime_special: false,
      prix: "",
      prix_annuel: ""
    });
    setShowForm(true);
  };

  const handleOpenEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      date: menu.date,
      plat: menu.plat,
      accompagnement: menu.accompagnement,
      dessert: menu.dessert,
      regime_special: menu.regime_special,
      prix: menu.prix ? String(menu.prix) : "",
      prix_annuel: menu.prix_annuel ? String(menu.prix_annuel) : ""
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingMenu ? "PUT" : "POST";
      const body = {
        ...formData,
        prix: formData.prix ? parseInt(formData.prix) : null,
        prix_annuel: formData.prix_annuel ? parseInt(formData.prix_annuel) : null,
        id: editingMenu?.id
      };

      const response = await fetch('/api/admin/cantine', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowForm(false);
        fetchCantine();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement du menu");
      }
    } catch (error) {
      console.error("Erreur soumission menu:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce menu ?")) {
      try {
        const response = await fetch(`/api/admin/cantine?id=${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchCantine();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur suppression menu:", error);
      }
    }
  };

  if (loading || !stats) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const paymentStats = {
    totalPreinscriptions: stats.totalPreinscriptions || 0,
    totalReinscriptions: stats.totalReinscriptions || 0,
    preinscriptionsPayees: stats.preinscriptionsPayees || 0,
    reinscriptionsPayees: stats.reinscriptionsPayees || 0,
    montantTotalPaye: stats.montantTotalPaye || 0,
    montantTotalEnAttente: stats.montantTotalEnAttente || 0,
    montantTotalNonPaye: stats.montantTotalNonPaye || 0,
    tauxPaiement: stats.tauxPaiement || 0,
    pourcentagePaye: stats.pourcentagePaye || 0,
    pourcentageEnAttente: stats.pourcentageEnAttente || 0,
    pourcentageNonPaye: stats.pourcentageNonPaye || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion de la cantine</h1>
          <p className="text-gray-900">Menus, reservations, presence et recettes</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />Ajouter un menu
        </button>
      </div>

      {/* Statistiques de paiement - 4 cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Montant total paye */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 shadow-sm border border-green-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-3 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant total paye</p>
              <p className="text-xl font-bold text-green-700">
                {(paymentStats.montantTotalPaye).toLocaleString()} GNF
              </p>
              <p className="text-xs text-gray-500">
                {paymentStats.pourcentagePaye}% du total
              </p>
            </div>
          </div>
        </div>

        {/* Montant total en attente */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 shadow-sm border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600 p-3 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant total en attente</p>
              <p className="text-xl font-bold text-yellow-700">
                {(paymentStats.montantTotalEnAttente).toLocaleString()} GNF
              </p>
              <p className="text-xs text-gray-500">
                {paymentStats.pourcentageEnAttente}% du total
              </p>
            </div>
          </div>
        </div>

        {/* Montant total non paye */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-3 rounded-lg">
              <X className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant total non paye</p>
              <p className="text-xl font-bold text-red-700">
                {(paymentStats.montantTotalNonPaye).toLocaleString()} GNF
              </p>
              <p className="text-xs text-gray-500">
                {paymentStats.pourcentageNonPaye}% du total
              </p>
            </div>
          </div>
        </div>

        {/* Taux de paiement global */}
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 shadow-sm border border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux de paiement global</p>
              <p className="text-2xl font-bold text-indigo-700">
                {paymentStats.tauxPaiement}%
              </p>
              <p className="text-xs text-gray-500">
                {(paymentStats.montantTotalPaye).toLocaleString()} / {(paymentStats.montantTotalPaye + paymentStats.montantTotalEnAttente + paymentStats.montantTotalNonPaye || 1).toLocaleString()} GNF
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section : Liste des inscriptions a la cantine par type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Inscriptions a la cantine</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('preinscriptions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'preinscriptions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Pre-inscriptions ({stats.preinscriptions?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('reinscriptions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'reinscriptions'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Reinscriptions ({stats.reinscriptions?.length || 0})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Tab : Pre-inscriptions */}
          {activeTab === 'preinscriptions' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
                <tr>
                  <th className="px-6 py-3">Dossier</th>
                  <th className="px-6 py-3">Eleve</th>
                  <th className="px-6 py-3">Classe</th>
                  <th className="px-6 py-3">Menu choisi</th>
                  <th className="px-6 py-3">Prix cantine</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Paiement</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stats.preinscriptions && stats.preinscriptions.length > 0 ? (
                  stats.preinscriptions.map((p: PreinscriptionCantine) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs text-blue-600">{p.numero_dossier || '-'}</td>
                      <td className="px-6 py-4 font-medium">{p.enfant_prenom} {p.enfant_nom}</td>
                      <td className="px-6 py-4">{p.classe || '-'}</td>
                      <td className="px-6 py-4">{p.menu_plat || '-'}</td>
                      <td className="px-6 py-4 font-medium text-orange-600">
                        {(p.prix_cantine || 0).toLocaleString()} GNF
                      </td>
                      <td className="px-6 py-4">
                        {p.statut === 'en_attente' && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">En attente</span>
                        )}
                        {p.statut === 'valide' && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Validee</span>
                        )}
                        {p.statut === 'rejete' && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejetee</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.frais_statut === 'paye' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Paye</span>
                        ) : p.frais_statut === 'partiel' ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Partiel</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Non paye</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(p.date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucune pre-inscription avec cantine
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Tab : Reinscriptions */}
          {activeTab === 'reinscriptions' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
                <tr>
                  <th className="px-6 py-3">Dossier</th>
                  <th className="px-6 py-3">Eleve</th>
                  <th className="px-6 py-3">Classe</th>
                  <th className="px-6 py-3">Montant cantine</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Paiement</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stats.reinscriptions && stats.reinscriptions.length > 0 ? (
                  stats.reinscriptions.map((r: ReinscriptionCantine) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs text-purple-600">{r.numero_dossier || '-'}</td>
                      <td className="px-6 py-4 font-medium">{r.enfant_prenom} {r.enfant_nom}</td>
                      <td className="px-6 py-4">{r.classe_nom || '-'}</td>
                      <td className="px-6 py-4 font-medium text-orange-600">
                        {(r.montant_cantine || 0).toLocaleString()} GNF
                      </td>
                      <td className="px-6 py-4">
                        {r.statut === 'en_attente' && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">En attente</span>
                        )}
                        {r.statut === 'valide' && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Validee</span>
                        )}
                        {r.statut === 'rejete' && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejetee</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.frais_statut === 'paye' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Paye</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Non paye</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(r.date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Aucune reinscription avec cantine
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Tableau des menus - sans colonnes Inscrits, Presents, Recette reelle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Menus enregistres</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            />
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <Search className="w-4 h-4 text-gray-900" />
            </button>
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4 text-gray-900" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
              <tr>
                <th className="px-6 py-3">Plat Principal</th>
                <th className="px-6 py-3">Accompagnement</th>
                <th className="px-6 py-3">Dessert</th>
                <th className="px-6 py-3">Prix Annuel</th>
                <th className="px-6 py-3">Regime Special</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {menus.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-900">{m.plat}</td>
                  <td className="px-6 py-4 text-gray-900">{m.accompagnement}</td>
                  <td className="px-6 py-4 text-gray-900">{m.dessert}</td>
                  <td className="px-6 py-4 font-medium text-purple-600">
                    {m.prix_annuel ? `${m.prix_annuel.toLocaleString()} GNF` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {m.regime_special ? (
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Oui</span>
                    ) : (
                      <span className="text-gray-900 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-900">
                    Aucun menu disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMenu ? "Modifier le menu" : "Ajouter un menu"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-900 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-black">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Plat principal</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Riz au gras sauce poulet"
                  value={formData.plat}
                  onChange={e => setFormData({ ...formData, plat: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Accompagnement</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Frites ou Salade de fruits"
                  value={formData.accompagnement}
                  onChange={e => setFormData({ ...formData, accompagnement: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Dessert</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Yaourt ou Pomme"
                  value={formData.dessert}
                  onChange={e => setFormData({ ...formData, dessert: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Prix Annuel (GNF)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ex: 2500000"
                  value={formData.prix_annuel}
                  onChange={e => setFormData({ ...formData, prix_annuel: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Laissez vide si non defini</p>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="regime_special"
                  checked={formData.regime_special}
                  onChange={e => setFormData({ ...formData, regime_special: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="regime_special" className="text-sm font-medium text-gray-900 select-none cursor-pointer">
                  Option de regime special disponible (vegetarien, allergies...)
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 text-sm font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}