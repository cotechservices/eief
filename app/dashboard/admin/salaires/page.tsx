// app/dashboard/admin/salaires/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle, Clock, CreditCard,
  TrendingUp, Loader2, Printer, AlertCircle,
  User, Download, X,
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

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const MOIS = [
  "Octobre","Novembre","Décembre","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre"
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
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ⭐ IMPRESSION BULLETIN DE PAIE
  const printBulletin = (agent: Salaire, mois: string, annee: string) => {
    const moisLabel = MOIS[parseInt(mois) - 1];
    const salaireBase = Number(agent.salaire_base || 0);
    const prime = Number(agent.prime_mensuelle || 0);
    const total = salaireBase + prime;
    const datePaiement = agent.date_paiement || new Date().toISOString().split('T')[0];
    const reference = agent.reference_transaction || `SAL-${annee}${String(mois).padStart(2,'0')}-${agent.matricule}`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin de Paie - ${agent.employe} - ${moisLabel} ${annee}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 20px; }
    .page { max-width: 800px; margin: 0 auto; }

    /* EN-TÊTE */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a3c6e; padding-bottom: 14px; margin-bottom: 16px; }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-area img { height: 70px; object-fit: contain; }
    .school-info h1 { font-size: 17px; font-weight: bold; color: #1a3c6e; }
    .school-info p { font-size: 10px; color: #555; line-height: 1.5; }
    .bulletin-title { text-align: right; }
    .bulletin-title h2 { font-size: 16px; font-weight: bold; color: #1a3c6e; text-transform: uppercase; letter-spacing: 1px; }
    .bulletin-title .period { font-size: 13px; color: #e05c00; font-weight: bold; margin-top: 4px; }
    .bulletin-title .ref { font-size: 9px; color: #888; margin-top: 3px; }

    /* INFOS EMPLOYÉ */
    .employee-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .info-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; }
    .info-box h3 { font-size: 10px; text-transform: uppercase; color: #1a3c6e; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .info-label { color: #666; font-size: 10px; }
    .info-value { font-weight: bold; font-size: 10px; color: #111; }

    /* TABLEAU SALAIRE */
    .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .salary-table thead tr { background-color: #1a3c6e; color: white; }
    .salary-table thead th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
    .salary-table thead th:last-child, .salary-table thead th:nth-last-child(2) { text-align: right; }
    .salary-table tbody tr:nth-child(even) { background-color: #f7f9fc; }
    .salary-table tbody tr:hover { background-color: #edf2ff; }
    .salary-table tbody td { padding: 7px 10px; border-bottom: 1px solid #e8e8e8; font-size: 10px; }
    .salary-table tbody td:last-child, .salary-table tbody td:nth-last-child(2) { text-align: right; }
    .salary-table .cat { color: #1a3c6e; font-style: italic; font-size: 9px; background: #f0f4ff !important; font-weight: bold; }
    .salary-table tfoot tr { background-color: #1a3c6e; color: white; }
    .salary-table tfoot td { padding: 9px 10px; font-weight: bold; font-size: 11px; }
    .salary-table tfoot td:last-child { text-align: right; font-size: 14px; }

    /* NET À PAYER */
    .net-box { background: linear-gradient(135deg, #1a3c6e, #2563b0); color: white; border-radius: 8px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .net-box .label { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .net-box .amount { font-size: 22px; font-weight: bold; }
    .net-box .currency { font-size: 12px; opacity: 0.8; margin-left: 6px; }
    .net-box .mode { font-size: 10px; opacity: 0.75; margin-top: 3px; }

    /* SIGNATURES */
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 10px; }
    .sig-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
    .sig-box .sig-title { font-size: 9px; text-transform: uppercase; color: #1a3c6e; font-weight: bold; margin-bottom: 40px; }
    .sig-box .sig-name { font-size: 9px; color: #555; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px; }

    /* FOOTER */
    .footer { margin-top: 16px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
    .footer span { color: #1a3c6e; }

    /* WATERMARK si non payé */
    .unpaid-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 80px; color: rgba(255,0,0,0.07); font-weight: bold; text-transform: uppercase; pointer-events: none; white-space: nowrap; }

    @media print {
      body { padding: 10px; }
      .page { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${agent.statut !== 'paye' ? '<div class="unpaid-watermark">Brouillon</div>' : ''}

    <!-- EN-TÊTE -->
    <div class="header">
      <div class="logo-area">
        <img src="/img/logo.jpg" alt="Logo EIEF" onerror="this.style.display='none'" />
        <div class="school-info">
          <h1>E.I.E.F</h1>
          <p>École Internationale d'Enseignement Francophone<br>
          Conakry, République de Guinée<br>
          Tél: +224 000 000 000</p>
        </div>
      </div>
      <div class="bulletin-title">
        <h2>Bulletin de Paie</h2>
        <div class="period">${moisLabel} ${annee}</div>
        <div class="ref">Réf: ${reference}</div>
      </div>
    </div>

    <!-- INFOS EMPLOYÉ & EMPLOYEUR -->
    <div class="employee-section">
      <div class="info-box">
        <h3>🏢 Employeur</h3>
        <div class="info-row"><span class="info-label">Établissement</span><span class="info-value">E.I.E.F</span></div>
        <div class="info-row"><span class="info-label">Adresse</span><span class="info-value">Conakry, Guinée</span></div>
        <div class="info-row"><span class="info-label">N° RCCM</span><span class="info-value">GN-CNK-2024-001</span></div>
        <div class="info-row"><span class="info-label">Période</span><span class="info-value">${moisLabel} ${annee}</span></div>
        <div class="info-row"><span class="info-label">Date émission</span><span class="info-value">${new Date().toLocaleDateString('fr-FR')}</span></div>
      </div>
      <div class="info-box">
        <h3>👤 Salarié</h3>
        <div class="info-row"><span class="info-label">Nom & Prénom</span><span class="info-value">${agent.employe}</span></div>
        <div class="info-row"><span class="info-label">Matricule</span><span class="info-value">${agent.matricule}</span></div>
        <div class="info-row"><span class="info-label">Poste</span><span class="info-value">${agent.poste}</span></div>
        <div class="info-row"><span class="info-label">Département</span><span class="info-value">${agent.departement || '-'}</span></div>
        <div class="info-row"><span class="info-label">Statut</span><span class="info-value">${agent.statut_agent || 'Actif'}</span></div>
      </div>
    </div>

    <!-- TABLEAU DES ÉLÉMENTS DE SALAIRE -->
    <table class="salary-table">
      <thead>
        <tr>
          <th style="width:50%">Désignation</th>
          <th>Base / Unité</th>
          <th>Taux</th>
          <th>Gains (GNF)</th>
          <th>Retenues (GNF)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="cat"><td colspan="5">RÉMUNÉRATION DE BASE</td></tr>
        <tr>
          <td>Salaire de base</td>
          <td>Mensuel</td>
          <td>100%</td>
          <td>${salaireBase.toLocaleString('fr-FR')}</td>
          <td>-</td>
        </tr>
        ${prime > 0 ? `
        <tr class="cat"><td colspan="5">PRIMES &amp; AVANTAGES</td></tr>
        <tr>
          <td>Prime mensuelle</td>
          <td>Forfait</td>
          <td>-</td>
          <td>${prime.toLocaleString('fr-FR')}</td>
          <td>-</td>
        </tr>` : ''}
        <tr class="cat"><td colspan="5">COTISATIONS &amp; RETENUES</td></tr>
        <tr>
          <td>Cotisation CNSS (employé)</td>
          <td>Salaire brut</td>
          <td>3.6%</td>
          <td>-</td>
          <td>0</td>
        </tr>
        <tr>
          <td>Impôt sur le revenu (IR)</td>
          <td>Salaire imposable</td>
          <td>-</td>
          <td>-</td>
          <td>0</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">TOTAL NET À PAYER</td>
          <td>${total.toLocaleString('fr-FR')}</td>
          <td>0</td>
        </tr>
      </tfoot>
    </table>

    <!-- NET À PAYER -->
    <div class="net-box">
      <div>
        <div class="label">💰 Net à payer</div>
        <div class="mode">Mode: ${agent.mode_paiement || 'Virement bancaire'} • ${agent.statut === 'paye' ? '✅ Payé le ' + datePaiement : '⏳ En attente'}</div>
      </div>
      <div>
        <span class="amount">${total.toLocaleString('fr-FR')}</span>
        <span class="currency">GNF</span>
      </div>
    </div>

    <!-- SIGNATURES -->
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Le Salarié</div>
        <div class="sig-name">${agent.employe}</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Le Comptable</div>
        <div class="sig-name">Signature &amp; Cachet</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Direction Générale</div>
        <div class="sig-name">Signature &amp; Cachet</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p>Ce bulletin de paie doit être conservé sans limitation de durée — <span>E.I.E.F © ${annee}</span> — Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const annees = ["2024", "2025", "2026", "2027"];

  const addToast = (message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

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
        // ✅ Mise à jour optimiste immédiate du statut dans la liste
        const today = new Date().toISOString().split('T')[0];
        setSalaires(prev =>
          prev.map(s =>
            s.personnel_id === selectedAgent.personnel_id
              ? { ...s, statut: "paye", date_paiement: today, mode_paiement: modePaiement }
              : s
          )
        );
        setShowModal(false);
        addToast(`✅ Salaire de ${selectedAgent.employe} payé avec succès ! (${Number(selectedAgent.salaire_total).toLocaleString()} GNF)`, "success");
        // Rafraîchir les données en arrière-plan
        fetchSalaires();
      } else {
        const data = await res.json();
        addToast(data.error || "❌ Erreur lors du paiement", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("❌ Erreur réseau lors du paiement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayerTous = async () => {
    const nonPayes = filteredSalaires.filter(s => s.statut !== "paye");
    if (nonPayes.length === 0) {
      addToast("ℹ️ Tous les salaires sont déjà payés ce mois.", "info");
      return;
    }
    if (!confirm(`Confirmer le paiement en masse de ${nonPayes.length} salaires pour ${MOIS[parseInt(selectedMois)-1]} ${selectedAnnee} ?`)) return;

    addToast(`⏳ Traitement de ${nonPayes.length} paiements en cours...`, "info");
    let success = 0;
    let errors = 0;

    for (const agent of nonPayes) {
      const res = await fetch('/api/admin/salaires', {
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
      if (res.ok) {
        success++;
        // Mise à jour optimiste immédiate
        const today = new Date().toISOString().split('T')[0];
        setSalaires(prev =>
          prev.map(s =>
            s.personnel_id === agent.personnel_id
              ? { ...s, statut: "paye", date_paiement: today, mode_paiement: 'virement' }
              : s
          )
        );
      } else {
        errors++;
      }
    }

    if (success > 0) addToast(`✅ ${success} salaire(s) payé(s) avec succès !`, "success");
    if (errors > 0) addToast(`❌ ${errors} paiement(s) ont échoué`, "error");
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

      {/* ✅ TOASTS NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border-l-4 max-w-sm animate-slide-in ${
              toast.type === "success" ? "bg-green-50 border-green-500 text-green-800" :
              toast.type === "error"   ? "bg-red-50 border-red-500 text-red-800" :
              "bg-blue-50 border-blue-500 text-blue-800"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {toast.type === "error"   && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === "info"    && <Clock className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

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
                        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Payé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" /> Non payé
                        </span>
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
                        <button
                          onClick={() => printBulletin(agent, selectedMois, selectedAnnee)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          title="Imprimer bulletin de paie"
                        >
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