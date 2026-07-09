// app/dashboard/admin_bibliotheque/rapports/page.tsx
"use client";

import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import {
  BookOpen, BookMarked, Users, TrendingUp, Download,
  Printer, FileText, PieChart, Calendar, Clock,
  AlertCircle, User, CheckCircle, XCircle, Library
} from "lucide-react";

interface Livre {
  id: number;
  titre: string;
  auteur: string;
  isbn: string;
  quantite: number;
  disponible: number;
  emplacement: string;
  categorie: string;
  image_url?: string | null;
}

interface Emprunt {
  id: number;
  livre_titre: string;
  eleve_nom: string;
  classe_nom: string;
  date_emprunt: string;
  date_retour_prevue: string;
  date_retour_reelle: string | null;
  statut: string;
}

export default function BibliothequeRapportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [livres, setLivres] = useState<Livre[]>([]);
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [viewType, setViewType] = useState<'global' | 'livres' | 'emprunts'>('global');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resLivres, resEmprunts] = await Promise.all([
        fetch('/api/admin/bibliotheque/livres'),
        fetch('/api/admin/bibliotheque/emprunts')
      ]);
      if (resLivres.ok) setLivres(await resLivres.json());
      if (resEmprunts.ok) setEmprunts(await resEmprunts.json());
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = {
    totalLivres: livres.reduce((acc, l) => acc + l.quantite, 0),
    livresDispos: livres.reduce((acc, l) => acc + l.disponible, 0),
    totalEmprunts: emprunts.length,
    empruntsActifs: emprunts.filter(e => e.statut === 'en_cours' || e.statut === 'en_retard').length,
    empruntsRetard: emprunts.filter(e => e.statut === 'en_retard').length,
    empruntsRetournes: emprunts.filter(e => e.statut === 'retourne').length,
    tauxOccupation: livres.reduce((acc, l) => acc + l.quantite, 0) > 0
      ? Math.round(((livres.reduce((acc, l) => acc + l.quantite, 0) - livres.reduce((acc, l) => acc + l.disponible, 0)) / livres.reduce((acc, l) => acc + l.quantite, 0)) * 100)
      : 0,
    categories: new Set(livres.map(l => l.categorie)).size,
  };

  const formatPrix = (valeur: number) => {
    return new Intl.NumberFormat('fr-FR').format(valeur);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  // Exporter en Excel
  const exporterExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Feuille "Résumé"
      const resumeData = [
        ['RAPPORT BIBLIOTHÈQUE - E.I.E.F'],
        [`Date: ${new Date().toLocaleString()}`],
        [],
        ['Indicateur', 'Valeur'],
        ['Total livres', stats.totalLivres],
        ['Livres disponibles', stats.livresDispos],
        ['Total emprunts', stats.totalEmprunts],
        ['Emprunts en cours', stats.empruntsActifs],
        ['Emprunts en retard', stats.empruntsRetard],
        ['Emprunts retournés', stats.empruntsRetournes],
        ['Taux d\'occupation', `${stats.tauxOccupation}%`],
        ['Nombre de catégories', stats.categories]
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(resumeData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Résumé');

      // 2. Feuille "Livres"
      const livresData = [
        ['ID', 'Titre', 'Auteur', 'ISBN', 'Catégorie', 'Emplacement', 'Quantité', 'Disponible'],
        ...livres.map(l => [
          l.id,
          l.titre,
          l.auteur,
          l.isbn || '',
          l.categorie,
          l.emplacement,
          l.quantite,
          l.disponible
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(livresData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Livres');

      // 3. Feuille "Emprunts"
      const empruntsData = [
        ['ID', 'Livre', 'Élève', 'Classe', 'Date prêt', 'Retour prévu', 'Retour réel', 'Statut'],
        ...emprunts.map(e => [
          e.id,
          e.livre_titre,
          e.eleve_nom,
          e.classe_nom || '',
          formatDate(e.date_emprunt),
          formatDate(e.date_retour_prevue),
          e.date_retour_reelle ? formatDate(e.date_retour_reelle) : '-',
          e.statut === 'retourne' ? 'Retourné' : e.statut === 'en_retard' ? 'En retard' : 'En cours'
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(empruntsData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Emprunts');

      [ws1, ws2, ws3].forEach(ws => {
        ws['!cols'] = [
          { wch: 20 },
          { wch: 25 },
          { wch: 30 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 }
        ];
      });

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_bibliotheque_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur export Excel:", error);
      alert("Erreur lors de l'export Excel");
    }
  };

  const imprimer = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:block">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            Rapports Bibliothèque
          </h1>
          <p className="text-gray-500 mt-1">Consultez les statistiques de la bibliothèque</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={exporterExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter Excel
          </button>
          <button
            onClick={imprimer}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={fetchData}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"
          >
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 print:hidden">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Total livres</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalLivres}</p>
          <BookOpen className="w-4 h-4 text-blue-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Disponibles</p>
          <p className="text-2xl font-bold text-green-600">{stats.livresDispos}</p>
          <CheckCircle className="w-4 h-4 text-green-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Emprunts en cours</p>
          <p className="text-2xl font-bold text-orange-600">{stats.empruntsActifs}</p>
          <BookMarked className="w-4 h-4 text-orange-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">En retard</p>
          <p className="text-2xl font-bold text-red-600">{stats.empruntsRetard}</p>
          <AlertCircle className="w-4 h-4 text-red-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Taux occupation</p>
          <p className="text-2xl font-bold text-purple-600">{stats.tauxOccupation}%</p>
          <TrendingUp className="w-4 h-4 text-purple-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Catégories</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.categories}</p>
          <Library className="w-4 h-4 text-indigo-200 mt-1" />
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 print:hidden">
        <button
          onClick={() => setViewType('global')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewType === 'global'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PieChart className="w-4 h-4 inline mr-2" />
          Vue globale
        </button>
        <button
          onClick={() => setViewType('livres')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewType === 'livres'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Livres ({livres.length})
        </button>
        <button
          onClick={() => setViewType('emprunts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewType === 'emprunts'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookMarked className="w-4 h-4 inline mr-2" />
          Emprunts ({emprunts.length})
        </button>
      </div>

      {/* Vue globale */}
      {viewType === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Résumé de la bibliothèque
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Total livres</span>
                <span className="font-bold text-blue-600">{stats.totalLivres}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Livres disponibles</span>
                <span className="font-bold text-green-600">{stats.livresDispos}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Emprunts en cours</span>
                <span className="font-bold text-orange-600">{stats.empruntsActifs}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">En retard</span>
                <span className="font-bold text-red-600">{stats.empruntsRetard}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taux d'occupation</span>
                <span className="font-bold text-purple-600">{stats.tauxOccupation}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Dernières activités
            </h3>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Derniers emprunts</h4>
              {emprunts.slice(0, 5).map((e) => (
                <div key={e.id} className="flex justify-between items-center border-b border-gray-100 pb-2 text-sm">
                  <span className="text-gray-600">{e.livre_titre}</span>
                  <span className="text-gray-500 text-xs">{e.eleve_nom}</span>
                  <span className={`text-xs ${
                    e.statut === 'retourne' ? 'text-green-600' :
                    e.statut === 'en_retard' ? 'text-red-600' :
                    'text-orange-600'
                  }`}>
                    {e.statut === 'retourne' ? '✅' :
                     e.statut === 'en_retard' ? '⚠️' :
                     '📖'}
                  </span>
                </div>
              ))}
              {emprunts.length === 0 && (
                <p className="text-gray-500 text-sm">Aucun emprunt récent</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vue Livres */}
      {viewType === 'livres' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Auteur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantité</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Disponible</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Occupation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {livres.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.titre}</td>
                    <td className="px-4 py-3 text-gray-600">{l.auteur}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{l.categorie}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{l.quantite}</td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">{l.disponible}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        l.quantite > 0 ? (l.disponible / l.quantite) * 100 < 30 ? 'text-red-600' : 'text-green-600' : 'text-gray-400'
                      }`}>
                        {l.quantite > 0 ? Math.round(((l.quantite - l.disponible) / l.quantite) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
                {livres.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Aucun livre</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue Emprunts */}
      {viewType === 'emprunts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Livre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élève</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date prêt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Retour prévu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emprunts.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.livre_titre}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{e.eleve_nom}</div>
                      <div className="text-xs text-gray-400">{e.classe_nom}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(e.date_emprunt)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(e.date_retour_prevue)}</td>
                    <td className="px-4 py-3 text-center">
                      {e.statut === 'en_cours' && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">📖 En cours</span>
                      )}
                      {e.statut === 'retourne' && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✅ Retourné</span>
                      )}
                      {e.statut === 'en_retard' && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">⚠️ En retard</span>
                      )}
                    </td>
                  </tr>
                ))}
                {emprunts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <BookMarked className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Aucun emprunt</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100 print:hidden">
        <p>Rapport généré le {new Date().toLocaleString()}</p>
        <p>© {new Date().getFullYear()} E.I.E.F - Module Bibliothèque</p>
      </div>
    </div>
  );
}