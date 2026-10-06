//app\dashboard\admin\cantine\page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Utensils, Calendar, Users, CreditCard, Plus, Edit, Trash2,
  Eye, Search, Download, Check, X, TrendingUp, TrendingDown,
  User, UserCheck, DollarSign, BarChart3, FileText, UserPlus, RefreshCw,
  ClipboardList, BookOpen, Wallet, Clock, AlertCircle, PieChart, CheckCircle,
  Minus, Plus as PlusIcon, Save, Pencil
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
  prix_mensuel: number | null;
  inscrits: number;
  presents: number;
  recette_reelle: number;
}

interface Eleve {
  id: number | null;
  matricule: string;
  nom: string;
  prenom: string;
  classe_nom: string;
  sexe?: string;
  photo_url?: string | null;
  source?: "eleve" | "preinscription";
  preinscription_id?: number | null;
  ref_id?: number;
}

interface InscriptionCantineDetail {
  id: number;
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  classe_nom: string;
  mois_total: number;
  mois_restants: number;
  montant_mensuel: number;
  montant_total: number;
  solde: number;
  est_actif: boolean;
  date_inscription: string;
}

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
  const [menus, setMenus] = useState<Menu[]>([]);
  const [stats, setStats] = useState<CantineStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ⭐ Onglets : menus | inscriptions | preinscriptions | reinscriptions
  const [activeTab, setActiveTab] = useState<'menus' | 'inscriptions' | 'preinscriptions' | 'reinscriptions'>('menus');

  // ⭐ États pour les menus
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [searchMenu, setSearchMenu] = useState("");
  const [menuForm, setMenuForm] = useState({
    plat: "",
    accompagnement: "",
    dessert: "",
    regime_special: false,
    prix_mensuel: 400000,
    prix_annuel: 3600000,
  });

  // ⭐ États pour les inscriptions directes
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInscription, setEditingInscription] = useState<InscriptionCantineDetail | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [searchEleve, setSearchEleve] = useState("");
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [nombreMois, setNombreMois] = useState(9);
  const [prixMensuel, setPrixMensuel] = useState(400000);
  const [totalAPayer, setTotalAPayer] = useState(0);
  const [inscriptions, setInscriptions] = useState<InscriptionCantineDetail[]>([]);

  const MOIS_MAX = 9;

  // ⭐ Chargement des données
  useEffect(() => {
    fetchCantine();
    fetchEleves();
    fetchInscriptions();
  }, []);

  useEffect(() => {
    setTotalAPayer(nombreMois * prixMensuel);
  }, [nombreMois, prixMensuel]);

  // ⭐ API Calls
  const fetchCantine = async () => {
    try {
      const response = await fetch('/api/admin/cantine');
      if (response.ok) {
        const data = await response.json();
        setMenus(data.menus || []);

        // Calculer les stats de paiement
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
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEleves = async () => {
    try {
      // ⭐ Charger élèves inscrits + pré-inscriptions en attente
      const response = await fetch('/api/admin/eleves-et-preinscriptions');
      if (response.ok) {
        const data = await response.json();
        setEleves(data);
      }
    } catch (error) {
      console.error("Erreur chargement élèves:", error);
    }
  };

  const fetchInscriptions = async () => {
    try {
      const response = await fetch('/api/admin/cantine/inscriptions');
      if (response.ok) {
        const data = await response.json();
        setInscriptions(data);
      }
    } catch (error) {
      console.error("Erreur chargement inscriptions:", error);
    }
  };

  // ⭐ Gestion des menus
  const handleOpenAddMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      plat: "",
      accompagnement: "",
      dessert: "",
      regime_special: false,
      prix_mensuel: 400000,
      prix_annuel: 3600000,
    });
    setShowMenuForm(true);
  };

  const handleOpenEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuForm({
      plat: menu.plat,
      accompagnement: menu.accompagnement || "",
      dessert: menu.dessert || "",
      regime_special: menu.regime_special || false,
      prix_mensuel: menu.prix_mensuel || 400000,
      prix_annuel: menu.prix_annuel || 3600000,
    });
    setShowMenuForm(true);
  };

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingMenu ? "PUT" : "POST";
      const body = { ...menuForm, id: editingMenu?.id };

      const response = await fetch('/api/admin/cantine', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowMenuForm(false);
        fetchCantine();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce menu ?")) {
      try {
        const response = await fetch(`/api/admin/cantine?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchCantine();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  // ⭐ Gestion des inscriptions directes
  const handleInscrire = async () => {
    if (!selectedEleve) {
      alert("Veuillez sélectionner un élève");
      return;
    }

    try {
      // ⭐ Détecter le type : élève inscrit ou pré-inscription en attente
      const isPreinscription = selectedEleve.source === 'preinscription';
      
      const payload: any = {
        mois: nombreMois,
        montantMensuel: prixMensuel,
        montantTotal: totalAPayer
      };

      if (isPreinscription) {
        payload.preinscriptionId = selectedEleve.preinscription_id;
      } else {
        payload.eleveId = selectedEleve.id;
      }

      const response = await fetch('/api/admin/cantine/inscrire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`✅ ${selectedEleve.prenom} ${selectedEleve.nom} inscrit à la cantine pour ${nombreMois} mois${
          isPreinscription ? ' (dossier en attente)' : ''
        }`);
        setShowInscriptionModal(false);
        setSelectedEleve(null);
        setNombreMois(9);
        fetchInscriptions();
        fetchCantine();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleOpenEditInscription = (inscription: InscriptionCantineDetail) => {
    setEditingInscription(inscription);
    setNombreMois(inscription.mois_total || 9);
    setPrixMensuel(inscription.montant_mensuel || 400000);
    setShowEditModal(true);
  };

  const handleUpdateInscription = async () => {
    if (!editingInscription) return;

    try {
      const response = await fetch(`/api/admin/cantine/inscriptions/${editingInscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mois: nombreMois,
          montantMensuel: prixMensuel,
          montantTotal: nombreMois * prixMensuel
        })
      });

      if (response.ok) {
        alert("✅ Inscription modifiée avec succès");
        setShowEditModal(false);
        setEditingInscription(null);
        fetchInscriptions();
        fetchCantine();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDeleteInscription = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette inscription ?")) {
      try {
        const response = await fetch(`/api/admin/cantine/inscriptions/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchInscriptions();
          fetchCantine();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleAjouterMois = () => {
    if (nombreMois < MOIS_MAX) setNombreMois(nombreMois + 1);
  };

  const handleRetirerMois = () => {
    if (nombreMois > 1) setNombreMois(nombreMois - 1);
  };

  const elevesFiltres = eleves.filter(e =>
    `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(searchEleve.toLowerCase())
  );

  const menusFiltres = menus.filter(m =>
    m.plat.toLowerCase().includes(searchMenu.toLowerCase())
  );

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion de la cantine</h1>
          <p className="text-gray-900">Menus, inscriptions et recettes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAddMenu}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter un menu
          </button>
          <button
            onClick={() => setShowInscriptionModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            Inscrire un élève
          </button>
        </div>
      </div>

      {/* Statistiques de paiement - 4 cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 shadow-sm border border-green-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-3 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-900">Montant total payé</p>
              <p className="text-xl font-bold text-green-700">
                {paymentStats.montantTotalPaye.toLocaleString()} GNF
              </p>
              <p className="text-xs text-gray-900">{paymentStats.pourcentagePaye}% du total</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 shadow-sm border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600 p-3 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-900">En attente</p>
              <p className="text-xl font-bold text-yellow-700">
                {paymentStats.montantTotalEnAttente.toLocaleString()} GNF
              </p>
              <p className="text-xs text-gray-900">{paymentStats.pourcentageEnAttente}% du total</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-3 rounded-lg">
              <X className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-900">Non payé</p>
              <p className="text-xl font-bold text-red-700">
                {paymentStats.montantTotalNonPaye.toLocaleString()} GNF
              </p>
              <p className="text-xs text-gray-900">{paymentStats.pourcentageNonPaye}% du total</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 shadow-sm border border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-900">Taux de paiement</p>
              <p className="text-2xl font-bold text-indigo-700">{paymentStats.tauxPaiement}%</p>
              <p className="text-xs text-gray-900">Global</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b px-6">
          <div className="flex gap-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('menus')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'menus'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-900 hover:text-gray-900'
                }`}
            >
              <Utensils className="w-4 h-4 inline mr-2" />
              Menus
            </button>
            <button
              onClick={() => setActiveTab('inscriptions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'inscriptions'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-900 hover:text-gray-900'
                }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Inscrits
            </button>
            <button
              onClick={() => setActiveTab('preinscriptions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'preinscriptions'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-900 hover:text-gray-900'
                }`}
            >
              <ClipboardList className="w-4 h-4 inline mr-2" />
              Inscriptions ({stats.preinscriptions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('reinscriptions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'reinscriptions'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-900 hover:text-gray-900'
                }`}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Réinscriptions ({stats.reinscriptions?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Menus */}
        {activeTab === 'menus' && (
          <div className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                <input
                  type="text"
                  placeholder="Rechercher un menu..."
                  value={searchMenu}
                  onChange={(e) => setSearchMenu(e.target.value)}
                  className="w-full text-black pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
                  <tr>
                    <th className="px-6 py-3">Plat</th>
                    <th className="px-6 py-3">Accompagnement</th>
                    <th className="px-6 py-3">Dessert</th>
                    <th className="px-6 py-3">Prix mensuel</th>
                    <th className="px-6 py-3">Prix annuel</th>
                   {/*<th className="px-6 py-3">Inscrits</th>*/}
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {menusFiltres.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-blue-900">{m.plat}</td>
                      <td className="px-6 py-4 text-gray-900">{m.accompagnement || '-'}</td>
                      <td className="px-6 py-4 text-gray-900">{m.dessert || '-'}</td>
                      <td className="px-6 py-4 text-blue-900 font-medium">
                        {m.prix_mensuel ? `${m.prix_mensuel.toLocaleString()} GNF` : "—"}
                      </td>
                      <td className="px-6 py-4 text-blue-900 font-medium">
                        {m.prix_annuel ? `${m.prix_annuel.toLocaleString()} GNF` : "—"}
                      </td>
                       {/*<td className="px-6 py-4 text-center text-black">{m.inscrits || 0}</td>*/}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEditMenu(m)} className="text-blue-600 hover:text-blue-800 p-1">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteMenu(m.id)} className="text-red-600 hover:text-red-800 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Inscriptions directes */}
        {activeTab === 'inscriptions' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
                  <tr>
                    <th className="px-6 py-3">Élève</th>
                    <th className="px-6 py-3">Classe</th>
                    <th className="px-6 py-3">Mois</th>
                    <th className="px-6 py-3">Prix/mois</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Solde</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {inscriptions.map((ins) => (
                    <tr key={ins.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{ins.eleve_prenom} {ins.eleve_nom}</td>
                      <td className="px-6 py-4">{ins.classe_nom || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium">{ins.mois_total}</span>
                        <span className="text-xs text-gray-900">/{MOIS_MAX}</span>
                      </td>
                      <td className="px-6 py-4 text-purple-600">{ins.montant_mensuel.toLocaleString()} GNF</td>
                      <td className="px-6 py-4 font-medium text-green-600">{ins.montant_total.toLocaleString()} GNF</td>
                      <td className="px-6 py-4 font-medium text-blue-600">{ins.solde.toLocaleString()} GNF</td>
                      <td className="px-6 py-4">
                        {ins.est_actif ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Actif</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Inactif</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEditInscription(ins)} className="text-blue-600 hover:text-blue-800 p-1">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteInscription(ins.id)} className="text-red-600 hover:text-red-800 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Pré-inscriptions */}
        {activeTab === 'preinscriptions' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
                  <tr>
                    <th className="px-6 py-3">Dossier</th>
                    <th className="px-6 py-3">Élève</th>
                    <th className="px-6 py-3">Classe</th>
                    <th className="px-6 py-3">Menu</th>
                    <th className="px-6 py-3">Prix</th>
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
                        <td className="px-6 py-4 text-black font-medium">{p.enfant_prenom} {p.enfant_nom}</td>
                        <td className="px-6 py-4 text-black">{p.classe || '-'}</td>
                        <td className="px-6 py-4 text-black">{p.menu_plat || '-'}</td>
                        <td className="px-6 py-4 font-medium text-orange-600">
                          {(p.prix_cantine || 0).toLocaleString()} GNF
                        </td>
                        <td className="px-6 py-4">
                          {p.statut === 'en_attente' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">En attente</span>}
                          {p.statut === 'valide' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Validée</span>}
                          {p.statut === 'rejete' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejetée</span>}
                        </td>
                        <td className="px-6 py-4">
                          {p.frais_statut === 'paye' ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Payé</span>
                          ) : p.frais_statut === 'partiel' ? (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Partiel</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Non payé</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 text-xs">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-900">
                        Aucune inscription avec cantine
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Réinscriptions */}
        {activeTab === 'reinscriptions' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
                  <tr>
                    <th className="px-6 py-3">Dossier</th>
                    <th className="px-6 py-3">Élève</th>
                    <th className="px-6 py-3">Classe</th>
                    <th className="px-6 py-3">Montant</th>
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
                        <td className="px-6 py-4 text-black font-medium">{r.enfant_prenom} {r.enfant_nom}</td>
                        <td className="px-6 py-4 text-black">{r.classe_nom || '-'}</td>
                        <td className="px-6 py-4 text-black font-medium text-orange-600">
                          {(r.montant_cantine || 0).toLocaleString()} GNF
                        </td>
                        <td className="px-6 py-4">
                          {r.statut === 'en_attente' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">En attente</span>}
                          {r.statut === 'valide' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Validée</span>}
                          {r.statut === 'rejete' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Rejetée</span>}
                        </td>
                        <td className="px-6 py-4">
                          {r.frais_statut === 'paye' ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Payé</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Non payé</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 text-xs">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-900">
                        Aucune réinscription avec cantine
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals (inchangés) */}
      {/* ... Les modals restent les mêmes que dans la version précédente ... */}

      {/* Modal d'inscription */}
      {showInscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                Inscription à la cantine
              </h2>
              <button onClick={() => setShowInscriptionModal(false)} className="text-gray-900 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Recherche élève */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Élève *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou matricule..."
                    value={searchEleve}
                    onChange={(e) => setSearchEleve(e.target.value)}
                    className="text-gray-900 w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {searchEleve && (
                  <div className="text-gray-900 mt-2 border rounded-lg max-h-40 overflow-y-auto">
                    {elevesFiltres.slice(0, 5).map((eleve) => (
                      <button
                        key={eleve.id}
                        onClick={() => {
                          setSelectedEleve(eleve);
                          setSearchEleve(`${eleve.prenom} ${eleve.nom} (${eleve.matricule})`);
                        }}
                        className="text-gray-900 w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{eleve.prenom} {eleve.nom}</p>
                          <p className="text-xs text-gray-900">{eleve.matricule} • {eleve.classe_nom}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedEleve && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{selectedEleve.prenom} {selectedEleve.nom}</p>
                      <p className="text-xs text-green-600">{selectedEleve.matricule} • {selectedEleve.classe_nom}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre de mois */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nombre de mois (sur 9 mois scolaires)</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleRetirerMois}
                    disabled={nombreMois <= 1}
                    className="text-gray-900 w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 text-gray-900" />
                  </button>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-blue-600">{nombreMois}</span>
                    <span className="text-sm text-gray-900 ml-1">/ 9 mois</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAjouterMois}
                    disabled={nombreMois >= MOIS_MAX}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4 text-gray-900" />
                  </button>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(nombreMois / MOIS_MAX) * 100}%` }} />
                </div>
              </div>

              {/* Prix mensuel */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Prix mensuel (GNF)</label>
                <input
                  type="number"
                  value={prixMensuel}
                  onChange={(e) => setPrixMensuel(Number(e.target.value) || 0)}
                  className="text-gray-900 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="10000"
                />
              </div>

              {/* Récapitulatif */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Récapitulatif</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">Prix mensuel</span>
                    <span className="font-medium text-gray-900">{prixMensuel.toLocaleString()} GNF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">Nombre de mois</span>
                    <span className="font-medium text-gray-900">{nombreMois} mois</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total à payer</span>
                    <span className="text-green-700">{totalAPayer.toLocaleString()} GNF</span>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInscriptionModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInscrire}
                  disabled={!selectedEleve}
                  className="flex-1 px-4 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Inscrire à la cantine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Menu */}
      {showMenuForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMenu ? "Modifier le menu" : "Ajouter un menu"}
              </h2>
              <button onClick={() => setShowMenuForm(false)} className="text-gray-900 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitMenu} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Plat principal *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Riz au gras sauce poulet"
                  value={menuForm.plat}
                  onChange={e => setMenuForm({ ...menuForm, plat: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Accompagnement</label>
                <input
                  type="text"
                  placeholder="Ex: Frites ou Salade"
                  value={menuForm.accompagnement}
                  onChange={e => setMenuForm({ ...menuForm, accompagnement: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Dessert</label>
                <input
                  type="text"
                  placeholder="Ex: Yaourt ou Fruit"
                  value={menuForm.dessert}
                  onChange={e => setMenuForm({ ...menuForm, dessert: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Prix mensuel (GNF)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="Ex: 400000"
                  value={menuForm.prix_mensuel}
                  onChange={e => setMenuForm({ ...menuForm, prix_mensuel: Number(e.target.value) || 0 })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Prix annuel (GNF)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="Ex: 3600000"
                  value={menuForm.prix_annuel}
                  onChange={e => setMenuForm({ ...menuForm, prix_annuel: Number(e.target.value) || 0 })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="regime_special"
                  checked={menuForm.regime_special}
                  onChange={e => setMenuForm({ ...menuForm, regime_special: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="regime_special" className="text-sm font-medium text-gray-900">
                  Régime spécial disponible
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMenuForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingMenu ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modification Inscription */}
      {showEditModal && editingInscription && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Modifier l'inscription
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-900 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">{editingInscription.eleve_prenom} {editingInscription.eleve_nom}</p>
                <p className="text-sm text-gray-900">{editingInscription.classe_nom}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Nombre de mois</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleRetirerMois}
                    disabled={nombreMois <= 1}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-blue-600">{nombreMois}</span>
                    <span className="text-sm text-gray-900 ml-1">/ 9 mois</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAjouterMois}
                    disabled={nombreMois >= MOIS_MAX}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Prix mensuel</label>
                <input
                  type="number"
                  value={prixMensuel}
                  onChange={(e) => setPrixMensuel(Number(e.target.value) || 0)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="10000"
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">Total</span>
                  <span className="font-bold text-green-700">{totalAPayer.toLocaleString()} GNF</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateInscription}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}