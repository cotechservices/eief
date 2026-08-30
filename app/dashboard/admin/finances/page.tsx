// app/dashboard/admin/finances/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Loader2,
  Wallet, Users, CheckCircle, Clock, Search, Download,
  ArrowUpCircle, ArrowDownCircle, Filter, RefreshCw,
  GraduationCap, Bus, Utensils, BookOpen, Wrench, Zap, X,
  Receipt, Printer, User, Eye, ChevronRight, ChevronLeft, ChevronDown, CircleUser, History
} from "lucide-react";
import RecuPaiement from "@/components/RecuPaiement";

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
  const [activeTab, setActiveTab] = useState<"apercu" | "recettes" | "depenses" | "journal" | "remises" | "recus">("apercu");
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

  // États pour les reçus
  const [recusAdmin, setRecusAdmin] = useState<any[]>([]);
  const [loadingRecus, setLoadingRecus] = useState(false);
  const [selectedRecu, setSelectedRecu] = useState<any | null>(null);
  const [searchRecu, setSearchRecu] = useState("");
  const [filterRecuMois, setFilterRecuMois] = useState("");
  const [filterRecuAnnee, setFilterRecuAnnee] = useState(new Date().getFullYear().toString());

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
  }, [activeTab, filterMois, filterAnnee, filterMinEnfants, filterRecuMois, filterRecuAnnee]);

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

  const handleApplyRemise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentRemise || !montantRemise || parseFloat(montantRemise) <= 0) {
      alert("Veuillez sélectionner un parent et saisir un montant valide");
      return;
    }
    setSubmittingRemise(true);
    try {
      const res = await fetch("/api/admin/finances/remises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: selectedParentRemise.id,
          montant: parseFloat(montantRemise),
          motif: motifRemise
        })
      });

      if (res.ok) {
        setShowRemiseModal(false);
        setMontantRemise("");
        setSelectedParentRemise(null);
        fetchRemises();
        fetchDashboard();
        alert("Remise accordée avec succès !");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de l'application de la remise");
      }
    } catch (e) { console.error(e); }
    finally { setSubmittingRemise(false); }
  };

  const handleAjoutDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepense.categorie || !newDepense.montant) { alert("Catégorie et montant obligatoires"); return; }
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
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de l'ajout");
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const getIconForCategory = (name: string) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('scol') || n.includes('inscr')) return GraduationCap;
    if (n.includes('cant')) return Utensils;
    if (n.includes('transport')) return Bus;
    if (n.includes('biblioth')) return BookOpen;
    if (n.includes('elec') || n.includes('eau')) return Zap;
    if (n.includes('maint')) return Wrench;
    return DollarSign;
  };

  const filteredDepenses = depenses.filter(d =>
    !searchDepense ||
    d.categorie?.toLowerCase().includes(searchDepense.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchDepense.toLowerCase())
  );

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
        <div className="flex gap-3">
          <button onClick={fetchDashboard} className="p-2 border rounded-lg hover:bg-gray-50 transition" title="Rafraîchir">
            <RefreshCw className="w-4 h-4 text-gray-900" />
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
          <div className="flex gap-0">
            {[
              { id: "apercu", label: "📊 Aperçu" },
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
                  : 'border-transparent text-gray-900 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* === APERÇU === */}
          {activeTab === "apercu" && (
            <div className="space-y-6">
              {/* Évolution graphique */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Évolution financière (6 derniers mois)</h3>
                <div className="space-y-4">
                  {evolutionRecettes?.map((item: any, idx: number) => {
                    const pctRec = maxMontant > 0 ? (item.recettes / maxMontant) * 100 : 0;
                    const pctDep = maxMontant > 0 ? (item.depenses / maxMontant) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-gray-900 w-16 shrink-0">{item.mois}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                <div
                                  className="h-3 rounded-full bg-green-400 transition-all"
                                  style={{ width: `${pctRec}%` }}
                                />
                              </div>
                              <span className="text-xs text-green-600 font-medium w-28 shrink-0 text-right">{item.recettes.toLocaleString()} GNF</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-100 rounded-full h-3 relative overflow-hidden">
                                <div
                                  className="h-3 rounded-full bg-red-400 transition-all"
                                  style={{ width: `${pctDep}%` }}
                                />
                              </div>
                              <span className="text-xs text-red-600 font-medium w-28 shrink-0 text-right">{item.depenses.toLocaleString()} GNF</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-4 text-xs mt-2 text-gray-900">
                    <span className="flex items-center gap-1"><span className="text-gray-900 w-3 h-3 rounded-full bg-green-400 inline-block"></span> Recettes</span>
                    <span className="flex items-center gap-1"><span className="text-gray-900 w-3 h-3 rounded-full bg-red-400 inline-block"></span> Dépenses</span>
                  </div>
                </div>
              </div>

              {/* Mois en cours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs text-green-700 font-medium">Recettes de ce mois</p>
                  <p className="text-xl font-bold text-green-800 mt-1">{stats.recettesMois?.toLocaleString() || 0} GNF</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs text-red-700 font-medium">Dépenses de ce mois</p>
                  <p className="text-xl font-bold text-red-800 mt-1">{stats.depensesMois?.toLocaleString() || 0} GNF</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-xs text-orange-700 font-medium">Masse salariale de ce mois</p>
                  <p className="text-xl font-bold text-orange-800 mt-1">{stats.masseSalarialeMois?.toLocaleString() || 0} GNF</p>
                </div>
              </div>
            </div>
          )}

          {/* === RECETTES === */}
          {activeTab === "recettes" && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-700">Répartition des recettes par catégorie</h3>
              <div className="space-y-3">
                {categoriesRecettes?.length === 0 ? (
                  <p className="text-gray-900 text-sm">Aucune recette enregistrée.</p>
                ) : categoriesRecettes?.map((cat: any, idx: number) => {
                  const Icon = getIconForCategory(cat.name);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{cat.name}</span>
                          <span className="text-gray-900 font-semibold">{cat.montant.toLocaleString()} GNF ({cat.pourcentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${cat.pourcentage}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Derniers paiements */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">10 dernières rentrées de caisse</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Élève</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Classe</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Montant</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {derniersPaiements?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50 text-gray-900">
                          <td className="px-4 py-3 font-medium">{p.eleve}</td>
                          <td className="px-4 py-3 text-gray-900">{p.classe}</td>
                          <td className="px-4 py-3 text-right font-semibold">{p.montant?.toLocaleString()} GNF</td>
                          <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{p.type}</span></td>
                          <td className="px-4 py-3 text-gray-900">{p.date}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs flex items-center gap-1 ${p.statut === 'valide' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {p.statut === 'valide' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {p.statut === 'valide' ? 'Validé' : p.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!derniersPaiements?.length && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-900">Aucun paiement récent</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === DEPENSES === */}
          {activeTab === "depenses" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-3">
                  <select
                    value={filterMois}
                    onChange={e => setFilterMois(e.target.value)}
                    className="text-gray-900 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les mois</option>
                    {MOIS_NOMS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                  </select>
                  <select
                    value={filterAnnee}
                    onChange={e => setFilterAnnee(e.target.value)}
                    className="text-gray-900 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {["2024", "2025", "2026", "2027"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <div className="relative">
                    <Search className="text-gray-900 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchDepense}
                      onChange={e => setSearchDepense(e.target.value)}
                      className="text-gray-900 pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowDepenseForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter une dépense
                </button>
              </div>

              {/* Stats dépenses par catégorie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {categoriesDepenses?.slice(0, 6).map((cat: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-red-50 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{cat.name}</span>
                        <span className="font-semibold text-red-700">{cat.montant?.toLocaleString()} GNF</span>
                      </div>
                      <div className="w-full bg-red-100 rounded-full h-1.5">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${cat.pourcentage}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-900 shrink-0">{cat.pourcentage}%</span>
                  </div>
                ))}
              </div>

              {/* Liste des dépenses */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Catégorie</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Montant</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Saisi par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDepenses.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">{d.categorie}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{Number(d.montant).toLocaleString()} GNF</td>
                        <td className="px-4 py-3 text-gray-900">{d.description || '-'}</td>
                        <td className="px-4 py-3 text-gray-900">
                          {d.date_depense ? new Date(d.date_depense).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{d.saisi_par_nom}</td>
                      </tr>
                    ))}
                    {filteredDepenses.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-900">Aucune dépense trouvée</td></tr>
                    )}
                  </tbody>
                  {filteredDepenses.length > 0 && (
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td className="px-4 py-3 font-semibold">Total</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">
                          {filteredDepenses.reduce((acc, d) => acc + Number(d.montant), 0).toLocaleString()} GNF
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
          {/* === JOURNAL === */}
          {activeTab === "journal" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Journal de caisse (Recettes + Dépenses)</h3>
              <p className="text-sm text-gray-900">Résumé de tous les mouvements de caisse.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Total entrées</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{stats.totalRecettes?.toLocaleString()} GNF</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">Total sorties</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800">{stats.totalDepenses?.toLocaleString()} GNF</p>
                </div>
                <div className={`${stats.solde >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'} border rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className={`w-5 h-5 ${stats.solde >= 0 ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={`font-medium ${stats.solde >= 0 ? 'text-blue-700' : 'text-gray-700'}`}>Solde net</span>
                  </div>
                  <p className={`text-2xl font-bold ${stats.solde >= 0 ? 'text-blue-800' : 'text-gray-800'}`}>{stats.solde?.toLocaleString()} GNF</p>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Encours impayés : {stats.encours?.toLocaleString()} GNF</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">Paiements en attente de validation</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Personnel actif</h4>
                  <p className="text-3xl font-bold text-gray-900">{stats.nombrePersonnel}</p>
                  <p className="text-xs text-gray-900">agents</p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Élèves inscrits</h4>
                  <p className="text-3xl font-bold text-gray-900">{stats.nombreEleves}</p>
                  <p className="text-xs text-gray-900">élèves</p>
                </div>
              </div>
            </div>
          )}
          {/* === REMISES FAMILLES NOMBREUSES === */}
          {activeTab === "remises" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div>
                  <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Gestion des Remises Familles Nombreuses
                  </h3>
                  <p className="text-xs text-indigo-700 mt-1">
                    Accordez des réductions aux parents qui ont plusieurs enfants inscrits au sein de l'établissement.
                  </p>
                </div>
                <button
                  onClick={fetchRemises}
                  disabled={loadingRemises}
                  className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRemises ? "animate-spin" : ""}`} />
                  Rafraîchir
                </button>
              </div>

              {/* Filtres par nombre d'enfants et barre de recherche */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-gray-600">Filtrer par :</span>
                  {[
                    { count: 2, label: "👨‍👩‍👧‍👦 2 enfants et +" },
                    { count: 3, label: "⭐ 3 enfants et +" },
                    { count: 4, label: "👑 4+ enfants" },
                    { count: 1, label: "Tous les parents" },
                  ].map((f) => (
                    <button
                      key={f.count}
                      onClick={() => setFilterMinEnfants(f.count)}
                      className={`px-3 py-1.5 rounded-lg border transition ${filterMinEnfants === f.count
                        ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                  <input
                    type="text"
                    placeholder="Rechercher un parent par nom, prénom ou email..."
                    value={searchParentRemise}
                    onChange={(e) => setSearchParentRemise(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {loadingRemises ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        <th className="p-4">Parent</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4 text-center">Enfants inscrits</th>
                        <th className="p-4 text-right">Scolarité totale</th>
                        <th className="p-4 text-right">Remises accordées</th>
                        <th className="p-4 text-right">Solde restant</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {remisesParents
                        .filter(p => !searchParentRemise || `${p.prenom} ${p.nom} ${p.email}`.toLowerCase().includes(searchParentRemise.toLowerCase()))
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 font-semibold text-black">
                              {p.prenom} {p.nom}
                            </td>
                            <td className="p-4 text-xs text-gray-600">
                              <div>{p.email}</div>
                              <div className="text-gray-900">{p.telephone}</div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.nb_enfants >= 3
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : p.nb_enfants === 2
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                {p.nb_enfants} {p.nb_enfants > 1 ? 'enfants' : 'enfant'}
                              </span>
                            </td>
                            <td className="p-4 text-right font-medium text-gray-800">
                              {Number(p.total_a_payer).toLocaleString()} GNF
                            </td>
                            <td className="p-4 text-right font-bold text-indigo-600">
                              {Number(p.total_remises) > 0 ? `-${Number(p.total_remises).toLocaleString()} GNF` : '0 GNF'}
                            </td>
                            <td className="p-4 text-right font-bold text-red-600">
                              {Number(p.solde_restant).toLocaleString()} GNF
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedParentRemise(p);
                                  setMontantRemise("");
                                  setMotifRemise(`Remise famille nombreuse (${p.nb_enfants} enfants)`);
                                  setShowRemiseModal(true);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition flex items-center gap-1.5 mx-auto"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Accorder une remise
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {remisesParents.length === 0 && (
                    <div className="p-8 text-center text-gray-900 text-sm">
                      Aucun parent trouvé.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* === REÇUS === */}
          {activeTab === "recus" && (
            <div className="space-y-6">
              {/* En-tête avec lien vers la nouvelle vue */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    Reçus par Parent
                  </h3>
                  <p className="text-sm text-gray-900 mt-1">
                    Consultez tous les reçus regroupés par famille
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/finances/recus"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Voir tous les parents
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mini résumé avec accès rapide */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nouvelle vue disponible</p>
                      <p className="font-semibold text-gray-800">
                        Consultez tous les reçus regroupés par parent/famille
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/admin/finances/recus"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm whitespace-nowrap shadow-md"
                  >
                    <Receipt className="w-4 h-4" />
                    Accéder aux reçus par parent
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Derniers reçus (aperçu) */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">📋 Derniers reçus émis</h4>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">N° Reçu</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Parent</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Élève</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 uppercase">Montant</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recusAdmin.slice(0, 5).map((recu, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">
                            <span className="font-mono text-xs px-2 py-1 rounded">
                              {recu.numero_recu}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{recu.parent_nom || '—'}</td>
                          <td className="px-4 py-3 text-gray-900">{recu.enfant}</td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">
                            {Number(recu.montant).toLocaleString()} GNF
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {recu.date_paiement ? new Date(recu.date_paiement).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-900">
                            <button
                              onClick={() => {
                                setSelectedRecu({
                                  ...recu,
                                  source: recu.source || 'paiement'
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              <Printer className="w-4 h-4 inline mr-1" />
                              Imprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                      {recusAdmin.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-900">
                            Aucun reçu disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Reçu */}
      {selectedRecu && (
        <RecuPaiement
          recu={selectedRecu}
          onClose={() => setSelectedRecu(null)}
        />
      )}

      {/* Modal Ajout Dépense */}
      {showDepenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Enregistrer une sortie de caisse</h2>
              <button onClick={() => setShowDepenseForm(false)} className="text-gray-900 hover:text-gray-600 text-2xl">&times;</button>
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

      {/* Modal Accorder une Remise */}
      {showRemiseModal && selectedParentRemise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center bg-indigo-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-indigo-900">Accorder une remise</h2>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Parent: <span className="font-semibold">{selectedParentRemise.prenom} {selectedParentRemise.nom}</span> ({selectedParentRemise.nb_enfants} enfants)
                </p>
              </div>
              <button onClick={() => setShowRemiseModal(false)} className="text-gray-900 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleApplyRemise} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Scolarité totale :</span>
                  <span className="font-semibold text-gray-900">{Number(selectedParentRemise.total_a_payer).toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between">
                  <span>Remises déjà accordées :</span>
                  <span className="font-semibold text-indigo-600">-{Number(selectedParentRemise.total_remises).toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-gray-900">
                  <span>Solde restant actuel :</span>
                  <span className="text-red-600">{Number(selectedParentRemise.solde_restant).toLocaleString()} GNF</span>
                </div>
              </div>

              {/* Shortcuts pour le montant */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Suggestions de pourcentage</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((pct) => {
                    const montantSuggere = Math.round((Number(selectedParentRemise.total_a_payer) * pct) / 100);
                    return (
                      <button
                        type="button"
                        key={pct}
                        onClick={() => setMontantRemise(montantSuggere.toString())}
                        className="py-1.5 px-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition text-center"
                      >
                        {pct}% ({Math.round(montantSuggere / 1000)}k)
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant de la remise (GNF) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedParentRemise.solde_restant}
                  value={montantRemise}
                  onChange={e => setMontantRemise(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="Ex: 1000000"
                />
                {montantRemise && parseFloat(montantRemise) > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Nouveau solde restant : {Math.max(0, selectedParentRemise.solde_restant - parseFloat(montantRemise)).toLocaleString()} GNF
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif / Description</label>
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