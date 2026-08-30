"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PaiementPlanModal from "@/components/PaiementPlanModal";
import PaiementUnifieModal from "@/components/PaiementUnifieModal";
import ParentStatsCharts from "@/components/ParentStatsCharts";
import RecuPaiement from "@/components/RecuPaiement";

import {
  Users,
  CreditCard,
  Bus,
  Calendar,
  AlertCircle,
  MessageSquare,
  GraduationCap,
  Eye,
  Loader2,
  FileText,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Trash2,
  AlertTriangle,
  X,
  Plus,
  ShoppingCart,
  Utensils,
  Camera,
  File,
  ExternalLink,
  Image,
  User,
  Receipt,
  Printer,
  Search
} from "lucide-react";

interface DetailsFrais {
  inscription: number;
  cantine: number;
  transport: number;
  librairie: number;
  scolarite: number;
  total: number;
  paye: number;
  reste: number;
  remise?: number;
}

interface Enfant {
  id: number;
  matricule: string;
  eleve_id: number;
  nom: string;
  prenom: string;
  classe_nom: string;
  niveau: string;
  frais_inscription_classe: number;
  photo_url: string | null;
  details_frais?: DetailsFrais;
}

interface Preinscription {
  id: number;
  numero_dossier: string;
  enfant_nom: string;
  enfant_prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe?: string;
  niveau: string;
  classe: string;
  statut: "en_attente" | "valide" | "rejete";
  date_preinscription: string;
  frais_statut: string;
  frais_montant: number;
  photo_url: string | null;
  acte_naissance_url?: string | null;
  bulletin_url?: string | null;
  transport_montant: number;
  cantine_montant: number;
  fournitures_montant: number;
  scolarite_montant: number;
  montant_total: number;
}

interface Stats {
  notes: Array<{ matiere: string; moyenne: number; coefficient: number }>;
  presences: { total: number; presents: number; absents: number; retards: number };
  paiements: {
    total_paye: number;
    nombre_paiements: number;
    details?: Array<{ montant: number; type_frais: string; mode_paiement: string; date_paiement: string }>;
  };
  frais_inscription: number;
  transport: number;
  cantine: number;
  fournitures: number;
  scolarite: number;
  total_frais_general: number;
  montant_a_payer: number;
  solde_restant: number;
}

interface PreinscriptionDetail extends Preinscription {
  details_frais: {
    inscription: number;
    cantine: number;
    transport: number;
    librairie: number;
    scolarite: number;
    total: number;
    paye: number;
    reste: number;
  };
  parent_nom: string;
  parent_prenom: string;
  parent_email: string;
  parent_telephone: string;
  parent_profession: string;
  mere_info: string | null;
  acte_naissance_url: string | null;
  bulletin_url: string | null;
  photo_url: string | null;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

// Valeurs par défaut pour les stats
const DEFAULT_STATS: Stats = {
  notes: [],
  presences: { total: 0, presents: 0, absents: 0, retards: 0 },
  paiements: { total_paye: 0, nombre_paiements: 0, details: [] },
  frais_inscription: 0,
  transport: 0,
  cantine: 0,
  fournitures: 0,
  scolarite: 0,
  total_frais_general: 0,
  montant_a_payer: 0,
  solde_restant: 0
};

export default function ParentDashboard() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [preinscriptions, setPreinscriptions] = useState<Preinscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsEnfant, setStatsEnfant] = useState<{ [key: number]: Stats }>({});
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedPreinscription, setSelectedPreinscription] = useState<Preinscription | null>(null);
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [paiementLoading, setPaiementLoading] = useState(false);

  // États pour les reçus
  const [recus, setRecus] = useState<any[]>([]);
  const [loadingRecus, setLoadingRecus] = useState(false);
  const [selectedRecu, setSelectedRecu] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"apercu" | "recus">("apercu");
  const [searchRecu, setSearchRecu] = useState("");

  // États pour le modal de détails
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPreinscriptionDetail, setSelectedPreinscriptionDetail] = useState<Preinscription | null>(null);
  const [preinscriptionDetail, setPreinscriptionDetail] = useState<PreinscriptionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // États pour l'annulation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [preinscriptionToCancel, setPreinscriptionToCancel] = useState<Preinscription | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fonction pour ajouter une notification
  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Fonction pour supprimer une notification
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchData();
    fetchRecus();
  }, []);

  const fetchRecus = async () => {
    setLoadingRecus(true);
    try {
      const res = await fetch("/api/parent/recus");
      if (res.ok) {
        const data = await res.json();
        setRecus(data);
      }
    } catch (e) {
      console.error("Erreur chargement reçus:", e);
    } finally {
      setLoadingRecus(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Récupérer les enfants et les pré-inscriptions
      const [enfantsRes, preinscriptionsRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch("/api/parent/preinscriptions")
      ]);

      const enfantsData = await enfantsRes.json();
      const preinscriptionsData = await preinscriptionsRes.json();

      console.log("Enfants reçus:", enfantsData);
      console.log("Pré-inscriptions reçues:", preinscriptionsData);

      setEnfants(enfantsData);

      // GARDER TOUTES LES PRÉ-INSCRIPTIONS (même en attente)
      setPreinscriptions(preinscriptionsData);

      // 2. Charger les statistiques pour chaque enfant
      const statsPromises = enfantsData.map(async (enfant: Enfant) => {
        try {
          console.log(` Chargement des stats pour l'enfant ${enfant.eleve_id} (${enfant.prenom} ${enfant.nom})`);
          const statsResponse = await fetch(`/api/parent/enfants/${enfant.eleve_id}/stats`);

          if (!statsResponse.ok) {
            console.error(`❌ Erreur HTTP ${statsResponse.status} pour l'enfant ${enfant.eleve_id}`);
            return { eleveId: enfant.eleve_id, stats: { ...DEFAULT_STATS } };
          }

          const statsData = await statsResponse.json();
          console.log(`✅ Stats pour ${enfant.prenom}:`, statsData);

          // Valider et nettoyer les données
          const validatedStats: Stats = {
            notes: statsData.notes || [],
            presences: statsData.presences || { total: 0, presents: 0, absents: 0, retards: 0 },
            paiements: {
              total_paye: Number(statsData.paiements?.total_paye) || 0,
              nombre_paiements: Number(statsData.paiements?.nombre_paiements) || 0,
              details: statsData.paiements?.details || []
            },
            frais_inscription: Number(statsData.frais_inscription) || 0,
            transport: Number(statsData.transport) || 0,
            cantine: Number(statsData.cantine) || 0,
            fournitures: Number(statsData.fournitures) || 0,
            scolarite: Number(statsData.scolarite) || 0,
            total_frais_general: Number(statsData.total_frais_general) || 0,
            montant_a_payer: Number(statsData.montant_a_payer) || 0,
            solde_restant: Number(statsData.solde_restant) || 0
          };

          return { eleveId: enfant.eleve_id, stats: validatedStats };
        } catch (error) {
          console.error(`❌ Erreur chargement stats pour enfant ${enfant.eleve_id}:`, error);
          return { eleveId: enfant.eleve_id, stats: { ...DEFAULT_STATS } };
        }
      });

      const statsResults = await Promise.all(statsPromises);

      // Mettre à jour les stats
      const newStatsEnfant: { [key: number]: Stats } = {};
      statsResults.forEach(({ eleveId, stats }) => {
        newStatsEnfant[eleveId] = stats;
      });
      setStatsEnfant(newStatsEnfant);

      console.log(" Statistiques finales:", newStatsEnfant);

    } catch (error) {
      console.error("❌ Erreur globale:", error);
      addNotification("error", "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadPreinscriptionDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/parent/preinscriptions/${id}`);
      if (!response.ok) {
        throw new Error("Erreur chargement détails");
      }
      const data = await response.json();
      console.log(" Détails pré-inscription reçus:", data);

      setPreinscriptionDetail(data);
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors du chargement des détails");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePaiement = async () => {
    if (!selectedPreinscription || !modePaiement) return;

    setPaiementLoading(true);
    try {
      const response = await fetch("/api/parent/paiement-preinscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preinscriptionId: selectedPreinscription.id,
          modePaiement,
          reference: reference || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification("success", "Paiement effectué avec succès ! Un email a été envoyé au comptable.");
        setShowPaiementModal(false);
        fetchData();
        setSelectedPreinscription(null);
        setModePaiement("");
        setReference("");
      } else {
        addNotification("error", data.error || "Erreur lors du paiement");
      }
    } catch (error) {
      console.error("Erreur paiement:", error);
      addNotification("error", "Erreur lors du paiement");
    } finally {
      setPaiementLoading(false);
    }
  };

  const handleCancelPreinscription = async () => {
    if (!preinscriptionToCancel) return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/parent/preinscriptions/${preinscriptionToCancel.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        addNotification("success", `Pré-inscription de ${preinscriptionToCancel.enfant_prenom} ${preinscriptionToCancel.enfant_nom} annulée avec succès`);
        setShowConfirmModal(false);
        setPreinscriptionToCancel(null);
        fetchData();
      } else {
        addNotification("error", data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur annulation:", error);
      addNotification("error", "Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  const openConfirmCancel = (preinscription: Preinscription) => {
    setPreinscriptionToCancel(preinscription);
    setShowConfirmModal(true);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case "valide":
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validée</span>;
      case "rejete":
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejetée</span>;
      default:
        return null;
    }
  };

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    if (fraisStatut === "partiel") {
      return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Partiel</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  // ✅ CALCUL IDENTIQUE AU DASHBOARD PARENT (app/dashboard/parent/page.tsx)
  const totalAPayerBrut = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.total) || 0), 0);
  const totalPaye = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.paye) || 0), 0);
  const remisesAffectees = enfants.reduce((acc, e) => acc + (Number((e.details_frais as any)?.remise) || 0), 0);
  const totalRemiseParentGlobale = enfants.length > 0 ? (Number((enfants[0] as any)?.total_remise_parent) || 0) : 0;
  const totalRemises = Math.max(remisesAffectees, totalRemiseParentGlobale);

  const totalAPayerNet = Math.max(0, totalAPayerBrut - totalRemises);
  const soldeRestant = Math.max(0, totalAPayerNet - totalPaye);

  const totalTransport = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.transport) || 0), 0);
  const totalCantine = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.cantine) || 0), 0);
  const totalFournitures = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.librairie) || 0), 0);
  const totalScolarite = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.scolarite) || Number(e.details_frais?.inscription) || 0), 0);

  const statsGlobales = {
    totalEnfants: enfants.length,
    totalPreinscriptions: preinscriptions.length,
    preinscriptionsEnAttente: preinscriptions.filter(p => p.statut === "en_attente").length,
    preinscriptionsPayees: preinscriptions.filter(p => p.frais_statut === "paye").length,
    totalRetards: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.presences?.retards) || 0), 0),
    totalAPayerBrut: totalAPayerBrut,
    totalAPayerNet: totalAPayerNet,
    totalAPayer: totalAPayerNet,
    totalPaye: totalPaye,
    totalRemises: totalRemises,
    totalFraisInscription: totalScolarite,
    totalTransport: totalTransport,
    totalCantine: totalCantine,
    totalFournitures: totalFournitures,
    totalFraisGeneral: totalAPayerNet,
    soldeRestant: soldeRestant,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Notifications Toast */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${notification.type === "success"
              ? "bg-green-50 border-l-4 border-green-500 text-green-800"
              : notification.type === "error"
                ? "bg-red-50 border-l-4 border-red-500 text-red-800"
                : notification.type === "warning"
                  ? "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800"
                  : "bg-blue-50 border-l-4 border-blue-500 text-blue-800"
              }`}
          >
            <div className="flex-1">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notification.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
              {notification.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {notification.type === "info" && <FileText className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-900 hover:text-gray-900 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Finances & Règlement</h1>
        <p className="text-gray-900">Aperçu financier complet et historique de vos paiements</p>
      </div>

      {/* STATISTIQUES FINANCIÈRES COMPLÈTES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {/* TOTAL DÉPENSES BRUT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-700">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold uppercase tracking-wider">Total dépenses (Brut)</p>
          </div>
          <p className="text-xl font-extrabold text-gray-900">{statsGlobales.totalAPayerBrut.toLocaleString()} GNF</p>
          <p className="text-[11px] text-gray-500 mt-1">Scolarité + services</p>
        </div>

        {/* REMISE ACCORDÉE */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 bg-indigo-50/20 p-4">
          <div className="flex items-center gap-2 mb-1 text-indigo-700">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <p className="text-xs font-semibold uppercase tracking-wider">Remise accordée</p>
          </div>
          <p className="text-xl font-extrabold text-indigo-600">
            {statsGlobales.totalRemises > 0 ? `-${statsGlobales.totalRemises.toLocaleString()} GNF` : "0 GNF"}
          </p>
          <p className="text-[11px] text-indigo-500 mt-1">Réduction déduite</p>
        </div>

        {/* MONTANT NET À PAYER */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 bg-blue-50/40 p-4">
          <div className="flex items-center gap-2 mb-1 text-blue-800">
            <Wallet className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-semibold uppercase tracking-wider">Net à payer</p>
          </div>
          <p className="text-xl font-extrabold text-blue-700">{statsGlobales.totalAPayerNet.toLocaleString()} GNF</p>
          <p className="text-[11px] text-blue-600 mt-1">Dépenses - Remise</p>
        </div>

        {/* MONTANT PAYÉ */}
        <div className="bg-white rounded-xl shadow-sm border border-green-200 bg-green-50/40 p-4">
          <div className="flex items-center gap-2 mb-1 text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs font-semibold uppercase tracking-wider">Montant payé</p>
          </div>
          <p className="text-xl font-extrabold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
          <p className="text-[11px] text-green-600 mt-1">Versements effectués</p>
        </div>

        {/* SOLDE RESTANT */}
        <div className={`rounded-xl shadow-sm border p-4 col-span-2 sm:col-span-1 ${
          statsGlobales.soldeRestant === 0 ? "bg-green-100/50 border-green-300" : "bg-red-50/50 border-red-200"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`w-4 h-4 ${statsGlobales.soldeRestant === 0 ? "text-green-600" : "text-red-600"}`} />
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              statsGlobales.soldeRestant === 0 ? "text-green-800" : "text-red-800"
            }`}>Reste à payer</p>
          </div>
          <p className={`text-xl font-extrabold ${
            statsGlobales.soldeRestant === 0 ? "text-green-700" : "text-red-600"
          }`}>
            {statsGlobales.soldeRestant.toLocaleString()} GNF
          </p>
          <p className={`text-[11px] mt-1 ${
            statsGlobales.soldeRestant === 0 ? "text-green-700 font-medium" : "text-red-500"
          }`}>
            {statsGlobales.soldeRestant === 0 ? "✅ Totalement réglé" : "Solde restant dû"}
          </p>
        </div>
      </div>

      {/* GRAPHIQUES DES STATISTIQUES */}
      <div className="mb-8">
        <ParentStatsCharts
          enfants={enfants}
          preinscriptions={preinscriptions}
          statsEnfant={statsEnfant}
          statsGlobales={statsGlobales}
        />
      </div>

      {/* ONGLETS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b px-6 bg-gray-50">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("apercu")}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "apercu"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-900 hover:text-gray-900"
                }`}
            >
              <FileText className="w-4 h-4" /> Mes inscriptions
            </button>
            <button
              onClick={() => setActiveTab("recus")}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "recus"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-900 hover:text-gray-900"
                }`}
            >
              <Receipt className="w-4 h-4" /> Mes reçus
              {recus.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {recus.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Onglet : pré-inscriptions (vide pour l'instant, les cartes sont au-dessus) */}
          {activeTab === "apercu" && (
            <div className="text-center py-8 text-gray-900">
              <FileText className="w-12 h-12 text-gray-900 mx-auto mb-3" />
              <p className="font-medium">Vos inscriptions sont affichées ci-dessus</p>
              <p className="text-sm text-gray-900 mt-1">Consultez vos statistiques et détails en haut de la page</p>
            </div>
          )}

          {/* Onglet : MES REÇUS */}
          {activeTab === "recus" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 rounded-xl border border-blue-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" /> Mes reçus de paiement
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Historique détaillé et officiel de tous vos règlements effectués
                  </p>
                </div>
                <button
                  onClick={fetchRecus}
                  disabled={loadingRecus}
                  className="flex items-center gap-2 text-sm bg-white text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3.5 py-2 rounded-lg shadow-sm hover:bg-blue-50 transition"
                >
                  {loadingRecus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  Rafraîchir les reçus
                </button>
              </div>

              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par N° de reçu, élève, type de frais ou référence..."
                  value={searchRecu}
                  onChange={(e) => setSearchRecu(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>

              {loadingRecus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : recus.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <Receipt className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="font-semibold text-gray-900 text-base">Aucun reçu disponible</p>
                  <p className="text-sm text-gray-500 mt-1">Vos reçus officiels de paiement s'afficheront ici après chaque règlement.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">N° Reçu</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Élève & Classe</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type de frais</th>
                        <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Montant versé</th>
                        <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Montant total</th>
                        <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Solde restant</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mode</th>
                        <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recus
                        .filter((r) =>
                          !searchRecu ||
                          r.enfant?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                          r.numero_recu?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                          r.type_frais?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                          r.reference?.toLowerCase().includes(searchRecu.toLowerCase())
                        )
                        .map((recu, idx) => (
                          <tr key={`${recu.source}-${recu.source_id}-${idx}`} className="hover:bg-blue-50/40 transition">
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md font-bold border border-gray-200">
                                {recu.numero_recu}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  <User className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{recu.enfant || "—"}</p>
                                  {recu.classe && <p className="text-[11px] text-gray-500 font-medium">{recu.classe}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-medium inline-block">
                                {recu.type_frais}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-green-600">
                              {Number(recu.montant).toLocaleString("fr-FR")} GNF
                            </td>
                            <td className="px-4 py-3.5 text-right text-gray-700 font-medium">
                              {recu.montant_total ? `${Number(recu.montant_total).toLocaleString("fr-FR")} GNF` : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                                Number(recu.reste_a_payer) === 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-50 text-red-600"
                              }`}>
                                {Number(recu.reste_a_payer) === 0 ? "Payé" : `${Number(recu.reste_a_payer).toLocaleString("fr-FR")} GNF`}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-700 text-xs">
                              {recu.mode_paiement === "orange_money" ? "Orange Money" :
                                recu.mode_paiement === "mtn_money" ? "MTN Money" :
                                  recu.mode_paiement === "especes" ? "Espèces" :
                                    recu.mode_paiement === "carte" ? "Carte Bancaire" :
                                      recu.mode_paiement || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600 text-xs font-medium">
                              {recu.date_paiement
                                ? new Date(recu.date_paiement).toLocaleDateString("fr-FR")
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => setSelectedRecu(recu)}
                                className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm transition font-medium"
                              >
                                <Printer className="w-3.5 h-3.5" /> Reçu
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {recus.filter((r) =>
                    !searchRecu ||
                    r.enfant?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                    r.numero_recu?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                    r.type_frais?.toLowerCase().includes(searchRecu.toLowerCase())
                  ).length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Aucun reçu trouvé pour «&nbsp;{searchRecu}&nbsp;»
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL REÇU COMPLET */}
      {selectedRecu && (
        <RecuPaiement
          recu={{
            numero_recu: selectedRecu.numero_recu,
            date_paiement: selectedRecu.date_paiement,
            enfant: selectedRecu.enfant,
            montant: Number(selectedRecu.montant) || 0,
            mode_paiement: selectedRecu.mode_paiement,
            type_frais: selectedRecu.type_frais,
            reference: selectedRecu.reference,
            classe: selectedRecu.classe,
            parent_nom: selectedRecu.parent_nom || "Parent",
            parent_email: selectedRecu.parent_email || "",
            source: selectedRecu.source,
            montant_total: Number(selectedRecu.montant_total) || 0,
            reste_a_payer: Number(selectedRecu.reste_a_payer) || 0,
            preinscription_id: selectedRecu.preinscription_id || undefined,
            paiement_id: selectedRecu.source_id,
            enfants_liste: enfants.map((e: any) => ({
              nom: `${e.nom || ""} ${e.prenom || ""}`.trim() || e.enfant_nom || "Élève",
              classe: e.classe_nom || e.classe || "Scolarité"
            }))
          }}
          onClose={() => setSelectedRecu(null)}
        />
      )}
    </div>
  );
}