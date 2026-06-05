// app/dashboard/admin/personnel/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Eye, Search,
  ChevronLeft, ChevronRight, Loader2,
  User, Users, Briefcase, CreditCard,
  Calendar, Phone, Mail, MapPin,
  CheckCircle, XCircle, Clock
} from "lucide-react";

interface Personnel {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  type: string;
  departement: string;
  dateEmbauche: string;
  salaire: number;
  statut: "actif" | "inactif" | "conge";
}

export default function GestionPersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", telephone: "", adresse: "",
    poste: "enseignant", dateEmbauche: "", salaire: 0, statut: "actif"
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/personnel");
      if (response.ok) {
        const data = await response.json();
        setPersonnel(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cet agent ?")) {
      try {
        await fetch(`/api/admin/personnel?id=${id}`, { method: "DELETE" });
        fetchPersonnel();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const url = '/api/admin/personnel';
      const method = editingPersonnel ? 'PUT' : 'POST';
      const body = JSON.stringify({ ...formData, id: editingPersonnel?.id });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        setShowForm(false);
        fetchPersonnel();
        setEditingPersonnel(null);
        setFormData({
          nom: "", prenom: "", email: "", telephone: "", adresse: "",
          poste: "enseignant", dateEmbauche: "", salaire: 0, statut: "actif"
        });
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openForm = (p: Personnel | null) => {
    setEditingPersonnel(p);
    if (p) {
      setFormData({
        nom: p.nom || "", prenom: p.prenom || "", email: p.email || "",
        telephone: p.telephone || "", adresse: p.adresse || "",
        poste: p.type || "enseignant", dateEmbauche: p.dateEmbauche || "",
        salaire: p.salaire || 0, statut: p.statut || "actif"
      });
    } else {
      setFormData({
        nom: "", prenom: "", email: "", telephone: "", adresse: "",
        poste: "enseignant", dateEmbauche: new Date().toISOString().split('T')[0],
        salaire: 0, statut: "actif"
      });
    }
    setShowForm(true);
  };

  const filteredPersonnel = personnel.filter(p =>
    p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage);
  const paginatedPersonnel = filteredPersonnel.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "actif": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "inactif": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactif</span>;
      case "conge": return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Congé</span>;
      default: return <span>{statut}</span>;
    }
  };

  const stats = {
    total: personnel.length,
    actifs: personnel.filter(p => p.statut === "actif").length,
    salairesMois: personnel.reduce((acc, p) => acc + Number(p.salaire || 0), 0),
    departements: new Set(personnel.map(p => p.type)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du personnel</h1>
          <p className="text-gray-900">Personnel administratif, technique et enseignant</p>
        </div>
        <button onClick={() => openForm(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvel agent
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-900 text-sm">Total agents</p><p className="text-2xl font-bold text-blue-600">{stats.total}</p></div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-900 text-sm">Agents actifs</p><p className="text-2xl font-bold text-green-600">{stats.actifs}</p></div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-900 text-sm">Masse salariale</p><p className="text-2xl font-bold text-orange-600">{stats.salairesMois.toLocaleString()} GNF</p></div>
            <CreditCard className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div><p className="text-gray-900 text-sm">Départements</p><p className="text-2xl font-bold text-purple-600">{stats.departements}</p></div>
            <Briefcase className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input type="text" placeholder="Rechercher par nom, prénom, matricule ou poste..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Nom & Prénom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Poste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPersonnel.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{agent.matricule}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div><span className="font-medium">{agent.prenom} {agent.nom}</span></div></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1"><Briefcase className="w-4 h-4 text-gray-900" /><span>{agent.type}</span></div></td>
                  <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{agent.departement || agent.type}</span></td>
                  <td className="px-6 py-4"><div><p className="text-sm">{agent.telephone}</p><p className="text-xs text-gray-900">{agent.email}</p></div></td>
                  <td className="px-6 py-4">{getStatutBadge(agent.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedPersonnel(agent); setShowDetailModal(true); }} className="text-blue-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openForm(agent)} className="text-green-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(agent.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-900">{filteredPersonnel.length} agents</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white"><div className="flex justify-between items-center"><h2 className="text-xl font-bold">Fiche agent</h2><button onClick={() => setShowDetailModal(false)} className="text-gray-900">✕</button></div></div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4"><div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-10 h-10 text-blue-600" /></div><div><h3 className="text-2xl font-bold">{selectedPersonnel.prenom} {selectedPersonnel.nom}</h3><p className="text-gray-900">Matricule: {selectedPersonnel.matricule}</p>{getStatutBadge(selectedPersonnel.statut)}</div></div>
              <div><h4 className="font-semibold mb-3 border-b pb-2">Informations professionnelles</h4><div className="grid md:grid-cols-2 gap-4"><div><p className="text-sm text-gray-900">Poste</p><p className="font-medium">{selectedPersonnel.type}</p></div><div><p className="text-sm text-gray-900">Date d'embauche</p><p className="font-medium">{selectedPersonnel.dateEmbauche}</p></div><div><p className="text-sm text-gray-900">Salaire</p><p className="font-medium">{selectedPersonnel.salaire?.toLocaleString()} GNF</p></div></div></div>
              <div><h4 className="font-semibold mb-3 border-b pb-2">Contact</h4><div className="grid md:grid-cols-2 gap-4"><div><p className="text-sm text-gray-900">Email</p><p>{selectedPersonnel.email}</p></div><div><p className="text-sm text-gray-900">Téléphone</p><p>{selectedPersonnel.telephone}</p></div><div><p className="text-sm text-gray-900">Adresse</p><p>{selectedPersonnel.adresse || "-"}</p></div></div></div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b"><h2 className="text-xl font-bold">{editingPersonnel ? "Modifier" : "Ajouter"} un agent</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Nom *</label><input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
                <div><label className="block text-sm mb-1">Prénom *</label><input type="text" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
                <div><label className="block text-sm mb-1">Téléphone *</label><input type="tel" value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Poste *</label>
                  <select value={formData.poste} onChange={e => setFormData({ ...formData, poste: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="enseignant">Enseignant</option>
                    <option value="comptable">Comptable</option>
                    <option value="admin_cantine">Cantine</option>
                    <option value="admin_transport">Transport</option>
                    <option value="admin_bibliotheque">Bibliothèque</option>
                    <option value="admin_librairie">Librairie</option>
                    <option value="surveillant_general">Surveillant</option>
                    <option value="directeur_etudes">Directeur Etudes</option>
                    <option value="directeur_general">Directeur Général</option>
                  </select>
                </div>
                <div><label className="block text-sm mb-1">Salaire</label><input type="number" value={formData.salaire} onChange={e => setFormData({ ...formData, salaire: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm mb-1">Date embauche</label><input type="date" value={formData.dateEmbauche} onChange={e => setFormData({ ...formData, dateEmbauche: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm mb-1">Statut</label>
                  <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="conge">Congé</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm mb-1">Adresse</label><input type="text" value={formData.adresse} onChange={e => setFormData({ ...formData, adresse: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingPersonnel ? "Modifier" : "Créer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}