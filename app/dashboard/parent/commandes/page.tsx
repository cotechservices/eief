// app/dashboard/parent/commandes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  CreditCard,
  X
} from "lucide-react";

interface ArticleCommande {
  id: number;
  article_id: number;
  nom: string;
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
  articles: ArticleCommande[];
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function ParentCommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fonction pour ajouter une notification
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
    fetchCommandes();
  }, []);

  const fetchCommandes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/parent/commandes");
      if (response.ok) {
        const data = await response.json();
        setCommandes(data);
      } else {
        addNotification("error", "Erreur lors du chargement des commandes");
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
      case "valide":
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Validée
          </span>
        );
      case "rejete":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejetée
          </span>
        );
      default:
        return null;
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "valide":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejete":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return "En attente de validation";
      case "valide":
        return "Commande validée";
      case "rejete":
        return "Commande rejetée";
      default:
        return statut;
    }
  };

  const filteredCommandes = commandes.filter(c => {
    const matchSearch = c.numero_commande.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.articles.some(a => a.nom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatut = filterStatut === "all" || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
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
              {notification.type === "info" && <FileText className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-blue-600" />
            Mes commandes
          </h1>
          <p className="text-gray-900">Suivez l'état de vos commandes de fournitures</p>
        </div>
        <Link
          href="/librairie"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Commander des fournitures
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total commandes</p>
              <p className="text-2xl font-bold text-blue-600">{commandes.length}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {commandes.filter(c => c.statut === "en_attente").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Validées</p>
              <p className="text-2xl font-bold text-green-600">
                {commandes.filter(c => c.statut === "valide").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">
                {commandes.filter(c => c.statut === "rejete").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro de commande ou article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validées</option>
            <option value="rejete">Rejetées</option>
          </select>
        </div>
      </div>

      {/* Liste des commandes */}
      {filteredCommandes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucune commande</h3>
          <p className="text-gray-500 mt-2">
            Vous n'avez pas encore passé de commande de fournitures.
          </p>
          <Link
            href="/librairie"
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Commander des fournitures
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCommandes.map((commande) => (
            <div
              key={commande.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition border border-gray-100"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-black text-lg">
                        {commande.numero_commande}
                      </h3>
                      {getStatutBadge(commande.statut)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(commande.date_commande).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {commande.articles.length} article(s)
                      </span>
                      <span className="flex items-center gap-1 font-bold text-green-600">
                        <CreditCard className="w-4 h-4" />
                        {commande.total.toLocaleString()} GNF
                      </span>
                    </div>
                    {/* Articles résumés */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {commande.articles.slice(0, 3).map((article) => (
                        <span
                          key={article.id}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {article.nom} × {article.quantite}
                        </span>
                      ))}
                      {commande.articles.length > 3 && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                          +{commande.articles.length - 3} autres
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCommande(commande);
                      setShowDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 transition p-2 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut */}
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                {getStatutIcon(selectedCommande.statut)}
                <div>
                  <p className="font-medium text-gray-900">Statut de la commande</p>
                  <p className="text-sm text-gray-600">{getStatutLabel(selectedCommande.statut)}</p>
                </div>
              </div>

              {/* Articles */}
              <div>
                <h3 className="font-semibold text-black mb-3">Articles commandés</h3>
                <div className="space-y-2">
                  {selectedCommande.articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-black">{article.nom}</p>
                        <p className="text-xs text-gray-500">
                          Quantité: {article.quantite} × {article.prix_unitaire.toLocaleString()} GNF
                        </p>
                      </div>
                      <p className="font-bold text-green-600">
                        {article.total.toLocaleString()} GNF
                      </p>
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
                  <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                    {selectedCommande.observations}
                  </p>
                </div>
              )}

              {/* Date */}
              <div className="text-sm text-gray-500 border-t pt-4">
                <p>
                  Commandé le{" "}
                  {new Date(selectedCommande.date_commande).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>

              {/* Bouton Fermer */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}