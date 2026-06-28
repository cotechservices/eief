// app/dashboard/admin/eleves/liste/page.tsx
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
  X
} from "lucide-react";

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
  // Nouveaux champs
  transport_inscrit: boolean;
  transport_statut: string;
  cantine_inscrit: boolean;
  cantine_statut: string;
  bibliotheque_inscrit: boolean;
  bibliotheque_statut: string;
}

export default function ListeElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClasse, setSelectedClasse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

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
      return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">Non inscrit</span>;
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Liste des élèves inscrits</h1>
            <p className="text-gray-500">Tous les élèves de l'école</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">          
          <Link
            href="/dashboard/admin/eleves"
            className="flex items-center hover:bg-gray-100 hover:border-sm rounded-lg gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, matricule ou dossier..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 text-gray-700 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedClasse}
            onChange={(e) => {
              setSelectedClasse(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map(c => (
              <option key={c} value={c}>{c === "all" ? "Toutes les classes" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau avec nouvelles colonnes */}
      {filteredByClasse.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun élève trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dossier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enfant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantine</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bibliothèque</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frais</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedEleves.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-blue-600">{e.numero_dossier || e.matricule}</span>
                        <p className="text-xs text-gray-500 mt-1">Inscrit le: {new Date(e.date_inscription).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-4">
                        {e.photo_url ? (
                          <img src={e.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">{e.enfant_prenom} {e.enfant_nom}</span>
                        <p className="text-xs text-gray-500">{e.sexe === "M" ? "Garçon" : "Fille"} - {new Date(e.date_naissance).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Matricule: {e.matricule}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{e.parent_prenom} {e.parent_nom}</p>
                        <p className="text-xs text-blue-600">{e.parent_email}</p>
                        <p className="text-xs text-gray-500">{e.parent_telephone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{e.classe_nom}</span>
                        </div>
                      </td>
                      {/* Transport */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Bus className="w-3 h-3 text-gray-400" />
                            {getServiceBadge(e.transport_inscrit, e.transport_statut)}
                          </div>
                        </div>
                      </td>
                      {/* Cantine */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-gray-400" />
                            {getServiceBadge(e.cantine_inscrit, e.cantine_statut)}
                          </div>
                        </div>
                      </td>
                      {/* Bibliothèque */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Library className="w-3 h-3 text-gray-400" />
                            {getServiceBadge(e.bibliotheque_inscrit, e.bibliotheque_statut)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getFraisBadge(e.frais_statut)}
                        <p className="text-xs text-green-600 font-medium mt-1">
                          {(e.frais_montant || 0).toLocaleString()} GNF
                        </p>
                      </td>
                      <td className="px-4 py-4">{getStatutBadge(e.statut)}</td>
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
                <p className="text-sm text-gray-500">
                  Affichage de <span className="font-medium text-gray-700">{startIndex + 1}</span> à{' '}
                  <span className="font-medium text-gray-700">{Math.min(endIndex, filteredByClasse.length)}</span>{' '}
                  sur <span className="font-medium text-gray-700">{filteredByClasse.length}</span> élèves
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>

                  <div className="flex gap-1">
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`dots-${index}`} className="px-3 py-1 text-sm text-gray-500">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
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
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}