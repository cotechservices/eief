// app/dashboard/comptable/paiements/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Plus,
  Download,
  Printer,
  Eye,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Send,
  User,
  GraduationCap,
  Calendar,
  Euro
} from "lucide-react";

interface Paiement {
  id: number;
  eleve: string;
  classe: string;
  parent: string;
  montant: number;
  type: string;
  date: string;
  mode: string;
  statut: "paye" | "en_attente" | "impaye";
  reference: string;
  description?: string;
}

export default function ComptablePaiementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const itemsPerPage = 10;

  // Données des paiements
  const paiements: Paiement[] = [
    { id: 1, eleve: "Ibrahim Diallo", classe: "5ème A", parent: "M. Diallo", montant: 150000, type: "mensualite", date: "2025-05-20", mode: "mobile_money", statut: "paye", reference: "TRX-001", description: "Paiement mensualité Mai" },
    { id: 2, eleve: "Aïssatou Souaré", classe: "3ème A", parent: "Mme Souaré", montant: 200000, type: "inscription", date: "2025-05-19", mode: "especes", statut: "paye", reference: "TRX-002", description: "Frais d'inscription 2025-2026" },
    { id: 3, eleve: "Mamadou Konaté", classe: "Terminale", parent: "M. Konaté", montant: 150000, type: "mensualite", date: "2025-05-18", mode: "carte", statut: "en_attente", reference: "TRX-003", description: "Paiement mensualité Mai" },
    { id: 4, eleve: "Fatoumata Barry", classe: "6ème A", parent: "Mme Barry", montant: 100000, type: "cantine", date: "2025-05-17", mode: "mobile_money", statut: "paye", reference: "TRX-004", description: "Cantine Mai" },
    { id: 5, eleve: "Mohamed Camara", classe: "4ème A", parent: "M. Camara", montant: 80000, type: "transport", date: "2025-05-16", mode: "especes", statut: "impaye", reference: "TRX-005", description: "Transport Mai" },
    { id: 6, eleve: "Aminata Diallo", classe: "2nd A", parent: "M. Diallo", montant: 150000, type: "mensualite", date: "2025-05-15", mode: "mobile_money", statut: "paye", reference: "TRX-006", description: "Paiement mensualité Mai" },
    { id: 7, eleve: "Ousmane Touré", classe: "1ère A", parent: "Mme Touré", montant: 50000, type: "bibliotheque", date: "2025-05-14", mode: "carte", statut: "en_attente", reference: "TRX-007", description: "Adhésion bibliothèque" },
    { id: 8, eleve: "Mariam Keita", classe: "5ème B", parent: "M. Keita", montant: 150000, type: "mensualite", date: "2025-05-13", mode: "mobile_money", statut: "paye", reference: "TRX-008", description: "Paiement mensualité Mai" },
    { id: 9, eleve: "Souleymane Sylla", classe: "3ème B", parent: "Mme Sylla", montant: 100000, type: "cantine", date: "2025-05-12", mode: "especes", statut: "impaye", reference: "TRX-009", description: "Cantine Mai" },
    { id: 10, eleve: "Aissatou Barry", classe: "6ème B", parent: "M. Barry", montant: 80000, type: "transport", date: "2025-05-11", mode: "mobile_money", statut: "paye", reference: "TRX-010", description: "Transport Mai" },
    { id: 11, eleve: "Mamadou Diallo", classe: "4ème B", parent: "Mme Diallo", montant: 200000, type: "inscription", date: "2025-05-10", mode: "carte", statut: "paye", reference: "TRX-011", description: "Frais d'inscription 2025-2026" },
    { id: 12, eleve: "Fatou Camara", classe: "Terminale", parent: "M. Camara", montant: 150000, type: "mensualite", date: "2025-05-09", mode: "mobile_money", statut: "impaye", reference: "TRX-012", description: "Paiement mensualité Mai" },
  ];

  // Statistiques
  const stats = {
    total: paiements.length,
    paye: paiements.filter(p => p.statut === "paye").length,
    enAttente: paiements.filter(p => p.statut === "en_attente").length,
    impaye: paiements.filter(p => p.statut === "impaye").length,
    montantTotal: paiements.reduce((acc, p) => acc + p.montant, 0),
    montantPaye: paiements.filter(p => p.statut === "paye").reduce((acc, p) => acc + p.montant, 0),
    montantImpaye: paiements.filter(p => p.statut === "impaye").reduce((acc, p) => acc + p.montant, 0),
  };

  const getStatutBadge = (statut: string) => {
    switch(statut) {
      case "paye":
        return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>;
      case "en_attente":
        return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>;
      case "impaye":
        return <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Impayé</span>;
      default:
        return <span>{statut}</span>;
    }
  };

  const getModeIcon = (mode: string) => {
    switch(mode) {
      case "mobile_money":
        return <Smartphone className="w-4 h-4 text-green-600" />;
      case "especes":
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case "carte":
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      mobile_money: "Mobile Money",
      especes: "Espèces",
      carte: "Carte bancaire",
    };
    return modes[mode] || mode;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      inscription: "Inscription",
      mensualite: "Mensualité",
      cantine: "Cantine",
      transport: "Transport",
      bibliotheque: "Bibliothèque",
    };
    return types[type] || type;
  };

  const filteredPaiements = paiements.filter(p => {
    const matchesSearch = p.eleve.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.statut === statusFilter;
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredPaiements.length / itemsPerPage);
  const paginatedPaiements = filteredPaiements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const headers = ["Date", "Élève", "Classe", "Parent", "Type", "Montant", "Mode", "Statut", "Référence"];
    const csvData = filteredPaiements.map(p => [
      p.date, p.eleve, p.classe, p.parent, getTypeLabel(p.type), p.montant, getModeLabel(p.mode), p.statut, p.reference
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paiements_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendRappel = (paiement: Paiement) => {
    alert(`Rappel envoyé à ${paiement.parent} pour le paiement de ${getTypeLabel(paiement.type)} de ${paiement.montant.toLocaleString()} GNF`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des paiements</h1>
          <p className="text-gray-500">Enregistrez et suivez tous les paiements</p>
        </div>
        <button 
          onClick={() => setShowPaymentModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau paiement
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Total paiements</p><p className="text-2xl font-bold text-blue-600">{stats.total}</p></div>
            <div className="bg-blue-100 p-3 rounded-lg"><FileText className="w-6 h-6 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Payés</p><p className="text-2xl font-bold text-green-600">{stats.paye}</p></div>
            <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          </div>
          <p className="text-xs text-green-600 mt-1">{stats.montantPaye.toLocaleString()} GNF</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">En attente</p><p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p></div>
            <div className="bg-yellow-100 p-3 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Impayés</p><p className="text-2xl font-bold text-red-600">{stats.impaye}</p></div>
            <div className="bg-red-100 p-3 rounded-lg"><AlertCircle className="w-6 h-6 text-red-600" /></div>
          </div>
          <p className="text-xs text-red-600 mt-1">{stats.montantImpaye.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par élève, parent ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="impaye">Impayé</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="inscription">Inscription</option>
            <option value="mensualite">Mensualité</option>
            <option value="cantine">Cantine</option>
            <option value="transport">Transport</option>
            <option value="bibliotheque">Bibliothèque</option>
          </select>
          <button 
            onClick={handleExport}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Élève / Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPaiements.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{paiement.date}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{paiement.eleve}</p>
                      <p className="text-xs text-gray-500">{paiement.classe}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{paiement.parent}</td>
                  <td className="px-6 py-4 text-right font-medium">{paiement.montant.toLocaleString()} GNF</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {getTypeLabel(paiement.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {getModeIcon(paiement.mode)}
                      <span className="text-sm">{getModeLabel(paiement.mode)}</span>
                    </div>
                   </td>
                  <td className="px-6 py-4">{getStatutBadge(paiement.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedPaiement(paiement); setShowDetailModal(true); }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Voir détail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSendRappel(paiement)}
                        className="text-orange-600 hover:text-orange-700"
                        title="Envoyer rappel"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-700"
                        title="Imprimer reçu"
                      >
                        <Printer className="w-4 h-4" />
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
              Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredPaiements.length)} sur {filteredPaiements.length} paiements
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                disabled={currentPage === 1} 
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                disabled={currentPage === totalPages} 
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détail paiement */}
      {showDetailModal && selectedPaiement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Détail du paiement</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Référence</span>
                <span className="font-mono text-sm">{selectedPaiement.reference}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Date</span>
                <span>{selectedPaiement.date}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Élève</span>
                <span className="font-medium">{selectedPaiement.eleve} ({selectedPaiement.classe})</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Parent</span>
                <span>{selectedPaiement.parent}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">{getTypeLabel(selectedPaiement.type)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Montant</span>
                <span className="text-lg font-bold text-blue-600">{selectedPaiement.montant.toLocaleString()} GNF</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Mode</span>
                <div className="flex items-center gap-1">
                  {getModeIcon(selectedPaiement.mode)}
                  <span>{getModeLabel(selectedPaiement.mode)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Statut</span>
                {getStatutBadge(selectedPaiement.statut)}
              </div>
              {selectedPaiement.description && (
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-500">Description</span>
                  <span className="text-sm">{selectedPaiement.description}</span>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Fermer
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Printer className="w-4 h-4" /> Imprimer reçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Nouveau paiement</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-900 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Élève *</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionner un élève</option>
                  <option>Ibrahim Diallo - 5ème A</option>
                  <option>Aïssatou Souaré - 3ème A</option>
                  <option>Mamadou Konaté - Terminale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de frais *</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Mensualité</option>
                  <option>Inscription</option>
                  <option>Cantine</option>
                  <option>Transport</option>
                  <option>Bibliothèque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Montant *</label>
                <input type="number" placeholder="0" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mode de paiement *</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Mobile Money</option>
                  <option>Espèces</option>
                  <option>Carte bancaire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Référence transaction</label>
                <input type="text" placeholder="TRX-XXX" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                Annuler
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Enregistrer le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}