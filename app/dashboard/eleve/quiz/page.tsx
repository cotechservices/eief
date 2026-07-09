// app/dashboard/eleve/quiz/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Brain, CheckCircle, Clock, BookOpen, ChevronRight, 
  Zap, Award, FileText, AlertCircle, TrendingUp, 
  Star, Sparkles
} from "lucide-react";

interface Quiz {
  id: number;
  titre: string;
  description: string;
  type: string;
  duree_minutes: number;
  est_actif: boolean;
  date_debut: string | null;
  date_fin: string | null;
  categorie_id: number;
  categorie_nom: string;
  categorie_couleur: string;
  categorie_icon: string;
  nb_questions: number;
  total_points: number;
  statut: 'non_commence' | 'en_cours' | 'termine';
  participation_id?: number;
  points_obtenus?: number;
  pourcentage?: number;
  fichier_url?: string;
}

export default function EleveQuizPage() {
  const [quiz, setQuiz] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'disponible' | 'termine'>('all');

  useEffect(() => {
    fetch("/api/eleve/quiz")
      .then((r) => r.json())
      .then((d) => {
        if (d.quiz) setQuiz(d.quiz);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredQuiz = quiz.filter(q => {
    if (filter === 'disponible') return q.statut !== 'termine';
    if (filter === 'termine') return q.statut === 'termine';
    return true;
  });

  const disponible = quiz.filter(q => q.statut !== 'termine');
  const termines = quiz.filter(q => q.statut === 'termine');

  const getCategorieIcon = (iconName: string) => {
    const icons: Record<string, any> = { 
      BookOpen, Zap, Brain, Star, Sparkles, Award, TrendingUp 
    };
    const Icon = icons[iconName] || BookOpen;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            Quiz & Jeux
          </h1>
          <p className="text-gray-500 mt-1">Entraînez-vous avec des quiz interactifs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {disponible.length} quiz disponible{disponible.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{quiz.length}</p>
          <p className="text-xs text-purple-500 mt-1">Quiz disponibles</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{disponible.length}</p>
          <p className="text-xs text-blue-500 mt-1">À faire</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{termines.length}</p>
          <p className="text-xs text-green-500 mt-1">Terminés</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('disponible')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'disponible' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          À faire
        </button>
        <button
          onClick={() => setFilter('termine')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'termine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Terminés
        </button>
      </div>

      {filteredQuiz.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">Aucun quiz disponible</p>
          <p className="text-sm mt-1">Vos enseignants n'ont pas encore créé de quiz</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuiz.map((q) => {
            const isTermine = q.statut === 'termine';
            const isEnCours = q.statut === 'en_cours';
            
            return (
              <Link
                key={q.id}
                href={`/dashboard/eleve/quiz/${q.id}`}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition group ${
                  isTermine ? 'border-gray-100 opacity-80' : 'border-purple-100 hover:border-purple-300'
                }`}
              >
                {/* Bandeau couleur catégorie */}
                <div 
                  className="h-1.5" 
                  style={{ backgroundColor: q.categorie_couleur || '#6B46C1' }}
                />

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span 
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                      style={{ 
                        backgroundColor: `${q.categorie_couleur || '#6B46C1'}20`,
                        color: q.categorie_couleur || '#6B46C1'
                      }}
                    >
                      {getCategorieIcon(q.categorie_icon)}
                      {q.categorie_nom || 'Général'}
                    </span>
                    {isTermine ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                        <CheckCircle className="w-3 h-3" /> Terminé
                      </span>
                    ) : isEnCours ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                        <Clock className="w-3 h-3" /> En cours
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> Disponible
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{q.titre}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {q.description || 'Quiz interactif'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" /> Questions
                      </span>
                      <span className="font-medium text-gray-900">{q.nb_questions}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" /> Durée
                      </span>
                      <span className="font-medium text-gray-900">{q.duree_minutes} min</span>
                    </div>
                    {q.fichier_url && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" /> Fichier
                        </span>
                        <span className="text-xs text-purple-500">📎 Joint</span>
                      </div>
                    )}
                    {isTermine && q.points_obtenus !== undefined && q.pourcentage !== undefined && (
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-400" /> Score
                        </span>
                        <span className={`font-bold ${
                          q.pourcentage >= 70 ? 'text-green-600' : 
                          q.pourcentage >= 50 ? 'text-orange-500' : 'text-red-500'
                        }`}>
                          {q.points_obtenus} pts ({q.pourcentage}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {isTermine ? 'Voir les résultats →' : 'Commencer →'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}