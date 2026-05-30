// app/dashboard/admin/eleves/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  GraduationCap,
  CreditCard,
  Wallet,
  Image,
  File,
  ExternalLink,
  Camera,
  Loader2
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
}

export default function GestionElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClasse, setSelectedClasse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEleves();
  }, []);

  const fetchEleves = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/eleves");
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setEleves(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEleves();
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
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  // Extraire les classes uniques pour le filtre
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
  const paginatedEleves = filteredByClasse.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Erreur: {error}</p>
          <button 
            onClick={fetchEleves}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des élèves inscrits</h1>
          <p className="text-gray-500">Liste de tous les élèves inscrits dans l'école</p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter Excel
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total inscrits</p><p className="text-2xl font-bold text-blue-600">{eleves.length}</p></div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Garçons</p><p className="text-2xl font-bold text-blue-600">{eleves.filter(e => e.sexe === "M").length}</p></div>
            <User className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Filles</p><p className="text-2xl font-bold text-pink-600">{eleves.filter(e => e.sexe === "F").length}</p></div>
            <User className="w-8 h-8 text-pink-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Classes</p><p className="text-2xl font-bold text-purple-600">{classes.length - 1}</p></div>
            <GraduationCap className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Frais payés</p><p className="text-2xl font-bold text-green-600">{eleves.filter(e => e.frais_statut === "paye").length}</p></div>
            <Wallet className="w-8 h-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, matricule ou dossier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {classes.map(c => (
              <option key={c} value={c}>{c === "all" ? "Toutes les classes" : c}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Rechercher
          </button>
        </div>
      </div>

      {/* Tableau */}
      {filteredByClasse.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun élève trouvé</p>
        </div>
      ) : (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frais</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEleves.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-blue-600">{e.numero_dossier || e.matricule}</span>
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
                      <span className="font-medium">{e.enfant_prenom} {e.enfant_nom}</span>
                      <p className="text-xs text-gray-500">{e.sexe === "M" ? "Garçon" : "Fille"} - {new Date(e.date_naissance).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">Matricule: {e.matricule}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm">{e.parent_prenom} {e.parent_nom}</p>
                      <p className="text-xs text-gray-500">{e.parent_email}</p>
                      <p className="text-xs text-gray-400">{e.parent_telephone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span>{e.classe_nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{getFraisBadge(e.frais_statut)}</td>
                    <td className="px-4 py-4">{getStatutBadge(e.statut)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedEleve(e); setShowDetailModal(true); }} 
                          className="text-blue-600 hover:text-blue-700" 
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredByClasse.length)} sur {filteredByClasse.length} élèves
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Détail */}
      {showDetailModal && selectedEleve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Fiche élève</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {selectedEleve.photo_url ? (
                    <img src={selectedEleve.photo_url} alt="Photo" className="w-32 h-32 rounded-lg object-cover shadow-md" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-500">Matricule</p>
                    <p className="font-mono text-xl font-bold text-blue-600">{selectedEleve.matricule}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Statut</p>
                      {getStatutBadge(selectedEleve.statut)}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Paiement</p>
                      {getFraisBadge(selectedEleve.frais_statut)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations parent */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informations du parent
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-sm text-gray-500">Nom complet</p><p className="font-medium">{selectedEleve.parent_prenom} {selectedEleve.parent_nom}</p></div>
                  <div><p className="text-sm text-gray-500">Email</p><p>{selectedEleve.parent_email}</p></div>
                  <div><p className="text-sm text-gray-500">Téléphone</p><p>{selectedEleve.parent_telephone}</p></div>
                </div>
              </div>

              {/* Informations enfant */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Informations de l'enfant
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-sm text-gray-500">Nom complet</p><p className="font-medium">{selectedEleve.enfant_prenom} {selectedEleve.enfant_nom}</p></div>
                  <div><p className="text-sm text-gray-500">Date de naissance</p><p>{new Date(selectedEleve.date_naissance).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-gray-500">Lieu de naissance</p><p>{selectedEleve.lieu_naissance || "Non renseigné"}</p></div>
                  <div><p className="text-sm text-gray-500">Sexe</p><p>{selectedEleve.sexe === "M" ? "Masculin" : "Féminin"}</p></div>
                  <div><p className="text-sm text-gray-500">Niveau</p><p>{selectedEleve.niveau}</p></div>
                  <div><p className="text-sm text-gray-500">Classe</p><p>{selectedEleve.classe_nom}</p></div>
                </div>
              </div>

              {/* Paiement */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Informations de paiement
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-sm text-gray-500">Montant des frais</p><p className="font-bold text-lg">500 000 GNF</p></div>
                  <div><p className="text-sm text-gray-500">Statut paiement</p>{getFraisBadge(selectedEleve.frais_statut)}</div>
                  {selectedEleve.frais_mode_paiement && (
                    <div><p className="text-sm text-gray-500">Mode de paiement</p><p className="capitalize">{selectedEleve.frais_mode_paiement.replace("_", " ")}</p></div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}