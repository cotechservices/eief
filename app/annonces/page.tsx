// app/annonces/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Heart, 
  Share2, 
  Bookmark, 
  Calendar,
  Bell,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn
} from "lucide-react";
import Image from "next/image";

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  imageUrls: string[];
  datePublication: string;
  auteur: string;
  categorie: "info" | "alerte" | "evenement" | "inscription";
  likes: number;
  comments: number;
  views: number;
  userLiked: boolean;
}

// Modal pour afficher l'image en grand format A4
function ImageModal({ imageUrl, alt, onClose }: { imageUrl: string; alt: string; onClose: () => void }) {
  // Fermer avec la touche Echap
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg shadow-2xl overflow-hidden cursor-default"
        style={{
          width: '21cm', // Format A4 largeur
          maxWidth: '90vw',
          height: '29.7cm', // Format A4 hauteur
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Image en plein écran A4 */}
        <div className="relative w-full h-full">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Info image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm text-center">{alt}</p>
        </div>
      </div>
    </div>
  );
}

// Carrousel avec images cliquables
function AnnonceCarousel({ images, alt, onImageClick }: { images: string[]; alt: string; onImageClick: (url: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageClick = () => {
    onImageClick(images[currentIndex]);
  };

  if (images.length === 1) {
    return (
      <div className="relative w-full h-full group cursor-pointer" onClick={handleImageClick}>
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <div className="relative w-full h-full cursor-pointer" onClick={handleImageClick}>
        <img
          src={images[currentIndex]}
          alt={`${alt} - ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-500 ease-in-out"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
        </div>
      </div>
      
      {/* Navigation arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition z-10 cursor-pointer opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition z-10 cursor-pointer opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
            className={`w-2 h-2 rounded-full transition cursor-pointer ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}

const getCategory = (titre: string, contenu: string): "info" | "alerte" | "evenement" | "inscription" => {
  const titleLower = (titre || "").toLowerCase();
  const contentLower = (contenu || "").toLowerCase();
  
  if (titleLower.includes("inscription") || contentLower.includes("inscription")) {
    return "inscription";
  }
  if (titleLower.includes("alerte") || titleLower.includes("urgent") || titleLower.includes("annul") || contentLower.includes("alerte") || contentLower.includes("urgent")) {
    return "alerte";
  }
  if (titleLower.includes("portes ouvertes") || titleLower.includes("fête") || titleLower.includes("événement") || titleLower.includes("recherche") || titleLower.includes("visite")) {
    return "evenement";
  }
  return "info";
};

const getCategoryImageUrl = (category: string, id: number) => {
  const images = ["/img/slide2.jpg", "/img/slide3.jpg", "/img/slide5.jpg"];
  if (category === "inscription") return "/img/slide3.jpg";
  if (category === "evenement") return "/img/slide2.jpg";
  if (category === "alerte") return "/img/slide5.jpg";
  return images[id % images.length];
};

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const handleShare = async (annonce: Annonce) => {
    const shareUrl = `${window.location.origin}/annonces?id=${annonce.id}`;
    const shareText = `Découvrez cette annonce de l'EIEF : ${annonce.titre}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: annonce.titre,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erreur de partage:', err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast("Lien de l'annonce copié dans le presse-papiers !");
    } catch (err) {
      setToast("Lien de l'annonce prêt à être partagé !");
    }
    
    setTimeout(() => {
      setToast(null);
    }, 3000);

    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookShareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  useEffect(() => {
    const fetchRealAnnonces = async () => {
      try {
        const res = await fetch("/api/public/annonces");
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((a: any) => {
            const cat = getCategory(a.titre, a.contenu);
            let urls: string[] = [];
            if (a.image_url) {
              if (a.image_url.startsWith("[")) {
                try {
                  urls = JSON.parse(a.image_url);
                } catch (e) {
                  urls = [a.image_url];
                }
              } else {
                urls = [a.image_url];
              }
            } else {
              urls = [getCategoryImageUrl(cat, a.id)];
            }
            return {
              id: a.id,
              titre: a.titre,
              contenu: a.contenu,
              datePublication: a.date_publication,
              auteur: a.auteur || "Administration",
              categorie: cat,
              imageUrls: urls,
              likes: Math.max(0, (a.id * 17) % 89),
              comments: Math.max(0, (a.id * 7) % 23),
              views: 100 + (a.id * 143) % 950,
              userLiked: false
            };
          });
          setAnnonces(mapped);
        }
      } catch (err) {
        console.error("Erreur chargement annonces:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealAnnonces();
  }, []);

  const getCategorieStyle = (categorie: string) => {
    switch(categorie) {
      case "info": return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200",};
      case "alerte": return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200"};
      case "evenement": return { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" };
      case "inscription": return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200"};
      default: return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
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

  const openImageModal = (url: string, alt: string) => {
    setSelectedImage(url);
    setSelectedImageAlt(alt);
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setSelectedImageAlt("");
    // Réactiver le scroll du body
    document.body.style.overflow = 'auto';
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
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 z-0">
          <img
            src="/img/slide3.jpg"
            alt="Annonces"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Annonces & Actualités</h1>
            <p className="text-lg max-w-2xl text-blue-100">
              Restez informés des dernières nouvelles de l'école
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="container mx-auto px-4 py-6 text-black">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher une annonce..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="info">Informations</option>
              <option value="evenement">Événements</option>
              <option value="alerte">Alertes</option>
              <option value="inscription">Inscriptions</option>
            </select>
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${categorieStyle.bg} ${categorieStyle.text}`}>
                          <span className="mr-1">{categorieStyle.icon}</span>
                          {annonce.categorie === "info" && "Information"}
                          {annonce.categorie === "alerte" && "Alerte"}
                          {annonce.categorie === "evenement" && "Événement"}
                          {annonce.categorie === "inscription" && "Inscription"}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(annonce.datePublication)}
                        </span>
                      </div>
                      <h3 className="text-xl text-blue-800 mt-1">Ecole Internationale des Enfants du Futur</h3>
                      <h2 className="text-xl font-bold text-gray-900">{annonce.titre}</h2>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed mt-3">{annonce.contenu}</p>
                </div>

                {/* Images Carousel - Cliquables */}
                {annonce.imageUrls && annonce.imageUrls.length > 0 && (
                  <div className="relative h-64 md:h-80 w-full bg-gray-100 border-y overflow-hidden">
                    <AnnonceCarousel 
                      images={annonce.imageUrls} 
                      alt={annonce.titre} 
                      onImageClick={openImageModal}
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
                    <button 
                      onClick={() => handleShare(annonce)}
                      className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition"
                    >
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
              <h3 className="text-lg font-medium text-gray-600">Aucune annonce pour l'instant</h3>
              <p className="text-gray-400 mt-2">Vérifiez plus tard ou modifiez vos filtres</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal image format A4 */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          alt={selectedImageAlt} 
          onClose={closeImageModal}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}