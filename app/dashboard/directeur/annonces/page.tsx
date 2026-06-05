// app/dashboard/admin/annonces/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Eye, Search, Filter, Download,
  Calendar, User, Tag, Bell, AlertCircle, CheckCircle, XCircle,
  ImageIcon, Upload, Send, Clock
} from "lucide-react";

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  imageUrl: string;
  datePublication: string;
  dateProgrammee?: string;
  auteur: string;
  categorie: "info" | "alerte" | "evenement" | "inscription";
  cible: "tous" | "parents" | "enseignants" | "eleves";
  estPublie: boolean;
  vue: number;
}

export default function AdminAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingAnnonce, setEditingAnnonce] = useState<Annonce | null>(null);
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    categorie: "info",
    cible: "tous",
    dateProgrammee: "",
    image: null as File | null
  });

  useEffect(() => {
    setTimeout(() => {
      const mockAnnonces: Annonce[] = [
        { id: 1, titre: "Inscriptions 2025-2026 ouvertes", contenu: "Les inscriptions sont ouvertes...", imageUrl: "", datePublication: "2025-05-15", auteur: "Admin", categorie: "inscription", cible: "tous", estPublie: true, vue: 1250 },
        { id: 2, titre: "Journée portes ouvertes", contenu: "Venez découvrir notre école...", imageUrl: "", datePublication: "2025-05-10", auteur: "Admin", categorie: "evenement", cible: "parents", estPublie: true, vue: 890 },
        { id: 3, titre: "Vacances de Pâques", contenu: "Cours suspendus...", imageUrl: "", datePublication: "2025-04-01", auteur: "Admin", categorie: "info", cible: "tous", estPublie: true, vue: 2100 },
        { id: 4, titre: "Réunion parents", contenu: "Réunion le 25 mai...", imageUrl: "", datePublication: "", auteur: "Admin", categorie: "evenement", cible: "parents", estPublie: false, vue: 0, dateProgrammee: "2025-05-25" },
      ];
      setAnnonces(mockAnnonces);
      setLoading(false);
    }, 1000);
  }, []);

  const stats = {
    total: annonces.length,
    publiees: annonces.filter(a => a.estPublie).length,
    programmees: annonces.filter(a => !a.estPublie && a.dateProgrammee).length,
    vuesTotales: annonces.reduce((acc, a) => acc + a.vue, 0)
  };

  const getCategorieBadge = (categorie: string) => {
    switch (categorie) {
      case "info": return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Information</span>;
      case "alerte": return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Alerte</span>;
      case "evenement": return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Événement</span>;
      case "inscription": return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">Inscription</span>;
      default: return <span>{categorie}</span>;
    }
  };

  const filteredAnnonces = annonces.filter(a => {
    const matchesSearch = a.titre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = selectedCategorie === "all" || a.categorie === selectedCategorie;
    const matchesStatut = selectedStatut === "all" || (selectedStatut === "publie" ? a.estPublie : !a.estPublie);
    return matchesSearch && matchesCategorie && matchesStatut;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnonce: Annonce = {
      id: editingAnnonce?.id || Date.now(),
      titre: formData.titre,
      contenu: formData.contenu,
      imageUrl: "",
      datePublication: editingAnnonce?.datePublication || new Date().toISOString().split('T')[0],
      auteur: "Admin",
      categorie: formData.categorie as any,
      cible: formData.cible as any,
      estPublie: !formData.dateProgrammee,
      vue: editingAnnonce?.vue || 0,
      dateProgrammee: formData.dateProgrammee || undefined,
    };
    if (editingAnnonce) {
      setAnnonces(annonces.map(a => a.id === editingAnnonce.id ? newAnnonce : a));
    } else {
      setAnnonces([newAnnonce, ...annonces]);
    }
    setShowForm(false);
    setEditingAnnonce(null);
    setFormData({ titre: "", contenu: "", categorie: "info", cible: "tous", dateProgrammee: "", image: null });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette annonce ?")) {
      setAnnonces(annonces.filter(a => a.id !== id));
    }
  };

  const handlePublish = (id: number) => {
    setAnnonces(annonces.map(a => a.id === id ? { ...a, estPublie: true, datePublication: new Date().toISOString().split('T')[0] } : a));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des annonces</h1>
          <p className="text-gray-900">Créez et gérez les annonces de l'école</p>
        </div>
        <button onClick={() => { setEditingAnnonce(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between">
            <div><p className="text-gray-900">Total annonces</p><p className="text-2xl font-bold text-blue-600">{stats.total}</p></div>
            <Bell className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between">
            <div><p className="text-gray-900">Publiées</p><p className="text-2xl font-bold text-green-600">{stats.publiees}</p></div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between">
            <div><p className="text-gray-900">Programmées</p><p className="text-2xl font-bold text-orange-600">{stats.programmees}</p></div>
            <Clock className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between">
            <div><p className="text-gray-900">Vues totales</p><p className="text-2xl font-bold text-purple-600">{stats.vuesTotales}</p></div>
            <Eye className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg" />
          </div>
          <select value={selectedCategorie} onChange={(e) => setSelectedCategorie(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">Toutes catégories</option>
            <option value="info">Info</option>
            <option value="alerte">Alerte</option>
            <option value="evenement">Événement</option>
            <option value="inscription">Inscription</option>
          </select>
          <select value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">Tous statuts</option>
            <option value="publie">Publiées</option>
            <option value="brouillon">Brouillons</option>
          </select>
        </div>
      </div>

      {/* Tableau des annonces */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Cible</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Vues</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAnnonces.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{a.titre}</td>
                  <td className="px-6 py-4">{getCategorieBadge(a.categorie)}</td>
                  <td className="px-6 py-4 capitalize">{a.cible}</td>
                  <td className="px-6 py-4">{a.datePublication || a.dateProgrammee || "-"}</td>
                  <td className="px-6 py-4">{a.vue}</td>
                  <td className="px-6 py-4">
                    {a.estPublie ? (
                      <span className="text-green-600 text-sm">✅ Publiée</span>
                    ) : (
                      <span className="text-orange-600 text-sm">⏳ Programmée</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingAnnonce(a); setFormData({ titre: a.titre, contenu: a.contenu, categorie: a.categorie, cible: a.cible, dateProgrammee: a.dateProgrammee || "", image: null }); setShowForm(true); }} className="text-green-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePublish(a.id)} className="text-blue-600">
                        <Send className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingAnnonce ? "Modifier" : "Nouvelle"} annonce</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input type="text" value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contenu *</label>
                <textarea rows={4} value={formData.contenu} onChange={(e) => setFormData({ ...formData, contenu: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="info">Information</option>
                    <option value="alerte">Alerte</option>
                    <option value="evenement">Événement</option>
                    <option value="inscription">Inscription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cible</label>
                  <select value={formData.cible} onChange={(e) => setFormData({ ...formData, cible: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="tous">Tous</option>
                    <option value="parents">Parents uniquement</option>
                    <option value="enseignants">Enseignants</option>
                    <option value="eleves">Élèves</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Programmer (optionnel)</label>
                <input type="datetime-local" value={formData.dateProgrammee} onChange={(e) => setFormData({ ...formData, dateProgrammee: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image (optionnel)</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })} className="w-full" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingAnnonce ? "Mettre à jour" : "Publier"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}