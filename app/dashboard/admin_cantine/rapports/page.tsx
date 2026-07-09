// app/dashboard/admin_cantine/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Utensils, Calendar, Users, CreditCard, Plus, Edit, Trash2,
  Eye, Search, Download, Check, X, TrendingUp, TrendingDown,
  User, UserCheck, DollarSign, BarChart3, FileText, UserPlus, RefreshCw,
  ClipboardList, BookOpen, Wallet, Clock, AlertCircle, PieChart,
  ShoppingBag, Coffee, Soup, Cake, CheckCircle 
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
}

interface PreinscriptionCantine {
  id: number;
  numero_dossier: string;
  enfant_nom: string;
  enfant_prenom: string;
  sexe?: string;
  classe: string;
  statut: string;
  menu_plat: string;
  prix_cantine: number;
  frais_statut: string;
  date: string;
}

interface InscriptionCantine {
  eleve_id: number;
  matricule: string;
  sexe: string;
  enfant_nom: string;
  enfant_prenom: string;
  classe_nom: string;
  est_actif: boolean;
  solde: number;
  date_inscription: string;
}

interface ReinscriptionCantine {
  id: number;
  numero_dossier: string;
  enfant_nom: string;
  enfant_prenom: string;
  sexe?: string;
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
  preinscriptions: PreinscriptionCantine[];
  inscriptions: InscriptionCantine[];
  reinscriptions: ReinscriptionCantine[];
  totalPreinscriptions: number;
  totalReinscriptions: number;
  preinscriptionsPayees: number;
  reinscriptionsPayees: number;
  montantTotalPaye: number;
  montantTotalEnAttente: number;
  montantTotalNonPaye: number;
  tauxPaiement: number;
  pourcentagePaye: number;
  pourcentageEnAttente: number;
  pourcentageNonPaye: number;
  // ⭐ Nouvelles statistiques pour validées et payées
  totalValidees: number;
  totalPayees: number;
  garconsValidees: number;
  fillesValidees: number;
  garconsPayees: number;
  fillesPayees: number;
}

export default function AdminCantineDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [stats, setStats] = useState<CantineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preinscriptions' | 'inscriptions' | 'reinscriptions'>('preinscriptions');

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
        const inscriptions = data.stats?.inscriptions || [];
        
        // ⭐ Filtrer les validées
        const preinscriptionsValidees = preinscriptions.filter((p: any) => p.statut === 'valide');
        const reinscriptionsValidees = reinscriptions.filter((r: any) => r.statut === 'valide');
        
        // ⭐ Filtrer les payées
        const preinscriptionsPayees = preinscriptions.filter((p: any) => p.frais_statut === 'paye' || p.frais_statut === 'partiel');
        const reinscriptionsPayees = reinscriptions.filter((r: any) => r.frais_statut === 'paye' || r.frais_statut === 'partiel');
        
        // ⭐ Compter les garçons et filles pour validées
        const garconsValidees = preinscriptionsValidees.filter((p: any) => p.sexe === 'M').length +
                               reinscriptionsValidees.filter((r: any) => r.sexe === 'M').length;
        const fillesValidees = preinscriptionsValidees.filter((p: any) => p.sexe === 'F').length +
                              reinscriptionsValidees.filter((r: any) => r.sexe === 'F').length;
        
        // ⭐ Compter les garçons et filles pour payées
        const garconsPayees = preinscriptionsPayees.filter((p: any) => p.sexe === 'M').length +
                             reinscriptionsPayees.filter((r: any) => r.sexe === 'M').length;
        const fillesPayees = preinscriptionsPayees.filter((p: any) => p.sexe === 'F').length +
                            reinscriptionsPayees.filter((r: any) => r.sexe === 'F').length;
        
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
        
        // ⭐ Total garçons et filles (pré-inscriptions + réinscriptions)
        const totalGarcons = preinscriptions.filter((p: any) => p.sexe === 'M').length +
                           reinscriptions.filter((r: any) => r.sexe === 'M').length;
        const totalFilles = preinscriptions.filter((p: any) => p.sexe === 'F').length +
                           reinscriptions.filter((r: any) => r.sexe === 'F').length;
        const totalInscrits = totalGarcons + totalFilles;
        
        // ⭐ Total validées
        const totalValidees = preinscriptionsValidees.length + reinscriptionsValidees.length;
        const totalPayees = preinscriptionsPayees.length + reinscriptionsPayees.length;
        
        setStats({
          totalInscrits: totalInscrits,
          totalGarcons: totalGarcons,
          totalFilles: totalFilles,
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
          inscriptions: inscriptions,
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
          pourcentageNonPaye: pourcentageNonPaye,
          // ⭐ Nouvelles statistiques
          totalValidees: totalValidees,
          totalPayees: totalPayees,
          garconsValidees: garconsValidees,
          fillesValidees: fillesValidees,
          garconsPayees: garconsPayees,
          fillesPayees: fillesPayees
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const formatPrix = (valeur: number) => {
    return new Intl.NumberFormat('fr-FR').format(valeur);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✅ Validée</span>;
      case 'en_attente':
        return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">⏳ En attente</span>;
      case 'rejete':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">❌ Rejetée</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{statut}</span>;
    }
  };

  const getFraisBadge = (fraisStatut: string) => {
    switch (fraisStatut) {
      case 'paye':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✅ Payé</span>;
      case 'partiel':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">⏳ Partiel</span>;
      default:
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">❌ Non payé</span>;
    }
  };

  const getSexeLabel = (sexe?: string) => {
    if (sexe === 'M') return '👦 Garçon';
    if (sexe === 'F') return '👧 Fille';
    return '—';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-7 h-7 text-purple-600" />
            Dashboard Cantine
          </h1>
          <p className="text-gray-500 mt-1">Gestion des menus, inscriptions et présences</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          Ajouter un menu
        </button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Total inscrits</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalInscrits}</p>
          <Users className="w-4 h-4 text-blue-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Taux de présence</p>
          <p className="text-2xl font-bold text-green-600">{stats.tauxPresence}%</p>
          <UserCheck className="w-4 h-4 text-green-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Menus enregistrés</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalMenus}</p>
          <Utensils className="w-4 h-4 text-purple-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Recettes (mois)</p>
          <p className="text-2xl font-bold text-orange-600">{formatPrix(stats.recettesMois)} GNF</p>
          <CreditCard className="w-4 h-4 text-orange-200 mt-1" />
        </div>
      </div>

      {/* ⭐ Statistiques Validées et Payées avec sexe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 shadow-sm border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Inscriptions validées
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalValidees}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">👦 Garçons</p>
                <p className="text-xl font-bold text-blue-600">{stats.garconsValidees}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">👧 Filles</p>
                <p className="text-xl font-bold text-pink-600">{stats.fillesValidees}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Taux</p>
              <p className="text-lg font-bold text-green-700">
                {stats.totalInscrits > 0 ? Math.round((stats.totalValidees / stats.totalInscrits) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="mt-2 w-full bg-green-200 h-1.5 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-blue-600 h-full" 
                style={{ width: `${stats.totalValidees > 0 ? (stats.garconsValidees / stats.totalValidees) * 100 : 0}%` }}
              />
              <div 
                className="bg-pink-400 h-full" 
                style={{ width: `${stats.totalValidees > 0 ? (stats.fillesValidees / stats.totalValidees) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Paiements effectués
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalPayees}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">👦 Garçons</p>
                <p className="text-xl font-bold text-blue-600">{stats.garconsPayees}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">👧 Filles</p>
                <p className="text-xl font-bold text-pink-600">{stats.fillesPayees}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Taux paiement</p>
              <p className="text-lg font-bold text-blue-700">{stats.tauxPaiement}%</p>
            </div>
          </div>
          <div className="mt-2 w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-blue-600 h-full" 
                style={{ width: `${stats.totalPayees > 0 ? (stats.garconsPayees / stats.totalPayees) * 100 : 0}%` }}
              />
              <div 
                className="bg-pink-400 h-full" 
                style={{ width: `${stats.totalPayees > 0 ? (stats.fillesPayees / stats.totalPayees) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Répartition par sexe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Répartition par sexe
          </h3>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-500">Garçons</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalGarcons}</p>
              <p className="text-xs text-gray-400">
                {stats.totalInscrits > 0 ? Math.round((stats.totalGarcons / stats.totalInscrits) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Filles</p>
              <p className="text-2xl font-bold text-pink-600">{stats.totalFilles}</p>
              <p className="text-xs text-gray-400">
                {stats.totalInscrits > 0 ? Math.round((stats.totalFilles / stats.totalInscrits) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInscrits}</p>
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-blue-600 h-full" 
                style={{ width: `${stats.totalInscrits > 0 ? (stats.totalGarcons / stats.totalInscrits) * 100 : 0}%` }}
              />
              <div 
                className="bg-pink-400 h-full" 
                style={{ width: `${stats.totalInscrits > 0 ? (stats.totalFilles / stats.totalInscrits) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-purple-600" />
            Menus
          </h3>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-500">Total menus</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalMenus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avec prix</p>
              <p className="text-2xl font-bold text-orange-600">{stats.nbMenusAvecPrix}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Moyenne / menu</p>
              <p className="text-2xl font-bold text-green-600">{formatPrix(stats.recetteMoyenneParMenu)} GNF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques de paiement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 shadow-sm border border-green-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-3 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant total payé</p>
              <p className="text-xl font-bold text-green-700">{formatPrix(stats.montantTotalPaye)} GNF</p>
              <p className="text-xs text-gray-500">{stats.pourcentagePaye}% du total</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 shadow-sm border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600 p-3 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-xl font-bold text-yellow-700">{formatPrix(stats.montantTotalEnAttente)} GNF</p>
              <p className="text-xs text-gray-500">{stats.pourcentageEnAttente}% du total</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-3 rounded-lg">
              <X className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Non payé</p>
              <p className="text-xl font-bold text-red-700">{formatPrix(stats.montantTotalNonPaye)} GNF</p>
              <p className="text-xs text-gray-500">{stats.pourcentageNonPaye}% du total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets inscriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Inscriptions à la cantine</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('preinscriptions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'preinscriptions'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Pré-inscriptions ({stats.totalPreinscriptions})
              </button>
              <button
                onClick={() => setActiveTab('inscriptions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === 'inscriptions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Inscriptions ({stats.inscriptions?.length || 0})
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
                Réinscriptions ({stats.totalReinscriptions})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Pré-inscriptions */}
          {activeTab === 'preinscriptions' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Dossier</th>
                  <th className="px-6 py-3">Élève</th>
                  <th className="px-6 py-3 text-center">Sexe</th>
                  <th className="px-6 py-3">Classe</th>
                  <th className="px-6 py-3">Menu</th>
                  <th className="px-6 py-3 text-right">Prix</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-center">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stats.preinscriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-purple-600">{p.numero_dossier || '-'}</td>
                    <td className="px-6 py-4 font-medium">{p.enfant_prenom} {p.enfant_nom}</td>
                    <td className="px-6 py-4 text-center">
                      {getSexeLabel(p.sexe)}
                    </td>
                    <td className="px-6 py-4">{p.classe || '-'}</td>
                    <td className="px-6 py-4">{p.menu_plat || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-orange-600">{formatPrix(p.prix_cantine)} GNF</td>
                    <td className="px-6 py-4 text-center">{getStatutBadge(p.statut)}</td>
                    <td className="px-6 py-4 text-center">{getFraisBadge(p.frais_statut)}</td>
                  </tr>
                ))}
                {stats.preinscriptions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucune pré-inscription avec cantine
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Inscriptions */}
          {activeTab === 'inscriptions' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Matricule</th>
                  <th className="px-6 py-3">Élève</th>
                  <th className="px-6 py-3 text-center">Sexe</th>
                  <th className="px-6 py-3">Classe</th>
                  <th className="px-6 py-3 text-right">Solde</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-center">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stats.inscriptions?.map((i) => (
                  <tr key={i.eleve_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-blue-600">{i.matricule}</td>
                    <td className="px-6 py-4 font-medium">{i.enfant_prenom} {i.enfant_nom}</td>
                    <td className="px-6 py-4 text-center">
                      {getSexeLabel(i.sexe)}
                    </td>
                    <td className="px-6 py-4">{i.classe_nom}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">{formatPrix(i.solde)} GNF</td>
                    <td className="px-6 py-4 text-center">
                      {i.est_actif ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✅ Actif</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">❌ Inactif</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(i.date_inscription)}</td>
                  </tr>
                ))}
                {stats.inscriptions?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Aucune inscription à la cantine
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Réinscriptions */}
          {activeTab === 'reinscriptions' && (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Dossier</th>
                  <th className="px-6 py-3">Élève</th>
                  <th className="px-6 py-3 text-center">Sexe</th>
                  <th className="px-6 py-3">Classe</th>
                  <th className="px-6 py-3 text-right">Montant</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-center">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stats.reinscriptions.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-purple-600">{r.numero_dossier || '-'}</td>
                    <td className="px-6 py-4 font-medium">{r.enfant_prenom} {r.enfant_nom}</td>
                    <td className="px-6 py-4 text-center">
                      {getSexeLabel(r.sexe)}
                    </td>
                    <td className="px-6 py-4">{r.classe_nom || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-orange-600">{formatPrix(r.montant_cantine)} GNF</td>
                    <td className="px-6 py-4 text-center">{getStatutBadge(r.statut)}</td>
                    <td className="px-6 py-4 text-center">{getFraisBadge(r.frais_statut)}</td>
                  </tr>
                ))}
                {stats.reinscriptions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Aucune réinscription avec cantine
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Liste des menus */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Menus enregistrés</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            />
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <Search className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="px-6 py-3">Plat principal</th>
                <th className="px-6 py-3">Accompagnement</th>
                <th className="px-6 py-3">Dessert</th>
                <th className="px-6 py-3 text-right">Prix annuel</th>
                <th className="px-6 py-3 text-center">Régime spécial</th>
                <th className="px-6 py-3 text-center">Inscrits</th>
                <th className="px-6 py-3 text-center">Présents</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {menus.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-900">{m.plat}</td>
                  <td className="px-6 py-4">{m.accompagnement}</td>
                  <td className="px-6 py-4">{m.dessert}</td>
                  <td className="px-6 py-4 text-right font-medium text-purple-600">
                    {m.prix_annuel ? `${formatPrix(m.prix_annuel)} GNF` : "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {m.regime_special ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Oui</span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{m.inscrits}</td>
                  <td className="px-6 py-4 text-center font-medium text-green-600">{m.presents}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="text-blue-600 hover:text-blue-800 p-1 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-600 hover:text-red-800 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucun menu disponible</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter un menu" pour commencer</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fade-in p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMenu ? "Modifier le menu" : "Ajouter un menu"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plat principal *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Riz au gras sauce poulet"
                  value={formData.plat}
                  onChange={e => setFormData({ ...formData, plat: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accompagnement *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Frites ou Salade"
                  value={formData.accompagnement}
                  onChange={e => setFormData({ ...formData, accompagnement: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dessert *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Yaourt ou Fruit"
                  value={formData.dessert}
                  onChange={e => setFormData({ ...formData, dessert: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix annuel (GNF)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ex: 2500000"
                  value={formData.prix_annuel}
                  onChange={e => setFormData({ ...formData, prix_annuel: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Laissez vide si non défini</p>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="regime_special"
                  checked={formData.regime_special}
                  onChange={e => setFormData({ ...formData, regime_special: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="regime_special" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                  Régime spécial disponible (végétarien, allergies...)
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  {editingMenu ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        <p>© {new Date().getFullYear()} E.I.E.F - Module Cantine</p>
      </div>
    </div>
  );
}