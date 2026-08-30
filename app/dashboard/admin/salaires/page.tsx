// app/dashboard/admin/salaires/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Search, CheckCircle, Clock, CreditCard,
  TrendingUp, Loader2, Printer, AlertCircle,
  User, Download, X,
  Calendar, Banknote
} from "lucide-react";

interface LigneDeduction {
  date: string;
  type: string;
  motif: string;
  montant: number | string;
}

interface Salaire {
  personnel_id: number;
  matricule: string;
  employe: string;
  poste: string;
  departement: string;
  statut_agent: string;
  salaire_base: number;
  prime_mensuelle: number;
  prime_responsabilite?: number;
  prime_craie?: number;
  retenue_sanction?: number;
  autres_retenues?: number;
  details_lignes?: LigneDeduction[];
  total_brut?: number;
  total_deductions?: number;
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
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const formatFG = (num: number) => {
  if (!num && num !== 0) return "0";
  return Math.abs(num).toLocaleString('fr-FR').replace(/\s/g, ' /');
};

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

  // Formulaire de détails pour le paiement (permet d'avoir des champs vides '')
  const [formSalaireBase, setFormSalaireBase] = useState<number | string>('');
  const [formPrimeMensuelle, setFormPrimeMensuelle] = useState<number | string>('');
  const [formPrimeResponsabilite, setFormPrimeResponsabilite] = useState<number | string>('');
  const [formPrimeCraie, setFormPrimeCraie] = useState<number | string>('');
  const [formRetenueSanction, setFormRetenueSanction] = useState<number | string>('');
  const [formAutresRetenues, setFormAutresRetenues] = useState<number | string>('');
  const [formLignesDeductions, setFormLignesDeductions] = useState<LigneDeduction[]>([]);

  // ⭐ IMPRESSION BULLETIN DE PAIE EXACT (SELON LE PDF OFFICIEL)
  const printBulletin = (agent: Salaire, mois: string, annee: string) => {
    const moisLabel = MOIS[parseInt(mois) - 1];
    const dateEmission = new Date().toLocaleDateString('fr-FR');

    const baseAmount = Number(agent.salaire_base || 0);
    const primeMensuelle = Number(agent.prime_mensuelle || 0);
    const primeResponsabilite = Number(agent.prime_responsabilite || 0);
    const primeCraie = Number(agent.prime_craie || 0);

    const calculatedBrut = baseAmount + primeMensuelle + primeResponsabilite + primeCraie;
    const brutTotal = agent.total_brut && agent.total_brut > 0 ? agent.total_brut : calculatedBrut;

    const lignes = Array.isArray(agent.details_lignes) ? agent.details_lignes : [];

    const sumLignes = lignes.reduce((acc, row) => acc + Number(row.montant || 0), 0);
    const fixedRetenues = Number(agent.retenue_sanction || 0) + Number(agent.autres_retenues || 0);
    const totalDeductions = agent.total_deductions && agent.total_deductions > 0 ? agent.total_deductions : (sumLignes + fixedRetenues);

    const netTotal = agent.montant_paye ? Number(agent.montant_paye) : (brutTotal - totalDeductions);

    const lignesRowsHTML = lignes.length > 0 ? lignes.map(l => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 9px 8px; color: #555;">${l.date}</td>
        <td style="padding: 9px 8px; font-weight: 500; color: #111;">${l.type}</td>
        <td style="padding: 9px 8px; color: #333; text-transform: uppercase;">${l.motif}</td>
        <td style="padding: 9px 8px; text-align: right; font-weight: bold; color: #dc2626;">- ${formatFG(Number(l.montant || 0))} FG</td>
      </tr>
    `).join('') : `
      <tr style="border-bottom: 1px solid #eee;">
        <td colspan="4" style="padding: 12px 8px; color: #888; text-align: center; font-style: italic;">Aucune retenue ni avance pour cette période</td>
      </tr>
    `;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin de Paie - ${agent.employe} - ${moisLabel} ${annee}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 25px; }
    .page { max-width: 850px; margin: 0 auto; }
    .header-center { text-align: center; position: relative; margin-bottom: 20px; }
    .header-logo { position: absolute; left: 0; top: 0; height: 75px; object-fit: contain; }
    .header-center h2 { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
    .header-center p { font-size: 11px; font-style: italic; color: #333; margin-bottom: 6px; }
    .header-center h3 { font-size: 13px; font-weight: bold; margin-bottom: 8px; }
    .header-center h1 { font-size: 18px; font-weight: bold; letter-spacing: 1px; margin-bottom: 10px; }
    .line-divider { border-bottom: 2px solid #1a3c6e; width: 100%; margin-top: 6px; }

    .period-title { font-size: 14px; font-weight: bold; margin: 16px 0 14px 0; }

    .emp-banner { background-color: #1a3c6e; color: white; padding: 10px 14px; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; align-items: center; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; margin-bottom: 20px; }
    .summary-col { padding: 10px 14px; border-right: 1px solid #e2e8f0; }
    .summary-col:last-child { border-right: none; }
    .summary-label { font-size: 11px; font-weight: bold; color: #334155; }
    .summary-val { font-size: 13px; font-weight: bold; text-align: right; margin-top: 6px; }

    .deductions-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .deductions-table th { padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: left; font-size: 11px; font-weight: bold; color: #475569; }
    .deductions-table th:last-child { text-align: right; }

    .totaux-banner { background-color: #1a3c6e; color: white; display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr; padding: 10px 14px; font-weight: bold; font-size: 12px; }
    .totaux-row { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr; padding: 12px 14px; background: white; border: 1px solid #e2e8f0; border-top: none; font-size: 12px; font-weight: bold; }

    .footer-doc { margin-top: 40px; font-size: 10px; color: #475569; }
    .sig-section { float: right; margin-top: 25px; text-align: center; width: 300px; }
    .sig-title { font-size: 11px; margin-bottom: 4px; }
    .sig-name { font-size: 12px; font-weight: bold; color: #000; margin-bottom: 4px; }
    .sig-date { font-size: 10px; color: #64748b; margin-bottom: 40px; }
    .sig-line { border-bottom: 1px solid #334155; width: 100%; margin-bottom: 4px; }

    @media print {
      body { padding: 10px; }
      .page { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- EN-TÊTE GUINÉE ET ÉCOLE -->
    <div class="header-center">
      <img src="/img/logo.jpg" class="header-logo" alt="Logo EIEF" onerror="this.style.display='none'" />
      <h2>REPUBLIQUE DE GUINEE</h2>
      <p>Travail - Justice - Solidarite</p>
      <h3>ECOLE INTERNATIONALE LES ENFANTS DU FUTUR</h3>
      <h1>LISTE DE PAIE DETAILLEE</h1>
      <div class="line-divider"></div>
    </div>

    <!-- PÉRIODE -->
    <div class="period-title">Periode : ${moisLabel} ${annee}</div>

    <!-- BANNIÈRE EMPLOYÉ -->
    <div class="emp-banner">
      <div>1. ${agent.employe.toUpperCase()} &mdash; ${agent.poste.toUpperCase()} ${agent.departement ? '(GROUPE PÉDAGOGIQUE ' + agent.departement.toUpperCase() + ')' : ''}</div>
      <div>Net : ${formatFG(netTotal)} FG</div>
    </div>

    <!-- RECAP BRUT / DEDUCTIONS / NET -->
    <div class="summary-grid">
      <div class="summary-col">
        <div class="summary-label">Salaire Brut</div>
        <div class="summary-val">${formatFG(brutTotal)} FG</div>
      </div>
      <div class="summary-col">
        <div class="summary-label">Total Deductions</div>
        <div class="summary-val">${formatFG(totalDeductions)} FG</div>
      </div>
      <div class="summary-col">
        <div class="summary-label">Net a payer</div>
        <div class="summary-val">${formatFG(netTotal)} FG</div>
      </div>
    </div>

    <!-- TABLEAU DÉTAILLÉ DES DÉDUCTIONS & AVANCES -->
    <table class="deductions-table">
      <thead>
        <tr>
          <th style="width: 15%;">Date</th>
          <th style="width: 15%;">Type</th>
          <th style="width: 50%;">Motif</th>
          <th style="width: 20%; text-align: right;">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${lignesRowsHTML}
      </tbody>
    </table>

    <!-- TOTAUX GÉNÉRAUX -->
    <div class="totaux-banner">
      <div>TOTAUX GENERAUX</div>
      <div>Brut</div>
      <div>Deductions</div>
      <div>Net a payer</div>
    </div>
    <div class="totaux-row">
      <div>1 employe(s)</div>
      <div>${formatFG(brutTotal)}</div>
      <div>${formatFG(totalDeductions)}</div>
      <div>${formatFG(netTotal)} FG</div>
    </div>

    <!-- FOOTER ET SIGNATURE DU DIRECTEUR -->
    <div class="footer-doc">
      <p style="text-align: center; font-style: italic;">Document genere automatiquement - ECOLE INTERNATIONALE LES ENFANTS DU FUTUR</p>
      <p style="text-align: center; margin-top: 3px;">Date d'emission : ${dateEmission}</p>

      <div class="sig-section">
        <div class="sig-title">Directeur</div>
        <div class="sig-name">TAMBA SOSSO DEMBADOUNO</div>
        <div class="sig-date">Date de signature : ${dateEmission}</div>
        <div class="sig-line"></div>
        <div style="font-size: 9px; font-style: italic; color: #64748b;">Signature et cachet</div>
      </div>
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
    setFormSalaireBase(agent.salaire_base ? agent.salaire_base : '');
    setFormPrimeMensuelle(agent.prime_mensuelle ? agent.prime_mensuelle : '');
    setFormPrimeResponsabilite(agent.prime_responsabilite ? agent.prime_responsabilite : '');
    setFormPrimeCraie(agent.prime_craie ? agent.prime_craie : '');
    setFormRetenueSanction(agent.retenue_sanction ? agent.retenue_sanction : '');
    setFormAutresRetenues(agent.autres_retenues ? agent.autres_retenues : '');

    const todayISO = new Date().toISOString().split('T')[0];
    if (agent.details_lignes && agent.details_lignes.length > 0) {
      setFormLignesDeductions(agent.details_lignes);
    } else {
      setFormLignesDeductions([
        { date: todayISO, type: "Avance", motif: "AVANCE SUR SALAIRE", montant: 200000 },
        { date: todayISO, type: "Bon", motif: "POUR SON TÉLÉPHONE", montant: 100000 },
        { date: todayISO, type: "Avance", motif: "MANQUEMENT AU SERVICE", montant: 300000 },
        { date: todayISO, type: "Avance", motif: "MANQUEMENT AUX PRINCIPES DU SERVICE", montant: 300000 }
      ]);
    }

    setModePaiement("virement");
    setShowModal(true);
  };

  const addLigneDeduction = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    setFormLignesDeductions(prev => [...prev, { date: todayISO, type: "Avance", motif: "", montant: '' }]);
  };

  const removeLigneDeduction = (index: number) => {
    setFormLignesDeductions(prev => prev.filter((_, i) => i !== index));
  };

  const updateLigneDeduction = (index: number, field: keyof LigneDeduction, value: any) => {
    setFormLignesDeductions(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const handlePayer = async () => {
    if (!selectedAgent) return;
    setSubmitting(true);

    const valBase = Number(formSalaireBase || 0);
    const valPrimeM = Number(formPrimeMensuelle || 0);
    const valPrimeR = Number(formPrimeResponsabilite || 0);
    const valPrimeC = Number(formPrimeCraie || 0);
    const valRetenueS = Number(formRetenueSanction || 0);
    const valAutresR = Number(formAutresRetenues || 0);

    const calculatedBrut = valBase + valPrimeM + valPrimeR + valPrimeC;
    const sumLignes = formLignesDeductions.reduce((acc, row) => acc + Number(row.montant || 0), 0);
    const calculatedDeductions = valRetenueS + valAutresR + sumLignes;
    const calculatedTotalNet = calculatedBrut - calculatedDeductions;

    try {
      const res = await fetch('/api/admin/salaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel_id: selectedAgent.personnel_id,
          salaire_base: valBase,
          prime_mensuelle: valPrimeM,
          prime_responsabilite: valPrimeR,
          prime_craie: valPrimeC,
          retenue_sanction: valRetenueS,
          autres_retenues: valAutresR,
          details_lignes: formLignesDeductions,
          total_brut: calculatedBrut,
          total_deductions: calculatedDeductions,
          montant: calculatedTotalNet,
          mois: parseInt(selectedMois),
          annee: parseInt(selectedAnnee),
          mode_paiement: modePaiement,
          reference_transaction: `SAL-${selectedAnnee}${String(selectedMois).padStart(2, '0')}-${selectedAgent.matricule}`
        })
      });

      if (res.ok) {
        const today = new Date().toISOString().split('T')[0];
        setSalaires(prev =>
          prev.map(s =>
            s.personnel_id === selectedAgent.personnel_id
              ? {
                ...s,
                statut: "paye",
                date_paiement: today,
                mode_paiement: modePaiement,
                salaire_base: valBase,
                prime_mensuelle: valPrimeM,
                prime_responsabilite: valPrimeR,
                prime_craie: valPrimeC,
                retenue_sanction: valRetenueS,
                autres_retenues: valAutresR,
                details_lignes: formLignesDeductions,
                total_brut: calculatedBrut,
                total_deductions: calculatedDeductions,
                montant_paye: calculatedTotalNet
              }
              : s
          )
        );
        setShowModal(false);
        addToast(`✅ Salaire de ${selectedAgent.employe} payé avec succès ! (${calculatedTotalNet.toLocaleString()} GNF)`, "success");
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
    if (!confirm(`Confirmer le paiement en masse de ${nonPayes.length} salaires pour ${MOIS[parseInt(selectedMois) - 1]} ${selectedAnnee} ?`)) return;

    addToast(`⏳ Traitement de ${nonPayes.length} paiements en cours...`, "info");
    let success = 0;
    let errors = 0;

    for (const agent of nonPayes) {
      const base = Number(agent.salaire_base || 0);
      const prime = Number(agent.prime_mensuelle || 0);
      const total = base + prime;

      const res = await fetch('/api/admin/salaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel_id: agent.personnel_id,
          salaire_base: base,
          prime_mensuelle: prime,
          prime_responsabilite: 0,
          prime_craie: 0,
          retenue_sanction: 0,
          autres_retenues: 0,
          details_lignes: [],
          total_brut: total,
          total_deductions: 0,
          montant: total,
          mois: parseInt(selectedMois),
          annee: parseInt(selectedAnnee),
          mode_paiement: 'virement',
          reference_transaction: `SAL-${selectedAnnee}${String(selectedMois).padStart(2, '0')}-${agent.matricule}`
        })
      });
      if (res.ok) {
        success++;
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

  const totalMasse = filteredSalaires.reduce((acc, s) => acc + Number(s.montant_paye || s.salaire_total || 0), 0);
  const totalPaye = filteredSalaires.filter(s => s.statut === "paye").reduce((acc, s) => acc + Number(s.montant_paye || s.salaire_total || 0), 0);
  const totalEnAttente = filteredSalaires.filter(s => s.statut !== "paye").reduce((acc, s) => acc + Number(s.salaire_total || 0), 0);
  const nbPayes = filteredSalaires.filter(s => s.statut === "paye").length;
  const nbNonPayes = filteredSalaires.filter(s => s.statut !== "paye").length;

  const modalSumPrimes = Number(formPrimeMensuelle || 0) + Number(formPrimeResponsabilite || 0) + Number(formPrimeCraie || 0);
  const modalBrut = Number(formSalaireBase || 0) + modalSumPrimes;
  const modalSumLignes = formLignesDeductions.reduce((acc, row) => acc + Number(row.montant || 0), 0);
  const modalDeductions = Number(formRetenueSanction || 0) + Number(formAutresRetenues || 0) + modalSumLignes;
  const modalTotalNet = modalBrut - modalDeductions;

  return (
    <div className="space-y-6">

      {/* ✅ TOASTS NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border-l-4 max-w-sm animate-slide-in ${toast.type === "success" ? "bg-green-50 border-green-500 text-green-800" :
              toast.type === "error" ? "bg-red-50 border-red-500 text-red-800" :
                "bg-blue-50 border-blue-500 text-blue-800"
              }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === "info" && <Clock className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 text-gray-900 hover:text-gray-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des salaires</h1>
          <p className="text-gray-900 text-sm mt-1">Paie mensuelle du personnel</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedMois}
            onChange={e => setSelectedMois(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MOIS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
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
              <p className="text-gray-900 text-sm">Déjà payé</p>
              <p className="text-xl font-bold text-green-600 mt-1">{totalPaye.toLocaleString()} <span className="text-xs font-normal text-gray-900">GNF</span></p>
              <p className="text-xs text-gray-900 mt-0.5">{nbPayes} agent(s)</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-400">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-900 text-sm">En attente</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">{totalEnAttente.toLocaleString()} <span className="text-xs font-normal text-gray-900">GNF</span></p>
              <p className="text-xs text-gray-900 mt-0.5">{nbNonPayes} agent(s)</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-400">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-900 text-sm">Taux de paiement</p>
              <p className="text-xl font-bold text-purple-600 mt-1">
                {salaires.length > 0 ? Math.round((nbPayes / salaires.length) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-900 mt-0.5">{MOIS[parseInt(selectedMois) - 1]} {selectedAnnee}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-300" />
          </div>
        </div>
      </div>

      {/* Filtre */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Employé</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Poste</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Salaire base</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Primes</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Déductions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase">Total net</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Date paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSalaires.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-900">Aucun agent trouvé</td></tr>
                ) : filteredSalaires.map(agent => {
                  const primesTotal = Number(agent.prime_mensuelle || 0) + Number(agent.prime_responsabilite || 0) + Number(agent.prime_craie || 0);
                  const sumLignes = agent.details_lignes ? agent.details_lignes.reduce((a, l) => a + Number(l.montant || 0), 0) : 0;
                  const dedsTotal = agent.total_deductions && agent.total_deductions > 0 ? agent.total_deductions : (Number(agent.retenue_sanction || 0) + Number(agent.autres_retenues || 0) + sumLignes);
                  const netCalc = (Number(agent.salaire_base || 0) + primesTotal) - dedsTotal;
                  const finalNet = agent.montant_paye ? Number(agent.montant_paye) : netCalc;

                  return (
                    <tr key={agent.personnel_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            {(agent.employe?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{agent.employe}</p>
                            <p className="text-xs text-gray-900">{agent.matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{agent.poste}</td>
                      <td className="px-6 py-4 text-right text-sm">{Number(agent.salaire_base || 0).toLocaleString()} GNF</td>
                      <td className="px-6 py-4 text-right text-sm text-green-600">
                        {primesTotal > 0 ? `+${primesTotal.toLocaleString()} GNF` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">
                        {dedsTotal > 0 ? `-${dedsTotal.toLocaleString()} GNF` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {finalNet.toLocaleString()} GNF
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
                      <td className="px-6 py-4 text-sm text-gray-900">{agent.date_paiement || '-'}</td>
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
                  );
                })}
              </tbody>
              {filteredSalaires.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={5} className="px-6 py-3 text-sm font-semibold text-gray-900">Total</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">{totalMasse.toLocaleString()} GNF</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal Paiement avec Formulaire Détaillé des Lignes de Déduction */}
      {showModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Formulaire de Paie Détaillée</h2>
                <p className="text-xs text-gray-900 mt-0.5">Saisie des primes, avances, bons, sanctions et déductions</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-900 hover:text-gray-900 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                <div>
                  <p className="font-bold text-gray-900">{selectedAgent.employe}</p>
                  <p className="text-xs text-gray-900">{selectedAgent.poste} • Matricule: {selectedAgent.matricule}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                    {MOIS[parseInt(selectedMois) - 1]} {selectedAnnee}
                  </span>
                </div>
              </div>

              {/* 1. Rémunération de base & Primes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">1. Rémunération de base & Primes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">Salaire de base (GNF)</label>
                    <input
                      type="number"
                      value={formSalaireBase}
                      onChange={e => setFormSalaireBase(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="ex: 3500000"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-900 mb-1">Prime mensuelle (GNF)</label>
                    <input
                      type="number"
                      value={formPrimeMensuelle}
                      onChange={e => setFormPrimeMensuelle(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Prime de responsabilité (GNF)</label>
                    <input
                      type="number"
                      value={formPrimeResponsabilite}
                      onChange={e => setFormPrimeResponsabilite(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-green-200 bg-green-50/30 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Prime de craie (GNF)</label>
                    <input
                      type="number"
                      value={formPrimeCraie}
                      onChange={e => setFormPrimeCraie(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-green-200 bg-green-50/30 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Tableau dynamique des lignes (Avances, Bons, Sanctions) */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">2. Lignes de Déductions, Avances & Sanctions</h3>
                    <p className="text-xs text-gray-900">Ces lignes figureront directement dans le tableau du bulletin imprimé</p>
                  </div>
                  <button
                    type="button"
                    onClick={addLigneDeduction}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    + Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-2">
                  {formLignesDeductions.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => updateLigneDeduction(idx, 'date', e.target.value)}
                        className="w-32 px-2.5 py-1.5 border rounded-lg text-xs"
                      />
                      <select
                        value={row.type}
                        onChange={e => updateLigneDeduction(idx, 'type', e.target.value)}
                        className="w-28 px-2.5 py-1.5 border rounded-lg text-xs bg-white font-medium"
                      >
                        <option value="Avance">Avance</option>
                        <option value="Bon">Bon</option>
                        <option value="Retenue">Retenue</option>
                        <option value="Sanction">Sanction</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Motif (ex: AVANCE SUR SALAIRE, POUR SON TÉLÉPHONE...)"
                        value={row.motif}
                        onChange={e => updateLigneDeduction(idx, 'motif', e.target.value)}
                        className="flex-1 min-w-[180px] px-2.5 py-1.5 border rounded-lg text-xs uppercase"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Montant GNF"
                          value={row.montant}
                          onChange={e => updateLigneDeduction(idx, 'montant', e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-32 px-2.5 py-1.5 border rounded-lg text-xs font-bold text-red-600 text-right"
                        />
                        <span className="text-xs text-gray-900">GNF</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLigneDeduction(idx)}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Retenues additionnelles fixes */}
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">3. Retenues additionnelles fixes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">Retenue pour sanction complémentaire (GNF)</label>
                    <input
                      type="number"
                      value={formRetenueSanction}
                      onChange={e => setFormRetenueSanction(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-red-200 bg-red-50/30 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">Autres retenues générales (GNF)</label>
                    <input
                      type="number"
                      value={formAutresRetenues}
                      onChange={e => setFormAutresRetenues(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-red-200 bg-red-50/30 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mode de paiement */}
              <div className="pt-3 border-t">
                <label className="block text-xs font-medium text-gray-900 mb-1">Mode de paiement</label>
                <select
                  value={modePaiement}
                  onChange={e => setModePaiement(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="virement">Virement bancaire</option>
                  <option value="especes">Espèces</option>
                  <option value="cheque">Chèque</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              {/* Résumé Net à payer */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl p-4 shadow-lg">
                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/20">
                  <div>
                    <p className="text-[10px] text-blue-200 uppercase font-medium">Total Brut</p>
                    <p className="text-base font-bold mt-0.5">{modalBrut.toLocaleString()} GNF</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-red-200 uppercase font-medium">Total Déductions</p>
                    <p className="text-base font-bold text-red-300 mt-0.5">-{modalDeductions.toLocaleString()} GNF</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-200 uppercase font-medium">Net à Payer</p>
                    <p className="text-xl font-extrabold text-green-400 mt-0.5">{modalTotalNet.toLocaleString()} GNF</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border bg-white py-2 rounded-lg text-sm hover:bg-gray-100 transition font-medium">Annuler</button>
              <button
                onClick={handlePayer}
                disabled={submitting}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Valider et Générer Bulletin PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}