// app/dashboard/admin/parents/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  Loader2,
  Search,
  User,
  Mail,
  Phone,
  GraduationCap,
  UserPlus,
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  X,
  AlertTriangle,
  Trash2,
  CreditCard,
  Wallet,
  BookOpen,
  Bus,
  Utensils,
  ArrowLeft,
  UserX
} from "lucide-react";

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  classe_nom: string;
  niveau: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe?: string;
  photo_url: string | null;
  email?: string;
  telephone?: string;
  date_inscription?: string;
  est_inscrit?: boolean;
  classe_id?: number;
  frais_inscription?: number;
  lien_parent?: string;
}

interface ParentDetail {
  id: number;
  utilisateur_id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  profession: string;
  situation_matrimoniale: any;
  photo_url: string | null;
  enfants: Enfant[];
  preinscriptions?: any[];
  created_at?: string;
  est_actif?: boolean;
}

interface Parent {
  id: number;
  utilisateur_id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  profession: string;
  situation_matrimoniale: any;
  enfants: Enfant[];
  totalEnfants: number;
  photo_url: string | null;
  totalPreinscriptions?: number;
  preinscriptionsEnAttente?: number;
  aDesPreinscriptions?: boolean;
}

// Interface pour les notifications
interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function AdminParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // États pour le modal de détails
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [parentDetail, setParentDetail] = useState<ParentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // États pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fonction pour les notifications
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
    fetchParents();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParents(parents);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredParents(
        parents.filter(
          (p) =>
            p.nom.toLowerCase().includes(term) ||
            p.prenom.toLowerCase().includes(term) ||
            p.email.toLowerCase().includes(term) ||
            p.enfants.some(
              (e) =>
                e.nom.toLowerCase().includes(term) ||
                e.prenom.toLowerCase().includes(term)
            )
        )
      );
    }
  }, [searchTerm, parents]);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/parents");
      if (!response.ok) {
        throw new Error("Erreur chargement parents");
      }
      const data = await response.json();
      console.log("👨‍👩‍👧‍👦 Parents reçus:", data);
      setParents(data);
      setFilteredParents(data);
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors du chargement des parents");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchParents();
    setRefreshing(false);
  };

  // Charger les détails d'un parent avec vérification de l'ID
  const loadParentDetail = async (parentId: number) => {
    // Vérifier que l'ID est valide
    if (isNaN(parentId) || parentId <= 0) {
      addNotification("error", "ID de parent invalide");
      return;
    }

    setLoadingDetail(true);
    setSelectedParentId(parentId);
    try {
      const response = await fetch(`/api/admin/parents/${parentId}`);
      if (!response.ok) {
        throw new Error("Erreur chargement détails");
      }
      const data = await response.json();
      console.log("📋 Détails parent reçus:", data);
      setParentDetail(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Erreur lors du chargement des détails du parent");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Ouvrir le modal de détails
  const openDetailModal = (parent: Parent) => {
    if (parent && parent.id && !isNaN(parent.id) && parent.id > 0) {
      loadParentDetail(parent.id);
    } else {
      addNotification("error", "ID de parent invalide");
    }
  };

  // Fermer le modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setParentDetail(null);
    setSelectedParentId(null);
  };

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
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion des parents</h1>
          <p className="text-gray-900">Liste de tous les parents et leurs enfants</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 text-black"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
           <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Nouvelle inscription
          </Link>
        </div>
      </div>

    {/* Statistiques */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">Total parents</p>
            <p className="text-2xl font-bold">{parents.length}</p>
        </div>
        <Users className="w-8 h-8 text-blue-500" />
        </div>
    </div>
    <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">Total enfants inscrits</p>
            <p className="text-2xl font-bold">
            {parents.reduce((acc, p) => acc + p.totalEnfants, 0)}
            </p>
        </div>
        <GraduationCap className="w-8 h-8 text-green-500" />
        </div>
    </div>
    {/* ⭐ CARTE : TOTAL PRÉ-INSCRIPTIONS */}
    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">Total pré-inscriptions</p>
            <p className="text-2xl font-bold text-purple-600">
            {parents.reduce((acc, p) => acc + (p.totalPreinscriptions || 0), 0)}
            </p>
        </div>
        <FileText className="w-8 h-8 text-purple-500" />
        </div>
    </div>
    <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">Pré-inscriptions en attente</p>
            <p className="text-2xl font-bold text-yellow-600">
            {parents.reduce((acc, p) => acc + (p.preinscriptionsEnAttente || 0), 0)}
            </p>
        </div>
        <Clock className="w-8 h-8 text-yellow-500" />
        </div>
    </div>
    <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">Parents sans enfant</p>
            <p className="text-2xl font-bold">
            {parents.filter((p) => p.totalEnfants === 0).length}
            </p>
        </div>
        <UserX className="w-8 h-8 text-gray-400" />
        </div>
    </div>
    </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un parent ou un enfant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />
      </div>

      {/* Liste des parents - Sans bouton déroulant */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profession
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enfants
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {parent.photo_url ? (
                          <img
                            src={parent.photo_url}
                            alt="Photo"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-black">
                          {parent.prenom} {parent.nom}
                        </p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{parent.email}</span>
                      </div>
                      {parent.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{parent.telephone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{parent.profession || "Non renseigné"}</p>
                  </td>
                  <td className="px-6 py-4">
                      {parent.totalEnfants} {parent.totalEnfants > 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openDetailModal(parent)}
                      className="text-blue-600 hover:text-blue-800 transition flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredParents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun parent trouvé</p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-1">
                Essayez de modifier votre recherche
              </p>
            )}
          </div>
        )}
      </div>

      {/* ⭐ MODAL DÉTAIL DU PARENT AVEC LA LISTE DES ENFANTS */}
      {showDetailModal && parentDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* En-tête fixe */}
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Détails du parent
                </h2>
                <button onClick={closeDetailModal} className="text-gray-900 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* ⭐ SECTION 1 : INFOS DU PARENT EN HAUT */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {parentDetail.photo_url ? (
                        <img src={parentDetail.photo_url} alt="Photo" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                          <User className="w-12 h-12 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-black">
                        {parentDetail.prenom} {parentDetail.nom}
                      </h3>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{parentDetail.email}</span>
                        </div>
                        {parentDetail.telephone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{parentDetail.telephone}</span>
                          </div>
                        )}
                        {parentDetail.adresse && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">{parentDetail.adresse}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            Inscrit depuis le {new Date(parentDetail.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{parentDetail.profession || "Non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            parentDetail.est_actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {parentDetail.est_actif ? '✅ Actif' : '❌ Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Situation matrimoniale */}
                  {parentDetail.situation_matrimoniale && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h4 className="text-sm font-semibold text-pink-700 flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Informations de la mère
                      </h4>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {parentDetail.situation_matrimoniale.mereNom && (
                          <div>
                            <p className="text-xs text-gray-500">Nom complet</p>
                            <p className="font-medium text-black">
                              {parentDetail.situation_matrimoniale.merePrenom || ""} {parentDetail.situation_matrimoniale.mereNom || ""}
                            </p>
                          </div>
                        )}
                        {parentDetail.situation_matrimoniale.merePhone && (
                          <div>
                            <p className="text-xs text-gray-500">Téléphone</p>
                            <p className="font-medium text-black">{parentDetail.situation_matrimoniale.merePhone}</p>
                          </div>
                        )}
                        {parentDetail.situation_matrimoniale.mereProfession && (
                          <div>
                            <p className="text-xs text-gray-500">Profession</p>
                            <p className="font-medium text-black">{parentDetail.situation_matrimoniale.mereProfession}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ⭐ SECTION 2 : LISTE DES ENFANTS */}
                <div>
                  <h3 className="font-semibold text-black mb-4 flex items-center gap-2 border-b pb-2">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    Enfants ({parentDetail.enfants.length})
                  </h3>

                  {parentDetail.enfants.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Aucun enfant associé à ce parent</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parentDetail.enfants.map((enfant) => (
                        <div
                          key={enfant.id}
                          className="bg-white border rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                                {enfant.photo_url ? (
                                  <img
                                    src={enfant.photo_url}
                                    alt="Photo"
                                    className="w-14 h-14 rounded-full object-cover"
                                  />
                                ) : (
                                  <GraduationCap className="w-7 h-7 text-green-600" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-black">
                                    {enfant.prenom} {enfant.nom}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {enfant.classe_nom || "Non assigné"} • {enfant.niveau || "Niveau non défini"}
                                  </p>
                                </div>
                                <Link
                                  href={`/dashboard/admin/eleves/${enfant.id}`}
                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir
                                </Link>
                              </div>

                              {/* Grille des détails de l'enfant */}
                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded-lg">
                                <div>
                                  <p className="text-gray-500">Matricule</p>
                                  <p className="font-mono text-black font-medium">{enfant.matricule}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Date de naissance</p>
                                  <p className="text-black font-medium">{new Date(enfant.date_naissance).toLocaleDateString()}</p>
                                </div>
                                {enfant.lieu_naissance && (
                                  <div>
                                    <p className="text-gray-500">Lieu de naissance</p>
                                    <p className="text-black font-medium">{enfant.lieu_naissance}</p>
                                  </div>
                                )}
                                {enfant.sexe && (
                                  <div>
                                    <p className="text-gray-500">Sexe</p>
                                    <p className="text-black font-medium">{enfant.sexe === "M" ? "Garçon" : "Fille"}</p>
                                  </div>
                                )}
                                {enfant.est_inscrit !== undefined && (
                                  <div>
                                    <p className="text-gray-500">Statut</p>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      enfant.est_inscrit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {enfant.est_inscrit ? '✅ Inscrit' : '❌ Non inscrit'}
                                    </span>
                                  </div>
                                )}
                                {enfant.date_inscription && (
                                  <div>
                                    <p className="text-gray-500">Date d'inscription</p>
                                    <p className="text-black font-medium">{new Date(enfant.date_inscription).toLocaleDateString()}</p>
                                  </div>
                                )}
                                {enfant.lien_parent && (
                                  <div>
                                    <p className="text-gray-500">Lien parent</p>
                                    <p className="text-black font-medium capitalize">{enfant.lien_parent}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ⭐ SECTION 3 : PRÉ-INSCRIPTIONS (optionnel) */}
                {parentDetail.preinscriptions && parentDetail.preinscriptions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2 border-b pb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Pré-inscriptions ({parentDetail.preinscriptions.length})
                    </h3>
                    <div className="space-y-2">
                      {parentDetail.preinscriptions.map((preins) => (
                        <div key={preins.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium text-black">
                              {preins.enfant_prenom} {preins.enfant_nom}
                            </p>
                            <p className="text-sm text-gray-500">{preins.classe} • {preins.niveau}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">
                              {preins.montant_total_plan?.toLocaleString() || 0} GNF
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              preins.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                              preins.statut === 'valide' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {preins.statut === 'en_attente' ? 'En attente' :
                               preins.statut === 'valide' ? 'Validée' : 'Rejetée'}
                            </span>
                            <Link
                              href={`/dashboard/admin/preinscriptions`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pied du modal */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 text-black border rounded-lg hover:bg-gray-100 transition"
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

// Composants supplémentaires si les icônes ne sont pas disponibles
const Briefcase = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const Heart = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);