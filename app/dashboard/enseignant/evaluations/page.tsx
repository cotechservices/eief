// app/dashboard/enseignant/evaluations/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Clock, Users, BookOpen, AlertCircle, Award } from "lucide-react";

interface Examen {
  id: number;
  titre: string;
  matiere: string;
  classe: string;
  duree_minutes: number;
  date_debut: string | null;
  date_fin: string | null;
  est_actif: boolean;
  nb_questions: number;
  total_points: number;
  nb_eleves_passes: number;
}

export default function EnseignantEvaluationsPage() {
  const [examens, setExamens] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/enseignant/examens")
      .then((r) => r.json())
      .then((d) => setExamens(d.examens || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-500" />
            Évaluations
          </h1>
          <p className="text-gray-500 mt-1">Vos examens interactifs en ligne</p>
        </div>
        <Link
          href="/dashboard/enseignant/evaluations/nouveau"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" /> Créer une évaluation
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examens.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Aucune évaluation créée</p>
            <p className="text-sm mt-1">Cliquez sur "Créer une évaluation" pour générer votre première évaluation interactive.</p>
          </div>
        ) : (
          examens.map((examen) => (
            <div key={examen.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
              <div className="p-5 border-b bg-gradient-to-br from-purple-50/50 to-white">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">
                    {examen.classe}
                  </span>
                  {examen.est_actif ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Actif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      Clôturé
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-1">{examen.titre}</h3>
                {/* ⭐ Supprimé l'affichage de la matière */}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" /> Durée
                    </span>
                    <span className="font-medium text-gray-900">{examen.duree_minutes} min</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-400" /> Questions
                    </span>
                    <span className="font-medium text-gray-900">
                      {examen.nb_questions} ({examen.total_points} pts)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" /> Participants
                    </span>
                    <span className="font-medium text-gray-900">{examen.nb_eleves_passes} élèves</span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/enseignant/evaluations/${examen.id}/resultats`}
                  className="w-full text-center bg-purple-50 text-purple-700 py-2.5 rounded-xl font-medium text-sm hover:bg-purple-100 transition"
                >
                  Voir les résultats
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}