// app/dashboard/parent/reinscription/page.tsx
"use client";

import { useState, useEffect } from "react";
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

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

interface Reinscription {
  id: number;
  statut: "en_attente" | "valide" | "rejete";
  date_reinscription: string;
  observations: string;
  montant_frais: number;
  frais_statut: string;
  frais_mode_paiement: string;
  enfant_nom: string;
  enfant_prenom: string;
  matricule: string;
  photo_url: string | null;
  classe_nom: string;
  classe_niveau: string;
  classe_actuelle_nom: string;
  annee_scolaire: string;
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

  useEffect(() => {
    fetchData();
  }, []);

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

  const getNiveauxOptions = () => {
    return [...new Set(classes.map(c => c.niveau))];
  };

  const getClassesForNiveau = (niveauNom: string) => {
    return classes.filter(c => c.niveau === niveauNom);
  };

  // Vérifier si un enfant a déjà une réinscription en attente
  const hasActiveReinscription = (eleveId: number) => {
    return reinscriptions.some(r => {
      // On compare par nom/prenom car l'API renvoie enfant_nom/enfant_prenom
      const enfant = enfants.find(e => e.eleve_id === eleveId);
      if (!enfant) return false;
      return r.enfant_nom === enfant.nom && r.enfant_prenom === enfant.prenom && r.statut === "en_attente";
    });
  };

  const handleSelectEnfant = (enfant: Enfant) => {
    setSelectedEnfant(enfant);
    setSelectedNiveau("");
    setSelectedClasseId(null);
  };

  const handleSubmitReinscription = async () => {
    if (!selectedEnfant || !selectedClasseId) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/parent/reinscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eleveId: selectedEnfant.eleve_id,
          classeId: selectedClasseId,
          montantFrais: selectedEnfant.frais_inscription_classe || 500000,
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

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
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
      {/* Notifications Toast */}
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
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-5 h-5" />
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
                  <p className="text-sm text-gray-400 mt-1">Vous devez d'abord inscrire un enfant depuis la page Inscription.</p>
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
            /* Étape 2 : Sélection de la nouvelle classe */
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

              {/* Récapitulatif */}
              {selectedClasseId && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">📌 Récapitulatif</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-600">Enfant :</span> <span className="text-black font-medium">{selectedEnfant.prenom} {selectedEnfant.nom}</span></div>
                    <div><span className="text-gray-600">Classe actuelle :</span> <span className="text-black font-medium">{selectedEnfant.classe_nom || "N/A"}</span></div>
                    <div><span className="text-gray-600">Nouvelle classe :</span> <span className="text-green-700 font-medium">{classes.find(c => c.id === selectedClasseId)?.nom}</span></div>
                    <div><span className="text-gray-600">Frais :</span> <span className="text-black font-medium">{(selectedEnfant.frais_inscription_classe || 500000).toLocaleString()} GNF</span></div>
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

      {/* Liste des réinscriptions soumises */}
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
            <p className="text-sm text-gray-500 mt-1">Cliquez sur "Nouvelle réinscription" pour commencer.</p>
          </div>
        ) : (
          <div className="divide-y">
            {reinscriptions.map((r) => (
              <div key={r.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  {r.photo_url ? (
                    <img src={r.photo_url} alt="photo" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
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
                      <div className="flex flex-col items-end gap-1">
                        {getStatutBadge(r.statut)}
                        {getFraisBadge(r.frais_statut)}
                      </div>
                    </div>

                    {/* Actions selon statut */}
                    <div className="mt-3">
                      {r.statut === "en_attente" && r.frais_statut !== "paye" && (
                        <div className="bg-yellow-50 text-yellow-700 text-sm py-2 px-3 rounded-lg flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          En attente de traitement — Frais: {(r.montant_frais || 500000).toLocaleString()} GNF
                        </div>
                      )}
                      {r.statut === "en_attente" && r.frais_statut === "paye" && (
                        <div className="bg-blue-50 text-blue-700 text-sm py-2 px-3 rounded-lg flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Paiement effectué — En attente de validation
                        </div>
                      )}
                      {r.statut === "valide" && (
                        <div className="bg-green-50 text-green-700 text-sm py-2 px-3 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          ✅ Réinscription validée
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

      {/* Message si aucun enfant inscrit */}
      {enfants.length === 0 && reinscriptions.length === 0 && (
        <div className="bg-blue-50 p-6 rounded-xl text-center">
          <Users className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900">Aucun enfant inscrit</h3>
          <p className="text-blue-700 mt-2">Vous devez d'abord avoir des enfants inscrits pour pouvoir les réinscrire.</p>
          <p className="text-sm text-blue-600 mt-1">Allez dans la section "Inscription" pour inscrire un enfant.</p>
        </div>
      )}
    </div>
  );
}
