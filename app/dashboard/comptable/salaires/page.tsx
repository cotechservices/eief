// app/dashboard/comptable/salaires/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  Clock,
  X,
  Plus,
  Trash
} from "lucide-react";

export default function SalairesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMois, setSelectedMois] = useState("mai");
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear().toString());
  const [employes, setEmployes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from DB
  const fetchSalaires = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/comptable/salaires?mois=${selectedMois}&annee=${selectedAnnee}`);
      if (!res.ok) throw new Error("Erreur de récupération des données");
      const data = await res.json();
      setEmployes(data);
    } catch (error) {
      console.error(error);
      alert("Erreur lors du chargement des salaires");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaires();
  }, [selectedMois, selectedAnnee]);

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

  const annees = ["2024", "2025", "2026", "2027"];

  const totalSalaires = employes.reduce((acc, e) => acc + (Number(e.salaireBase) || 0), 0);
  const totalPaye = employes.filter(e => e.statut === "paye").reduce((acc, e) => acc + (Number(e.salaireBase) || 0), 0);
  const totalEnAttente = totalSalaires - totalPaye;

  const getStatutBadge = (statut: string) => {
    if (statut === "paye" || statut === "valide") {
      return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Payé</span>;
    }
    return <span className="text-yellow-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>;
  };

  const filteredEmployes = employes.filter(e =>
    e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.poste.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- MODAL & PDF LOGIC ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpForPdf, setSelectedEmpForPdf] = useState<any>(null);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const openPdfModal = (emp: any) => {
    setSelectedEmpForPdf(emp);
    setDeductions([]); 
    setIsModalOpen(true);
  };

  const addDeduction = () => {
    setDeductions([...deductions, { date: new Date().toISOString().split('T')[0], type: 'Avance', motif: '', montant: 0 }]);
  };

  const updateDeduction = (index: number, field: string, value: any) => {
    const newDeds = [...deductions];
    newDeds[index][field] = value;
    setDeductions(newDeds);
  };

  const removeDeduction = (index: number) => {
    const newDeds = [...deductions];
    newDeds.splice(index, 1);
    setDeductions(newDeds);
  };

  const generateAndDownloadPdf = async () => {
    if (!selectedEmpForPdf) return;
    setIsGenerating(true);
    try {
      const payload = {
        periode: `${moisList.find(m => m.value === selectedMois)?.label} ${selectedAnnee}`,
        employe: {
          nom: selectedEmpForPdf.nom,
          prenom: selectedEmpForPdf.prenom,
          poste: selectedEmpForPdf.poste,
          groupePedagogique: selectedEmpForPdf.groupePedagogique || "",
        },
        salaireBrut: Number(selectedEmpForPdf.salaireBase) || 0,
        deductions: deductions.map(d => ({ ...d, montant: Number(d.montant) })),
        dateEmission: new Date().toLocaleDateString('fr-FR'),
        directeurNom: "TAMBA SOSSO DEMBADOUNO", 
      };

      const response = await fetch('/api/comptable/salaires/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erreur de génération");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bulletin_${selectedEmpForPdf.nom}_${selectedMois}_${selectedAnnee}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 relative">
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
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {moisList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={selectedAnnee}
            onChange={(e) => setSelectedAnnee(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-sm">
          <p className="text-sm opacity-90">Total masse salariale</p>
          <p className="text-3xl font-bold mt-2">{totalSalaires.toLocaleString()} GNF</p>
          <p className="text-xs mt-2">Pour {employes.length} employés</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
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
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{totalEnAttente.toLocaleString()} GNF</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm p-4 border">
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Poste</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Salaire base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployes.map((employe) => {
                  return (
                    <tr key={employe.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{employe.prenom} {employe.nom}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 capitalize">{employe.poste.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-right">{(Number(employe.salaireBase) || 0).toLocaleString()} GNF</td>
                      <td className="px-6 py-4">{getStatutBadge(employe.statut)}</td>
                      <td className="px-6 py-4 text-gray-900">{employe.datePaiement ? new Date(employe.datePaiement).toLocaleDateString('fr-FR') : "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openPdfModal(employe)}
                            className="text-gray-900 hover:text-gray-900"
                            title="Générer le bulletin de paie"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucun employé trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal for Bulletin Generation */}
      {isModalOpen && selectedEmpForPdf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Générer Bulletin: {selectedEmpForPdf.prenom} {selectedEmpForPdf.nom}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 hover:text-gray-700 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Période</p>
                    <p className="font-semibold text-gray-900 capitalize bg-white px-3 py-2 rounded-lg border border-blue-100 inline-block shadow-sm">
                      {moisList.find(m => m.value === selectedMois)?.label} {selectedAnnee}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Salaire de Base</p>
                    <p className="font-semibold text-gray-900 bg-white px-3 py-2 rounded-lg border border-blue-100 inline-block shadow-sm">
                      {(Number(selectedEmpForPdf.salaireBase) || 0).toLocaleString()} GNF
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Déductions / Avances / Bons</h3>
                  <button 
                    onClick={addDeduction}
                    className="flex items-center gap-1.5 text-sm font-medium bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>
                
                {deductions.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                    <CreditCard className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">Aucune déduction ajoutée</p>
                    <p className="text-gray-400 text-sm mt-1">Cliquez sur Ajouter pour inclure des avances ou bons</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deductions.map((ded, index) => (
                      <div key={index} className="flex gap-3 items-start bg-white p-4 rounded-xl border shadow-sm relative group hover:border-blue-300 transition-colors">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</label>
                          <input 
                            type="date" 
                            value={ded.date} 
                            onChange={e => updateDeduction(index, 'date', e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 border transition-all"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</label>
                          <select 
                            value={ded.type} 
                            onChange={e => updateDeduction(index, 'type', e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 border bg-white transition-all"
                          >
                            <option value="Avance">Avance</option>
                            <option value="Bon">Bon</option>
                            <option value="Manquement">Manquement</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                        <div className="flex-[2] space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Motif</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Avance sur salaire"
                            value={ded.motif} 
                            onChange={e => updateDeduction(index, 'motif', e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 border transition-all"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Montant (GNF)</label>
                          <input 
                            type="number" 
                            value={ded.montant} 
                            onChange={e => updateDeduction(index, 'montant', e.target.value)}
                            className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 border transition-all"
                          />
                        </div>
                        <div className="pt-7">
                          <button 
                            onClick={() => removeDeduction(index)}
                            className="text-gray-400 hover:text-red-600 p-2 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Supprimer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                   <div className="text-right bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[250px]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">Total Déductions</span>
                        <span className="text-lg font-bold text-red-600">
                          - {deductions.reduce((sum, d) => sum + Number(d.montant || 0), 0).toLocaleString()} GNF
                        </span>
                      </div>
                      <div className="h-px bg-gray-200 my-2 w-full"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-900">Net à Payer</span>
                        <span className="text-xl font-black text-green-600">
                          { ((Number(selectedEmpForPdf.salaireBase) || 0) - deductions.reduce((sum, d) => sum + Number(d.montant || 0), 0)).toLocaleString() } GNF
                        </span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition"
                disabled={isGenerating}
              >
                Annuler
              </button>
              <button 
                onClick={generateAndDownloadPdf}
                disabled={isGenerating}
                className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Génération en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download className="w-5 h-5" /> Télécharger le Bulletin
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}