// app/activites/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { Search, Calendar, Users, Wallet, ChevronRight, Loader2 } from "lucide-react";

interface Activite {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  age_min: number;
  age_max: number;
  capacite_max: number;
  frais_inscription: number;
  photo_url: string | null;
  est_actif: boolean;
}

const CATEGORIES = [
  { id: "all", nom: "Toutes les activités" },
  { id: "sport", nom: "Sport", color: "bg-green-100 text-green-700" },
  { id: "art", nom: "Art", color: "bg-purple-100 text-purple-700" },
  { id: "technologie", nom: "Technologie", color: "bg-blue-100 text-blue-700" },
  { id: "langue", nom: "Langue", color: "bg-yellow-100 text-yellow-700" },
  { id: "autre", nom: "Autre", color: "bg-gray-100 text-gray-700" }
];

export default function ActivitesPage() {
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [selectedActivite, setSelectedActivite] = useState<Activite | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchActivites = async () => {
    try {
      const response = await fetch('/api/public/activites');
      if (response.ok) {
        const data = await response.json();
        setActivites(data || []);
      }
    } catch (error) {
      console.error("Erreur chargement activités:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivites();
  }, []);

  const filteredActivites = activites.filter(activite => {
    const matchesSearch = activite.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activite.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = selectedCategorie === "all" || activite.categorie === selectedCategorie;
    return matchesSearch && matchesCategorie && activite.est_actif;
  });

  const getCategorieInfo = (categorie: string) => {
    return CATEGORIES.find(c => c.id === categorie) || CATEGORIES[0];
  };

  const getAgeRange = (min: number, max: number) => {
    if (min === max) return `${min} ans`;
    return `${min} - ${max} ans`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96 pt-16">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative h-[300px] mt-16 bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center justify-center text-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Activités Périscolaires</h1>
            <p className="text-xl max-w-2xl mx-auto px-4">Découvrez nos activités pour épanouir vos enfants</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Filtres */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une activité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
            <select
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
              className="px-4 py-3 border rounded-xl bg-white min-w-[200px]"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des activités */}
        {filteredActivites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500">Aucune activité trouvée</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivites.map((activite) => {
              const categorieInfo = getCategorieInfo(activite.categorie);
              return (
                <div
                  key={activite.id}
                  onClick={() => { setSelectedActivite(activite); setShowModal(true); }}
                  className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition cursor-pointer"
                >
                  <div className="h-40 bg-gray-100 relative">
                    {activite.photo_url ? (
                      <img src={activite.photo_url} alt={activite.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-r from-purple-400 to-purple-600 text-white">
                        🎯
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categorieInfo.color || "bg-gray-100"}`}>
                        {categorieInfo.nom}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-2">{activite.nom}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {activite.description || "Une activité enrichissante pour vos enfants."}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{activite.jour} • {activite.heure_debut} - {activite.heure_fin}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>Âge: {getAgeRange(activite.age_min, activite.age_max)} | Max: {activite.capacite_max}</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-600 font-semibold">
                        <Wallet className="w-4 h-4" />
                        <span>{activite.frais_inscription.toLocaleString()} GNF</span>
                      </div>
                    </div>
                    <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700 transition">
                      En savoir plus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedActivite && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-48 bg-purple-600">
              {selectedActivite.photo_url ? (
                <img src={selectedActivite.photo_url} alt={selectedActivite.nom} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-white">🎯</div>
              )}
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full">✕</button>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedActivite.nom}</h2>
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategorieInfo(selectedActivite.categorie).color}`}>
                  {getCategorieInfo(selectedActivite.categorie).nom}
                </span>
              </div>
              <p className="text-gray-600 mb-6">{selectedActivite.description || "Aucune description disponible."}</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Jour & Horaire</p>
                  <p className="font-semibold">{selectedActivite.jour} • {selectedActivite.heure_debut} - {selectedActivite.heure_fin}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Âge requis</p>
                  <p className="font-semibold">{getAgeRange(selectedActivite.age_min, selectedActivite.age_max)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Capacité maximale</p>
                  <p className="font-semibold">{selectedActivite.capacite_max} enfants</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Frais d'inscription</p>
                  <p className="font-semibold text-purple-600">{selectedActivite.frais_inscription.toLocaleString()} GNF</p>
                </div>
              </div>
              <Link href="/register" className="block w-full bg-purple-600 text-white text-center py-3 rounded-xl hover:bg-purple-700 transition font-semibold">
                S'inscrire maintenant
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}