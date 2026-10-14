// app/dashboard/parent/transport/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Bus,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  User,
  ChevronDown,
  Calendar,
  Wallet,
  ArrowRight,
  Info,
  Users,
  TrendingUp,
  XCircle,
  CreditCard,
} from "lucide-react";

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  matricule: string;
  inscritTransport: boolean;
  ligne: string | null;
  ligneId: number | null;
  heureMatin: string | null;
  heureSoir: string | null;
  chauffeur: string | null;
  chauffeurTel: string | null;
  immatriculation: string | null;
  capacite: number | null;
  prixAbonnement: number;
  montantMensuel?: number;
  montantTotal: number;
  montantPaye?: number;
  solde: number;
  paiementStatut?: 'paye' | 'partiel' | 'non_paye';
  moisTotal: number | null;
  moisRestants: number | null;
  source: 'eleve' | 'preinscription';
  statut: string;
}

interface Ligne {
  id: number;
  nom: string;
  horaireMatin: string | null;
  horaireSoir: string | null;
  prixAbonnement: number;
  immatriculation: string | null;
  chauffeur: string | null;
  chauffeurTel: string | null;
  capacite: number | null;
}

interface BusPosition {
  latitude: number;
  longitude: number;
  vitesse: number;
  derniereMiseAJour: string;
  retard: number;
}

const formatGNF = (value: number | undefined | null): string => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString() : "0";
};

export default function TransportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEnfantId = searchParams.get("enfantId");

  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [busPosition, setBusPosition] = useState<BusPosition | null>(null);
  const [selectedEnfantId, setSelectedEnfantId] = useState<number | null>(
    initialEnfantId ? parseInt(initialEnfantId) : null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedLigneId, setSelectedLigneId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/parent/transport");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(`Erreur ${res.status}`);
        }

        const data = await res.json();
        setEnfants(data.enfants || []);
        setLignes(data.lignes || []);
        setBusPosition(data.busPosition || null);

        if (initialEnfantId) {
          const enfantAutorise = data.enfants?.find(
            (e: Enfant) => e.id === parseInt(initialEnfantId)
          );
          if (!enfantAutorise) {
            setError("Cet enfant ne vous appartient pas ou n'existe pas");
            setSelectedEnfantId(null);
          }
        }
      } catch (e: any) {
        console.error("Erreur chargement:", e);
        setError("Impossible de charger les données de transport");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialEnfantId, router]);

  // ⭐⭐⭐ STATISTIQUES GLOBALES DU TRANSPORT ⭐⭐⭐
  const stats = useMemo(() => {
    const abonnes = enfants.filter((e) => e.inscritTransport);

    const fraisTotaux = abonnes.reduce(
      (sum, e) => sum + (Number(e.montantTotal) || 0),
      0
    );

    const montantPaye = abonnes.reduce(
      (sum, e) => sum + (Number(e.montantPaye) || 0),
      0
    );

    const resteAPayer = abonnes.reduce(
      (sum, e) => sum + (Number(e.solde) || 0),
      0
    );

    const tauxPaiement =
      fraisTotaux > 0 ? Math.round((montantPaye / fraisTotaux) * 100) : 0;

    const moisTotaux = abonnes.reduce(
      (sum, e) => sum + (Number(e.moisTotal) || 0),
      0
    );
    const moisRestants = abonnes.reduce(
      (sum, e) => sum + (Number(e.moisRestants) || 0),
      0
    );
    const moisConsommes = Math.max(0, moisTotaux - moisRestants);
    const tauxMois =
      moisTotaux > 0 ? Math.round((moisConsommes / moisTotaux) * 100) : 0;

    const payes = abonnes.filter((e) => e.paiementStatut === 'paye').length;
    const partiels = abonnes.filter((e) => e.paiementStatut === 'partiel').length;
    const nonPayes = abonnes.filter((e) => e.paiementStatut === 'non_paye').length;

    return {
      totalEnfants: enfants.length,
      abonnes: abonnes.length,
      nonAbonnes: enfants.length - abonnes.length,
      fraisTotaux,
      montantPaye,
      resteAPayer,
      tauxPaiement,
      moisTotaux,
      moisRestants,
      moisConsommes,
      tauxMois,
      payes,
      partiels,
      nonPayes,
      lignesUtilisees: new Set(
        abonnes.map((e) => e.ligneId).filter(Boolean)
      ).size,
    };
  }, [enfants]);

  const handleSubscribe = async () => {
    if (!selectedEnfantId || !selectedLigneId) return;

    setSubscribing(true);
    setError(null);

    try {
      const enfant = enfants.find((e) => e.id === selectedEnfantId);
      const res = await fetch("/api/parent/transport/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enfantId: selectedEnfantId,
          ligneId: selectedLigneId,
          source: enfant?.source || 'eleve',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      const reloadRes = await fetch("/api/parent/transport");
      const reloadData = await reloadRes.json();
      setEnfants(reloadData.enfants || []);
      setSelectedLigneId(null);
      setShowConfirm(false);
      alert("✅ Inscription au transport effectuée avec succès !");
    } catch (e: any) {
      console.error("Erreur abonnement:", e);
      setError(e.message || "Erreur lors de l'inscription");
      setShowConfirm(false);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const selectedEnfant = enfants.find((e) => e.id === selectedEnfantId);
  const selectedLigne = lignes.find((l) => l.id === selectedLigneId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bus className="w-6 h-6 text-blue-600" />
          Transport Scolaire
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Gérez l'abonnement au transport scolaire de vos enfants
        </p>
      </div>

      {/* ⭐⭐⭐ STATISTIQUES DU TRANSPORT ⭐⭐⭐ */}
      {enfants.length > 0 && (
        <>
          {/* Cartes principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Carte 1 : Enfants abonnés */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Enfants abonnés
                </p>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.abonnes}
                <span className="text-sm font-normal text-gray-500">
                  {" "}/ {stats.totalEnfants}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.nonAbonnes} non abonné(s)
              </p>
            </div>

            {/* Carte 2 : Montant payé */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Montant payé
                </p>
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatGNF(stats.montantPaye)}
                <span className="text-sm font-normal text-gray-500"> GNF</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.tauxPaiement}% du total
              </p>
            </div>

            {/* Carte 3 : Reste à payer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Reste à payer
                </p>
                <CreditCard className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatGNF(stats.resteAPayer)}
                <span className="text-sm font-normal text-gray-500"> GNF</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Frais totaux : {formatGNF(stats.fraisTotaux)} GNF
              </p>
            </div>

            {/* Carte 4 : Mois restants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Mois restants
                </p>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.moisRestants}
                <span className="text-sm font-normal text-gray-500">
                  {" "}/ {stats.moisTotaux}
                </span>
              </p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${stats.tauxMois}%` }}
                />
              </div>
            </div>
          </div>

          {/* Barre de progression paiement */}
          {stats.fraisTotaux > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Progression des paiements transport
                  </h3>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {stats.tauxPaiement}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.tauxPaiement}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Payé : {formatGNF(stats.montantPaye)} GNF</span>
                <span>Reste : {formatGNF(stats.resteAPayer)} GNF</span>
              </div>
            </div>
          )}

          {/* Détail par enfant (uniquement les abonnés) */}
          {stats.abonnes > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Bus className="w-4 h-4 text-blue-600" />
                  Détail des abonnements
                </h2>
                <span className="text-xs text-gray-500">
                  {stats.abonnes} enfant(s) abonné(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Enfant</th>
                      <th className="px-4 py-3 text-left">Ligne</th>
                      <th className="px-4 py-3 text-right">Mois</th>
                      <th className="px-4 py-3 text-right">Frais totaux</th>
                      <th className="px-4 py-3 text-right">Payé</th>
                      <th className="px-4 py-3 text-right">Reste</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enfants
                      .filter((e) => e.inscritTransport)
                      .map((e) => {
                        const total = Number(e.montantTotal) || 0;
                        const paye = Number(e.montantPaye) || 0;
                        const reste = Number(e.solde) || 0;

                        return (
                          <tr key={e.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">
                                {e.prenom} {e.nom}
                              </p>
                              <p className="text-xs text-gray-500">{e.classe || "—"}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-xs">
                              {e.ligne || "—"}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700 text-xs">
                              {e.moisRestants ?? 0} / {e.moisTotal ?? 0}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 font-medium">
                              {formatGNF(total)} GNF
                            </td>
                            <td className="px-4 py-3 text-right text-green-700 font-semibold">
                              {formatGNF(paye)} GNF
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={
                                  reste > 0
                                    ? "text-red-600 font-semibold"
                                    : "text-green-700 font-semibold"
                                }
                              >
                                {formatGNF(reste)} GNF
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {e.paiementStatut === 'paye' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3" /> Payé
                                </span>
                              ) : e.paiementStatut === 'partiel' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <Clock className="w-3 h-3" /> Partiel
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <XCircle className="w-3 h-3" /> Non payé
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Erreur</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Message si aucun enfant */}
      {enfants.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-yellow-900 mb-2">
            Aucun enfant trouvé
          </h2>
          <p className="text-sm text-yellow-800">
            Vous n'avez aucun enfant inscrit ou pré-inscrit pour le moment.
          </p>
        </div>
      )}

      {/* Sélecteur d'enfant */}
      {enfants.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionnez votre enfant
          </label>
          <div className="relative">
            <select
              value={selectedEnfantId || ""}
              onChange={(e) => {
                const id = e.target.value ? parseInt(e.target.value) : null;
                setSelectedEnfantId(id);
                setSelectedLigneId(null);
                if (id) {
                  router.replace(`/dashboard/parent/transport?enfantId=${id}`);
                } else {
                  router.replace(`/dashboard/parent/transport`);
                }
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-10"
            >
              <option value="">— Choisir un enfant —</option>
              {enfants.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom} — {e.classe || "Sans classe"}
                  {e.inscritTransport ? " ✓ Abonné" : ""}
                  {e.source === 'preinscription' ? " (pré-inscrit)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Contenu selon l'enfant sélectionné */}
      {selectedEnfant && (
        <>
          {selectedEnfant.inscritTransport ? (
            <div className="space-y-4">
              {/* Info abonnement */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-blue-900">
                      Abonnement transport actif
                    </h2>
                    <p className="text-xs text-blue-700">
                      {selectedEnfant.prenom} {selectedEnfant.nom}
                    </p>
                  </div>
                  {selectedEnfant.paiementStatut === 'paye' ? (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Payé
                    </span>
                  ) : selectedEnfant.paiementStatut === 'partiel' ? (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Partiel
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Non payé
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Ligne
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedEnfant.ligne || "Non définie"}
                    </p>
                  </div>

                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-semibold mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Horaires
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      Matin : {selectedEnfant.heureMatin || "—"}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      Soir : {selectedEnfant.heureSoir || "—"}
                    </p>
                  </div>

                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-semibold mb-1">
                      <User className="w-3.5 h-3.5" />
                      Chauffeur
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedEnfant.chauffeur || "Non renseigné"}
                    </p>
                    {selectedEnfant.chauffeurTel && (
                      <a
                        href={`tel:${selectedEnfant.chauffeurTel}`}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Phone className="w-3 h-3" />
                        {selectedEnfant.chauffeurTel}
                      </a>
                    )}
                  </div>

                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-semibold mb-1">
                      <Bus className="w-3.5 h-3.5" />
                      Bus
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedEnfant.immatriculation || "—"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Capacité : {selectedEnfant.capacite || "—"} places
                    </p>
                  </div>
                </div>

                {/* Paiement */}
                <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Montant total
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {formatGNF(selectedEnfant.montantTotal)} GNF
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Payé
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatGNF(selectedEnfant.montantPaye)} GNF
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Reste à payer
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        selectedEnfant.solde > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatGNF(selectedEnfant.solde)} GNF
                    </p>
                  </div>
                  {selectedEnfant.moisRestants !== null && selectedEnfant.moisTotal !== null && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Mois restants
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedEnfant.moisRestants} / {selectedEnfant.moisTotal}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Position bus */}
              {busPosition && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Position du bus en temps réel
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        Vitesse
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {busPosition.vitesse} km/h
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        Retard
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          busPosition.retard > 0 ? "text-orange-600" : "text-green-600"
                        }`}
                      >
                        {busPosition.retard > 0
                          ? `+${busPosition.retard} min`
                          : "À l'heure"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        Mise à jour
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {new Date(busPosition.derniereMiseAJour).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-900">
                  <span className="font-semibold">
                    {selectedEnfant.prenom} {selectedEnfant.nom}
                  </span>{" "}
                  n'est pas encore inscrit au transport scolaire.
                  Choisissez une ligne ci-dessous pour l'inscrire.
                </p>
              </div>

              {lignes.length === 0 ? (
                <div className="bg-gray-50 border rounded-xl p-6 text-center">
                  <Bus className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Aucune ligne de transport disponible pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Lignes disponibles ({lignes.length})
                  </p>
                  {lignes.map((ligne) => (
                    <div
                      key={ligne.id}
                      className={`p-4 bg-white rounded-xl border-2 transition cursor-pointer ${
                        selectedLigneId === ligne.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => setSelectedLigneId(ligne.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedLigneId === ligne.id
                                  ? "bg-blue-600"
                                  : "bg-blue-100"
                              }`}
                            >
                              <Bus
                                className={`w-4 h-4 ${
                                  selectedLigneId === ligne.id
                                    ? "text-white"
                                    : "text-blue-600"
                                }`}
                              />
                            </div>
                            <h3 className="font-bold text-gray-900">{ligne.nom}</h3>
                            {selectedLigneId === ligne.id && (
                              <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-gray-500 font-semibold uppercase">
                                Matin
                              </p>
                              <p className="text-gray-900 font-bold">
                                {ligne.horaireMatin || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-semibold uppercase">
                                Soir
                              </p>
                              <p className="text-gray-900 font-bold">
                                {ligne.horaireSoir || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-semibold uppercase">
                                Chauffeur
                              </p>
                              <p className="text-gray-900 font-bold truncate">
                                {ligne.chauffeur || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-semibold uppercase">
                                Bus
                              </p>
                              <p className="text-gray-900 font-bold">
                                {ligne.immatriculation || "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-xs text-gray-500 font-semibold uppercase">
                            Prix mensuel
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            {ligne.prixAbonnement.toLocaleString()} GNF
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedLigneId && selectedLigne && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-blue-700 font-semibold uppercase">
                        Ligne sélectionnée
                      </p>
                      <p className="text-sm font-bold text-blue-900">
                        {selectedLigne.nom}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Abonnement : {selectedLigne.prixAbonnement.toLocaleString()} GNF
                        / mois — Total annuel :{" "}
                        {(selectedLigne.prixAbonnement * 9).toLocaleString()} GNF
                      </p>
                    </div>

                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={subscribing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <ArrowRight className="w-4 h-4" />
                      S'abonner à cette ligne
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!selectedEnfantId && enfants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <Bus className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-blue-900">
            Sélectionnez un enfant ci-dessus pour gérer son abonnement au transport.
          </p>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirm && selectedEnfant && selectedLigne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Confirmer l'inscription
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Enfant</span>
                  <span className="font-semibold text-gray-900">
                    {selectedEnfant.prenom} {selectedEnfant.nom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Classe</span>
                  <span className="font-semibold text-gray-900">
                    {selectedEnfant.classe}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ligne</span>
                  <span className="font-semibold text-gray-900">
                    {selectedLigne.nom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horaire matin</span>
                  <span className="font-semibold text-gray-900">
                    {selectedLigne.horaireMatin || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horaire soir</span>
                  <span className="font-semibold text-gray-900">
                    {selectedLigne.horaireSoir || "—"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600">Prix mensuel</span>
                  <span className="font-bold text-blue-600">
                    {selectedLigne.prixAbonnement.toLocaleString()} GNF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total annuel (9 mois)</span>
                  <span className="font-bold text-blue-600 text-base">
                    {(selectedLigne.prixAbonnement * 9).toLocaleString()} GNF
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                En confirmant, vous vous engagez à régler le montant total de
                l'abonnement au transport scolaire.
              </p>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={subscribing}
                className="px-4 py-2 text-sm text-gray-900 border rounded-lg hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 font-medium"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}