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
  Download
} from "lucide-react";

interface DetailsFrais {
  inscription: number;
  cantine: number;
  transport: number;
  librairie: number;
  scolarite: number;
  total: number;
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

  const fetchEnfants = async () => {
    try {
      const response = await fetch("/api/parent/enfants");
      const data = await response.json();
      setEnfants(data);

      for (const enfant of data) {
        const statsResponse = await fetch(`/api/parent/enfants/${enfant.eleve_id}/stats`);
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
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnfantDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/parent/enfants/${id}`);
      if (!response.ok) {
        throw new Error("Erreur chargement détails");
      }
      const data = await response.json();
      setEnfantDetail(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenDetails = (enfant: Enfant) => {
    setSelectedEnfant(enfant);
    setShowDetailModal(true);
    loadEnfantDetail(enfant.eleve_id);
  };

  // STATISTIQUES GLOBALES SYNCHRONISÉES AVEC L'ACCUEIL
  const totalAPayerBrut = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.total) || 0), 0);
  const totalPaye = enfants.reduce((acc, e) => acc + (Number(e.details_frais?.paye) || 0), 0);
  const totalRemises = enfants.reduce((acc, e) => acc + (Number((e.details_frais as any)?.remise) || 0), 0);
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

      {/* ⭐ BANNIÈRE DE REMISE SI APPLICABLE */}
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
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900">Aucun enfant trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Matricule</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Enfant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Classe</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Frais</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Accès</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedEnfants.map((e) => {
                    const frais = e.details_frais;
                    const statusPaiement = frais.reste === 0 ? "paye" : frais.paye > 0 ? "partiel" : "non_paye";

                    return (
                      <tr key={e.id} className="hover:bg-gray-50 transition duration-150">
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
                          <Link
                            href={`/dashboard/parent/enfants/${e.eleve_id}`}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-xs font-semibold shadow-sm"
                            title="Accéder au tableau de bord de l'enfant"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Tableau de bord
                          </Link>
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
                <p className="text-sm text-gray-700">
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
                          className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
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
                <h2 className="text-xl font-bold text-black">Détail de l'élève</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-700 text-xl font-bold">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {enfantDetail?.eleve?.photo_url ? (
                    <img
                      src={enfantDetail.eleve.photo_url}
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
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3" /> Inscription active
                      </span>
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

              {/* Reste du modal... */}
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (enfantDetail || selectedEnfant) ? (
                <>
                  {/* Informations des parents */}
                  {enfantDetail?.eleve?.parent_email && (
                    <div>
                      <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-900" /> Informations des parents
                      </h3>
                      <div className="bg-gray-50 p-3 rounded-lg mb-4 border">
                        <p className="text-sm text-gray-900">Email de contact</p>
                        <p className="font-medium text-gray-900">{enfantDetail?.eleve?.parent_email}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-3 text-sm uppercase tracking-wide">Père</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-900">Nom complet</p>
                              <p className="font-medium text-gray-900">{enfantDetail?.eleve?.parent_prenom} {enfantDetail?.eleve?.parent_nom}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">Téléphone</p>
                              <p className="font-medium text-gray-900">{enfantDetail?.eleve?.parent_telephone || "Non renseigné"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">Profession</p>
                              <p className="font-medium text-gray-900">{enfantDetail?.eleve?.parent_profession || "Non renseigné"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-pink-800 mb-3 text-sm uppercase tracking-wide">Mère</h4>
                          {(() => {
                            let mereData: any = null;
                            try {
                              if (enfantDetail?.eleve?.mere_info) {
                                mereData = typeof enfantDetail.eleve.mere_info === 'string'
                                  ? JSON.parse(enfantDetail.eleve.mere_info)
                                  : enfantDetail.eleve.mere_info;
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
                        <p className="font-medium text-gray-900">{enfantDetail?.eleve?.prenom ?? selectedEnfant?.prenom} {enfantDetail?.eleve?.nom ?? selectedEnfant?.nom}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Date de naissance</p>
                        <p className="font-medium text-gray-900">
                          {(enfantDetail?.eleve?.date_naissance ?? selectedEnfant?.date_naissance) ? new Date(enfantDetail?.eleve?.date_naissance ?? selectedEnfant?.date_naissance ?? '').toLocaleDateString() : "Non renseigné"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Lieu de naissance</p>
                        <p className="font-medium text-gray-900">{enfantDetail?.eleve?.lieu_naissance ?? selectedEnfant?.lieu_naissance ?? "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Sexe</p>
                        <p className="font-medium text-gray-900">{(enfantDetail?.eleve?.sexe ?? selectedEnfant?.sexe) === "M" ? "Masculin" : "Féminin"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Niveau</p>
                        <p className="font-medium text-gray-900">{enfantDetail?.eleve?.niveau ?? selectedEnfant?.niveau}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Classe</p>
                        <p className="font-medium text-gray-900">{enfantDetail?.eleve?.classe_nom ?? selectedEnfant?.classe_nom}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents téléchargés */}
                  <div>
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" /> Documents joints
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Acte de naissance */}
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-2">
                          <File className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-black">Acte de naissance</span>
                        </div>
                        {enfantDetail?.eleve?.acte_naissance_url ? (
                          <a
                            href={enfantDetail.eleve.acte_naissance_url}
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

                      {/* Photo d'identité */}
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-2">
                          <Image className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-black">Photo d'identité</span>
                        </div>
                        {(enfantDetail?.eleve?.photo_url ?? selectedEnfant?.photo_url) ? (
                          <a
                            href={(enfantDetail?.eleve?.photo_url ?? selectedEnfant?.photo_url) as string}
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

                      {/* Bulletin scolaire */}
                      <div className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-black">Bulletin scolaire</span>
                        </div>
                        {enfantDetail?.eleve?.bulletin_url ? (
                          <a
                            href={enfantDetail.eleve.bulletin_url}
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
                      const inscription = enfantDetail?.frais?.inscription ?? selectedEnfant?.details_frais?.inscription ?? 0;
                      const cantine = enfantDetail?.frais?.cantine ?? selectedEnfant?.details_frais?.cantine ?? 0;
                      const transport = enfantDetail?.frais?.transport ?? selectedEnfant?.details_frais?.transport ?? 0;
                      const fournitures = enfantDetail?.frais?.fournitures ?? selectedEnfant?.details_frais?.librairie ?? 0;
                      const scolarite = enfantDetail?.frais?.scolarite ?? selectedEnfant?.details_frais?.scolarite ?? 0;
                      const totalAPayer = selectedEnfant?.details_frais?.total ?? enfantDetail?.frais?.total_a_payer ?? 0;
                      const dejaPaye = selectedEnfant?.details_frais?.paye ?? enfantDetail?.frais?.total_paye ?? 0;
                      const resteAPayer = selectedEnfant?.details_frais?.reste ?? enfantDetail?.frais?.solde_restant ?? 0;

                      return (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div>
                              <p className="text-xs text-gray-600 font-semibold">Total à payer</p>
                              <p className="font-bold text-gray-800 text-lg">{totalAPayer.toLocaleString()} GNF</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Déjà payé</p>
                              <p className="font-bold text-green-600">{dejaPaye.toLocaleString()} GNF</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Reste à payer</p>
                              <p className={`font-bold ${resteAPayer > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {resteAPayer.toLocaleString()} GNF
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Statut</p>
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

                          {totalAPayer > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progression des paiements</span>
                                <span>{Math.round((dejaPaye / totalAPayer) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, (dejaPaye / totalAPayer) * 100)}%` }}
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
                <div className="text-center py-12 text-gray-900">Une erreur est survenue lors du chargement des détails.</div>
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