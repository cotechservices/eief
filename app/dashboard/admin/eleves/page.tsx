// app/dashboard/admin/eleves/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  GraduationCap,
  CreditCard,
  Wallet,
  Image as ImageIcon,
  File,
  ExternalLink,
  Camera,
  Loader2,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import * as XLSX from 'xlsx';

interface Eleve {
  id: number;
  numero_dossier: string;
  matricule: string;
  parent_nom: string;
  parent_prenom: string;
  parent_email: string;
  parent_telephone: string;
  enfant_nom: string;
  enfant_prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  niveau: string;
  classe_nom: string;
  statut: "actif" | "inactif" | "suspendu";
  date_inscription: string;
  frais_montant: number;
  frais_statut: string;
  frais_mode_paiement: string;
  photo_url: string | null;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function GestionElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClasse, setSelectedClasse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // États pour le modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eleveToDelete, setEleveToDelete] = useState<{ id: number; nom: string; prenom: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const itemsPerPage = 10;

  // Fonction pour ajouter une notification
  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    // Auto-supprimer après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Fonction pour supprimer une notification
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchEleves();
  }, []);

  const fetchEleves = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/eleves");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setEleves(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError((error as Error).message);
      addNotification("error", "Erreur lors du chargement des élèves");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEleves();
  };

  const openConfirmModal = (id: number, nom: string, prenom: string) => {
    setEleveToDelete({ id, nom, prenom });
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!eleveToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/eleves?id=${eleveToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEleves();
        if (selectedEleve?.id === eleveToDelete.id) {
          setShowDetailModal(false);
          setSelectedEleve(null);
        }
        setShowConfirmModal(false);
        setEleveToDelete(null);
        addNotification("success", `Élève ${eleveToDelete.prenom} ${eleveToDelete.nom} supprimé avec succès`);
      } else {
        let errorMessage = "Erreur lors de la suppression";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error("Erreur de parsing:", e);
        }
        addNotification("error", errorMessage);
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors de la suppression. Vérifiez que l'API est correctement configurée.");
    } finally {
      setDeleting(false);
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredByClasse.map(e => ({
        'Matricule': e.matricule,
        'Numéro dossier': e.numero_dossier,
        'Enfant Nom': e.enfant_nom,
        'Enfant Prénom': e.enfant_prenom,
        'Date naissance': new Date(e.date_naissance).toLocaleDateString('fr-FR'),
        'Lieu naissance': e.lieu_naissance || '-',
        'Sexe': e.sexe === 'M' ? 'Garçon' : 'Fille',
        'Niveau': e.niveau,
        'Classe': e.classe_nom,
        'Parent Nom': e.parent_nom,
        'Parent Prénom': e.parent_prenom,
        'Parent Email': e.parent_email,
        'Parent Téléphone': e.parent_telephone,
        "Date d'inscription": new Date(e.date_inscription).toLocaleDateString('fr-FR'),
        'Statut': e.statut === 'actif' ? 'Actif' : e.statut === 'inactif' ? 'Inactif' : 'Suspendu',
        'Montant frais': `${e.frais_montant?.toLocaleString() || 0} GNF`,
        'Statut paiement': e.frais_statut === 'paye' ? 'Payé' : 'Non payé',
        'Mode paiement': e.frais_mode_paiement ? e.frais_mode_paiement.replace('_', ' ') : '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Eleves');

      const fileName = `eleves_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      addNotification("success", "Export Excel effectué avec succès");
    } catch (error) {
      addNotification("error", "Erreur lors de l'export Excel");
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "actif":
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case "inactif":
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactif</span>;
      case "suspendu":
        return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Suspendu</span>;
      default:
        return null;
    }
  };

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye" || fraisStatut === "valide") {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    if (fraisStatut === "partiel") {
      return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Partiel</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };
  const classes = ["all", ...new Set(eleves.map(e => e.classe_nom).filter(Boolean))];

  const filteredEleves = eleves.filter(e => {
    const searchLower = searchTerm.toLowerCase();
    return (
      e.enfant_nom?.toLowerCase().includes(searchLower) ||
      e.enfant_prenom?.toLowerCase().includes(searchLower) ||
      e.matricule?.toLowerCase().includes(searchLower) ||
      e.numero_dossier?.toLowerCase().includes(searchLower) ||
      e.parent_nom?.toLowerCase().includes(searchLower)
    );
  });

  const filteredByClasse = selectedClasse === "all"
    ? filteredEleves
    : filteredEleves.filter(e => e.classe_nom === selectedClasse);

  const totalPages = Math.ceil(filteredByClasse.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEleves = filteredByClasse.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Erreur: {error}</p>
          <button
            onClick={fetchEleves}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
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
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${notification.type === "success"
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
              {notification.type === "info" && <FileText className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-900 hover:text-gray-900 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion des élèves inscrits</h1>
          <p className="text-gray-900">Liste de tous les élèves inscrits dans l'école</p>
        </div>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter Excel
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Total inscrits</p><p className="text-2xl font-bold text-blue-600">{eleves.length}</p></div>
            <FileText className="w-8 h-8 text-blue-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Garçons</p><p className="text-2xl font-bold text-blue-600">{eleves.filter(e => e.sexe === "M").length}</p></div>
            <User className="w-8 h-8 text-blue-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Filles</p><p className="text-2xl font-bold text-pink-600">{eleves.filter(e => e.sexe === "F").length}</p></div>
            <User className="w-8 h-8 text-pink-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Classes</p><p className="text-2xl font-bold text-purple-600">{classes.length - 1}</p></div>
            <GraduationCap className="w-8 h-8 text-purple-700" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, matricule ou dossier..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-4 text-black py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedClasse}
            onChange={(e) => {
              setSelectedClasse(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map(c => (
              <option key={c} value={c}>{c === "all" ? "Toutes les classes" : c}</option>
            ))}
          </select>
          <Link
            href="/dashboard/admin/eleves/liste"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Voir la liste complète
          </Link>
        </div>
      </div>

      {/* Tableau */}
      {filteredByClasse.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-900 mx-auto mb-4" />
          <p className="text-gray-900">Aucun élève trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Dossier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Enfant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Classe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Frais</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-black">
                  {paginatedEleves.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-blue-600">{e.numero_dossier || e.matricule}</span>
                      </td>
                      <td className="px-4 py-4">
                        {e.photo_url ? (
                          <img src={e.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-gray-900" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium">{e.enfant_prenom} {e.enfant_nom}</span>
                        <p className="text-xs text-gray-900">{e.sexe === "M" ? "Garçon" : "Fille"} - {new Date(e.date_naissance).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-900">Matricule: {e.matricule}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm">{e.parent_prenom} {e.parent_nom}</p>
                        <p className="text-xs text-gray-900">{e.parent_email}</p>
                        <p className="text-xs text-gray-900">{e.parent_telephone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4 text-gray-900" />
                          <span>{e.classe_nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">{getFraisBadge(e.frais_statut)}</td>
                      <td className="px-4 py-4">{getStatutBadge(e.statut)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedEleve(e); setShowDetailModal(true); }}
                            className="text-blue-600 hover:text-blue-700 transition"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(e.id, e.enfant_nom, e.enfant_prenom)}
                            className="text-red-600 hover:text-red-700 transition"
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-900">
                  Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredByClasse.length)}</span>{' '}
                  sur <span className="font-medium">{filteredByClasse.length}</span> élèves
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-black" />
                  </button>

                  <div className="flex gap-1">
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`dots-${index}`} className="px-3 py-1 text-sm text-gray-900">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmation de suppression */}
      {showConfirmModal && eleveToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Confirmer la suppression</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-900 mb-2">
                Êtes-vous sûr de vouloir supprimer l'élève ?
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mb-4">
                {eleveToDelete.prenom} {eleveToDelete.nom}
              </p>
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cette action est irréversible. Toutes les données associées seront supprimées.
              </p>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setEleveToDelete(null);
                }}
                className="px-4 py-2 border text-black rounded-lg hover:bg-gray-100 transition"
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

      {/* Modal Détail */}
      {showDetailModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">Fiche élève</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-900">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {selectedEleve.photo_url ? (
                    <img src={selectedEleve.photo_url} alt="Photo" className="w-32 h-32 rounded-lg object-cover shadow-md text-black" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-900">Matricule</p>
                    <p className="font-mono text-xl font-bold text-blue-600">{selectedEleve.matricule}</p>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-900">Statut</p>
                      {getStatutBadge(selectedEleve.statut)}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-900">Paiement</p>
                      {getFraisBadge(selectedEleve.frais_statut)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations parent */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-700" />
                  Informations du parent
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-black">
                  <div><p className="text-sm text-gray-900">Nom complet</p><p className="font-medium">{selectedEleve.parent_prenom} {selectedEleve.parent_nom}</p></div>
                  <div><p className="text-sm text-gray-900">Email</p><p>{selectedEleve.parent_email}</p></div>
                  <div><p className="text-sm text-gray-900">Téléphone</p><p>{selectedEleve.parent_telephone}</p></div>
                </div>
              </div>

              {/* Informations enfant */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-700" />
                  Informations de l'enfant
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg text-black">
                  <div><p className="text-sm text-gray-900">Nom complet</p><p className="font-medium">{selectedEleve.enfant_prenom} {selectedEleve.enfant_nom}</p></div>
                  <div><p className="text-sm text-gray-900">Date de naissance</p><p>{new Date(selectedEleve.date_naissance).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-gray-900">Lieu de naissance</p><p>{selectedEleve.lieu_naissance || "Non renseigné"}</p></div>
                  <div><p className="text-sm text-gray-900">Sexe</p><p>{selectedEleve.sexe === "M" ? "Masculin" : "Féminin"}</p></div>
                  <div><p className="text-sm text-gray-900">Niveau</p><p>{selectedEleve.niveau}</p></div>
                  <div><p className="text-sm text-gray-900">Classe</p><p>{selectedEleve.classe_nom}</p></div>
                </div>
              </div>

              {/* Paiement */}
              {/* Paiement */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Informations de paiement
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Montant des frais</p>
                    <p className="font-bold text-lg text-black">
                      {(selectedEleve.frais_montant || 0).toLocaleString()} GNF
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Statut paiement</p>
                    {getFraisBadge(selectedEleve.frais_statut)}
                  </div>
                  {selectedEleve.frais_mode_paiement && (
                    <div>
                      <p className="text-sm text-gray-900">Mode de paiement</p>
                      <p className="capitalize text-black">{selectedEleve.frais_mode_paiement.replace("_", " ")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between gap-3">
              <button
                onClick={() => openConfirmModal(selectedEleve.id, selectedEleve.enfant_nom, selectedEleve.enfant_prenom)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer l'élève
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-black transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}