// app/dashboard/parent/cantine/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2, Utensils, AlertTriangle, CheckCircle, Users, Wallet,
  CalendarDays, TrendingUp, XCircle, Info, Clock
} from "lucide-react";

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  matricule: string;
  inscritCantine: boolean;
  solde: number;
  source: 'eleve' | 'preinscription';
  statut: string;
  moisTotal: number;
  moisRestants: number;
  montantMensuel: number;
  montantTotal: number;
  dateInscription: string | null;
  montantPaye: number;
  montantRestant: number;
  menuNom: string | null;
  paiementStatut: 'paye' | 'partiel' | 'non_paye' | null;
}

const formatGNF = (value: number | undefined | null): string => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString() : "0";
};

export default function CantinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEnfantId = searchParams.get("enfantId");

  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [selectedEnfantId, setSelectedEnfantId] = useState<number | null>(
    initialEnfantId ? parseInt(initialEnfantId) : null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnfants = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/parent/cantine");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(`Erreur ${res.status}`);
        }
        const data = await res.json();
        setEnfants(data.enfants || []);

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
        console.error("Erreur chargement enfants:", e);
        setError("Impossible de charger vos enfants");
      } finally {
        setLoading(false);
      }
    };
    fetchEnfants();
  }, [initialEnfantId, router]);

  // ⭐ Statistiques globales avec statut
  const stats = useMemo(() => {
    const inscrits = enfants.filter((e) => e.inscritCantine);
    const fraisTotaux = inscrits.reduce((sum, e) => sum + (Number(e.montantTotal) || 0), 0);
    const montantPaye = inscrits.reduce((sum, e) => sum + (Number(e.montantPaye) || 0), 0);
    const montantRestant = Math.max(0, fraisTotaux - montantPaye);
    const tauxPaiement = fraisTotaux > 0 ? Math.round((montantPaye / fraisTotaux) * 100) : 0;
    const moisTotaux = inscrits.reduce((sum, e) => sum + (Number(e.moisTotal) || 0), 0);
    const moisRestants = inscrits.reduce((sum, e) => sum + (Number(e.moisRestants) || 0), 0);

    // ⭐ Comptage par statut
    const payes = inscrits.filter((e) => e.paiementStatut === 'paye').length;
    const partiels = inscrits.filter((e) => e.paiementStatut === 'partiel').length;
    const nonPayes = inscrits.filter((e) => e.paiementStatut === 'non_paye').length;

    return {
      totalEnfants: enfants.length,
      inscrits: inscrits.length,
      nonInscrits: enfants.length - inscrits.length,
      fraisTotaux, montantPaye, montantRestant, tauxPaiement,
      moisTotaux, moisRestants,
      payes, partiels, nonPayes,
    };
  }, [enfants]);

  const selectedEnfant = enfants.find((e) => e.id === selectedEnfantId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (enfants.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-yellow-900 mb-2">Aucun enfant trouvé</h2>
          <p className="text-sm text-yellow-800">
            Vous n'avez aucun enfant inscrit ou pré-inscrit pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Utensils className="w-6 h-6 text-pink-600" />
          Cantine Scolaire
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Suivi des inscriptions cantine, des paiements et des mois
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Enfants</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalEnfants}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.inscrits} inscrit(s) · {stats.nonInscrits} non inscrit(s)
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Montant payé</p>
            <Wallet className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatGNF(stats.montantPaye)} <span className="text-sm font-normal">GNF</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.tauxPaiement}% du total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reste à payer</p>
            <CalendarDays className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatGNF(stats.montantRestant)} <span className="text-sm font-normal">GNF</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Frais totaux : {formatGNF(stats.fraisTotaux)} GNF
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Statuts paiement</p>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3" /> {stats.payes} Payé(s)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              <Clock className="w-3 h-3" /> {stats.partiels} Partiel(s)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <XCircle className="w-3 h-3" /> {stats.nonPayes} Non payé(s)
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Erreur</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des enfants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Liste des enfants</h2>
          <span className="text-xs text-gray-500">{enfants.length} enfant(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Enfant</th>
                <th className="px-4 py-3 text-left">Classe</th>
                <th className="px-4 py-3 text-left">Menu</th>
                <th className="px-4 py-3 text-right">Mois</th>
                <th className="px-4 py-3 text-right">Frais totaux</th>
                <th className="px-4 py-3 text-right">Payé</th>
                <th className="px-4 py-3 text-right">Reste</th>
                <th className="px-4 py-3 text-center">Statut paiement</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enfants.map((e) => (
                <tr
                  key={`${e.source}-${e.id}`}
                  className={`hover:bg-gray-50 transition ${selectedEnfantId === e.id ? "bg-pink-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{e.prenom} {e.nom}</p>
                    <p className="text-xs text-gray-500">{e.matricule}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.classe || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{e.menuNom || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {e.inscritCantine ? `${e.moisRestants ?? 0} / ${e.moisTotal ?? 0}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {e.inscritCantine ? `${formatGNF(e.montantTotal)} GNF` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.inscritCantine ? (
                      <span className="text-green-700 font-semibold">
                        {formatGNF(e.montantPaye)} GNF
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.inscritCantine ? (
                      <span className={(e.montantRestant ?? 0) > 0 ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>
                        {formatGNF(e.montantRestant)} GNF
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.inscritCantine ? (
                      e.paiementStatut === 'paye' ? (
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
                      )
                    ) : e.source === "preinscription" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Info className="w-3 h-3" /> Pré-inscrit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <XCircle className="w-3 h-3" /> Non inscrit
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedEnfantId(e.id);
                        router.replace(`/dashboard/parent/cantine?enfantId=${e.id}`);
                      }}
                      className="text-pink-600 hover:text-pink-800 text-xs font-medium"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détails */}
      {selectedEnfant && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {selectedEnfant.prenom} {selectedEnfant.nom}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedEnfant.classe} · {selectedEnfant.matricule}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEnfantId(null);
                router.replace(`/dashboard/parent/cantine`);
              }}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Fermer
            </button>
          </div>

          {selectedEnfant.inscritCantine ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">Menu</p>
                <p className="text-lg font-bold text-blue-900">{selectedEnfant.menuNom || "—"}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">Montant payé</p>
                <p className="text-lg font-bold text-green-900">{formatGNF(selectedEnfant.montantPaye)} GNF</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-700 font-medium">Reste à payer</p>
                <p className="text-lg font-bold text-red-900">{formatGNF(selectedEnfant.montantRestant)} GNF</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-700 font-medium">Mois restants</p>
                <p className="text-lg font-bold text-purple-900">
                  {selectedEnfant.moisRestants ?? 0} / {selectedEnfant.moisTotal ?? 0}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {selectedEnfant.source === "preinscription"
                  ? "Cet enfant est pré-inscrit mais pas encore inscrit à la cantine."
                  : "Cet enfant n'est pas inscrit à la cantine."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}