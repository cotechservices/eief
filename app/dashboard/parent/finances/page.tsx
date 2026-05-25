// app/dashboard/parent/finances/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  Download, 
  Eye, 
  Printer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText
} from "lucide-react";

interface Paiement {
  id: number;
  date: string;
  description: string;
  montant: number;
  type: "inscription" | "mensualite" | "cantine" | "transport" | "bibliotheque";
  statut: "paye" | "en_attente" | "impaye";
  mode: "mobile_money" | "especes" | "carte";
  reference: string;
}

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
}

export default function ParentFinancesPage() {
  const [selectedEnfant, setSelectedEnfant] = useState<number>(1);
  const [periode, setPeriode] = useState("mois");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Liste des enfants
  const enfants: Enfant[] = [
    { id: 1, nom: "Diallo", prenom: "Ibrahim", classe: "5ème A" },
    { id: 2, nom: "Diallo", prenom: "Aïssatou", classe: "3ème A" },
    { id: 3, nom: "Diallo", prenom: "Mamadou", classe: "6ème A" },
  ];

  // Données des paiements par enfant
  const paiementsParEnfant: Record<number, Paiement[]> = {
    1: [
      { id: 1, date: "2025-05-10", description: "Inscription 2025-2026", montant: 300000, type: "inscription", statut: "paye", mode: "mobile_money", reference: "TRX-001" },
      { id: 2, date: "2025-05-10", description: "Mensualité Mai", montant: 150000, type: "mensualite", statut: "paye", mode: "mobile_money", reference: "TRX-002" },
      { id: 3, date: "2025-04-10", description: "Mensualité Avril", montant: 150000, type: "mensualite", statut: "paye", mode: "mobile_money", reference: "TRX-003" },
      { id: 4, date: "2025-03-10", description: "Mensualité Mars", montant: 150000, type: "mensualite", statut: "paye", mode: "especes", reference: "TRX-004" },
      { id: 5, date: "2025-05-01", description: "Cantine Mai", montant: 100000, type: "cantine", statut: "en_attente", mode: "carte", reference: "TRX-005" },
    ],
    2: [
      { id: 1, date: "2025-05-10", description: "Inscription 2025-2026", montant: 300000, type: "inscription", statut: "paye", mode: "mobile_money", reference: "TRX-001" },
      { id: 2, date: "2025-05-10", description: "Mensualité Mai", montant: 150000, type: "mensualite", statut: "paye", mode: "mobile_money", reference: "TRX-002" },
    ],
    3: [
      { id: 1, date: "2025-05-10", description: "Inscription 2025-2026", montant: 300000, type: "inscription", statut: "paye", mode: "mobile_money", reference: "TRX-001" },
      { id: 2, date: "2025-05-10", description: "Mensualité Mai", montant: 150000, type: "mensualite", statut: "impaye", mode: "mobile_money", reference: "TRX-002" },
      { id: 3, date: "2025-04-10", description: "Mensualité Avril", montant: 150000, type: "mensualite", statut: "impaye", mode: "mobile_money", reference: "TRX-003" },
      { id: 4, date: "2025-05-01", description: "Transport Mai", montant: 80000, type: "transport", statut: "impaye", mode: "especes", reference: "TRX-004" },
    ],
  };

  const paiements = paiementsParEnfant[selectedEnfant] || [];
  const enfant = enfants.find(e => e.id === selectedEnfant);

  // Calcul des totaux
  const totalDu = paiements.reduce((acc, p) => acc + p.montant, 0);
  const totalPaye = paiements.filter(p => p.statut === "paye").reduce((acc, p) => acc + p.montant, 0);
  const totalEnAttente = paiements.filter(p => p.statut === "en_attente").reduce((acc, p) => acc + p.montant, 0);
  const totalImpaye = paiements.filter(p => p.statut === "impaye").reduce((acc, p) => acc + p.montant, 0);
  const tauxRecouvrement = totalDu > 0 ? (totalPaye / totalDu) * 100 : 0;

  // Pagination
  const totalPages = Math.ceil(paiements.length / itemsPerPage);
  const paginatedPaiements = paiements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Finances</h1>
        <p className="text-gray-500">Gérez les paiements de vos enfants</p>
      </div>

      {/* Sélection de l'enfant */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        {enfants.map((enfant) => (
          <button
            key={enfant.id}
            onClick={() => { setSelectedEnfant(enfant.id); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg transition ${
              selectedEnfant === enfant.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {enfant.prenom} {enfant.nom} - {enfant.classe}
          </button>
        ))}
      </div>

      {enfant && (
        <>
          {/* Cartes récapitulatives */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <p className="text-sm opacity-90">Total dû</p>
              <p className="text-2xl font-bold">{totalDu.toLocaleString()} GNF</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-sm">Déjà payé</p><p className="text-2xl font-bold text-green-600">{totalPaye.toLocaleString()} GNF</p></div>
                <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-sm">En attente</p><p className="text-2xl font-bold text-yellow-600">{totalEnAttente.toLocaleString()} GNF</p></div>
                <div className="bg-yellow-100 p-3 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-sm">Impayé</p><p className="text-2xl font-bold text-red-600">{totalImpaye.toLocaleString()} GNF</p></div>
                <div className="bg-red-100 p-3 rounded-lg"><AlertCircle className="w-6 h-6 text-red-600" /></div>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progression des paiements</span>
              <span className="font-medium">{tauxRecouvrement.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${tauxRecouvrement}%` }}></div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> Effectuer un paiement
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Exporter
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mois">Ce mois</option>
              <option value="trimestre">Ce trimestre</option>
              <option value="annee">Cette année</option>
            </select>
          </div>

          {/* Historique des paiements */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Historique des paiements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPaiements.map((paiement) => (
                    <tr key={paiement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{new Date(paiement.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{getTypeLabel(paiement.type)}</p>
                        <p className="text-xs text-gray-500">{paiement.description}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{paiement.montant.toLocaleString()} GNF</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {getModeIcon(paiement.mode)}
                          <span className="text-sm">{getModeLabel(paiement.mode)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatutBadge(paiement.statut)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-700"><Eye className="w-4 h-4" /></button>
                          <button className="text-gray-600 hover:text-gray-700"><Printer className="w-4 h-4" /></button>
                          <button className="text-green-600 hover:text-green-700"><Download className="w-4 h-4" /></button>
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
                <p className="text-sm text-gray-500">{paiements.length} paiements</p>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>

          {/* Échéancier */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Prochains échéances</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div><p className="font-medium">Mensualité Juin 2025</p><p className="text-sm text-gray-500">Échéance: 10/06/2025</p></div>
                  <div className="text-right"><p className="text-lg font-bold text-orange-600">150 000 GNF</p><button className="mt-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg">Payer maintenant</button></div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div><p className="font-medium">Cantine Juin 2025</p><p className="text-sm text-gray-500">Échéance: 01/06/2025</p></div>
                  <div className="text-right"><p className="text-lg font-bold text-gray-600">100 000 GNF</p><button className="mt-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg">Payer maintenant</button></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}