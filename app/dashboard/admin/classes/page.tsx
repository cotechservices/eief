// app/dashboard/admin/classes/page.tsx
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
  GraduationCap,
  Users,
  BookOpen,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  School,
  Loader2,
  DollarSign,
  AlertTriangle,
  X
} from "lucide-react";
import * as XLSX from 'xlsx';

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  capacite: number;
  effectif: number;
  frais_inscription: number;
  statut: "active" | "inactive";
  horaires: string;
}

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: "M" | "F";
  telephone: string;
  parentNom: string;
  parentTelephone: string;
  dateInscription: string;
  statut: "actif" | "inactif";
  photo_url: string | null;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function GestionClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [showElevesModal, setShowElevesModal] = useState(false);
  const [selectedClasseEleves, setSelectedClasseEleves] = useState<Eleve[]>([]);
  const [searchEleve, setSearchEleve] = useState("");
  const [elevesCurrentPage, setElevesCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    nom: "",
    niveau: "",
    capacite_max: 30,
    frais_inscription: 0
  });

  // État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // État pour le modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [classeToDelete, setClasseToDelete] = useState<{ id: number; nom: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;
  const elevesPerPage = 8;

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

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/classes");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchElevesByClasse = async (classeId: number) => {
    try {
      const response = await fetch(`/api/admin/classes/${classeId}/eleves`);
      const data = await response.json();
      setSelectedClasseEleves(data);
    } catch (error) {
      console.error("Erreur:", error);
      setSelectedClasseEleves([]);
      addNotification("error", "Erreur lors du chargement des élèves");
    }
  };

  const openConfirmModal = (id: number, nom: string) => {
    setClasseToDelete({ id, nom });
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!classeToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/classes?id=${classeToDelete.id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchClasses();
        setShowConfirmModal(false);
        setClasseToDelete(null);
        addNotification("success", `Classe "${classeToDelete.nom}" supprimée avec succès`);
      } else {
        addNotification("error", "Erreur lors de la suppression de la classe");
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.frais_inscription || formData.frais_inscription <= 0) {
      addNotification("warning", "Veuillez saisir le montant des frais d'inscription");
      return;
    }
    
    try {
      const response = await fetch("/api/admin/classes", {
        method: editingClasse ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingClasse ? { id: editingClasse.id, ...formData } : formData),
      });
      
      if (response.ok) {
        await fetchClasses();
        setShowForm(false);
        setEditingClasse(null);
        setFormData({ nom: "", niveau: "", capacite_max: 30, frais_inscription: 0 });
        addNotification("success", editingClasse ? "Classe modifiée avec succès" : "Classe créée avec succès");
      } else {
        const error = await response.json();
        addNotification("error", error.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors de l'enregistrement");
    }
  };

  const handleViewEleves = async (classe: Classe) => {
    setSelectedClasse(classe);
    await fetchElevesByClasse(classe.id);
    setElevesCurrentPage(1);
    setSearchEleve("");
    setShowElevesModal(true);
  };

  const exportToExcel = () => {
    try {
      const exportData = classes.map(c => ({
        'Classe': c.nom,
        'Niveau': c.niveau,
        'Effectif': c.effectif || 0,
        'Capacité': c.capacite || 0,
        'Taux remplissage': c.capacite > 0 ? `${Math.round(((c.effectif || 0) / c.capacite) * 100)}%` : 'N/A',
        'Frais inscription': `${(c.frais_inscription || 0).toLocaleString()} GNF`,
        'Statut': c.statut === 'active' ? 'Active' : 'Inactive'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = [
        { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 10 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Classes');
      
      const fileName = `classes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      addNotification("success", "Export Excel effectué avec succès");
    } catch (error) {
      addNotification("error", "Erreur lors de l'export Excel");
    }
  };

  const getStatutBadge = (statut: string) => {
    if (statut === "active") {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactive</span>;
  };

  const getTauxRemplissage = (effectif: number, capacite: number) => {
    if (capacite === 0) return { color: "bg-gray-500", text: "N/A" };
    const taux = (effectif / capacite) * 100;
    if (taux >= 90) return { color: "bg-red-500", text: "Saturée" };
    if (taux >= 70) return { color: "bg-yellow-500", text: "Élevé" };
    return { color: "bg-green-500", text: "Normal" };
  };

  const niveaux = ["all", ...new Set(classes.map(c => c.niveau))];

  const filteredClasses = classes.filter(classe => {
    const matchesSearch = 
      classe.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiveau = selectedNiveau === "all" || classe.niveau === selectedNiveau;
    return matchesSearch && matchesNiveau;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredEleves = selectedClasseEleves.filter(eleve => 
    eleve.nom?.toLowerCase().includes(searchEleve.toLowerCase()) ||
    eleve.prenom?.toLowerCase().includes(searchEleve.toLowerCase()) ||
    eleve.matricule?.includes(searchEleve)
  );

  const totalElevesPages = Math.ceil(filteredEleves.length / elevesPerPage);
  const paginatedEleves = filteredEleves.slice((elevesCurrentPage - 1) * elevesPerPage, elevesCurrentPage * elevesPerPage);

  const totalClasses = classes.length;
  const totalEleves = classes.reduce((acc, c) => acc + (c.effectif || 0), 0);
  const totalCapacite = classes.reduce((acc, c) => acc + (c.capacite || 0), 0);
  const tauxRemplissageGlobal = totalCapacite > 0 ? Math.round((totalEleves / totalCapacite) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
              {notification.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
              {notification.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {notification.type === "info" && <School className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion des classes</h1>
          <p className="text-gray-700">Gérez toutes les classes de l'école</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exporter Excel
          </button>
          <button onClick={() => { setEditingClasse(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvelle classe
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-800 text-sm">Total classes</p><p className="text-2xl font-bold text-blue-600">{totalClasses}</p></div>
            <School className="w-8 h-8 text-blue-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-800 text-sm">Total élèves</p><p className="text-2xl font-bold text-green-600">{totalEleves}</p></div>
            <Users className="w-8 h-8 text-green-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-800 text-sm">Capacité totale</p><p className="text-2xl font-bold text-orange-600">{totalCapacite}</p></div>
            <GraduationCap className="w-8 h-8 text-orange-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-800 text-sm">Taux remplissage</p><p className="text-2xl font-bold text-purple-600">{tauxRemplissageGlobal}%</p></div>
            <Users className="w-8 h-8 text-purple-700" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative text-black">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input 
                type="text" 
                placeholder="Rechercher une classe..." 
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }} 
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <select 
            value={selectedNiveau} 
            onChange={(e) => {
              setSelectedNiveau(e.target.value);
              setCurrentPage(1);
            }} 
            className="px-3 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les niveaux</option>
            {niveaux.filter(n => n !== "all").map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Niveau</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Effectif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Taux</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Frais</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedClasses.map((classe) => {
                const taux = classe.capacite > 0 ? Math.round((classe.effectif / classe.capacite) * 100) : 0;
                const tauxRemplissage = getTauxRemplissage(classe.effectif || 0, classe.capacite || 1);
                return (
                  <tr key={classe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-black">{classe.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-black">{classe.niveau}</td>
                    <td className="px-6 py-4 text-black">{classe.effectif || 0}/{classe.capacite || 0}</td>
                    <td className="px-6 py-4 text-black">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${tauxRemplissage.color} h-2 rounded-full`}
                            style={{ width: `${taux}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-black">{taux}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-mono text-sm font-bold text-black">{classe.frais_inscription?.toLocaleString()} GNF</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatutBadge(classe.statut)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewEleves(classe)} className="text-indigo-600 hover:text-indigo-800 transition" title="Voir élèves">
                          <Users className="w-4 h-4" />
                        </button>
                        <button onClick={() => { 
                          setEditingClasse(classe); 
                          setFormData({ 
                            nom: classe.nom || "", 
                            niveau: classe.niveau || "", 
                            capacite_max: classe.capacite || 30,
                            frais_inscription: classe.frais_inscription || 0
                          }); 
                          setShowForm(true); 
                        }} className="text-green-600 hover:text-green-800 transition" title="Modifier">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => openConfirmModal(classe.id, classe.nom)} className="text-red-600 hover:text-red-800 transition" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-900">{filteredClasses.length} classes</p>
            <div className="flex gap-2 text-black">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showConfirmModal && classeToDelete && (
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
                Êtes-vous sûr de vouloir supprimer cette classe ?
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mb-4">
                {classeToDelete.nom}
              </p>
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cette action est irréversible. Tous les élèves de cette classe seront affectés.
              </p>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setClasseToDelete(null);
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
      {/* Modal Élèves - Version avec photo */}
      {showElevesModal && selectedClasse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-black">Élèves - {selectedClasse.nom}</h2>
                  <p className="text-gray-900 text-sm">Effectif: {selectedClasseEleves.length}/{selectedClasse.capacite}</p>
                </div>
                <button onClick={() => setShowElevesModal(false)} className="text-gray-900 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6 text-black">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un élève..." 
                    value={searchEleve} 
                    onChange={(e) => { setSearchEleve(e.target.value); setElevesCurrentPage(1); }} 
                    className="w-full pl-9 pr-4 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedEleves.map((eleve) => (
                  <div key={eleve.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start gap-3">
                      {/* Affichage de la photo ou avatar par défaut */}
                      <div className="flex-shrink-0">
                        {eleve.photo_url ? (
                          <img 
                            src={eleve.photo_url} 
                            alt={`${eleve.prenom} ${eleve.nom}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
                            onError={(e) => {
                              // Si l'image ne charge pas, afficher l'avatar par défaut
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextSibling?.style.removeProperty('display');
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center ${eleve.photo_url ? 'hidden' : ''}`}
                        >
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black">{eleve.prenom} {eleve.nom}</h3>
                        <p className="text-sm text-gray-900">Matricule: {eleve.matricule}</p>
                        <p className="text-sm text-gray-900">Parent: {eleve.parentNom || "-"}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Né(e) le: {new Date(eleve.dateNaissance).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredEleves.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-900">Aucun élève trouvé</p>
                </div>
              )}
              
              {/* Pagination des élèves */}
              {totalElevesPages > 1 && (
                <div className="flex justify-center gap-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setElevesCurrentPage(p => Math.max(1, p - 1))}
                    disabled={elevesCurrentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {elevesCurrentPage} / {totalElevesPages}
                  </span>
                  <button
                    onClick={() => setElevesCurrentPage(p => Math.min(totalElevesPages, p + 1))}
                    disabled={elevesCurrentPage === totalElevesPages}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowElevesModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingClasse ? "Modifier" : "Ajouter"} une classe</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de la classe *</label>
                <input 
                  type="text" 
                  value={formData.nom || ""} 
                  onChange={(e) => setFormData({...formData, nom: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                  placeholder="Nom de la classe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Niveau *</label>
                <select 
                  value={formData.niveau || ""} 
                  onChange={(e) => setFormData({...formData, niveau: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required
                >
                  <option value="">Sélectionner un niveau</option>
                  <option value="Maternelle">Maternelle</option>
                  <option value="Primaire">Primaire</option>
                  <option value="Collège">Collège</option>
                  <option value="Lycée">Lycée</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Capacité max</label>
                <input 
                  type="number" 
                  value={formData.capacite_max ?? 30} 
                  onChange={(e) => setFormData({...formData, capacite_max: parseInt(e.target.value) || 0})} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Frais de scolarité (GNF) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="number" 
                    value={formData.frais_inscription || ""} 
                    onChange={(e) => setFormData({...formData, frais_inscription: parseInt(e.target.value) || 0})} 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    min="0"
                    step="10000"
                    required
                    placeholder="Ex: 350000"
                  />
                </div>
                <p className="text-xs text-gray-900 mt-1">
                  Saisissez le montant des frais de scolarité pour cette classe
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  {editingClasse ? "Modifier" : "Créer"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 hover:bg-gray-50 text-black transition">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}