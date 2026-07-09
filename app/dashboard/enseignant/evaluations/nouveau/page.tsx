// app/dashboard/enseignant/evaluations/nouveau/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Plus, Trash2, HelpCircle, BookOpen, 
  Clock, Award, Users, CheckCircle, Upload, File, Image, X, FileText 
} from "lucide-react";

interface Enseignement {
  enseignement_id: number;
  classe_nom: string;
  matiere_nom: string;
}

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [elevesSelectionnes, setElevesSelectionnes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    enseignement_id: "",
    titre: "",
    duree_minutes: 30,
    date_debut: "",
    date_fin: "",
  });

  // ⭐ État pour le fichier uploadé
  const [fichier, setFichier] = useState<File | null>(null);
  const [fichierUrl, setFichierUrl] = useState<string>("");
  const [fichierName, setFichierName] = useState<string>("");

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

  // Charger les élèves quand la classe change
  useEffect(() => {
    if (!formData.enseignement_id) {
      setEleves([]);
      setElevesSelectionnes([]);
      return;
    }

    setLoadingEleves(true);
    fetch(`/api/enseignant/classes/${formData.enseignement_id}/eleves`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setEleves(d.eleves || []);
          setElevesSelectionnes((d.eleves || []).map((e: Eleve) => e.id));
        }
      })
      .finally(() => setLoadingEleves(false));
  }, [formData.enseignement_id]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleEleve = (eleveId: number) => {
    setElevesSelectionnes(prev =>
      prev.includes(eleveId)
        ? prev.filter(id => id !== eleveId)
        : [...prev, eleveId]
    );
  };

  const toggleAllEleves = () => {
    if (elevesSelectionnes.length === eleves.length) {
      setElevesSelectionnes([]);
    } else {
      setElevesSelectionnes(eleves.map(e => e.id));
    }
  };

  // ⭐ Gestion de l'upload de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier (image ou PDF)
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError("Veuillez sélectionner une image (JPEG, PNG, GIF) ou un fichier PDF.");
      return;
    }

    // Vérifier la taille (max 10MB)
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
    setFichierUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ⭐ Upload du fichier vers Supabase Storage
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload/examen', {
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
    
    if (field === "est_correcte" && value === true) {
      newQuestions[qIndex].options.forEach((opt) => (opt.est_correcte = false));
    }
    
    newQuestions[qIndex].options[oIndex] = { ...newQuestions[qIndex].options[oIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    if (!formData.enseignement_id || !formData.titre || !formData.duree_minutes) {
      setError("Veuillez remplir les informations générales de l'examen.");
      setSubmitLoading(false);
      window.scrollTo(0, 0);
      return;
    }

    if (elevesSelectionnes.length === 0) {
      setError("Veuillez sélectionner au moins un élève.");
      setSubmitLoading(false);
      window.scrollTo(0, 0);
      return;
    }

    // ⭐ Upload du fichier si présent
    let uploadedFileUrl = "";
    if (fichier) {
      try {
        uploadedFileUrl = await uploadFile(fichier);
      } catch (err: any) {
        setError(err.message || "Erreur lors de l'upload du fichier");
        setSubmitLoading(false);
        window.scrollTo(0, 0);
        return;
      }
    }

    try {
      const res = await fetch("/api/enseignant/examens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fichier_url: uploadedFileUrl,
          eleves_ids: elevesSelectionnes,
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
                <label className="text-sm font-semibold text-gray-700">Classe *</label>
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
                      {ens.classe_nom}
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
                placeholder="Entrez le titre de l'évaluation"
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

            {/* ⭐ Upload du fichier sujet (optionnel) */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Fichier du sujet (Optionnel)</h3>
                <span className="text-xs text-gray-400">(Image ou PDF - max 10 Mo)</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Vous pouvez joindre une image ou un fichier PDF du sujet de l'évaluation.</p>

              {!fichier ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition cursor-pointer bg-gray-50 hover:bg-purple-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
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
                      <Image className="w-8 h-8 text-purple-600" />
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

            {/* ⭐ Sélection des élèves */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Élèves concernés</h3>
                  <span className="text-xs text-gray-500">
                    ({elevesSelectionnes.length} sélectionné{elevesSelectionnes.length > 1 ? 's' : ''})
                  </span>
                </div>
                {eleves.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllEleves}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {elevesSelectionnes.length === eleves.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                )}
              </div>

              {loadingEleves ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Chargement des élèves...</span>
                </div>
              ) : eleves.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun élève dans cette classe</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                  {eleves.map((eleve) => (
                    <button
                      key={eleve.id}
                      type="button"
                      onClick={() => toggleEleve(eleve.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                        elevesSelectionnes.includes(eleve.id)
                          ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                          : "bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        elevesSelectionnes.includes(eleve.id)
                          ? "bg-purple-600 text-white"
                          : "border-2 border-gray-300"
                      }`}>
                        {elevesSelectionnes.includes(eleve.id) && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </div>
                      <span className="truncate">{eleve.prenom} {eleve.nom}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {elevesSelectionnes.length} élève{elevesSelectionnes.length > 1 ? 's' : ''} sélectionné{elevesSelectionnes.length > 1 ? 's' : ''} sur {eleves.length}
              </p>
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
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-medium hidden sm:inline">
                {questions.length} question{questions.length > 1 ? 's' : ''} • {totalPoints} points
              </span>
              <span className="text-sm text-purple-600 font-medium">
                {elevesSelectionnes.length} élèves
              </span>
              {fichier && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <File className="w-3 h-3" /> Fichier joint
                </span>
              )}
            </div>
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