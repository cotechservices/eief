// app/dashboard/admin/salaires/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle, Clock, CreditCard,
  TrendingUp, Loader2, Printer, AlertCircle,
  User, Download, ChevronDown, ChevronUp, X,
  Calendar, Banknote
} from "lucide-react";

interface Salaire {
  personnel_id: number;
  matricule: string;
  employe: string;
  poste: string;
  departement: string;
  statut_agent: string;
  salaire_base: number;
  prime_mensuelle: number;
  salaire_total: number;
  paiement_id: number | null;
  montant_paye: number | null;
  statut: string;
  date_paiement: string | null;
  mode_paiement: string | null;
  reference_transaction: string | null;
}

const MOIS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

export default function SalairesPage() {
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMois, setSelectedMois] = useState((new Date().getMonth() + 1).toString());
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear().toString());
  const [showModal, setShowModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Salaire | null>(null);
  const [modePaiement, setModePaiement] = useState("virement");
  const [submitting, setSubmitting] = useState(false);

  const annees = ["2024", "2025", "2026", "2027"];

  const fetchSalaires = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/salaires?month=${selectedMois}&year=${selectedAnnee}`);
      if (res.ok) setSalaires(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSalaires(); }, [selectedMois, selectedAnnee]);

  const openPaymentModal = (agent: Salaire) => {
    setSelectedAgent(agent);
    setModePaiement("virement");
    setShowModal(true);
  };

  const handlePayer = async () => {
    if (!selectedAgent) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/salaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel_id: selectedAgent.personnel_id,
          montant: selectedAgent.salaire_total,
          mois: parseInt(selectedMois),
          annee: parseInt(selectedAnnee),
          mode_paiement: modePaiement,
          reference_transaction: `SAL-${selectedAnnee}${String(selectedMois).padStart(2,'0')}-${selectedAgent.matricule}`
        })
      });
      if (res.ok) {
        setShowModal(false);
        fetchSalaires();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur de paiement");
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handlePayerTous = async () => {
    const nonPayes = filteredSalaires.filter(s => s.statut !== "paye");
    if (nonPayes.length === 0) { alert("Tous les salaires sont déjà payés ce mois."); return; }
    if (!confirm(`Confirmer le paiement en masse de ${nonPayes.length} salaires pour ${MOIS[parseInt(selectedMois)-1]} ${selectedAnnee} ?`)) return;

    for (const agent of nonPayes) {
      await fetch('/api/admin/salaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel_id: agent.personnel_id,
          montant: agent.salaire_total,
          mois: parseInt(selectedMois),
          annee: parseInt(selectedAnnee),
          mode_paiement: 'virement',
          reference_transaction: `SAL-${selectedAnnee}${String(selectedMois).padStart(2,'0')}-${agent.matricule}`
        })
      });
    }
    fetchSalaires();
  };

  const filteredSalaires = salaires.filter(s =>
    !searchTerm ||
    s.employe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.poste?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMasse = filteredSalaires.reduce((acc, s) => acc + Number(s.salaire_total || 0), 0);
  const totalPaye = filteredSalaires.filter(s => s.statut === "paye").reduce((acc, s) => acc + Number(s.montant_paye || s.salaire_total || 0), 0);
  const totalEnAttente = filteredSalaires.filter(s => s.statut !== "paye").reduce((acc, s) => acc + Number(s.salaire_total || 0), 0);
  const nbPayes = filteredSalaires.filter(s => s.statut === "paye").length;
  const nbNonPayes = filteredSalaires.filter(s => s.statut !== "paye").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des salaires</h1>
          <p className="text-gray-500 text-sm mt-1">Paie mensuelle du personnel</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedMois}
            onChange={e => setSelectedMois(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MOIS.map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
          </select>
          <select
            value={selectedAnnee}
            onChange={e => setSelectedAnnee(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {nbNonPayes > 0 && (
            <button
              onClick={handlePayerTous}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Payer tous ({nbNonPayes})
            </button>
          )}
        </div>
      </div>

      {/* Cartes récap */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Masse salariale totale</p>
          <p className="text-2xl font-bold mt-1">{totalMasse.toLocaleString()} <span className="text-sm font-normal">GNF</span></p>
          <p className="text-xs opacity-70 mt-1">{salaires.length} employé(s)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-400">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Déjà payé</p>
              <p className="text-xl font-bold text-green-600 mt-1">{totalPaye.toLocaleString()} <span className="text-xs font-normal text-gray-400">GNF</span></p>
              <p className="text-xs text-gray-400 mt-0.5">{nbPayes} agent(s)</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-400">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">En attente</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">{totalEnAttente.toLocaleString()} <span className="text-xs font-normal text-gray-400">GNF</span></p>
              <p className="text-xs text-gray-400 mt-0.5">{nbNonPayes} agent(s)</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-400">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">Taux de paiement</p>
              <p className="text-xl font-bold text-purple-600 mt-1">
                {salaires.length > 0 ? Math.round((nbPayes / salaires.length) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{MOIS[parseInt(selectedMois)-1]} {selectedAnnee}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-300" />
          </div>
        </div>
      </div>

      {/* Filtre */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule ou poste..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Poste</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Salaire base</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Prime</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total net</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSalaires.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Aucun agent trouvé</td></tr>
                ) : filteredSalaires.map(agent => (
                  <tr key={agent.personnel_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                          {(agent.employe?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{agent.employe}</p>
                          <p className="text-xs text-gray-400">{agent.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{agent.poste}</td>
                    <td className="px-6 py-4 text-right text-sm">{Number(agent.salaire_base || 0).toLocaleString()} GNF</td>
                    <td className="px-6 py-4 text-right text-sm text-green-600">
                      {Number(agent.prime_mensuelle || 0) > 0 ? `+${Number(agent.prime_mensuelle).toLocaleString()} GNF` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {Number(agent.salaire_total || 0).toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4">
                      {agent.statut === "paye" ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" /> Payé</span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm"><Clock className="w-4 h-4" /> Non payé</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{agent.date_paiement || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {agent.statut !== "paye" && (
                          <button
                            onClick={() => openPaymentModal(agent)}
                            className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded-lg text-xs font-medium transition"
                          >
                            Payer
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Imprimer fiche">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredSalaires.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">{totalMasse.toLocaleString()} GNF</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal Paiement */}
      {showModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Confirmer le paiement</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">{selectedAgent.employe}</p>
                <p className="text-sm text-gray-500">{selectedAgent.poste} • {selectedAgent.matricule}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Montant à payer</p>
                  <p className="text-2xl font-bold text-green-700">{Number(selectedAgent.salaire_total).toLocaleString()} GNF</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Base: {Number(selectedAgent.salaire_base).toLocaleString()} + Prime: {Number(selectedAgent.prime_mensuelle || 0).toLocaleString()}
                  </p>
                </div>
                <Banknote className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Période</p>
                <p className="font-medium">{MOIS[parseInt(selectedMois)-1]} {selectedAnnee}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select
                  value={modePaiement}
                  onChange={e => setModePaiement(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="virement">Virement bancaire</option>
                  <option value="especes">Espèces</option>
                  <option value="cheque">Chèque</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50 transition">Annuler</button>
              <button
                onClick={handlePayer}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}