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
  Wallet
} from "lucide-react";

interface Enfant {
  id: number;
  matricule: string;
  eleve_id: number;
  nom: string;
  prenom: string;
  classe_nom: string;
  niveau: string;
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
  photo_url: string | null;
}

interface Stats {
  notes: Array<{ matiere: string; moyenne: number; coefficient: number }>;
  presences: { total: number; presents: number; absents: number; retards: number };
  paiements: { total_paye: number; nombre_paiements: number };
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
      setPreinscriptions(preinscriptionsData);
      
      // Charger les statistiques pour chaque enfant
      for (const enfant of enfantsData) {
        const statsResponse = await fetch(`/api/parent/enfants/${enfant.eleve_id}/stats`);
        const statsData = await statsResponse.json();
        setStatsEnfant(prev => ({ ...prev, [enfant.eleve_id]: statsData }));
      }
    } catch (error) {
      console.error("Erreur:", error);
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
        alert("Paiement effectué avec succès ! Un email a été envoyé au comptable.");
        setShowPaiementModal(false);
        fetchData();
        setSelectedPreinscription(null);
        setModePaiement("");
        setReference("");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Erreur paiement:", error);
      alert("Erreur lors du paiement");
    } finally {
      setPaiementLoading(false);
    }
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

  const statsGlobales = {
    totalEnfants: enfants.length,
    totalPreinscriptions: preinscriptions.length,
    preinscriptionsEnAttente: preinscriptions.filter(p => p.statut === "en_attente").length,
    preinscriptionsPayees: preinscriptions.filter(p => p.frais_statut === "paye").length,
    totalAbsences: Object.values(statsEnfant).reduce((acc, s) => acc + (s.presences?.absents || 0), 0),
    totalRetards: Object.values(statsEnfant).reduce((acc, s) => acc + (s.presences?.retards || 0), 0),
    totalPaye: Object.values(statsEnfant).reduce((acc, s) => acc + (s.paiements?.total_paye || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Espace Parent</h1>
        <p className="text-gray-500">Bienvenue dans votre espace de suivi scolaire</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalPreinscriptions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><Calendar className="w-5 h-5" /><p className="text-sm">Absences totales</p></div>
          <p className="text-2xl font-bold text-orange-600">{statsGlobales.totalAbsences}</p>
          <p className="text-xs text-gray-500">Retards: {statsGlobales.totalRetards}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><CreditCard className="w-5 h-5" /><p className="text-sm">Frais payés</p></div>
          <p className="text-lg font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Section Pré-inscriptions */}
      {preinscriptions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Mes pré-inscriptions
            </h2>
            <Link href="/register" className="text-sm text-blue-600 hover:underline">
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
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{p.enfant_prenom} {p.enfant_nom}</h3>
                          <p className="text-sm text-gray-500">{p.classe}</p>
                          <p className="text-xs text-gray-400 mt-1">Dossier: {p.numero_dossier}</p>
                        </div>
                        <div className="text-right">
                          {getStatutBadge(p.statut)}
                          <div className="mt-1">{getFraisBadge(p.frais_statut)}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {p.frais_statut !== "paye" && p.statut === "en_attente" && (
                          <button
                            onClick={() => {
                              setSelectedPreinscription(p);
                              setShowPaiementModal(true);
                            }}
                            className="flex-1 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" /> Payer l'inscription 500 000 GNF
                          </button>
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-blue-600" />
        Mes enfants inscrits
      </h2>
      
      {enfants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">Aucun enfant inscrit</h3>
          <p className="text-gray-500 mt-2">Vous n'avez pas encore d'enfant inscrit dans l'école.</p>
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
                      <h3 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h3>
                      <p className="text-sm opacity-90">{enfant.classe_nom}</p>
                      <p className="text-xs opacity-75 mt-1">Matricule: {enfant.matricule}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {stats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Absences/Retards</span>
                        <span className="font-medium text-orange-600">{stats.presences?.absents || 0} abs. / {stats.presences?.retards || 0} ret.</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm flex items-center gap-1"><CreditCard className="w-4 h-4" /> Frais payés</span>
                        <span className="font-medium text-green-600">{stats.paiements?.total_paye?.toLocaleString() || 0} GNF</span>
                      </div>
                      {stats.notes && stats.notes.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">Matières:</p>
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

      {/* Modal Paiement */}
      {showPaiementModal && selectedPreinscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Paiement des frais d'inscription</h2>
              <p className="text-gray-500 text-sm">
                {selectedPreinscription.enfant_prenom} {selectedPreinscription.enfant_nom} - {selectedPreinscription.classe}
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Montant à payer</p>
                <p className="text-2xl font-bold text-blue-600">500 000 GNF</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Mode de paiement *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setModePaiement("especes")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${
                      modePaiement === "especes" 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Wallet className="w-6 h-6 text-green-600" />
                    <span className="text-xs">Espèces</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModePaiement("orange_money")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${
                      modePaiement === "orange_money" 
                        ? "border-orange-500 bg-orange-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Smartphone className="w-6 h-6 text-orange-600" />
                    <span className="text-xs">Orange Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModePaiement("carte")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${
                      modePaiement === "carte" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <span className="text-xs">Carte Visa</span>
                  </button>
                </div>
              </div>

              {modePaiement === "especes" && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Paiement en espèces à effectuer à la caisse de l'école.
                    Un email sera envoyé au comptable pour validation.
                  </p>
                </div>
              )}

              {(modePaiement === "orange_money" || modePaiement === "carte") && (
                <div>
                  <label className="block text-gray-700 mb-2">Numéro de transaction</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={modePaiement === "orange_money" ? "Ex: #OM-123456789" : "Ex: VISA-****-1234"}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {modePaiement === "orange_money" 
                      ? "Entrez le numéro de transaction reçu par SMS" 
                      : "Entrez le numéro de transaction de votre carte"}
                  </p>
                </div>
              )}

              <button
                onClick={handlePaiement}
                disabled={!modePaiement || paiementLoading}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  !modePaiement || paiementLoading
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