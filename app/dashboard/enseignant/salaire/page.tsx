// app/dashboard/enseignant/salaire/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Banknote, CheckCircle, Clock, Printer,
  TrendingUp, Loader2, AlertCircle, Calendar,
  ChevronDown, History, User, Building2
} from "lucide-react";

const MOIS_NOMS = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"
];

interface LigneDeduction {
  date: string;
  type: string;
  motif: string;
  montant: number;
}

interface Profil {
  employe: string;
  matricule: string;
  poste: string;
  departement: string;
  statut_agent: string;
}

interface Salaire {
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
}

interface Paiement {
  statut: string;
  montant_paye: number;
  date_paiement: string;
  mode_paiement: string;
  reference_transaction: string;
  salaire_base?: number;
  prime_mensuelle?: number;
  prime_responsabilite?: number;
  prime_craie?: number;
  retenue_sanction?: number;
  autres_retenues?: number;
  details_lignes?: LigneDeduction[];
  total_brut?: number;
  total_deductions?: number;
}

interface HistoriqueItem {
  mois: number;
  annee: number;
  montant: number;
  statut: string;
  date_paiement: string | null;
  mode_paiement: string | null;
}

interface SalaireData {
  profil: Profil;
  salaire: Salaire;
  paiement: Paiement | null;
  historique: HistoriqueItem[];
}

const formatFG = (num: number) => {
  if (!num && num !== 0) return "0";
  return Math.abs(num).toLocaleString('fr-FR').replace(/\s/g, ' /');
};

export default function EnseignantSalairePage() {
  const [data, setData] = useState<SalaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMois, setSelectedMois] = useState(new Date().getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear());

  const annees = [2024, 2025, 2026, 2027];

  const fetchSalaire = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/enseignant/salaire?month=${selectedMois}&year=${selectedAnnee}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur de chargement");
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMois, selectedAnnee]);

  const printBulletin = () => {
    if (!data) return;
    const { profil, salaire, paiement } = data;
    const moisLabel = MOIS_NOMS[selectedMois - 1];
    const anneeLabel = selectedAnnee.toString();
    const dateEmission = new Date().toLocaleDateString('fr-FR');
    const todayISO = new Date().toISOString().split('T')[0];

    const baseAmount = Number(salaire.salaire_base || 0);
    const primeMensuelle = Number(salaire.prime_mensuelle || 0);
    const primeResponsabilite = Number(salaire.prime_responsabilite || 0);
    const primeCraie = Number(salaire.prime_craie || 0);

    const calculatedBrut = baseAmount + primeMensuelle + primeResponsabilite + primeCraie;
    const brutTotal = (paiement?.total_brut || salaire?.total_brut) ? (paiement?.total_brut || salaire?.total_brut)! : calculatedBrut;

    const rawLignes = paiement?.details_lignes || salaire?.details_lignes;
    const lignes = Array.isArray(rawLignes) ? rawLignes : [];

    const sumLignes = lignes.reduce((acc, row) => acc + Number(row.montant || 0), 0);
    const fixedRetenues = Number(salaire.retenue_sanction || 0) + Number(salaire.autres_retenues || 0);
    const totalDeductions = (paiement?.total_deductions || salaire?.total_deductions) ? (paiement?.total_deductions || salaire?.total_deductions)! : (sumLignes + fixedRetenues);

    const netTotal = paiement?.montant_paye ? Number(paiement.montant_paye) : (brutTotal - totalDeductions);

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
  <title>Bulletin de Paie - ${profil.employe} - ${moisLabel} ${anneeLabel}</title>
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
    <div class="period-title">Periode : ${moisLabel} ${anneeLabel}</div>

    <!-- BANNIÈRE EMPLOYÉ -->
    <div class="emp-banner">
      <div>1. ${profil.employe.toUpperCase()} &mdash; ${profil.poste.toUpperCase()} ${profil.departement ? '(GROUPE PÉDAGOGIQUE ' + profil.departement.toUpperCase() + ')' : ''}</div>
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
    if (win) { win.document.write(html); win.document.close(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl text-center max-w-md mx-auto mt-10">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-semibold text-lg mb-1">Erreur de chargement</p>
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <button onClick={fetchSalaire} className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium">
          Reessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { profil, salaire, paiement, historique } = data;
  const isPaye = paiement?.statut === "paye";
  const nbPayesHistorique = historique.filter(h => h.statut === "paye").length;
  const totalPercu = historique.filter(h => h.statut === "paye").reduce((a, h) => a + h.montant, 0);

  const primesCumulees = Number(salaire.prime_mensuelle || 0) + Number(salaire.prime_responsabilite || 0) + Number(salaire.prime_craie || 0);
  const retenuesCumulees = Number(salaire.retenue_sanction || 0) + Number(salaire.autres_retenues || 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* En-tete */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mon Salaire</h1>
            <p className="text-blue-200 text-sm mt-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              {profil.employe} &bull; {profil.poste}
            </p>
            {profil.departement && (
              <p className="text-blue-300 text-xs mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {profil.departement}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedMois}
                onChange={e => setSelectedMois(Number(e.target.value))}
                className="bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 text-sm appearance-none pr-8 focus:outline-none cursor-pointer"
              >
                {MOIS_NOMS.map((m, i) => (
                  <option key={i + 1} value={i + 1} className="text-gray-800">{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedAnnee}
                onChange={e => setSelectedAnnee(Number(e.target.value))}
                className="bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 text-sm appearance-none pr-8 focus:outline-none cursor-pointer"
              >
                {annees.map(a => (
                  <option key={a} value={a} className="text-gray-800">{a}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2.5 rounded-xl"><Banknote className="w-5 h-5 text-blue-600" /></div>
            <p className="text-sm text-gray-900 font-medium">Salaire de base</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{salaire.salaire_base.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-900 mt-1">GNF / mois</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-50 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <p className="text-sm text-gray-900 font-medium">Total Primes</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {primesCumulees > 0 ? `+${primesCumulees.toLocaleString('fr-FR')}` : '-'}
          </p>
          <p className="text-xs text-gray-900 mt-1">GNF</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-sm p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2.5 rounded-xl"><Banknote className="w-5 h-5 text-white" /></div>
            <p className="text-sm text-indigo-100 font-medium">Net a payer</p>
          </div>
          <p className="text-2xl font-bold">{salaire.salaire_total.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-indigo-200 mt-1">GNF / mois</p>
        </div>
      </div>

      {/* Statut du paiement du mois */}
      <div className={`rounded-2xl p-6 shadow-sm border ${isPaye ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isPaye ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isPaye ? <CheckCircle className="w-7 h-7 text-green-600" /> : <Clock className="w-7 h-7 text-amber-600" />}
            </div>
            <div>
              <p className={`font-bold text-lg ${isPaye ? 'text-green-800' : 'text-amber-800'}`}>
                {isPaye ? "Salaire paye" : "Paiement en attente"}
              </p>
              <p className={`text-sm mt-0.5 ${isPaye ? 'text-green-600' : 'text-amber-600'}`}>
                {MOIS_NOMS[selectedMois - 1]} {selectedAnnee}
                {isPaye && paiement?.date_paiement && ` — Paye le ${new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}`}
              </p>
              {isPaye && paiement?.mode_paiement && (
                <p className="text-xs text-green-500 mt-0.5">
                  Mode : {paiement.mode_paiement.replace('_', ' ')}
                  {paiement.reference_transaction && ` • Ref: ${paiement.reference_transaction}`}
                </p>
              )}
            </div>
          </div>
          {isPaye && (
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">{(paiement?.montant_paye || salaire.salaire_total).toLocaleString('fr-FR')}</p>
              <p className="text-sm text-green-500">GNF verses</p>
            </div>
          )}
        </div>
        <div className={`mt-4 pt-4 border-t border-dashed flex justify-end ${isPaye ? 'border-green-300' : 'border-amber-300'}`}>
          <button
            onClick={printBulletin}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${isPaye ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
          >
            <Printer className="w-4 h-4" />
            Imprimer mon bulletin de paie
          </button>
        </div>
      </div>

      {/* Detail du salaire */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Detail du bulletin — {MOIS_NOMS[selectedMois - 1]} {selectedAnnee}
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex justify-between items-center px-6 py-3 bg-blue-50/50">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Remuneration de base</span>
          </div>
          <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
            <span className="text-sm text-gray-600">Salaire de base</span>
            <span className="text-sm font-semibold text-gray-900">+{salaire.salaire_base.toLocaleString('fr-FR')} GNF</span>
          </div>

          {(salaire.prime_mensuelle > 0 || Number(salaire.prime_responsabilite || 0) > 0 || Number(salaire.prime_craie || 0) > 0) && (
            <>
              <div className="flex justify-between items-center px-6 py-3 bg-green-50/50">
                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Primes et avantages</span>
              </div>
              {salaire.prime_mensuelle > 0 && (
                <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
                  <span className="text-sm text-gray-600">Prime mensuelle</span>
                  <span className="text-sm font-semibold text-green-600">+{salaire.prime_mensuelle.toLocaleString('fr-FR')} GNF</span>
                </div>
              )}
              {Number(salaire.prime_responsabilite || 0) > 0 && (
                <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
                  <span className="text-sm text-gray-600">Prime de responsabilite</span>
                  <span className="text-sm font-semibold text-green-600">+{Number(salaire.prime_responsabilite).toLocaleString('fr-FR')} GNF</span>
                </div>
              )}
              {Number(salaire.prime_craie || 0) > 0 && (
                <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
                  <span className="text-sm text-gray-600">Prime de craie</span>
                  <span className="text-sm font-semibold text-green-600">+{Number(salaire.prime_craie).toLocaleString('fr-FR')} GNF</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center px-6 py-3 bg-red-50/50">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Cotisations et retenues</span>
          </div>
          {Number(salaire.retenue_sanction || 0) > 0 && (
            <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
              <span className="text-sm text-red-600 font-medium">Retenue pour sanction</span>
              <span className="text-sm font-semibold text-red-600">-{Number(salaire.retenue_sanction).toLocaleString('fr-FR')} GNF</span>
            </div>
          )}
          {Number(salaire.autres_retenues || 0) > 0 && (
            <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
              <span className="text-sm text-red-600 font-medium">Autres retenues</span>
              <span className="text-sm font-semibold text-red-600">-{Number(salaire.autres_retenues).toLocaleString('fr-FR')} GNF</span>
            </div>
          )}
          {Number(salaire.retenue_sanction || 0) === 0 && Number(salaire.autres_retenues || 0) === 0 && (
            <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
              <span className="text-sm text-gray-600">Retenues / Sanctions</span>
              <span className="text-sm text-gray-900">0 GNF</span>
            </div>
          )}

          <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
            <span className="font-bold text-gray-900">NET A PAYER</span>
            <span className="text-xl font-bold text-indigo-700">{salaire.salaire_total.toLocaleString('fr-FR')} GNF</span>
          </div>
        </div>
      </div>

      {/* Historique */}
      {historique.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" />
              Historique des paiements
            </h2>
            <div className="text-right">
              <p className="text-xs text-gray-900">{nbPayesHistorique} paiement(s)</p>
              <p className="text-sm font-bold text-purple-600">{totalPercu.toLocaleString('fr-FR')} GNF percus</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {historique.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.statut === 'paye' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.mois}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{MOIS_NOMS[item.mois - 1]} {item.annee}</p>
                    {item.date_paiement && (
                      <p className="text-xs text-gray-900">
                        Paye le {new Date(item.date_paiement).toLocaleDateString('fr-FR')}
                        {item.mode_paiement && ` - ${item.mode_paiement.replace('_', ' ')}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{item.montant.toLocaleString('fr-FR')} GNF</span>
                  {item.statut === 'paye'
                    ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Paye</span>
                    : <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium"><Clock className="w-3 h-3" /> En attente</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
