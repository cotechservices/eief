// app/dashboard/admin/personnel/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Eye, Search,
  ChevronLeft, ChevronRight, Loader2,
  User, Users, Briefcase, CreditCard,
  Calendar, Phone, Mail, MapPin,
  CheckCircle, XCircle, Clock, Award,
  TrendingUp, Download, Filter
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
  prime_mensuelle?: number;
  statut: "actif" | "inactif" | "conge";
}

const POSTES = [
  { value: "ENSEIGNANT",         label: "Enseignant" },
  { value: "COMPTABLE",          label: "Comptable" },
  { value: "SECRETARIAT",        label: "Secrétariat" },
  { value: "DIRECTEUR_ETUDES",   label: "Directeur des études" },
  { value: "DIRECTEUR_GENERAL",  label: "Directeur Général" },
  { value: "SURVEILLANT",        label: "Surveillant général" },
  { value: "admin_cantine",      label: "Responsable Cantine" },
  { value: "admin_transport",    label: "Responsable Transport" },
  { value: "admin_bibliotheque", label: "Bibliothécaire" },
  { value: "admin_librairie",    label: "Responsable Librairie" },
  { value: "technicien",         label: "Technicien" },
  { value: "agent_securite",     label: "Agent de sécurité" },
  { value: "chauffeur",          label: "Chauffeur" },
  { value: "autre",              label: "Autre" },
];

const DEPARTEMENTS = [
  "Pédagogie", "Administration", "Finances", "Cantine",
  "Transport", "Bibliothèque", "Sécurité", "Technique", "Direction"
];

export default function GestionPersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("tous");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", telephone: "", adresse: "",
    poste: "ENSEIGNANT", departement: "Pédagogie",
    dateEmbauche: new Date().toISOString().split('T')[0],
    salaire: 0, prime_mensuelle: 0, statut: "actif"
  });

  const itemsPerPage = 10;

  useEffect(() => { fetchPersonnel(); }, []);

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
    if (confirm("Voulez-vous vraiment supprimer cet agent ? Cette action est irréversible.")) {
      try {
        const res = await fetch(`/api/admin/personnel?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchPersonnel();
        else alert("Erreur lors de la suppression");
      } catch (e) { console.error(e); }
    }
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const url = '/api/admin/personnel';
      const method = editingPersonnel ? 'PUT' : 'POST';
      const body = JSON.stringify({ ...formData, id: editingPersonnel?.id });
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body
      });
      if (res.ok) {
        setShowForm(false);
        fetchPersonnel();
        setEditingPersonnel(null);
        resetForm();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => setFormData({
    nom: "", prenom: "", email: "", telephone: "", adresse: "",
    poste: "ENSEIGNANT", departement: "Pédagogie",
    dateEmbauche: new Date().toISOString().split('T')[0],
    salaire: 0, prime_mensuelle: 0, statut: "actif"
  });

  const openForm = (p: Personnel | null) => {
    setEditingPersonnel(p);
    if (p) {
      setFormData({
        nom: p.nom || "", prenom: p.prenom || "", email: p.email || "",
        telephone: p.telephone || "", adresse: p.adresse || "",
        poste: p.type || "ENSEIGNANT",
        departement: p.departement || "Pédagogie",
        dateEmbauche: p.dateEmbauche?.split('T')[0] || new Date().toISOString().split('T')[0],
        salaire: p.salaire || 0,
        prime_mensuelle: p.prime_mensuelle || 0,
        statut: p.statut || "actif"
      });
    } else { resetForm(); }
    setShowForm(true);
  };

  const filteredPersonnel = personnel.filter(p => {
    const matchSearch = !searchTerm ||
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "tous" || p.type?.toLowerCase().includes(filterType.toLowerCase());
    const matchStatut = filterStatut === "tous" || p.statut === filterStatut;
    return matchSearch && matchType && matchStatut;
  });

  const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage);
  const paginatedPersonnel = filteredPersonnel.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  );

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "actif":   return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "inactif": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Inactif</span>;
      case "conge":   return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Congé</span>;
      default:        return <span className="text-xs text-gray-500">{statut}</span>;
    }
  };

  const getPosteLabel = (type: string) => POSTES.find(p => p.value === type)?.label || type;

  const stats = {
    total: personnel.length,
    actifs: personnel.filter(p => p.statut === "actif").length,
    enseignants: personnel.filter(p => p.type?.toUpperCase().includes("ENSEIGNANT")).length,
    masseSalariale: personnel.reduce((acc, p) => acc + Number(p.salaire || 0) + Number(p.prime_mensuelle || 0), 0),
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion du personnel</h1>
          <p className="text-gray-900 text-sm mt-1">Enseignants et administratifs </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Ajouter un personnel
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-800 text-sm">Total</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl"><Users className="w-6 h-6 text-blue-500" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-800 text-sm">Actifs</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.actifs}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-green-500" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-800 text-sm">Enseignants</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.enseignants}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl"><Award className="w-6 h-6 text-purple-500" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-800 text-sm">Masse salariale</p>
              <p className="text-xl font-bold text-orange-600 mt-1">{stats.masseSalariale.toLocaleString()} <span className="text-xs">GNF</span></p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl"><CreditCard className="w-6 h-6 text-orange-500" /></div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatut}
            onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="conge">En congé</option>
          </select>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tous">Tous les postes</option>
            {POSTES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <span className="text-sm text-gray-500 self-center">{filteredPersonnel.length} résultat(s)</span>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Nom & Prénom</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Poste</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Département</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Salaire net</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPersonnel.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-900">Aucun agent trouvé</td></tr>
              ) : paginatedPersonnel.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{agent.matricule}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(agent.prenom?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.prenom} {agent.nom}</p>
                        <p className="text-xs text-gray-400">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{getPosteLabel(agent.type)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{agent.departement || agent.type}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">{Number(agent.salaire || 0).toLocaleString()}</span>
                    {Number(agent.prime_mensuelle) > 0 && (
                      <p className="text-xs text-green-600">+{Number(agent.prime_mensuelle).toLocaleString()} prime</p>
                    )}
                    <p className="text-xs text-gray-400">GNF</p>
                  </td>
                  <td className="px-6 py-4">{getStatutBadge(agent.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedPersonnel(agent); setShowDetailModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Voir détails">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openForm(agent)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(agent.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center bg-gray-50">
            <p className="text-sm text-gray-500">{filteredPersonnel.length} agents • Page {currentPage}/{totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-40 hover:bg-white transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-40 hover:bg-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Fiche de l'agent</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Avatar & Identité */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl">
                  {(selectedPersonnel.prenom?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPersonnel.prenom} {selectedPersonnel.nom}</h3>
                  <p className="text-gray-500 text-sm">Matricule : {selectedPersonnel.matricule}</p>
                  <div className="mt-1">{getStatutBadge(selectedPersonnel.statut)}</div>
                </div>
              </div>

              {/* Infos professionnelles */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Informations professionnelles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-400">Poste</p><p className="font-medium">{getPosteLabel(selectedPersonnel.type)}</p></div>
                  <div><p className="text-xs text-gray-400">Département</p><p className="font-medium">{selectedPersonnel.departement || "-"}</p></div>
                  <div><p className="text-xs text-gray-400">Date d'embauche</p><p className="font-medium">{selectedPersonnel.dateEmbauche?.split('T')[0] || "-"}</p></div>
                </div>
              </div>

              {/* Rémunération */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Rémunération</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">Salaire de base</p>
                    <p className="font-bold text-blue-700 text-lg">{Number(selectedPersonnel.salaire || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">GNF</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">Prime mensuelle</p>
                    <p className="font-bold text-green-700 text-lg">{Number(selectedPersonnel.prime_mensuelle || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">GNF</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500">Salaire total</p>
                    <p className="font-bold text-orange-700 text-lg">{(Number(selectedPersonnel.salaire || 0) + Number(selectedPersonnel.prime_mensuelle || 0)).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">GNF</p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b">Contact</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="text-sm">{selectedPersonnel.email || "-"}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span className="text-sm">{selectedPersonnel.telephone || "-"}</span></div>
                  <div className="flex items-center gap-2 md:col-span-2"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-sm">{selectedPersonnel.adresse || "-"}</span></div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => { setShowDetailModal(false); openForm(selectedPersonnel); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-white transition">
                <Edit className="w-4 h-4 inline mr-1" /> Modifier
              </button>
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{editingPersonnel ? "Modifier l'agent" : "Ajouter un agent"}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input type="text" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" value={formData.telephone} onChange={e => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                  <select value={formData.poste} onChange={e => setFormData({ ...formData, poste: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {POSTES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                  <select value={formData.departement} onChange={e => setFormData({ ...formData, departement: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DEPARTEMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salaire de base (GNF)</label>
                  <input type="number" min="0" value={formData.salaire} onChange={e => setFormData({ ...formData, salaire: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prime mensuelle (GNF)</label>
                  <input type="number" min="0" value={formData.prime_mensuelle} onChange={e => setFormData({ ...formData, prime_mensuelle: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                  <input type="date" value={formData.dateEmbauche} onChange={e => setFormData({ ...formData, dateEmbauche: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="conge">En congé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={formData.adresse} onChange={e => setFormData({ ...formData, adresse: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {!editingPersonnel && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  <strong>Note :</strong> Le mot de passe par défaut sera <code className="bg-blue-100 px-1 rounded">personnel123</code>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white transition">Annuler</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingPersonnel ? "Enregistrer les modifications" : "Créer l'agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}