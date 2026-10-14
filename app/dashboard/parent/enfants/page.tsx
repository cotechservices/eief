// app/dashboard/parent/enfants/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PaiementGlobalModal from "@/components/PaiementGlobalModal";
import {
  Users,
  CreditCard,
  Calendar,
  GraduationCap,
  Eye,
  AlertCircle,
  Loader2,
  Bus,
  Utensils,
  ShoppingCart,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Image,
  File,
  ExternalLink,
  Camera,
  Plus,
  FileText,
  TrendingUp,
  Download,
  RefreshCw
} from "lucide-react";

interface DetailsFrais {
  inscription: number;
  reinscription?: number;
  cantine: number;
  transport: number;
  librairie: number;
  scolarite: number;
  total: number;
  total_brut?: number;
  total_net_actuel?: number;
  remise?: number;
  net?: number;
  paye: number;
  reste: number;
}

interface Enfant {
  id: number;
  eleve_id: number;
  nom: string;
  prenom: string;
  classe_nom: string;
  niveau: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance?: string;
  matricule: string;
  photo_url?: string | null;
  details_frais: DetailsFrais;
  moyenne: number;
  est_eleve?: boolean;
  est_preinscription?: boolean;
  type?: string;
  total_remise_parent?: number;
  remise_globale?: number;
}

interface Stats {
  notes: Array<{ matiere: string; moyenne: number; coefficient: number }>;
  presences: { total: number; presents: number; absents: number; retards: number };
  paiements: {
    total_paye: number;
    nombre_paiements: number;
    details?: Array<{ montant: number; type_frais: string; mode_paiement: string; date_paiement: string }>;
  };
}

export default function MesEnfantsPage() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [statsEnfant, setStatsEnfant] = useState<{ [key: number]: Stats }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // États pour le modal détail
  const [selectedEnfant, setSelectedEnfant] = useState<Enfant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGlobalPaiementModal, setShowGlobalPaiementModal] = useState(false);
  const [enfantDetail, setEnfantDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEnfants();
  }, []);

  // ⭐⭐⭐ CHARGER LES ENFANTS + STATS (uniquement pour les vrais élèves) ⭐⭐⭐
  const fetchEnfants = async () => {
    try {
      const response = await fetch("/api/parent/enfants");
      const data = await response.json();
      setEnfants(data);

      // ⭐ Charger les stats UNIQUEMENT pour les élèves inscrits (type='eleve')
      // pour éviter les erreurs 403 sur les pré-inscriptions
      for (const enfant of data) {
        if (enfant.type !== 'eleve' || !enfant.eleve_id) {
          continue;
        }

        try {
          const statsResponse = await fetch(`/api/parent/enfants/${enfant.eleve_id}/stats`);
          if (!statsResponse.ok) {
            console.warn(`⚠️ Stats non disponibles pour ${enfant.prenom} (HTTP ${statsResponse.status})`);
            continue;
          }

          const statsData = await statsResponse.json();

          const cleanedStats = {
            ...statsData,
            paiements: {
              total_paye: typeof statsData.paiements?.total_paye === 'number'
                ? statsData.paiements.total_paye
                : parseFloat(statsData.paiements?.total_paye) || 0,
              nombre_paiements: typeof statsData.paiements?.nombre_paiements === 'number'
                ? statsData.paiements.nombre_paiements
                : parseInt(statsData.paiements?.nombre_paiements) || 0,
              details: statsData.paiements?.details || []
            }
          };

          setStatsEnfant(prev => ({ ...prev, [enfant.eleve_id]: cleanedStats }));
        } catch (err) {
          console.warn(`Stats non chargées pour ${enfant.prenom}:`, err);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⭐⭐⭐ CHARGER LES DÉTAILS SELON LE TYPE ⭐⭐⭐
  const loadEnfantDetail = async (enfant: Enfant) => {
    setLoadingDetail(true);
    try {
      let url = "";

      if (enfant.type === "eleve") {
        // Élève inscrit → /api/parent/enfants/[id]
        url = `/api/parent/enfants/${enfant.eleve_id}`;
      } else if (enfant.type === "preinscription") {
        // Pré-inscription → /api/parent/preinscriptions/[id]
        url = `/api/parent/preinscriptions/${enfant.id}`;
      } else if (enfant.type === "reinscription") {
        // Réinscription → /api/parent/reinscriptions/[id]
        url = `/api/parent/reinscriptions/${enfant.id}`;
      } else {
        // Fallback
        url = `/api/parent/enfants/${enfant.eleve_id}`;
      }

      console.log(`🔍 Chargement détail: ${enfant.type} → ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Erreur API ${url}:`, response.status, errorData);
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Détail chargé pour ${enfant.prenom} ${enfant.nom}:`, data);
      setEnfantDetail(data);
    } catch (error: any) {
      console.error("❌ Erreur chargement détail:", error);
      setEnfantDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenDetails = (enfant: Enfant) => {
    setSelectedEnfant(enfant);
    setShowDetailModal(true);
    loadEnfantDetail(enfant);
  };

  // ⭐⭐⭐ STATISTIQUES GLOBALES (LOGIQUE UNIFIÉE) ⭐⭐⭐
  const totalAPayerBrut = enfants.reduce((acc, e) => {
    const details = e.details_frais;
    if (!details) return acc;

    if (details.total_brut !== undefined && details.total_brut !== null && details.total_brut > 0) {
      return acc + Number(details.total_brut);
    }

    const netActuel = Number(details.total_net_actuel) || Number(details.total) || 0;
    const remise = Number(details.remise) || 0;
    return acc + (netActuel + remise);
  }, 0);

  const totalPaye = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.paye) || 0), 0);

  const totalRemises = enfants.reduce((acc, e) => {
    return acc + (Number(e.details_frais?.remise) || 0);
  }, 0);

  const totalAPayerNet = Math.max(0, totalAPayerBrut - totalRemises);
  const soldeRestant = Math.max(0, totalAPayerNet - totalPaye);

  const statsGlobales = {
    totalEnfants: enfants.filter(e => e.est_eleve).length,
    totalPreinscriptions: enfants.filter(e => e.est_preinscription && e.type === 'preinscription').length,
    totalAPayerBrut: totalAPayerBrut,
    totalAPayerNet: totalAPayerNet,
    totalAPayer: totalAPayerNet,
    totalPaye: totalPaye,
    totalRemises: totalRemises,
    soldeRestant: soldeRestant,
  };

  console.log("📊 STATS MES ENFANTS:", {
    totalAPayerBrut,
    totalRemises,
    totalAPayerNet,
    totalPaye,
    soldeRestant,
    enfantsDetail: enfants.map(e => ({
      nom: `${e.prenom} ${e.nom}`,
      type: e.type,
      eleve_id: e.eleve_id,
      total_brut: e.details_frais?.total_brut,
      net_actuel: e.details_frais?.total_net_actuel,
      total: e.details_frais?.total,
      remise: e.details_frais?.remise,
      net: e.details_frais?.net,
    }))
  });

  const filteredEnfants = enfants.filter(e => {
    const searchLower = searchTerm.toLowerCase();
    return (
      e.nom?.toLowerCase().includes(searchLower) ||
      e.prenom?.toLowerCase().includes(searchLower) ||
      e.matricule?.toLowerCase().includes(searchLower) ||
      e.classe_nom?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredEnfants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEnfants = filteredEnfants.slice(startIndex, endIndex);

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
    <div className="space-y-6 text-black">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Mes enfants</h1>
          <p className="text-gray-900">Gérez le suivi scolaire et les paiements de vos enfants</p>
        </div>
        <div className="flex gap-3">
          {statsGlobales.soldeRestant > 0 && (
            <button
              onClick={() => setShowGlobalPaiementModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium"
            >
              <Wallet className="w-4 h-4" />
              Paiement Global
            </button>
          )}
          <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" />Inscrire un enfant
          </Link>
        </div>
      </div>

      {/* BANNIÈRE DE REMISE */}
      {statsGlobales.totalRemises > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between text-indigo-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-lg">
              🏷️
            </div>
            <div>
              <h4 className="font-bold text-sm">Remise Famille Nombreuse Accordée</h4>
              <p className="text-xs text-indigo-700">Une réduction exceptionnelle de scolarité a été déduite de votre solde global.</p>
              <p className="text-xs text-indigo-900 mt-1 font-medium">
                Scolarité brute initiale : <span className="font-semibold text-gray-900">{statsGlobales.totalAPayerBrut.toLocaleString()} GNF</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-indigo-600 font-semibold block">Montant de la remise</span>
            <span className="text-lg font-bold text-indigo-700">-{statsGlobales.totalRemises.toLocaleString()} GNF</span>
          </div>
        </div>
      )}

      {/* STATISTIQUES GLOBALES */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5" /><p className="text-sm opacity-90">Pré-inscriptions</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalPreinscriptions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1 text-gray-900">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <p className="text-sm">Montant net à payer</p>
          </div>
          <p className="text-lg font-bold text-blue-600">{statsGlobales.totalAPayerNet.toLocaleString()} GNF</p>
          {statsGlobales.totalRemises > 0 && (
            <p className="text-xs text-gray-900 mt-1 line-through">
              Brut: {statsGlobales.totalAPayerBrut.toLocaleString()} GNF
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><CreditCard className="w-5 h-5 text-green-600" /><p className="text-sm">Montant payé</p></div>
          <p className="text-lg font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1 text-gray-900"><CreditCard className="w-5 h-5 text-red-600" /><p className="text-sm">Solde restant</p></div>
          <p className="text-lg font-bold text-red-600">{statsGlobales.soldeRestant.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4 text-black border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      {filteredEnfants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <Users className="w-16 h-16 text-gray-900 mx-auto mb-4" />
          <p className="text-gray-900">Aucun enfant trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Matricule</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Enfant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Classe</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Frais</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Accès</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedEnfants.map((e) => {
                    const frais = e.details_frais;
                    const statusPaiement = frais.reste === 0 ? "paye" : frais.paye > 0 ? "partiel" : "non_paye";
                    const isEleve = e.type === 'eleve';
                    const isPreinscription = e.type === 'preinscription';
                    const isReinscription = e.type === 'reinscription';

                    return (
                      <tr key={`${e.type}-${e.id}`} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold text-blue-600">{e.matricule}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {e.photo_url ? (
                            <img src={e.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover border" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border">
                              <Users className="w-5 h-5 text-gray-900" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900 block">{e.prenom} {e.nom}</span>
                          <span className="text-xs text-gray-900 block">
                            {e.sexe === "M" ? "Garçon" : "Fille"}
                            {e.date_naissance && ` - ${new Date(e.date_naissance).toLocaleDateString()}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-gray-950 font-medium">
                            <GraduationCap className="w-4 h-4 text-gray-900" />
                            <span>{e.classe_nom}</span>
                          </div>
                          <span className="text-xs text-gray-900">{e.niveau}</span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEleve && (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <CheckCircle className="w-3 h-3" /> Élève inscrit
                            </span>
                          )}
                          {isPreinscription && (
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" /> Inscription
                            </span>
                          )}
                          {isReinscription && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <RefreshCw className="w-3 h-3" /> Réinscription
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {statusPaiement === "paye" ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <CheckCircle className="w-3 h-3" /> Payé
                            </span>
                          ) : statusPaiement === "partiel" ? (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" /> Partiel
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                              <XCircle className="w-3 h-3" /> Non payé
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenDetails(e)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"
                              title="Voir détails financiers"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {/* Élève inscrit */}
                            {isEleve && (
                              <>
                                <Link
                                  href={`/dashboard/eleve?eleveId=${e.eleve_id || e.id}`}
                                  onClick={() => {
                                    document.cookie = `active_eleve_id=${e.eleve_id || e.id}; path=/; max-age=86400`;
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition text-xs font-semibold shadow-sm"
                                  title="Accéder directement au compte de cet élève"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Compte élève
                                </Link>
                                <Link
                                  href={`/dashboard/parent/enfants/${e.eleve_id || e.id}`}
                                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-xs font-semibold shadow-sm"
                                  title="Accéder au dossier de l'enfant"
                                >
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  Dossier
                                </Link>
                              </>
                            )}

                            {/* Pré-inscription */}
                            {isPreinscription && (
                              <Link
                                href="/dashboard/parent/inscription"
                                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition text-xs font-semibold shadow-sm"
                                title="Voir / finaliser la pré-inscription"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Voir inscription
                              </Link>
                            )}

                            {/* Réinscription */}
                            {isReinscription && (
                              <Link
                                href="/dashboard/parent/reinscription"
                                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition text-xs font-semibold shadow-sm"
                                title="Voir / finaliser la réinscription"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Voir réinscription
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-900">
                  Affichage de <span className="font-semibold">{startIndex + 1}</span> à <span className="font-semibold">{Math.min(endIndex, filteredEnfants.length)}</span> sur <span className="font-semibold">{filteredEnfants.length}</span> résultats
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
                          className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-900 hover:bg-gray-100'}`}
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

      {/* Modal Détail */}
      {showDetailModal && selectedEnfant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">
                  Détail de {selectedEnfant.type === 'eleve' ? "l'élève" : selectedEnfant.type === 'preinscription' ? "l'inscription" : "la réinscription"}
                </h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-900 text-xl font-bold">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {(enfantDetail?.photo_url || selectedEnfant.photo_url) ? (
                    <img
                      src={enfantDetail?.photo_url || selectedEnfant.photo_url}
                      alt="Photo"
                      className="w-32 h-32 rounded-lg object-cover shadow-md border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border';
                          fallback.innerHTML = `<svg class="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <Camera className="w-12 h-12 text-gray-900" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-3 rounded-lg mb-3 border">
                    <p className="text-sm text-gray-900">Numéro de Matricule</p>
                    <p className="font-mono text-xl font-bold text-blue-600">{selectedEnfant.matricule}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-xs text-gray-900">Statut dossier</p>
                      {selectedEnfant.type === 'eleve' && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3" /> Inscription active
                        </span>
                      )}
                      {selectedEnfant.type === 'preinscription' && (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> Inscription
                        </span>
                      )}
                      {selectedEnfant.type === 'reinscription' && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mt-1">
                          <RefreshCw className="w-3 h-3" /> Réinscription
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-xs text-gray-900">Paiement</p>
                      {selectedEnfant.details_frais.reste === 0 ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3" /> Payé
                        </span>
                      ) : selectedEnfant.details_frais.paye > 0 ? (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> Partiel
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mt-1">
                          <XCircle className="w-3 h-3" /> Non payé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reste du modal */}
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (enfantDetail || selectedEnfant) ? (
                <>
                  {/* Informations des parents */}
                  {(enfantDetail?.parent_email) && (
                    <div>
                      <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-900" /> Informations des parents
                      </h3>
                      <div className="bg-gray-50 p-3 rounded-lg mb-4 border">
                        <p className="text-sm text-gray-900">Email de contact</p>
                        <p className="font-medium text-gray-900">{enfantDetail.parent_email}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-3 text-sm uppercase tracking-wide">Père</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-900">Nom complet</p>
                              <p className="font-medium text-gray-900">{enfantDetail.parent_prenom} {enfantDetail.parent_nom}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">Téléphone</p>
                              <p className="font-medium text-gray-900">{enfantDetail.parent_telephone || "Non renseigné"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">Profession</p>
                              <p className="font-medium text-gray-900">{enfantDetail.parent_profession || "Non renseigné"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-pink-800 mb-3 text-sm uppercase tracking-wide">Mère</h4>
                          {(() => {
                            let mereData: any = null;
                            try {
                              if (enfantDetail?.mere_info) {
                                mereData = typeof enfantDetail.mere_info === 'string'
                                  ? JSON.parse(enfantDetail.mere_info)
                                  : enfantDetail.mere_info;
                              }
                            } catch (e) { }
                            return mereData && (mereData.mereNom || mereData.merePrenom) ? (
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-gray-900">Nom complet</p>
                                  <p className="font-medium text-gray-900">{mereData.merePrenom || ""} {mereData.mereNom || ""}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-900">Téléphone</p>
                                  <p className="font-medium text-gray-900">{mereData.merePhone || "Non renseigné"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-900">Profession</p>
                                  <p className="font-medium text-gray-900">{mereData.mereProfession || "Non renseigné"}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-900 italic">Non renseigné</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informations enfant */}
                  <div>
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-green-600" /> Informations de l'enfant
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border">
                      <div>
                        <p className="text-sm text-gray-900">Nom complet</p>
                        <p className="font-medium text-gray-900">
                          {selectedEnfant.prenom} {selectedEnfant.nom}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Date de naissance</p>
                        <p className="font-medium text-gray-900">
                          {selectedEnfant.date_naissance ? new Date(selectedEnfant.date_naissance).toLocaleDateString() : "Non renseigné"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Lieu de naissance</p>
                        <p className="font-medium text-gray-900">{selectedEnfant.lieu_naissance ?? "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Sexe</p>
                        <p className="font-medium text-gray-900">{selectedEnfant.sexe === "M" ? "Masculin" : "Féminin"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Niveau</p>
                        <p className="font-medium text-gray-900">{selectedEnfant.niveau}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Classe</p>
                        <p className="font-medium text-gray-900">{selectedEnfant.classe_nom}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents téléchargés */}
                  <div>
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" /> Documents joints
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-2">
                          <File className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-black">Acte de naissance</span>
                        </div>
                        {enfantDetail?.acte_naissance_url ? (
                          <a
                            href={enfantDetail.acte_naissance_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                          >
                            Voir le document <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-gray-900 text-sm">Non téléchargé</p>
                        )}
                      </div>

                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-2">
                          <Image className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-black">Photo d'identité</span>
                        </div>
                        {(enfantDetail?.photo_url || selectedEnfant?.photo_url) ? (
                          <a
                            href={(enfantDetail?.photo_url || selectedEnfant?.photo_url) as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                          >
                            Voir la photo <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-gray-900 text-sm">Non téléchargée</p>
                        )}
                      </div>

                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-black">Bulletin scolaire</span>
                        </div>
                        {enfantDetail?.bulletin_url ? (
                          <a
                            href={enfantDetail.bulletin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                          >
                            Voir le bulletin <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-gray-900 text-sm">Non téléchargé</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Détail des frais */}
                  <div>
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      Détail des paiements
                    </h3>

                    {(() => {
                      const totalBrut = Number(
                        enfantDetail?.frais?.total_brut
                        ?? selectedEnfant?.details_frais?.total_brut
                        ?? 0
                      );

                      const totalNetActuel = Number(
                        enfantDetail?.frais?.total_net_actuel
                        ?? selectedEnfant?.details_frais?.total_net_actuel
                        ?? selectedEnfant?.details_frais?.total
                        ?? 0
                      );

                      const remiseEnfant = Number(
                        enfantDetail?.frais?.remise
                        ?? selectedEnfant?.details_frais?.remise
                        ?? 0
                      );

                      const netEnfant = Number(
                        enfantDetail?.frais?.net
                        ?? selectedEnfant?.details_frais?.net
                        ?? selectedEnfant?.details_frais?.total
                        ?? 0
                      );

                      const dejaPaye = Number(
                        enfantDetail?.frais?.total_paye
                        ?? selectedEnfant?.details_frais?.paye
                        ?? 0
                      );

                      const resteAPayer = Number(
                        enfantDetail?.frais?.solde_restant
                        ?? selectedEnfant?.details_frais?.reste
                        ?? 0
                      );

                      const totalAPayerAffiche = netEnfant || totalNetActuel;

                      return (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div>
                              <p className="text-xs text-gray-900 font-semibold">Total à payer</p>
                              <p className="font-bold text-gray-900 text-lg">{totalAPayerAffiche.toLocaleString()} GNF</p>
                              {remiseEnfant > 0 && (
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  Brut: {totalBrut.toLocaleString()} - Remise: {remiseEnfant.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">Déjà payé</p>
                              <p className="font-bold text-green-600">{dejaPaye.toLocaleString()} GNF</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">Reste à payer</p>
                              <p className={`font-bold ${resteAPayer > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {resteAPayer.toLocaleString()} GNF
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">Statut</p>
                              {resteAPayer === 0 ? (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                                  <CheckCircle className="w-3 h-3" /> Tout payé
                                </span>
                              ) : dejaPaye > 0 ? (
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                                  <Clock className="w-3 h-3" /> Partiel
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max">
                                  <XCircle className="w-3 h-3" /> Non payé
                                </span>
                              )}
                            </div>
                          </div>

                          {totalAPayerAffiche > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-900 mb-1">
                                <span>Progression des paiements</span>
                                <span>{Math.round((dejaPaye / totalAPayerAffiche) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, (dejaPaye / totalAPayerAffiche) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Bulletins scolaires */}
                  {enfantDetail?.bulletins && enfantDetail.bulletins.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Bulletins scolaires
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {enfantDetail.bulletins.map((bulletin: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{bulletin.titre || "Bulletin"}</h4>
                                {bulletin.trimestre && (
                                  <p className="text-xs text-gray-900">Trimestre {bulletin.trimestre}</p>
                                )}
                                <p className="text-xs text-gray-900 mt-1">
                                  {bulletin.date_publication ? new Date(bulletin.date_publication).toLocaleDateString() : "Date inconnue"}
                                </p>
                              </div>
                              {bulletin.fichier_url && (
                                <a
                                  href={bulletin.fichier_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                >
                                  <Download className="w-5 h-5 text-blue-600" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-900">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="font-semibold">Impossible de charger les détails</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Vérifiez que la pré-inscription appartient bien à votre compte.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-black border rounded-lg hover:bg-gray-100 bg-white transition">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT GLOBAL */}
      <PaiementGlobalModal
        isOpen={showGlobalPaiementModal}
        onClose={() => setShowGlobalPaiementModal(false)}
        onSuccess={() => {
          fetchEnfants();
        }}
        soldeRestant={statsGlobales.soldeRestant}
      />
    </div>
  );
}