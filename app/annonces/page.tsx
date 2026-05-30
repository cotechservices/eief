// app/annonces/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Bookmark, 
  Calendar,
  Bell,
  Search,
  Filter,
  Send,
  ThumbsUp,
  X,
  Clock,
  Tag
} from "lucide-react";
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
  likes: number;
  comments: number;
  views: number;
  userLiked: boolean;
}

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    // Simulation de chargement des données
    setTimeout(() => {
      const mockAnnonces: Annonce[] = [
        { 
          id: 1, 
          titre: "Inscriptions 2025-2026 ouvertes", 
          contenu: "Les inscriptions pour la nouvelle année scolaire sont désormais ouvertes. Rejoignez notre communauté éducative d'exception. Places limitées !", 
          imageUrl: "/img/slide2.jpg", 
          datePublication: "2025-05-15T08:30:00", 
          auteur: "Administration", 
          categorie: "inscription", 
          likes: 234, 
          comments: 45, 
          views: 1250,
          userLiked: false
        },
        { 
          id: 2, 
          titre: "Journée portes ouvertes", 
          contenu: "Venez découvrir notre établissement ! Au programme : visite des locaux, rencontre avec les enseignants, démonstration de nos équipements technologiques.", 
          imageUrl: "/img/slide3.jpg", 
          datePublication: "2025-05-10T14:00:00", 
          auteur: "Direction", 
          categorie: "evenement", 
          likes: 156, 
          comments: 32, 
          views: 890,
          userLiked: true
        },
        { 
          id: 3, 
          titre: "Alerte Intempéries", 
          contenu: "En raison des fortes pluies annoncées, les cours sont annulés ce jour. La reprise aura lieu demain.", 
          imageUrl: "/img/slide5.jpg", 
          datePublication: "2025-05-18T06:00:00", 
          auteur: "Administration", 
          categorie: "alerte", 
          likes: 89, 
          comments: 23, 
          views: 560,
          userLiked: false
        },
        { 
          id: 4, 
          titre: "Nouvelle bibliothèque numérique", 
          contenu: "Nous sommes fiers d'annoncer l'ouverture de notre bibliothèque numérique ! Accédez à plus de 1000 livres en ligne.", 
          imageUrl: "/img/slide2.jpg", 
          datePublication: "2025-05-20T10:00:00", 
          auteur: "Bibliothèque", 
          categorie: "info", 
          likes: 312, 
          comments: 56, 
          views: 2100,
          userLiked: false
        },
      ];
      setAnnonces(mockAnnonces);
      setLoading(false);
    }, 1000);
  }, []);

  const getCategorieStyle = (categorie: string) => {
    switch(categorie) {
      case "info": return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", icon: "ℹ" };
      case "alerte": return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: "" };
      case "evenement": return { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", icon: "" };
      case "inscription": return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", icon: "" };
      default: return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: "" };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `à l'instant`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
    return `le ${date.toLocaleDateString('fr-FR')}`;
  };

  const handleLike = (id: number) => {
    setAnnonces(annonces.map(a => 
      a.id === id ? { ...a, likes: a.userLiked ? a.likes - 1 : a.likes + 1, userLiked: !a.userLiked } : a
    ));
  };

  const filteredAnnonces = annonces.filter(a => {
    const matchesSearch = a.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.contenu.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = selectedCategorie === "all" || a.categorie === selectedCategorie;
    return matchesSearch && matchesCategorie;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96 pt-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des annonces...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[350px] mt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/slide3.jpg"
            alt="Annonces"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-600/80 z-10" />
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Annonces & Actualités</h1>
            <p className="text-lg max-w-2xl text-blue-100">
              Restez informés des dernières nouvelles de l'école
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Liste des annonces */}
        <div className="max-w-3xl mx-auto space-y-5">
          {filteredAnnonces.map((annonce) => {
            const categorieStyle = getCategorieStyle(annonce.categorie);
            return (
              <div key={annonce.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                {/* En-tête */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xl font-medium px-2 py-0.5 rounded-full ${categorieStyle.bg} ${categorieStyle.text}`}>
                            {annonce.categorie === "info" && "Information"}
                            {annonce.categorie === "alerte" && "Alerte"}
                            {annonce.categorie === "evenement" && "Événement"}
                            {annonce.categorie === "inscription" && "Inscription"}
                          </span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(annonce.datePublication)}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mt-1">{annonce.titre}</h2>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed">{annonce.contenu}</p>
                </div>

                {/* Image */}
                {annonce.imageUrl && (
                  <div className="relative h-56 md:h-64 w-full">
                    <Image
                      src={annonce.imageUrl}
                      alt={annonce.titre}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-6">
                    <button
                      onClick={() => handleLike(annonce.id)}
                      className={`flex items-center gap-2 transition ${annonce.userLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                      <Heart className={`w-5 h-5 ${annonce.userLiked ? 'fill-blue-600' : ''}`} />
                      <span className="text-sm font-medium">{annonce.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{annonce.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Partager</span>
                    </button>
                  </div>
                  <button className="text-gray-400 hover:text-blue-600 transition">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Message si aucun résultat */}
          {filteredAnnonces.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">Aucune annonce trouvée</h3>
              <p className="text-gray-400 mt-1">Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}