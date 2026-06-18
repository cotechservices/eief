// app/dashboard/admin/activites/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, X, Loader2, CheckCircle, XCircle, Clock,
  CreditCard, Wallet, GraduationCap, Users, Calendar, Clock as ClockIcon,
  MapPin, AlertTriangle, ImageIcon, Filter
} from "lucide-react";
import Image from "next/image";

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

interface Inscription {
  id: number;
  activite_id: number;
  activite_nom: string;
  categorie: string;
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe_nom: string;
  parent_nom: string;
  parent_prenom: string;
  parent_email: string;
  parent_telephone: string;
  date_inscription: string;
  montant_frais: number;
  frais_statut: string;
  frais_mode_paiement: string;
  statut: string;
  observations: string;
}

const CATEGORIES = [
  { id: "sport", nom: "🏃 Sport", color: "bg-green-100 text-green-700" },
  { id: "art", nom: "🎨 Art", color: "bg-purple-100 text-purple-700" },
  { id: "technologie", nom: "💻 Technologie", color: "bg-blue-100 text-blue-700" },
  { id: "langue", nom: "🌍 Langue", color: "bg-yellow-100 text-yellow-700" },
  { id: "autre", nom: "📚 Autre", color: "bg-gray-100 text-gray-700" }
];

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function ActivitesPage() {
  const [activeTab, setActiveTab] = useState("activites");
  const [activites, setActivites] = useState<Activite[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");

  const [showActiviteForm, setShowActiviteForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingActivite, setEditingActivite] = useState<Activite | null>(null);
  const [selectedInscription, setSelectedInscription] = useState<Inscription | null>(null);
  const [observations, setObservations] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activiteToDelete, setActiviteToDelete] = useState<{ id: number; nom: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activiteData, setActiviteData] = useState({
    nom: "",
    description: "",
    categorie: "sport",
    jour: "Lundi",
    heure_debut: "14:00",
    heure_fin: "16:00",
    age_min: 5,
    age_max: 18,
    capacite_max: 20,
    frais_inscription: 50000,
    photo_url: "",
    est_actif: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resActivites, resInscriptions, resEleves] = await Promise.all([
        fetch('/api/admin/activites'),
        fetch('/api/admin/activites/inscriptions'),
        fetch('/api/admin/eleves')
      ]);
      if (resActivites.ok) setActivites(await resActivites.json());
      if (resInscriptions.ok) setInscriptions(await resInscriptions.json());
      if (resEleves.ok) setEleves(await resEleves.json());
    } catch (e) {
      console.error(e);
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
      const res = await fetch("/api/admin/activites/upload", {
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

  const handleActiviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = activiteData.photo_url;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const method = editingActivite ? 'PUT' : 'POST';
      const body = { ...activiteData, id: editingActivite?.id, photo_url: imageUrl };
      const res = await fetch('/api/admin/activites', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowActiviteForm(false);
        setEditingActivite(null);
        setSelectedFile(null);
        setPreviewUrl("");
        fetchData();
      }
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const handleUpdateStatut = async (id: number, statut: string) => {
    try {
      const res = await fetch("/api/admin/activites/inscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut, observations }),
      });
      if (res.ok) {
        fetchData();
        setShowDetailModal(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteActivite = async (id: number) => {
    if (!confirm("Supprimer cette activité ?")) return;
    try {
      await fetch(`/api/admin/activites?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const getCategorieBadge = (categorie: string) => {
    const cat = CATEGORIES.find(c => c.id === categorie) || CATEGORIES[0];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.color}`}>{cat.nom}</span>;
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente": return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case "valide": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validée</span>;
      case "rejete": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejetée</span>;
      default: return null;
    }
  };

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  const filteredActivites = activites.filter(a => {
    const matchesSearch = a.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = selectedCategorie === "all" || a.categorie === selectedCategorie;
    return matchesSearch && matchesCategorie;
  });

  const filteredInscriptions = inscriptions.filter(i => {
    const matchesSearch = i.eleve_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.eleve_prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.activite_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = selectedStatut === "all" || i.statut === selectedStatut;
    return matchesSearch && matchesStatut;
  });

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Activités Périscolaires</h1>
          <p className="text-gray-500">Gestion des activités, inscriptions et paiements</p>
        </div>
        <button onClick={() => { setEditingActivite(null); setActiviteData({ nom: "", description: "", categorie: "sport", jour: "Lundi", heure_debut: "14:00", heure_fin: "16:00", age_min: 5, age_max: 18, capacite_max: 20, frais_inscription: 50000, photo_url: "", est_actif: true }); setSelectedFile(null); setPreviewUrl(""); setShowActiviteForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle activité
        </button>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button onClick={() => setActiveTab("activites")} className={`px-6 py-3 font-medium transition-colors ${activeTab === "activites" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-600 hover:bg-gray-50"}`}>
            📋 Activités
          </button>
          <button onClick={() => setActiveTab("inscriptions")} className={`px-6 py-3 font-medium transition-colors ${activeTab === "inscriptions" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-600 hover:bg-gray-50"}`}>
            📝 Inscriptions
          </button>
        </div>

        <div className="p-4 border-b flex justify-between bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm" />
          </div>
          {activeTab === "activites" && (
            <select value={selectedCategorie} onChange={e => setSelectedCategorie(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="all">Toutes les catégories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          )}
          {activeTab === "inscriptions" && (
            <select value={selectedStatut} onChange={e => setSelectedStatut(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validées</option>
              <option value="rejete">Rejetées</option>
            </select>
          )}
        </div>

        {/* Liste des activités */}
        {activeTab === "activites" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredActivites.map((a) => (
              <div key={a.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition">
                <div className="h-32 bg-gray-100 relative">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">{getCategorieBadge(a.categorie)}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800">{a.nom}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.description}</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4" /> {a.jour} • {a.heure_debut} - {a.heure_fin}</div>
                    <div className="flex items-center gap-2 text-gray-600"><Users className="w-4 h-4" /> Âge: {a.age_min}-{a.age_max} ans | Max: {a.capacite_max}</div>
                    <div className="flex items-center gap-2 text-green-600 font-semibold"><Wallet className="w-4 h-4" /> {a.frais_inscription.toLocaleString()} GNF</div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                    <button onClick={() => { setEditingActivite(a); setActiviteData(a); setSelectedFile(null); setPreviewUrl(""); setShowActiviteForm(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteActivite(a.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste des inscriptions */}
        {activeTab === "inscriptions" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr className="text-xs font-semibold text-gray-600 uppercase">
                  <th className="px-6 py-3">Activité</th>
                  <th className="px-6 py-3">Élève</th>
                  <th className="px-6 py-3">Classe</th>
                  <th className="px-6 py-3">Parent</th>
                  <th className="px-6 py-3 text-center">Frais</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInscriptions.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><span className="font-medium">{i.activite_nom}</span><div className="text-xs text-gray-500">{getCategorieBadge(i.categorie)}</div></td>
                    <td className="px-6 py-4">{i.eleve_prenom} {i.eleve_nom}<div className="text-xs text-gray-500">Mat: {i.matricule}</div></td>
                    <td className="px-6 py-4 text-sm">{i.classe_nom || "-"}</td>
                    <td className="px-6 py-4 text-sm">{i.parent_prenom} {i.parent_nom}</td>
                    <td className="px-6 py-4 text-center">{getFraisBadge(i.frais_statut)}<div className="text-xs text-gray-500">{i.montant_frais?.toLocaleString()} GNF</div></td>
                    <td className="px-6 py-4 text-center">{getStatutBadge(i.statut)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => { setSelectedInscription(i); setObservations(i.observations || ""); setShowDetailModal(true); }} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formulaire Activité */}
      {showActiviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingActivite ? "Modifier l'activité" : "Nouvelle activité"}</h2>
              <button onClick={() => setShowActiviteForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleActiviteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image de l'activité</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition relative">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                  {previewUrl || activiteData.photo_url ? (
                    <div className="relative inline-block"><img src={previewUrl || activiteData.photo_url || ""} alt="Aperçu" className="w-32 h-32 object-cover rounded-lg mx-auto" /><button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><X className="w-4 h-4" /></button></div>
                  ) : (<div className="text-center"><ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-600">Cliquez pour ajouter une image</p></div>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Nom *</label><input required type="text" value={activiteData.nom} onChange={e => setActiviteData({ ...activiteData, nom: e.target.value })} className="w-full border p-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Catégorie *</label><select value={activiteData.categorie} onChange={e => setActiviteData({ ...activiteData, categorie: e.target.value })} className="w-full border p-2 rounded-lg">{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows={3} value={activiteData.description} onChange={e => setActiviteData({ ...activiteData, description: e.target.value })} className="w-full border p-2 rounded-lg" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Jour</label><select value={activiteData.jour} onChange={e => setActiviteData({ ...activiteData, jour: e.target.value })} className="w-full border p-2 rounded-lg">{JOURS.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Heure début</label><input type="time" value={activiteData.heure_debut} onChange={e => setActiviteData({ ...activiteData, heure_debut: e.target.value })} className="w-full border p-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Heure fin</label><input type="time" value={activiteData.heure_fin} onChange={e => setActiviteData({ ...activiteData, heure_fin: e.target.value })} className="w-full border p-2 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Âge min</label><input type="number" min="3" max="18" value={activiteData.age_min} onChange={e => setActiviteData({ ...activiteData, age_min: parseInt(e.target.value) })} className="w-full border p-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Âge max</label><input type="number" min="3" max="18" value={activiteData.age_max} onChange={e => setActiviteData({ ...activiteData, age_max: parseInt(e.target.value) })} className="w-full border p-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Capacité max</label><input type="number" min="1" value={activiteData.capacite_max} onChange={e => setActiviteData({ ...activiteData, capacite_max: parseInt(e.target.value) })} className="w-full border p-2 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Frais inscription (GNF)</label><input type="number" min="0" value={activiteData.frais_inscription} onChange={e => setActiviteData({ ...activiteData, frais_inscription: parseInt(e.target.value) })} className="w-full border p-2 rounded-lg" /></div>
                <div className="flex items-center gap-4 pt-6"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={activiteData.est_actif} onChange={e => setActiviteData({ ...activiteData, est_actif: e.target.checked })} className="w-4 h-4" /> <span className="text-sm">Activité active</span></label></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowActiviteForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">{uploading && <Loader2 className="w-4 h-4 animate-spin" />}{uploading ? "Enregistrement..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail Inscription */}
      {showDetailModal && selectedInscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center"><h2 className="text-xl font-bold">Détail de l'inscription</h2><button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Activité</p><p className="font-semibold">{selectedInscription.activite_nom}</p>{getCategorieBadge(selectedInscription.categorie)}</div>
                <div><p className="text-sm text-gray-500">Date d'inscription</p><p className="font-semibold">{new Date(selectedInscription.date_inscription).toLocaleDateString()}</p></div>
              </div>
              <div className="border-t pt-4"><h3 className="font-semibold mb-3">👨‍👩‍👧 Informations élève</h3><div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg"><div><p className="text-sm text-gray-500">Nom complet</p><p>{selectedInscription.eleve_prenom} {selectedInscription.eleve_nom}</p></div><div><p className="text-sm text-gray-500">Classe</p><p>{selectedInscription.classe_nom || "-"}</p></div><div><p className="text-sm text-gray-500">Matricule</p><p>{selectedInscription.matricule}</p></div></div></div>
              <div className="border-t pt-4"><h3 className="font-semibold mb-3">👨‍👩 Parent</h3><div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg"><div><p className="text-sm text-gray-500">Nom complet</p><p>{selectedInscription.parent_prenom} {selectedInscription.parent_nom}</p></div><div><p className="text-sm text-gray-500">Email</p><p>{selectedInscription.parent_email}</p></div><div><p className="text-sm text-gray-500">Téléphone</p><p>{selectedInscription.parent_telephone}</p></div></div></div>
              <div className="border-t pt-4"><h3 className="font-semibold mb-3">💰 Paiement</h3><div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg"><div><p className="text-sm text-gray-500">Montant</p><p className="font-bold text-green-600">{selectedInscription.montant_frais?.toLocaleString()} GNF</p></div><div><p className="text-sm text-gray-500">Statut</p>{getFraisBadge(selectedInscription.frais_statut)}</div></div></div>
              <div><label className="block text-sm font-medium mb-1">Observations</label><textarea rows={3} value={observations} onChange={e => setObservations(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Ajouter une observation..." /></div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              {selectedInscription.statut === "en_attente" && (<div className="flex gap-3"><button onClick={() => handleUpdateStatut(selectedInscription.id, "rejete")} className="px-4 py-2 bg-red-600 text-white rounded-lg">Rejeter</button><button onClick={() => handleUpdateStatut(selectedInscription.id, "valide")} className="px-4 py-2 bg-green-600 text-white rounded-lg">Valider</button></div>)}
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg ml-auto">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}