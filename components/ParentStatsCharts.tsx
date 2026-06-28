// components/ParentStatsCharts.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  CreditCard,
  FileText,
  Wallet,
  TrendingUp,
  GraduationCap,
  Calendar,
  DollarSign,
  BarChart3,
} from "lucide-react";

const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function ParentStatsCharts({ enfants, preinscriptions, statsEnfant, statsGlobales }) {
  // Données pour le graphique des paiements (barres)
  const paiementsData = enfants.map(enfant => {
    const stats = statsEnfant[enfant.eleve_id] || { paiements: { total_paye: 0 }, montant_a_payer: 0 };
    return {
      nom: `${enfant.prenom} ${enfant.nom}`,
      'Montant dû': stats.montant_a_payer || 0,
      'Montant payé': stats.paiements?.total_paye || 0,
    };
  });

  // Données pour l'évolution des paiements (courbe)
  const evolutionPaiementsData = enfants.map(enfant => {
    const stats = statsEnfant[enfant.eleve_id] || { paiements: { total_paye: 0 }, montant_a_payer: 0 };
    return {
      nom: `${enfant.prenom} ${enfant.nom}`,
      'Dû': stats.montant_a_payer || 0,
      'Payé': stats.paiements?.total_paye || 0,
      'Reste': Math.max(0, (stats.montant_a_payer || 0) - (stats.paiements?.total_paye || 0)),
    };
  });

  // Données pour les pré-inscriptions (barres)
  const preinscriptionsData = [
    { name: 'En attente', value: preinscriptions.filter(p => p.statut === 'en_attente').length },
    { name: 'Validées', value: preinscriptions.filter(p => p.statut === 'valide').length },
    { name: 'Rejetées', value: preinscriptions.filter(p => p.statut === 'rejete').length },
  ].filter(item => item.value > 0);

  // Données pour les notes par enfant (barres)
  const notesData = enfants.map(enfant => {
    const stats = statsEnfant[enfant.eleve_id] || { notes: [] };
    const notes = stats.notes || [];
    const moyenne = notes.length > 0 
      ? notes.reduce((acc, n) => acc + Number(n.moyenne || 0), 0) / notes.length 
      : 0;
    return {
      nom: `${enfant.prenom} ${enfant.nom}`,
      moyenne: Math.round(moyenne * 10) / 10,
    };
  }).filter(item => item.moyenne > 0);

  // Données pour les présences (barres empilées)
  const presencesData = enfants.map(enfant => {
    const stats = statsEnfant[enfant.eleve_id] || { presences: { total: 0, presents: 0, absents: 0, retards: 0 } };
    const p = stats.presences || { total: 0, presents: 0, absents: 0, retards: 0 };
    return {
      nom: `${enfant.prenom} ${enfant.nom}`,
      Présents: p.presents || 0,
      Absents: p.absents || 0,
      Retards: p.retards || 0,
    };
  });

  // Données pour les frais par catégorie (barres)
  const fraisParCategorieData = [
    { name: 'Inscription', montant: statsGlobales.totalFraisInscription || 0 },
    { name: 'Transport', montant: statsGlobales.totalTransport || 0 },
    { name: 'Cantine', montant: statsGlobales.totalCantine || 0 },
    { name: 'Fournitures', montant: statsGlobales.totalFournitures || 0 },
  ].filter(item => item.montant > 0);

  const hasPaiementsData = paiementsData.some(item => item['Montant dû'] > 0 || item['Montant payé'] > 0);
  const hasEvolutionData = evolutionPaiementsData.some(item => item.Dû > 0 || item.Payé > 0);
  const hasPreinscriptionsData = preinscriptionsData.length > 0;
  const hasNotesData = notesData.length > 0;
  const hasPresencesData = presencesData.some(item => item.Présents > 0 || item.Absents > 0 || item.Retards > 0);
  const hasFraisData = fraisParCategorieData.length > 0;

  return (
    <div className="space-y-6">
      {/* Ligne 2: Pré-inscriptions (barres) + Frais par catégorie (barres) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique des pré-inscriptions - BARRES */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Statut des pré-inscriptions
          </h3>
          {hasPreinscriptionsData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={preinscriptionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune pré-inscription disponible</p>
            </div>
          )}
        </div>

        {/* Graphique des frais par catégorie - BARRES */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Frais par catégorie
          </h3>
          {hasFraisData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fraisParCategorieData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${v.toLocaleString()} GNF`} />
                  <Legend />
                  <Bar dataKey="montant" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune donnée de frais disponible</p>
            </div>
          )}
        </div>
      </div>
      {/* Ligne 1: Paiements (barres) + Évolution (courbe) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique des paiements par enfant - BARRES */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Paiements par enfant
          </h3>
          {hasPaiementsData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paiementsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${v.toLocaleString()} GNF`} />
                  <Legend />
                  <Bar dataKey="Montant dû" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Montant payé" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune donnée de paiement disponible</p>
            </div>
          )}
        </div>

        {/* Graphique d'évolution des paiements - COURBE LINÉAIRE */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Évolution des paiements par enfant
          </h3>
          {hasEvolutionData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionPaiementsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${v.toLocaleString()} GNF`} />
                  <Legend />
                  <Line type="linear" dataKey="Dû" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="linear" dataKey="Payé" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="linear" dataKey="Reste" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune donnée d'évolution disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Ligne 3: Notes (barres) + Présences (barres empilées) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique des notes par enfant - BARRES */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-600" />
            Moyennes générales par enfant
          </h3>
          {hasNotesData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={notesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="moyenne" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune donnée de notes disponible</p>
            </div>
          )}
        </div>

        {/* Graphique des présences par enfant - BARRES EMPILÉES */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Présences par enfant
          </h3>
          {hasPresencesData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={presencesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nom" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Présents" stackId="a" fill="#10B981" />
                  <Bar dataKey="Absents" stackId="a" fill="#EF4444" />
                  <Bar dataKey="Retards" stackId="a" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Aucune donnée de présence disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Ligne 4: Résumé des totaux */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo-600" />
          Résumé des frais
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Wallet className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-600">{statsGlobales.totalAPayer.toLocaleString()} GNF</p>
            <p className="text-xs text-gray-600">Total à payer</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <CreditCard className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
            <p className="text-xs text-gray-600">Total payé</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <DollarSign className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className={`text-lg font-bold ${(statsGlobales.soldeRestant || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {statsGlobales.soldeRestant.toLocaleString()} GNF
            </p>
            <p className="text-xs text-gray-600">Solde restant</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-purple-600">
              {statsGlobales.totalAPayer > 0 
                ? `${Math.round((statsGlobales.totalPaye / statsGlobales.totalAPayer) * 100)}%`
                : '0%'}
            </p>
            <p className="text-xs text-gray-600">Taux de paiement</p>
          </div>
        </div>
      </div>
    </div>
  );
}