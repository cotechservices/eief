// app/dashboard/enseignant/evaluations/nouveau/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, HelpCircle, BookOpen, Clock, Award } from "lucide-react";

interface Enseignement {
  enseignement_id: number;
  classe_nom: string;
  matiere_nom: string;
}

interface Option {
  texte: string;
  est_correcte: boolean;
}

interface Question {
  question: string;
  points: number;
  options: Option[];
}

export default function NouveauQCMPage() {
  const router = useRouter();
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    enseignement_id: "",
    titre: "",
    duree_minutes: 30,
    date_debut: "",
    date_fin: "",
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      question: "",
      points: 1,
      options: [
        { texte: "", est_correcte: true },
        { texte: "", est_correcte: false },
      ],
    },
  ]);

  useEffect(() => {
    fetch("/api/enseignant/profil")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setEnseignements(d.enseignements || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        points: 1,
        options: [
          { texte: "", est_correcte: true },
          { texte: "", est_correcte: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ texte: "", est_correcte: false });
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof Option, value: string | boolean) => {
    const newQuestions = [...questions];
    
    // Si on coche "est_correcte", décocher les autres (QCM à choix unique)
    if (field === "est_correcte" && value === true) {
      newQuestions[qIndex].options.forEach((opt) => (opt.est_correcte = false));
    }
    
    newQuestions[qIndex].options[oIndex] = { ...newQuestions[qIndex].options[oIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.enseignement_id || !formData.titre || !formData.duree_minutes) {
      setError("Veuillez remplir les informations générales de l'examen.");
      window.scrollTo(0, 0);
      return;
    }

    if (questions.length === 0) {
      setError("Veuillez ajouter au moins une question.");
      return;
    }

    // Validation des questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`La question ${i + 1} est vide.`);
        return;
      }
      if (q.options.length < 2) {
        setError(`La question ${i + 1} doit avoir au moins 2 options.`);
        return;
      }
      const hasCorrect = q.options.some((o) => o.est_correcte);
      if (!hasCorrect) {
        setError(`La question ${i + 1} doit avoir au moins une bonne réponse cochée.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].texte.trim()) {
          setError(`L'option ${j + 1} de la question ${i + 1} est vide.`);
          return;
        }
      }
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/enseignant/examens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          questions,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/enseignant/evaluations");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création.");
        window.scrollTo(0, 0);
      }
    } catch {
      setError("Erreur de connexion.");
      window.scrollTo(0, 0);
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

  const totalPoints = questions.reduce((sum, q) => sum + Number(q.points), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/enseignant/evaluations"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux évaluations
        </Link>
        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
          <Award className="w-4 h-4" /> Total : {totalPoints} pts
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Paramètres de l'examen */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-white">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-600" />
              Paramètres de l'évaluation
            </h1>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Classe et Matière *</label>
                <select
                  name="enseignement_id"
                  value={formData.enseignement_id}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
                  required
                >
                  <option value="">Sélectionnez une classe</option>
                  {enseignements.map((ens) => (
                    <option key={ens.enseignement_id} value={ens.enseignement_id}>
                      {ens.classe_nom} — {ens.matiere_nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Durée (minutes) *
                </label>
                <input
                  type="number"
                  name="duree_minutes"
                  min="5"
                  value={formData.duree_minutes}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Titre de l'évaluation *</label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleFormChange}
                placeholder="Ex: QCM sur les équations du 1er degré"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Date/Heure de début (Optionnel)</label>
                <input
                  type="datetime-local"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Date/Heure de fin (Optionnel)</label>
                <input
                  type="datetime-local"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              Questions du QCM
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-200 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Ajouter une question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
              
              <div className="p-6 border-b bg-gray-50 flex justify-between items-start gap-4">
                <div className="flex-1 flex gap-4">
                  <span className="bg-purple-100 text-purple-800 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    {qIndex + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      placeholder="Intitulé de la question..."
                      className="w-full bg-transparent border-b border-gray-300 px-0 py-1 text-lg font-medium text-gray-900 focus:border-purple-500 focus:ring-0 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-500">Points</label>
                    <input
                      type="number"
                      min="1"
                      value={q.points}
                      onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg text-sm font-bold text-purple-700 focus:ring-purple-500"
                    />
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                      title="Supprimer la question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-3 pl-16">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Options de réponse (Cochez la bonne réponse)</p>
                
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`correct_${qIndex}`}
                      checked={opt.est_correcte}
                      onChange={(e) => updateOption(qIndex, oIndex, "est_correcte", e.target.checked)}
                      className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt.texte}
                      onChange={(e) => updateOption(qIndex, oIndex, "texte", e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className={`flex-1 px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:outline-none transition ${
                        opt.est_correcte ? "border-green-300 bg-green-50 focus:ring-green-500" : "border-gray-200 focus:ring-purple-500"
                      }`}
                      required
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="text-gray-400 hover:text-red-500 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1 mt-2 p-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter une option
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-center">
          <div className="max-w-4xl w-full flex justify-between items-center px-4 md:px-0">
            <span className="text-gray-500 font-medium hidden sm:inline">
              {questions.length} question{questions.length > 1 ? 's' : ''} • {totalPoints} points
            </span>
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full sm:w-auto bg-purple-600 text-white px-10 py-3.5 rounded-xl font-bold hover:bg-purple-700 shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70 text-lg"
            >
              {submitLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {submitLoading ? "Publication..." : "Publier l'évaluation"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
