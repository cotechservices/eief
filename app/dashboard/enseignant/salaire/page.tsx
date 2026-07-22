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
  salaire_total: number;
}

interface Paiement {
  statut: string;
  montant_paye: number;
  date_paiement: string;
  mode_paiement: string;
  reference_transaction: string;
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
    const reference = paiement?.reference_transaction || `SAL-${anneeLabel}${String(selectedMois).padStart(2, '0')}-${profil.matricule}`;
    const datePaiement = paiement?.date_paiement || new Date().toISOString().split('T')[0];

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin de Paie - ${profil.employe} - ${moisLabel} ${anneeLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 20px; }
    .page { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a3c6e; padding-bottom: 14px; margin-bottom: 16px; }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-area img { height: 70px; object-fit: contain; }
    .school-info h1 { font-size: 17px; font-weight: bold; color: #1a3c6e; }
    .school-info p { font-size: 10px; color: #555; line-height: 1.5; }
    .bulletin-title { text-align: right; }
    .bulletin-title h2 { font-size: 16px; font-weight: bold; color: #1a3c6e; text-transform: uppercase; letter-spacing: 1px; }
    .bulletin-title .period { font-size: 13px; color: #e05c00; font-weight: bold; margin-top: 4px; }
    .bulletin-title .ref { font-size: 9px; color: #888; margin-top: 3px; }
    .employee-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .info-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; }
    .info-box h3 { font-size: 10px; text-transform: uppercase; color: #1a3c6e; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 8px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .info-label { color: #666; font-size: 10px; }
    .info-value { font-weight: bold; font-size: 10px; color: #111; }
    .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .salary-table thead tr { background-color: #1a3c6e; color: white; }
    .salary-table thead th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
    .salary-table thead th:last-child, .salary-table thead th:nth-last-child(2) { text-align: right; }
    .salary-table tbody tr:nth-child(even) { background-color: #f7f9fc; }
    .salary-table tbody td { padding: 7px 10px; border-bottom: 1px solid #e8e8e8; font-size: 10px; }
    .salary-table tbody td:last-child, .salary-table tbody td:nth-last-child(2) { text-align: right; }
    .salary-table .cat { color: #1a3c6e; font-style: italic; font-size: 9px; background: #f0f4ff !important; font-weight: bold; }
    .salary-table tfoot tr { background-color: #1a3c6e; color: white; }
    .salary-table tfoot td { padding: 9px 10px; font-weight: bold; }
    .salary-table tfoot td:last-child { text-align: right; font-size: 14px; }
    .net-box { background: linear-gradient(135deg, #1a3c6e, #2563b0); color: white; border-radius: 8px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .net-box .label { font-size: 13px; font-weight: bold; text-transform: uppercase; }
    .net-box .amount { font-size: 22px; font-weight: bold; }
    .net-box .currency { font-size: 12px; opacity: 0.8; margin-left: 6px; }
    .net-box .mode { font-size: 10px; opacity: 0.75; margin-top: 3px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 10px; }
    .sig-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
    .sig-box .sig-title { font-size: 9px; text-transform: uppercase; color: #1a3c6e; font-weight: bold; margin-bottom: 40px; }
    .sig-box .sig-name { font-size: 9px; color: #555; border-top: 1px solid #ccc; padding-top: 4px; }
    .footer { margin-top: 16px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
    .footer span { color: #1a3c6e; }
    .unpaid-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 80px; color: rgba(255,0,0,0.07); font-weight: bold; text-transform: uppercase; pointer-events: none; white-space: nowrap; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="page">
    ${!paiement || paiement.statut !== 'paye' ? '<div class="unpaid-watermark">Brouillon</div>' : ''}
    <div class="header">
      <div class="logo-area">
        <img src="/img/logo.jpg" alt="Logo EIEF" onerror="this.style.display=none" />
        <div class="school-info">
          <h1>E.I.E.F</h1>
          <p>Ecole Internationale d Enseignement Francophone<br>Conakry, Republique de Guinee<br>Tel: +224 000 000 000</p>
        </div>
      </div>
      <div class="bulletin-title">
        <h2>Bulletin de Paie</h2>
        <div class="period">${moisLabel} ${anneeLabel}</div>
        <div class="ref">Ref: ${reference}</div>
      </div>
    </div>
    <div class="employee-section">
      <div class="info-box">
        <h3>Employeur</h3>
        <div class="info-row"><span class="info-label">Etablissement</span><span class="info-value">E.I.E.F</span></div>
        <div class="info-row"><span class="info-label">Adresse</span><span class="info-value">Conakry, Guinee</span></div>
        <div class="info-row"><span class="info-label">Periode</span><span class="info-value">${moisLabel} ${anneeLabel}</span></div>
        <div class="info-row"><span class="info-label">Date emission</span><span class="info-value">${new Date().toLocaleDateString('fr-FR')}</span></div>
      </div>
      <div class="info-box">
        <h3>Salarie</h3>
        <div class="info-row"><span class="info-label">Nom et Prenom</span><span class="info-value">${profil.employe}</span></div>
        <div class="info-row"><span class="info-label">Matricule</span><span class="info-value">${profil.matricule || '-'}</span></div>
        <div class="info-row"><span class="info-label">Poste</span><span class="info-value">${profil.poste}</span></div>
        <div class="info-row"><span class="info-label">Departement</span><span class="info-value">${profil.departement || '-'}</span></div>
        <div class="info-row"><span class="info-label">Statut</span><span class="info-value">${profil.statut_agent || 'Actif'}</span></div>
      </div>
    </div>
    <table class="salary-table">
      <thead>
        <tr>
          <th style="width:50%">Designation</th>
          <th>Base / Unite</th>
          <th>Taux</th>
          <th>Gains (GNF)</th>
          <th>Retenues (GNF)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="cat"><td colspan="5">REMUNERATION DE BASE</td></tr>
        <tr><td>Salaire de base</td><td>Mensuel</td><td>100%</td><td>${salaire.salaire_base.toLocaleString('fr-FR')}</td><td>-</td></tr>
        ${salaire.prime_mensuelle > 0 ? `<tr class="cat"><td colspan="5">PRIMES ET AVANTAGES</td></tr><tr><td>Prime mensuelle</td><td>Forfait</td><td>-</td><td>${salaire.prime_mensuelle.toLocaleString('fr-FR')}</td><td>-</td></tr>` : ''}
        <tr class="cat"><td colspan="5">COTISATIONS ET RETENUES</td></tr>
        <tr><td>Cotisation CNSS (employe)</td><td>Salaire brut</td><td>3.6%</td><td>-</td><td>0</td></tr>
        <tr><td>Impot sur le revenu (IR)</td><td>Salaire imposable</td><td>-</td><td>-</td><td>0</td></tr>
      </tbody>
      <tfoot>
        <tr><td colspan="3">TOTAL NET A PAYER</td><td>${salaire.salaire_total.toLocaleString('fr-FR')}</td><td>0</td></tr>
      </tfoot>
    </table>
    <div class="net-box">
      <div>
        <div class="label">Net a payer</div>
        <div class="mode">Mode: ${paiement?.mode_paiement || 'Virement bancaire'} - ${paiement?.statut === 'paye' ? 'Paye le ' + datePaiement : 'En attente'}</div>
      </div>
      <div>
        <span class="amount">${salaire.salaire_total.toLocaleString('fr-FR')}</span>
        <span class="currency">GNF</span>
      </div>
    </div>
    <div class="signatures">
      <div class="sig-box"><div class="sig-title">Le Salarie</div><div class="sig-name">${profil.employe}</div></div>
      <div class="sig-box"><div class="sig-title">Le Comptable</div><div class="sig-name">Signature et Cachet</div></div>
      <!--<div class="sig-box"><div class="sig-title">Direction Generale</div><div class="sig-name">Signature et Cachet</div></div>-->
    </div>
    <div class="footer">
      <p>Ce bulletin de paie doit etre conserve sans limitation de duree - <span>E.I.E.F (c) ${anneeLabel}</span> - Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}</p>
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
            <p className="text-sm text-gray-500 font-medium">Salaire de base</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{salaire.salaire_base.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400 mt-1">GNF / mois</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-50 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <p className="text-sm text-gray-500 font-medium">Prime mensuelle</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {salaire.prime_mensuelle > 0 ? `+${salaire.prime_mensuelle.toLocaleString('fr-FR')}` : '-'}
          </p>
          <p className="text-xs text-gray-400 mt-1">GNF</p>
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
          {salaire.prime_mensuelle > 0 && (
            <>
              <div className="flex justify-between items-center px-6 py-3 bg-green-50/50">
                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Primes et avantages</span>
              </div>
              <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-600">Prime mensuelle</span>
                <span className="text-sm font-semibold text-green-600">+{salaire.prime_mensuelle.toLocaleString('fr-FR')} GNF</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center px-6 py-3 bg-gray-50/50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cotisations et retenues</span>
          </div>
          <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
            <span className="text-sm text-gray-600">Cotisation CNSS (3.6%)</span>
            <span className="text-sm text-gray-400">0 GNF</span>
          </div>
          <div className="flex justify-between items-center px-6 py-3 hover:bg-gray-50">
            <span className="text-sm text-gray-600">Impot sur le revenu (IR)</span>
            <span className="text-sm text-gray-400">0 GNF</span>
          </div>
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
              <p className="text-xs text-gray-400">{nbPayesHistorique} paiement(s)</p>
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
                      <p className="text-xs text-gray-400">
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
