// app/dashboard/admin_bibliotheque/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, BookMarked, Users, FileText, TrendingUp,
  CheckCircle, Clock, AlertCircle, Library, BookA
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

export default function AdminTransportBibliothequeDashboard() {
  const [loading, setLoading] = useState(true);
  const [livres, setLivres] = useState<Livre[]>([]);
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLivres, resEmprunts] = await Promise.all([
        fetch('/api/admin/bibliotheque/livres'),
        fetch('/api/admin/bibliotheque/emprunts')
      ]);
      if (resLivres.ok) setLivres(await resLivres.json());
      if (resEmprunts.ok) setEmprunts(await resEmprunts.json());
    } catch (e) {
      console.error(e);
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
    empruntsActifs: emprunts.filter(e => e.statut === 'en_cours' || e.statut === 'en_retard').length,
    empruntsRetard: emprunts.filter(e => e.statut === 'en_retard').length,
    totalEmprunts: emprunts.length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Library className="w-7 h-7 text-purple-600" />
            Dashboard Bibliothèque
          </h1>
          <p className="text-gray-500 mt-1">Gestion des livres et des emprunts</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/admin_transport/bibliotheque/bibliotheque"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Gérer la bibliothèque
          </Link>
          <Link
            href="/dashboard/admin_transport/bibliotheque/rapports"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Rapports
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      {/* Détails supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Résumé
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Total emprunts</span>
              <span className="font-medium">{stats.totalEmprunts}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Taux d'occupation</span>
              <span className="font-medium">
                {stats.totalLivres > 0 
                  ? Math.round(((stats.totalLivres - stats.livresDispos) / stats.totalLivres) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Livres par catégorie</span>
              <span className="font-medium">{new Set(livres.map(l => l.categorie)).size}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <BookA className="w-4 h-4 text-purple-600" />
            Derniers emprunts
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {emprunts.slice(0, 5).map((e) => (
              <div key={e.id} className="flex justify-between items-center border-b border-gray-100 pb-2 text-sm">
                <span className="text-gray-600 truncate max-w-[120px]">{e.livre_titre}</span>
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
              <p className="text-gray-400 text-sm text-center py-4">Aucun emprunt</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}