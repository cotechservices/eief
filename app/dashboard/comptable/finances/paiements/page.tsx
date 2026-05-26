// app/dashboard/admin/finances/paiements/page.tsx
"use client";

import { useState } from "react";
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
  ChevronRight
} from "lucide-react";

export default function PaiementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Données simulées
  const paiements = [
    { id: 1, eleve: "Ibrahim Diallo", classe: "5ème A", parent: "M. Diallo", montant: 150000, type: "mensualite", date: "2025-05-20", mode: "mobile_money", statut: "paye", reference: "TRX-001" },
    { id: 2, eleve: "Aïssatou Souaré", classe: "3ème A", parent: "Mme Souaré", montant: 200000, type: "inscription", date: "2025-05-19", mode: "especes", statut: "paye", reference: "TRX-002" },
    { id: 3, eleve: "Mamadou Konaté", classe: "Terminale", parent: "M. Konaté", montant: 150000, type: "mensualite", date: "2025-05-18", mode: "carte", statut: "attente", reference: "TRX-003" },
    { id: 4, eleve: "Fatoumata Barry", classe: "6ème A", parent: "Mme Barry", montant: 100000, type: "cantine", date: "2025-05-17", mode: "mobile_money", statut: "paye", reference: "TRX-004" },
    { id: 5, eleve: "Mohamed Camara", classe: "4ème A", parent: "M. Camara", montant: 80000, type: "transport", date: "2025-05-16", mode: "especes", statut: "impaye", reference: "TRX-005" },
    { id: 6, eleve: "Aminata Diallo", classe: "2nd A", parent: "M. Diallo", montant: 150000, type: "mensualite", date: "2025-05-15", mode: "mobile_money", statut: "paye", reference: "TRX-006" },
    { id: 7, eleve: "Ousmane Touré", classe: "1ère A", parent: "Mme Touré", montant: 50000, type: "bibliotheque", date: "2025-05-14", mode: "carte", statut: "attente", reference: "TRX-007" },
  ];

  const getStatutBadge = (statut: string) => {
    switch(statut) {
      case 'paye':
        return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>;
      case 'attente':
        return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>;
      case 'impaye':
        return <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Impayé</span>;
      default:
        return <span>{statut}</span>;
    }
  };

  const getModeIcon = (mode: string) => {
    switch(mode) {
      case 'mobile_money':
        return <Smartphone className="w-4 h-4 text-green-600" />;
      case 'especes':
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case 'carte':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des paiements</h1>
          <p className="text-gray-500">Enregistrez et suivez tous les paiements</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau paiement
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            <option value="attente">En attente</option>
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
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Plus de filtres
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Élève</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paiements.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{paiement.eleve}</td>
                  <td className="px-6 py-4 text-gray-600">{paiement.classe}</td>
                  <td className="px-6 py-4 text-gray-600">{paiement.parent}</td>
                  <td className="px-6 py-4 font-medium">{paiement.montant.toLocaleString()} GNF</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {getTypeLabel(paiement.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{paiement.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {getModeIcon(paiement.mode)}
                      <span className="text-sm">{paiement.mode === 'mobile_money' ? 'Mobile Money' : paiement.mode === 'especes' ? 'Espèces' : 'Carte'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatutBadge(paiement.statut)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700">
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
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">Affichage 1-7 sur 45 paiements</p>
          <div className="flex gap-2">
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">1</button>
            <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">2</button>
            <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">3</button>
            <button className="p-2 border rounded-lg hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}