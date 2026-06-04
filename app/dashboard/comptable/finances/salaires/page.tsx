// app/dashboard/admin/finances/salaires/page.tsx
"use client";

import { useState } from "react";
import { 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function SalairesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMois, setSelectedMois] = useState("mai");
  const [selectedAnnee, setSelectedAnnee] = useState("2025");

  // Données simulées des employés
  const employes = [
    { id: 1, nom: "Camara", prenom: "Mohamed", poste: "Enseignant Mathématiques", salaireBase: 450000, prime: 50000, retenue: 25000, statut: "paye", datePaiement: "2025-05-10" },
    { id: 2, nom: "Diallo", prenom: "Aissatou", poste: "Enseignant Français", salaireBase: 450000, prime: 45000, retenue: 20000, statut: "paye", datePaiement: "2025-05-10" },
    { id: 3, nom: "Barry", prenom: "Fatoumata", poste: "Directrice des études", salaireBase: 800000, prime: 100000, retenue: 50000, statut: "paye", datePaiement: "2025-05-10" },
    { id: 4, nom: "Konaté", prenom: "Mamadou", poste: "Surveillant général", salaireBase: 350000, prime: 30000, retenue: 15000, statut: "en_attente", datePaiement: null },
    { id: 5, nom: "Souaré", prenom: "Aminata", poste: "Comptable", salaireBase: 500000, prime: 60000, retenue: 30000, statut: "paye", datePaiement: "2025-05-09" },
    { id: 6, nom: "Touré", prenom: "Ousmane", poste: "Chauffeur", salaireBase: 250000, prime: 20000, retenue: 10000, statut: "paye", datePaiement: "2025-05-08" },
    { id: 7, nom: "Keita", prenom: "Mariam", poste: "Infirmière", salaireBase: 300000, prime: 25000, retenue: 12000, statut: "en_attente", datePaiement: null },
  ];

  const moisList = [
    { value: "janvier", label: "Janvier" },
    { value: "fevrier", label: "Février" },
    { value: "mars", label: "Mars" },
    { value: "avril", label: "Avril" },
    { value: "mai", label: "Mai" },
    { value: "juin", label: "Juin" },
    { value: "juillet", label: "Juillet" },
    { value: "aout", label: "Août" },
    { value: "septembre", label: "Septembre" },
    { value: "octobre", label: "Octobre" },
    { value: "novembre", label: "Novembre" },
    { value: "decembre", label: "Décembre" },
  ];

  const annees = ["2024", "2025", "2026"];

  const totalSalaires = employes.reduce((acc, e) => acc + e.salaireBase + e.prime - e.retenue, 0);
  const totalPaye = employes.filter(e => e.statut === "paye").reduce((acc, e) => acc + e.salaireBase + e.prime - e.retenue, 0);
  const totalEnAttente = totalSalaires - totalPaye;

  const getStatutBadge = (statut: string) => {
    if (statut === "paye") {
      return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>;
    }
    return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>;
  };

  const filteredEmployes = employes.filter(e => 
    e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.poste.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des salaires</h1>
          <p className="text-gray-500">Paie du personnel</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedMois}
            onChange={(e) => setSelectedMois(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {moisList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={selectedAnnee}
            onChange={(e) => setSelectedAnnee(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-90">Total masse salariale</p>
          <p className="text-3xl font-bold mt-2">{totalSalaires.toLocaleString()} GNF</p>
          <p className="text-xs mt-2">Pour {employes.length} employés</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Déjà payé</p>
              <p className="text-2xl font-bold text-green-600">{totalPaye.toLocaleString()} GNF</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{totalEnAttente.toLocaleString()} GNF</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>
      </div>

      {/* Tableau des salaires */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Salaire base</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prime</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net à payer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployes.map((employe) => {
                const net = employe.salaireBase + employe.prime - employe.retenue;
                return (
                  <tr key={employe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{employe.prenom} {employe.nom}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{employe.poste}</td>
                    <td className="px-6 py-4 text-right">{employe.salaireBase.toLocaleString()} GNF</td>
                    <td className="px-6 py-4 text-right text-green-600">{employe.prime.toLocaleString()} GNF</td>
                    <td className="px-6 py-4 text-right text-red-600">-{employe.retenue.toLocaleString()} GNF</td>
                    <td className="px-6 py-4 text-right font-bold">{net.toLocaleString()} GNF</td>
                    <td className="px-6 py-4">{getStatutBadge(employe.statut)}</td>
                    <td className="px-6 py-4 text-gray-600">{employe.datePaiement || "-"}</td>
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
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-right font-bold">TOTAL</td>
                <td className="px-6 py-4 text-right">{employes.reduce((a,b) => a + b.salaireBase, 0).toLocaleString()} GNF</td>
                <td className="px-6 py-4 text-right">{employes.reduce((a,b) => a + b.prime, 0).toLocaleString()} GNF</td>
                <td className="px-6 py-4 text-right">{employes.reduce((a,b) => a + b.retenue, 0).toLocaleString()} GNF</td>
                <td className="px-6 py-4 text-right font-bold">{totalSalaires.toLocaleString()} GNF</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bouton générer bulletins */}
      <div className="flex justify-end">
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Générer les bulletins de salaire
        </button>
      </div>
    </div>
  );
}