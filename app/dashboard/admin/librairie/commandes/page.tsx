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

  // ⭐ Nouveaux états pour le règlement du paiement lors de la validation
  const [modePaiement, setModePaiement] = useState("especes");
  const [referencePaiement, setReferencePaiement] = useState("");
  const [observations, setObservations] = useState("");

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

  const handleUpdateStatut = async () => {
    if (!selectedCommande || !actionStatut) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/librairie/commandes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCommande.id,
          statut: actionStatut,
          mode_paiement: modePaiement,
          reference_paiement: referencePaiement,
          observations: observations
        }),
      });

      if (response.ok) {
        await fetchCommandes();
        setShowConfirmModal(false);
        setShowDetailModal(false);
        setSelectedCommande(null);
        setModePaiement("especes");
        setReferencePaiement("");
        setObservations("");
      } else {
        const errData = await response.json();
        alert(errData.error || "Erreur lors du traitement de la commande");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur s'est produite.");
    } finally {
      setProcessing(false);
    }
  };

  const openConfirmModal = (statut: "valide" | "rejete") => {
    setActionStatut(statut);
    setModePaiement("especes");
    setReferencePaiement("");
    setObservations("");
    setShowConfirmModal(true);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> En attente</span>;
      case "valide":
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3" /> Validée & Payée</span>;
      case "rejete":
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 font-medium"><XCircle className="w-3 h-3" /> Rejetée</span>;
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
          <p className="text-gray-900">Gérez et validez les règlements des commandes de fournitures</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4 text-gray-900 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filtrer par statut :</label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm font-medium"
            >
              <option value="all">Toutes les commandes</option>
              <option value="en_attente">En attente de validation</option>
              <option value="valide">Validées & Payées</option>
              <option value="rejete">Rejetées</option>
            </select>
          </div>
          <span className="text-sm text-gray-500 font-medium">
            Total : {commandes.length} commande{commandes.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tableau des commandes */}
      {commandes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold text-base">Aucune commande trouvée</p>
          <p className="text-sm text-gray-500 mt-1">Les demandes soumises par les parents s'afficheront ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Commande</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Parent</th>
                  <th className="px-4 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Articles</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commandes.map((commande) => (
                  <tr key={commande.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md font-bold border border-gray-200">
                        {commande.numero_commande}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{commande.parent_prenom} {commande.parent_nom}</p>
                      <p className="text-xs text-gray-500">{commande.parent_email}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-extrabold text-green-600">
                      {commande.total.toLocaleString()} GNF
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full text-xs">
                        {commande.articles.length} article{commande.articles.length > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">{getStatutBadge(commande.statut)}</td>
                    <td className="px-4 py-4 text-xs text-gray-600 font-medium">
                      {new Date(commande.date_commande).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedCommande(commande);
                          setShowDetailModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Examiner
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Détail de la commande</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedCommande.numero_commande}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos parent */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  Informations du parent
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-900">
                  <div>
                    <p className="text-xs text-gray-500">Nom complet</p>
                    <p className="font-semibold">{selectedCommande.parent_prenom} {selectedCommande.parent_nom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold">{selectedCommande.parent_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-semibold">{selectedCommande.parent_telephone || "Non renseigné"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Statut de la commande</p>
                    {getStatutBadge(selectedCommande.statut)}
                  </div>
                </div>
              </div>

              {/* Articles */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Articles commandés</h3>
                <div className="space-y-2">
                  {selectedCommande.articles.map((article) => (
                    <div key={article.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{article.nom}</p>
                        <p className="text-xs text-gray-500">x{article.quantite} × {article.prix_unitaire.toLocaleString()} GNF</p>
                      </div>
                      <p className="font-bold text-green-600 text-sm">{article.total.toLocaleString()} GNF</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-green-50 border border-green-200 p-3 rounded-xl flex justify-between items-center font-bold text-green-800">
                  <span>Montant total de la commande</span>
                  <span className="text-lg">{selectedCommande.total.toLocaleString()} GNF</span>
                </div>
              </div>

              {/* Observations */}
              {selectedCommande.observations && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">Observations</h3>
                  <p className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-200">{selectedCommande.observations}</p>
                </div>
              )}

              {/* Actions de validation / rejet */}
              {selectedCommande.statut === "en_attente" ? (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openConfirmModal("rejete")}
                    className="flex-1 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Rejeter la commande
                  </button>
                  <button
                    onClick={() => openConfirmModal("valide")}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Valider & Enregistrer le Paiement
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t text-right">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold text-sm"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation & Sélection du Mode de Paiement */}
      {showConfirmModal && selectedCommande && actionStatut && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className={`p-5 border-b flex items-center gap-3 ${
              actionStatut === "valide" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                actionStatut === "valide" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}>
                {actionStatut === "valide" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {actionStatut === "valide" ? "Valider & encaisser le paiement" : "Rejeter la commande"}
                </h3>
                <p className="text-xs text-gray-600 font-mono">{selectedCommande.numero_commande}</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {actionStatut === "valide" ? (
                <>
                  <div className="bg-green-50/60 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                    <p className="font-semibold">Montant à encaisser : <span className="text-base font-extrabold">{selectedCommande.total.toLocaleString()} GNF</span></p>
                    <p className="mt-0.5 text-green-700">La validation décrémentera automatiquement le stock et enregistrera le règlement.</p>
                  </div>

                  {/* Mode de paiement */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Mode de paiement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modePaiement}
                      onChange={(e) => setModePaiement(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    >
                      <option value="especes">Espèces</option>
                      <option value="orange_money">Orange Money</option>
                    </select>
                  </div>

                  {/* Référence de transaction */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Référence de transaction / N° Chèque
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: OM-8947239, N° Chèque 00234..."
                      value={referencePaiement}
                      onChange={(e) => setReferencePaiement(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  {/* Observations */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Observations / Remarques (Optionnel)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Remarque éventuelle sur le paiement..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Motif du rejet (Optionnel)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Précisez la raison du rejet..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateStatut}
                  disabled={processing}
                  className={`flex-1 py-2.5 rounded-xl transition font-semibold text-sm flex items-center justify-center gap-2 text-white shadow-sm ${
                    actionStatut === "valide" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      {actionStatut === "valide" ? "Confirmer & Valider" : "Confirmer le rejet"}
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