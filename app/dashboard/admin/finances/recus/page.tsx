"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, User, Mail, Phone, Wallet,
  ChevronRight, Loader2, Calendar, Users,
  Eye, Receipt, FileText, RefreshCw, Trash2, AlertTriangle
} from "lucide-react";

interface ParentRecus {
  parent_id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  total_recus: number;
  total_montant: number;
  dernier_paiement: string;
  premier_paiement: string;
  recus: any[];
}

export default function ParentsRecusPage() {
  const [parents, setParents] = useState<ParentRecus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());

  // État pour suppression par famille
  const [parentToDelete, setParentToDelete] = useState<ParentRecus | null>(null);
  const [deletingParent, setDeletingParent] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchParents();
  }, [annee]);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/recus/parents?annee=${annee}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setParents(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchParents();
  };

  const handleDeleteParentRecus = async () => {
    if (!parentToDelete) return;

    setDeletingParent(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/recus/parents/${parentToDelete.parent_id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      setParentToDelete(null);
      fetchParents();
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression");
    } finally {
      setDeletingParent(false);
    }
  };

  const totalGlobal = parents.reduce((acc, p) => acc + Number(p.total_montant), 0);
  const totalRecusGlobal = parents.reduce((acc, p) => acc + p.total_recus, 0);

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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Reçus par Parent
          </h1>
          <p className="text-gray-900 text-sm mt-1">
            Consultez tous les reçus regroupés par parent/famille
          </p>
        </div>
        <button
          onClick={fetchParents}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative ">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher un parent par nom, prénom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="text-gray-900 w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            className="text-gray-900 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["2024", "2025", "2026", "2027"].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {parents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">Total parents</p>
            <p className="text-2xl font-bold text-blue-900">{parents.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-700 font-medium">Total reçus</p>
            <p className="text-2xl font-bold text-green-900">{totalRecusGlobal}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-purple-700 font-medium">Montant total</p>
            <p className="text-2xl font-bold text-purple-900">
              {totalGlobal.toLocaleString()} GNF
            </p>
          </div>
        </div>
      )}

      {/* Liste des parents */}
      {parents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-900 mx-auto mb-4" />
          <p className="text-gray-900">Aucun parent trouvé</p>
          <p className="text-sm text-gray-900 mt-1">Aucun reçu enregistré pour l'année sélectionnée</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Contact</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase">Reçus</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Montant total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase">Dernier paiement</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parents.map((parent) => (
                  <tr key={parent.parent_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {parent.prenom} {parent.nom}
                          </p>
                          <p className="text-sm text-gray-900">
                            ID: {parent.parent_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3.5 h-3.5 text-gray-900" />
                          <span className="text-gray-900">{parent.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3.5 h-3.5 text-gray-900" />
                          <span className="text-gray-900">{parent.telephone || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        <Receipt className="w-3.5 h-3.5" />
                        {parent.total_recus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-green-600">
                        {Number(parent.total_montant).toLocaleString()} GNF
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {parent.dernier_paiement ? new Date(parent.dernier_paiement).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/admin/finances/recus/${parent.parent_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Voir reçus
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setParentToDelete(parent);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-xs font-medium border border-red-200"
                          title="Supprimer toutes les factures/paiements de cette famille"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer factures
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression par famille */}
      {parentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Supprimer les paiements de la famille ?
                </h3>
                <p className="text-sm text-gray-900">
                  Famille de {parentToDelete.prenom} {parentToDelete.nom}
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm">
              <p className="font-semibold text-red-800 mb-1">⚠️ Action irréversible pour les paiements</p>
              <p className="text-red-700">Cette opération va :</p>
              <ul className="list-disc ml-5 mt-1.5 text-red-700 space-y-1">
                <li>Supprimer <strong className="font-bold">{parentToDelete.total_recus} reçu(s)</strong> et paiements associés.</li>
                <li>Annuler le total payé de <strong className="font-bold">{Number(parentToDelete.total_montant).toLocaleString()} GNF</strong>.</li>
                <li>Remettre à jour les soldes restants des inscriptions/réinscriptions des enfants.</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 mb-4 text-xs text-green-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>🛡️</span> Préservation garantie des comptes :
              </p>
              <p>• Le compte du parent et les fiches des élèves <strong>NE SERONT PAS supprimés</strong>.</p>
              <p>• Les inscriptions restent actives avec leur solde total à nouveau exigible.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 mb-5 text-sm space-y-1 border border-gray-200">
              <p className="text-gray-900"><span className="font-semibold text-gray-900">Parent :</span> {parentToDelete.prenom} {parentToDelete.nom}</p>
              <p className="text-gray-900"><span className="font-semibold text-gray-900">Email :</span> {parentToDelete.email}</p>
              <p className="text-gray-900"><span className="font-semibold text-gray-900">Téléphone :</span> {parentToDelete.telephone || 'Non renseigné'}</p>
              <p className="text-gray-900"><span className="font-semibold text-gray-900">Montant total à annuler :</span> <span className="font-bold text-red-600">{Number(parentToDelete.total_montant).toLocaleString()} GNF</span></p>
            </div>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                ❌ {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setParentToDelete(null);
                  setDeleteError(null);
                }}
                disabled={deletingParent}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 transition font-medium text-sm disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteParentRecus}
                disabled={deletingParent}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingParent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression en cours...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmer la suppression
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}