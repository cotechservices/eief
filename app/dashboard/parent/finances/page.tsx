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
  // Source : enfants.details_frais retourné par /api/parent/enfants
  // Ce calcul est IDENTIQUE à celui du dashboard pour garantir la cohérence

  const totalAPayerBrut = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.total) || 0), 0);
  const totalPaye = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.paye) || 0), 0);
  const totalRemises = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.remise) || 0), 0);
  const totalAPayerNet = Math.max(0, totalAPayerBrut - totalRemises);
  const soldeRestant = Math.max(0, totalAPayerNet - totalPaye);

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
    totalFraisInscription: totalAPayerNet,
    totalTransport: 0,
    totalCantine: 0,
    totalFournitures: 0,
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
        <h1 className="text-2xl font-bold text-black">Espace Parent</h1>
        <p className="text-gray-900">Bienvenue dans votre espace de suivi scolaire</p>
      </div>

      {/* STATISTIQUES FINANCIÈRES — MÊMES MONTANTS QUE LE DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalPreinscriptions}</p>
        </div>

        {/* MONTANT TOTAL BRUT */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1 text-gray-600">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <p className="text-sm">Total frais brut</p>
          </div>
          <p className="text-lg font-bold text-blue-600">{statsGlobales.totalAPayerBrut.toLocaleString()} GNF</p>
        </div>

        {/* MONTANT NET À PAYER (après remises) */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1 text-gray-600">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <p className="text-sm">Montant à payer</p>
          </div>
          <p className="text-lg font-bold text-indigo-600">{statsGlobales.totalAPayer.toLocaleString()} GNF</p>
          {statsGlobales.totalRemises > 0 && (
            <p className="text-xs text-green-600 mt-1">Remise : -{statsGlobales.totalRemises.toLocaleString()} GNF</p>
          )}
        </div>

        {/* MONTANT PAYÉ */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1 text-gray-600"><CreditCard className="w-5 h-5 text-green-600" /><p className="text-sm">Montant payé</p></div>
          <p className="text-lg font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
        </div>

        {/* SOLDE RESTANT */}
        <div className={`rounded-xl shadow-sm p-4 border ${statsGlobales.soldeRestant === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 mb-1 text-gray-600">
            <CreditCard className={`w-5 h-5 ${statsGlobales.soldeRestant === 0 ? 'text-green-600' : 'text-red-600'}`} />
            <p className="text-sm">Solde restant</p>
          </div>
          <p className={`text-lg font-bold ${statsGlobales.soldeRestant === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {statsGlobales.soldeRestant.toLocaleString()} GNF
          </p>
          {statsGlobales.soldeRestant === 0 && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Tout est payé
            </p>
          )}
        </div>

        {/* PREINSCRIPTIONS EN ATTENTE */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1 text-gray-600">
            <Clock className="w-5 h-5 text-yellow-500" />
            <p className="text-sm">En attente</p>
          </div>
          <p className="text-lg font-bold text-yellow-600">{statsGlobales.preinscriptionsEnAttente}</p>
        </div>

        {/* PREINSCRIPTIONS PAYÉES */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1 text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm">Dossiers payés</p>
          </div>
          <p className="text-lg font-bold text-green-600">{statsGlobales.preinscriptionsPayees}</p>
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
                : "border-transparent text-gray-900 hover:text-gray-700"
                }`}
            >
              <FileText className="w-4 h-4" /> Mes pré-inscriptions
            </button>
            <button
              onClick={() => setActiveTab("recus")}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "recus"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                : "border-transparent text-gray-900 hover:text-gray-700"
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
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">Vos pré-inscriptions sont affichées ci-dessus</p>
              <p className="text-sm text-gray-900 mt-1">Consultez vos statistiques et détails en haut de la page</p>
            </div>
          )}

          {/* Onglet : MES REÇUS */}
          {activeTab === "recus" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Mes reçus de paiement</h3>
                  <p className="text-sm text-gray-900 mt-0.5">
                    Historique de tous vos paiements effectués
                  </p>
                </div>
                <button
                  onClick={fetchRecus}
                  disabled={loadingRecus}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                >
                  {loadingRecus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  Rafraîchir
                </button>
              </div>

              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                <input
                  type="text"
                  placeholder="Rechercher un reçu, un enfant..."
                  value={searchRecu}
                  onChange={(e) => setSearchRecu(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loadingRecus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : recus.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-gray-900" />
                  </div>
                  <p className="font-semibold text-gray-600">Aucun reçu disponible</p>
                  <p className="text-sm text-gray-900 mt-1">Vos reçus apparaîtront ici après chaque paiement</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">N° Reçu</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Enfant</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wide">Montant</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Date</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recus
                        .filter((r) =>
                          !searchRecu ||
                          r.enfant?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                          r.numero_recu?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                          r.type_frais?.toLowerCase().includes(searchRecu.toLowerCase())
                        )
                        .map((recu, idx) => (
                          <tr key={`${recu.source}-${recu.source_id}-${idx}`} className="hover:bg-blue-50/40 transition">
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded font-semibold text-gray-700">
                                {recu.numero_recu}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-800">{recu.enfant || "—"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                {recu.type_frais}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-green-700">
                                {Number(recu.montant).toLocaleString("fr-FR")} GNF
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {recu.mode_paiement === "orange_money" ? "Orange Money" :
                                recu.mode_paiement === "especes" ? "Espèces" :
                                  recu.mode_paiement === "carte" ? "Carte" :
                                    recu.mode_paiement || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-900 text-xs">
                              {recu.date_paiement
                                ? new Date(recu.date_paiement).toLocaleDateString("fr-FR")
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedRecu(recu)}
                                className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                              >
                                <Printer className="w-3 h-3" /> Reçu
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {recus.filter((r) =>
                    !searchRecu ||
                    r.enfant?.toLowerCase().includes(searchRecu.toLowerCase()) ||
                    r.numero_recu?.toLowerCase().includes(searchRecu.toLowerCase())
                  ).length === 0 && (
                      <div className="text-center py-8 text-gray-900 text-sm">
                        Aucun reçu trouvé pour «&nbsp;{searchRecu}&nbsp;»
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL REÇU */}
      {selectedRecu && (
        <RecuPaiement
          recu={selectedRecu}
          onClose={() => setSelectedRecu(null)}
        />
      )}
    </div>
  );
}