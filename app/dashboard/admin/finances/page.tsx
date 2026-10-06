// app/dashboard/admin/finances/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Loader2,
  Wallet, Users, CheckCircle, Clock, Search, Download,
  ArrowUpCircle, ArrowDownCircle, Filter, RefreshCw,
  GraduationCap, Bus, Utensils, BookOpen, Wrench, Zap, X,
  Receipt, Printer, User, Eye, ChevronRight, ChevronLeft, ChevronDown, CircleUser, History, CreditCard, ShoppingCart
} from "lucide-react";
import RecuPaiement from "@/components/RecuPaiement";
import PaiementGlobalModal from "@/components/PaiementGlobalModal";

const CATEGORIES_DEPENSES = [
  "Salaires du personnel",
  "Fournitures de bureau",
  "Maintenance / Entretien",
  "Eau / Électricité",
  "Équipement / Matériel",
  "Transport / Carburant",
  "Communication / Internet",
  "Loyer / Foncier",
  "Santé / Médical",
  "Formation du personnel",
  "Divers / Autres",
];

const MOIS_NOMS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

interface Depense {
  id: number;
  categorie: string;
  montant: number;
  description: string;
  date_depense: string;
  saisi_par_nom: string;
  statut: string;
}

export default function FinancesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"apercu" | "recettes" | "depenses" | "journal" | "remises" | "recus" | "paiements_parents">("apercu");
  const [searchDepense, setSearchDepense] = useState("");
  const [filterMois, setFilterMois] = useState("");
  const [filterAnnee, setFilterAnnee] = useState(new Date().getFullYear().toString());

  // ⭐ États pour les remises familles nombreuses
  const [remisesParents, setRemisesParents] = useState<any[]>([]);
  const [loadingRemises, setLoadingRemises] = useState(false);
  const [filterMinEnfants, setFilterMinEnfants] = useState<number>(2);
  const [showRemiseModal, setShowRemiseModal] = useState(false);
  const [selectedParentRemise, setSelectedParentRemise] = useState<any | null>(null);
  const [montantRemise, setMontantRemise] = useState("");
  const [motifRemise, setMotifRemise] = useState("Remise famille nombreuse");
  const [submittingRemise, setSubmittingRemise] = useState(false);
  const [searchParentRemise, setSearchParentRemise] = useState("");

  // ⭐ États pour les reçus
  const [recusAdmin, setRecusAdmin] = useState<any[]>([]);
  const [loadingRecus, setLoadingRecus] = useState(false);
  const [selectedRecu, setSelectedRecu] = useState<any | null>(null);
  const [searchRecu, setSearchRecu] = useState("");
  const [filterRecuMois, setFilterRecuMois] = useState("");
  const [filterRecuAnnee, setFilterRecuAnnee] = useState(new Date().getFullYear().toString());

  // ⭐ États pour la gestion des paiements parents
  const [parentsFinances, setParentsFinances] = useState<any[]>([]);
  const [loadingParentsFinances, setLoadingParentsFinances] = useState(false);
  const [searchParentFinance, setSearchParentFinance] = useState("");
  const [selectedParentPaiement, setSelectedParentPaiement] = useState<any | null>(null);
  const [showPaiementGlobalModal, setShowPaiementGlobalModal] = useState(false);
  const [showDetailPaiementModal, setShowDetailPaiementModal] = useState(false);

  // Modal de paiement ciblé (par service ou par échéance)
  const [showTargetPaiementModal, setShowTargetPaiementModal] = useState(false);
  const [targetPaiementItem, setTargetPaiementItem] = useState<{
    type: string;
    title: string;
    eleveId?: number;
    preinscriptionId?: number;
    reinscriptionId?: number;
    montantSuggere: number;
  } | null>(null);

  const [targetMontant, setTargetMontant] = useState("");
  const [targetMode, setTargetMode] = useState("especes");
  const [targetRef, setTargetRef] = useState("");
  const [targetSubmitting, setTargetSubmitting] = useState(false);

  const [newDepense, setNewDepense] = useState({
    categorie: "Fournitures de bureau",
    montant: "",
    description: "",
    dateDepense: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => {
    if (activeTab === "depenses") fetchDepenses();
    if (activeTab === "remises") fetchRemises();
    if (activeTab === "recus") fetchRecusAdmin();
    if (activeTab === "paiements_parents") fetchParentsFinances();
  }, [activeTab, filterMois, filterAnnee, filterMinEnfants, filterRecuMois, filterRecuAnnee, searchParentFinance]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/comptable/dashboard");
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDepenses = async () => {
    try {
      let url = "/api/admin/finances/depenses?limit=200";
      if (filterMois) url += `&mois=${filterMois}`;
      if (filterAnnee) url += `&annee=${filterAnnee}`;
      const res = await fetch(url);
      if (res.ok) setDepenses(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchRemises = async () => {
    setLoadingRemises(true);
    try {
      const res = await fetch(`/api/admin/finances/remises?minEnfants=${filterMinEnfants}`);
      if (res.ok) {
        setRemisesParents(await res.json());
      }
    } catch (e) { console.error(e); }
    finally { setLoadingRemises(false); }
  };

  const fetchRecusAdmin = async () => {
    setLoadingRecus(true);
    try {
      let url = `/api/admin/recus?annee=${filterRecuAnnee}`;
      if (filterRecuMois) url += `&mois=${filterRecuMois}`;
      if (searchRecu) url += `&search=${encodeURIComponent(searchRecu)}`;
      const res = await fetch(url);
      if (res.ok) setRecusAdmin(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingRecus(false); }
  };

  // Dans finances/page.tsx, la fonction fetchParentsFinances
  const fetchParentsFinances = async () => {
    setLoadingParentsFinances(true);
    try {
      let url = "/api/admin/finances/parents";
      if (searchParentFinance.trim()) {
        url += `?search=${encodeURIComponent(searchParentFinance.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log("Parents finances reçus:", data); // ⭐ Vérifier les données
        setParentsFinances(data);
      } else {
        console.error("Erreur API:", await res.text());
      }
    } catch (e) {
      console.error("Erreur fetchParentsFinances:", e);
    }
    finally {
      setLoadingParentsFinances(false);
    }
  };

  const handleAjoutDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepense.montant || !newDepense.categorie) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/finances/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDepense)
      });
      if (res.ok) {
        setShowDepenseForm(false);
        setNewDepense({ categorie: "Fournitures de bureau", montant: "", description: "", dateDepense: new Date().toISOString().split('T')[0] });
        fetchDashboard();
        if (activeTab === "depenses") fetchDepenses();
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleApplyRemise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentRemise || !montantRemise) return;
    setSubmittingRemise(true);
    try {
      const res = await fetch("/api/admin/finances/remises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: selectedParentRemise.id,
          montant: Number(montantRemise),
          motif: motifRemise
        })
      });
      if (res.ok) {
        setShowRemiseModal(false);
        setMontantRemise("");
        setSelectedParentRemise(null);
        fetchRemises();
        fetchDashboard();
      }
    } catch (e) { console.error(e); }
    finally { setSubmittingRemise(false); }
  };

  const handleRecordTargetPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPaiementItem || !targetMontant) return;

    const montantNum = parseInt(targetMontant.replace(/\s/g, ''));
    if (!montantNum || montantNum <= 0) return;

    setTargetSubmitting(true);
    try {
      const payload: any = {
        montant: montantNum,
        typeFrais: targetPaiementItem.type,
        modePaiement: targetMode,
        referenceTransaction: targetRef || null,
        eleveId: targetPaiementItem.eleveId || null,
        preinscriptionId: targetPaiementItem.preinscriptionId || null,
        reinscriptionId: targetPaiementItem.reinscriptionId || null,
      };

      const res = await fetch("/api/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowTargetPaiementModal(false);
        setTargetPaiementItem(null);
        setTargetMontant("");
        setTargetRef("");
        fetchParentsFinances();
        fetchDashboard();
        if (data.recu) {
          setSelectedRecu(data.recu);
        }
      } else {
        alert(data.error || "Erreur lors du règlement");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur serveur: " + err.message);
    } finally {
      setTargetSubmitting(false);
    }
  };

  if (loading || !data) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  const { stats, derniersPaiements, categoriesRecettes, categoriesDepenses, evolutionRecettes } = data;
  const maxMontant = Math.max(...(evolutionRecettes?.map((r: any) => Math.max(r.recettes, r.depenses)) || [1]));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptabilité & Finances</h1>
          <p className="text-gray-900 text-sm mt-1">Rentrées et sorties de caisse • Gestion financière</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchDashboard} className="p-2 border rounded-lg hover:bg-gray-50 transition" title="Rafraîchir">
            <RefreshCw className="w-4 h-4 text-gray-900" />
          </button>
          <button
            onClick={() => {
              setActiveTab("paiements_parents");
              fetchParentsFinances();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-semibold shadow-sm"
          >
            <Wallet className="w-4 h-4" /> Gestion des paiements
          </button>
          <button
            onClick={() => setShowDepenseForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-sm"
          >
            <ArrowDownCircle className="w-4 h-4" /> Sortie de caisse
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 text-white">
          <div className="flex justify-between">
            <div>
              <p className="text-sm opacity-80">Total recettes</p>
              <p className="text-2xl font-bold mt-1">{stats.totalRecettes.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-0.5">GNF</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-60" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-5 text-white">
          <div className="flex justify-between">
            <div>
              <p className="text-sm opacity-80">Total dépenses</p>
              <p className="text-2xl font-bold mt-1">{stats.totalDepenses.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-0.5">GNF (salaires + autres)</p>
            </div>
            <TrendingDown className="w-8 h-8 opacity-60" />
          </div>
        </div>
        <div className={`bg-gradient-to-br ${stats.solde >= 0 ? 'from-blue-500 to-blue-700' : 'from-gray-700 to-gray-900'} rounded-xl p-5 text-white`}>
          <div className="flex justify-between">
            <div>
              <p className="text-sm opacity-80">Solde trésorerie</p>
              <p className="text-2xl font-bold mt-1">{stats.solde.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-0.5">GNF</p>
            </div>
            <Wallet className="w-8 h-8 opacity-60" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white">
          <div className="flex justify-between">
            <div>
              <p className="text-sm opacity-80">Taux recouvrement</p>
              <p className="text-2xl font-bold mt-1">{stats.tauxRecouvrement}%</p>
              <p className="text-xs opacity-70 mt-0.5">Impayés: {stats.encours.toLocaleString()} GNF</p>
            </div>
            <CheckCircle className="w-8 h-8 opacity-60" />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b px-6">
          <div className="flex flex-wrap gap-0">
            {[
              { id: "apercu", label: "📊 Aperçu" },
              { id: "paiements_parents", label: "💳 Paiements Parents" },
              { id: "recettes", label: "📈 Recettes" },
              { id: "depenses", label: "📉 Dépenses" },
              { id: "journal", label: "📋 Journal" },
              { id: "remises", label: "🏷️ Remises Familles" },
              { id: "recus", label: "🧾 Reçus" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-900 hover:text-gray-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Onglet Aperçu */}
          {activeTab === "apercu" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Évolution mensuelle */}
                <div className="border rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Évolution des recettes & dépenses</h3>
                  <div className="space-y-3">
                    {evolutionRecettes?.map((r: any, index: number) => (
                      <div key={r.mois || `mois-${index}`} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-900">
                          <span className="font-semibold">{r.num_mois ? `${MOIS_NOMS[r.num_mois - 1]} ${r.num_annee || ''}` : r.mois}</span>
                          <span>
                            Recettes: <strong className="text-green-600 font-bold">{(r.recettes || 0).toLocaleString()} GNF</strong> |
                            Dépenses: <strong className="text-red-600 font-bold">{(r.depenses || 0).toLocaleString()} GNF</strong>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="bg-green-500 h-full" style={{ width: `${((r.recettes || 0) / maxMontant) * 100}%` }} />
                          <div className="bg-red-500 h-full" style={{ width: `${((r.depenses || 0) / maxMontant) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ventilation par catégorie de recettes */}
                <div className="border rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Répartition des recettes</h3>
                  <div className="space-y-4">
                    {categoriesRecettes?.map((cat: any, index: number) => (
                      <div key={cat.name || cat.type_frais || `categorie-${index}`} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900 capitalize">{cat.name || cat.type_frais || "Autre"}</span>
                          <span className="font-bold text-gray-900">
                            {(cat.montant !== undefined ? cat.montant : (cat.total || 0)).toLocaleString()} GNF ({cat.pourcentage || 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${cat.pourcentage || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Derniers paiements 
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Dernières recettes encaisées</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Parent</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Élève</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Motif</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Montant</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Mode</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {derniersPaiements?.slice(0, 10).map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.parent_nom || "—"}</td>
                          <td className="px-4 py-3 text-gray-900">{p.enfant_prenom} {p.enfant_nom}</td>
                          <td className="px-4 py-3 text-gray-900 capitalize">{p.type_frais}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">{p.montant.toLocaleString()} GNF</td>
                          <td className="px-4 py-3 text-gray-900 capitalize">{p.mode_paiement?.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-gray-900">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>*/}
            </div>
          )}

          {/* ⭐ Onglet Paiements Parents */}
          {activeTab === "paiements_parents" && (
            <div className="space-y-6">
              {/* En-tête et recherche */}
              <div className="flex flex-wrap justify-between items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    Paiements & Réglements Parents
                  </h3>
                  <p className="text-xs text-gray-900 mt-0.5">
                    Consultez les détails financiers de chaque parent (scolarité, fournitures, cantine, transport) et enregistrez des règlements ciblés ou globaux.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" />
                    <input
                      type="text"
                      placeholder="Rechercher parent, élève, email..."
                      value={searchParentFinance}
                      onChange={(e) => setSearchParentFinance(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={fetchParentsFinances}
                    className="p-2 bg-white border rounded-lg hover:bg-gray-100 transition"
                    title="Actualiser"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-900" />
                  </button>
                </div>
              </div>

              {loadingParentsFinances ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <span className="ml-2 text-sm text-gray-900">Chargement des comptes parents...</span>
                </div>
              ) : parentsFinances.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border">
                  <User className="w-12 h-12 text-gray-900 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900">Aucun parent trouvé</h4>
                  <p className="text-xs text-gray-900 mt-1">Essayez de modifier votre recherche.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parentsFinances.map((p) => {
                    const solde = p.totaux.solde_restant || 0;
                    const aJour = solde === 0;

                    return (
                      <div
                        key={p.parent_id}
                        className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition space-y-4"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-base">
                                {p.prenom} {p.nom}
                              </h4>
                              {aJour ? (
                                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> À jour (0 GNF)
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-700 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Solde restant: {solde.toLocaleString()} GNF
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-900 mt-1">
                              <span>{p.email || "Non renseigné"}</span>
                              <span>{p.telephone || "Non renseigné"}</span>
                              {p.profession && <span>{p.profession}</span>}
                            </div>
                            {/* Liste des enfants */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.enfants_inscrits.map((e: any) => (
                                <span key={e.eleve_id} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium border border-blue-100">
                                  🎓 {e.prenom} {e.nom} ({e.classe_nom || 'Sans classe'})
                                </span>
                              ))}
                              {p.preinscriptions.map((pre: any) => (
                                <span key={pre.preinscription_id} className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium border border-yellow-100">
                                   {pre.prenom} {pre.nom} ({pre.classe_nom})
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Boutons d'actions de paiement */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setSelectedParentPaiement(p);
                                setShowPaiementGlobalModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Wallet className="w-4 h-4" /> Paiement Global
                            </button>
                            <button
                              onClick={() => {
                                setSelectedParentPaiement(p);
                                setShowDetailPaiementModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Eye className="w-4 h-4" /> Échéances & Services
                            </button>
                          </div>
                        </div>

                        {/* Grille de synthèse financière du parent */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gray-50 p-3 rounded-lg text-xs">
                          <div>
                            <span className="text-gray-900 block">Dépenses Brutes</span>
                            <span className="font-bold text-gray-900 text-sm">
                              {p.totaux.depenses_brutes.toLocaleString()} GNF
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Remise Accordée</span>
                            <span className="font-bold text-purple-600 text-sm">
                              -{p.totaux.remise_accordee.toLocaleString()} GNF
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Net à Payer</span>
                            <span className="font-bold text-blue-600 text-sm">
                              {p.totaux.total_net.toLocaleString()} GNF
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Montant Payé</span>
                            <span className="font-bold text-green-600 text-sm">
                              {p.totaux.total_paye.toLocaleString()} GNF
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Solde Restant</span>
                            <span className={`font-bold text-sm ${solde > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {solde.toLocaleString()} GNF
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Onglet Recettes */}
          {activeTab === "recettes" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Historique complet des recettes</h3>
              <p className="text-sm text-gray-900">Affichage de toutes les entrées de caisse validées.</p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Élève</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Catégorie</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Montant</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Mode</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {derniersPaiements?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{p.enfant_prenom} {p.enfant_nom}</td>
                        <td className="px-4 py-3 text-gray-900 capitalize">{p.type_frais}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{p.montant.toLocaleString()} GNF</td>
                        <td className="px-4 py-3 text-gray-900 capitalize">{p.mode_paiement?.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-gray-900">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Onglet Dépenses */}
          {activeTab === "depenses" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Historique des sorties de caisse</h3>
                <button onClick={() => setShowDepenseForm(true)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Nouvelle dépense
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Catégorie</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Montant</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Saisi par</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {depenses.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.categorie}</td>
                        <td className="px-4 py-3 text-gray-900">{d.description || "-"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{Number(d.montant).toLocaleString()} GNF</td>
                        <td className="px-4 py-3 text-gray-900">{d.saisi_par_nom || "Admin"}</td>
                        <td className="px-4 py-3 text-gray-900">{new Date(d.date_depense).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                    {depenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-900">Aucune dépense enregistrée</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Onglet Journal */}
          {activeTab === "journal" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Journal de caisse chronologique</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Libellé</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Entrée</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Sortie</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {derniersPaiements?.map((p: any, index: number) => (
                      <tr key={`p-${p.id || index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-green-600 font-semibold text-xs">RECETTE</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          Paiement {p.type_frais || 'N/A'} - {(p.enfant_prenom || "")} {(p.enfant_nom || "")} ({p.parent_nom || ''})
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">+{(p.montant || 0).toLocaleString()} GNF</td>
                        <td className="px-4 py-3 text-right text-gray-900">-</td>
                        <td className="px-4 py-3 text-gray-900">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : "N/A"}</td>
                      </tr>
                    ))}
                    {depenses?.map((d: any, index: number) => (
                      <tr key={`d-${d.id || index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-red-600 font-semibold text-xs">DÉPENSE</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{d.categorie || 'N/A'} - {d.description || ''}</td>
                        <td className="px-4 py-3 text-right text-gray-900">-</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">-{(Number(d.montant) || 0).toLocaleString()} GNF</td>
                        <td className="px-4 py-3 text-gray-900">{d.date_depense ? new Date(d.date_depense).toLocaleDateString('fr-FR') : "N/A"}</td>
                      </tr>
                    ))}
                    {depenses?.map((d) => (
                      <tr key={`d-${d.id}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-red-600 font-semibold text-xs">DÉPENSE</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{d.categorie} - {d.description || ''}</td>
                        <td className="px-4 py-3 text-right text-gray-900">-</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">-{Number(d.montant).toLocaleString()} GNF</td>
                        <td className="px-4 py-3 text-gray-900">{new Date(d.date_depense).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Onglet Remises Familles */}
          {activeTab === "remises" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div>
                  <h3 className="font-bold text-purple-900 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Remises Familles Nombreuses
                  </h3>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Déduction directe des frais pour les familles ayant plusieurs enfants inscrits à l'établissement.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-purple-800">Filtre d'enfants:</span>
                  <select
                    value={filterMinEnfants}
                    onChange={(e) => setFilterMinEnfants(Number(e.target.value))}
                    className="border border-purple-200 rounded-lg px-3 py-1.5 text-xs text-purple-900 bg-white focus:outline-none"
                  >
                    <option value={2}>2 enfants ou +</option>
                    <option value={3}>3 enfants ou +</option>
                    <option value={4}>4 enfants ou +</option>
                    <option value={1}>Tous les parents (1 ou +)</option>
                  </select>
                </div>
              </div>

              {loadingRemises ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Parent</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase">Nb Enfants</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Total Dépenses</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Remises Accordées</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Solde Restant</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {remisesParents.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{p.prenom} {p.nom}</div>
                            <div className="text-xs text-gray-900">{p.email || p.telephone}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-purple-600">
                            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full">
                              {p.nb_enfants} enfants
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{p.total_a_payer.toLocaleString()} GNF</td>
                          <td className="px-4 py-3 text-right font-bold text-purple-600">
                            {p.total_remises > 0 ? `-${p.total_remises.toLocaleString()} GNF` : "0 GNF"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{p.solde_restant.toLocaleString()} GNF</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedParentRemise(p);
                                setShowRemiseModal(true);
                              }}
                              className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition"
                            >
                              Accorder une remise
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Onglet Reçus */}
          {activeTab === "recus" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div>
                  <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    Impression & Historique des Reçus
                  </h3>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Imprimez ou consultez tous les reçus de paiement émis (scolarité, fournitures, transport, cantine).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Numéro reçu, parent, élève..."
                    value={searchRecu}
                    onChange={(e) => setSearchRecu(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-xs text-gray-900 bg-white"
                  />
                  <select
                    value={filterRecuAnnee}
                    onChange={(e) => setFilterRecuAnnee(e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-xs text-gray-900 bg-white"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              {loadingRecus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">N° Reçu</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Parent</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Élève</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Motif</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Montant</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recusAdmin.map((recu, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">{recu.numero_recu}</td>
                          <td className="px-4 py-3 text-gray-900">{recu.parent_nom || "—"}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{recu.enfant}</td>
                          <td className="px-4 py-3 text-gray-900 capitalize">{recu.type_frais}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600">{Number(recu.montant).toLocaleString()} GNF</td>
                          <td className="px-4 py-3 text-gray-900">{new Date(recu.date_paiement).toLocaleDateString('fr-FR')}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedRecu(recu)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 mx-auto"
                            >
                              <Printer className="w-3.5 h-3.5" /> Reçu PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ⭐ Modal Paiement Global Libre */}
      {showPaiementGlobalModal && selectedParentPaiement && (
        <PaiementGlobalModal
          isOpen={showPaiementGlobalModal}
          onClose={() => {
            setShowPaiementGlobalModal(false);
            setSelectedParentPaiement(null);
          }}
          onSuccess={() => {
            setShowPaiementGlobalModal(false);
            fetchParentsFinances();
            fetchDashboard();
          }}
          soldeRestant={selectedParentPaiement.totaux.solde_restant || 0}
          parentId={selectedParentPaiement.parent_id}
        />
      )}

      {/* ⭐ Modal Détail des Échéances & Services pour un Parent */}
      {showDetailPaiementModal && selectedParentPaiement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Détail Financier de : {selectedParentPaiement.prenom} {selectedParentPaiement.nom}
                </h2>
                <p className="text-xs text-gray-900 mt-0.5">
                  {selectedParentPaiement.telephone || "N/A"} • {selectedParentPaiement.email || "N/A"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailPaiementModal(false);
                  setSelectedParentPaiement(null);
                }}
                className="text-gray-900 hover:text-gray-900 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Récapitulatif du Solde */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-blue-100">
                <div>
                  <span className="text-xs text-gray-900 block">Dépenses Brutes</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedParentPaiement.totaux.depenses_brutes.toLocaleString()} GNF</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Remise Déduite</span>
                  <span className="font-bold text-purple-600 text-sm">-{selectedParentPaiement.totaux.remise_accordee.toLocaleString()} GNF</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Net à Payer</span>
                  <span className="font-bold text-blue-600 text-sm">{(selectedParentPaiement.totaux.total_net ?? (selectedParentPaiement.totaux.depenses_brutes - selectedParentPaiement.totaux.remise_accordee)).toLocaleString()} GNF</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Déjà Payé</span>
                  <span className="font-bold text-green-600 text-sm">{selectedParentPaiement.totaux.total_paye.toLocaleString()} GNF</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Reste à Payer</span>
                  <span className={`font-bold text-sm ${selectedParentPaiement.totaux.solde_restant > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedParentPaiement.totaux.solde_restant.toLocaleString()} GNF
                  </span>
                </div>
              </div>

              {/* 1. Échéances Scolarité */}
              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Scolarité & Échéances de Paiement
                  </h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Total Scolarité: {(selectedParentPaiement.services_breakdown?.scolarite?.total || 0).toLocaleString()} GNF
                    {(selectedParentPaiement.services_breakdown?.scolarite?.paye || 0) > 0 && (
                      <span className="ml-2 text-green-600">• Payé: {(selectedParentPaiement.services_breakdown?.scolarite?.paye || 0).toLocaleString()} GNF</span>
                    )}
                    {(selectedParentPaiement.services_breakdown?.scolarite?.reste || 0) > 0 && (
                      <span className="ml-2 text-red-600">• Reste: {(selectedParentPaiement.services_breakdown?.scolarite?.reste || 0).toLocaleString()} GNF</span>
                    )}
                  </span>
                </div>
                {selectedParentPaiement.echeances && selectedParentPaiement.echeances.length > 0 ? (
                  <div className="space-y-2">
                    {selectedParentPaiement.echeances.map((ech: any) => (
                      <div key={ech.id} className="p-3 bg-gray-50 rounded-lg flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 capitalize">
                            {ech.echeance?.replace('_', ' ')} ({ech.type || 'Scolarité'})
                            {ech.enfant_nom && <span className="text-blue-700 font-medium ml-1">• {ech.enfant_nom}</span>}
                          </p>
                          <p className="text-xs text-gray-900">
                            Montant: <span className="font-medium text-blue-600">{Number(ech.montant).toLocaleString()} GNF</span> •
                            Échéance: {ech.date_echeance ? new Date(ech.date_echeance).toLocaleDateString('fr-FR') : 'Non définie'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ech.statut === 'paye' ? 'bg-green-100 text-green-700' :
                            ech.statut === 'partiel' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {ech.statut === 'paye' ? 'Payé' : ech.statut === 'partiel' ? 'Partiel' : 'En attente'}
                          </span>
                          {ech.statut !== 'paye' && (
                            <button
                              onClick={() => {
                                // Calculer le reste dû pour cette échéance
                                // Si des paiements globaux ont été faits, déduire du montant de l'échéance
                                const montantEcheance = Number(ech.montant) || 0;
                                const montantPaye = Number(ech.montant_paye || 0);
                                const resteEcheance = Math.max(0, montantEcheance - montantPaye);
                                // Si reste échéance = 0 mais statut pas payé, utiliser solde_restant global
                                const soldeGlobal = selectedParentPaiement.totaux?.solde_restant || 0;
                                const montantSuggere = resteEcheance > 0 ? resteEcheance : Math.min(montantEcheance, soldeGlobal);
                                setTargetPaiementItem({
                                  type: "scolarite",
                                  title: `Règlement : ${ech.echeance?.replace('_', ' ')}`,
                                  preinscriptionId: ech.preinscription_id,
                                  reinscriptionId: ech.reinscription_id,
                                  montantSuggere
                                });
                                setTargetMontant(String(montantSuggere));
                                setShowTargetPaiementModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                            >
                              Régler
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-900 bg-gray-50 p-3 rounded-lg">
                    Aucune échéance spécifique enregistrée pour les enfants de cette famille.
                  </p>
                )}
              </div>

              {/* 2. Cantine */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b pb-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  Cantine Scolaire
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Frais Cantine</p>
                    <p className="text-xs text-gray-500">
                      Total: {(selectedParentPaiement.services_breakdown?.cantine?.total || 0).toLocaleString()} GNF
                      {(selectedParentPaiement.services_breakdown?.cantine?.paye || 0) > 0 && (
                        <span className="ml-2 text-green-600">• Payé: {(selectedParentPaiement.services_breakdown?.cantine?.paye || 0).toLocaleString()} GNF</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-orange-600">
                      Reste: {(selectedParentPaiement.services_breakdown?.cantine?.reste ?? selectedParentPaiement.services_breakdown?.cantine?.total ?? 0).toLocaleString()} GNF
                    </p>
                  </div>
                  {(selectedParentPaiement.services_breakdown?.cantine?.reste ?? selectedParentPaiement.services_breakdown?.cantine?.total ?? 0) > 0 ? (
                    <button
                      onClick={() => {
                        const m = selectedParentPaiement.services_breakdown?.cantine?.reste ?? selectedParentPaiement.services_breakdown?.cantine?.total ?? 0;
                        setTargetPaiementItem({
                          type: "cantine",
                          title: "Règlement Service Cantine",
                          montantSuggere: m
                        });
                        setTargetMontant(String(m));
                        setShowTargetPaiementModal(true);
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      Régler la Cantine
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">✓ Soldé</span>
                  )}
                </div>
              </div>

              {/* 3. Transport */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b pb-2">
                  <Bus className="w-5 h-5 text-blue-600" />
                  Transport Scolaire
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Frais Transport</p>
                    <p className="text-xs text-gray-500">
                      Total: {(selectedParentPaiement.services_breakdown?.transport?.total || 0).toLocaleString()} GNF
                      {(selectedParentPaiement.services_breakdown?.transport?.paye || 0) > 0 && (
                        <span className="ml-2 text-green-600">• Payé: {(selectedParentPaiement.services_breakdown?.transport?.paye || 0).toLocaleString()} GNF</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-blue-600">
                      Reste: {(selectedParentPaiement.services_breakdown?.transport?.reste ?? selectedParentPaiement.services_breakdown?.transport?.total ?? 0).toLocaleString()} GNF
                    </p>
                  </div>
                  {(selectedParentPaiement.services_breakdown?.transport?.reste ?? selectedParentPaiement.services_breakdown?.transport?.total ?? 0) > 0 ? (
                    <button
                      onClick={() => {
                        const m = selectedParentPaiement.services_breakdown?.transport?.reste ?? selectedParentPaiement.services_breakdown?.transport?.total ?? 0;
                        setTargetPaiementItem({
                          type: "transport",
                          title: "Règlement Service Transport",
                          montantSuggere: m
                        });
                        setTargetMontant(String(m));
                        setShowTargetPaiementModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      Régler le Transport
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">✓ Soldé</span>
                  )}
                </div>
              </div>

              {/* 4. Fournitures & Librairie */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b pb-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Fournitures Scolaires
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Fournitures Commandées</p>
                    <p className="text-xs text-gray-500">
                      Total: {(selectedParentPaiement.services_breakdown?.fournitures?.total || 0).toLocaleString()} GNF
                      {(selectedParentPaiement.services_breakdown?.fournitures?.paye || 0) > 0 && (
                        <span className="ml-2 text-green-600">• Payé: {(selectedParentPaiement.services_breakdown?.fournitures?.paye || 0).toLocaleString()} GNF</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-purple-600">
                      Reste: {(selectedParentPaiement.services_breakdown?.fournitures?.reste ?? selectedParentPaiement.services_breakdown?.fournitures?.total ?? 0).toLocaleString()} GNF
                    </p>
                  </div>
                  {(selectedParentPaiement.services_breakdown?.fournitures?.reste ?? selectedParentPaiement.services_breakdown?.fournitures?.total ?? 0) > 0 ? (
                    <button
                      onClick={() => {
                        const m = selectedParentPaiement.services_breakdown?.fournitures?.reste ?? selectedParentPaiement.services_breakdown?.fournitures?.total ?? 0;
                        setTargetPaiementItem({
                          type: "fournitures",
                          title: "Règlement Fournitures & Librairie",
                          montantSuggere: m
                        });
                        setTargetMontant(String(m));
                        setShowTargetPaiementModal(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      Régler les Fournitures
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">✓ Soldé</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Modal Formulaire de Règlement Ciblé */}
      {showTargetPaiementModal && targetPaiementItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{targetPaiementItem.title}</h3>
              <button
                onClick={() => {
                  setShowTargetPaiementModal(false);
                  setTargetPaiementItem(null);
                }}
                className="text-gray-900 hover:text-gray-900 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleRecordTargetPaiement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Montant à régler (GNF) *</label>
                <input
                  type="text"
                  required
                  value={targetMontant}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    setTargetMontant(formatted);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 font-bold focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Mode de paiement *</label>
                <select
                  value={targetMode}
                  onChange={(e) => setTargetMode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="especes">Espèces</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_money">MTN Money</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="carte">Carte Bancaire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Référence transaction / N° chèque</label>
                <input
                  type="text"
                  value={targetRef}
                  onChange={(e) => setTargetRef(e.target.value)}
                  placeholder="Ex: #OM-123456789"
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={targetSubmitting}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  {targetSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Valider & Générer Reçu
                </button>
                <button
                  type="button"
                  onClick={() => setShowTargetPaiementModal(false)}
                  className="flex-1 border py-2.5 rounded-lg text-sm text-gray-900 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reçu PDF / Imprimer */}
      {selectedRecu && (
        <RecuPaiement
          recu={selectedRecu}
          onClose={() => setSelectedRecu(null)}
          onDelete={() => {
            setSelectedRecu(null);
            fetchDashboard();
            fetchRecusAdmin();
            fetchParentsFinances();
          }}
        />
      )}

      {/* Modal Ajout Dépense */}
      {showDepenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Enregistrer une sortie de caisse</h2>
              <button onClick={() => setShowDepenseForm(false)} className="text-gray-900 hover:text-gray-900 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAjoutDepense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Catégorie *</label>
                <select
                  value={newDepense.categorie}
                  onChange={e => setNewDepense({ ...newDepense, categorie: e.target.value })}
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Montant (GNF) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newDepense.montant}
                  onChange={e => setNewDepense({ ...newDepense, montant: e.target.value })}
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Date</label>
                <input
                  type="date"
                  value={newDepense.dateDepense}
                  onChange={e => setNewDepense({ ...newDepense, dateDepense: e.target.value })}
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Description / Motif</label>
                <textarea
                  value={newDepense.description}
                  onChange={e => setNewDepense({ ...newDepense, description: e.target.value })}
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Détails de la dépense..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer la dépense
                </button>
                <button type="button" onClick={() => setShowDepenseForm(false)} className="text-gray-900 flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Accorder Remise Famille */}
      {showRemiseModal && selectedParentRemise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-black">Accorder une remise</h3>
                <p className="text-xs text-gray-900 mt-0.5">
                  Famille {selectedParentRemise.prenom} {selectedParentRemise.nom} ({selectedParentRemise.nb_enfants} enfants)
                </p>
              </div>
              <button onClick={() => setShowRemiseModal(false)} className="text-gray-900 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleApplyRemise} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-900">Total des dépenses:</span>
                  <span className="font-semibold text-black">{selectedParentRemise.total_a_payer?.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">Remises déjà accordées:</span>
                  <span className="font-semibold text-purple-600">-{selectedParentRemise.total_remises?.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 border-t pt-1">
                  <span>Solde restant:</span>
                  <span>{selectedParentRemise.solde_restant?.toLocaleString()} GNF</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Montant de la remise (GNF) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={selectedParentRemise.solde_restant}
                  value={montantRemise}
                  onChange={e => setMontantRemise(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="Ex: 500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Motif / Justification</label>
                <input
                  type="text"
                  value={motifRemise}
                  onChange={e => setMotifRemise(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Réduction Famille Nombreuse (3 enfants)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submittingRemise} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                  {submittingRemise && <Loader2 className="w-4 h-4 animate-spin" />}
                  Appliquer la remise
                </button>
                <button type="button" onClick={() => setShowRemiseModal(false)} className="flex-1 border py-2 rounded-lg text-sm text-black hover:bg-gray-50 transition">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}