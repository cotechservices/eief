//app\dashboard\enseignant\quiz\page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, Search, BookOpen, Clock, BarChart2, 
  Edit2, Eye, Zap, Users, School, FileText
} from "lucide-react";

interface QuizItem {
  id: number;
  titre: string;
  description: string;
  type: string;
  duree_minutes: number;
  est_actif: boolean;
  date_debut: string | null;
  date_fin: string | null;
  nb_questions: number;
  nb_participations: number;
  moyenne_participations: number;
  classe_id: number;
  classe_nom: string;
  classe_niveau: string;
  matiere: string;
  fichier_url?: string;
  created_at: string;
}

export default function EnseignantQuizPage() {
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/enseignant/quiz")
      .then((r) => r.json())
      .then((d) => setQuiz(d.quiz || []))
      .finally(() => setLoading(false));
  }, []);

  const filteredQuiz = quiz.filter(q =>
    q.titre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête - comme pour les évaluations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-500" />
            Quiz & Jeux
          </h1>
          <p className="text-gray-500 mt-1">Quiz interactifs pour vos classes</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/enseignant/quiz/questions/nouveau"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" /> Nouvelle question
          </Link>
          <Link
            href="/dashboard/enseignant/quiz/nouveau"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition"
          >
            <Plus className="w-4 h-4" /> Nouveau quiz
          </Link>
        </div>
      </div>

      {/* Filtres - comme pour les évaluations */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un quiz..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
        />
      </div>

      {/* Liste des quiz - comme pour les évaluations */}
      {filteredQuiz.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">Aucun quiz créé</p>
          <p className="text-sm mt-1">Créez votre premier quiz pour une de vos classes</p>
          <Link
            href="/dashboard/enseignant/quiz/nouveau"
            className="inline-block mt-4 text-purple-600 hover:text-purple-700 font-medium"
          >
            + Créer un quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuiz.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
              <div className="p-5 border-b bg-gradient-to-br from-purple-50/50 to-white">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <School className="w-3 h-3" /> {q.classe_nom}
                  </span>
                  {q.est_actif ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Actif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      Inactif
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-1">{q.titre}</h3>
                <span className="text-xs text-gray-400">{q.matiere}</span>
                {q.fichier_url && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-purple-500">
                    <FileText className="w-3 h-3" /> Fichier joint
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" /> Durée
                    </span>
                    <span className="font-medium text-gray-900">{q.duree_minutes} min</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" /> Questions
                    </span>
                    <span className="font-medium text-gray-900">{q.nb_questions}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" /> Participants
                    </span>
                    <span className="font-medium text-gray-900">{q.nb_participations} élèves</span>
                  </div>
                  {q.nb_participations > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-gray-400" /> Moyenne
                      </span>
                      <span className="font-medium text-green-600">{q.moyenne_participations.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/enseignant/quiz/${q.id}`}
                    className="flex-1 text-center bg-purple-50 text-purple-700 py-2.5 rounded-xl font-medium text-sm hover:bg-purple-100 transition"
                  >
                    <Eye className="w-4 h-4 inline mr-1" /> Voir
                  </Link>
                  <Link
                    href={`/dashboard/enseignant/quiz/${q.id}/edit`}
                    className="flex-1 text-center bg-gray-50 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-100 transition"
                  >
                    <Edit2 className="w-4 h-4 inline mr-1" /> Modifier
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}