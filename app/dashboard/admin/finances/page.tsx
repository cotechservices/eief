// app/dashboard/admin/finances/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Loader2,
  Wallet, Users, CheckCircle, Clock, Search, Download,
  ArrowUpCircle, ArrowDownCircle, Filter, RefreshCw,
  GraduationCap, Bus, Utensils, BookOpen, Wrench, Zap, X
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"apercu" | "recettes" | "depenses" | "journal">("apercu");
  const [searchDepense, setSearchDepense] = useState("");
  const [filterMois, setFilterMois] = useState("");
  const [filterAnnee, setFilterAnnee] = useState(new Date().getFullYear().toString());
  const [newDepense, setNewDepense] = useState({
    categorie: "Fournitures de bureau",
    montant: "",
    description: "",
    dateDepense: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { if (activeTab === "depenses") fetchDepenses(); }, [activeTab, filterMois, filterAnnee]);

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
          <p className="text-gray-500 text-sm mt-1">Rentrées et sorties de caisse • Gestion financière</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchDashboard} className="p-2 border rounded-lg hover:bg-gray-50 transition" title="Rafraîchir">
            <RefreshCw className="w-4 h-4 text-gray-500" />
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
              { id: "apercu", label: " Aperçu" },
              { id: "recettes", label: " Recettes" },
              { id: "depenses", label: "📉 Dépenses" },
              { id: "journal", label: "📋 Journal" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
                          <span className="text-xs text-gray-500 w-16 shrink-0">{item.mois}</span>
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
                  <div className="flex gap-4 text-xs mt-2">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span> Recettes</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> Dépenses</span>
                  </div>
                </div>
              </div>

              {/* Mois en cours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs text-green-700 font-medium">Recettes ce mois</p>
                  <p className="text-xl font-bold text-green-800 mt-1">{stats.recettesMois?.toLocaleString() || 0} GNF</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs text-red-700 font-medium">Dépenses ce mois</p>
                  <p className="text-xl font-bold text-red-800 mt-1">{stats.depensesMois?.toLocaleString() || 0} GNF</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-xs text-orange-700 font-medium">Masse salariale ce mois</p>
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
                  <p className="text-gray-400 text-sm">Aucune recette enregistrée.</p>
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
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Élève</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Classe</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Montant</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {derniersPaiements?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.eleve}</td>
                          <td className="px-4 py-3 text-gray-500">{p.classe}</td>
                          <td className="px-4 py-3 text-right font-semibold">{p.montant?.toLocaleString()} GNF</td>
                          <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{p.type}</span></td>
                          <td className="px-4 py-3 text-gray-500">{p.date}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs flex items-center gap-1 ${p.statut === 'valide' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {p.statut === 'valide' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {p.statut === 'valide' ? 'Validé' : p.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!derniersPaiements?.length && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun paiement récent</td></tr>
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
                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les mois</option>
                    {MOIS_NOMS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                  </select>
                  <select
                    value={filterAnnee}
                    onChange={e => setFilterAnnee(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {["2024", "2025", "2026", "2027"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchDepense}
                      onChange={e => setSearchDepense(e.target.value)}
                      className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span className="text-xs text-gray-400 shrink-0">{cat.pourcentage}%</span>
                  </div>
                ))}
              </div>

              {/* Liste des dépenses */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Montant</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Saisi par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDepenses.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">{d.categorie}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{Number(d.montant).toLocaleString()} GNF</td>
                        <td className="px-4 py-3 text-gray-500">{d.description || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {d.date_depense ? new Date(d.date_depense).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{d.saisi_par_nom}</td>
                      </tr>
                    ))}
                    {filteredDepenses.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucune dépense trouvée</td></tr>
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
              <p className="text-sm text-gray-500">Résumé de tous les mouvements de caisse.</p>
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
                  <p className="text-xs text-gray-400">agents</p>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Élèves inscrits</h4>
                  <p className="text-3xl font-bold text-gray-900">{stats.nombreEleves}</p>
                  <p className="text-xs text-gray-400">élèves</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout Dépense */}
      {showDepenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Enregistrer une sortie de caisse</h2>
              <button onClick={() => setShowDepenseForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAjoutDepense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select
                  value={newDepense.categorie}
                  onChange={e => setNewDepense({ ...newDepense, categorie: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (GNF) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newDepense.montant}
                  onChange={e => setNewDepense({ ...newDepense, montant: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ex: 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newDepense.dateDepense}
                  onChange={e => setNewDepense({ ...newDepense, dateDepense: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Motif</label>
                <textarea
                  value={newDepense.description}
                  onChange={e => setNewDepense({ ...newDepense, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Détails de la dépense..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer la dépense
                </button>
                <button type="button" onClick={() => setShowDepenseForm(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50 transition">
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