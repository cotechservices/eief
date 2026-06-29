"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PaiementPlanModal from "@/components/PaiementPlanModal";
import ParentStatsCharts from "@/components/ParentStatsCharts";

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
  User
} from "lucide-react";

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
  }, []);

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

      console.log("📊 Statistiques finales:", newStatsEnfant);

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

  // Dans ParentDashboard, remplacer la section de calcul des statistiques globales

// CALCUL DES STATISTIQUES GLOBALES 

// 1. Calcul du total des frais de pré-inscription (inscription + services optionnels)
//    Chaque pré-inscription a un montant_total qui inclut déjà tous les services
const totalPreinscriptionFrais = preinscriptions.reduce((acc, p) => acc + (Number(p.montant_total) || 0), 0);

// 2. Les services optionnels sont DÉJÀ inclus dans montant_total
//    On ne les additionne pas séparément pour éviter le double comptage
const totalCantine = 0;
const totalTransport = 0;
const totalFournitures = 0;

// 3. Calcul du total payé pour tous les enfants (paiements direct + échéances)
const totalPaye = Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.paiements?.total_paye) || 0), 0);

//  MONTANT À PAYER = Total des pré-inscriptions (inclut tous les services)
const totalAPayer = totalPreinscriptionFrais;

//  Solde restant = Montant à payer - Montant payé
const soldeRestant = Math.max(0, totalAPayer - totalPaye);

const statsGlobales = {
  totalEnfants: enfants.length,
  totalPreinscriptions: preinscriptions.length,
  preinscriptionsEnAttente: preinscriptions.filter(p => p.statut === "en_attente").length,
  preinscriptionsPayees: preinscriptions.filter(p => p.frais_statut === "paye").length,
  totalRetards: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.presences?.retards) || 0), 0),

  //  Montant à payer = Total des pré-inscriptions (inclut tous les services)
  totalAPayer: totalAPayer,

  //  Montant payé = total payé pour tous les enfants
  totalPaye: totalPaye,

  //  Totaux par catégorie (pour affichage)
  totalFraisInscription: totalPreinscriptionFrais,
  totalTransport: 0, // Déjà inclus dans montant_total
  totalCantine: 0,   // Déjà inclus dans montant_total
  totalFournitures: 0, // Déjà inclus dans montant_total

  // Total général des frais
  totalFraisGeneral: totalPreinscriptionFrais,

  //  Solde restant = Montant à payer - Montant payé
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

      {/* STATISTIQUES GLOBALES AVEC LES BONS CALCULS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalPreinscriptions}</p>
        </div>
        {/* MONTANT À PAYER = Total des frais de pré-inscription */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <p className="text-sm">Montant à payer</p>
          </div>
          <p className="text-lg font-bold text-blue-600">{statsGlobales.totalAPayer.toLocaleString()} GNF</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><CreditCard className="w-5 h-5 text-green-600" /><p className="text-sm">Montant payé</p></div>
          <p className="text-lg font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
        </div>
        {/* CANTINE - Total des frais de cantine pour tous les enfants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Utensils className="w-5 h-5 text-orange-600" /><p className="text-sm">Cantine</p></div>
          <p className="text-lg font-bold text-orange-600">{statsGlobales.totalCantine.toLocaleString()} GNF</p>
        </div>
        {/* TRANSPORT - Total des frais de transport pour tous les enfants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Bus className="w-5 h-5 text-blue-600" /><p className="text-sm">Transport</p></div>
          <p className="text-lg font-bold text-blue-600">{statsGlobales.totalTransport.toLocaleString()} GNF</p>
        </div>
        {/* FOURNITURES - Total des frais de fournitures pour tous les enfants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><ShoppingCart className="w-5 h-5 text-purple-600" /><p className="text-sm">Fournitures</p></div>
          <p className="text-lg font-bold text-purple-600">{statsGlobales.totalFournitures.toLocaleString()} GNF</p>
        </div>
        {/* SOLDE RESTANT = Montant à payer - Montant payé */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><CreditCard className="w-5 h-5 text-red-600" /><p className="text-sm">Solde restant</p></div>
          <p className="text-lg font-bold text-red-600">{statsGlobales.soldeRestant.toLocaleString()} GNF</p>
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
    </div>
  );
}