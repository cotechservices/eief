"use client";

import { useState, useEffect } from "react";
import {
  Download, Search, Filter, Eye, Printer, ChevronLeft, ChevronRight,
  User, Calendar, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock
} from "lucide-react";

interface Salaire {
  personnel_id: number;
  employe: string;
  poste: string;
  salaire_base: number;
  statut: string;
  date_paiement: string | null;
}

export default function SalairesPage() {
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMois, setSelectedMois] = useState((new Date().getMonth() + 1).toString());
  const [selectedAnnee, setSelectedAnnee] = useState((new Date().getFullYear()).toString());

  const moisList = [
    { value: "1", label: "Janvier" }, { value: "2", label: "Février" },
    { value: "3", label: "Mars" }, { value: "4", label: "Avril" },
    { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" }, { value: "8", label: "Août" },
    { value: "9", label: "Septembre" }, { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
  ];

  const annees = ["2024", "2025", "2026"];

  const fetchSalaires = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/salaires?month=${selectedMois}&year=${selectedAnnee}`);
      if (res.ok) {
        const data = await res.json();
        setSalaires(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaires();
  }, [selectedMois, selectedAnnee]);

  const payerSalaire = async (personnel_id: number, montant: number) => {
    if (confirm("Confirmer le paiement de ce salaire pour le mois sélectionné ?")) {
      try {
        const res = await fetch('/api/admin/salaires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personnel_id, montant,
            mois: parseInt(selectedMois),
            annee: parseInt(selectedAnnee),
            mode_paiement: 'virement',
            reference_transaction: `SAL-${selectedAnnee}${selectedMois}-${personnel_id}`
          })
        });
        if (res.ok) {
          fetchSalaires();
        } else {
          const data = await res.json();
          alert(data.error || "Erreur de paiement");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const totalSalaires = salaires.reduce((acc, s) => acc + Number(s.salaire_base), 0);
  const totalPaye = salaires.filter(s => s.statut === "paye").reduce((acc, s) => acc + Number(s.salaire_base), 0);
  const totalEnAttente = totalSalaires - totalPaye;

  const getStatutBadge = (statut: string) => {
    if (statut === "paye") {
      return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>;
    }
    return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> Non payé</span>;
  };

  const filteredEmployes = salaires.filter(s =>
    s.employe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.poste?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des salaires</h1>
          <p className="text-gray-900">Paie du personnel</p>
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
        </div>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-90">Total masse salariale</p>
          <p className="text-3xl font-bold mt-2">{totalSalaires.toLocaleString()} GNF</p>
          <p className="text-xs mt-2">Pour {salaires.length} employés</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Déjà payé</p>
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
              <p className="text-gray-900 text-sm">Non payé</p>
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
                placeholder="Rechercher par nom ou poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des salaires */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-900">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Poste</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Salaire net</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployes.map((employe) => (
                  <tr key={employe.personnel_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{employe.employe}</td>
                    <td className="px-6 py-4 text-gray-900">{employe.poste}</td>
                    <td className="px-6 py-4 text-right font-bold">{Number(employe.salaire_base).toLocaleString()} GNF</td>
                    <td className="px-6 py-4">{getStatutBadge(employe.statut)}</td>
                    <td className="px-6 py-4 text-gray-900">{employe.date_paiement || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {employe.statut !== "paye" && (
                          <button onClick={() => payerSalaire(employe.personnel_id, employe.salaire_base)} className="text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 rounded">
                            Payer
                          </button>
                        )}
                        <button className="text-gray-900 hover:text-gray-900 p-1">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}