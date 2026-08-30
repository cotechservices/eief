// app/dashboard/admin/eleves/liste/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BadgeEleveModal from "@/components/BadgeEleveModal";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  CreditCard,
  Wallet,
  Camera,
  Loader2,
  ArrowLeft,
  Bus,
  Utensils,
  Library,
  X,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Smartphone,
  RefreshCw,
  Download,
  AlertTriangle
} from "lucide-react";

interface Eleve {
  id: number;
  numero_dossier: string;
  matricule: string;
  enfant_email: string;
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
  // Nouveaux champs
  transport_inscrit: boolean;
  transport_statut: string;
  cantine_inscrit: boolean;
  cantine_statut: string;
  bibliotheque_inscrit: boolean;
  bibliotheque_statut: string;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function ListeElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClasse, setSelectedClasse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ⭐ États pour le badge scolaire
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadgeEleve, setSelectedBadgeEleve] = useState<Eleve | null>(null);

  // États pour le statut
  const [updatingStatut, setUpdatingStatut] = useState(false);
  const [showStatutModal, setShowStatutModal] = useState(false);
  const [newStatut, setNewStatut] = useState<"actif" | "inactif" | "suspendu">("actif");

  // État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const itemsPerPage = 10;

  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchEleves();
  }, []);

  const fetchEleves = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/eleves");
      const data = await response.json();

      // Utiliser les données réelles de l'API
      setEleves(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Fonction pour mettre à jour le statut
  const handleUpdateStatut = async (eleveId: number, statut: "actif" | "inactif" | "suspendu") => {
    setUpdatingStatut(true);
    try {
      const response = await fetch(`/api/admin/eleves/${eleveId}/statut`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });

      const data = await response.json();

      if (response.ok) {
        addNotification("success", `Statut mis à jour avec succès`);
        await fetchEleves();
        setShowStatutModal(false);
        // Mettre à jour l'élève sélectionné
        if (selectedEleve) {
          setSelectedEleve({ ...selectedEleve, statut });
        }
      } else {
        addNotification("error", data.error || "Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatut(false);
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

  const getServiceBadge = (inscrit: boolean, statut: string) => {
    if (!inscrit) {
      return <span className="bg-gray-100 text-gray-900 px-2 py-1 rounded-full text-xs">Non inscrit</span>;
    }
    if (statut === 'paye' || statut === 'valide') {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    if (statut === 'partiel') {
      return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Partiel</span>;
    }
    return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> En attente</span>;
  };

  const classes = ["all", ...new Set(eleves.map(e => e.classe_nom).filter(Boolean))];

  const filteredEleves = eleves.filter(e => {
    const searchLower = searchTerm.toLowerCase();
    return (
      e.enfant_nom?.toLowerCase().includes(searchLower) ||
      e.enfant_prenom?.toLowerCase().includes(searchLower) ||
      e.matricule?.toLowerCase().includes(searchLower) ||
      e.numero_dossier?.toLowerCase().includes(searchLower) ||
      e.parent_nom?.toLowerCase().includes(searchLower) ||
      e.enfant_email?.toLowerCase().includes(searchLower)
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

  return (
    <div className="space-y-6">
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

      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Liste des élèves inscrits</h1>
            <p className="text-gray-900">Tous les élèves de l'école</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/admin/eleves"
            className="flex items-center hover:bg-gray-100 hover:border-sm rounded-lg gap-2 text-gray-900 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, matricule, dossier ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 text-gray-900 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedClasse}
            onChange={(e) => {
              setSelectedClasse(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-gray-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map(c => (
              <option key={c} value={c}>{c === "all" ? "Toutes les classes" : c}</option>
            ))}
          </select>
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
              <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Dossier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Matricule</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Enfant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Email Enfant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Classe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedEleves.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-blue-600">{e.numero_dossier || '-'}</span>
                        <p className="text-xs text-gray-900 mt-1">Inscrit: {new Date(e.date_inscription).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">{e.matricule}</span>
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
                        <span className="font-medium text-gray-900">{e.enfant_prenom} {e.enfant_nom}</span>
                        <p className="text-xs text-gray-900">{e.sexe === "M" ? "Garçon" : "Fille"}</p>
                        <p className="text-xs text-gray-900">Né: {new Date(e.date_naissance).toLocaleDateString()}</p>
                        {e.lieu_naissance && <p className="text-xs text-gray-900">{e.lieu_naissance}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-900" />
                          <span className="text-sm text-blue-600">{e.enfant_email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{e.parent_prenom} {e.parent_nom}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3 text-gray-900" />
                          <span className="text-xs text-blue-600">{e.parent_email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-900" />
                          <span className="text-xs text-gray-900">{e.parent_telephone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4 text-gray-900" />
                          <span className="text-gray-900">{e.classe_nom}</span>
                        </div>
                        <p className="text-xs text-gray-900">{e.niveau}</p>
                      </td>
                      <td className="px-4 py-4">{getStatutBadge(e.statut)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedEleve(e);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 transition p-1.5 hover:bg-blue-50 rounded-lg"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBadgeEleve(e);
                              setShowBadgeModal(true);
                            }}
                            className="text-amber-600 hover:text-amber-700 transition p-1.5 hover:bg-amber-50 rounded-lg flex items-center gap-1 font-semibold text-xs border border-amber-200"
                            title="Générer / Imprimer le Badge Scolaire"
                          >
                            <Download className="w-4 h-4 text-amber-600" />
                            <span>Badge</span>
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
                  Affichage de <span className="font-medium text-gray-900">{startIndex + 1}</span> à{' '}
                  <span className="font-medium text-gray-900">{Math.min(endIndex, filteredByClasse.length)}</span>{' '}
                  sur <span className="font-medium text-gray-900">{filteredByClasse.length}</span> élèves
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-900" />
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
                    <ChevronRight className="w-4 h-4 text-gray-900" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Détail avec mise à jour du statut */}
      {showDetailModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Fiche élève</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {selectedEleve.photo_url ? (
                    <img src={selectedEleve.photo_url} alt="Photo" className="w-32 h-32 rounded-lg object-cover shadow-md" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedEleve.enfant_prenom} {selectedEleve.enfant_nom}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-gray-900">Matricule</p>
                      <p className="font-mono font-medium text-blue-600">{selectedEleve.matricule}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Numéro dossier</p>
                      <p className="font-mono font-medium text-blue-600">{selectedEleve.numero_dossier || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Email</p>
                      <p className="font-medium">{selectedEleve.enfant_email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Statut</p>
                      <div className="flex items-center gap-2">
                        {getStatutBadge(selectedEleve.statut)}
                        <button
                          onClick={() => {
                            setNewStatut(selectedEleve.statut);
                            setShowStatutModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations parent */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations du parent</h4>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Nom complet</p>
                    <p className="font-medium">{selectedEleve.parent_prenom} {selectedEleve.parent_nom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Email</p>
                    <p className="font-medium">{selectedEleve.parent_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Téléphone</p>
                    <p className="font-medium">{selectedEleve.parent_telephone}</p>
                  </div>
                </div>
              </div>

              {/* Informations enfant */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations de l'enfant</h4>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Nom complet</p>
                    <p className="font-medium">{selectedEleve.enfant_prenom} {selectedEleve.enfant_nom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Date de naissance</p>
                    <p className="font-medium">{new Date(selectedEleve.date_naissance).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Lieu de naissance</p>
                    <p className="font-medium">{selectedEleve.lieu_naissance || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Sexe</p>
                    <p className="font-medium">{selectedEleve.sexe === "M" ? "Masculin" : "Féminin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Niveau</p>
                    <p className="font-medium">{selectedEleve.niveau}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Classe</p>
                    <p className="font-medium">{selectedEleve.classe_nom}</p>
                  </div>
                </div>
              </div>

              {/* Paiement */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations de paiement</h4>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">Montant des frais</p>
                    <p className="font-bold text-lg">{(selectedEleve.frais_montant || 0).toLocaleString()} GNF</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Statut paiement</p>
                    {getFraisBadge(selectedEleve.frais_statut)}
                  </div>
                  {selectedEleve.frais_mode_paiement && (
                    <div>
                      <p className="text-sm text-gray-900">Mode de paiement</p>
                      <p className="capitalize">{selectedEleve.frais_mode_paiement.replace("_", " ")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between gap-3">
              <button
                onClick={() => {
                  setNewStatut(selectedEleve.statut);
                  setShowStatutModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Modifier le statut
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Modal de modification du statut */}
      {showStatutModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Modifier le statut</h2>
                <button
                  onClick={() => setShowStatutModal(false)}
                  className="text-gray-900 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-900">Élève</p>
                <p className="font-medium text-lg">{selectedEleve.enfant_prenom} {selectedEleve.enfant_nom}</p>
                <p className="text-sm text-gray-900">Matricule: {selectedEleve.matricule}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900 mb-2">Nouveau statut</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'actif', label: 'Actif', color: 'green' },
                    { value: 'suspendu', label: 'Suspendu', color: 'orange' },
                    { value: 'inactif', label: 'Inactif', color: 'red' }
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewStatut(value as "actif" | "inactif" | "suspendu")}
                      className={`p-3 border-2 rounded-lg text-center transition ${newStatut === value
                        ? `border-${color}-500 bg-${color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${value === 'actif' ? 'bg-green-500' :
                        value === 'suspendu' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                      <span className={`text-sm font-medium ${value === 'actif' ? 'text-green-700' :
                        value === 'suspendu' ? 'text-orange-700' :
                          'text-red-700'
                        }`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Statut actuel:</span>{' '}
                  {getStatutBadge(selectedEleve.statut)}
                </p>
                {newStatut !== selectedEleve.statut && (
                  <p className="text-sm text-blue-600 mt-1">
                    → Nouveau statut: {newStatut === 'actif' ? 'Actif' : newStatut === 'suspendu' ? 'Suspendu' : 'Inactif'}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowStatutModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition text-gray-900"
                disabled={updatingStatut}
              >
                Annuler
              </button>
              <button
                onClick={() => handleUpdateStatut(selectedEleve.id, newStatut)}
                disabled={updatingStatut || newStatut === selectedEleve.statut}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${updatingStatut || newStatut === selectedEleve.statut
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {updatingStatut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Mettre à jour
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ MODAL INSIGNE / BADGE ELEVE */}
      <BadgeEleveModal
        isOpen={showBadgeModal}
        onClose={() => {
          setShowBadgeModal(false);
          setSelectedBadgeEleve(null);
        }}
        eleve={selectedBadgeEleve}
      />
    </div>
  );
}