//app/dashboard/eleve/quiz/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, CheckCircle, AlertCircle, Play, 
  Brain, ChevronRight, Check, X, FileText, Download,
  Image, File, Award, Zap, Sparkles
} from "lucide-react";

interface Option {
  id: number;
  option_texte: string;
  est_correcte: boolean;
}

interface Question {
  id: number;
  question: string;
  explication: string;
  difficulte: string;
  points: number;
  temps_secondes: number;
  options: Option[];
}

interface QuizData {
  quiz: {
    id: number;
    titre: string;
    description: string;
    duree_minutes: number;
    fichier_url?: string;
    categorie_nom: string;
    categorie_couleur: string;
    afficher_resultats: boolean;
  };
  questions: Question[];
  dejaTermine: boolean;
  enCours: boolean;
  reponsesExistantes: any[];
  resultat: any | null;
  participation: any | null;
}

export default function PasserQuizPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [reponses, setReponses] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/eleve/quiz/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          setTimeLeft(d.quiz.duree_minutes * 60);
          // Restaurer les réponses si en cours
          if (d.enCours && d.reponsesExistantes) {
            const restored: Record<number, number> = {};
            d.reponsesExistantes.forEach((r: any) => {
              restored[r.question_id] = r.option_id;
            });
            setReponses(restored);
            setStarted(true);
          }
        }
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (started && timeLeft > 0 && !data?.dejaTermine) {
      const timerId = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (started && timeLeft <= 0 && !data?.dejaTermine) {
      handleSubmit();
    }
  }, [started, timeLeft, data]);

  const handleOptionSelect = (qId: number, oId: number) => {
    setReponses((prev) => ({ ...prev, [qId]: oId }));
  };

  const handleNext = () => {
    if (currentQ < (data?.questions.length || 0) - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  const handleSubmit = async () => {
    if (!data || data.questions.length === 0) {
      alert("Ce quiz n'a pas de questions.");
      return;
    }

    const totalQuestions = data.questions.length;
    const answered = Object.keys(reponses).length;
    
    if (answered < totalQuestions) {
      const confirmSubmit = confirm(
        `Vous avez répondu à ${answered}/${totalQuestions} questions. Voulez-vous vraiment soumettre ?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitLoading(true);
    const reponsesArray = Object.entries(reponses).map(([qId, oId]) => ({
      question_id: parseInt(qId),
      option_id: oId,
    }));

    const tempsMs = startTime ? Date.now() - startTime : 0;

    try {
      const res = await fetch(`/api/eleve/quiz/${params.id}/repondre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reponses: reponsesArray,
          temps_total_ms: tempsMs 
        }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur de soumission");
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    if (!url) return 'other';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) return 'image';
    if (url.endsWith('.pdf')) return 'pdf';
    return 'other';
  };

  const getFileName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const getDifficulteLabel = (diff: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      facile: { label: '🟢 Facile', color: 'text-green-600 bg-green-50' },
      moyen: { label: '🟡 Moyen', color: 'text-orange-600 bg-orange-50' },
      difficile: { label: '🔴 Difficile', color: 'text-red-600 bg-red-50' },
    };
    return labels[diff] || { label: diff, color: 'text-gray-600 bg-gray-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <p>{error || "Quiz introuvable"}</p>
        <Link href="/dashboard/eleve/quiz" className="text-purple-600 text-sm mt-2 block hover:underline">
          ← Retour aux quiz
        </Link>
      </div>
    );
  }

  const { quiz, questions, dejaTermine, resultat } = data;
  const fileType = getFileType(quiz.fichier_url || '');

  // ⭐ RÉSULTATS
  if (dejaTermine && resultat) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard/eleve/quiz" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux quiz
        </Link>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" 
               style={{ backgroundColor: `${quiz.categorie_couleur || '#6B46C1'}20` }}>
            {resultat.pourcentage >= 70 ? (
              <Sparkles className="w-10 h-10 text-yellow-500" />
            ) : resultat.pourcentage >= 50 ? (
              <Zap className="w-10 h-10 text-orange-500" />
            ) : (
              <Brain className="w-10 h-10 text-purple-500" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">Quiz terminé !</h1>
          <p className="text-gray-500 mt-1">
            <span style={{ color: quiz.categorie_couleur || '#6B46C1' }}>
              {quiz.categorie_nom}
            </span> • {quiz.titre}
          </p>

          <div className="flex justify-center gap-8 mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Score</p>
              <p className={`text-4xl font-black ${resultat.pourcentage >= 70 ? 'text-green-600' : resultat.pourcentage >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                {resultat.points_obtenus}
                <span className="text-xl text-gray-400">/{questions.reduce((sum, q) => sum + q.points, 0)}</span>
              </p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-sm text-gray-500">Pourcentage</p>
              <p className="text-4xl font-black text-purple-600">{resultat.pourcentage}<span className="text-xl text-gray-400">%</span></p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-sm text-gray-500">Correctes</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{resultat.reponses_correctes} / {resultat.reponses_totales}</p>
            </div>
          </div>

          {/* Affichage des réponses détaillées */}
          {quiz.afficher_resultats && resultat.reponses && (
            <div className="mt-6 text-left space-y-4">
              <h3 className="font-semibold text-gray-900">Détail des réponses</h3>
              {resultat.reponses.map((r: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-xl border ${r.est_correcte ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {r.est_correcte ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{r.question}</p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Votre réponse :</span> {r.option_texte}
                        {!r.est_correcte && r.explication && (
                          <span className="block mt-1 text-xs text-gray-500">
                            💡 {r.explication}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quiz.fichier_url && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 inline-flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">📎 Sujet du quiz</p>
                <a 
                  href={quiz.fichier_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                >
                  {getFileName(quiz.fichier_url)}
                  <Download className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          <Link
            href="/dashboard/eleve/quiz"
            className="inline-block mt-6 bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition"
          >
            Voir tous les quiz
          </Link>
        </div>
      </div>
    );
  }

  // ⭐ Si le quiz n'a pas de questions
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Link href="/dashboard/eleve/quiz" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="bg-white rounded-2xl p-10 border border-yellow-100 shadow-lg">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.titre}</h1>
          <p className="text-gray-500">Ce quiz n'a pas encore de questions.</p>
        </div>
      </div>
    );
  }

  // ⭐ ÉCRAN DE DÉBUT
  if (!started) {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Link href="/dashboard/eleve/quiz" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        
        <div className="bg-white rounded-2xl p-10 border shadow-lg" 
             style={{ borderColor: `${quiz.categorie_couleur || '#6B46C1'}30` }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ backgroundColor: `${quiz.categorie_couleur || '#6B46C1'}20` }}>
            <Brain className="w-10 h-10" style={{ color: quiz.categorie_couleur || '#6B46C1' }} />
          </div>
          
          <span className="text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block"
                style={{ 
                  backgroundColor: `${quiz.categorie_couleur || '#6B46C1'}20`,
                  color: quiz.categorie_couleur || '#6B46C1'
                }}>
            {quiz.categorie_nom || 'Général'}
          </span>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.titre}</h1>
          <p className="text-gray-500 mb-6">{quiz.description || 'Quiz interactif'}</p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
              <BookOpen className="w-4 h-4" /> {questions.length} questions
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg text-orange-600 font-medium">
              <Clock className="w-4 h-4" /> {quiz.duree_minutes} minutes
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg text-purple-600 font-medium">
              <Award className="w-4 h-4" /> {totalPoints} points
            </div>
          </div>

          <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-xl text-left mb-8">
            <strong>📋 Règles du quiz :</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Le chronomètre démarre dès que vous cliquez sur "Commencer".</li>
              <li>Vous ne pouvez pas mettre en pause le quiz.</li>
              <li>Si le temps est écoulé, vos réponses seront soumises automatiquement.</li>
              <li>Vous ne pouvez passer le quiz qu'une seule fois.</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setStarted(true);
              setStartTime(Date.now());
            }}
            className="text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2 mx-auto"
            style={{ backgroundColor: quiz.categorie_couleur || '#6B46C1' }}
          >
            <Play className="w-5 h-5 fill-current" />
            Commencer le quiz
          </button>
        </div>
      </div>
    );
  }

  // ⭐ INTERFACE DU QUIZ EN COURS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const question = questions[currentQ];
  const answeredCount = Object.keys(reponses).length;
  const isLast = currentQ === questions.length - 1;
  const difficulte = getDifficulteLabel(question.difficulte);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header collant */}
      <div className="sticky top-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-purple-50 text-purple-700 font-semibold px-3 py-1.5 rounded-lg text-sm">
            Question {currentQ + 1} / {questions.length}
          </div>
          <div className="text-sm text-gray-500">
            {answeredCount} répondues
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-lg ${
          timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-800'
        }`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Sujet du quiz */}
      {quiz.fichier_url && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-purple-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">📎 Sujet du quiz</span>
              </div>
              <a 
                href={quiz.fichier_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Télécharger
              </a>
            </div>
          </div>
          <div className="p-4">
            {fileType === 'image' && (
              <div className="relative">
                <img 
                  src={quiz.fichier_url} 
                  alt="Sujet du quiz"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-white"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">{getFileName(quiz.fichier_url)}</p>
              </div>
            )}
            {fileType === 'pdf' && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                <FileText className="w-16 h-16 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Document PDF</p>
                <a 
                  href={quiz.fichier_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-800 hover:underline font-medium"
                >
                  📄 Ouvrir le PDF
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-gray-50">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-400">Q{currentQ + 1}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${difficulte.color}`}>
                {difficulte.label}
              </span>
            </div>
            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
              {question.points} {question.points > 1 ? 'pts' : 'pt'}
            </span>
          </div>
          <h2 className="text-xl font-medium text-gray-900 leading-relaxed">{question.question}</h2>
        </div>

        <div className="p-8 space-y-3">
          {question.options.map((opt) => {
            const isSelected = reponses[question.id] === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleOptionSelect(question.id, opt.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center justify-between group ${
                  isSelected
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-100 bg-white hover:border-purple-200 hover:bg-gray-50"
                }`}
              >
                <span className={`text-[15px] ${isSelected ? "text-purple-900 font-medium" : "text-gray-700"}`}>
                  {opt.option_texte}
                </span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "border-purple-600 bg-purple-600" : "border-gray-300"
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handlePrev}
          disabled={currentQ === 0}
          className="px-6 py-2.5 rounded-xl font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>

        {!isLast ? (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl font-medium text-white hover:shadow-sm flex items-center gap-2"
            style={{ backgroundColor: quiz.categorie_couleur || '#6B46C1' }}
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitLoading}
            className="px-8 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-md disabled:opacity-60"
          >
            {submitLoading ? "Envoi..." : (
              <>
                <Check className="w-5 h-5" /> Soumettre le quiz
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-8">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQ(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              idx === currentQ
                ? "w-6"
                : reponses[q.id]
                ? "bg-purple-300"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            style={idx === currentQ ? { backgroundColor: quiz.categorie_couleur || '#6B46C1' } : {}}
            aria-label={`Question ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}