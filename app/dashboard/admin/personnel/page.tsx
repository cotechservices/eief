// app/dashboard/admin/personnel/page.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Eye, Search,
  ChevronLeft, ChevronRight, Loader2,
  User, Users, Briefcase, CreditCard,
  Calendar, Phone, Mail, MapPin,
  CheckCircle, XCircle, Clock, Award,
  TrendingUp, Download, Filter, Plus as PlusIcon, X, GraduationCap 
} from "lucide-react";

interface ClasseAssignee {
  id: number;
  nom: string;
  niveau: string;
}

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
  classes_assigned?: ClasseAssignee[];
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [currentPersonnelId, setCurrentPersonnelId] = useState<number | null>(null);
  
  const [notification, setNotification] = useState<Notification>({
    message: '',
    type: 'success',
    visible: false
  });

  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", telephone: "", adresse: "",
    poste: "ENSEIGNANT", departement: "Pédagogie",
    dateEmbauche: new Date().toISOString().split('T')[0],
    salaire: 0, prime_mensuelle: 0, statut: "actif"
  });

  const itemsPerPage = 10;

  useEffect(() => { 
    fetchPersonnel();
    fetchClasses();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3500);
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/admin/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Erreur chargement classes:", error);
    }
  };

  // ⭐ Fonction pour récupérer les classes assignées d'un enseignant depuis la BD
  const fetchAssignedClasses = async (personnelId: number): Promise<ClasseAssignee[]> => {
    try {
      const response = await fetch(`/api/admin/enseignants/${personnelId}/classes`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {
      console.error("Erreur récupération classes assignées:", error);
      return [];
    }
  };

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/personnel");
      if (response.ok) {
        const data = await response.json();
        const personnelWithClasses = await Promise.all(
          data.map(async (p: Personnel) => {
            if (p.type?.toUpperCase().includes("ENSEIGNANT")) {
              const classesData = await fetchAssignedClasses(p.id);
              p.classes_assigned = classesData;
            }
            return p;
          })
        );
        setPersonnel(personnelWithClasses);
      }
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cet agent ? Cette action est irréversible.")) {
      try {
        const res = await fetch(`/api/admin/personnel?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          showNotification("Agent supprimé avec succès ✅", "success");
          fetchPersonnel();
        } else {
          showNotification("Erreur lors de la suppression ❌", "error");
        }
      } catch (e) { 
        console.error(e);
        showNotification("Erreur lors de la suppression ❌", "error");
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      showNotification("Veuillez remplir tous les champs obligatoires", "error");
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
        showNotification(
          editingPersonnel ? "Agent modifié avec succès ✅" : "Agent créé avec succès ✅",
          "success"
        );
        setShowForm(false);
        fetchPersonnel();
        setEditingPersonnel(null);
        resetForm();
      } else {
        const data = await res.json();
        showNotification(data.error || "Erreur lors de l'enregistrement ❌", "error");
      }
    } catch (e) { 
      console.error(e);
      showNotification("Erreur lors de l'enregistrement ❌", "error");
    }
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

  // ⭐ OUVERTURE DE LA MODALE - Récupération depuis la BD
  const openAssignModal = async (personnelId: number, assignedClasses: ClasseAssignee[]) => {
    setCurrentPersonnelId(personnelId);
    
    // ⭐ Récupérer les classes assignées à jour depuis la base de données
    const freshClasses = await fetchAssignedClasses(personnelId);
    const assignedIds = freshClasses.map(c => Number(c.id));
    setSelectedClasses(assignedIds);
    setShowAssignModal(true);
  };

  // ⭐ Fonction assignation - Mise à jour depuis la BD après enregistrement
  const handleAssignClasses = async () => {
    if (!currentPersonnelId) return;

    try {
      const response = await fetch(`/api/admin/enseignants/${currentPersonnelId}/assignations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          classeIds: selectedClasses
        })
      });

      const data = await response.json();

      if (response.ok) {
        const message = data.message || "✅ Classes assignées avec succès !";
        showNotification(message, "success");
        
        // ⭐ Récupérer les classes assignées à jour depuis la BD
        const freshClasses = await fetchAssignedClasses(currentPersonnelId);
        const assignedIds = freshClasses.map(c => Number(c.id));
        setSelectedClasses(assignedIds);
        
        // Mettre à jour le personnel dans l'état
        setPersonnel(prev => 
          prev.map(p => 
            p.id === currentPersonnelId 
              ? { ...p, classes_assigned: freshClasses }
              : p
          )
        );
        
        setShowAssignModal(false);
        await fetchPersonnel();
      } else {
        showNotification(data.error || "❌ Erreur lors de l'assignation", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("❌ Erreur lors de l'assignation", "error");
    }
  };

  // ⭐ Fonction pour retirer une classe spécifique
  const handleRemoveClass = async (enseignantId: number, classeId: number) => {
    if (!confirm("Voulez-vous retirer cette classe de l'enseignant ?")) return;

    try {
      const response = await fetch(
        `/api/admin/enseignants/${enseignantId}/assignations?classeId=${classeId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        showNotification("✅ Classe retirée avec succès", "success");
        await fetchPersonnel();
      } else {
        const data = await response.json();
        showNotification(data.error || "❌ Erreur lors du retrait", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("❌ Erreur lors du retrait", "error");
    }
  };

  const getPosteLabel = (type: string) => POSTES.find(p => p.value === type)?.label || type;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "actif":   return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "inactif": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Inactif</span>;
      case "conge":   return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Congé</span>;
      default:        return <span className="text-xs text-gray-500">{statut}</span>;
    }
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

  const stats = {
    total: personnel.length,
    actifs: personnel.filter(p => p.statut === "actif").length,
    enseignants: personnel.filter(p => p.type?.toUpperCase().includes("ENSEIGNANT")).length,
    masseSalariale: personnel.reduce((acc, p) => acc + Number(p.salaire || 0) + Number(p.prime_mensuelle || 0), 0),
  };

  // ⭐ Fonction pour ouvrir la modale de détails avec toutes les infos
  const openDetailModal = async (agent: Personnel) => {
    // Si c'est un enseignant, récupérer les classes assignées à jour
    if (agent.type?.toUpperCase().includes("ENSEIGNANT")) {
      const freshClasses = await fetchAssignedClasses(agent.id);
      agent.classes_assigned = freshClasses;
    }
    setSelectedPersonnel(agent);
    setShowDetailModal(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* NOTIFICATION */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border-l-4 shadow-lg max-w-sm animate-slide-in ${
          notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
          notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
          'bg-blue-50 border-blue-500 text-blue-700'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              {notification.type === 'info' && <Clock className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Classes</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Salaire net</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPersonnel.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-900">Aucun agent trouvé</td></tr>
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
                  <td className="px-6 py-4">
                    {agent.type?.toUpperCase().includes("ENSEIGNANT") ? (
                      <div className="space-y-1">
                        {agent.classes_assigned && agent.classes_assigned.length > 0 ? (
                          <>
                            {agent.classes_assigned.slice(0, 2).map((cls) => (
                              <span key={cls.id} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mr-1">
                                {cls.nom}
                              </span>
                            ))}
                            {agent.classes_assigned.length > 2 && (
                              <span className="text-xs text-gray-400">+{agent.classes_assigned.length - 2}</span>
                            )}
                            <button
                              onClick={() => openAssignModal(agent.id, agent.classes_assigned || [])}
                              className="block text-xs text-blue-600 hover:underline mt-1"
                            >
                              Gérer les classes
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openAssignModal(agent.id, [])}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <PlusIcon className="w-3 h-3" /> Assigner des classes
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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
                      <button 
                        onClick={() => openDetailModal(agent)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openForm(agent)} 
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" 
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(agent.id)} 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" 
                        title="Supprimer"
                      >
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

      {/* ⭐ MODAL DÉTAILS - AFFICHE TOUTES LES INFOS */}
      {showDetailModal && selectedPersonnel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Fiche de l'agent</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Avatar & Identité */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl">
                  {(selectedPersonnel.prenom?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPersonnel.prenom} {selectedPersonnel.nom}</h3>
                  <p className="text-gray-500 text-sm">Matricule : <span className="font-mono">{selectedPersonnel.matricule}</span></p>
                  <div className="mt-1">{getStatutBadge(selectedPersonnel.statut)}</div>
                </div>
              </div>

              {/* Infos professionnelles */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Informations professionnelles
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Poste</p>
                    <p className="font-medium text-gray-900">{getPosteLabel(selectedPersonnel.type)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Département</p>
                    <p className="font-medium text-gray-900">{selectedPersonnel.departement || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Date d'embauche</p>
                    <p className="font-medium text-gray-900">{selectedPersonnel.dateEmbauche?.split('T')[0] || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Statut</p>
                    <div>{getStatutBadge(selectedPersonnel.statut)}</div>
                  </div>
                </div>
              </div>

              {/* ⭐ Classes assignées (pour les enseignants) */}
              {selectedPersonnel.type?.toUpperCase().includes("ENSEIGNANT") && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Classes assignées
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersonnel.classes_assigned && selectedPersonnel.classes_assigned.length > 0 ? (
                      selectedPersonnel.classes_assigned.map((cls) => (
                        <span key={cls.id} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm border border-blue-200 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                          {cls.nom} ({cls.niveau})
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 bg-gray-50 px-4 py-2 rounded-lg">Aucune classe assignée</span>
                    )}
                  </div>
                </div>
              )}

              {/* Rémunération */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Rémunération
                </h4>
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
                <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b flex items-center gap-2">
                  <User className="w-4 h-4" /> Contact
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedPersonnel.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedPersonnel.telephone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 md:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedPersonnel.adresse || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3 sticky bottom-0">
              <button 
                onClick={() => { setShowDetailModal(false); openForm(selectedPersonnel); }} 
                className="px-4 py-2 border rounded-lg text-sm hover:bg-white transition flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Fermer
              </button>
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

      {/* ⭐ MODAL ASSIGNATION */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Assigner des classes</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Sélectionnez les classes que cet enseignant doit enseigner</p>
              
              {/* ⭐ Affichage du nombre de classes assignées */}
              <div className={`mb-3 p-2 rounded-lg border ${selectedClasses.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-medium flex items-center gap-1 ${selectedClasses.length > 0 ? 'text-blue-700' : 'text-gray-500'}`}>
                  <CheckCircle className="w-3 h-3" />
                  {selectedClasses.length > 0 
                    ? `${selectedClasses.length} classe(s) déjà assignée(s)` 
                    : 'Aucune classe assignée'}
                </p>
                {selectedClasses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {classes
                      .filter(c => selectedClasses.includes(Number(c.id)))
                      .map(cls => (
                        <span key={cls.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {cls.nom}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              
              {/* ⭐ Liste des classes avec "Assignée" en vert */}
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {classes.length > 0 ? (
                  classes.map((cls) => {
                    const classId = Number(cls.id);
                    const isChecked = selectedClasses.includes(classId);
                    return (
                      <label 
                        key={cls.id} 
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedClasses(selectedClasses.filter(id => id !== classId));
                            } else {
                              setSelectedClasses([...selectedClasses, classId]);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isChecked ? 'text-blue-700' : 'text-gray-900'}`}>
                            {cls.nom}
                          </p>
                          <p className="text-xs text-gray-500">{cls.niveau}</p>
                        </div>
                        {/* ⭐ BADGE "Assignée" EN VERT */}
                        {isChecked && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                            <CheckCircle className="w-3 h-3" />
                            Assignée
                          </span>
                        )}
                      </label>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-400 py-4">Aucune classe disponible</p>
                )}
              </div>
              
              {/* Résumé des sélections */}
              <div className="mt-3 text-xs text-gray-500">
                {selectedClasses.length > 0 
                  ? `${selectedClasses.length} classe(s) sélectionnée(s)` 
                  : 'Aucune classe sélectionnée'}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
                Annuler
              </button>
              <button onClick={handleAssignClasses} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}