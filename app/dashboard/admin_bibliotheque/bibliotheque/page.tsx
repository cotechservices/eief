// app/dashboard/admin_bibliotheque/bibliotheque/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen, BookMarked, Users, Search, Plus, Trash2, Edit,
  CheckCircle, Clock, AlertCircle, X, ImageIcon, Loader2,
  FileText, BookA, Library
} from "lucide-react";

interface Livre {
  id: number;
  titre: string;
  auteur: string;
  isbn: string;
  quantite: number;
  disponible: number;
  emplacement: string;
  categorie: string;
  image_url?: string | null;
}

interface Emprunt {
  id: number;
  livre_titre: string;
  eleve_nom: string;
  classe_nom: string;
  date_emprunt: string;
  date_retour_prevue: string;
  date_retour_reelle: string | null;
  statut: string;
}

const CATEGORIES = [
  { id: "scolaire", nom: "📚 Scolaire & Sciences", color: "bg-blue-100 text-blue-700" },
  { id: "litterature", nom: "📖 Littérature & Romans", color: "bg-purple-100 text-purple-700" },
  { id: "histoire", nom: "🏛️ Histoire & Géographie", color: "bg-amber-100 text-amber-700" },
  { id: "art", nom: "🎨 Art & Musique", color: "bg-pink-100 text-pink-700" },
  { id: "langues", nom: "🌍 Langues Étrangères", color: "bg-green-100 text-green-700" },
  { id: "dictionnaires", nom: "📘 Dictionnaires & Encylopédies", color: "bg-gray-100 text-gray-700" },
  { id: "bd", nom: "🎭 Bandes Dessinées", color: "bg-orange-100 text-orange-700" },
];

const EMPLACEMENTS = [
  { id: "A1", nom: "Rayon A1 - Sciences", zone: "Étage 1 - Aile Gauche" },
  { id: "A2", nom: "Rayon A2 - Mathématiques", zone: "Étage 1 - Aile Gauche" },
  { id: "B1", nom: "Rayon B1 - Littérature Française", zone: "Étage 1 - Aile Droite" },
  { id: "B2", nom: "Rayon B2 - Littérature Étrangère", zone: "Étage 1 - Aile Droite" },
  { id: "C1", nom: "Rayon C1 - Histoire", zone: "Étage 2 - Aile Gauche" },
  { id: "C2", nom: "Rayon C2 - Géographie", zone: "Étage 2 - Aile Gauche" },
  { id: "D1", nom: "Rayon D1 - Langues", zone: "Étage 2 - Aile Droite" },
  { id: "D2", nom: "Rayon D2 - Dictionnaires", zone: "Étage 2 - Aile Droite" },
  { id: "E1", nom: "Rayon E1 - BD & Mangas", zone: "Étage 3 - Espace Jeunesse" },
  { id: "F1", nom: "Rayon F1 - Art & Musique", zone: "Étage 3 - Aile Gauche" },
  { id: "G1", nom: "Rayon G1 - Nouveautés", zone: "Rez-de-chaussée - Vitrine" },
];

export default function BibliothequePage() {
  const [activeTab, setActiveTab] = useState<"livres" | "emprunts">("livres");
  const [livres, setLivres] = useState<Livre[]>([]);
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showLivreForm, setShowLivreForm] = useState(false);
  const [showEmpruntForm, setShowEmpruntForm] = useState(false);
  const [editingLivre, setEditingLivre] = useState<Livre | null>(null);

  const [livreData, setLivreData] = useState({
    titre: "", auteur: "", isbn: "", quantite: 1, emplacement: "", categorie: "", image_url: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [empruntData, setEmpruntData] = useState({
    livre_id: "", eleve_id: "", date_retour_prevue: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resLivres, resEmprunts, resEleves] = await Promise.all([
        fetch('/api/admin/bibliotheque/livres'),
        fetch('/api/admin/bibliotheque/emprunts'),
        fetch('/api/admin/eleves')
      ]);
      if (resLivres.ok) setLivres(await resLivres.json());
      if (resEmprunts.ok) setEmprunts(await resEmprunts.json());
      if (resEleves.ok) setEleves(await resEleves.json());
    } catch (e) {
      console.error(e);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/bibliotheque/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (err) {
      console.error("Erreur upload:", err);
    }
    return null;
  };

  const handleLivreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = livreData.image_url;
      
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const method = editingLivre ? 'PUT' : 'POST';
      const body = { 
        ...livreData, 
        id: editingLivre?.id,
        image_url: imageUrl
      };
      const res = await fetch('/api/admin/bibliotheque/livres', {
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowLivreForm(false);
        setEditingLivre(null);
        setSelectedFile(null);
        setPreviewUrl("");
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (e) { 
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLivre = async (id: number) => {
    if (confirm("Supprimer ce livre de la bibliothèque ?")) {
      try {
        await fetch(`/api/admin/bibliotheque/livres?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (e) { console.error(e); }
    }
  };

  const handleEmpruntSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/bibliotheque/emprunts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empruntData)
      });
      if (res.ok) {
        setShowEmpruntForm(false);
        setEmpruntData({ livre_id: "", eleve_id: "", date_retour_prevue: "" });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'emprunt");
      }
    } catch (e) { console.error(e); }
  };

  const handleRetournerLivre = async (id: number) => {
    if (confirm("Confirmer le retour de ce livre ?")) {
      try {
        await fetch('/api/admin/bibliotheque/emprunts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'retourner' })
        });
        fetchData();
      } catch (e) { console.error(e); }
    }
  };

  const getCategorieInfo = (categorieId: string) => {
    return CATEGORIES.find(c => c.id === categorieId) || CATEGORIES[0];
  };

  const getEmplacementInfo = (emplacementId: string) => {
    return EMPLACEMENTS.find(e => e.id === emplacementId);
  };

  const filteredLivres = livres.filter(l => 
    l.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.auteur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmprunts = emprunts.filter(e => 
    e.livre_titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.eleve_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalLivres: livres.reduce((acc, l) => acc + l.quantite, 0),
    livresDispos: livres.reduce((acc, l) => acc + l.disponible, 0),
    empruntsActifs: emprunts.filter(e => e.statut === 'en_cours' || e.statut === 'en_retard').length,
    empruntsRetard: emprunts.filter(e => e.statut === 'en_retard').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Library className="w-7 h-7 text-purple-600" />
            Gestion de la Bibliothèque
          </h1>
          <p className="text-gray-500 mt-1">Gérez les livres et les emprunts</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/admin_transport/bibliotheque/rapports"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Rapports
          </Link>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Total livres</p><p className="text-2xl font-bold text-blue-600">{stats.totalLivres}</p></div>
          <BookOpen className="text-blue-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Disponibles</p><p className="text-2xl font-bold text-green-600">{stats.livresDispos}</p></div>
          <CheckCircle className="text-green-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Emprunts en cours</p><p className="text-2xl font-bold text-orange-600">{stats.empruntsActifs}</p></div>
          <BookMarked className="text-orange-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">En retard</p><p className="text-2xl font-bold text-red-600">{stats.empruntsRetard}</p></div>
          <AlertCircle className="text-red-200 w-10 h-10" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b flex-wrap">
          <button
            onClick={() => setActiveTab("livres")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "livres"
                ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50/50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Inventaire ({livres.length})
          </button>
          <button
            onClick={() => setActiveTab("emprunts")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "emprunts"
                ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50/50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BookMarked className="w-4 h-4 inline mr-2" />
            Emprunts ({emprunts.length})
          </button>
        </div>

        <div className="p-4 border-b flex flex-wrap justify-between gap-2 bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {activeTab === "livres" ? (
            <button
              onClick={() => {
                setEditingLivre(null);
                setLivreData({ titre: "", auteur: "", isbn: "", quantite: 1, emplacement: "", categorie: "", image_url: "" });
                setSelectedFile(null);
                setPreviewUrl("");
                setShowLivreForm(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-purple-700 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Ajouter un livre
            </button>
          ) : (
            <button
              onClick={() => setShowEmpruntForm(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-orange-600 transition whitespace-nowrap"
            >
              <BookMarked className="w-4 h-4" /> Nouvel emprunt
            </button>
          )}
        </div>

        {/* Tab Livres */}
        {activeTab === "livres" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Livre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emplacement</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantité</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Disponible</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLivres.map(l => {
                  const categorie = getCategorieInfo(l.categorie);
                  const emplacement = getEmplacementInfo(l.emplacement);
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {l.image_url ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={l.image_url} alt={l.titre} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{l.titre}</p>
                            <p className="text-sm text-gray-500">{l.auteur}</p>
                            <p className="text-xs text-gray-400">ISBN: {l.isbn || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categorie.color}`}>
                          {categorie.nom}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{emplacement?.nom || l.emplacement || "-"}</div>
                        {emplacement && <div className="text-xs text-gray-400">{emplacement.zone}</div>}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{l.quantite}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          l.disponible > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {l.disponible}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingLivre(l);
                              setLivreData(l);
                              setSelectedFile(null);
                              setPreviewUrl("");
                              setShowLivreForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLivre(l.id)}
                            className="text-red-600 hover:text-red-800 p-1 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLivres.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Aucun livre trouvé</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Emprunts */}
        {activeTab === "emprunts" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Livre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élève</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date Prêt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Retour Prévu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmprunts.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.livre_titre}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{e.eleve_nom}</div>
                      <div className="text-xs text-gray-400">{e.classe_nom}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(e.date_emprunt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(e.date_retour_prevue).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.statut === 'en_cours' && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">📖 En cours</span>
                      )}
                      {e.statut === 'retourne' && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✅ Retourné</span>
                      )}
                      {e.statut === 'en_retard' && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">⚠️ En retard</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.statut !== 'retourne' && (
                        <button
                          onClick={() => handleRetournerLivre(e.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700 transition"
                        >
                          Retourner
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredEmprunts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <BookMarked className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Aucun emprunt trouvé</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulaire Livre */}
      {showLivreForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLivre ? "Modifier le livre" : "Ajouter un livre"}
              </h2>
              <button onClick={() => setShowLivreForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLivreSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image du livre</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 transition relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  {previewUrl || livreData.image_url ? (
                    <div className="relative inline-block">
                      <img src={previewUrl || livreData.image_url || ""} alt="Aperçu" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                      <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Cliquez pour ajouter une image</p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input required type="text" value={livreData.titre} onChange={e => setLivreData({ ...livreData, titre: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auteur *</label>
                <input required type="text" value={livreData.auteur} onChange={e => setLivreData({ ...livreData, auteur: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input type="text" value={livreData.isbn} onChange={e => setLivreData({ ...livreData, isbn: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" placeholder="978-2-1234-5680-4" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                  <input required type="number" min="1" value={livreData.quantite} onChange={e => setLivreData({ ...livreData, quantite: parseInt(e.target.value) })} className="w-full border border-gray-300 p-2 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select required value={livreData.categorie} onChange={e => setLivreData({ ...livreData, categorie: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Sélectionner une catégorie</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement *</label>
                <select required value={livreData.emplacement} onChange={e => setLivreData({ ...livreData, emplacement: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Sélectionner un emplacement</option>
                  {EMPLACEMENTS.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom} - {emp.zone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowLivreForm(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
                  Annuler
                </button>
                <button type="submit" disabled={uploading} className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Formulaire Emprunt */}
      {showEmpruntForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Nouvel emprunt</h2>
              <button onClick={() => setShowEmpruntForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEmpruntSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Livre *</label>
                <select required value={empruntData.livre_id} onChange={e => setEmpruntData({ ...empruntData, livre_id: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Sélectionner un livre</option>
                  {livres.filter(l => l.disponible > 0).map(l => (
                    <option key={l.id} value={l.id}>{l.titre} (Dispo: {l.disponible})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Élève *</label>
                <select required value={empruntData.eleve_id} onChange={e => setEmpruntData({ ...empruntData, eleve_id: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Sélectionner un élève</option>
                  {eleves.map(e => (
                    <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.matricule})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour prévue *</label>
                <input required type="date" value={empruntData.date_retour_prevue} onChange={e => setEmpruntData({ ...empruntData, date_retour_prevue: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEmpruntForm(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition">
                  Enregistrer le prêt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}