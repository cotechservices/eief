// app/dashboard/admin/preinscriptions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
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
  Camera
} from "lucide-react";
import PaiementModal from "../../../components/PaiementModal";

interface Preinscription {
  id: number;
  numero_dossier: string;
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
  classe: string;
  statut: "en_attente" | "valide" | "rejete";
  date_preinscription: string;
  observations: string;
  frais_montant: number;
  frais_statut: string;
  frais_mode_paiement: string;
  acte_naissance_url: string | null;
  photo_url: string | null;
  bulletin_url: string | null;
}

export default function GestionPreinscriptionsPage() {
  const [preinscriptions, setPreinscriptions] = useState<Preinscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPreinscription, setSelectedPreinscription] = useState<Preinscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [observations, setObservations] = useState("");
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementPreinscription, setPaiementPreinscription] = useState<Preinscription | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchPreinscriptions();
  }, [selectedStatut]);

  const fetchPreinscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatut !== "all") params.append("statut", selectedStatut);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/preinscriptions?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setPreinscriptions(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPreinscriptions();
  };

  const handleUpdateStatut = async (id: number, statut: string) => {
    try {
      const response = await fetch("/api/admin/preinscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statut, observations }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchPreinscriptions();
        setShowDetailModal(false);
        alert(`Pré-inscription ${statut === "valide" ? "validée" : "rejetée"} avec succès`);
      } else {
        alert("Erreur: " + (data.error || "Une erreur est survenue"));
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette pré-inscription ?")) {
      try {
        const response = await fetch(`/api/admin/preinscriptions?id=${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchPreinscriptions();
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleOpenPaiement = (preinscription: Preinscription) => {
    setPaiementPreinscription(preinscription);
    setShowPaiementModal(true);
  };

  const handlePaiementSuccess = () => {
    fetchPreinscriptions();
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

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  const filteredPreinscriptions = preinscriptions.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.enfant_nom?.toLowerCase().includes(searchLower) ||
      p.enfant_prenom?.toLowerCase().includes(searchLower) ||
      p.numero_dossier?.toLowerCase().includes(searchLower) ||
      p.parent_nom?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredPreinscriptions.length / itemsPerPage);
  const paginatedPreinscriptions = filteredPreinscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des pré-inscriptions...</p>
        </div>
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
            onClick={fetchPreinscriptions}
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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des pré-inscriptions</h1>
          <p className="text-gray-500">Gérez les demandes d'inscription, les documents et les paiements</p>
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
            <div><p className="text-gray-500 text-sm">Total</p><p className="text-2xl font-bold text-blue-600">{preinscriptions.length}</p></div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">En attente</p><p className="text-2xl font-bold text-yellow-600">{preinscriptions.filter(p => p.statut === "en_attente").length}</p></div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Validées</p><p className="text-2xl font-bold text-green-600">{preinscriptions.filter(p => p.statut === "valide").length}</p></div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Rejetées</p><p className="text-2xl font-bold text-red-600">{preinscriptions.filter(p => p.statut === "rejete").length}</p></div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Paiements</p><p className="text-2xl font-bold text-purple-600">{preinscriptions.filter(p => p.frais_statut === "paye").length}</p></div>
            <Wallet className="w-8 h-8 text-purple-200" />
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
                placeholder="Rechercher par nom, prénom ou dossier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validées</option>
            <option value="rejete">Rejetées</option>
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Rechercher
          </button>
        </div>
      </div>

      {/* Tableau */}
      {filteredPreinscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune pré-inscription trouvée</p>
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
                {paginatedPreinscriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4"><span className="font-mono text-sm text-blue-600">{p.numero_dossier}</span></td>
                    <td className="px-4 py-4">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt="photo" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Camera className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4"><span className="font-medium">{p.enfant_prenom} {p.enfant_nom}</span><p className="text-xs text-gray-500">{p.sexe === "M" ? "Garçon" : "Fille"} - {new Date(p.date_naissance).toLocaleDateString()}</p></td>
                    <td className="px-4 py-4"><p className="text-sm">{p.parent_prenom} {p.parent_nom}</p><p className="text-xs text-gray-500">{p.parent_email}</p></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-1"><GraduationCap className="w-4 h-4 text-gray-400" /><span>{p.classe}</span></div></td>
                    <td className="px-4 py-4">{getFraisBadge(p.frais_statut)}</td>
                    <td className="px-4 py-4">{getStatutBadge(p.statut)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {p.frais_statut !== "paye" && (
                          <button onClick={() => handleOpenPaiement(p)} className="text-purple-600 hover:text-purple-700" title="Enregistrer paiement"><CreditCard className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => { setSelectedPreinscription(p); setObservations(p.observations || ""); setShowDetailModal(true); }} className="text-blue-600 hover:text-blue-700" title="Voir détails"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700" title="Supprimer"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredPreinscriptions.length)} sur {filteredPreinscriptions.length}</p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Détail avec affichage des documents */}
      {showDetailModal && selectedPreinscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Détail de la pré-inscription</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* En-tête avec photo */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="flex-shrink-0">
                  {selectedPreinscription.photo_url ? (
                    <img src={selectedPreinscription.photo_url} alt="Photo" className="w-32 h-32 rounded-lg object-cover shadow-md" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-500">Numéro de dossier</p>
                    <p className="font-mono text-xl font-bold text-blue-600">{selectedPreinscription.numero_dossier}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Statut dossier</p>
                      {getStatutBadge(selectedPreinscription.statut)}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Paiement</p>
                      {getFraisBadge(selectedPreinscription.frais_statut)}
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
                  <div><p className="text-sm text-gray-500">Nom complet</p><p className="font-medium">{selectedPreinscription.parent_prenom} {selectedPreinscription.parent_nom}</p></div>
                  <div><p className="text-sm text-gray-500">Email</p><p>{selectedPreinscription.parent_email}</p></div>
                  <div><p className="text-sm text-gray-500">Téléphone</p><p>{selectedPreinscription.parent_telephone}</p></div>
                </div>
              </div>

              {/* Informations enfant */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Informations de l'enfant
                </h3>
                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-sm text-gray-500">Nom complet</p><p className="font-medium">{selectedPreinscription.enfant_prenom} {selectedPreinscription.enfant_nom}</p></div>
                  <div><p className="text-sm text-gray-500">Date de naissance</p><p>{new Date(selectedPreinscription.date_naissance).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-gray-500">Lieu de naissance</p><p>{selectedPreinscription.lieu_naissance || "Non renseigné"}</p></div>
                  <div><p className="text-sm text-gray-500">Sexe</p><p>{selectedPreinscription.sexe === "M" ? "Masculin" : "Féminin"}</p></div>
                  <div><p className="text-sm text-gray-500">Niveau</p><p>{selectedPreinscription.niveau}</p></div>
                  <div><p className="text-sm text-gray-500">Classe souhaitée</p><p>{selectedPreinscription.classe}</p></div>
                </div>
              </div>

              {/* Documents téléchargés */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Documents joints
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Acte de naissance */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <File className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Acte de naissance</span>
                    </div>
                    {selectedPreinscription.acte_naissance_url ? (
                      <a href={selectedPreinscription.acte_naissance_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        Voir le document <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-400 text-sm">Non téléchargé</p>
                    )}
                  </div>

                  {/* Photo d'identité */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Photo d'identité</span>
                    </div>
                    {selectedPreinscription.photo_url ? (
                      <a href={selectedPreinscription.photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        Voir la photo <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-400 text-sm">Non téléchargée</p>
                    )}
                  </div>

                  {/* Bulletin */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Bulletin scolaire</span>
                    </div>
                    {selectedPreinscription.bulletin_url ? (
                      <a href={selectedPreinscription.bulletin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        Voir le bulletin <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-gray-400 text-sm">Non téléchargé</p>
                    )}
                  </div>
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
                  <div><p className="text-sm text-gray-500">Statut paiement</p>{getFraisBadge(selectedPreinscription.frais_statut)}</div>
                  {selectedPreinscription.frais_mode_paiement && (
                    <div><p className="text-sm text-gray-500">Mode de paiement</p><p className="capitalize">{selectedPreinscription.frais_mode_paiement.replace("_", " ")}</p></div>
                  )}
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-gray-700 mb-2">Observations</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ajouter une observation..."
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              {selectedPreinscription.statut === "en_attente" && (
                <>
                  <button onClick={() => handleUpdateStatut(selectedPreinscription.id, "rejete")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Rejeter
                  </button>
                  {selectedPreinscription.frais_statut === "paye" ? (
                    <button onClick={() => handleUpdateStatut(selectedPreinscription.id, "valide")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Valider l'inscription
                    </button>
                  ) : (
                    <button onClick={() => { setShowDetailModal(false); handleOpenPaiement(selectedPreinscription); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      Enregistrer le paiement
                    </button>
                  )}
                </>
              )}
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaiementModal && paiementPreinscription && (
        <PaiementModal
          isOpen={showPaiementModal}
          onClose={() => setShowPaiementModal(false)}
          onSuccess={handlePaiementSuccess}
          preinscriptionId={paiementPreinscription.id}
          enfantNom={`${paiementPreinscription.enfant_prenom} ${paiementPreinscription.enfant_nom}`}
          montantFrais={500000}
        />
      )}
    </div>
  );
}