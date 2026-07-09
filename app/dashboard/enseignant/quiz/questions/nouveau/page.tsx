//app/dashboard/enseignant/quiz/questions/nouveau/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Plus, Trash2, BookOpen, 
  CheckCircle, XCircle, HelpCircle 
} from "lucide-react";

interface Category {
  id: number;
  nom: string;
  couleur: string;
}

export default function NouvelleQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    categorie_id: "",
    question: "",
    explication: "",
    difficulte: "facile",
    points: 1,
    temps_secondes: 30,
  });

  const [options, setOptions] = useState([
    { id: 1, texte: "", est_correcte: true },
    { id: 2, texte: "", est_correcte: false },
  ]);
  const [nextOptionId, setNextOptionId] = useState(3);

  useEffect(() => {
    fetch("/api/enseignant/quiz/categories")
      .then(r => r.json())
      .then(d => {
        setCategories(d.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addOption = () => {
    setOptions([...options, { id: nextOptionId, texte: "", est_correcte: false }]);
    setNextOptionId(nextOptionId + 1);
  };

  const removeOption = (id: number) => {
    if (options.length <= 2) {
      setError("Une question doit avoir au moins 2 options");
      return;
    }
    const filtered = options.filter(o => o.id !== id);
    // Si on supprime la seule bonne réponse, mettre la première comme bonne
    if (!filtered.some(o => o.est_correcte)) {
      filtered[0].est_correcte = true;
    }
    setOptions(filtered);
    setError("");
  };

  const updateOption = (id: number, field: keyof typeof options[0], value: string | boolean) => {
    const newOptions = options.map(o => {
      if (o.id === id) {
        // Si on coche "est_correcte" sur une option, décocher les autres
        if (field === "est_correcte" && value === true) {
          return { ...o, [field]: value };
        }
        return { ...o, [field]: value };
      }
      // Décocher les autres si on coche une option comme correcte
      if (field === "est_correcte" && value === true) {
        return { ...o, est_correcte: false };
      }
      return o;
    });
    setOptions(newOptions);
  };

  const setCorrectOption = (id: number) => {
    setOptions(options.map(o => ({
      ...o,
      est_correcte: o.id === id
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!formData.categorie_id) {
      setError("Veuillez sélectionner une catégorie");
      setSubmitting(false);
      return;
    }

    if (!formData.question.trim()) {
      setError("Veuillez saisir la question");
      setSubmitting(false);
      return;
    }

    const hasEmptyOption = options.some(o => !o.texte.trim());
    if (hasEmptyOption) {
      setError("Toutes les options doivent être remplies");
      setSubmitting(false);
      return;
    }

    const hasCorrect = options.some(o => o.est_correcte);
    if (!hasCorrect) {
      setError("Au moins une option doit être marquée comme correcte");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/enseignant/quiz/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          options: options.map(o => ({
            texte: o.texte,
            est_correcte: o.est_correcte,
          })),
        }),
      });

      if (res.ok) {
        router.push("/dashboard/enseignant/quiz");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/enseignant/quiz"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-white">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              Nouvelle question
            </h1>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Catégorie *</label>
                <select
                  value={formData.categorie_id}
                  onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Difficulté</label>
                <select
                  value={formData.difficulte}
                  onChange={(e) => setFormData({ ...formData, difficulte: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 bg-gray-50 text-sm"
                >
                  <option value="facile">🟢 Facile</option>
                  <option value="moyen">🟡 Moyen</option>
                  <option value="difficile">🔴 Difficile</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Question *</label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Saisissez votre question..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Explication (optionnel)</label>
              <textarea
                value={formData.explication}
                onChange={(e) => setFormData({ ...formData, explication: e.target.value })}
                placeholder="Explication de la réponse (pour l'apprentissage)..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Points</label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Temps (secondes)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.temps_secondes}
                  onChange={(e) => setFormData({ ...formData, temps_secondes: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Options de réponse
                </h3>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Ajouter une option
                </button>
              </div>

              <div className="space-y-3">
                {options.map((opt, index) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCorrectOption(opt.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition ${
                        opt.est_correcte
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-green-300"
                      }`}
                    >
                      {opt.est_correcte && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <input
                      type="text"
                      value={opt.texte}
                      onChange={(e) => updateOption(opt.id, "texte", e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:outline-none transition ${
                        opt.est_correcte
                          ? "border-green-300 bg-green-50 focus:ring-green-500"
                          : "border-gray-200 focus:ring-purple-500"
                      }`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(opt.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Cliquez sur le cercle pour marquer la bonne réponse
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/enseignant/quiz"
            className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-70 flex items-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {submitting ? "Enregistrement..." : "Enregistrer la question"}
          </button>
        </div>
      </form>
    </div>
  );
}