"use client";

import { useState, useEffect } from "react";
import {
  Search, Filter, Plus, Download, Printer, Eye, CreditCard,
  Smartphone, Wallet, CheckCircle, Clock, AlertCircle, ChevronLeft,
  ChevronRight, X, FileText, Send
} from "lucide-react";

interface Paiement {
  id: number;
  eleve: string;
  classe: string;
  matricule: string;
  montant: number;
  type: string;
  date: string;
  mode: string;
  statut: "paye" | "en_attente" | "impaye";
  reference: string;
}

export default function ComptablePaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const itemsPerPage = 10;

  const fetchPaiements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/paiements');
      if (res.ok) {
        const data = await res.json();
        setPaiements(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaiements();
  }, []);

  const stats = {
    total: paiements.length,
    paye: paiements.filter(p => p.statut === "paye").length,
    enAttente: paiements.filter(p => p.statut === "en_attente").length,
    impaye: paiements.filter(p => p.statut === "impaye").length,
    montantTotal: paiements.reduce((acc, p) => acc + Number(p.montant), 0),
    montantPaye: paiements.filter(p => p.statut === "paye").reduce((acc, p) => acc + Number(p.montant), 0),
    montantImpaye: paiements.filter(p => p.statut === "impaye").reduce((acc, p) => acc + Number(p.montant), 0),
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "paye": return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>;
      case "en_attente": return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>;
      case "impaye": return <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Impayé</span>;
      default: return <span>{statut}</span>;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "mobile_money": return <Smartphone className="w-4 h-4 text-green-600" />;
      case "especes": return <Wallet className="w-4 h-4 text-blue-600" />;
      case "carte": return <CreditCard className="w-4 h-4 text-purple-600" />;
      default: return null;
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
    const matchesSearch = p.eleve?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.statut === statusFilter;
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredPaiements.length / itemsPerPage) || 1;
  const paginatedPaiements = filteredPaiements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const validerPaiement = async (id: number) => {
    if (confirm("Valider ce paiement ?")) {
      try {
        await fetch('/api/admin/paiements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, statut: 'paye' })
        });
        fetchPaiements();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des paiements</h1>
          <p className="text-gray-900">Valider et suivre tous les paiements des élèves</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Total paiements</p><p className="text-2xl font-bold text-blue-600">{stats.total}</p></div>
            <div className="bg-blue-100 p-3 rounded-lg"><FileText className="w-6 h-6 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Payés</p><p className="text-2xl font-bold text-green-600">{stats.paye}</p></div>
            <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          </div>
          <p className="text-xs text-green-600 mt-1">{stats.montantPaye.toLocaleString()} GNF</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">En attente</p><p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p></div>
            <div className="bg-yellow-100 p-3 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Impayés</p><p className="text-2xl font-bold text-red-600">{stats.impaye}</p></div>
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
              <input type="text" placeholder="Rechercher par élève ou référence..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">Tous les statuts</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="impaye">Impayé</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">Tous les types</option>
            <option value="inscription">Inscription</option>
            <option value="mensualite">Mensualité</option>
            <option value="cantine">Cantine</option>
            <option value="transport">Transport</option>
          </select>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Élève / Classe</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPaiements.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{paiement.date}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{paiement.eleve}</p>
                      <p className="text-xs text-gray-900">{paiement.classe}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{Number(paiement.montant).toLocaleString()} GNF</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded-full">
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
                      <button onClick={() => { setSelectedPaiement(paiement); setShowDetailModal(true); }} className="text-blue-600 hover:text-blue-700"><Eye className="w-4 h-4" /></button>
                      {paiement.statut !== "paye" && (
                        <button onClick={() => validerPaiement(paiement.id)} className="text-green-600 hover:text-green-700"><CheckCircle className="w-4 h-4" /></button>
                      )}
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
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détail paiement */}
      {showDetailModal && selectedPaiement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Détail du paiement</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-900">Référence</span>
                <span className="font-mono text-sm">{selectedPaiement.reference}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-900">Élève</span>
                <span className="font-medium">{selectedPaiement.eleve} ({selectedPaiement.classe})</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-900">Montant</span>
                <span className="text-lg font-bold text-blue-600">{Number(selectedPaiement.montant).toLocaleString()} GNF</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-900">Mode</span>
                <div className="flex items-center gap-1">
                  {getModeIcon(selectedPaiement.mode)}
                  <span>{getModeLabel(selectedPaiement.mode)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}