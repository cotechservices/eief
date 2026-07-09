// app/dashboard/eleve/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, Calendar, Clock, CheckCircle, AlertCircle,
  Download, TrendingUp, Award, FileText, Brain, ClipboardList,
  HelpingHand, HelpCircle
} from "lucide-react";

interface Profil {
  prenom: string;
  nom: string;
  classe_nom: string;
  classe_niveau: string;
  annee_scolaire: string;
  matricule: string;
}

interface Matiere {
  matiere: string;
  moyenne: number;
  coefficient: number;
  nbNotes: number;
}

interface Devoir {
  id: number;
  titre: string;
  matiere: string;
  date_limite: string;
  statut: string;
  joursRestants: number;
  enseignant: string;
}

export default function EleveDashboard() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [notesData, setNotesData] = useState<{
    matieres: Matiere[];
    moyenneGenerale: number;
  } | null>(null);
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [profilRes, notesRes, devoirsRes] = await Promise.all([
          fetch("/api/eleve/profil"),
          fetch("/api/eleve/notes"),
          fetch("/api/eleve/devoirs"),
        ]);

        if (profilRes.ok) {
          const d = await profilRes.json();
          setProfil(d.profil);
        }
        if (notesRes.ok) {
          const d = await notesRes.json();
          setNotesData(d);
        }
        if (devoirsRes.ok) {
          const d = await devoirsRes.json();
          setDevoirs(d.devoirs || []);
        }
      } catch (err: any) {
        setError("Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const devoirsARendreOuRetard = devoirs.filter((d) =>
    d.statut === "a_rendre" || d.statut === "en_retard"
  );
  const devoirsRetard = devoirs.filter((d) => d.statut === "en_retard");

  const getMoyenneColor = (moy: number) =>
    moy >= 14 ? "text-green-600" : moy >= 10 ? "text-orange-500" : "text-red-500";

  const getMoyenneBg = (moy: number) =>
    moy >= 14 ? "from-green-500 to-green-600" : moy >= 10 ? "from-orange-400 to-orange-500" : "from-red-500 to-red-600";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Bonjour {profil?.prenom || "Élève"} ! 👋
          </h1>
          <p className="text-gray-900 font-semibold mt-1">
            Elève de la {profil?.classe_nom || "—"}  • Année scolaire {profil?.annee_scolaire || "—"}  • Matricule : {" "}
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
              {profil?.matricule}
            </span>
          </p>
        </div>
        <Link
          href="/dashboard/eleve/messages"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          <HelpCircle className="w-4 h-4" />
          Demander de l'aide
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          className={`bg-gradient-to-br ${getMoyenneBg(notesData?.moyenneGenerale || 0)} rounded-2xl shadow-sm p-5 text-white`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">Moyenne générale de l'annee_scolaire</p>
              <p className="text-4xl font-bold mt-1">
                {notesData?.moyenneGenerale?.toFixed(2) || "—"}
              </p>
            </div>
            <div className="bg-white/20 p-2 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Devoirs à rendre</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">
                {devoirsARendreOuRetard.length}
              </p>
              {devoirsRetard.length > 0 && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {devoirsRetard.length} en retard
                </p>
              )}
            </div>
            <div className="bg-orange-50 p-2 rounded-xl">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Devoirs soumis</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {devoirs.filter((d) => d.statut === "soumis").length}
              </p>
              <p className="text-xs text-gray-400 mt-2">/ {devoirs.length} total</p>
            </div>
            <div className="bg-green-50 p-2 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Espaces rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            href: "/dashboard/eleve/bulletin",
            icon: Award,
            label: "Bulletin de notes",
            color: "blue",
          },
          {
            href: "/dashboard/eleve/quiz",
            icon: Brain,
            label: "Quiz & Jeux",
            color: "purple",
          },
          {
            href: "/dashboard/eleve/devoirs",
            icon: FileText,
            label: "Mes devoirs",
            color: "orange",
          },
          {
            href: "/dashboard/eleve/examens",
            icon: ClipboardList,
            label: "Évaluations",
            color: "purple",
          },
          {
            href: "/dashboard/eleve/quiz",
            icon: Brain,
            label: "Espace révision",
            color: "green",
          },
        ].map((item) => {
          const Icon = item.icon;
          const colors: Record<string, string> = {
            blue: "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-100",
            orange: "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white border-orange-100",
            purple: "bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border-purple-100",
            green: "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border-green-100",
          };
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all group ${colors[item.color]}`}
            >
              <Icon className="w-7 h-7" />
              <span className="text-sm font-medium text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes par matière */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Mes moyennes par matière
            </h3>
            <Link href="/dashboard/eleve/bulletin" className="text-blue-600 text-xs hover:underline">
              Voir bulletin →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {notesData?.matieres && notesData.matieres.length > 0 ? (
              notesData.matieres.slice(0, 6).map((m, idx) => (
                <div key={idx} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{m.matiere}</p>
                    <div className="mt-1.5 bg-gray-100 rounded-full h-1.5 w-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          m.moyenne >= 14 ? "bg-green-500" : m.moyenne >= 10 ? "bg-orange-400" : "bg-red-500"
                        }`}
                        style={{ width: `${(m.moyenne / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <span className={`text-lg font-bold ${getMoyenneColor(m.moyenne)}`}>
                      {m.moyenne.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">/20</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune note disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Devoirs à rendre */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Devoirs à rendre
            </h3>
            <Link href="/dashboard/eleve/devoirs" className="text-blue-600 text-xs hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {devoirsARendreOuRetard.length > 0 ? (
              devoirsARendreOuRetard.slice(0, 5).map((d) => {
                const isRetard = d.statut === "en_retard";
                return (
                  <Link
                    key={d.id}
                    href={`/dashboard/eleve/devoirs/${d.id}`}
                    className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isRetard ? "bg-red-500" : "bg-orange-400"
                          }`}
                        />
                        <p className="font-medium text-gray-900 text-sm truncate">{d.titre}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 ml-4">{d.matiere}</p>
                    </div>
                    <div className="ml-3 text-right flex-shrink-0">
                      {isRetard ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-medium">
                          En retard
                        </span>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded-lg font-medium ${
                            d.joursRestants <= 2
                              ? "bg-red-100 text-red-600"
                              : d.joursRestants <= 5
                              ? "bg-orange-100 text-orange-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {d.joursRestants > 0 ? `J-${d.joursRestants}` : "Aujourd'hui"}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">Tous les devoirs sont à jour ! 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}