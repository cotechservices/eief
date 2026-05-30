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
  MoreHorizontal,
  Send,
  ThumbsUp,
  Smile,
  Image as ImageIcon,
  X,
  Calendar,
  User,
  Bell,
  Search,
  Filter,
  ArrowUpRight 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Commentaire {
  id: number;
  auteur: string;
  auteurAvatar: string;
  contenu: string;
  date: string;
  likes: number;
}

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  imageUrl: string;
  datePublication: string;
  auteur: string;
  auteurAvatar: string;
  auteurRole: string;
  categorie: "info" | "alerte" | "evenement" | "inscription";
  likes: number;
  comments: number;
  shares: number;
  views: number;
  userLiked: boolean;
  commentaires: Commentaire[];
}

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const [newComment, setNewComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");

  useEffect(() => {
    setTimeout(() => {
      const mockAnnonces: Annonce[] = [
        { 
          id: 1, 
          titre: "Inscriptions 2025-2026 ouvertes !", 
          contenu: "Les inscriptions pour la nouvelle année scolaire sont désormais ouvertes. Rejoignez notre communauté éducative d'exception. Places limitées !\n\n Documents requis :\n- Extrait de naissance\n- Photos d'identité\n- Bulletin des 2 dernières années\n- Certificat de santé\n\nDate limite : 30 Septembre 2025", 
          imageUrl: "/img/slide2.jpg", 
          datePublication: "2025-05-15T08:30:00", 
          auteur: "Administration", 
          auteurAvatar: "/avatars/admin.jpg",
          auteurRole: "Direction",
          categorie: "inscription", 
          likes: 234, 
          comments: 45, 
          shares: 28, 
          views: 1250,
          userLiked: false,
          commentaires: [
            { id: 1, auteur: "Mme Diallo", auteurAvatar: "/avatars/user1.jpg", contenu: "Super nouvelle ! Mon fils est déjà inscrit", date: "2025-05-15T09:30:00", likes: 12 },
            { id: 2, auteur: "M. Camara", auteurAvatar: "/avatars/user2.jpg", contenu: "Les frais d'inscription sont de combien ?", date: "2025-05-15T10:15:00", likes: 3 }
          ]
        },
        { 
          id: 2, 
          titre: "Journée portes ouvertes", 
          contenu: "Venez découvrir notre établissement ! Au programme : visite des locaux, rencontre avec les enseignants, démonstration de nos équipements technologiques.\n\n Date : Samedi 10 juin 2025\n Heure : 9h - 17h\n Lieu : École Internationale des Enfants Futur\n\n Buvette sur place", 
          imageUrl: "/img/slide1.jpg", 
          datePublication: "2025-05-10T14:00:00", 
          auteur: "Direction", 
          auteurAvatar: "/avatars/directeur.jpg",
          auteurRole: "Directeur",
          categorie: "evenement", 
          likes: 156, 
          comments: 32, 
          shares: 45, 
          views: 890,
          userLiked: true,
          commentaires: [
            { id: 1, auteur: "Mme Barry", auteurAvatar: "/avatars/user3.jpg", contenu: "J'y serai avec mes enfants !", date: "2025-05-10T15:30:00", likes: 8 }
          ]
        },
        { 
          id: 3, 
          titre: "Alerte Intempéries", 
          contenu: "En raison des fortes pluies annoncées, les cours sont annulés ce jour. La reprise aura lieu demain.\n\nRestez connectés pour plus d'informations.\n\nContact : +224 622 123 456", 
          imageUrl: "/img/slide2.jpg", 
          datePublication: "2025-05-18T06:00:00", 
          auteur: "Administration", 
          auteurAvatar: "/avatars/admin.jpg",
          auteurRole: "Urgence",
          categorie: "alerte", 
          likes: 89, 
          comments: 23, 
          shares: 67, 
          views: 560,
          userLiked: false,
          commentaires: []
        },
        { 
          id: 4, 
          titre: "Nouvelle bibliothèque numérique", 
          contenu: "Nous sommes fiers d'annoncer l'ouverture de notre bibliothèque numérique ! Accédez à plus de 1000 livres en ligne depuis votre espace parent.\n\nRomans, manuels, documentaires...\nAccessible 24h/24\nSur mobile, tablette et ordinateur\n\nConnectez-vous dès maintenant pour découvrir cette nouvelle ressource !", 
          imageUrl: "/img/slide2.jpg", 
          datePublication: "2025-05-20T10:00:00", 
          auteur: "Bibliothèque", 
          auteurAvatar: "/avatars/librarian.jpg",
          auteurRole: "Responsable Bibliothèque",
          categorie: "info", 
          likes: 312, 
          comments: 56, 
          shares: 89, 
          views: 2100,
          userLiked: false,
          commentaires: []
        },
        { 
          id: 5, 
          titre: "Nouveau club de robotique", 
          contenu: "Le club de robotique est lancé ! Les inscriptions sont ouvertes pour les élèves de la 6ème à la Terminale.\n\nAu programme :\n- Programmation avec Arduino\n- Construction de robots\n- Compétitions inter-écoles\n- Encadrement par des ingénieurs\n\n Début : 15 juin 2025\n Frais : 150 000 GNF/trimestre\n\nInscrivez-vous vite, places limitées à 20 élèves !", 
          imageUrl: "/img/slide3.jpg", 
          datePublication: "2025-05-22T15:30:00", 
          auteur: "Activités périscolaires", 
          auteurAvatar: "/avatars/coordinator.jpg",
          auteurRole: "Coordinateur",
          categorie: "info", 
          likes: 567, 
          comments: 89, 
          shares: 123, 
          views: 3450,
          userLiked: true,
          commentaires: []
        },
        { 
          id: 6, 
          titre: "Cérémonie de remise des diplômes", 
          contenu: "La cérémonie de remise des diplômes aura lieu le 28 juin 2025 à 10h. Tous les parents sont invités à se joindre à nous pour célébrer la réussite de nos élèves.\n\n Date : 28 juin 2025\n Heure : 10h\n Lieu : Grande salle de l'école\n\n Tenue correcte exigée.", 
          imageUrl: "/img/slide5.jpg", 
          datePublication: "2025-05-23T09:00:00", 
          auteur: "Direction", 
          auteurAvatar: "/avatars/directeur.jpg",
          auteurRole: "Directeur",
          categorie: "evenement", 
          likes: 423, 
          comments: 67, 
          shares: 89, 
          views: 2670,
          userLiked: false,
          commentaires: []
        },
      ];
      setAnnonces(mockAnnonces);
      setLoading(false);
    }, 1000);
  }, []);

  const handleLike = (id: number) => {
    setAnnonces(annonces.map(a => 
      a.id === id ? { ...a, likes: a.userLiked ? a.likes - 1 : a.likes + 1, userLiked: !a.userLiked } : a
    ));
  };

  const handleOpenComments = (annonce: Annonce) => {
    setSelectedAnnonce(annonce);
    setShowCommentModal(true);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedAnnonce) return;
    
    const newCommentObj: Commentaire = {
      id: Date.now(),
      auteur: "Vous",
      auteurAvatar: "/avatars/current-user.jpg",
      contenu: newComment,
      date: new Date().toISOString(),
      likes: 0
    };
    
    setAnnonces(annonces.map(a => 
      a.id === selectedAnnonce.id 
        ? { ...a, comments: a.comments + 1, commentaires: [...a.commentaires, newCommentObj] }
        : a
    ));
    
    setSelectedAnnonce({
      ...selectedAnnonce,
      comments: selectedAnnonce.comments + 1,
      commentaires: [...selectedAnnonce.commentaires, newCommentObj]
    });
    
    setNewComment("");
  };

  const getCategorieColor = (categorie: string) => {
    switch(categorie) {
      case "info": return "border-blue-500";
      case "alerte": return "border-red-500";
      case "evenement": return "border-green-500";
      case "inscription": return "border-purple-500";
      default: return "border-gray-900";
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `il y a ${diff} secondes`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minutes`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} heures`;
    return `il y a ${Math.floor(diff / 86400)} jours`;
  };

  const filteredAnnonces = annonces.filter(a => {
    const matchesSearch = a.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.contenu.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = selectedCategorie === "all" || a.categorie === selectedCategorie;
    return matchesSearch && matchesCategorie;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center h-64 pt-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-900">Chargement des actualités...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      {/* Barre supérieure style Facebook */}
      <div className="fixed top-16 left-0 right-0 bg-white z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Infos</h1>
            </div>
            <div className="flex gap-2 text-black">
              <select
                value={selectedCategorie}
                onChange={(e) => setSelectedCategorie(e.target.value)}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none"
              >
                <option value="all">Toutes</option>
                <option value="info">Informations</option>
                <option value="alerte">Alertes</option>
                <option value="evenement">Événements</option>
                <option value="inscription">Inscriptions</option>
              </select>
            </div>
          </div>
        </div>
      </div>
        <br />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Fil d'actualité */}
          <div className="space-y-4">
            {filteredAnnonces.map((annonce) => (
              <div key={annonce.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${getCategorieColor(annonce.categorie)}`}>
                {/* En-tête */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-black font-bold">
                        {annonce.auteur.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{annonce.auteur}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-900">
                          <span>{annonce.auteurRole}</span>
                          <span>•</span>
                          <span>{getTimeAgo(annonce.datePublication)}</span>
                          <span>•</span>
                          <span><Eye className="w-3 h-3 inline" /> {annonce.views}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-900 hover:text-gray-800">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Contenu */}
                  <div className="mt-3">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">{annonce.titre}</h2>
                    <p className="text-gray-900 whitespace-pre-line">{annonce.contenu}</p>
                  </div>

                  {/* Image avec fill */}
                  {annonce.imageUrl && (
                    <div className="mt-3 -mx-4">
                      <div className="relative h-64 md:h-80 w-full bg-gray-100">
                        <Image
                          src={annonce.imageUrl}
                          alt={annonce.titre}
                          fill
                          className="object-cover hover:scale-105 transition duration-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Statistiques */}
                  <div className="flex items-center justify-between mt-3 pt-2 text-sm text-gray-900 border-t">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px]">👍</div>
                      </div>
                      <span>{annonce.likes}</span>
                    </div>
                    <div className="flex gap-3">
                      <span>{annonce.comments} commentaires</span>
                      {/* <span>{annonce.shares} partages</span> */} 
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-around mt-2 pt-2 border-t">
                    <button 
                      onClick={() => handleLike(annonce.id)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition ${
                        annonce.userLiked 
                          ? "text-blue-600 bg-blue-50" 
                          : "text-gray-900 hover:bg-gray-700"
                      }`}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span className="text-sm font-medium">J'aime</span>
                    </button>
                    <button 
                      onClick={() => handleOpenComments(annonce)}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-gray-900 hover:bg-gray-100 transition"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Commenter</span>
                    </button>
                     {/* 
                    <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-gray-900 hover:bg-gray-100 transition">
                      <ArrowUpRight  className="w-5 h-5" />
                      <span className="text-sm font-medium">Partager</span>
                    </button>*/}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Commentaires style Facebook */}
      {showCommentModal && selectedAnnonce && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* En-tête modal */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Commentaires ({selectedAnnonce.comments})</h2>
              <button onClick={() => setShowCommentModal(false)} className="text-gray-900 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Liste des commentaires */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Publication originale */}
              <div className="pb-4 border-b">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedAnnonce.auteur.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-black">{selectedAnnonce.auteur}</h4>
                      <p className="text-sm text-gray-900 mt-1">{selectedAnnonce.contenu.substring(0, 150)}...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commentaires */}
              {selectedAnnonce.commentaires.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {comment.auteur.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-black">{comment.auteur}</h4>
                      <p className="text-sm text-gray-900">{comment.contenu}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-900 ml-2">
                      <button className="hover:text-blue-600">J'aime</button>
                      <button className="hover:text-blue-600">Répondre</button>
                      <span>{getTimeAgo(comment.date)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {selectedAnnonce.commentaires.length === 0 && (
                <div className="text-center py-8 text-gray-900">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Soyez le premier à commenter</p>
                </div>
              )}
            </div>

            {/* Zone de saisie commentaire */}
            <div className="p-4 border-t">
              <div className="flex gap-3 text-black">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  V
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Écrivez un commentaire..."
                    className="w-full px-4 py-2 text-black bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}