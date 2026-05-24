// app/annonces/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, User, Eye, ChevronRight, Search, Filter, Bell, Clock, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  imageUrl: string;
  datePublication: string;
  auteur: string;
  categorie: "info" | "alerte" | "evenement" | "inscription";
  vue: number;
}

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      const mockAnnonces: Annonce[] = [
        { id: 1, titre: "Inscriptions 2025-2026 ouvertes", contenu: "Les inscriptions pour la nouvelle année scolaire sont désormais ouvertes. Veuillez vous rapprocher du secrétariat.", imageUrl: "/img/inscriptions.jpg", datePublication: "2025-05-15", auteur: "Administration", categorie: "inscription", vue: 1250 },
        { id: 2, titre: "Journée portes ouvertes", contenu: "Venez découvrir notre établissement le samedi 10 juin 2025 de 9h à 17h.", imageUrl: "/img/portes-ouvertes.jpg", datePublication: "2025-05-10", auteur: "Direction", categorie: "evenement", vue: 890 },
        { id: 3, titre: "Vacances de Pâques", contenu: "Les cours seront suspendus du 14 au 25 avril 2025 pour les vacances de Pâques.", imageUrl: "/img/vacances.jpg", datePublication: "2025-04-01", auteur: "Administration", categorie: "info", vue: 2100 },
        { id: 4, titre: "Rentrée scolaire 2025", contenu: "La rentrée aura lieu le 1er octobre 2025 à 8h.", imageUrl: "/img/rentree.jpg", datePublication: "2025-05-20", auteur: "Direction", categorie: "info", vue: 3450 },
        { id: 5, titre: "Alerte Intempéries", contenu: "En raison des fortes pluies, les cours sont annulés ce jour.", imageUrl: "/img/alerte.jpg", datePublication: "2025-05-18", auteur: "Administration", categorie: "alerte", vue: 560 },
        { id: 6, titre: "Conseil de classe", contenu: "Réunion des conseils de classe le 25 mai 2025.", imageUrl: "/img/conseil.jpg", datePublication: "2025-05-12", auteur: "Direction des études", categorie: "evenement", vue: 430 },
      ];
      setAnnonces(mockAnnonces);
      setLoading(false);
    }, 1000);
  }, []);

  const getCategorieBadge = (categorie: string) => {
    switch(categorie) {
      case "info": return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Information</span>;
      case "alerte": return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Alerte</span>;
      case "evenement": return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Événement</span>;
      case "inscription": return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">Inscription</span>;
      default: return <span>{categorie}</span>;
    }
  };

  const filteredAnnonces = annonces.filter(a => {
    const matchesSearch = a.titre.toLowerCase().includes(searchTerm.toLowerCase()) || a.contenu.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = selectedCategorie === "all" || a.categorie === selectedCategorie;
    return matchesSearch && matchesCategorie;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64 pt-20">
          <div className="text-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-500">Chargement des annonces...</p></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[250px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Actualités et annonces</h1>
            <p className="text-lg">Restez informés des dernières nouvelles de l'école</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Rechercher une annonce..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={selectedCategorie} onChange={(e) => setSelectedCategorie(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Toutes les catégories</option>
              <option value="info">Informations</option><option value="alerte">Alertes</option><option value="evenement">Événements</option><option value="inscription">Inscriptions</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm"><Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-800">{annonces.length}</p><p className="text-sm text-gray-500">Annonces</p></div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm"><Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-800">{annonces.filter(a => a.categorie === "evenement").length}</p><p className="text-sm text-gray-500">Événements</p></div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm"><Tag className="w-8 h-8 text-purple-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-800">{annonces.filter(a => a.categorie === "inscription").length}</p><p className="text-sm text-gray-500">Inscriptions</p></div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm"><Eye className="w-8 h-8 text-orange-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-800">{annonces.reduce((acc, a) => acc + a.vue, 0)}</p><p className="text-sm text-gray-500">Vues totales</p></div>
        </div>

        {/* Liste des annonces */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnonces.map((annonce) => (
            <div key={annonce.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => { setSelectedAnnonce(annonce); setShowModal(true); }}>
              <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl">
                {annonce.categorie === "info" && "📢"}
                {annonce.categorie === "alerte" && "⚠️"}
                {annonce.categorie === "evenement" && "🎉"}
                {annonce.categorie === "inscription" && "📝"}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3"><div>{getCategorieBadge(annonce.categorie)}</div><div className="flex items-center gap-1 text-sm text-gray-500"><Eye className="w-3 h-3" />{annonce.vue}</div></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{annonce.titre}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{annonce.contenu}</p>
                <div className="flex justify-between items-center text-sm text-gray-500"><div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(annonce.datePublication).toLocaleDateString()}</div><div className="flex items-center gap-2"><User className="w-4 h-4" />{annonce.auteur}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Détail annonce */}
      {showModal && selectedAnnonce && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="relative h-48 bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white text-6xl">
              {selectedAnnonce.categorie === "info" && "📢"}
              {selectedAnnonce.categorie === "alerte" && "⚠️"}
              {selectedAnnonce.categorie === "evenement" && "🎉"}
              {selectedAnnonce.categorie === "inscription" && "📝"}
            </div>
            <div className="p-6"><button onClick={() => setShowModal(false)} className="float-right text-gray-400 hover:text-gray-600">✕</button>
              <div className="mb-4">{getCategorieBadge(selectedAnnonce.categorie)}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">{selectedAnnonce.titre}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6"><div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(selectedAnnonce.datePublication).toLocaleDateString()}</div><div className="flex items-center gap-1"><User className="w-4 h-4" />{selectedAnnonce.auteur}</div><div className="flex items-center gap-1"><Eye className="w-4 h-4" />{selectedAnnonce.vue} vues</div></div>
              <p className="text-gray-700 leading-relaxed mb-6">{selectedAnnonce.contenu}</p>
              <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}