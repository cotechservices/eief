// app/dashboard/admin/finances/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Loader2,
  Wallet, Users, CheckCircle, Clock, Search, Download,
  ArrowUpCircle, ArrowDownCircle, Filter, RefreshCw,
  GraduationCap, Bus, Utensils, BookOpen, Wrench, Zap, X,
  Receipt, Printer, User, Eye, ChevronRight, ChevronLeft, ChevronDown, CircleUser, History, CreditCard, ShoppingCart,
  AlertCircle, Banknote, ShoppingBag, Layers, Package, FileText
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

export const formatTypeFrais = (type?: string) => {
  if (!type) return "N/A";
  const t = type.toLowerCase().trim();
  if (t === "inscription") return "Inscription services optionnels";
  if (t === "reinscription") return "Réinscription services optionnels";
  if (t === "scolarite" || t === "mensualite") return "Scolarité";
  if (t === "cantine") return "Cantine";
  if (t === "transport") return "Transport";
  if (t === "fournitures" || t === "librairie") return "Fournitures";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

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

  // États remises
  const [remisesParents, setRemisesParents] = useState<any[]>([]);
  const [loadingRemises, setLoadingRemises] = useState(false);
  const [filterMinEnfants, setFilterMinEnfants] = useState<number>(2);
  const [showRemiseModal, setShowRemiseModal] = useState(false);
  const [selectedParentRemise, setSelectedParentRemise] = useState<any | null>(null);
  const [montantRemise, setMontantRemise] = useState("");
  const [motifRemise, setMotifRemise] = useState("Remise famille nombreuse");
  const [submittingRemise, setSubmittingRemise] = useState(false);

  // États reçus
  const [recusAdmin, setRecusAdmin] = useState<any[]>([]);
  const [loadingRecus, setLoadingRecus] = useState(false);
  const [selectedRecu, setSelectedRecu] = useState<any | null>(null);
  const [searchRecu, setSearchRecu] = useState("");
  const [filterRecuMois, setFilterRecuMois] = useState("");
  const [filterRecuAnnee, setFilterRecuAnnee] = useState(new Date().getFullYear().toString());

  // États paiements parents
  const [parentsFinances, setParentsFinances] = useState<any[]>([]);
  const [loadingParentsFinances, setLoadingParentsFinances] = useState(false);
  const [searchParentFinance, setSearchParentFinance] = useState("");
  const [selectedParentPaiement, setSelectedParentPaiement] = useState<any | null>(null);
  const [showPaiementGlobalModal, setShowPaiementGlobalModal] = useState(false);
  const [showDetailPaiementModal, setShowDetailPaiementModal] = useState(false);

  // Modal paiement ciblé
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

  // ⭐ Synthèse financière détaillée
  const [financesDetails, setFinancesDetails] = useState<any>(null);
  const [salaires, setSalaires] = useState<any[]>([]);
  const [loadingFinancesDetails, setLoadingFinancesDetails] = useState(false);

  useEffect(() => { 
    fetchDashboard(); 
    fetchFinancesDetails(); 
    fetchRemises(); // Chargé au démarrage pour alimenter la carte Remises
  }, []);
  
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

  const fetchFinancesDetails = async () => {
    setLoadingFinancesDetails(true);
    try {
      const moisCourant = new Date().getMonth() + 1;
      const anneeCourante = new Date().getFullYear();

      const [statsRes, salairesRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch(`/api/admin/salaires?month=${moisCourant}&year=${anneeCourante}`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setFinancesDetails(statsData);
      }
      if (salairesRes.ok) {
        const salairesData = await salairesRes.json();
        setSalaires(Array.isArray(salairesData) ? salairesData : []);
      }
    } catch (e) {
      console.error("Erreur fetchFinancesDetails:", e);
    } finally {
      setLoadingFinancesDetails(false);
    }
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
      if (res.ok) setRemisesParents(await res.json());
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

  const fetchParentsFinances = async () => {
    setLoadingParentsFinances(true);
    try {
      let url = "/api/admin/finances/parents";
      if (searchParentFinance.trim()) url += `?search=${encodeURIComponent(searchParentFinance.trim())}`;
      const res = await fetch(url);
      if (res.ok) setParentsFinances(await res.json());
    } catch (e) { console.error("Erreur fetchParentsFinances:", e); }
    finally { setLoadingParentsFinances(false); }
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
        fetchFinancesDetails();
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
        body: JSON.stringify({ parentId: selectedParentRemise.id, montant: Number(montantRemise), motif: motifRemise })
      });
      if (res.ok) {
        setShowRemiseModal(false);
        setMontantRemise("");
        setSelectedParentRemise(null);
        fetchRemises();
        fetchDashboard();
        fetchFinancesDetails();
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
        fetchFinancesDetails();
        if (data.recu) setSelectedRecu(data.recu);
      } else {
        alert(data.error || "Erreur lors du règlement");
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur serveur: " + err.message);
    } finally { setTargetSubmitting(false); }
  };

  if (loading || !data) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  const { stats, derniersPaiements, categoriesRecettes, categoriesDepenses, evolutionRecettes } = data;
  const maxMontant = Math.max(...(evolutionRecettes?.map((r: any) => Math.max(r.recettes, r.depenses)) || [1]));

  // ============================================================
  // CALCULS ULTRA-ROBUSTES : Synthèse financière détaillée
  // ============================================================
  const finances = financesDetails?.financieres || {};

  // Normalisation sans accents et minuscule pour les correspondances
  const normalizeText = (str: string) =>
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  // Liste fusionnée des catégories de recettes (depuis stats OU dashboard)
  const categoriesList = (finances.categoriesRecettes && finances.categoriesRecettes.length > 0)
    ? finances.categoriesRecettes
    : (data?.categoriesRecettes || []);

  // Fonction utilitaire robuste pour récupérer un montant de recette par catégorie
  const getCategorieMontant = (key: "cantine" | "transport" | "fournitures" | "librairie" | "scolarite" | "inscription" | "reinscription") => {
    const match = categoriesList.find((c: any) => {
      const n = normalizeText(c.name || c.type_frais || "");
      switch (key) {
        case "cantine":
          return n.includes("cantine");
        case "transport":
          return n.includes("transport");
        case "fournitures":
          return n.includes("fourniture");
        case "librairie":
          return n.includes("librairie");
        case "scolarite":
          return n.includes("scolarite") || n.includes("mensualite");
        case "inscription":
          return n.startsWith("inscription") || (n.includes("inscription") && !n.includes("reinscription"));
        case "reinscription":
          return n.startsWith("reinscription") || n.includes("reinscription");
        default:
          return false;
      }
    });
    return Number(match?.montant) || 0;
  };

  // ----- CANTINE -----
  const totalCantine = Number(finances.totalCantine) || 0;
  const cantineRecette = getCategorieMontant("cantine");
  const cantineReste = Math.max(0, totalCantine - cantineRecette);

  // ----- TRANSPORT -----
  const totalTransport = Number(finances.totalTransport) || 0;
  const transportRecette = getCategorieMontant("transport");
  const transportReste = Math.max(0, totalTransport - transportRecette);

  // ----- FOURNITURES INSCRIPTION (obligatoires) -----
  const totalFournituresInscription = Number(finances.totalFournituresObligatoires)
    || Number(finances.totalFournitures)
    || 0;
  const fournituresInscriptionRecette = Number(finances.recettesFournitures)
    || getCategorieMontant("fournitures");
  const fournituresInscriptionReste = Math.max(0, totalFournituresInscription - fournituresInscriptionRecette);

  // ----- LIBRAIRIE (ventes indépendantes) -----
  const totalLibrairieVentes = Number(finances.totalLibrairieVentes) || 0;
  const librairieRecette = Number(finances.recettesLibrairie) || getCategorieMontant("librairie");
  const librairieReste = Math.max(0, totalLibrairieVentes - librairieRecette);

  // ----- SCOLARITÉ -----
  const totalScolarite = Number(finances.totalScolarite)
    || Number(finances.totalScolariteEleves)
    || 0;
  const scolariteRecette = getCategorieMontant("scolarite");
  const scolariteReste = Math.max(0, totalScolarite - scolariteRecette);

  // ----- INSCRIPTIONS (Frais / Services optionnels à l'inscription) -----
  const totalInscriptions = Number(finances.totalAPayerInscription)
    || Number(finances.totalInscription)
    || 0;
  const inscriptionsRecette = getCategorieMontant("inscription");
  const inscriptionsReste = Math.max(0, totalInscriptions - inscriptionsRecette);

  // ----- REMISES FAMILLES -----
  const totalRemises = Number(finances.totalRemises) || 0;
  const totalRemisesFamilles = totalRemises;
  const nbFamillesRemises = remisesParents.length;
  const nbFamillesBeneficiaires = remisesParents.filter((r: any) => Number(r.total_remises || 0) > 0).length;

  // ----- SALAIRES DU PERSONNEL -----
  const totalSalairesPaye = salaires
    .filter((s: any) => s.statut === "paye")
    .reduce((acc: number, s: any) => acc + Number(s.montant_paye || 0), 0);
  const totalSalairesEnAttente = salaires
    .filter((s: any) => s.statut !== "paye")
    .reduce((acc: number, s: any) => acc + Number(s.salaire_total || 0), 0);
  const totalSalairesGlobal = totalSalairesPaye + totalSalairesEnAttente;
  const tauxPaiementSalaires = totalSalairesGlobal > 0
    ? Math.round((totalSalairesPaye / totalSalairesGlobal) * 100)
    : 0;

  // ----- TOTAL PAYÉ GLOBAL & COHÉRENCE DU BUDGET -----
  const totalPayeGlobal = Number(finances.totalPaye) || Number(data?.stats?.totalRecettes) || 0;

  // Total à payer brut théorique (somme des postes)
  const totalBrutTheorique = totalCantine + totalTransport + totalFournituresInscription + totalScolarite + totalLibrairieVentes + totalInscriptions;
  const totalAPayer = Number(finances.totalAPayer) > 0
    ? Number(finances.totalAPayer)
    : Math.max(0, totalBrutTheorique - totalRemises);

  // Reste à payer global cohérent
  const resteAPayer = Number(finances.soldeRestant) > 0
    ? Number(finances.soldeRestant)
    : Math.max(0, totalAPayer - totalPayeGlobal);

  // Helper d'affichage sécurisé
  const formatMontant = (val: number, loading: boolean = false) => {
    if (loading) return "...";
    return (val || 0).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptabilité & Finances</h1>
          <p className="text-gray-900 text-sm mt-1">Rentrées et sorties de caisse • Gestion financière</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { fetchDashboard(); fetchFinancesDetails(); }}
            className="p-2 border rounded-lg hover:bg-gray-50 transition"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 text-gray-900 ${loadingFinancesDetails ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setActiveTab("paiements_parents"); fetchParentsFinances(); }}
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

      {/* ⭐ SYNTHÈSE FINANCIÈRE DÉTAILLÉE */}
      <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Synthèse financière détaillée
          </h2>
          <div className="flex items-center gap-3">
            {loadingFinancesDetails && (
              <span className="text-xs text-indigo-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Chargement...
              </span>
            )}
            <button
              onClick={fetchFinancesDetails}
              disabled={loadingFinancesDetails}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFinancesDetails ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* 1. TOTAL À PAYER */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border-l-4 border-blue-600 shadow-sm">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Total à payer
            </p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {formatMontant(totalAPayer, loadingFinancesDetails && !financesDetails)} <span className="text-xs font-normal">GNF</span>
            </p>
            {totalRemises > 0 ? (
              <p className="text-xs text-blue-600 mt-0.5">
                dont remises : -{totalRemises.toLocaleString()} GNF
              </p>
            ) : (
              <p className="text-xs text-blue-600 mt-0.5">Toutes prestations confondues</p>
            )}
          </div>

          {/* 2. RESTE À PAYER */}
          <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-4 border-l-4 border-red-600 shadow-sm">
            <p className="text-xs font-semibold text-red-800 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Reste à payer
            </p>
            <p className="text-xl font-bold text-red-700 mt-1">
              {formatMontant(resteAPayer, loadingFinancesDetails && !financesDetails)} <span className="text-xs font-normal">GNF</span>
            </p>
            <p className="text-xs text-red-600 mt-0.5">Solde global en attente</p>
          </div>

          {/* 3. DÉJÀ PAYÉ */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-l-4 border-green-600 shadow-sm">
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Montant déjà payé
            </p>
            <p className="text-xl font-bold text-green-700 mt-1">
              {formatMontant(totalPayeGlobal, loadingFinancesDetails && !financesDetails)} <span className="text-xs font-normal">GNF</span>
            </p>
            {totalAPayer > 0 ? (
              <p className="text-xs text-green-600 mt-0.5">
                Taux : {Math.round((totalPayeGlobal / totalAPayer) * 100)}%
              </p>
            ) : (
              <p className="text-xs text-green-600 mt-0.5">Aucun montant attendu</p>
            )}
          </div>

          {/* 4. CANTINE */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-l-4 border-orange-500 shadow-sm">
            <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide flex items-center gap-1 mb-2">
              <Utensils className="w-3.5 h-3.5" /> Cantine
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-orange-600 uppercase font-semibold">Recettes</p>
                <p className="text-sm font-bold text-orange-700">
                  {formatMontant(cantineRecette, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-orange-500">GNF</p>
              </div>
              <div>
                <p className="text-[10px] text-red-600 uppercase font-semibold">Reste</p>
                <p className="text-sm font-bold text-red-700">
                  {formatMontant(cantineReste, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-red-500">GNF</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-orange-200">
              Total attendu : <span className="font-semibold text-gray-700">{totalCantine.toLocaleString()} GNF</span>
            </p>
          </div>

          {/* 5. TRANSPORT */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 border-l-4 border-purple-500 shadow-sm">
            <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide flex items-center gap-1 mb-2">
              <Bus className="w-3.5 h-3.5" /> Transport
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-purple-600 uppercase font-semibold">Recettes</p>
                <p className="text-sm font-bold text-purple-700">
                  {formatMontant(transportRecette, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-purple-500">GNF</p>
              </div>
              <div>
                <p className="text-[10px] text-red-600 uppercase font-semibold">Reste</p>
                <p className="text-sm font-bold text-red-700">
                  {formatMontant(transportReste, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-red-500">GNF</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-purple-200">
              Total attendu : <span className="font-semibold text-gray-700">{totalTransport.toLocaleString()} GNF</span>
            </p>
          </div>

          {/* 6. FOURNITURES INSCRIPTION (obligatoires) */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 border-l-4 border-yellow-500 shadow-sm">
            <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" /> Fournitures Inscription
            </p>
            <p className="text-[9px] text-yellow-700 italic mb-2">
              Frais liés à la scolarité (inscription / réinscription)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-yellow-600 uppercase font-semibold">Recettes</p>
                <p className="text-sm font-bold text-yellow-700">
                  {formatMontant(fournituresInscriptionRecette, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-yellow-500">GNF</p>
              </div>
              <div>
                <p className="text-[10px] text-red-600 uppercase font-semibold">Reste</p>
                <p className="text-sm font-bold text-red-700">
                  {formatMontant(fournituresInscriptionReste, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-red-500">GNF</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-yellow-200">
              Total attendu : <span className="font-semibold text-gray-700">{totalFournituresInscription.toLocaleString()} GNF</span>
            </p>
          </div>

          {/* 7. LIBRAIRIE (ventes indépendantes) */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-4 border-l-4 border-pink-500 shadow-sm">
            <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Librairie (ventes)
            </p>
            <p className="text-[9px] text-pink-700 italic mb-2">
              Commandes indépendantes (hors scolarité)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-pink-600 uppercase font-semibold">Recettes</p>
                <p className="text-sm font-bold text-pink-700">
                  {formatMontant(librairieRecette, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-pink-500">GNF</p>
              </div>
              <div>
                <p className="text-[10px] text-red-600 uppercase font-semibold">Reste</p>
                <p className="text-sm font-bold text-red-700">
                  {formatMontant(librairieReste, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-red-500">GNF</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-pink-200">
              Total attendu : <span className="font-semibold text-gray-700">{totalLibrairieVentes.toLocaleString()} GNF</span>
            </p>
          </div>

          {/* 8. SCOLARITÉ (Nouveau) */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-100 rounded-xl p-4 border-l-4 border-teal-500 shadow-sm">
            <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide flex items-center gap-1 mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> Scolarité
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-teal-600 uppercase font-semibold">Recettes</p>
                <p className="text-sm font-bold text-teal-700">
                  {formatMontant(scolariteRecette, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-teal-500">GNF</p>
              </div>
              <div>
                <p className="text-[10px] text-red-600 uppercase font-semibold">Reste</p>
                <p className="text-sm font-bold text-red-700">
                  {formatMontant(scolariteReste, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-red-500">GNF</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-teal-200">
              Total attendu : <span className="font-semibold text-gray-700">{totalScolarite.toLocaleString()} GNF</span>
            </p>
          </div>

          {/* 9. SALAIRES (2 colonnes) */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-4 border-l-4 border-slate-600 shadow-sm sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Salaires du personnel
              </p>
              <p className="text-[10px] text-gray-500">
                Masse totale : <span className="font-bold text-gray-700">{totalSalairesGlobal.toLocaleString()} GNF</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-2.5 border border-green-200">
                <p className="text-[10px] text-green-600 uppercase font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Déjà payés
                </p>
                <p className="text-sm font-bold text-green-700 mt-0.5">
                  {formatMontant(totalSalairesPaye, loadingFinancesDetails)}
                </p>
                <p className="text-[10px] text-green-500">GNF</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-orange-200">
                <p className="text-[10px] text-orange-600 uppercase font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> En attente
                </p>
                <p className="text-sm font-bold text-orange-700 mt-0.5">
                  {formatMontant(totalSalairesEnAttente, loadingFinancesDetails)}
                </p>
                <p className="text-[10px] text-orange-500">GNF</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-indigo-200">
                <p className="text-[10px] text-indigo-600 uppercase font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Taux payé
                </p>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">
                  {loadingFinancesDetails && salaires.length === 0 ? "..." : `${tauxPaiementSalaires}%`}
                </p>
                <p className="text-[10px] text-indigo-500">{salaires.length} agent(s)</p>
              </div>
            </div>
          </div>

          {/* 10. INSCRIPTIONS (Nouveau) */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl p-4 border-l-4 border-cyan-500 shadow-sm">
            <p className="text-xs font-semibold text-cyan-800 uppercase tracking-wide flex items-center gap-1 mb-2">
              <FileText className="w-3.5 h-3.5" /> Inscriptions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-cyan-600 uppercase font-semibold">Recettes</p>
                <p className="text-sm font-bold text-cyan-700">
                  {formatMontant(inscriptionsRecette, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-cyan-500">GNF</p>
              </div>
              <div>
                <p className="text-[10px] text-red-600 uppercase font-semibold">Reste</p>
                <p className="text-sm font-bold text-red-700">
                  {formatMontant(inscriptionsReste, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-red-500">GNF</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-cyan-200">
              Total attendu : <span className="font-semibold text-gray-700">{totalInscriptions.toLocaleString()} GNF</span>
            </p>
          </div>

          {/* 11. REMISES FAMILLES (Nouveau) */}
          <div className="bg-gradient-to-br from-fuchsia-50 to-purple-100 rounded-xl p-4 border-l-4 border-fuchsia-500 shadow-sm">
            <p className="text-xs font-semibold text-fuchsia-800 uppercase tracking-wide flex items-center gap-1 mb-2">
              <Users className="w-3.5 h-3.5" /> Remises Familles
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-fuchsia-600 uppercase font-semibold">Total remises</p>
                <p className="text-sm font-bold text-fuchsia-700">
                  {formatMontant(totalRemisesFamilles, loadingFinancesDetails && !financesDetails)}
                </p>
                <p className="text-[10px] text-fuchsia-500">GNF</p>
              </div>
              <div>
                <p className="text-[10px] text-fuchsia-600 uppercase font-semibold">Bénéficiaires</p>
                <p className="text-sm font-bold text-fuchsia-700">
                  {nbFamillesBeneficiaires}
                </p>
                <p className="text-[10px] text-fuchsia-500">familles</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-fuchsia-200">
              Éligibles : <span className="font-semibold text-gray-700">{nbFamillesRemises} famille(s)</span>
            </p>
          </div>

        </div>
      </div>

      {/* KPIs existants */}
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
          {/* Aperçu */}
          {activeTab === "apercu" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                <div className="border rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Répartition des recettes</h3>
                  <div className="space-y-4">
                    {categoriesRecettes?.map((cat: any, index: number) => (
                      <div key={cat.name || cat.type_frais || `cat-${index}`} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">{formatTypeFrais(cat.name || cat.type_frais)}</span>
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
            </div>
          )}

          {/* Paiements Parents */}
          {activeTab === "paiements_parents" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    Paiements & Règlements Parents
                  </h3>
                  <p className="text-xs text-gray-900 mt-0.5">
                    Consultez les détails financiers de chaque parent et enregistrez des règlements ciblés ou globaux.
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
                  <button onClick={fetchParentsFinances} className="p-2 bg-white border rounded-lg hover:bg-gray-100 transition" title="Actualiser">
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
                      <div key={p.parent_id} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition space-y-4">
                        <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-base">{p.prenom} {p.nom}</h4>
                              {aJour ? (
                                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> À jour
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-700 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Solde: {solde.toLocaleString()} GNF
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-900 mt-1">
                              <span>{p.email || "Non renseigné"}</span>
                              <span>{p.telephone || "Non renseigné"}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.enfants_inscrits.map((e: any) => (
                                <span key={e.eleve_id} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium border border-blue-100">
                                  {e.prenom} {e.nom} ({e.classe_nom || 'Sans classe'})
                                </span>
                              ))}
                              {p.preinscriptions.map((pre: any) => (
                                <span key={pre.preinscription_id} className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium border border-yellow-100">
                                  {pre.prenom} {pre.nom} ({pre.classe_nom})
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => { setSelectedParentPaiement(p); setShowPaiementGlobalModal(true); }}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Wallet className="w-4 h-4" /> Paiement Global
                            </button>
                           {/* Récapitulatif détaillé du solde global 
                           <button
                              onClick={() => { setSelectedParentPaiement(p); setShowDetailPaiementModal(true); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Eye className="w-4 h-4" /> Échéances
                            </button>*/} 
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gray-50 p-3 rounded-lg text-xs">
                          <div>
                            <span className="text-gray-900 block">Dépenses Brutes</span>
                            <span className="font-bold text-gray-900 text-sm">{p.totaux.depenses_brutes.toLocaleString()} GNF</span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Remise</span>
                            <span className="font-bold text-purple-600 text-sm">-{p.totaux.remise_accordee.toLocaleString()} GNF</span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Net à Payer</span>
                            <span className="font-bold text-blue-600 text-sm">{p.totaux.total_net.toLocaleString()} GNF</span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Payé</span>
                            <span className="font-bold text-green-600 text-sm">{p.totaux.total_paye.toLocaleString()} GNF</span>
                          </div>
                          <div>
                            <span className="text-gray-900 block">Solde Restant</span>
                            <span className={`font-bold text-sm ${solde > 0 ? 'text-red-600' : 'text-green-600'}`}>{solde.toLocaleString()} GNF</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recettes */}
          {activeTab === "recettes" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Historique complet des recettes</h3>
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
                        <td className="px-4 py-3 text-gray-900 font-medium">{formatTypeFrais(p.type_frais || p.type)}</td>
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

          {/* Dépenses */}
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
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-900">Aucune dépense enregistrée</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Journal */}
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
                          Paiement {formatTypeFrais(p.type_frais || p.type)} - {p.enfant_prenom || ''} {p.enfant_nom || ''}
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
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Remises */}
          {activeTab === "remises" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div>
                  <h3 className="font-bold text-purple-900 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" /> Remises Familles Nombreuses
                  </h3>
                  <p className="text-xs text-purple-700 mt-0.5">Déduction directe des frais pour les familles nombreuses.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-purple-800">Filtre:</span>
                  <select
                    value={filterMinEnfants}
                    onChange={(e) => setFilterMinEnfants(Number(e.target.value))}
                    className="border border-purple-200 rounded-lg px-3 py-1.5 text-xs text-purple-900 bg-white"
                  >
                    <option value={2}>2 enfants ou +</option>
                    <option value={3}>3 enfants ou +</option>
                    <option value={4}>4 enfants ou +</option>
                    <option value={1}>Tous (1 ou +)</option>
                  </select>
                </div>
              </div>

              {loadingRemises ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Parent</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase">Nb Enfants</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Total</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Remises</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Solde</th>
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
                          <td className="px-4 py-3 text-center">
                            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold">
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
                              onClick={() => { setSelectedParentRemise(p); setShowRemiseModal(true); }}
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

          {/* Reçus */}
          {activeTab === "recus" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div>
                  <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" /> Impression & Historique des Reçus
                  </h3>
                  <p className="text-xs text-blue-700 mt-0.5">Imprimez ou consultez tous les reçus émis.</p>
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
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
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
                          <td className="px-4 py-3 text-gray-900 font-medium">{formatTypeFrais(recu.type_frais)}</td>
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

      {/* Modal Paiement Global */}
      {showPaiementGlobalModal && selectedParentPaiement && (
        <PaiementGlobalModal
          isOpen={showPaiementGlobalModal}
          onClose={() => { setShowPaiementGlobalModal(false); setSelectedParentPaiement(null); }}
          onSuccess={() => {
            setShowPaiementGlobalModal(false);
            fetchParentsFinances();
            fetchDashboard();
            fetchFinancesDetails();
          }}
          solde={{
            total: selectedParentPaiement.totaux.solde_restant || 0,
            details: {
              inscription: selectedParentPaiement.services_breakdown?.scolarite?.reste ?? 0,
              transport: selectedParentPaiement.services_breakdown?.transport?.reste ?? 0,
              cantine: selectedParentPaiement.services_breakdown?.cantine?.reste ?? 0,
              fournitures: selectedParentPaiement.services_breakdown?.fournitures?.reste ?? 0,
            }
          }}
          parentId={selectedParentPaiement.parent_id}
        />
      )}

      {/* Modal Détail Échéances */}
      {showDetailPaiementModal && selectedParentPaiement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Détail Financier : {selectedParentPaiement.prenom} {selectedParentPaiement.nom}</h2>
                <p className="text-xs text-gray-900 mt-0.5">{selectedParentPaiement.telephone || "N/A"} • {selectedParentPaiement.email || "N/A"}</p>
              </div>
              <button
                onClick={() => { setShowDetailPaiementModal(false); setSelectedParentPaiement(null); }}
                className="text-gray-900 hover:text-gray-900 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-blue-100">
                <div>
                  <span className="text-xs text-gray-900 block">Dépenses</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedParentPaiement.totaux.depenses_brutes.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Remise</span>
                  <span className="font-bold text-purple-600 text-sm">-{selectedParentPaiement.totaux.remise_accordee.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Net</span>
                  <span className="font-bold text-blue-600 text-sm">{selectedParentPaiement.totaux.total_net.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Payé</span>
                  <span className="font-bold text-green-600 text-sm">{selectedParentPaiement.totaux.total_paye.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-900 block">Reste</span>
                  <span className={`font-bold text-sm ${selectedParentPaiement.totaux.solde_restant > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedParentPaiement.totaux.solde_restant.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cantine */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b pb-2">
                  <Utensils className="w-5 h-5 text-orange-600" /> Cantine
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">
                      Total: {(selectedParentPaiement.services_breakdown?.cantine?.total || 0).toLocaleString()} GNF
                      {(selectedParentPaiement.services_breakdown?.cantine?.paye || 0) > 0 && (
                        <span className="ml-2 text-green-600">• Payé: {(selectedParentPaiement.services_breakdown?.cantine?.paye || 0).toLocaleString()}</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-orange-600">
                      Reste: {(selectedParentPaiement.services_breakdown?.cantine?.reste ?? selectedParentPaiement.services_breakdown?.cantine?.total ?? 0).toLocaleString()} GNF
                    </p>
                  </div>
                  {(selectedParentPaiement.services_breakdown?.cantine?.reste ?? 0) > 0 ? (
                    <button
                      onClick={() => {
                        const m = selectedParentPaiement.services_breakdown?.cantine?.reste ?? 0;
                        setTargetPaiementItem({ type: "cantine", title: "Règlement Cantine", montantSuggere: m });
                        setTargetMontant(String(m));
                        setShowTargetPaiementModal(true);
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      Régler
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">✓ Soldé</span>
                  )}
                </div>
              </div>

              {/* Transport */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b pb-2">
                  <Bus className="w-5 h-5 text-blue-600" /> Transport
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">
                      Total: {(selectedParentPaiement.services_breakdown?.transport?.total || 0).toLocaleString()} GNF
                      {(selectedParentPaiement.services_breakdown?.transport?.paye || 0) > 0 && (
                        <span className="ml-2 text-green-600">• Payé: {(selectedParentPaiement.services_breakdown?.transport?.paye || 0).toLocaleString()}</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-blue-600">
                      Reste: {(selectedParentPaiement.services_breakdown?.transport?.reste ?? 0).toLocaleString()} GNF
                    </p>
                  </div>
                  {(selectedParentPaiement.services_breakdown?.transport?.reste ?? 0) > 0 ? (
                    <button
                      onClick={() => {
                        const m = selectedParentPaiement.services_breakdown?.transport?.reste ?? 0;
                        setTargetPaiementItem({ type: "transport", title: "Règlement Transport", montantSuggere: m });
                        setTargetMontant(String(m));
                        setShowTargetPaiementModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      Régler
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">✓ Soldé</span>
                  )}
                </div>
              </div>

              {/* Fournitures */}
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2 border-b pb-2">
                  <CreditCard className="w-5 h-5 text-purple-600" /> Fournitures
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">
                      Total: {(selectedParentPaiement.services_breakdown?.fournitures?.total || 0).toLocaleString()} GNF
                      {(selectedParentPaiement.services_breakdown?.fournitures?.paye || 0) > 0 && (
                        <span className="ml-2 text-green-600">• Payé: {(selectedParentPaiement.services_breakdown?.fournitures?.paye || 0).toLocaleString()}</span>
                      )}
                    </p>
                    <p className="text-xs font-bold text-purple-600">
                      Reste: {(selectedParentPaiement.services_breakdown?.fournitures?.reste ?? 0).toLocaleString()} GNF
                    </p>
                  </div>
                  {(selectedParentPaiement.services_breakdown?.fournitures?.reste ?? 0) > 0 ? (
                    <button
                      onClick={() => {
                        const m = selectedParentPaiement.services_breakdown?.fournitures?.reste ?? 0;
                        setTargetPaiementItem({ type: "fournitures", title: "Règlement Fournitures", montantSuggere: m });
                        setTargetMontant(String(m));
                        setShowTargetPaiementModal(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      Régler
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

      {/* Modal Paiement Ciblé */}
      {showTargetPaiementModal && targetPaiementItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{targetPaiementItem.title}</h3>
              <button
                onClick={() => { setShowTargetPaiementModal(false); setTargetPaiementItem(null); }}
                className="text-gray-900 hover:text-gray-900 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleRecordTargetPaiement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Montant (GNF) *</label>
                <input
                  type="text"
                  required
                  value={targetMontant}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setTargetMontant(cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 font-bold focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Mode de paiement *</label>
                <select
                  value={targetMode}
                  onChange={(e) => setTargetMode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white"
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
                <label className="block text-sm font-medium text-gray-900 mb-1">Référence</label>
                <input
                  type="text"
                  value={targetRef}
                  onChange={(e) => setTargetRef(e.target.value)}
                  placeholder="Ex: #OM-123456789"
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900"
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
                  className="flex-1 border py-2.5 rounded-lg text-sm text-gray-900 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reçu */}
      {selectedRecu && (
        <RecuPaiement
          recu={selectedRecu}
          onClose={() => setSelectedRecu(null)}
          onDelete={() => {
            setSelectedRecu(null);
            fetchDashboard();
            fetchRecusAdmin();
            fetchParentsFinances();
            fetchFinancesDetails();
          }}
        />
      )}

      {/* Modal Dépense */}
      {showDepenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Sortie de caisse</h2>
              <button onClick={() => setShowDepenseForm(false)} className="text-gray-900 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAjoutDepense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Catégorie *</label>
                <select
                  value={newDepense.categorie}
                  onChange={e => setNewDepense({ ...newDepense, categorie: e.target.value })}
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm"
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
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Ex: 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Date</label>
                <input
                  type="date"
                  value={newDepense.dateDepense}
                  onChange={e => setNewDepense({ ...newDepense, dateDepense: e.target.value })}
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                <textarea
                  value={newDepense.description}
                  onChange={e => setNewDepense({ ...newDepense, description: e.target.value })}
                  className="text-gray-900 w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
                <button type="button" onClick={() => setShowDepenseForm(false)} className="text-gray-900 flex-1 border py-2 rounded-lg text-sm">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Remise */}
      {showRemiseModal && selectedParentRemise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-black">Accorder une remise</h3>
                <p className="text-xs text-gray-900 mt-0.5">
                  {selectedParentRemise.prenom} {selectedParentRemise.nom} ({selectedParentRemise.nb_enfants} enfants)
                </p>
              </div>
              <button onClick={() => setShowRemiseModal(false)} className="text-gray-900 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleApplyRemise} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">{selectedParentRemise.total_a_payer?.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between">
                  <span>Remises:</span>
                  <span className="font-semibold text-purple-600">-{selectedParentRemise.total_remises?.toLocaleString()} GNF</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 border-t pt-1">
                  <span>Solde:</span>
                  <span>{selectedParentRemise.solde_restant?.toLocaleString()} GNF</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Montant (GNF) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={selectedParentRemise.solde_restant}
                  value={montantRemise}
                  onChange={e => setMontantRemise(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-black font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Motif</label>
                <input
                  type="text"
                  value={motifRemise}
                  onChange={e => setMotifRemise(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-black"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submittingRemise} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingRemise && <Loader2 className="w-4 h-4 animate-spin" />}
                  Appliquer
                </button>
                <button type="button" onClick={() => setShowRemiseModal(false)} className="flex-1 border py-2 rounded-lg text-sm text-black">
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