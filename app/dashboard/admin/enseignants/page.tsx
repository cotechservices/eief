// app/dashboard/admin/enseignants/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Briefcase,
  Award,
  Loader2
} from "lucide-react";

interface Enseignant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  specialite: string;
  dateEmbauche: string;
  salaire: number;
  statut: "actif" | "inactif";
}

export default function GestionEnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingEnseignant, setEditingEnseignant] = useState<Enseignant | null>(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState<Enseignant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "", password: "", prenom: "", nom: "", telephone: "", adresse: "",
    specialite: "", dateEmbauche: "", salaire: ""
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEnseignants();
  }, []);

  const fetchEnseignants = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/enseignants");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setEnseignants(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/enseignants", {
        method: editingEnseignant ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEnseignant ? { id: editingEnseignant.id, ...formData } : formData),
      });
      if (response.ok) {
        fetchEnseignants();
        setShowForm(false);
        setEditingEnseignant(null);
        setFormData({ email: "", password: "", prenom: "", nom: "", telephone: "", adresse: "", specialite: "", dateEmbauche: "", salaire: "" });
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cet enseignant ?")) {
      try {
        const response = await fetch(`/api/admin/enseignants?id=${id}`, { method: "DELETE" });
        if (response.ok) fetchEnseignants();
        else alert("Erreur lors de la suppression");
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleExport = () => {
    const headers = ["Matricule", "Nom", "Prénom", "Email", "Téléphone", "Spécialité", "Date embauche", "Salaire", "Statut"];
    const csvData = filteredEnseignants.map(e => [e.matricule, e.nom, e.prenom, e.email, e.telephone || "", e.specialite || "", e.dateEmbauche || "", e.salaire || "", e.statut]);
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "enseignants_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatutBadge = (statut: string) => {
    switch(statut) {
      case "actif": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "inactif": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactif</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{statut}</span>;
    }
  };

  const filteredEnseignants = enseignants.filter(e => {
    const matchesSearch = e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = selectedStatut === "all" || e.statut === selectedStatut;
    return matchesSearch && matchesStatut;
  });

  const totalPages = Math.ceil(filteredEnseignants.length / itemsPerPage);
  const paginatedEnseignants = filteredEnseignants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des enseignants</h1>
          <p className="text-gray-500">Gérez tous les enseignants de l'école</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button onClick={() => { setEditingEnseignant(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvel enseignant
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total</p><p className="text-2xl font-bold text-blue-600">{enseignants.length}</p></div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Actifs</p><p className="text-2xl font-bold text-green-600">{enseignants.filter(e => e.statut === "actif").length}</p></div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Inactifs</p><p className="text-2xl font-bold text-red-600">{enseignants.filter(e => e.statut === "inactif").length}</p></div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Masse salariale</p><p className="text-2xl font-bold text-purple-600">{enseignants.reduce((acc, e) => acc + (e.salaire || 0), 0).toLocaleString()} GNF</p></div>
            <Briefcase className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher par nom, prénom, matricule ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg" />
            </div>
          </div>
          <select value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">Tous statuts</option>
            <option value="actif">Actif</option><option value="inactif">Inactif</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom & Prénom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spécialité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedEnseignants.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{e.matricule}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div>
                      <span className="font-medium">{e.prenom} {e.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{e.email}</td>
                  <td className="px-6 py-4">{e.telephone || "-"}</td>
                  <td className="px-6 py-4">{e.specialite || "-"}</td>
                  <td className="px-6 py-4">{getStatutBadge(e.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedEnseignant(e); setShowDetailModal(true); }} className="text-blue-600" title="Voir détails"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingEnseignant(e); setFormData({ email: e.email, password: "", prenom: e.prenom, nom: e.nom, telephone: e.telephone || "", adresse: e.adresse || "", specialite: e.specialite || "", dateEmbauche: e.dateEmbauche || "", salaire: String(e.salaire || "") }); setShowForm(true); }} className="text-green-600" title="Modifier"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">{filteredEnseignants.length} enseignants</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détail */}
      {showDetailModal && selectedEnseignant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Fiche enseignant</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-10 h-10 text-blue-600" /></div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedEnseignant.prenom} {selectedEnseignant.nom}</h3>
                  <p className="text-gray-500">Matricule: {selectedEnseignant.matricule}</p>
                  {getStatutBadge(selectedEnseignant.statut)}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 border-b pb-2">Informations professionnelles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400" />{selectedEnseignant.specialite || "-"}</div>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />Embauche: {selectedEnseignant.dateEmbauche || "-"}</div>
                  <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gray-400" />Salaire: {selectedEnseignant.salaire?.toLocaleString() || 0} GNF</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 border-b pb-2">Contact</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{selectedEnseignant.telephone || "-"}</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{selectedEnseignant.email}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{selectedEnseignant.adresse || "-"}</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingEnseignant ? "Modifier" : "Ajouter"} un enseignant</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm mb-1">Nom *</label><input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm mb-1">Prénom *</label><input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div><label className="block text-sm mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              {!editingEnseignant && (<div><label className="block text-sm mb-1">Mot de passe *</label><input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>)}
              <div><label className="block text-sm mb-1">Téléphone</label><input type="tel" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm mb-1">Adresse</label><input type="text" value={formData.adresse} onChange={(e) => setFormData({...formData, adresse: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm mb-1">Spécialité</label><input type="text" value={formData.specialite} onChange={(e) => setFormData({...formData, specialite: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm mb-1">Date d'embauche</label><input type="date" value={formData.dateEmbauche} onChange={(e) => setFormData({...formData, dateEmbauche: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm mb-1">Salaire (GNF)</label><input type="number" value={formData.salaire} onChange={(e) => setFormData({...formData, salaire: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editingEnseignant ? "Modifier" : "Créer"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}