// app/dashboard/parent/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Utensils
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
  niveau: string;
  classe: string;
  statut: "en_attente" | "valide" | "rejete";
  date_preinscription: string;
  frais_statut: string;
  frais_montant: number;
  photo_url: string | null;
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
  solde_restant: number;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

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
    try {
      const [enfantsRes, preinscriptionsRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch("/api/parent/preinscriptions")
      ]);

      const enfantsData = await enfantsRes.json();
      const preinscriptionsData = await preinscriptionsRes.json();

      setEnfants(enfantsData);

      // Ne garder que les pré-inscriptions en attente
      const preinscriptionsEnAttente = preinscriptionsData.filter(p => p.statut === "en_attente");
      setPreinscriptions(preinscriptionsEnAttente);

      // Charger les statistiques pour chaque enfant
      for (const enfant of enfantsData) {
        const statsResponse = await fetch(`/api/parent/enfants/${enfant.eleve_id}/stats`);
        const statsData = await statsResponse.json();
        setStatsEnfant(prev => ({ ...prev, [enfant.eleve_id]: statsData }));
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
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
    return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  // Calcul des statistiques globales avec toutes les catégories
  const statsGlobales = {
    totalEnfants: enfants.length,
    totalPreinscriptions: preinscriptions.length,
    preinscriptionsEnAttente: preinscriptions.filter(p => p.statut === "en_attente").length,
    preinscriptionsPayees: preinscriptions.filter(p => p.frais_statut === "paye").length,
    totalAbsences: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.presences?.absents) || 0), 0),
    totalRetards: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.presences?.retards) || 0), 0),
    
    // Totaux par catégorie
    totalFraisInscription: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.frais_inscription) || 0), 0),
    totalTransport: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.transport) || 0), 0),
    totalCantine: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.cantine) || 0), 0),
    totalFournitures: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.fournitures) || 0), 0),
    totalScolarite: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.scolarite) || 0), 0),
    
    // Totaux globaux
    totalFraisGeneral: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.total_frais_general) || 0), 0),
    totalPaye: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.paiements?.total_paye) || 0), 0),
    soldeRestant: Object.values(statsEnfant).reduce((acc, s) => acc + (Number(s.solde_restant) || 0), 0),
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

      {/* Statistiques globales simplifiées */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalPreinscriptions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><Calendar className="w-5 h-5" /><p className="text-sm">Absences totales</p></div>
          <p className="text-2xl font-bold text-orange-600">{statsGlobales.totalAbsences}</p>
          <p className="text-xs text-gray-900">Retards: {statsGlobales.totalRetards}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><CreditCard className="w-5 h-5" /><p className="text-sm">Solde restant</p></div>
          <p className="text-lg font-bold text-red-600">{statsGlobales.soldeRestant.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Détail des frais par catégorie */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          Détail des frais scolaires
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Inscription</p>
            <p className="text-sm font-bold text-blue-600">{statsGlobales.totalFraisInscription.toLocaleString()} GNF</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Transport</p>
            <p className="text-sm font-bold text-green-600">{statsGlobales.totalTransport.toLocaleString()} GNF</p>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Cantine</p>
            <p className="text-sm font-bold text-pink-600">{statsGlobales.totalCantine.toLocaleString()} GNF</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Fournitures</p>
            <p className="text-sm font-bold text-purple-600">{statsGlobales.totalFournitures.toLocaleString()} GNF</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Scolarité</p>
            <p className="text-sm font-bold text-orange-600">{statsGlobales.totalScolarite.toLocaleString()} GNF</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total général :</span>
            <span className="text-sm font-bold text-blue-700">{statsGlobales.totalFraisGeneral.toLocaleString()} GNF</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Déjà payé :</span>
            <span className="text-sm font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Solde :</span>
            <span className={`text-sm font-bold ${statsGlobales.soldeRestant > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {statsGlobales.soldeRestant.toLocaleString()} GNF
            </span>
          </div>
          {/* Barre de progression */}
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${statsGlobales.totalFraisGeneral > 0 
                    ? Math.min(100, (statsGlobales.totalPaye / statsGlobales.totalFraisGeneral) * 100) 
                    : 0}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-500 text-right mt-1">
              {statsGlobales.totalFraisGeneral > 0 
                ? Math.round((statsGlobales.totalPaye / statsGlobales.totalFraisGeneral) * 100) 
                : 0}% payé
            </p>
          </div>
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
              Nouvelle pré-inscription
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
                      <div className="mt-3 flex gap-2">
                        {p.frais_statut !== "paye" && p.statut === "en_attente" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPreinscription(p);
                                setShowPaiementModal(true);
                              }}
                              className="flex-1 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                            >
                              Payer l'inscription
                            </button>
                            <button
                              onClick={() => openConfirmCancel(p)}
                              className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                              title="Annuler la pré-inscription"
                            > Supprimer
                              <Trash2 className="w-4 h-4" />
                            </button>
                             {/* Section Pré-inscriptions 
                            <Link
                              href={`/dashboard/parent/transport?preinscriptionId=${p.id}`}
                              className="flex-1 bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                              <Bus className="w-4 h-4" />
                              Transport
                            </Link>
                            <Link
                              href={`/dashboard/parent/cantine?preinscriptionId=${p.id}`}
                              className="flex-1 bg-pink-600 text-white text-sm py-1.5 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Cantine
                            </Link>*/}
                          </>
                        )}
                        {p.frais_statut === "paye" && p.statut === "en_attente" && (
                          <div className="flex-1 bg-yellow-100 text-yellow-700 text-sm py-1.5 rounded-lg text-center">
                            En attente de validation
                          </div>
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

      {/* Liste des enfants inscrits */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-blue-600" />
        Mes enfants inscrits
      </h2>

      {enfants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="w-16 h-16 text-gray-900 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucun enfant inscrit</h3>
          <p className="text-gray-900 mt-2">Vous n'avez pas encore d'enfant inscrit dans l'école.</p>
          <Link href="/register" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Inscrire un enfant</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {enfants.map((enfant) => {
            const stats = statsEnfant[enfant.eleve_id];

            return (
              <div key={enfant.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition">
                <div className="bg-blue-600 p-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        {enfant.photo_url ? (
                          <img src={enfant.photo_url} alt="photo" className="w-12 h-12 rounded-full object-cover border-2 border-white" />
                        ) : (
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h3>
                          <p className="text-sm opacity-90">{enfant.classe_nom}</p>
                          <p className="text-xs opacity-75 mt-1">Matricule: {enfant.matricule}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {stats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Absences/Retards</span>
                        <span className="font-medium text-orange-600">{stats.presences?.absents || 0} abs. / {stats.presences?.retards || 0} ret.</span>
                      </div>

                      {/* Détail des frais par catégorie */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">Détail des frais :</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Inscription :</span>
                            <span className="font-medium text-blue-600">{stats.frais_inscription?.toLocaleString() || 0} GNF</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transport :</span>
                            <span className="font-medium text-green-600">{stats.transport?.toLocaleString() || 0} GNF</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cantine :</span>
                            <span className="font-medium text-pink-600">{stats.cantine?.toLocaleString() || 0} GNF</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fournitures :</span>
                            <span className="font-medium text-purple-600">{stats.fournitures?.toLocaleString() || 0} GNF</span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span className="text-gray-600">Scolarité (mensualités) :</span>
                            <span className="font-medium text-orange-600">{stats.scolarite?.toLocaleString() || 0} GNF</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                          <span className="text-xs font-semibold text-gray-700">Total à payer :</span>
                          <span className="text-sm font-bold text-blue-700">{stats.total_frais_general?.toLocaleString() || 0} GNF</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600">Déjà payé :</span>
                          <span className="text-xs font-medium text-green-600">{stats.paiements?.total_paye?.toLocaleString() || 0} GNF</span>
                        </div>
                        
                        {stats.solde_restant > 0 ? (
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-600">Solde :</span>
                            <span className="text-xs font-medium text-red-600">{stats.solde_restant.toLocaleString()} GNF</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-600">Statut :</span>
                            <span className="text-xs font-medium text-green-600">✅ Tout est payé</span>
                          </div>
                        )}
                      </div>

                      {/* Barre de progression des paiements */}
                      {stats.total_frais_general > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-900 mb-1">
                            <span>Progression des paiements</span>
                            <span>{Math.round(((stats.paiements?.total_paye || 0) / stats.total_frais_general) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, ((stats.paiements?.total_paye || 0) / stats.total_frais_general) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Détail des derniers paiements */}
                      {stats.paiements?.details && stats.paiements.details.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-900 mb-2">Derniers paiements:</p>
                          <div className="space-y-1">
                            {stats.paiements.details.slice(0, 2).map((p, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-black">{new Date(p.date_paiement).toLocaleDateString()}</span>
                                <span className="font-medium text-green-600">{p.montant.toLocaleString()} GNF</span>
                                <span className="text-black capitalize">{p.mode_paiement}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matières */}
                      {stats.notes && stats.notes.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-900 mb-1">Matières:</p>
                          <div className="flex flex-wrap gap-1">
                            {stats.notes.slice(0, 3).map((note, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                {note.matiere}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <Link
                    href={`/dashboard/parent/enfants/${enfant.eleve_id}`}
                    className="w-full mt-3 text-blue-600 text-sm font-medium flex items-center justify-center gap-1 hover:gap-2 transition-all"
                  >
                    Voir le détail <Eye className="w-4 h-4" />
                  </Link>
                  <div className="flex gap-2 mt-2">
                    <Link
                      href={`/dashboard/parent/transport?enfantId=${enfant.eleve_id}`}
                      className="flex-1 bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                      <Bus className="w-4 h-4" /> Transport
                    </Link>
                    <Link
                      href={`/dashboard/parent/cantine?enfantId=${enfant.eleve_id}`}
                      className="flex-1 bg-pink-600 text-white text-sm py-1.5 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2"
                    >
                      <Utensils className="w-4 h-4" /> Cantine
                    </Link>
                    <Link
                      href={`/dashboard/parent/librairie?enfantId=${enfant.eleve_id}`}
                      className="flex-1 bg-purple-600 text-white text-sm py-1.5 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" /> Librairie
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Link href="/dashboard/parent/messages" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
            <MessageSquare className="w-6 h-6 text-blue-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Messagerie</p>
        </Link>
        <Link href="/dashboard/parent/transport" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition">
            <Bus className="w-6 h-6 text-green-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Transport</p>
        </Link>
        <Link href="/dashboard/parent/finances" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition">
            <CreditCard className="w-6 h-6 text-purple-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Finances</p>
        </Link>
        <Link href="/dashboard/parent/emploi-temps" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-yellow-600 transition">
            <Calendar className="w-6 h-6 text-yellow-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Emploi du temps</p>
        </Link>
      </div>

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 ">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-black">Paiement des frais d'inscription</h2>
              <p className="text-gray-900 text-sm">
                {selectedPreinscription.enfant_prenom} {selectedPreinscription.enfant_nom} - {selectedPreinscription.classe}
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-900">Montant à payer</p>
                <p className="text-2xl font-bold text-blue-700">{selectedPreinscription.frais_montant.toLocaleString()} GNF</p>
              </div>

              <div>
                <label className="block text-gray-900 mb-2">Mode de paiement *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setModePaiement("especes")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${modePaiement === "especes"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <Wallet className="w-6 h-6 text-green-900" />
                    <span className="text-xs text-black">Espèces</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModePaiement("orange_money")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${modePaiement === "orange_money"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <Smartphone className="w-6 h-6 text-orange-600" />
                    <span className="text-xs text-black">Orange Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModePaiement("carte")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${modePaiement === "carte"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <CreditCard className="w-6 h-6 text-blue-700" />
                    <span className="text-xs text-black">Carte Visa</span>
                  </button>
                </div>
              </div>

              {modePaiement === "especes" && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Paiement en espèces à effectuer à la caisse de l'école.
                    Un email sera envoyé au comptable pour validation.
                  </p>
                </div>
              )}

              {(modePaiement === "orange_money" || modePaiement === "carte") && (
                <div>
                  <label className="block text-gray-900 mb-2">Numéro de transaction</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={modePaiement === "orange_money" ? "Ex: #OM-123456789" : "Ex: VISA-****-1234"}
                    className=" text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-900 mt-1">
                    {modePaiement === "orange_money"
                      ? "Entrez le numéro de transaction reçu par SMS"
                      : "Entrez le numéro de transaction de votre carte"}
                  </p>
                </div>
              )}

              <button
                onClick={handlePaiement}
                disabled={!modePaiement || paiementLoading}
                className={`w-full py-3 rounded-lg font-semibold transition ${!modePaiement || paiementLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {paiementLoading ? "Traitement..." : "Confirmer le paiement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}