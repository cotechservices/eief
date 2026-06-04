// app/dashboard/parent/transport/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bus,
  MapPin,
  Clock,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Bell,
  Phone,
  Loader2,
  CreditCard,
  TrendingUp,
  Wallet
} from "lucide-react";

interface Enfant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  inscritTransport: boolean;
  ligne?: string;
  arret?: string;
  heureMatin?: string;
  heureSoir?: string;
  chauffeur?: string;
  chauffeurTel?: string;
  immatriculation?: string;
}

interface StatsTransport {
  totalEleves: number;
  inscritsTransport: number;
  fraisTotalTransport: number;
  fraisPayesTransport: number;
  fraisRestantsTransport: number;
  lignesActives: number;
}

interface BusPosition {
  latitude: number;
  longitude: number;
  vitesse: number;
  derniereMiseAJour: string;
  retard: number;
}

export default function ParentTransportPage() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [stats, setStats] = useState<StatsTransport>({
    totalEleves: 0,
    inscritsTransport: 0,
    fraisTotalTransport: 0,
    fraisPayesTransport: 0,
    fraisRestantsTransport: 0,
    lignesActives: 0
  });
  const [busPosition, setBusPosition] = useState<BusPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnfantId, setSelectedEnfantId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransportData();
  }, []);

  const fetchTransportData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/parent/transport");
      const data = await response.json();

      const enfantsData = data.enfants || [];
      setEnfants(enfantsData);
      setBusPosition(data.busPosition);

      // Calculer les statistiques
      const inscrits = enfantsData.filter((e: Enfant) => e.inscritTransport).length;
      const fraisParEnfant = 80000; // 80 000 GNF par mois
      const totalFrais = inscrits * fraisParEnfant;
      const payes = inscrits > 0 ? Math.floor(totalFrais * 0.6) : 0; // 60% payé pour l'exemple

      setStats({
        totalEleves: enfantsData.length,
        inscritsTransport: inscrits,
        fraisTotalTransport: totalFrais,
        fraisPayesTransport: payes,
        fraisRestantsTransport: totalFrais - payes,
        lignesActives: inscrits > 0 ? 1 : 0
      });

      if (enfantsData.length > 0 && !selectedEnfantId) {
        setSelectedEnfantId(enfantsData[0].id);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransportData().finally(() => setRefreshing(false));
  };

  const enfant = enfants.find(e => e.id === selectedEnfantId);
  const enfantsInscrits = enfants.filter(e => e.inscritTransport);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transport scolaire</h1>
          <p className="text-gray-500">Suivez le trajet de vos enfants et gérez les paiements</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          <span className="text-sm text-gray-600">Actualiser</span>
        </button>
      </div>

      {/* Statistiques Transport */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Total élèves</p></div>
          <p className="text-3xl font-bold">{stats.totalEleves}</p>
          <p className="text-xs opacity-75">dont {stats.inscritsTransport} inscrits au transport</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><Bus className="w-5 h-5" /><p className="text-sm">Lignes actives</p></div>
          <p className="text-2xl font-bold text-blue-600">{stats.lignesActives}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><CreditCard className="w-5 h-5" /><p className="text-sm">Frais transport</p></div>
          <p className="text-lg font-bold text-green-600">{stats.fraisTotalTransport.toLocaleString()} GNF</p>
          <p className="text-xs text-gray-500">Payé: {stats.fraisPayesTransport.toLocaleString()} GNF</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><TrendingUp className="w-5 h-5" /><p className="text-sm">Taux paiement</p></div>
          <p className="text-2xl font-bold text-purple-600">
            {stats.fraisTotalTransport > 0 ? Math.round((stats.fraisPayesTransport / stats.fraisTotalTransport) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Barre de progression des paiements transport */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progression des paiements transport</span>
          <span className="font-medium text-blue-600">
            {stats.fraisTotalTransport > 0 ? Math.round((stats.fraisPayesTransport / stats.fraisTotalTransport) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${stats.fraisTotalTransport > 0 ? (stats.fraisPayesTransport / stats.fraisTotalTransport) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Sélection de l'enfant (uniquement si des enfants sont inscrits) */}
      {enfantsInscrits.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
          <span className="text-sm text-gray-500 flex items-center gap-1 mr-2">
            <Users className="w-4 h-4" /> Enfants inscrits:
          </span>
          {enfantsInscrits.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEnfantId(e.id)}
              className={`px-4 py-2 rounded-lg transition ${selectedEnfantId === e.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {e.prenom} {e.nom}
            </button>
          ))}
        </div>
      )}

      {/* Message si aucun enfant inscrit */}
      {enfantsInscrits.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <Bus className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Aucun enfant inscrit au transport</h3>
          <p className="text-yellow-700 mb-4">
            Vos enfants ne sont pas encore inscrits au service de transport scolaire.
            Vous pouvez les inscrire en cliquant sur le bouton ci-dessous.
          </p>
          <Link
            href="/dashboard/parent/transport/inscription"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            S'inscrire au transport
          </Link>
        </div>
      )}

      {/* Détails du transport pour un enfant inscrit */}
      {enfant && enfant.inscritTransport && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - Informations */}
          <div className="lg:col-span-1 space-y-6">
            {/* Statut du bus */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-blue-600" />
                  Statut du bus
                </h3>
                {busPosition && busPosition.retard > 0 ? (
                  <span className="text-red-600 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {busPosition.retard} min de retard
                  </span>
                ) : (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> À l'heure
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Immatriculation</span>
                  <span className="font-medium">{enfant.immatriculation || "Non renseignée"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Chauffeur</span>
                  <span className="font-medium">{enfant.chauffeur || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Contact chauffeur</span>
                  {enfant.chauffeurTel ? (
                    <a href={`tel:${enfant.chauffeurTel}`} className="text-blue-600 font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {enfant.chauffeurTel}
                    </a>
                  ) : (
                    <span className="text-">Non disponible</span>
                  )}
                </div>
                {busPosition && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Vitesse actuelle</span>
                      <span className="font-medium">{busPosition.vitesse} km/h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Dernière mise à jour</span>
                      <span className="text-sm">{new Date(busPosition.derniereMiseAJour).toLocaleTimeString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Horaires */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                Horaires
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Départ maison</p>
                    <p className="text-xl font-bold text-blue-600">{enfant.heureMatin || "--:--"}</p>
                  </div>
                  <div className="text-">→</div>
                  <div>
                    <p className="text-sm text-gray-500">Arrivée école</p>
                    <p className="text-xl font-bold text-blue-600">07:15</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Départ école</p>
                    <p className="text-xl font-bold text-orange-600">{enfant.heureSoir || "--:--"}</p>
                  </div>
                  <div className="text-">→</div>
                  <div>
                    <p className="text-sm text-gray-500">Arrivée maison</p>
                    <p className="text-xl font-bold text-orange-600">17:15</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrêt */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                Point d'arrêt
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{enfant.arret || "Arrêt principal"}</p>
                  <p className="text-sm text-gray-500">{enfant.ligne || "Ligne non définie"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne de droite - Carte et présence */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Position du bus en temps réel</h3>
                    <p className="text-sm opacity-90">{enfant.ligne || "Ligne scolaire"}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
                    🟢 En service
                  </div>
                </div>
              </div>
              <div className="relative h-80 bg-gray-200">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <Bus className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Carte en temps réel</p>
                    {busPosition && (
                      <p className="text-sm text-gray-500">
                        Position: {busPosition.latitude.toFixed(4)}, {busPosition.longitude.toFixed(4)}
                      </p>
                    )}
                    <a
                      href={`https://maps.google.com/?q=${busPosition?.latitude},${busPosition?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-blue-600 text-sm inline-block"
                    >
                      Ouvrir dans Google Maps →
                    </a>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600">Bus en mouvement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Présence du jour */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                Présence du jour
              </h3>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Statut ce matin</p>
                  <p className="text-lg font-semibold text-green-600">✅ Présent</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Heure de prise en charge</p>
                  <p className="font-medium">{enfant.heureMatin || "--:--"}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" /> Activer les alertes
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Historique
                </button>
              </div>
            </div>

            {/* Alerte en cas de retard */}
            {busPosition && busPosition.retard > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Retard signalé</h4>
                    <p className="text-sm text-yellow-700">
                      Le bus accuse un retard d'environ {busPosition.retard} minute(s) en raison des conditions de circulation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}