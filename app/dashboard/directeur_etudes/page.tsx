"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  FileText,
  BarChart3,
  Loader2,
  ArrowRight,
  PlusCircle,
  Printer,
  CheckCircle2,
  Clock,
  BookOpen,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface StatsData {
  classesActives: number;
  notesSaisies: number;
  elevesInscrits: number;
  elevesEvalues: number;
  recentNotes?: Array<{
    id: number;
    valeur: number;
    coefficient: number;
    type_note: string;
    date_saisie: string;
    eleve_prenom: string;
    eleve_nom: string;
    classe_nom: string;
    matiere_nom: string;
  }>;
  classesOverview?: Array<{
    id: number;
    nom: string;
    niveau: string;
    total_eleves: number;
    total_notes: number;
  }>;
}

export default function DirecteurEtudesDashboard() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/directeur_etudes/stats");
      if (!res.ok) {
        throw new Error("Impossible de charger les statistiques.");
      }
      const data = await res.json();
      setStatsData(data);
    } catch (err: any) {
      console.error("Erreur chargement dashboard DE:", err);
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-gray-900">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900">Erreur de chargement</h3>
        <p className="text-sm text-red-600 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );
  }

  const evaluesPourcentage = statsData?.elevesInscrits && statsData.elevesInscrits > 0
    ? Math.round((statsData.elevesEvalues / statsData.elevesInscrits) * 100)
    : 0;

  const stats = [
    {
      title: "Classes actives",
      value: statsData?.classesActives || 0,
      subtitle: "Classes sous supervision",
      icon: GraduationCap,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Élèves inscrits",
      value: statsData?.elevesInscrits || 0,
      subtitle: "Effectif total scolarisé",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      title: "Notes enregistrées",
      value: statsData?.notesSaisies || 0,
      subtitle: "Évaluations en BDD",
      icon: FileText,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100"
    },
    {
      title: "Taux d'évaluation",
      value: `${evaluesPourcentage}%`,
      subtitle: `${statsData?.elevesEvalues || 0} élèves avec notes`,
      icon: BarChart3,
      color: "bg-amber-50 text-amber-600 border-amber-100"
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4">
          <BookOpen className="w-96 h-96" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Espace Pédagogique & Direction des Études
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tableau de Bord - Directeur des Études
            </h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-xl">
              Supervisez la saisie des notes, gérez le suivi académique et éditez les bulletins officiels.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchStats}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition border border-white/10"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Link
              href="/dashboard/directeur_etudes/notes"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-500/30"
            >
              <PlusCircle className="w-4 h-4" /> Saisir les notes
            </Link>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{stat.title}</span>
                <div className={`p-3 rounded-xl border ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
                <p className="text-xs font-medium text-gray-900 mt-1">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
              <FileText className="w-5 h-5 text-blue-600" /> Saisie & Validation des Notes
            </div>
            <p className="text-xs text-blue-700/80">
              Accédez aux fiches de saisie par classe et matière pour renseigner et réviser les notes.
            </p>
          </div>
          <Link
            href="/dashboard/directeur_etudes/notes"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm"
          >
            Accéder <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-2xl border border-amber-100 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-lg">
              <Printer className="w-5 h-5 text-amber-600" /> Édition des Bulletins
            </div>
            <p className="text-xs text-amber-700/80">
              Générez et imprimez les bulletins scolaires avec moyennes générales et classement par rang.
            </p>
          </div>
          <Link
            href="/dashboard/directeur_etudes/bulletins"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm"
          >
            Consulter <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* MAIN TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: DERNIÈRES NOTES SAISIES */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Dernières Notes Saisies
              </h2>
              <p className="text-xs text-gray-900">Historique récent des évaluations entrées en BDD</p>
            </div>
            <Link
              href="/dashboard/directeur_etudes/notes"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!statsData?.recentNotes || statsData.recentNotes.length === 0 ? (
            <div className="p-8 text-center text-gray-900 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Aucune note enregistrée récemment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-900 uppercase font-semibold">
                    <th className="pb-3">Élève</th>
                    <th className="pb-3">Classe</th>
                    <th className="pb-3">Matière</th>
                    <th className="pb-3">Note</th>
                    <th className="pb-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {statsData.recentNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3 font-semibold text-gray-900">
                        {note.eleve_prenom} {note.eleve_nom}
                      </td>
                      <td className="py-3 text-gray-600 text-xs">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                          {note.classe_nom || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-700 font-medium">{note.matiere_nom}</td>
                      <td className="py-3 font-bold text-blue-600">
                        {note.valeur}/20
                        <span className="text-[10px] text-gray-900 font-normal ml-1">(coef {note.coefficient})</span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${note.type_note === 'examen'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}>
                          {note.type_note || 'devoir'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: VUE D'ENSEMBLE DES CLASSES */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" /> Vue des Classes
              </h2>
              <p className="text-xs text-gray-900">Supervision des effectifs et évaluations</p>
            </div>
          </div>

          {!statsData?.classesOverview || statsData.classesOverview.length === 0 ? (
            <div className="p-8 text-center text-gray-900 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Aucune classe disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statsData.classesOverview.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 bg-gray-50/80 hover:bg-emerald-50/50 rounded-xl border border-gray-100 transition flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{cls.nom}</h4>
                    <p className="text-xs text-gray-900 mt-0.5">
                      {cls.total_eleves} élève{cls.total_eleves > 1 ? 's' : ''} inscrit{cls.total_eleves > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-600 px-2.5 py-1 bg-emerald-100/60 rounded-lg">
                      {cls.total_notes} note{cls.total_notes > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
