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
    UserX,
    Heart,
    Briefcase
} from "lucide-react";

import PaiementGlobalModal from "@/components/PaiementGlobalModal";

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
    const [showPaiementGlobalModal, setShowPaiementGlobalModal] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [parentDetail, setParentDetail] = useState<ParentDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // ⭐ États pour la suppression
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
    const [deleting, setDeleting] = useState(false);

    // États pour les notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // États pour le modal d'édition d'un enfant et de son parent
    const [showEditEleveModal, setShowEditEleveModal] = useState(false);
    const [eleveToEdit, setEleveToEdit] = useState<Enfant | null>(null);
    const [editEleveData, setEditEleveData] = useState<any>({});
    const [editParentData, setEditParentData] = useState<any>({});
    const [cantineData, setCantineData] = useState({
        inscrire: false,
        mois: 0,
        montantMensuel: 0,
        montantAuto: false
    });
    const [transportData, setTransportData] = useState({
        inscrire: false,
        ligneId: "",
        mois: 0,
        montantMensuel: 0,
        montantAuto: false
    });
    const [transportLignes, setTransportLignes] = useState<any[]>([]);
    const [savingEleve, setSavingEleve] = useState(false);
    const [activeTab, setActiveTab] = useState<'eleve' | 'parent' | 'cantine' | 'transport'>('eleve');

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

    // ⭐ Fonction pour récupérer le prix mensuel de la cantine depuis la BD
    const fetchPrixMensuelCantine = async () => {
        try {
            const response = await fetch("/api/admin/cantine/prix-mensuel");
            if (response.ok) {
                const data = await response.json();
                if (data.prix_mensuel) {
                    setCantineData(prev => ({
                        ...prev,
                        montantMensuel: data.prix_mensuel,
                        montantAuto: true,
                        mois: prev.mois === 0 ? 1 : prev.mois
                    }));
                    addNotification("success", `💰 Prix cantine chargé : ${data.prix_mensuel.toLocaleString()} GNF/mois`);
                } else {
                    setCantineData(prev => ({
                        ...prev,
                        montantMensuel: 150000,
                        montantAuto: true,
                        mois: prev.mois === 0 ? 1 : prev.mois
                    }));
                }
            } else {
                setCantineData(prev => ({
                    ...prev,
                    montantMensuel: 150000,
                    montantAuto: true,
                    mois: prev.mois === 0 ? 1 : prev.mois
                }));
            }
        } catch (error) {
            console.error("Erreur chargement prix cantine:", error);
            setCantineData(prev => ({
                ...prev,
                montantMensuel: 150000,
                montantAuto: true,
                mois: prev.mois === 0 ? 1 : prev.mois
            }));
        }
    };

    // ⭐ Fonction pour récupérer le prix mensuel du transport depuis la BD
    const fetchPrixMensuelTransport = async () => {
        try {
            const response = await fetch("/api/admin/transport/prix-mensuel");
            if (response.ok) {
                const data = await response.json();
                if (data.prix_mensuel) {
                    setTransportData(prev => ({
                        ...prev,
                        montantMensuel: data.prix_mensuel,
                        montantAuto: true,
                        mois: prev.mois === 0 ? 1 : prev.mois
                    }));
                    addNotification("success", `💰 Prix transport chargé : ${data.prix_mensuel.toLocaleString()} GNF/mois`);
                } else {
                    setTransportData(prev => ({
                        ...prev,
                        montantMensuel: 200000,
                        montantAuto: true,
                        mois: prev.mois === 0 ? 1 : prev.mois
                    }));
                }
            } else {
                setTransportData(prev => ({
                    ...prev,
                    montantMensuel: 200000,
                    montantAuto: true,
                    mois: prev.mois === 0 ? 1 : prev.mois
                }));
            }
        } catch (error) {
            console.error("Erreur chargement prix transport:", error);
            setTransportData(prev => ({
                ...prev,
                montantMensuel: 200000,
                montantAuto: true,
                mois: prev.mois === 0 ? 1 : prev.mois
            }));
        }
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
            console.log("Parents reçus:", data);
            setParents(data);
            setFilteredParents(data);
        } catch (error) {
            console.error("Erreur:", error);
            addNotification("error", "Connexion instable pour charger les parents");
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

    // Charger les lignes de transport
    const fetchTransportLignes = async () => {
        try {
            const res = await fetch("/api/admin/transport/lignes");
            if (res.ok) {
                const data = await res.json();
                setTransportLignes(data);
            }
        } catch (error) {
            console.error("Erreur chargement lignes transport", error);
        }
    };

    // Ouvrir le modal d'édition de l'élève
    const openEditEleveModal = (enfant: Enfant) => {
        setEleveToEdit(enfant);
        setEditEleveData({
            nom: enfant.nom || "",
            prenom: enfant.prenom || "",
            sexe: enfant.sexe || "M",
            date_naissance: enfant.date_naissance ? enfant.date_naissance.substring(0, 10) : "",
            lieu_naissance: enfant.lieu_naissance || "",
            matricule: enfant.matricule || "",
            classe_id: enfant.classe_id || "",
            photo_url: enfant.photo_url || "",
            acte_naissance_url: (enfant as any).acte_naissance_url || "",
            bulletin_url: (enfant as any).bulletin_url || ""
        });

        if (parentDetail) {
            setEditParentData({
                nom: parentDetail.nom || "",
                prenom: parentDetail.prenom || "",
                email: parentDetail.email || "",
                telephone: parentDetail.telephone || "",
                adresse: parentDetail.adresse || "",
                profession: parentDetail.profession || "",
                situation_matrimoniale: parentDetail.situation_matrimoniale || {}
            });
        }

        setCantineData({ inscrire: false, mois: 0, montantMensuel: 0, montantAuto: false });
        setTransportData({ inscrire: false, ligneId: "", mois: 0, montantMensuel: 0, montantAuto: false });

        if (transportLignes.length === 0) {
            fetchTransportLignes();
        }

        setActiveTab('eleve');
        setShowEditEleveModal(true);
    };

    // Fermer le modal d'édition
    const closeEditEleveModal = () => {
        setShowEditEleveModal(false);
        setEleveToEdit(null);
    };

    // Sauvegarder les modifications
    const handleFileUpload = async (file: File, field: string) => {
        try {
            addNotification("info", "Téléchargement en cours...");
            const data = new FormData();
            data.append("file", file);
            data.append("enfantId", eleveToEdit?.id?.toString() || "eleve");
            data.append("type", field);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: data,
            });

            if (res.ok) {
                const result = await res.json();
                setEditEleveData((prev: any) => ({ ...prev, [field]: result.url }));
                addNotification("success", "Fichier uploadé avec succès");
            } else {
                addNotification("error", "Erreur lors de l'upload");
            }
        } catch (error) {
            addNotification("error", "Erreur lors de l'upload");
        }
    };

    const handleSaveEleveDetails = async () => {
        if (!eleveToEdit || !parentDetail) return;

        setSavingEleve(true);
        try {
            // 1. Sauvegarder l'élève
            const resEleve = await fetch(`/api/admin/eleves/${eleveToEdit.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editEleveData)
            });
            if (!resEleve.ok) {
                const errorData = await resEleve.json();
                throw new Error("Erreur modification élève: " + (errorData.error || ""));
            }

            // 2. Sauvegarder le parent
            const resParent = await fetch(`/api/admin/parents/${parentDetail.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editParentData)
            });
            if (!resParent.ok) {
                const errorData = await resParent.json();
                throw new Error("Erreur modification parent: " + (errorData.error || ""));
            }

            // 3. Cantine - uniquement si inscrit ET mois > 0
            if (cantineData.inscrire && cantineData.mois > 0) {
                const resCantine = await fetch("/api/admin/cantine/inscrire", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        eleveId: eleveToEdit.id,
                        mois: cantineData.mois,
                        montantMensuel: cantineData.montantMensuel,
                        montantTotal: cantineData.mois * cantineData.montantMensuel
                    })
                });
                if (!resCantine.ok) {
                    const errorData = await resCantine.json();
                    addNotification("error", `Erreur cantine: ${errorData.error}`);
                }
            } else if (cantineData.inscrire && cantineData.mois === 0) {
                addNotification("info", "Aucun abonnement cantine sélectionné (0 mois)");
            }

            // 4. Transport - uniquement si inscrit, ligneId ET mois > 0
            if (transportData.inscrire && transportData.ligneId && transportData.mois > 0) {
                const resTransport = await fetch("/api/admin/transport/inscrire", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        eleveId: eleveToEdit.id,
                        ligneId: transportData.ligneId,
                        mois: transportData.mois,
                        montantMensuel: transportData.montantMensuel
                    })
                });
                if (!resTransport.ok) {
                    const errorData = await resTransport.json();
                    addNotification("error", `Erreur transport: ${errorData.error}`);
                }
            } else if (transportData.inscrire && transportData.mois === 0) {
                addNotification("info", "Aucun abonnement transport sélectionné (0 mois)");
            }

            addNotification("success", "Informations mises à jour avec succès");
            setShowEditEleveModal(false);

            // Recharger les détails
            loadParentDetail(parentDetail.id);
            fetchParents();

        } catch (error: any) {
            console.error("Erreur save:", error);
            addNotification("error", error.message || "Erreur lors de la sauvegarde");
        } finally {
            setSavingEleve(false);
        }
    };

    // ⭐ FONCTION DE SUPPRESSION
    const handleDeleteParent = async () => {
        if (!parentToDelete) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/admin/parents/${parentToDelete.id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                addNotification("success", `Parent ${parentToDelete.prenom} ${parentToDelete.nom} supprimé avec succès`);
                setShowDeleteModal(false);
                setParentToDelete(null);
                await fetchParents();
            } else {
                addNotification("error", data.error || "Erreur lors de la suppression");
            }
        } catch (error) {
            console.error("Erreur suppression:", error);
            addNotification("error", "Erreur lors de la suppression du parent");
        } finally {
            setDeleting(false);
        }
    };

    // ⭐ FONCTION POUR OUVRIR LE MODAL DE SUPPRESSION
    const openDeleteModal = (parent: Parent) => {
        setParentToDelete(parent);
        setShowDeleteModal(true);
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
                            <p className="text-sm text-gray-900">Total parents</p>
                            <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-900">Total enfants inscrits</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {parents.reduce((acc, p) => acc + p.totalEnfants, 0)}
                            </p>
                        </div>
                        <GraduationCap className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-900">Total inscriptions</p>
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
                            <p className="text-sm text-gray-900">Inscriptions en attente</p>
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
                            <p className="text-sm text-gray-900">Parents sans enfant</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {parents.filter((p) => p.totalEnfants === 0).length}
                            </p>
                        </div>
                        <UserX className="w-8 h-8 text-gray-900" />
                    </div>
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-900" />
                <input
                    type="text"
                    placeholder="Rechercher un parent ou un enfant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
            </div>

            {/* Liste des parents */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                    Parent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                    Profession
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                    Enfants
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
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
                                                <Mail className="w-4 h-4 text-gray-900" />
                                                <span className="text-gray-900">{parent.email}</span>
                                            </div>
                                            {parent.telephone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-4 h-4 text-gray-900" />
                                                    <span className="text-gray-900">{parent.telephone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-900">{parent.profession || "Non renseigné"}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">
                                        {parent.totalEnfants} {parent.totalEnfants > 1 ? "enfants" : "enfant"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openDetailModal(parent)}
                                                className="text-blue-600 hover:text-blue-800 transition p-1"
                                                title="Voir les détails"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(parent)}
                                                className="text-red-600 hover:text-red-800 transition p-1"
                                                title="Supprimer le parent et ses enfants"
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

                {filteredParents.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-900">Aucun parent trouvé</p>
                        {searchTerm && (
                            <p className="text-sm text-gray-900 mt-1">
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
                        <div className="p-6 border-b sticky top-0 bg-white z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-black flex items-center gap-2">
                                    <User className="w-6 h-6 text-blue-600" />
                                    Détails du parent
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowPaiementGlobalModal(true)}
                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-medium shadow-sm"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Paiement Global
                                    </button>
                                    <button onClick={closeDetailModal} className="text-gray-900 hover:text-gray-900 transition p-2 hover:bg-gray-100 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loadingDetail ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
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
                                                    <Mail className="w-4 h-4 text-gray-900" />
                                                    <span className="text-gray-900">{parentDetail.email}</span>
                                                </div>
                                                {parentDetail.telephone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-900" />
                                                        <span className="text-gray-900">{parentDetail.telephone}</span>
                                                    </div>
                                                )}
                                                {parentDetail.adresse && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-gray-900" />
                                                        <span className="text-gray-900">{parentDetail.adresse}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-900" />
                                                    <span className="text-gray-900">
                                                        Inscrit depuis le {new Date(parentDetail.created_at || Date.now()).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-gray-900" />
                                                    <span className="text-gray-900">{parentDetail.profession || "Non renseigné"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${parentDetail.est_actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {parentDetail.est_actif ? '✅ Actif' : '❌ Inactif'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {parentDetail.situation_matrimoniale && (
                                        <div className="mt-4 pt-4 border-t border-blue-200">
                                            <h4 className="text-sm font-semibold text-pink-700 flex items-center gap-2">
                                                <Heart className="w-4 h-4" />
                                                Informations de la mère
                                            </h4>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                {parentDetail.situation_matrimoniale.mereNom && (
                                                    <div>
                                                        <p className="text-xs text-gray-900">Nom complet</p>
                                                        <p className="font-medium text-black">
                                                            {parentDetail.situation_matrimoniale.merePrenom || ""} {parentDetail.situation_matrimoniale.mereNom || ""}
                                                        </p>
                                                    </div>
                                                )}
                                                {parentDetail.situation_matrimoniale.merePhone && (
                                                    <div>
                                                        <p className="text-xs text-gray-900">Téléphone</p>
                                                        <p className="font-medium text-black">{parentDetail.situation_matrimoniale.merePhone}</p>
                                                    </div>
                                                )}
                                                {parentDetail.situation_matrimoniale.mereProfession && (
                                                    <div>
                                                        <p className="text-xs text-gray-900">Profession</p>
                                                        <p className="font-medium text-black">{parentDetail.situation_matrimoniale.mereProfession}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-black mb-4 flex items-center gap-2 border-b pb-2">
                                        <GraduationCap className="w-5 h-5 text-green-600" />
                                        Enfants ({parentDetail.enfants.length})
                                    </h3>

                                    {parentDetail.enfants.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-900">Aucun enfant associé à ce parent</p>
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
                                                                    <p className="text-sm text-gray-900">
                                                                        {enfant.classe_nom || "Non assigné"} • {enfant.niveau || "Niveau non défini"}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => openEditEleveModal(enfant)}
                                                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 bg-blue-50 px-2 py-1 rounded transition"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    Détails
                                                                </button>
                                                            </div>

                                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded-lg">
                                                                <div>
                                                                    <p className="text-gray-900">Matricule</p>
                                                                    <p className="font-mono text-black font-medium">{enfant.matricule}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-900">Date de naissance</p>
                                                                    <p className="text-black font-medium">{new Date(enfant.date_naissance).toLocaleDateString()}</p>
                                                                </div>
                                                                {enfant.lieu_naissance && (
                                                                    <div>
                                                                        <p className="text-gray-900">Lieu de naissance</p>
                                                                        <p className="text-black font-medium">{enfant.lieu_naissance}</p>
                                                                    </div>
                                                                )}
                                                                {enfant.sexe && (
                                                                    <div>
                                                                        <p className="text-gray-900">Sexe</p>
                                                                        <p className="text-black font-medium">{enfant.sexe === "M" ? "Garçon" : "Fille"}</p>
                                                                    </div>
                                                                )}
                                                                {enfant.est_inscrit !== undefined && (
                                                                    <div>
                                                                        <p className="text-gray-900">Statut</p>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${enfant.est_inscrit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                            }`}>
                                                                            {enfant.est_inscrit ? '✅ Inscrit' : '❌ Non inscrit'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {enfant.date_inscription && (
                                                                    <div>
                                                                        <p className="text-gray-900">Date d'inscription</p>
                                                                        <p className="text-black font-medium">{new Date(enfant.date_inscription).toLocaleDateString()}</p>
                                                                    </div>
                                                                )}
                                                                {enfant.lien_parent && (
                                                                    <div>
                                                                        <p className="text-gray-900">Lien parent</p>
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
                                                        <p className="text-sm text-gray-900">{preins.classe} • {preins.niveau}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-600">
                                                            {preins.montant_total_plan?.toLocaleString() || 0} GNF
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${preins.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
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

            {/* ⭐ MODAL D'ÉDITION D'UN ÉLÈVE ET DE SON PARENT */}
            {showEditEleveModal && eleveToEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <GraduationCap className="w-6 h-6 text-blue-600" />
                                Détails & Inscription de {eleveToEdit.prenom}
                            </h2>
                            <button onClick={closeEditEleveModal} className="text-gray-900 hover:text-gray-900 transition p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex border-b px-4 mt-2">
                            <button
                                onClick={() => setActiveTab('eleve')}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition ${activeTab === 'eleve' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-900 hover:text-gray-700'}`}
                            >
                                Informations Élève
                            </button>
                            <button
                                onClick={() => setActiveTab('parent')}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition ${activeTab === 'parent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-900 hover:text-gray-700'}`}
                            >
                                Informations Parent
                            </button>
                            {!eleveToEdit.cantine_inscrit && (
                                <button
                                    onClick={() => setActiveTab('cantine')}
                                    className={`px-4 py-2 font-medium text-sm border-b-2 transition ${activeTab === 'cantine' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-900 hover:text-gray-700'}`}
                                >
                                    Cantine
                                </button>
                            )}
                            {!eleveToEdit.transport_inscrit && (
                                <button
                                    onClick={() => setActiveTab('transport')}
                                    className={`px-4 py-2 font-medium text-sm border-b-2 transition ${activeTab === 'transport' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-900 hover:text-gray-700'}`}
                                >
                                    Transport
                                </button>
                            )}
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white text-gray-900">
                            {/* Onglet: Informations Élève */}
                            {activeTab === 'eleve' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                            <input type="text" value={editEleveData.nom} onChange={e => setEditEleveData({ ...editEleveData, nom: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                            <input type="text" value={editEleveData.prenom} onChange={e => setEditEleveData({ ...editEleveData, prenom: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                                            <select value={editEleveData.sexe} onChange={e => setEditEleveData({ ...editEleveData, sexe: e.target.value })} className="w-full border rounded-lg p-2 bg-white">
                                                <option value="M">Garçon</option>
                                                <option value="F">Fille</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                                            <input type="date" value={editEleveData.date_naissance} onChange={e => setEditEleveData({ ...editEleveData, date_naissance: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                                            <input type="text" value={editEleveData.lieu_naissance} onChange={e => setEditEleveData({ ...editEleveData, lieu_naissance: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                                            <input type="text" value={editEleveData.matricule} onChange={e => setEditEleveData({ ...editEleveData, matricule: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <h4 className="font-semibold text-sm mb-3 text-gray-700">Documents et Photo</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="border border-dashed rounded-lg p-4 text-center bg-gray-50 flex flex-col items-center justify-center">
                                                {editEleveData.photo_url ? (
                                                    <div className="relative mb-2">
                                                        <img src={editEleveData.photo_url} alt="Photo" className="w-16 h-16 rounded-full object-cover border" />
                                                        <button onClick={() => setEditEleveData({ ...editEleveData, photo_url: "" })} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <User className="w-8 h-8 text-gray-900 mb-2" />
                                                )}
                                                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 bg-white border px-3 py-1.5 rounded shadow-sm transition">
                                                    {editEleveData.photo_url ? "Changer la photo" : "Ajouter une photo"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0], 'photo_url');
                                                    }} />
                                                </label>
                                            </div>

                                            <div className="border border-dashed rounded-lg p-4 text-center bg-gray-50 flex flex-col items-center justify-center">
                                                {editEleveData.acte_naissance_url ? (
                                                    <div className="relative mb-2 w-full">
                                                        <a href={editEleveData.acte_naissance_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded w-full border border-green-200">
                                                            <CheckCircle className="w-4 h-4" /> Voir document
                                                        </a>
                                                        <button onClick={() => setEditEleveData({ ...editEleveData, acte_naissance_url: "" })} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <FileText className="w-8 h-8 text-gray-900 mb-2" />
                                                )}
                                                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 bg-white border px-3 py-1.5 rounded shadow-sm transition mt-auto">
                                                    {editEleveData.acte_naissance_url ? "Remplacer l'acte" : "Acte de naissance"}
                                                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0], 'acte_naissance_url');
                                                    }} />
                                                </label>
                                            </div>

                                            <div className="border border-dashed rounded-lg p-4 text-center bg-gray-50 flex flex-col items-center justify-center">
                                                {editEleveData.bulletin_url ? (
                                                    <div className="relative mb-2 w-full">
                                                        <a href={editEleveData.bulletin_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded w-full border border-green-200">
                                                            <CheckCircle className="w-4 h-4" /> Voir document
                                                        </a>
                                                        <button onClick={() => setEditEleveData({ ...editEleveData, bulletin_url: "" })} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <FileText className="w-8 h-8 text-gray-900 mb-2" />
                                                )}
                                                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-800 bg-white border px-3 py-1.5 rounded shadow-sm transition mt-auto">
                                                    {editEleveData.bulletin_url ? "Remplacer le bulletin" : "Bulletin scolaire"}
                                                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0], 'bulletin_url');
                                                    }} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Onglet: Informations Parent */}
                            {activeTab === 'parent' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                            <input type="text" value={editParentData.nom} onChange={e => setEditParentData({ ...editParentData, nom: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                            <input type="text" value={editParentData.prenom} onChange={e => setEditParentData({ ...editParentData, prenom: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                            <input type="text" value={editParentData.telephone} onChange={e => setEditParentData({ ...editParentData, telephone: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input type="email" value={editParentData.email} onChange={e => setEditParentData({ ...editParentData, email: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                                            <input type="text" value={editParentData.profession} onChange={e => setEditParentData({ ...editParentData, profession: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                            <input type="text" value={editParentData.adresse} onChange={e => setEditParentData({ ...editParentData, adresse: e.target.value })} className="w-full border rounded-lg p-2 bg-white" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="font-semibold text-sm mb-2 text-gray-700">Informations de la mère</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
                                                <input type="text" value={editParentData.situation_matrimoniale?.merePrenom || ""} onChange={e => setEditParentData({ ...editParentData, situation_matrimoniale: { ...editParentData.situation_matrimoniale, merePrenom: e.target.value } })} className="w-full border rounded-lg p-2 text-sm bg-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                                                <input type="text" value={editParentData.situation_matrimoniale?.mereNom || ""} onChange={e => setEditParentData({ ...editParentData, situation_matrimoniale: { ...editParentData.situation_matrimoniale, mereNom: e.target.value } })} className="w-full border rounded-lg p-2 text-sm bg-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                                                <input type="text" value={editParentData.situation_matrimoniale?.merePhone || ""} onChange={e => setEditParentData({ ...editParentData, situation_matrimoniale: { ...editParentData.situation_matrimoniale, merePhone: e.target.value } })} className="w-full border rounded-lg p-2 text-sm bg-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Profession</label>
                                                <input type="text" value={editParentData.situation_matrimoniale?.mereProfession || ""} onChange={e => setEditParentData({ ...editParentData, situation_matrimoniale: { ...editParentData.situation_matrimoniale, mereProfession: e.target.value } })} className="w-full border rounded-lg p-2 text-sm bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Onglet: Cantine */}
                            {activeTab === 'cantine' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4 p-4 bg-orange-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="inscrireCantine"
                                            checked={cantineData.inscrire}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                if (checked) {
                                                    fetchPrixMensuelCantine();
                                                } else {
                                                    setCantineData({
                                                        ...cantineData,
                                                        inscrire: false,
                                                        mois: 0,
                                                        montantMensuel: 0,
                                                        montantAuto: false
                                                    });
                                                    return;
                                                }
                                                setCantineData({ ...cantineData, inscrire: checked });
                                            }}
                                            className="w-5 h-5"
                                        />
                                        <label htmlFor="inscrireCantine" className="font-medium text-gray-900 cursor-pointer">
                                            Inscrire cet élève à la cantine
                                        </label>
                                    </div>

                                    {cantineData.inscrire && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Montant Mensuel (GNF)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={cantineData.montantMensuel}
                                                        onChange={e => setCantineData({ ...cantineData, montantMensuel: parseInt(e.target.value) || 0 })}
                                                        className={`w-full border rounded-lg p-2 ${cantineData.montantAuto ? 'bg-gray-100' : 'bg-white'}`}
                                                        readOnly={cantineData.montantAuto}
                                                    />
                                                    {cantineData.montantAuto && (
                                                        <span className="text-xs text-green-600 whitespace-nowrap font-medium">
                                                            ✅ Auto
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {cantineData.montantAuto ? ' Prix récupéré automatiquement' : ' Modifiable manuellement'}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nombre de mois
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (cantineData.mois > 0) {
                                                                setCantineData({ ...cantineData, mois: cantineData.mois - 1 });
                                                            }
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-black font-bold flex items-center justify-center transition"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="9"
                                                        value={cantineData.mois}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setCantineData({ ...cantineData, mois: Math.min(9, Math.max(0, val)) });
                                                        }}
                                                        className="w-16 border rounded-lg p-2 text-center bg-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (cantineData.mois < 9) {
                                                                setCantineData({ ...cantineData, mois: cantineData.mois + 1 });
                                                            }
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-black font-bold flex items-center justify-center transition"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {cantineData.mois === 0 ? '🚫 Non abonné' : `De 1 à 9 mois (${cantineData.mois}/9)`}
                                                </p>
                                            </div>

                                            <div className="col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                {cantineData.mois === 0 ? (
                                                    <p className="text-sm text-gray-500">
                                                        Aucun abonnement sélectionné (0 mois)
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-600">
                                                        Total à payer : <span className="font-bold text-gray-900 text-lg">
                                                            {(cantineData.montantMensuel * cantineData.mois).toLocaleString()} GNF
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            ({cantineData.mois} mois × {cantineData.montantMensuel.toLocaleString()} GNF)
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Onglet: Transport */}
                            {activeTab === 'transport' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4 p-4 bg-blue-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="inscrireTransport"
                                            checked={transportData.inscrire}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                if (checked) {
                                                    // ⭐ On ne récupère le prix que si une ligne est déjà sélectionnée
                                                    if (transportData.ligneId) {
                                                        fetchPrixMensuelTransport();
                                                    } else {
                                                        // ⭐ Si pas de ligne, on met tout à 0
                                                        setTransportData({
                                                            ...transportData,
                                                            inscrire: true,
                                                            montantMensuel: 0,
                                                            montantAuto: false,
                                                            mois: 0
                                                        });
                                                    }
                                                } else {
                                                    setTransportData({
                                                        ...transportData,
                                                        inscrire: false,
                                                        ligneId: "",
                                                        mois: 0,
                                                        montantMensuel: 0,
                                                        montantAuto: false
                                                    });
                                                }
                                                setTransportData({ ...transportData, inscrire: checked });
                                            }}
                                            className="w-5 h-5"
                                        />
                                        <label htmlFor="inscrireTransport" className="font-medium text-gray-900 cursor-pointer">
                                            Inscrire cet élève au transport
                                        </label>
                                    </div>

                                    {transportData.inscrire && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Ligne de Transport</label>
                                                <select
                                                    value={transportData.ligneId}
                                                    onChange={e => {
                                                        const ligne = transportLignes.find(l => l.id.toString() === e.target.value);
                                                        if (ligne) {
                                                            setTransportData({
                                                                ...transportData,
                                                                ligneId: e.target.value,
                                                                montantMensuel: ligne.prix_abonnement || 0,
                                                                montantAuto: true,
                                                                mois: transportData.mois === 0 ? 1 : transportData.mois
                                                            });
                                                        } else {
                                                            setTransportData({
                                                                ...transportData,
                                                                ligneId: "",
                                                                montantMensuel: 0,
                                                                montantAuto: false,
                                                                mois: 0
                                                            });
                                                        }
                                                    }}
                                                    className="w-full border rounded-lg p-2 bg-white"
                                                >
                                                    <option value="">Sélectionner une ligne</option>
                                                    {transportLignes.map(l => (
                                                        <option key={l.id} value={l.id}>
                                                            {l.nom} - {l.prix_abonnement?.toLocaleString()} GNF
                                                        </option>
                                                    ))}
                                                </select>
                                                {!transportData.ligneId && transportData.inscrire && (
                                                    <p className="text-xs text-red-500 mt-1">Veuillez sélectionner une ligne</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Montant Mensuel (GNF)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={!transportData.ligneId ? 0 : (transportData.mois === 0 ? 0 : transportData.montantMensuel)}
                                                        onChange={e => {
                                                            if (transportData.ligneId && transportData.mois > 0) {
                                                                setTransportData({ ...transportData, montantMensuel: parseInt(e.target.value) || 0 });
                                                            }
                                                        }}
                                                        readOnly={!transportData.ligneId || transportData.montantAuto || transportData.mois === 0}
                                                        className={`w-full border rounded-lg p-2 ${(!transportData.ligneId || transportData.montantAuto || transportData.mois === 0) ? 'bg-gray-100' : 'bg-white'}`}
                                                    />
                                                    {transportData.montantAuto && transportData.ligneId && transportData.mois > 0 && (
                                                        <span className="text-xs text-green-600 whitespace-nowrap font-medium">
                                                            ✅ Auto
                                                        </span>
                                                    )}
                                                    {!transportData.ligneId && (
                                                        <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                                                            Aucune ligne
                                                        </span>
                                                    )}
                                                    {transportData.mois === 0 && transportData.ligneId && (
                                                        <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                                                            Non abonné
                                                        </span>
                                                    )}
                                                </div>
                                                {transportData.montantAuto && transportData.ligneId && transportData.mois > 0 && (
                                                    <p className="text-xs text-green-500 mt-1">✅ Prix automatique</p>
                                                )}
                                                {!transportData.ligneId && (
                                                    <p className="text-xs text-gray-900 mt-1"> Sélectionnez une ligne pour voir le prix</p>
                                                )}
                                                {transportData.mois === 0 && transportData.ligneId && (
                                                    <p className="text-xs text-gray-900 mt-1"> Montant à 0 (non abonné)</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nombre de mois
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (transportData.mois > 0 && transportData.ligneId) {
                                                                setTransportData({
                                                                    ...transportData,
                                                                    mois: transportData.mois - 1,
                                                                    montantMensuel: transportData.mois - 1 === 0 ? 0 : transportData.montantMensuel
                                                                });
                                                            }
                                                        }}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${transportData.ligneId && transportData.mois > 0
                                                                ? 'bg-gray-200 hover:bg-gray-300 text-black'
                                                                : 'bg-gray-100 text-gray-900 cursor-not-allowed'
                                                            }`}
                                                        disabled={!transportData.ligneId || transportData.mois <= 0}
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="9"
                                                        value={transportData.mois}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            const newMois = Math.min(9, Math.max(0, val));
                                                            setTransportData({
                                                                ...transportData,
                                                                mois: newMois,
                                                                montantMensuel: !transportData.ligneId ? 0 : (newMois === 0 ? 0 : transportData.montantMensuel)
                                                            });
                                                        }}
                                                        className={`w-16 border rounded-lg p-2 text-center bg-white ${!transportData.ligneId ? 'opacity-50' : ''
                                                            }`}
                                                        disabled={!transportData.ligneId}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (transportData.mois < 9 && transportData.ligneId) {
                                                                const newMois = transportData.mois + 1;
                                                                setTransportData({
                                                                    ...transportData,
                                                                    mois: newMois,
                                                                    montantMensuel: transportData.mois === 0 ? transportData.montantMensuel || 0 : transportData.montantMensuel
                                                                });
                                                            }
                                                        }}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${transportData.ligneId && transportData.mois < 9
                                                                ? 'bg-gray-200 hover:bg-gray-300 text-black'
                                                                : 'bg-gray-100 text-gray-900 cursor-not-allowed'
                                                            }`}
                                                        disabled={!transportData.ligneId || transportData.mois >= 9}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {!transportData.ligneId ? 'Sélectionnez une ligne' :
                                                        transportData.mois === 0 ? '🚫 Non abonné' : `De 1 à 9 mois (${transportData.mois}/9)`}
                                                </p>
                                            </div>

                                            <div className="col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                {!transportData.ligneId ? (
                                                    <p className="text-sm text-gray-500">
                                                        ⚠️ Veuillez sélectionner une ligne de transport
                                                    </p>
                                                ) : transportData.mois === 0 ? (
                                                    <p className="text-sm text-gray-500">
                                                        ⚠️ Aucun abonnement sélectionné (0 mois)
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-600">
                                                        Total à payer : <span className="font-bold text-gray-900 text-lg">
                                                            {(transportData.montantMensuel * transportData.mois).toLocaleString()} GNF
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            ({transportData.mois} mois × {transportData.montantMensuel.toLocaleString()} GNF)
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={closeEditEleveModal} className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100 transition">
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveEleveDetails}
                                disabled={savingEleve || (transportData.inscrire && !transportData.ligneId)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {savingEleve ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Enregistrer les modifications
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⭐ MODAL DE CONFIRMATION DE SUPPRESSION */}
            {showDeleteModal && parentToDelete && (
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
                                Êtes-vous sûr de vouloir supprimer ce parent et <strong>tous ses enfants</strong> ?
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="font-medium text-red-800">
                                    {parentToDelete.prenom} {parentToDelete.nom}
                                </p>
                                <p className="text-sm text-red-600 mt-1">
                                    {parentToDelete.totalEnfants} enfant(s) associé(s)
                                </p>
                                <p className="text-xs text-red-500 mt-2">
                                    Email: {parentToDelete.email}
                                </p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>
                                        Cette action est <strong>irréversible</strong> et supprimera définitivement :
                                    </span>
                                </p>
                                <ul className="text-sm text-yellow-700 list-disc list-inside mt-1 ml-4 space-y-1">
                                    <li>Le parent et son compte utilisateur</li>
                                    <li>Tous les enfants associés à ce parent</li>
                                    <li>Les liens parent-enfant</li>
                                    <li>Toutes les pré-inscriptions associées</li>
                                    <li>Toutes les réinscriptions associées</li>
                                    <li>Toutes les inscriptions</li>
                                    <li>Les présences et notes des enfants</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setParentToDelete(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-black"
                                disabled={deleting}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteParent}
                                disabled={deleting}
                                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${deleting
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Suppression...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer définitivement
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⭐ MODAL PAIEMENT GLOBAL POUR L'ADMIN */}
            {parentDetail && (
                <PaiementGlobalModal
                    isOpen={showPaiementGlobalModal}
                    onClose={() => setShowPaiementGlobalModal(false)}
                    onSuccess={() => {
                        setShowPaiementGlobalModal(false);
                        if (selectedParentId) {
                            loadParentDetail(selectedParentId);
                        }
                        fetchParents();
                    }}
                    soldeRestant={(parentDetail as any).solde_restant_total ?? (parentDetail.preinscriptions ? parentDetail.preinscriptions.reduce((acc, p) => acc + (Number(p.montant_restant_plan) || 0), 0) : 0)}
                    parentId={selectedParentId || undefined}
                />
            )}
        </div>
    );
}