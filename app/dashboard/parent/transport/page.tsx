// app/dashboard/parent/transport/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Bus, 
  MapPin, 
  Clock, 
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Navigation,
  Phone,
  User,
  ChevronRight,
  RefreshCw,
  Bell
} from "lucide-react";

interface Enfant {
  id: number;
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

interface BusPosition {
  latitude: number;
  longitude: number;
  vitesse: number;
  derniereMiseAJour: string;
  retard: number;
}

export default function ParentTransportPage() {
  const [selectedEnfant, setSelectedEnfant] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Liste des enfants
  const enfants: Enfant[] = [
    { 
      id: 1, 
      nom: "Diallo", 
      prenom: "Ibrahim", 
      classe: "5ème A", 
      inscritTransport: true,
      ligne: "Ligne 1 - Conakry/Koloma",
      arret: "Arrêt Bambeto",
      heureMatin: "06:30",
      heureSoir: "16:30",
      chauffeur: "M. Camara",
      chauffeurTel: "+224 622 123 456",
      immatriculation: "RC 1234 AB"
    },
    { 
      id: 2, 
      nom: "Diallo", 
      prenom: "Aïssatou", 
      classe: "3ème A", 
      inscritTransport: true,
      ligne: "Ligne 1 - Conakry/Koloma",
      arret: "Arrêt Bambeto",
      heureMatin: "06:30",
      heureSoir: "16:30",
      chauffeur: "M. Camara",
      chauffeurTel: "+224 622 123 456",
      immatriculation: "RC 1234 AB"
    },
    { 
      id: 3, 
      nom: "Diallo", 
      prenom: "Mamadou", 
      classe: "6ème A", 
      inscritTransport: false 
    },
  ];

  const enfant = enfants.find(e => e.id === selectedEnfant);
  const enfantInscrit = enfant?.inscritTransport;

  // Simulation de position du bus
  const busPosition: BusPosition = {
    latitude: 9.5092,
    longitude: -13.7122,
    vitesse: 35,
    derniereMiseAJour: new Date().toISOString(),
    retard: 5
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  if (!enfantInscrit) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Transport scolaire</h1><p className="text-gray-500">Suivez le trajet de vos enfants</p></div>
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bus className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucun enfant inscrit au transport</h2>
          <p className="text-gray-500 mb-6">Votre enfant n'est pas encore inscrit au service de transport scolaire.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            S'inscrire au transport
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transport scolaire</h1>
          <p className="text-gray-500">Suivez le trajet de vos enfants</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          <span className="text-sm text-gray-600">Actualiser</span>
        </button>
      </div>

      {/* Sélection de l'enfant */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        {enfants.filter(e => e.inscritTransport).map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedEnfant(e.id)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedEnfant === e.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {e.prenom} {e.nom} - {e.classe}
          </button>
        ))}
      </div>

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
              {busPosition.retard > 0 ? (
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
                <span className="font-medium">{enfant.immatriculation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Chauffeur</span>
                <span className="font-medium">{enfant.chauffeur}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Contact chauffeur</span>
                <a href={`tel:${enfant.chauffeurTel}`} className="text-blue-600 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {enfant.chauffeurTel}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Vitesse actuelle</span>
                <span className="font-medium">{busPosition.vitesse} km/h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Dernière mise à jour</span>
                <span className="text-sm">{new Date(busPosition.derniereMiseAJour).toLocaleTimeString()}</span>
              </div>
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
                  <p className="text-xl font-bold text-blue-600">{enfant.heureMatin}</p>
                </div>
                <div className="text-gray-400">→</div>
                <div>
                  <p className="text-sm text-gray-500">Arrivée école</p>
                  <p className="text-xl font-bold text-blue-600">07:15</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Départ école</p>
                  <p className="text-xl font-bold text-orange-600">{enfant.heureSoir}</p>
                </div>
                <div className="text-gray-400">→</div>
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
                <p className="font-medium text-gray-800">{enfant.arret}</p>
                <p className="text-sm text-gray-500">{enfant.ligne}</p>
                <button className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                  Voir sur la carte <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne de droite - Carte et présence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte (simulée) */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Position du bus en temps réel</h3>
                  <p className="text-sm opacity-90">Ligne {enfant.ligne}</p>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
                  🟢 En service
                </div>
              </div>
            </div>
            <div className="relative h-80 bg-gray-200">
              {/* Simulation de carte */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <Bus className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Carte en temps réel</p>
                  <p className="text-sm text-gray-500">Position actuelle: {busPosition.latitude}, {busPosition.longitude}</p>
                  <button className="mt-2 text-blue-600 text-sm">Ouvrir dans Google Maps →</button>
                </div>
              </div>
              {/* Icône bus animée */}
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
                <p className="text-lg font-semibold text-green-600">✅ Présent - Monté à l'arrêt</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Heure</p>
                <p className="font-medium">06:32</p>
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

          {/* Alerte */}
          {busPosition.retard > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Retard signalé</h4>
                  <p className="text-sm text-yellow-700">
                    Le bus accuse un retard d'environ {busPosition.retard} minutes en raison des conditions de circulation.
                    Il devrait arriver à l'arrêt vers {parseInt(enfant.heureMatin!.split(":")[1]) + busPosition.retard} minutes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}