// app/dashboard/admin/preinscriptions/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  GraduationCap,
  CreditCard,
  Wallet,
  Image,
  File,
  ExternalLink,
  Camera,
  Trash2,
  AlertTriangle,
  Loader2,
  X
} from "lucide-react";
import PaiementModal from "../../../components/PaiementModal";
import * as XLSX from 'xlsx';

interface Preinscription {
  id: number;
  numero_dossier: string;
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
  classe: string;
  statut: "en_attente" | "valide" | "rejete";
  date_preinscription: string;
  observations: string;
  frais_montant: number;
  frais_statut: string;
  frais_mode_paiement: string;
  acte_naissance_url: string | null;
  photo_url: string | null;
  bulletin_url: string | null;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function GestionPreinscriptionsPage() {
  const [preinscriptions, setPreinscriptions] = useState<Preinscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPreinscription, setSelectedPreinscription] = useState<Preinscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [observations, setObservations] = useState("");
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementPreinscription, setPaiementPreinscription] = useState<Preinscription | null>(null);

  // États pour le modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [preinscriptionToDelete, setPreinscriptionToDelete] = useState<{ id: number; nom: string; prenom: string } | null>(null);
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
    fetchPreinscriptions();
  }, [selectedStatut]);

  const fetchPreinscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatut !== "all") params.append("statut", selectedStatut);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/preinscriptions?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setPreinscriptions(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Erreur:", error);
      setError((error as Error).message);
      addNotification("error", "Erreur lors du chargement des pré-inscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPreinscriptions();
  };

  const openConfirmModal = (id: number, nom: string, prenom: string) => {
    setPreinscriptionToDelete({ id, nom, prenom });
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!preinscriptionToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/preinscriptions?id=${preinscriptionToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPreinscriptions();
        if (selectedPreinscription?.id === preinscriptionToDelete.id) {
          setShowDetailModal(false);
          setSelectedPreinscription(null);
        }
        setShowConfirmModal(false);
        setPreinscriptionToDelete(null);
        addNotification("success", `Pré-inscription de ${preinscriptionToDelete.prenom} ${preinscriptionToDelete.nom} supprimée avec succès`);
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
      addNotification("error", "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatut = async (id: number, statut: string) => {
    try {
      const response = await fetch("/api/admin/preinscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut, observations }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchPreinscriptions();
        setShowDetailModal(false);
        const message = statut === "valide"
          ? "Inscription validée avec succès"
          : "Pré-inscription rejetée avec succès";
        addNotification("success", message);
      } else {
        addNotification("error", data.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors de la mise à jour");
    }
  };

  const handleOpenPaiement = (preinscription: Preinscription) => {
    setPaiementPreinscription(preinscription);
    setShowPaiementModal(true);
  };

  const handlePaiementSuccess = () => {
    fetchPreinscriptions();
    addNotification("success", "Paiement enregistré avec succès");
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredPreinscriptions.map(p => ({
        'Numéro dossier': p.numero_dossier,
        'Date pré-inscription': new Date(p.date_preinscription).toLocaleDateString('fr-FR'),
        'Parent Nom': p.parent_nom,
        'Parent Prénom': p.parent_prenom,
        'Parent Email': p.parent_email,
        'Parent Téléphone': p.parent_telephone,
        'Enfant Nom': p.enfant_nom,
        'Enfant Prénom': p.enfant_prenom,
        'Date naissance': new Date(p.date_naissance).toLocaleDateString('fr-FR'),
        'Lieu naissance': p.lieu_naissance || '-',
        'Sexe': p.sexe === 'M' ? 'Garçon' : 'Fille',
        'Niveau': p.niveau,
        'Classe': p.classe,
        'Statut': p.statut === 'en_attente' ? 'En attente' : p.statut === 'valide' ? 'Validée' : 'Rejetée',
        'Montant frais': `${p.frais_montant?.toLocaleString() || 0} GNF`,
        'Statut paiement': p.frais_statut === 'paye' ? 'Payé' : 'Non payé',
        'Mode paiement': p.frais_mode_paiement ? p.frais_mode_paiement.replace('_', ' ') : '-',
        'Observations': p.observations || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
        { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Preinscriptions');

      const fileName = `preinscriptions_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      addNotification("success", "Export Excel effectué avec succès");
    } catch (error) {
      addNotification("error", "Erreur lors de l'export Excel");
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case "valide":
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validée</span>;
      case "rejete":
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejetée</span>;
      default:
        return null;
    }
  };

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  const filteredPreinscriptions = preinscriptions.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.enfant_nom?.toLowerCase().includes(searchLower) ||
      p.enfant_prenom?.toLowerCase().includes(searchLower) ||
      p.numero_dossier?.toLowerCase().includes(searchLower) ||
      p.parent_nom?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredPreinscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPreinscriptions = filteredPreinscriptions.slice(startIndex, endIndex);

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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement des pré-inscriptions...</p>
        </div>
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
            onClick={fetchPreinscriptions}
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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion des pré-inscriptions</h1>
          <p className="text-gray-900">Gérez les demandes d'inscription, les documents et les paiements</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Carte 1 - Total */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Total</p>
              <p className="text-2xl font-bold text-blue-600">{preinscriptions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-700" />
          </div>
        </div>

        {/* Carte 2 - En attente */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {preinscriptions.filter(p => p.statut === "en_attente").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-700" />
          </div>
        </div>

        {/* Carte 3 - Validées */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Validées</p>
              <p className="text-2xl font-bold text-green-600">
                {preinscriptions.filter(p => p.statut === "valide").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-700" />
          </div>
        </div>

        {/* Carte 4 - Rejetées */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">
                {preinscriptions.filter(p => p.statut === "rejete").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-700" />
          </div>
        </div>

        {/* Carte 5 - Paiements */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Paiements</p>
              <p className="text-2xl font-bold text-purple-600">
                {preinscriptions.filter(p => p.frais_statut === "paye").length}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-purple-700" />
          </div>
        </div>
      </div>
      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4 text-black">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou dossier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validées</option>
            <option value="rejete">Rejetées</option>
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Rechercher
          </button>
        </div>
      </div>

      {/* Tableau */}
      {filteredPreinscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-900 mx-auto mb-4" />
          <p className="text-gray-900">Aucune pré-inscription trouvée</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Dossier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Enfant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Classe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Frais</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPreinscriptions.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4"><span className="font-mono text-sm text-blue-700">{p.numero_dossier}</span></td>
                      <td className="px-4 py-4">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-gray-900" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4"><span className="font-medium text-black">{p.enfant_prenom} {p.enfant_nom}</span><p className="text-xs text-gray-900">{p.sexe === "M" ? "Garçon" : "Fille"} - {new Date(p.date_naissance).toLocaleDateString()}</p></td>
                      <td className="px-4 py-4 text-black"><p className="text-sm text-black">{p.parent_prenom} {p.parent_nom}</p><p className="text-xs text-blue-700">{p.parent_email}</p></td>
                      <td className="px-4 py-4 text-black"><div className="flex items-center gap-1"><GraduationCap className="w-4 h-4 text-gray-900" /><span>{p.classe}</span></div></td>
                      <td className="px-4 py-4 text-black">{getFraisBadge(p.frais_statut)}</td>
                      <td className="px-4 py-4 text-black">{getStatutBadge(p.statut)}</td>
                      <td className="px-4 py-4 text-black">
                        <div className="flex gap-2">
                          {p.frais_statut !== "paye" && (
                            <button onClick={() => handleOpenPaiement(p)} className="text-purple-600 hover:text-purple-700 transition" title="Enregistrer paiement">
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { setSelectedPreinscription(p); setObservations(p.observations || ""); setShowDetailModal(true); }} className="text-blue-600 hover:text-blue-700 transition" title="Voir détails">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openConfirmModal(p.id, p.enfant_nom, p.enfant_prenom)} className="text-red-600 hover:text-red-700 transition" title="Supprimer">
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
                  <span className="font-medium">{Math.min(endIndex, filteredPreinscriptions.length)}</span>{' '}
                  sur <span className="font-medium">{filteredPreinscriptions.length}</span> résultats
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
      {showConfirmModal && preinscriptionToDelete && (
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
                Êtes-vous sûr de vouloir supprimer cette pré-inscription ?
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mb-4">
                {preinscriptionToDelete.prenom} {preinscriptionToDelete.nom}
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
                  setPreinscriptionToDelete(null);
                }}
                className="px-4 py-2 text-black border rounded-lg hover:bg-gray-100 transition"
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
      {showDetailModal && selectedPreinscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">Détail de la pré-inscription</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-900">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {selectedPreinscription.photo_url ? (
                    <img src={selectedPreinscription.photo_url} alt="Photo" className="w-32 h-32 rounded-lg object-cover shadow-md" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-900">Numéro de dossier</p>
                    <p className="font-mono text-xl font-bold text-blue-600">{selectedPreinscription.numero_dossier}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-900">Statut dossier</p>
                      {getStatutBadge(selectedPreinscription.statut)}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-900">Paiement</p>
                      {getFraisBadge(selectedPreinscription.frais_statut)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations parent */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-900" />
                  Informations du parent
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Nom complet</p>
                    <p className="font-medium text-black">{selectedPreinscription.parent_prenom} {selectedPreinscription.parent_nom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Email</p>
                    <p className="font-medium text-black">{selectedPreinscription.parent_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Téléphone</p>
                    <p className="font-medium text-black">{selectedPreinscription.parent_telephone}</p>
                  </div>
                </div>
              </div>

              {/* Informations enfant */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Informations de l'enfant
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Nom complet</p>
                    <p className="font-medium text-black">{selectedPreinscription.enfant_prenom} {selectedPreinscription.enfant_nom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Date de naissance</p>
                    <p className="font-medium text-black" >{new Date(selectedPreinscription.date_naissance).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Lieu de naissance</p>
                    <p className="font-medium text-black">{selectedPreinscription.lieu_naissance || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Sexe</p>
                    <p className="font-medium text-black">{selectedPreinscription.sexe === "M" ? "Masculin" : "Féminin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Niveau</p>
                    <p className="font-medium text-black">{selectedPreinscription.niveau}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Classe souhaitée</p>
                    <p className="font-medium text-black">{selectedPreinscription.classe}</p>
                  </div>
                </div>
              </div>

              {/* Documents téléchargés */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Documents joints
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Acte de naissance */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <File className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-black">Acte de naissance</span>
                    </div>
                    {selectedPreinscription.acte_naissance_url ? (
                      <a href={selectedPreinscription.acte_naissance_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        Voir le document <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-900 text-sm">Non téléchargé</p>
                    )}
                  </div>

                  {/* Photo d'identité */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-black">Photo d'identité</span>
                    </div>
                    {selectedPreinscription.photo_url ? (
                      <a href={selectedPreinscription.photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        Voir la photo <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-900 text-sm">Non téléchargée</p>
                    )}
                  </div>

                  {/* Bulletin */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-black">Bulletin scolaire</span>
                    </div>
                    {selectedPreinscription.bulletin_url ? (
                      <a href={selectedPreinscription.bulletin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        Voir le bulletin <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-900 text-sm">Non téléchargé</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Paiement */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Informations de paiement
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Montant des frais</p>
                    <p className="font-bold text-lg text-green-600">
                      {selectedPreinscription.frais_montant?.toLocaleString()} GNF
                    </p>
                    {selectedPreinscription.classe && (
                      <p className="text-xs text-gray-900 mt-1">
                        (Frais pour la classe {selectedPreinscription.classe})
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Statut paiement</p>
                    {getFraisBadge(selectedPreinscription.frais_statut)}
                  </div>
                  {selectedPreinscription.frais_mode_paiement && (
                    <div>
                      <p className="text-sm text-gray-900">Mode de paiement</p>
                      <p className="capitalize text-black">{selectedPreinscription.frais_mode_paiement.replace("_", " ")}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Observations */}
              <div>
                <label className="block text-black mb-2">Observations</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ajouter une observation..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between gap-3">
              {selectedPreinscription.statut === "en_attente" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateStatut(selectedPreinscription.id, "rejete")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Rejeter
                  </button>
                  {selectedPreinscription.frais_statut === "paye" ? (
                    <button
                      onClick={() => handleUpdateStatut(selectedPreinscription.id, "valide")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Valider l'inscription
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowDetailModal(false); handleOpenPaiement(selectedPreinscription); }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Enregistrer le paiement
                    </button>
                  )}
                </div>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => openConfirmModal(selectedPreinscription.id, selectedPreinscription.enfant_nom, selectedPreinscription.enfant_prenom)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-black border rounded-lg hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaiementModal && paiementPreinscription && (
        <PaiementModal
          isOpen={showPaiementModal}
          onClose={() => setShowPaiementModal(false)}
          onSuccess={handlePaiementSuccess}
          preinscriptionId={paiementPreinscription.id}
          enfantNom={`${paiementPreinscription.enfant_prenom} ${paiementPreinscription.enfant_nom}`}
          montantFrais={500000}
        />
      )}
    </div>
  );
}