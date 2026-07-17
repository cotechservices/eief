// app/dashboard/parent/reinscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import ReinscriptionPaiementModal from "@/components/ReinscriptionPaiementModal";
import {
  RefreshCw,
  Users,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  FileText,
  AlertTriangle,
  X,
  CreditCard,
  Wallet,
  Smartphone,
  User,
  Bus,
  Utensils,
  ShoppingCart,
  Plus,
  Minus,
  UserPlus,
  Trash2
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
  frais_reinscription_classe: number; 
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

interface Fourniture {
  id: number;
  nom: string;
  prix_unitaire: number;
  selectedQty: number;
}

interface TransportOption {
  id: number;
  nom: string;
  prix: number;
  selected: boolean;
  horaireMatin?: string;
  horaireSoir?: string;
}

interface CantineOption {
  id: number;
  nom: string;
  prix: number;
  prix_annuel: number;
  selected: boolean;
  date?: string;
  plat?: string;
  accompagnement?: string;
  dessert?: string;
}

interface Reinscription {
  id: number;
  numero_dossier: string;
  date_reinscription: string;
  statut: "en_attente" | "valide" | "rejete";
  observations: string | null;
  montant_frais: number;
  frais_statut: string;
  frais_mode_paiement: string | null;
  enfant_nom: string;
  enfant_prenom: string;
  classe_nom: string | null;
  photo_url: string | null;
  acte_naissance_url: string | null;
  bulletin_url: string | null;
  matricule: string;
  classe_actuelle_nom: string | null;
  annee_scolaire: string | null;
  montant_total_plan: number;
  montant_restant_plan: number;
  echeances: {
    id: number;
    type: string;
    echeance: string;
    montant: number;
    statut: string;
    date_echeance: string;
    date_paiement: string | null;
    reference_transaction: string | null;
    mode_paiement: string | null;
  }[];
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  transport_montant: number;
  cantine_montant: number;
  fournitures_montant: number;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function ReinscriptionParentPage() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [reinscriptions, setReinscriptions] = useState<Reinscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [selectedEnfant, setSelectedEnfant] = useState<Enfant | null>(null);
  const [selectedClasseId, setSelectedClasseId] = useState<number | null>(null);
  const [selectedNiveau, setSelectedNiveau] = useState("");

  // Services optionnels
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [cantineOptions, setCantineOptions] = useState<CantineOption[]>([]);
  const [supplies, setSupplies] = useState<Fourniture[]>([]);
  const [totalTransport, setTotalTransport] = useState(0);
  const [totalCantine, setTotalCantine] = useState(0);
  const [totalFournitures, setTotalFournitures] = useState(0);
  const [loadingServices, setLoadingServices] = useState(false);

  // ⭐ États pour le modal de paiement
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedReinscription, setSelectedReinscription] = useState<Reinscription | null>(null);

  // ⭐ États pour le modal de confirmation d'annulation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReinscriptionId, setCancelReinscriptionId] = useState<number | null>(null);
  const [cancelEnfantNom, setCancelEnfantNom] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // ⭐ Fonction pour ouvrir le modal de paiement
  const handleOpenPaiement = (reinscription: Reinscription) => {
    setSelectedReinscription(reinscription);
    setShowPaiementModal(true);
  };

  // ⭐ Fonction pour ouvrir le modal de confirmation d'annulation
  const handleCancelClick = (reinscriptionId: number, enfantNom: string) => {
    setCancelReinscriptionId(reinscriptionId);
    setCancelEnfantNom(enfantNom);
    setShowCancelModal(true);
  };

  // ⭐ Fonction pour confirmer l'annulation
  const confirmCancelReinscription = async () => {
    if (!cancelReinscriptionId) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/parent/reinscriptions/${cancelReinscriptionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        addNotification("success", `Réinscription de ${cancelEnfantNom} annulée avec succès`);
        fetchData();
        setShowCancelModal(false);
        setCancelReinscriptionId(null);
        setCancelEnfantNom("");
      } else {
        addNotification("error", data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur annulation:", error);
      addNotification("error", "Une erreur est survenue lors de l'annulation");
    } finally {
      setIsCancelling(false);
    }
  };

  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCancelReinscription = async (reinscriptionId: number, enfantNom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler la réinscription de ${enfantNom} ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/parent/reinscriptions/${reinscriptionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        addNotification("success", `Réinscription de ${enfantNom} annulée avec succès`);
        fetchData(); // Rafraîchir la liste
      } else {
        addNotification("error", data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur annulation:", error);
      addNotification("error", "Une erreur est survenue lors de l'annulation");
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Charger les services optionnels quand un enfant est sélectionné
  useEffect(() => {
    if (selectedEnfant) {
      fetchServices();
    }
  }, [selectedEnfant]);

  const fetchData = async () => {
    try {
      const [enfantsRes, classesRes, reinscriptionsRes] = await Promise.all([
        fetch("/api/parent/enfants"),
        fetch("/api/public/classes"),
        fetch("/api/parent/reinscriptions")
      ]);

      const enfantsData = await enfantsRes.json();
      const classesData = await classesRes.json();
      const reinscriptionsData = await reinscriptionsRes.json();

      setEnfants(Array.isArray(enfantsData) ? enfantsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setReinscriptions(Array.isArray(reinscriptionsData) ? reinscriptionsData : []);
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Charger les services optionnels
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const [transportRes, cantineRes, fournituresRes] = await Promise.all([
        fetch("/api/public/transport"),
        fetch("/api/public/cantine"),
        fetch("/api/public/librairie")
      ]);

      const transportData = await transportRes.json();
      const cantineData = await cantineRes.json();
      const fournituresData = await fournituresRes.json();

      if (Array.isArray(transportData) && transportData.length > 0) {
        setTransportOptions(transportData.map((item: any) => ({
          id: item.id,
          nom: item.nom || "Transport scolaire",
          prix: Number(item.prix) || 0,
          selected: false,
          horaireMatin: item.horaire_matin || "07:30",
          horaireSoir: item.horaire_soir || "16:30"
        })));
      }

      if (Array.isArray(cantineData) && cantineData.length > 0) {
        setCantineOptions(cantineData.map((item: any) => ({
          id: item.id,
          nom: item.plat || "Menu du jour",
          prix: Number(item.prix) || 0,
          prix_annuel: Number(item.prix_annuel) || 0,
          selected: false,
          date: item.date,
          plat: item.plat,
          accompagnement: item.accompagnement,
          dessert: item.dessert
        })));
      }

      if (Array.isArray(fournituresData) && fournituresData.length > 0) {
        setSupplies(fournituresData.map((item: any) => ({
          id: item.id,
          nom: item.nom || "Fourniture",
          prix_unitaire: item.prix || 0,
          selectedQty: 0
        })));
      }
    } catch (error) {
      console.error("Erreur chargement services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const getNiveauxOptions = () => {
    return [...new Set(classes.map(c => c.niveau))];
  };

  const getClassesForNiveau = (niveauNom: string) => {
    return classes.filter(c => c.niveau === niveauNom);
  };

  const hasActiveReinscription = (eleveId: number) => {
    return reinscriptions.some(r => {
      const enfant = enfants.find(e => e.eleve_id === eleveId);
      if (!enfant) return false;
      return r.enfant_nom === enfant.nom && r.enfant_prenom === enfant.prenom && r.statut === "en_attente";
    });
  };

  const handleSelectEnfant = (enfant: Enfant) => {
    setSelectedEnfant(enfant);
    setSelectedNiveau("");
    setSelectedClasseId(null);
    // Réinitialiser les services
    setTransportOptions(prev => prev.map(t => ({ ...t, selected: false })));
    setCantineOptions(prev => prev.map(c => ({ ...c, selected: false })));
    setSupplies(prev => prev.map(s => ({ ...s, selectedQty: 0 })));
    setTotalTransport(0);
    setTotalCantine(0);
    setTotalFournitures(0);
  };

  // Gestion des services
  const toggleTransport = (index: number) => {
    const newOptions = [...transportOptions];
    newOptions[index].selected = !newOptions[index].selected;
    setTransportOptions(newOptions);
    const total = newOptions.filter(o => o.selected).reduce((sum, o) => sum + o.prix, 0);
    setTotalTransport(total);
  };

  const toggleCantine = (index: number) => {
    const newOptions = [...cantineOptions];
    newOptions[index].selected = !newOptions[index].selected;
    setCantineOptions(newOptions);
    const total = newOptions.filter(o => o.selected).reduce((sum, o) => sum + (o.prix_annuel || 0), 0);
    setTotalCantine(total);
  };

  const handleSupplyChange = (index: number, delta: number) => {
    // ⭐ Utiliser la forme fonctionnelle de setState avec calcul immédiat
    setSupplies(prev => {
      // Créer le nouveau tableau
      const newSupplies = prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          selectedQty: Math.max(0, Math.min(item.selectedQty + delta, item.quantite_stock || 999))
        };
      });

      // ⭐ Calculer le total à partir du nouveau tableau
      const total = newSupplies.reduce((sum, item) => sum + (item.prix_unitaire * item.selectedQty), 0);
      setTotalFournitures(total);

      return newSupplies;
    });
  };

  // Calcul du total général
  const getTotalServices = () => {
    return totalTransport + totalCantine + totalFournitures;
  };

  const getMontantTotal = () => {
    const fraisBase = selectedEnfant?.frais_reinscription_classe || selectedEnfant?.frais_inscription_classe || 500000;
    return fraisBase + getTotalServices();
  };

  const handleSubmitReinscription = async () => {
    if (!selectedEnfant || !selectedClasseId) return;

    setSubmitting(true);
    try {
      const fraisBase = selectedEnfant.frais_reinscription_classe || selectedEnfant.frais_inscription_classe || 500000;

      const response = await fetch("/api/parent/reinscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eleveId: selectedEnfant.eleve_id,
          classeId: selectedClasseId,
          montantFrais: fraisBase,
          transport: transportOptions.filter(t => t.selected).map(t => ({ id: t.id, prix: t.prix })),
          cantine: cantineOptions.filter(c => c.selected).map(c => ({ id: c.id, prix: c.prix_annuel })),
          fournitures: supplies.filter(s => s.selectedQty > 0).map(s => ({ id: s.id, quantite: s.selectedQty, prix_unitaire: s.prix_unitaire })),
          montantTransport: totalTransport,
          montantCantine: totalCantine,
          montantFournitures: totalFournitures,
          montantTotal: getMontantTotal()
        }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification("success", `Demande de réinscription envoyée pour ${selectedEnfant.prenom} ${selectedEnfant.nom} !`);
        setShowForm(false);
        setSelectedEnfant(null);
        setSelectedClasseId(null);
        setSelectedNiveau("");
        fetchData();
      } else {
        addNotification("error", data.error || "Erreur lors de la soumission");
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case "valide":
        return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validée</span>;
      case "rejete":
        return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejetée</span>;
      default:
        return null;
    }
  };

  // app/dashboard/parent/reinscription/page.tsx

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    if (fraisStatut === "partiel") {
      return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Partiel</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  const niveauxOptions = getNiveauxOptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${notification.type === "success" ? "bg-green-50 border-l-4 border-green-500 text-green-800"
              : notification.type === "error" ? "bg-red-50 border-l-4 border-red-500 text-red-800"
                : notification.type === "warning" ? "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800"
                  : "bg-blue-50 border-l-4 border-blue-500 text-blue-800"
              }`}
          >
            <div className="flex-1">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notification.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button onClick={() => removeNotification(notification.id)} className="ml-4 text-gray-500 hover:text-gray-700 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-green-600" />
            Réinscription
          </h1>
          <p className="text-gray-900">Réinscrire vos enfants pour la prochaine année scolaire</p>
        </div>
        {!showForm && enfants.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg hover:bg-green-800 transition flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
            Nouvelle réinscription
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Enfants inscrits</p>
              <p className="text-2xl font-bold text-blue-600">{enfants.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Demandes totales</p>
              <p className="text-2xl font-bold text-purple-600">{reinscriptions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{reinscriptions.filter(r => r.statut === "en_attente").length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Validées</p>
              <p className="text-2xl font-bold text-green-600">{reinscriptions.filter(r => r.statut === "valide").length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Formulaire de réinscription */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-black flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-600" />
              Nouvelle demande de réinscription
            </h2>
            <button onClick={() => { setShowForm(false); setSelectedEnfant(null); setSelectedClasseId(null); setSelectedNiveau(""); }}
              className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Étape 1 : Sélection de l'enfant */}
          {!selectedEnfant ? (
            <div className="space-y-4">
              <p className="text-gray-700 mb-4">Sélectionnez l'enfant à réinscrire :</p>

              {enfants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun enfant inscrit</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {enfants.map((enfant) => {
                    const alreadyPending = hasActiveReinscription(enfant.eleve_id);
                    return (
                      <div
                        key={enfant.id}
                        onClick={() => !alreadyPending && handleSelectEnfant(enfant)}
                        className={`border-2 rounded-xl p-4 transition ${alreadyPending
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:border-green-500 hover:shadow-md cursor-pointer"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          {enfant.photo_url ? (
                            <img src={enfant.photo_url} alt="photo" className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-7 h-7 text-blue-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-black text-lg">{enfant.prenom} {enfant.nom}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" />
                              {enfant.classe_nom || "Classe non assignée"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Matricule: {enfant.matricule}</p>
                          </div>
                          {alreadyPending ? (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" /> En attente
                            </span>
                          ) : (
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Étape 2 : Sélection de la nouvelle classe + Services */
            <div className="space-y-6">
              {/* Enfant sélectionné */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  {selectedEnfant.photo_url ? (
                    <img src={selectedEnfant.photo_url} alt="photo" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-blue-900">{selectedEnfant.prenom} {selectedEnfant.nom}</h3>
                    <p className="text-sm text-blue-700">Classe actuelle : {selectedEnfant.classe_nom || "Non assignée"} • Matricule: {selectedEnfant.matricule}</p>
                  </div>
                  <button onClick={() => { setSelectedEnfant(null); setSelectedClasseId(null); setSelectedNiveau(""); }}
                    className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline">
                    Changer
                  </button>
                </div>
              </div>

              {/* Sélection du niveau */}
              <div>
                <label className="block text-gray-900 font-medium mb-2">Nouveau niveau *</label>
                <select
                  value={selectedNiveau}
                  onChange={(e) => {
                    setSelectedNiveau(e.target.value);
                    setSelectedClasseId(null);
                  }}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                >
                  <option value="">Sélectionner le niveau</option>
                  {niveauxOptions.map((niveau) => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>

              {/* Sélection de la classe */}
              {selectedNiveau && (
                <div>
                  <label className="block text-gray-900 font-medium mb-2">Nouvelle classe *</label>
                  <div className="grid md:grid-cols-3 gap-3">
                    {getClassesForNiveau(selectedNiveau).map((classe) => (
                      <div
                        key={classe.id}
                        onClick={() => setSelectedClasseId(classe.id)}
                        className={`border-2 rounded-lg p-3 text-center cursor-pointer transition ${selectedClasseId === classe.id
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-green-300 text-gray-900"
                          }`}
                      >
                        <GraduationCap className={`w-6 h-6 mx-auto mb-1 ${selectedClasseId === classe.id ? "text-green-600" : "text-gray-400"}`} />
                        <p className="font-medium">{classe.nom}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SERVICES OPTIONNELS */}
              {selectedClasseId && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-black flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    Services optionnels
                  </h3>

                  {/* Transport */}
                  {transportOptions.length > 0 && (
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50/30">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <Bus className="w-5 h-5" />
                        Transport scolaire
                      </h4>
                      <div className="space-y-2">
                        {transportOptions.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.nom}</p>
                              <p className="text-xs text-gray-500">{item.prix.toLocaleString()} GNF</p>
                              {item.horaireMatin && item.horaireSoir && (
                                <p className="text-xs text-gray-400">Horaire: {item.horaireMatin} - {item.horaireSoir}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTransport(idx)}
                              className={`px-4 py-1.5 rounded-lg text-sm transition ${item.selected
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                }`}
                            >
                              {item.selected ? "✓ Sélectionné" : "Ajouter"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cantine */}
                  {cantineOptions.length > 0 && (
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                        <Utensils className="w-5 h-5" />
                        Cantine scolaire
                      </h4>
                      <div className="space-y-2">
                        {cantineOptions.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.nom}</p>
                              <p className="text-xs text-orange-600 font-semibold">{item.prix_annuel.toLocaleString()} GNF</p>
                              {item.plat && <p className="text-xs text-gray-400">{item.plat}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCantine(idx)}
                              className={`px-4 py-1.5 rounded-lg text-sm transition ${item.selected
                                ? "bg-orange-600 text-white hover:bg-orange-700"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                }`}
                            >
                              {item.selected ? "✓ Sélectionné" : "Ajouter"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fournitures */}
                  {supplies.length > 0 && (
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
                      <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Fournitures scolaires
                      </h4>
                      <div className="space-y-2">
                        {supplies.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.nom}</p>
                              <p className="text-xs text-gray-500">{item.prix_unitaire.toLocaleString()} GNF</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSupplyChange(idx, -1)}
                                className="w-7 h-7 rounded-full text-gray-400 border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                disabled={item.selectedQty === 0}
                              >
                                <Minus className="w-3 h-3 text-black" />
                              </button>
                              <span className="w-6 text-center font-medium">{item.selectedQty}</span>
                              <button
                                type="button"
                                onClick={() => handleSupplyChange(idx, 1)}
                                className="w-7 h-7 rounded-full text-gray-400 border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                disabled={item.selectedQty >= item.quantite_stock}
                              >
                                <Plus className="w-3 h-3 text-black" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total services */}
                  {(totalTransport > 0 || totalCantine > 0 || totalFournitures > 0) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="space-y-1 text-sm">
                        {totalTransport > 0 && (
                          <div className="flex justify-between">
                            <span className="text-green-600">Transport</span>
                            <span className="font-medium text-green-600">{totalTransport.toLocaleString()} GNF</span>
                          </div>
                        )}
                        {totalCantine > 0 && (
                          <div className="flex justify-between">
                            <span className="text-orange-600">Cantine</span>
                            <span className="font-medium text-orange-600">{totalCantine.toLocaleString()} GNF</span>
                          </div>
                        )}
                        {totalFournitures > 0 && (
                          <div className="flex justify-between">
                            <span className="text-purple-600">Fournitures</span>
                            <span className="font-medium text-purple-600">{totalFournitures.toLocaleString()} GNF</span>
                          </div>
                        )}
                        <div className="border-t text-blue-700 pt-1 flex justify-between font-bold">
                          <span>Total services</span>
                          <span className="text-blue-600">{getTotalServices().toLocaleString()} GNF</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Récapitulatif */}
              {/* Récapitulatif */}
{/* Récapitulatif - CORRIGÉ */}
{selectedClasseId && (
  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
    <h4 className="font-semibold text-black mb-2">Récapitulatif</h4>
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-900">Frais de réinscription</span>
        <span className="font-medium text-black">
          {/* ⭐ CORRECTION : Utiliser frais_reinscription_classe en priorité */}
          {(selectedEnfant.frais_reinscription_classe || selectedEnfant.frais_inscription_classe || 500000).toLocaleString()} GNF
        </span>
      </div>
      {totalTransport > 0 && (
        <div className="flex justify-between">
          <span className="text-green-600">Transport</span>
          <span className="font-medium text-green-600">{totalTransport.toLocaleString()} GNF</span>
        </div>
      )}
      {totalCantine > 0 && (
        <div className="flex justify-between">
          <span className="text-orange-600">Cantine</span>
          <span className="font-medium text-orange-600">{totalCantine.toLocaleString()} GNF</span>
        </div>
      )}
      {totalFournitures > 0 && (
        <div className="flex justify-between">
          <span className="text-purple-600">Fournitures</span>
          <span className="font-medium text-purple-600">{totalFournitures.toLocaleString()} GNF</span>
        </div>
      )}
      <div className="border-t pt-1 text-blue-700 flex justify-between font-bold text-lg">
        <span>Total</span>
        <span className="text-blue-700">{getMontantTotal().toLocaleString()} GNF</span>
      </div>
    </div>
  </div>
)}

              {/* Boutons */}
              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => { setSelectedEnfant(null); setSelectedClasseId(null); setSelectedNiveau(""); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-black"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmitReinscription}
                  disabled={!selectedClasseId || submitting}
                  className={`px-6 py-2.5 rounded-lg transition flex items-center gap-2 ${selectedClasseId && !submitting
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Soumettre la réinscription</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des réinscriptions - AVEC BOUTON ANNULER */}
      {/* Liste des réinscriptions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Mes demandes de réinscription
          </h2>
        </div>

        {reinscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900">Aucune demande de réinscription</p>
          </div>
        ) : (
          <div className="divide-y">
            {reinscriptions.map((r) => (
              <div key={r.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  {/* Photo */}
                  {r.photo_url ? (
                    <img src={r.photo_url} alt="photo" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      {/* Infos enfant */}
                      <div>
                        <h3 className="font-semibold text-black">{r.enfant_prenom} {r.enfant_nom}</h3>
                        <p className="text-sm text-gray-600">
                          {r.classe_actuelle_nom && <span>De: {r.classe_actuelle_nom} → </span>}
                          <span className="font-medium text-green-700">Vers: {r.classe_nom || "N/A"}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Matricule: {r.matricule} • Soumis le {new Date(r.date_reinscription).toLocaleDateString("fr-FR")}
                          {r.annee_scolaire && <span> • {r.annee_scolaire}</span>}
                        </p>
                      </div>

                      {/* ⭐ STATUT ET MONTANTS - CORRIGÉ */}
                      <div className="flex flex-col items-end gap-1">
                        {getStatutBadge(r.statut)}
                        {getFraisBadge(r.frais_statut)}
                        
                        {/* Affichage des montants avec restant */}
                        {r.montant_total > 0 && (
                          <div className="text-right mt-1 space-y-0.5">
                            <div className="text-xl text-gray-900">
                              Total : <span className="font-semibold text-blue-600">{r.montant_total.toLocaleString()} GNF</span>
                            </div>
                            {r.montant_paye > 0 && (
                              <div className="text-xl text-gray-900">
                                Payé : <span className="font-semibold text-green-600">{r.montant_paye.toLocaleString()} GNF</span>
                              </div>
                            )}
                            {r.montant_restant > 0 && (
                              <div className="text-xl text-gray-900">
                                Restant : <span className="font-semibold text-red-600">{r.montant_restant.toLocaleString()} GNF</span>
                              </div>
                            )}
                            {r.montant_restant === 0 && r.montant_total > 0 && (
                              <div className="text-xs text-green-600 font-semibold">✅ Entièrement payé</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3">
                      {r.statut === "en_attente" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={`text-sm py-2 px-3 rounded-lg flex items-center gap-2 flex-1 ${
                            r.frais_statut === 'paye' 
                              ? 'bg-green-50 text-green-700' 
                              : r.frais_statut === 'partiel'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {r.frais_statut === 'paye' ? (
                              <><CheckCircle className="w-4 h-4" /> Paiement complété - En attente de validation...</>
                            ) : r.frais_statut === 'partiel' ? (
                              <><Clock className="w-4 h-4" /> Paiement partiel - Reste {r.montant_restant.toLocaleString()} GNF à payer</>
                            ) : (
                              <><Clock className="w-4 h-4" /> En attente de paiement...</>
                            )}
                          </div>
                          
                          {r.frais_statut !== 'paye' && (
                            <button
                              onClick={() => handleOpenPaiement(r)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm whitespace-nowrap"
                            >
                              <CreditCard className="w-4 h-4" />
                              {r.frais_statut === 'partiel' ? `Payer ${r.montant_restant.toLocaleString()} GNF` : 'Payer'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleCancelClick(r.id, `${r.enfant_prenom} ${r.enfant_nom}`)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-sm whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4" />
                            Annuler
                          </button>
                        </div>
                      )}

                      {r.statut === "valide" && (
                        <div className="bg-green-50 text-green-700 text-sm py-2 px-3 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          ✅ Réinscription validée
                          {r.frais_statut === 'partiel' && r.montant_restant > 0 && (
                            <span className="ml-2 text-red-600 font-medium">
                              • Reste {r.montant_restant.toLocaleString()} GNF à payer
                            </span>
                          )}
                          {r.frais_statut === 'paye' && (
                            <span className="ml-2 text-green-600 font-medium">• Tout payé ✅</span>
                          )}
                        </div>
                      )}

                      {r.statut === "rejete" && (
                        <div className="bg-red-50 text-red-700 text-sm py-2 px-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            ❌ Réinscription rejetée
                          </div>
                          {r.observations && (
                            <p className="mt-1 text-xs text-red-600">Motif: {r.observations}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ⭐ MODAL DE CONFIRMATION D'ANNULATION */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Confirmer l'annulation
                </h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReinscriptionId(null);
                    setCancelEnfantNom("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">
                  Êtes-vous sûr de vouloir annuler la réinscription de <strong>{cancelEnfantNom}</strong> ?
                </p>
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ Cette action est <strong>irréversible</strong> et supprimera :
                </p>
                <ul className="text-red-600 text-sm list-disc list-inside mt-1 space-y-1">
                  <li>La demande de réinscription</li>
                  <li>Toutes les échéances de paiement associées</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReinscriptionId(null);
                    setCancelEnfantNom("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-black"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmCancelReinscription}
                  disabled={isCancelling}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${isCancelling
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Annulation...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Oui, annuler
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}