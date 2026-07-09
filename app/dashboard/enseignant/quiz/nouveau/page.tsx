//app/dashboard/enseignant/quiz/nouveau/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Plus, Trash2, BookOpen, Clock, 
  Users, Zap, Layers, Search, CheckCircle, School, FileText, Upload, X
} from "lucide-react";

interface Enseignement {
  id: number;
  classe_id: number;
  classe_nom: string;
  classe_niveau: string;
  matiere_nom: string;
  nb_eleves: number;
}

interface Question {
  id: number;
  question: string;
  points: number;
  difficulte: string;
  categorie_id: number;
  categorie_nom: string;
  categorie_couleur: string;
}

export default function NouveauQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [fichier, setFichier] = useState<File | null>(null);
  const [fichierName, setFichierName] = useState("");
  
  const [formData, setFormData] = useState({
    enseignement_id: "",
    titre: "",
    description: "",
    type: "qcm",
    duree_minutes: 10,
    est_actif: true,
    est_aleatoire: false,
    afficher_resultats: true,
  });
  
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [searchQuestion, setSearchQuestion] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState<string>("all");

  // Récupérer les classes de l'enseignant (comme pour les évaluations)
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ⭐ Récupérer les classes de l'enseignant (comme dans /api/enseignant/profil)
      const ensRes = await fetch("/api/enseignant/quiz/classes");
      const ensData = await ensRes.json();
      setEnseignements(ensData.classes || []);

      // Récupérer toutes les questions
      const qRes = await fetch("/api/enseignant/quiz/questions");
      const qData = await qRes.json();
      setQuestions(qData.questions || []);
      setFilteredQuestions(qData.questions || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Upload de fichier (comme pour les évaluations)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError("Veuillez sélectionner une image (JPEG, PNG, GIF) ou un fichier PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setFichier(file);
    setFichierName(file.name);
    setError("");
  };

  const removeFile = () => {
    setFichier(null);
    setFichierName("");
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload/quiz', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Erreur lors de l'upload du fichier");
    }

    const data = await res.json();
    return data.url;
  };

  const toggleQuestion = (questionId: number) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const getClasseInfo = (enseignementId: string) => {
    const ens = enseignements.find(e => e.id === parseInt(enseignementId));
    return ens;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!formData.enseignement_id) {
      setError("Veuillez sélectionner une classe");
      setSubmitting(false);
      return;
    }

    if (!formData.titre) {
      setError("Veuillez saisir un titre pour le quiz");
      setSubmitting(false);
      return;
    }

    if (selectedQuestions.length === 0) {
      setError("Veuillez sélectionner au moins une question");
      setSubmitting(false);
      return;
    }

    // Upload du fichier si présent
    let uploadedFileUrl = "";
    if (fichier) {
      try {
        uploadedFileUrl = await uploadFile(fichier);
      } catch (err: any) {
        setError(err.message || "Erreur lors de l'upload du fichier");
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/enseignant/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fichier_url: uploadedFileUrl,
          questions_ids: selectedQuestions,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/enseignant/quiz");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création du quiz");
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

  const selectedClasse = getClasseInfo(formData.enseignement_id);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/enseignant/quiz"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux quiz
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {selectedQuestions.length} question{selectedQuestions.length > 1 ? 's' : ''} sélectionnée{selectedQuestions.length > 1 ? 's' : ''}
          </span>
          {selectedClasse && (
            <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-lg flex items-center gap-1">
              <School className="w-4 h-4" /> {selectedClasse.classe_nom}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Informations du quiz */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-white">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              Créer un quiz pour une classe
            </h1>
          </div>

          <div className="p-6 space-y-6">
            {/* ⭐ Sélection de la classe - comme pour les évaluations */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <School className="w-4 h-4" /> Classe * 
                <span className="text-xs font-normal text-gray-400">
                  (le quiz sera disponible pour tous les élèves de cette classe)
                </span>
              </label>
              <select
                value={formData.enseignement_id}
                onChange={(e) => setFormData({ ...formData, enseignement_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm bg-gray-50"
                required
              >
                <option value="">Sélectionner une classe</option>
                {enseignements.map((ens) => (
                  <option key={ens.id} value={ens.id}>
                    {ens.classe_nom} - {ens.matiere_nom} ({ens.nb_eleves} élèves)
                  </option>
                ))}
              </select>
              {selectedClasse && (
                <p className="text-xs text-gray-500">
                  📌 Quiz destiné à la {selectedClasse.classe_nom} ({selectedClasse.nb_eleves} élèves)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Titre du quiz *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Ex: Révision chapitre 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Durée (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duree_minutes}
                  onChange={(e) => setFormData({ ...formData, duree_minutes: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez brièvement ce quiz..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* ⭐ Upload du fichier - comme pour les évaluations */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Fichier du sujet (Optionnel)</h3>
                <span className="text-xs text-gray-400">(Image ou PDF - max 10 Mo)</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Vous pouvez joindre une image ou un fichier PDF du sujet du quiz.</p>

              {!fichier ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition cursor-pointer bg-gray-50 hover:bg-purple-50"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Cliquez pour sélectionner un fichier</p>
                  <p className="text-xs text-gray-400 mt-1">Formats acceptés : JPG, PNG, GIF, PDF</p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {fichier.type.startsWith('image/') ? (
                      <FileText className="w-8 h-8 text-purple-600" />
                    ) : (
                      <FileText className="w-8 h-8 text-purple-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800 truncate max-w-[200px]">{fichierName}</p>
                      <p className="text-xs text-gray-500">
                        {(fichier.size / 1024).toFixed(1)} KB • {fichier.type}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-500 transition p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.est_actif}
                  onChange={(e) => setFormData({ ...formData, est_actif: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Quiz actif
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.est_aleatoire}
                  onChange={(e) => setFormData({ ...formData, est_aleatoire: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Mélanger les questions
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.afficher_resultats}
                  onChange={(e) => setFormData({ ...formData, afficher_resultats: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Afficher les résultats
              </label>
            </div>
          </div>
        </div>

        {/* Sélection des questions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Sélectionner les questions
              </h2>
              <span className="text-sm text-gray-500">
                {selectedQuestions.length} sélectionnée{selectedQuestions.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une question..."
                  value={searchQuestion}
                  onChange={(e) => setSearchQuestion(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <select
                value={selectedCategorie}
                onChange={(e) => setSelectedCategorie(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Toutes les catégories</option>
                {[...new Set(questions.map(q => q.categorie_nom))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Liste des questions */}
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Aucune question trouvée</p>
                <Link
                  href="/dashboard/enseignant/quiz/questions/nouveau"
                  className="text-purple-600 text-sm hover:underline"
                >
                  + Créer une question
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => toggleQuestion(q.id)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition ${
                      selectedQuestions.includes(q.id)
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                        selectedQuestions.includes(q.id)
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-gray-300"
                      }`}>
                        {selectedQuestions.includes(q.id) && (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${q.categorie_couleur || '#6B46C1'}20`,
                            color: q.categorie_couleur || '#6B46C1'
                          }}
                        >
                          {q.categorie_nom}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          q.difficulte === 'facile' ? 'bg-green-100 text-green-700' :
                          q.difficulte === 'moyen' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulte}
                        </span>
                        <span className="text-xs text-gray-400">{q.points} pts</span>
                      </div>
                      <p className="text-sm text-gray-800 mt-0.5">{q.question}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-4">
              {filteredQuestions.length} question{filteredQuestions.length > 1 ? 's' : ''} disponible{filteredQuestions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Bouton de soumission */}
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
            {submitting ? "Création..." : "Créer le quiz pour la classe"}
          </button>
        </div>
      </form>
    </div>
  );
}