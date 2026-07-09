"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ClipboardList, CheckCircle, Clock, BookOpen, ChevronRight, Lock, FileText 
} from "lucide-react";

interface Examen {
  id: number;
  titre: string;
  matiere: string;
  enseignant: string;
  duree_minutes: number;
  date_debut: string | null;
  date_fin: string | null;
  nb_questions: number;
  total_points: number;
  deja_passe: boolean;
  fichier_url?: string; // ⭐ Ajouté
}

export default function ExamensPage() {
  const [examens, setExamens] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/eleve/examens")
      .then((r) => r.json())
      .then((d) => setExamens(d.examens || []))
      .finally(() => setLoading(false));
  }, []);

  const aFaire = examens.filter((e) => !e.deja_passe);
  const passes = examens.filter((e) => e.deja_passe);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-600" />
          Évaluations en ligne
        </h1>
        <p className="text-gray-500 mt-1">QCM interactifs préparés par vos enseignants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{examens.length}</p>
          <p className="text-xs text-purple-500 mt-1">Examens disponibles</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{aFaire.length}</p>
          <p className="text-xs text-orange-500 mt-1">À passer</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{passes.length}</p>
          <p className="text-xs text-green-500 mt-1">Terminés</p>
        </div>
      </div>

      {/* Examens à passer */}
      {aFaire.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            À passer ({aFaire.length})
          </h2>
          <div className="space-y-3">
            {aFaire.map((examen) => (
              <Link
                key={examen.id}
                href={`/dashboard/eleve/examens/${examen.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-purple-300 hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                        {examen.matiere}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {examen.duree_minutes} min
                      </span>
                      {/* ⭐ Indicateur de fichier joint */}
                      {examen.fichier_url && (
                        <span className="text-xs text-purple-500 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-lg">
                          <FileText className="w-3 h-3" /> Sujet
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{examen.titre}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>{examen.nb_questions} questions</span>
                      <span>{examen.total_points} points au total</span>
                      <span>Par {examen.enseignant}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                      Commencer
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Examens passés */}
      {passes.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Examens terminés ({passes.length})
          </h2>
          <div className="space-y-3">
            {passes.map((examen) => (
              <Link
                key={examen.id}
                href={`/dashboard/eleve/examens/${examen.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition group opacity-80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                        {examen.matiere}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-lg font-medium">
                        <CheckCircle className="w-3 h-3" /> Terminé
                      </span>
                      {/* ⭐ Indicateur de fichier joint pour les examens passés */}
                      {examen.fichier_url && (
                        <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-lg">
                          <FileText className="w-3 h-3" /> Sujet
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-700">{examen.titre}</h3>
                    <p className="text-xs text-gray-400 mt-1">{examen.nb_questions} questions</p>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                    Voir résultats →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {examens.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune évaluation disponible pour le moment</p>
          <p className="text-sm mt-1">Vos enseignants n'ont pas encore publié</p>
        </div>
      )}
    </div>
  );
}