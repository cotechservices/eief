// app/dashboard/admin/librairie/commandes/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
  AlertTriangle,
  X,
  CreditCard
} from "lucide-react";

interface ArticleCommande {
  id: number;
  article_id: number;
  nom: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

interface Commande {
  id: number;
  numero_commande: string;
  date_commande: string;
  statut: "en_attente" | "valide" | "rejete";
  total: number;
  observations: string;
  parent_nom: string;
  parent_prenom: string;
  parent_email: string;
  parent_telephone: string;
  articles: ArticleCommande[];
}

export default function AdminCommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("all");
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionStatut, setActionStatut] = useState<"valide" | "rejete" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCommandes();
  }, [filterStatut]);

  const fetchCommandes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatut !== "all") params.append("statut", filterStatut);
      
      const response = await fetch(`/api/admin/librairie/commandes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCommandes(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatut = async (id: number, statut: "valide" | "rejete", observations?: string) => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/librairie/commandes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut, observations }),
      });

      if (response.ok) {
        await fetchCommandes();
        setShowConfirmModal(false);
        setShowDetailModal(false);
        setSelectedCommande(null);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setProcessing(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Commandes librairie</h1>
          <p className="text-gray-900">Gérez les commandes des parents</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validées</option>
            <option value="rejete">Rejetées</option>
          </select>
        </div>
      </div>

      {/* Tableau des commandes */}
      {commandes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Commande</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Parent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-black uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase">Articles</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commandes.map((commande) => (
                  <tr key={commande.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-blue-700">{commande.numero_commande}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-black">{commande.parent_prenom} {commande.parent_nom}</p>
                      <p className="text-xs text-gray-500">{commande.parent_email}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-green-600">
                      {commande.total.toLocaleString()} GNF
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {commande.articles.length}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">{getStatutBadge(commande.statut)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(commande.date_commande).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedCommande(commande);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {showDetailModal && selectedCommande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-black">Détail de la commande</h2>
                  <p className="text-sm text-gray-600 font-mono">{selectedCommande.numero_commande}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos parent */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Informations du parent
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nom complet</p>
                    <p className="font-medium">{selectedCommande.parent_prenom} {selectedCommande.parent_nom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedCommande.parent_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedCommande.parent_telephone || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    {getStatutBadge(selectedCommande.statut)}
                  </div>
                </div>
              </div>

              {/* Articles */}
              <div>
                <h3 className="font-semibold text-black mb-2">Articles commandés</h3>
                <div className="space-y-2">
                  {selectedCommande.articles.map((article) => (
                    <div key={article.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-black">{article.nom}</p>
                        <p className="text-xs text-gray-500">x{article.quantite} × {article.prix_unitaire.toLocaleString()} GNF</p>
                      </div>
                      <p className="font-bold text-green-600">{article.total.toLocaleString()} GNF</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-blue-50 p-3 rounded-lg flex justify-between font-bold text-blue-700">
                  <span>Total</span>
                  <span>{selectedCommande.total.toLocaleString()} GNF</span>
                </div>
              </div>

              {/* Observations */}
              {selectedCommande.observations && (
                <div>
                  <h3 className="font-semibold text-black mb-1">Observations</h3>
                  <p className="bg-gray-50 p-3 rounded-lg text-gray-700">{selectedCommande.observations}</p>
                </div>
              )}

              {/* Actions */}
              {selectedCommande.statut === "en_attente" && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setActionStatut("rejete");
                      setShowConfirmModal(true);
                    }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => {
                      setActionStatut("valide");
                      setShowConfirmModal(true);
                    }}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Valider la commande
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation */}
      {showConfirmModal && selectedCommande && actionStatut && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${actionStatut === "valide" ? "bg-green-100" : "bg-red-100"}`}>
                  {actionStatut === "valide" ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {actionStatut === "valide" ? "Valider la commande" : "Rejeter la commande"}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedCommande.numero_commande}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-900 mb-4">
                {actionStatut === "valide" 
                  ? "Cette action validera la commande et mettra à jour le stock."
                  : "Cette action rejettera la commande."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateStatut(selectedCommande.id, actionStatut)}
                  disabled={processing}
                  className={`flex-1 py-2.5 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
                    actionStatut === "valide" 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-red-600 hover:bg-red-700 text-white"
                  } disabled:opacity-50`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      {actionStatut === "valide" ? "Valider" : "Rejeter"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}