// app/dashboard/admin/annonces/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Eye, Search, Send, Clock, CheckCircle, XCircle, Calendar
} from "lucide-react";
import Image from "next/image";

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  imageUrl: string;
  datePublication: string;
  dateProgrammee?: string;
  categorie: "info" | "alerte" | "evenement" | "inscription";
  estPublie: boolean;
  vue: number;
}

export default function AdminAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnonce, setEditingAnnonce] = useState<Annonce | null>(null);
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    categorie: "info",
    dateProgrammee: "",
    image: null as File | null,
    imagePreview: ""
  });

  useEffect(() => {
    setTimeout(() => {
      const mockAnnonces: Annonce[] = [
        { id: 1, titre: "Inscriptions 2025-2026 ouvertes", contenu: "Les inscriptions sont ouvertes...", imageUrl: "/img/slide2.jpg", datePublication: "2025-05-15", categorie: "inscription", estPublie: true, vue: 1250 },
        { id: 2, titre: "Journée portes ouvertes", contenu: "Venez découvrir notre école...", imageUrl: "/img/slide3.jpg", datePublication: "2025-05-10", categorie: "evenement", estPublie: true, vue: 890 },
        { id: 3, titre: "Vacances de Pâques", contenu: "Cours suspendus...", imageUrl: "", datePublication: "2025-04-01", categorie: "info", estPublie: true, vue: 2100 },
        { id: 4, titre: "Réunion parents", contenu: "Réunion le 25 mai...", imageUrl: "", datePublication: "", categorie: "evenement", estPublie: false, vue: 0, dateProgrammee: "2025-05-25T10:00" },
      ];
      setAnnonces(mockAnnonces);
      setLoading(false);
    }, 1000);
  }, []);

  const stats = {
    total: annonces.length,
    publiees: annonces.filter(a => a.estPublie).length,
    programmees: annonces.filter(a => !a.estPublie && a.dateProgrammee).length,
    vues: annonces.reduce((acc, a) => acc + a.vue, 0)
  };

  const getCategorieBadge = (categorie: string) => {
    const styles = {
      info: "bg-blue-100 text-blue-700",
      alerte: "bg-red-100 text-red-700",
      evenement: "bg-green-100 text-green-700",
      inscription: "bg-purple-100 text-purple-700"
    };
    const labels = {
      info: "Information",
      alerte: "Alerte",
      evenement: "Événement",
      inscription: "Inscription"
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[categorie as keyof typeof styles]}`}>{labels[categorie as keyof typeof labels]}</span>;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnnonce: Annonce = {
      id: editingAnnonce?.id || Date.now(),
      titre: formData.titre,
      contenu: formData.contenu,
      imageUrl: formData.imagePreview || "",
      datePublication: editingAnnonce?.datePublication || new Date().toISOString().split('T')[0],
      categorie: formData.categorie as any,
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
    setFormData({ titre: "", contenu: "", categorie: "info", dateProgrammee: "", image: null, imagePreview: "" });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer cette annonce ?")) {
      setAnnonces(annonces.filter(a => a.id !== id));
    }
  };

  const handlePublish = (id: number) => {
    setAnnonces(annonces.map(a => a.id === id ? { ...a, estPublie: true, datePublication: new Date().toISOString().split('T')[0] } : a));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file, imagePreview: URL.createObjectURL(file) });
    }
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Annonces</h1>
          <p className="text-gray-500 text-sm">Gérez les annonces de l'école</p>
        </div>
        <button 
          onClick={() => { setEditingAnnonce(null); setShowForm(true); }} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-gray-500 text-sm">Total annonces</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.publiees}</p>
          <p className="text-gray-500 text-sm">Publiées</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
          <p className="text-2xl font-bold text-orange-600">{stats.programmees}</p>
          <p className="text-gray-500 text-sm">Programmées</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
          <p className="text-2xl font-bold text-purple-600">{stats.vues}</p>
          <p className="text-gray-500 text-sm">Vues totales</p>
        </div>
      </div>

      {/* Liste des annonces */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vues</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {annonces.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{a.titre}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{a.contenu.substring(0, 60)}...</p>
                  </td>
                  <td className="px-6 py-4">{getCategorieBadge(a.categorie)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.datePublication || a.dateProgrammee?.split('T')[0] || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.vue}</td>
                  <td className="px-6 py-4">
                    {a.estPublie ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" /> Publiée</span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-600 text-sm"><Clock className="w-4 h-4" /> Programmée</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => { setEditingAnnonce(a); setFormData({ titre: a.titre, contenu: a.contenu, categorie: a.categorie, dateProgrammee: a.dateProgrammee || "", image: null, imagePreview: a.imageUrl }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      {!a.estPublie && (
                        <button onClick={() => handlePublish(a.id)} className="text-green-600 hover:text-green-800">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800">
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

      {/* Modal Formulaire simplifié */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{editingAnnonce ? "Modifier" : "Nouvelle"} annonce</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input 
                  type="text" 
                  value={formData.titre} 
                  onChange={(e) => setFormData({...formData, titre: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu *</label>
                <textarea 
                  rows={4} 
                  value={formData.contenu} 
                  onChange={(e) => setFormData({...formData, contenu: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select 
                    value={formData.categorie} 
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">📢 Information</option>
                    <option value="alerte">⚠️ Alerte</option>
                    <option value="evenement">🎉 Événement</option>
                    <option value="inscription">📝 Inscription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Programmer</label>
                  <input 
                    type="datetime-local" 
                    value={formData.dateProgrammee} 
                    onChange={(e) => setFormData({...formData, dateProgrammee: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
                {formData.imagePreview && (
                  <div className="mt-3 relative h-32 w-full rounded-xl overflow-hidden">
                    <Image src={formData.imagePreview} alt="Aperçu" fill className="object-cover" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">{editingAnnonce ? "Mettre à jour" : "Publier"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}