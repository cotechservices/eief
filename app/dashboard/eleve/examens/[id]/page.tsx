"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, CheckCircle, AlertCircle, Play, FileText, 
  ChevronRight, Check, Image, File, Download, Eye
} from "lucide-react";

interface Option {
  id: number;
  option_texte: string;
}

interface Question {
  id: number;
  question: string;
  points: number;
  options: Option[];
}

interface ExamenData {
  examen: {
    id: number;
    titre: string;
    matiere: string;
    duree_minutes: number;
    fichier_url?: string;
  };
  questions: Question[];
  dejaPassé: boolean;
  resultat: any | null;
}

// ⭐ Fonction pour déterminer le type de fichier
const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
  if (!url) return 'other';
  if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) return 'image';
  if (url.endsWith('.pdf')) return 'pdf';
  return 'other';
};

// ⭐ Fonction pour obtenir le nom du fichier
const getFileName = (url: string) => {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1];
};

export default function ExamenInteractifPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ExamenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(false);

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [reponses, setReponses] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/eleve/examens/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setData(d);
          setTimeLeft(d.examen.duree_minutes * 60);
        }
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (started && timeLeft <= 0) {
      handleSubmit();
    }
  }, [started, timeLeft]);

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
      alert("Cet examen n'a pas de questions à soumettre.");
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

    try {
      const res = await fetch(`/api/eleve/examens/${params.id}/repondre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reponses: reponsesArray }),
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
        <p>{error || "Examen introuvable"}</p>
        <Link href="/dashboard/eleve/examens" className="text-blue-600 text-sm mt-2 block">
          ← Retour
        </Link>
      </div>
    );
  }

  const { examen, questions, dejaPassé, resultat } = data;
  const fileType = getFileType(examen.fichier_url || '');

  // ⭐ RÉSULTATS
  if (dejaPassé && resultat) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard/eleve/examens" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux examens
        </Link>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Évaluation terminée</h1>
          <p className="text-gray-500 mt-1">{examen.titre} • {examen.matiere}</p>

          <div className="flex justify-center gap-8 mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Note obtenue</p>
              <p className="text-4xl font-black text-purple-600">{resultat.note}<span className="text-xl text-gray-400">/20</span></p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{resultat.score} / {resultat.totalPoints}</p>
            </div>
          </div>

          {examen.fichier_url && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 inline-flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">📎 Sujet de l'évaluation</p>
                <a 
                  href={examen.fichier_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                >
                  {getFileName(examen.fichier_url)}
                  <Download className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ⭐ Si l'examen n'a pas de questions
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Link href="/dashboard/eleve/examens" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="bg-white rounded-2xl p-10 border border-yellow-100 shadow-lg">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{examen.titre}</h1>
          <p className="text-gray-500">Cet examen n'a pas encore de questions.</p>
          <p className="text-sm text-gray-400 mt-2">Veuillez contacter votre enseignant.</p>
        </div>
      </div>
    );
  }

  // ⭐ ÉCRAN DE DÉBUT (SANS AFFICHER LE SUJET)
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Link href="/dashboard/eleve/examens" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="bg-white rounded-2xl p-10 border border-purple-100 shadow-lg">
          <FileText className="w-16 h-16 text-purple-200 mx-auto mb-4" />
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-3 inline-block">
            {examen.matiere}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{examen.titre}</h1>
          
          <div className="flex justify-center gap-6 text-sm text-gray-500 mb-8 mt-6">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
              <FileText className="w-4 h-4" /> {questions.length} questions
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg text-orange-600 font-medium">
              <Clock className="w-4 h-4" /> {examen.duree_minutes} minutes
            </div>
          </div>

          <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-xl text-left mb-8">
            <strong>Règles de l'évaluation :</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Le chronomètre démarre dès que vous cliquez sur "Commencer".</li>
              <li>Vous ne pouvez pas mettre en pause l'évaluation.</li>
              <li>Si le temps est écoulé, vos réponses seront soumises automatiquement.</li>
            </ul>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg transition flex items-center gap-2 mx-auto"
          >
            <Play className="w-5 h-5 fill-current" />
            Commencer l'évaluation
          </button>
        </div>
      </div>
    );
  }

  // ⭐ INTERFACE DE L'EXAMEN EN COURS (AVEC AFFICHAGE DU SUJET)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const question = questions[currentQ];
  const answeredCount = Object.keys(reponses).length;
  const isLast = currentQ === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header collant avec timer */}
      <div className="sticky top-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-purple-50 text-purple-700 font-semibold px-3 py-1.5 rounded-lg text-sm">
            Question {currentQ + 1} / {questions.length}
          </div>
          <div className="text-sm text-gray-500">
            {answeredCount} répondues
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-lg ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-800'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* ⭐ AFFICHAGE DU SUJET (APRÈS AVOIR COMMENCÉ) */}
      {examen.fichier_url && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-purple-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">📎 Sujet de l'évaluation</span>
              </div>
              <a 
                href={examen.fichier_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Télécharger
              </a>
            </div>
          </div>
          <div className="p-4">
            {/* ⭐ APERÇU DE L'IMAGE */}
            {fileType === 'image' && (
              <div className="relative">
                <img 
                  src={examen.fichier_url} 
                  alt="Sujet de l'évaluation"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {getFileName(examen.fichier_url)}
                </p>
              </div>
            )}

            {/* ⭐ APERÇU PDF */}
            {fileType === 'pdf' && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                <FileText className="w-16 h-16 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Document PDF</p>
                <p className="text-xs text-gray-400 mt-1">{getFileName(examen.fichier_url)}</p>
                <a 
                  href={examen.fichier_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-800 hover:underline font-medium"
                >
                  📄 Ouvrir le PDF
                </a>
              </div>
            )}

            {/* ⭐ AUTRE TYPE DE FICHIER */}
            {fileType === 'other' && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                <File className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">{getFileName(examen.fichier_url)}</p>
                <a 
                  href={examen.fichier_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-800 hover:underline font-medium"
                >
                  📎 Télécharger le fichier
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-gray-50">
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2 className="text-xl font-medium text-gray-900 leading-relaxed">{question.question}</h2>
            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
              {question.points} {question.points > 1 ? 'pts' : 'pt'}
            </span>
          </div>
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
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-2 shadow-sm"
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
                <Check className="w-5 h-5" /> Soumettre l'évaluation
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
                ? "bg-purple-600 w-6"
                : reponses[q.id]
                ? "bg-purple-300"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label={`Question ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}