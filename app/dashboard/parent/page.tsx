"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PaiementPlanModal from "@/components/PaiementPlanModal";
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

      console.log("👨‍👧‍👦 Enfants reçus:", enfantsData);
      console.log("📋 Pré-inscriptions reçues:", preinscriptionsData);

      setEnfants(enfantsData);

      // ⭐ GARDER TOUTES LES PRÉ-INSCRIPTIONS (même en attente)
      setPreinscriptions(preinscriptionsData);

      // 2. Charger les statistiques pour chaque enfant
      const statsPromises = enfantsData.map(async (enfant: Enfant) => {
        try {
          console.log(`📊 Chargement des stats pour l'enfant ${enfant.eleve_id} (${enfant.prenom} ${enfant.nom})`);
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
      console.log("📋 Détails pré-inscription reçus:", data);

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

// ⭐⭐⭐ CALCUL DES STATISTIQUES GLOBALES ⭐⭐⭐

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

// ⭐ MONTANT À PAYER = Total des pré-inscriptions (inclut tous les services)
const totalAPayer = totalPreinscriptionFrais;

// ⭐ Solde restant = Montant à payer - Montant payé
const soldeRestant = Math.max(0, totalAPayer - totalPaye);

const statsGlobales = {
  totalEnfants: enfants.length,
  totalPreinscriptions: preinscriptions.length,
  preinscriptionsEnAttente: preinscriptions.filter(p => p.statut === "en_attente").length,
  preinscriptionsPayees: preinscriptions.filter(p => p.frais_statut === "paye").length,
  totalRetards: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.presences?.retards) || 0), 0),

  // ⭐ Montant à payer = Total des pré-inscriptions (inclut tous les services)
  totalAPayer: totalAPayer,

  // ⭐ Montant payé = total payé pour tous les enfants
  totalPaye: totalPaye,

  // ⭐ Totaux par catégorie (pour affichage)
  totalFraisInscription: totalPreinscriptionFrais,
  totalTransport: 0, // Déjà inclus dans montant_total
  totalCantine: 0,   // Déjà inclus dans montant_total
  totalFournitures: 0, // Déjà inclus dans montant_total

  // ⭐ Total général des frais
  totalFraisGeneral: totalPreinscriptionFrais,

  // ⭐ Solde restant = Montant à payer - Montant payé
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

      {/* ⭐ STATISTIQUES GLOBALES AVEC LES BONS CALCULS ⭐ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalPreinscriptions}</p>
        </div>
        {/* ⭐ MONTANT À PAYER = Total des frais de pré-inscription */}
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
        {/* ⭐ CANTINE - Total des frais de cantine pour tous les enfants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Utensils className="w-5 h-5 text-orange-600" /><p className="text-sm">Cantine</p></div>
          <p className="text-lg font-bold text-orange-600">{statsGlobales.totalCantine.toLocaleString()} GNF</p>
        </div>
        {/* ⭐ TRANSPORT - Total des frais de transport pour tous les enfants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Bus className="w-5 h-5 text-blue-600" /><p className="text-sm">Transport</p></div>
          <p className="text-lg font-bold text-blue-600">{statsGlobales.totalTransport.toLocaleString()} GNF</p>
        </div>
        {/* ⭐ FOURNITURES - Total des frais de fournitures pour tous les enfants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><ShoppingCart className="w-5 h-5 text-purple-600" /><p className="text-sm">Fournitures</p></div>
          <p className="text-lg font-bold text-purple-600">{statsGlobales.totalFournitures.toLocaleString()} GNF</p>
        </div>
        {/* ⭐ SOLDE RESTANT = Montant à payer - Montant payé */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><CreditCard className="w-5 h-5 text-red-600" /><p className="text-sm">Solde restant</p></div>
          <p className="text-lg font-bold text-red-600">{statsGlobales.soldeRestant.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Section Pré-inscriptions */}
      {preinscriptions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Mes pré-inscriptions
            </h2>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle inscription
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {preinscriptions.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="photo" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-900" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-black">{p.enfant_prenom} {p.enfant_nom}</h3>
                          <p className="text-sm text-gray-900">{p.classe}</p>
                          <p className="text-xs text-gray-900 mt-1">Dossier: {p.numero_dossier}</p>
                        </div>
                        <div className="text-right">
                          {getStatutBadge(p.statut)}
                          <div className="mt-1">{getFraisBadge(p.frais_statut)}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.frais_statut !== "paye" && p.statut === "en_attente" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPreinscription(p);
                                setShowPaiementModal(true);
                              }}
                              className="flex-1 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 min-w-[100px]"
                            >
                              Payer l'inscription
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPreinscriptionDetail(p);
                                loadPreinscriptionDetail(p.id);
                                setShowDetailModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-100 text-blue-600 text-sm rounded-lg hover:bg-blue-200 transition flex items-center gap-1"
                              title="Voir les détails de la pré-inscription"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConfirmCancel(p)}
                              className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                              title="Annuler la pré-inscription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {p.frais_statut === "paye" && p.statut === "en_attente" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPreinscriptionDetail(p);
                                loadPreinscriptionDetail(p.id);
                                setShowDetailModal(true);
                              }}
                              className="flex-1 bg-blue-100 text-blue-600 text-sm py-1.5 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-1"
                            >
                              <Eye className="w-4 h-4" /> Voir détails
                            </button>
                            <div className="flex-1 bg-yellow-100 text-yellow-700 text-sm py-1.5 rounded-lg text-center">
                              En attente de validation
                            </div>
                          </>
                        )}
                        {p.statut === "valide" && (
                          <div className="flex-1 bg-green-100 text-green-700 text-sm py-1.5 rounded-lg text-center">
                            ✅ Inscription validée
                          </div>
                        )}
                        {p.statut === "rejete" && (
                          <div className="flex-1 bg-red-100 text-red-700 text-sm py-1.5 rounded-lg text-center">
                            ❌ Pré-inscription rejetée
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Détail Pré-inscription */}
      {showDetailModal && selectedPreinscriptionDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">Détail de la pré-inscription</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-900">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {selectedPreinscriptionDetail.photo_url ? (
                    <img src={selectedPreinscriptionDetail.photo_url} alt="Photo" className="w-32 h-32 rounded-lg object-cover shadow-md" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-900">Numéro de dossier</p>
                    <p className="font-mono text-xl font-bold text-blue-600">{selectedPreinscriptionDetail.numero_dossier}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-900">Statut dossier</p>
                      {getStatutBadge(selectedPreinscriptionDetail.statut)}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-900">Paiement</p>
                      {getFraisBadge(selectedPreinscriptionDetail.frais_statut)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations des parents */}
              {preinscriptionDetail && (
                <div>
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-900" /> Informations des parents
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-500">Email (commun)</p>
                    <p className="font-medium text-black">{preinscriptionDetail.parent_email}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-3 text-sm uppercase tracking-wide">Père</h4>
                      <div className="space-y-2">
                        <div><p className="text-xs text-gray-500">Nom complet</p><p className="font-medium text-black">{preinscriptionDetail.parent_prenom} {preinscriptionDetail.parent_nom}</p></div>
                        <div><p className="text-xs text-gray-500">Téléphone</p><p className="font-medium text-black">{preinscriptionDetail.parent_telephone || "Non renseigné"}</p></div>
                        <div><p className="text-xs text-gray-500">Profession</p><p className="font-medium text-black">{preinscriptionDetail.parent_profession || "Non renseigné"}</p></div>
                      </div>
                    </div>
                    <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-pink-800 mb-3 text-sm uppercase tracking-wide">Mère</h4>
                      {(() => {
                        let mereData: any = null;
                        try {
                          if (preinscriptionDetail.mere_info) {
                            mereData = typeof preinscriptionDetail.mere_info === 'string'
                              ? JSON.parse(preinscriptionDetail.mere_info)
                              : preinscriptionDetail.mere_info;
                          }
                        } catch (e) { }
                        return mereData && (mereData.mereNom || mereData.merePrenom) ? (
                          <div className="space-y-2">
                            <div><p className="text-xs text-gray-500">Nom complet</p><p className="font-medium text-black">{mereData.merePrenom || ""} {mereData.mereNom || ""}</p></div>
                            <div><p className="text-xs text-gray-500">Téléphone</p><p className="font-medium text-black">{mereData.merePhone || "Non renseigné"}</p></div>
                            <div><p className="text-xs text-gray-500">Profession</p><p className="font-medium text-black">{mereData.mereProfession || "Non renseigné"}</p></div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Non renseigné</p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Informations de l'enfant */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" /> Informations de l'enfant
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Nom complet</p>
                    <p className="font-medium text-black">{selectedPreinscriptionDetail.enfant_prenom} {selectedPreinscriptionDetail.enfant_nom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Date de naissance</p>
                    <p className="font-medium text-black">{new Date(selectedPreinscriptionDetail.date_naissance).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Lieu de naissance</p>
                    <p className="font-medium text-black">{selectedPreinscriptionDetail.lieu_naissance || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Sexe</p>
                    <p className="font-medium text-black">{selectedPreinscriptionDetail.sexe === "M" ? "Masculin" : "Féminin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Niveau</p>
                    <p className="font-medium text-black">{selectedPreinscriptionDetail.niveau}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Classe souhaitée</p>
                    <p className="font-medium text-black">{selectedPreinscriptionDetail.classe}</p>
                  </div>
                </div>
              </div>

              {/* Documents téléchargés */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" /> Documents joints
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Acte de naissance */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-2">
                      <File className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-black">Acte de naissance</span>
                    </div>
                    {(() => {
                      const acteUrl = preinscriptionDetail?.acte_naissance_url || selectedPreinscriptionDetail?.acte_naissance_url;
                      return acteUrl ? (
                        <a
                          href={acteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                        >
                          Voir le document <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-gray-500 text-sm">Non téléchargé</p>
                      );
                    })()}
                  </div>

                  {/* Photo d'identité */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-black">Photo d'identité</span>
                    </div>
                    {(() => {
                      const photoUrl = preinscriptionDetail?.photo_url || selectedPreinscriptionDetail?.photo_url;
                      return photoUrl ? (
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                        >
                          Voir la photo <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-gray-500 text-sm">Non téléchargée</p>
                      );
                    })()}
                  </div>

                  {/* Bulletin scolaire */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-black">Bulletin scolaire</span>
                    </div>
                    {(() => {
                      const bulletinUrl = preinscriptionDetail?.bulletin_url || selectedPreinscriptionDetail?.bulletin_url;
                      return bulletinUrl ? (
                        <a
                          href={bulletinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                        >
                          Voir le bulletin <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-gray-500 text-sm">Non téléchargé</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Détail des paiements */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Détail des frais
                </h3>

                {loadingDetail ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : preinscriptionDetail?.details_frais ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      {/* Inscription - TOUJOURS affiché */}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600">Inscription</p>
                        <p className="font-bold text-blue-600">
                          {preinscriptionDetail.details_frais.inscription.toLocaleString()} GNF
                        </p>
                      </div>

                      {/* ⭐ Cantine - UNIQUEMENT si sélectionnée (montant > 0) */}
                      {preinscriptionDetail.details_frais.cantine > 0 && (
                        <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                          <p className="text-xs text-gray-600">Cantine</p>
                          <p className="font-bold text-pink-600">
                            {preinscriptionDetail.details_frais.cantine.toLocaleString()} GNF
                          </p>
                        </div>
                      )}

                      {/* ⭐ Transport - UNIQUEMENT si sélectionné (montant > 0) */}
                      {preinscriptionDetail.details_frais.transport > 0 && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-xs text-gray-600">Transport</p>
                          <p className="font-bold text-green-600">
                            {preinscriptionDetail.details_frais.transport.toLocaleString()} GNF
                          </p>
                        </div>
                      )}

                      {/* ⭐ Fournitures - UNIQUEMENT si sélectionnées (montant > 0) */}
                      {preinscriptionDetail.details_frais.librairie > 0 && (
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <p className="text-xs text-gray-600">Fournitures</p>
                          <p className="font-bold text-purple-600">
                            {preinscriptionDetail.details_frais.librairie.toLocaleString()} GNF
                          </p>
                        </div>
                      )}

                      {/* ⭐ Scolarité - UNIQUEMENT si > 0 (normalement 0 car déjà incluse) */}
                      {preinscriptionDetail.details_frais.scolarite > 0 && (
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-xs text-gray-600">Scolarité</p>
                          <p className="font-bold text-orange-600">
                            {preinscriptionDetail.details_frais.scolarite.toLocaleString()} GNF
                          </p>
                        </div>
                      )}

                      {/* Total - TOUJOURS affiché */}
                      <div className={`bg-gray-100 p-3 rounded-lg border border-gray-300 ${preinscriptionDetail.details_frais.cantine === 0 &&
                        preinscriptionDetail.details_frais.transport === 0 &&
                        preinscriptionDetail.details_frais.librairie === 0 &&
                        preinscriptionDetail.details_frais.scolarite === 0
                        ? 'col-span-2 md:col-span-1' : ''
                        }`}>
                        <p className="text-xs text-gray-600 font-semibold">Total à payer</p>
                        <p className="font-bold text-gray-800 text-lg">
                          {preinscriptionDetail.details_frais.total.toLocaleString()} GNF
                        </p>
                      </div>
                    </div>

                    {/* ⭐ Message récapitulatif des services sélectionnés */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-1">Services sélectionnés :</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-900">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          Inscription
                        </span>
                        {preinscriptionDetail.details_frais.cantine > 0 && (
                          <span className="flex items-center gap-1 text-gray-900">
                            <CheckCircle className="w-4 h-4 text-pink-600" />
                            Cantine
                          </span>
                        )}
                        {preinscriptionDetail.details_frais.transport > 0 && (
                          <span className="flex items-center gap-1 text-gray-900">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Transport
                          </span>
                        )}
                        {preinscriptionDetail.details_frais.librairie > 0 && (
                          <span className="flex items-center gap-1 text-gray-900">
                            <CheckCircle className="w-4 h-4 text-purple-600" />
                            Fournitures
                          </span>
                        )}
                        {preinscriptionDetail.details_frais.scolarite > 0 && (
                          <span className="flex items-center gap-1 text-gray-900">
                            <CheckCircle className="w-4 h-4 text-orange-600" />
                            Scolarité
                          </span>
                        )}
                        {/* ⭐ Si aucun service optionnel n'est sélectionné */}
                        {preinscriptionDetail.details_frais.cantine === 0 &&
                          preinscriptionDetail.details_frais.transport === 0 &&
                          preinscriptionDetail.details_frais.librairie === 0 &&
                          preinscriptionDetail.details_frais.scolarite === 0 && (
                            <span className="text-gray-500 text-xs italic">Aucun service optionnel</span>
                          )}
                      </div>
                    </div>

                    {/* Résumé des paiements */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600">Déjà payé</p>
                        <p className="font-bold text-green-600">
                          {preinscriptionDetail.details_frais.paye.toLocaleString()} GNF
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Reste à payer</p>
                        <p className={`font-bold ${preinscriptionDetail.details_frais.reste > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {preinscriptionDetail.details_frais.reste.toLocaleString()} GNF
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Statut</p>
                        {preinscriptionDetail.details_frais.reste === 0 ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Tout payé
                          </span>
                        ) : preinscriptionDetail.details_frais.paye > 0 ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Partiel
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Non payé
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barre de progression */}
                    {preinscriptionDetail.details_frais.total > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progression des paiements</span>
                          <span>
                            {Math.round((preinscriptionDetail.details_frais.paye / preinscriptionDetail.details_frais.total) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (preinscriptionDetail.details_frais.paye / preinscriptionDetail.details_frais.total) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Chargement des informations de frais...</p>
                  </div>
                )}
              </div>

              {/* Fermer */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation d'annulation */}
      {showConfirmModal && preinscriptionToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Annuler la pré-inscription</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-900 mb-2">
                Êtes-vous sûr de vouloir annuler cette pré-inscription ?
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mb-4">
                {preinscriptionToCancel.enfant_prenom} {preinscriptionToCancel.enfant_nom} - {preinscriptionToCancel.classe}
              </p>
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cette action est irréversible et supprimera définitivement la pré-inscription.
              </p>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPreinscriptionToCancel(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition text-black"
                disabled={cancelling}
              >
                Annuler
              </button>
              <button
                onClick={handleCancelPreinscription}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Annulation...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmer l'annulation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Paiement */}
      {showPaiementModal && selectedPreinscription && (
        <PaiementPlanModal
          isOpen={showPaiementModal}
          onClose={() => {
            setShowPaiementModal(false);
            setSelectedPreinscription(null);
          }}
          onSuccess={() => {
            fetchData();
            addNotification("success", "Paiement effectué avec succès !");
          }}
          preinscriptionId={selectedPreinscription.id}
          enfantNom={`${selectedPreinscription.enfant_prenom} ${selectedPreinscription.enfant_nom}`}
          niveau={selectedPreinscription.niveau}
        />
      )}
    </div>
  );
}