// app/dashboard/admin/finances/paiements/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Eye,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Paiement {
  id: number;
  eleve_nom: string;
  eleve_prenom: string;
  classe_nom: string;
  parent_nom: string;
  parent_prenom: string;
  montant: number;
  type_frais: string;
  date_paiement: string;
  mode_paiement: string;
  statut: string;
  reference_transaction: string;
  reçu_url: string | null;
}

export default function PaiementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  // Charger les paiements depuis l'API
  useEffect(() => {
    fetchPaiements();
  }, [searchTerm, statusFilter, typeFilter, currentPage]);

  const fetchPaiements = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        statut: statusFilter,
        type: typeFilter
      });

      const response = await fetch(`/api/admin/paiements?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setPaiements(data.paiements || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Erreur chargement paiements:", err);
      setError("Impossible de charger les paiements");
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'paye':
      case 'valide':
        return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>;
      case 'attente':
      case 'en_attente':
        return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>;
      case 'impaye':
      case 'annule':
        return <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {statut === 'annule' ? 'Annulé' : 'Impayé'}</span>;
      default:
        return <span className="text-sm">{statut || 'Inconnu'}</span>;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'mobile_money':
        return <Smartphone className="w-4 h-4 text-green-600" />;
      case 'especes':
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case 'carte':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-600" />;
    }
  };

  const getModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      mobile_money: "Mobile Money",
      especes: "Espèces",
      carte: "Carte"
    };
    return modes[mode?.toLowerCase()] || mode || "N/A";
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      inscription: "Inscription",
      mensualite: "Mensualité",
      cantine: "Cantine",
      transport: "Transport",
      bibliotheque: "Bibliothèque",
      autre: "Autre"
    };
    return types[type?.toLowerCase()] || type || "N/A";
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMontant = (montant: number) => {
    return montant?.toLocaleString() || '0';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des paiements</h1>
          <p className="text-gray-900">Enregistrez et suivez tous les paiements</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau paiement
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par élève, parent ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="impaye">Impayé</option>
            <option value="annule">Annulé</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="inscription">Inscription</option>
            <option value="mensualite">Mensualité</option>
            <option value="cantine">Cantine</option>
            <option value="transport">Transport</option>
            <option value="bibliotheque">Bibliothèque</option>
            <option value="autre">Autre</option>
          </select>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Plus de filtres
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement des paiements...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p>{error}</p>
            <button 
              onClick={fetchPaiements}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        ) : paiements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Aucun paiement trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Élève</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Classe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paiements.map((paiement) => (
                    <tr key={paiement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {paiement.eleve_prenom} {paiement.eleve_nom}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{paiement.classe_nom || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {paiement.parent_prenom} {paiement.parent_nom}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatMontant(paiement.montant)} GNF</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded-full">
                          {getTypeLabel(paiement.type_frais)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{formatDate(paiement.date_paiement)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {getModeIcon(paiement.mode_paiement)}
                          <span className="text-sm">{getModeLabel(paiement.mode_paiement)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatutBadge(paiement.statut)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-900 hover:text-gray-900">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-900">
                Affichage {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, total)} sur {total} paiements
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}