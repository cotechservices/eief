// app/dashboard/admin/annonces/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Search, Send, Clock, CheckCircle, Users, ImageIcon, Eye, X, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Megaphone, Calendar, Info, Bell
} from "lucide-react";

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  cible: string;
  type: string;
  classe_nom: string | null;
  date_publication: string;
  auteur: string;
  image_url?: string | null;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const getFirstImage = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("[")) {
    try {
      const urls = JSON.parse(imageUrl);
      return urls[0] || "";
    } catch (e) {
      return imageUrl;
    }
  }
  return imageUrl;
};

const getAllImages = (imageUrl: string | null | undefined): string[] => {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try {
      return JSON.parse(imageUrl);
    } catch (e) {
      return [imageUrl];
    }
  }
  return [imageUrl];
};

function AnnonceCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        className="object-cover w-full h-full"
      />
    );
  }

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full">
      <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
        <img
          src={images[currentIndex]}
          alt={`${alt} - ${currentIndex + 1}`}
          className="object-contain max-w-full max-h-full w-full h-full"
        />
      </div>
      
      <button 
        onClick={prevSlide}
        type="button"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition z-10 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        onClick={nextSlide}
        type="button"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition z-10 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
            className={`w-2 h-2 rounded-full transition cursor-pointer ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    cible: "tous",
    type: "information"
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // État pour le modal de confirmation de suppression
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [annonceToDelete, setAnnonceToDelete] = useState<{ id: number; titre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fonction pour ajouter une notification
  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Fonction pour supprimer une notification
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchAnnonces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/annonces');
      if (res.ok) {
        const data = await res.json();
        setAnnonces(data);
      }
    } catch (e) {
      console.error(e);
      addNotification("error", "Erreur lors du chargement des annonces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      
      const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const handleRemovePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    const urls: string[] = [];
    for (const file of selectedFiles) {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      try {
        const res = await fetch("/api/admin/annonces/upload", {
          method: "POST",
          body: formDataUpload,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            urls.push(data.url);
          }
        }
      } catch (err) {
        console.error("Erreur upload fichier:", err);
        addNotification("error", "Erreur lors de l'upload des images");
      }
    }
    return urls;
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({ titre: "", contenu: "", cible: "tous", type: "information" });
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await handleUploadImages();
      }

      const res = await fetch('/api/admin/annonces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image_url: uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null
        })
      });
      if (res.ok) {
        handleCloseForm();
        fetchAnnonces();
        addNotification("success", "Annonce publiée avec succès");
      } else {
        addNotification("error", "Erreur lors de la création de l'annonce");
      }
    } catch (e) {
      console.error(e);
      addNotification("error", "Erreur lors de la création de l'annonce");
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour afficher le contenu de l'annonce
  const handleView = (annonce: Annonce) => {
    setSelectedAnnonce(annonce);
    setShowViewModal(true);
  };

  // Fonction pour modifier l'annonce
  const handleEdit = (annonce: Annonce) => {
    setSelectedAnnonce(annonce);
    setFormData({
      titre: annonce.titre,
      contenu: annonce.contenu,
      cible: annonce.cible,
      type: annonce.type || "information"
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowEditModal(true);
  };
  // Fonction pour sauvegarder la modification
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnonce) return;
    
    setUploading(true);
    try {
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await handleUploadImages();
      }

      // Récupérer les images existantes (après suppression éventuelle dans l'UI)
      let existingImages = getAllImages(selectedAnnonce.image_url);
      
      // Fusionner les images existantes avec les nouvelles
      const allImages = [...existingImages, ...uploadedUrls];

      const res = await fetch('/api/admin/annonces', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAnnonce.id,
          titre: formData.titre,
          contenu: formData.contenu,
          cible: formData.cible,
          type: formData.type,
          image_url: allImages.length > 0 ? JSON.stringify(allImages) : null
        })
      });
      
      if (res.ok) {
        setShowEditModal(false);
        setSelectedAnnonce(null);
        setSelectedFiles([]);
        setPreviewUrls([]);
        fetchAnnonces();
        addNotification("success", "Annonce modifiée avec succès");
      } else {
        addNotification("error", "Erreur lors de la modification de l'annonce");
      }
    } catch (e) {
      console.error(e);
      addNotification("error", "Erreur lors de la modification");
    } finally {
      setUploading(false);
    }
  };

  // Ouvrir le modal de confirmation de suppression
  const openConfirmModal = (id: number, titre: string) => {
    setAnnonceToDelete({ id, titre });
    setShowConfirmModal(true);
  };

  // Fonction de suppression
  const handleDelete = async () => {
    if (!annonceToDelete) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/annonces?id=${annonceToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAnnonces();
        setShowConfirmModal(false);
        setAnnonceToDelete(null);
        addNotification("success", `Annonce "${annonceToDelete.titre}" supprimée avec succès`);
      } else {
        addNotification("error", "Erreur lors de la suppression de l'annonce");
      }
    } catch (e) {
      console.error(e);
      addNotification("error", "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const getCibleBadge = (cible: string) => {
    const styles: Record<string, string> = {
      tous: "bg-blue-100 text-blue-700",
      parent: "bg-purple-100 text-purple-700",
      enseignant: "bg-green-100 text-green-700",
      classe: "bg-orange-100 text-orange-700"
    };
    const styleClass = styles[cible] || 'bg-gray-100 text-gray-700';
    const label = cible.charAt(0).toUpperCase() + cible.slice(1);
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styleClass}`}>{label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      information: "bg-blue-100 text-blue-700",
      evenement: "bg-purple-100 text-purple-700",
      alerte: "bg-red-100 text-red-700",
      rappel: "bg-yellow-100 text-yellow-700"
    };
    const icons: Record<string, JSX.Element> = {
      information: <Info className="w-3 h-3" />,
      evenement: <Calendar className="w-3 h-3" />,
      alerte: <AlertTriangle className="w-3 h-3" />,
      rappel: <Bell className="w-3 h-3" />
    };
    const styleClass = styles[type] || 'bg-gray-100 text-gray-700';
    const labels: Record<string, string> = {
      information: "Information",
      evenement: "Événement",
      alerte: "Alerte",
      rappel: "Rappel"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styleClass}`}>
        {icons[type]}
        {labels[type] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Notifications Toast */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${
              notification.type === "success" 
                ? "bg-green-50 border-l-4 border-green-500 text-green-800" 
                : notification.type === "error"
                ? "bg-red-50 border-l-4 border-red-500 text-red-800"
                : notification.type === "warning"
                ? "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800"
                : "bg-blue-50 border-l-4 border-blue-500 text-blue-800"
            }`}
          >
            <div className="flex-1">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notification.type === "error" && <AlertTriangle className="w-5 h-5 text-red-500" />}
              {notification.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Annonces</h1>
          <p className="text-gray-900 text-sm">Gérez les communications de l'école</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Cible</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Auteur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Date de pub.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {annonces.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {a.image_url && getFirstImage(a.image_url) && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border">
                          <img
                            src={getFirstImage(a.image_url)}
                            alt=""
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{a.titre}</p>
                        <p className="text-xs text-gray-900 line-clamp-1">{a.contenu.substring(0, 60)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getTypeBadge(a.type)}</td>
                  <td className="px-6 py-4">{getCibleBadge(a.cible)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{a.auteur}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {a.date_publication ? new Date(a.date_publication).toLocaleDateString() : "-"}
                   </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleView(a)} 
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Voir le contenu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(a)} 
                        className="text-green-600 hover:text-green-800 transition"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openConfirmModal(a.id, a.titre)} 
                        className="text-red-600 hover:text-red-800 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
              {annonces.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-900">
                    Aucune annonce n'a été publiée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pour afficher le contenu de l'annonce */}
      {showViewModal && selectedAnnonce && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {getTypeBadge(selectedAnnonce.type)}
                  <h2 className="text-xl font-bold text-black">{selectedAnnonce.titre}</h2>
                </div>
                <button 
                  onClick={() => setShowViewModal(false)} 
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Images */}
              {selectedAnnonce.image_url && getAllImages(selectedAnnonce.image_url).length > 0 && (
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  <div className="h-64">
                    <AnnonceCarousel 
                      images={getAllImages(selectedAnnonce.image_url)} 
                      alt={selectedAnnonce.titre} 
                    />
                  </div>
                </div>
              )}
              
              {/* Métadonnées */}
              <div className="flex flex-wrap gap-4 pb-4 border-b">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Cible: {getCibleBadge(selectedAnnonce.cible)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Publié le: {new Date(selectedAnnonce.date_publication).toLocaleDateString()} à {new Date(selectedAnnonce.date_publication).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Auteur: {selectedAnnonce.auteur}</span>
                </div>
              </div>
              
              {/* Contenu */}
              <div className="prose max-w-none">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Contenu :</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedAnnonce.contenu}</p>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowViewModal(false)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour modifier l'annonce */}
      {showEditModal && selectedAnnonce && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-black">Modifier l'annonce</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Titre *</label>
                <input 
                  type="text" 
                  value={formData.titre} 
                  onChange={(e) => setFormData({...formData, titre: e.target.value})} 
                  className="w-full text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Type d'annonce *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "information"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "information"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Information</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "evenement"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "evenement"
                        ? "bg-purple-50 border-purple-500 text-purple-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Événement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "alerte"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "alerte"
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Alerte</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "rappel"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "rappel"
                        ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Rappel</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Contenu *</label>
                <textarea 
                  rows={4} 
                  value={formData.contenu} 
                  onChange={(e) => setFormData({...formData, contenu: e.target.value})} 
                  className="w-full text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Cible</label>
                <select 
                  value={formData.cible} 
                  onChange={(e) => setFormData({...formData, cible: e.target.value})} 
                  className="w-full text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tous">Tous (Public)</option>
                  <option value="parent">Parents uniquement</option>
                  <option value="enseignant">Enseignants uniquement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Ajouter des images</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Cliquez ou glissez des images ici</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP jusqu'à 5 Mo</p>
                  </div>
                </div>
                
                {/* Images existantes avec bouton de suppression */}
                {selectedAnnonce.image_url && getAllImages(selectedAnnonce.image_url).length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-500">Images actuelles :</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Supprimer toutes les images ?")) {
                            setSelectedAnnonce({
                              ...selectedAnnonce,
                              image_url: null
                            });
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 transition"
                      >
                        Tout supprimer
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {getAllImages(selectedAnnonce.image_url).map((url, idx) => (
                        <div key={idx} className="relative w-full h-16 rounded-lg overflow-hidden border group">
                          <img 
                            src={url} 
                            alt={`Image ${idx + 1}`} 
                            className="object-cover w-full h-full" 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentImages = getAllImages(selectedAnnonce.image_url);
                              const newImages = currentImages.filter((_, i) => i !== idx);
                              setSelectedAnnonce({
                                ...selectedAnnonce,
                                image_url: newImages.length > 0 ? JSON.stringify(newImages) : null
                              });
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Nouvelles images en prévisualisation */}
                {previewUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Nouvelles images à ajouter :</p>
                    <div className="grid grid-cols-3 gap-3">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative w-full h-20 rounded-xl overflow-hidden group border">
                          <img src={url} alt="Aperçu" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => handleRemovePreview(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition"
                            disabled={uploading}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAnnonce(null);
                    setSelectedFiles([]);
                    setPreviewUrls([]);
                  }} 
                  className="px-4 py-2 text-black border border-gray-300 rounded-xl hover:bg-gray-100 transition"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showConfirmModal && annonceToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Confirmer la suppression</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Êtes-vous sûr de vouloir supprimer cette annonce ?
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mb-4">
                {annonceToDelete.titre}
              </p>
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cette action est irréversible. Tous les médias associés seront également supprimés.
              </p>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setAnnonceToDelete(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire - Nouvelle annonce */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-black">Nouvelle annonce</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Titre *</label>
                <input 
                  type="text" 
                  value={formData.titre} 
                  onChange={(e) => setFormData({...formData, titre: e.target.value})} 
                  className="w-full text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Type d'annonce *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "information"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "information"
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Information</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "evenement"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "evenement"
                        ? "bg-purple-50 border-purple-500 text-purple-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Événement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "alerte"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "alerte"
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Alerte</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "rappel"})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                      formData.type === "rappel"
                        ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Rappel</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Contenu *</label>
                <textarea 
                  rows={4} 
                  value={formData.contenu} 
                  onChange={(e) => setFormData({...formData, contenu: e.target.value})} 
                  className="w-full text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Cible</label>
                <select 
                  value={formData.cible} 
                  onChange={(e) => setFormData({...formData, cible: e.target.value})} 
                  className="w-full text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tous">Tous (Public)</option>
                  <option value="parent">Parents uniquement</option>
                  <option value="enseignant">Enseignants uniquement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Images (une ou plusieurs)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Cliquez ou glissez des images ici</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP jusqu'à 5 Mo</p>
                  </div>
                </div>
                
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative w-full h-20 rounded-xl overflow-hidden group border">
                        <img src={url} alt="Aperçu" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => handleRemovePreview(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition"
                          disabled={uploading}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={handleCloseForm} 
                  className="px-4 py-2 text-black border border-gray-300 rounded-xl hover:bg-gray-100 transition"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publication...
                    </>
                  ) : "Publier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}