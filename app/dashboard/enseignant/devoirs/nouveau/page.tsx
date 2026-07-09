"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Calendar, BookOpen, Image as ImageIcon, FileText, Loader2, X, Upload } from "lucide-react";

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  effectif: number;
}

interface Enseignement {
  enseignement_id: number;
  classe_id: number;
  classe_nom: string;
  classe_niveau: string;
  matiere_nom: string;
  nb_eleves: number;
}

export default function NouveauDevoirPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    classe_id: "",
    titre: "",
    description: "",
    date_limite: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Récupérer les classes et les enseignements en parallèle
      const [classesRes, profilRes] = await Promise.all([
        fetch("/api/enseignant/classes"),
        fetch("/api/enseignant/profil")
      ]);

      if (!classesRes.ok) {
        const data = await classesRes.json();
        throw new Error(data.error || "Erreur lors du chargement des classes");
      }

      if (!profilRes.ok) {
        const data = await profilRes.json();
        throw new Error(data.error || "Erreur lors du chargement du profil");
      }

      const classesData = await classesRes.json();
      const profilData = await profilRes.json();

      console.log("📚 Classes reçues:", classesData);
      console.log("📝 Enseignements reçus:", profilData.enseignements);

      // ⭐ FILTRAGE: Garder uniquement les classes qui ont un enseignement
      const enseignementIds = new Set(
        (profilData.enseignements || []).map((e: Enseignement) => e.classe_id)
      );

      const filteredClasses = classesData.filter(
        (classe: Classe) => enseignementIds.has(classe.id)
      );

      console.log("🔍 Classes filtrées:", filteredClasses);
      console.log("🔍 IDs des classes avec enseignement:", [...enseignementIds]);

      setClasses(filteredClasses);
      setEnseignements(profilData.enseignements || []);
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err.message || "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setImageFile(file);
    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enfantId', 'devoir');
      formData.append('type', 'devoir');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      setUploadedImageUrl(data.url);
      console.log('✅ Image uploadée avec succès:', data.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors de l\'upload de l\'image');
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.classe_id || !formData.titre || !formData.date_limite) {
      setError("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setSubmitLoading(true);

    try {
      // Trouver l'enseignement correspondant à la classe sélectionnée
      const enseignement = enseignements.find(
        (e: Enseignement) => e.classe_id === Number(formData.classe_id)
      );

      console.log("🔍 Recherche de l'enseignement pour la classe:", formData.classe_id);
      console.log("📚 Enseignements disponibles:", enseignements);
      console.log("🎯 Enseignement trouvé:", enseignement);

      if (!enseignement) {
        setError("Aucun enseignement trouvé pour cette classe. Veuillez contacter l'administrateur.");
        setSubmitLoading(false);
        return;
      }

      console.log("📝 Création du devoir avec:", {
        enseignement_id: enseignement.enseignement_id,
        titre: formData.titre,
        description: formData.description,
        fichier_url: uploadedImageUrl,
        date_limite: formData.date_limite,
      });

      // Créer le devoir
      const res = await fetch("/api/enseignant/devoirs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enseignement_id: enseignement.enseignement_id,
          titre: formData.titre,
          description: formData.description || "",
          fichier_url: uploadedImageUrl || null,
          date_limite: formData.date_limite,
        }),
      });

      console.log("📡 Réponse API:", res.status, res.statusText);

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Devoir créé:", data);
        setSuccess(true);

        setTimeout(() => {
          router.push("/dashboard/enseignant/devoirs");
        }, 2000);
      } else {
        const data = await res.json();
        console.error("❌ Erreur API:", data);
        setError(data.error || "Erreur lors de la création du devoir");
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
      setError("Vérifier votre connexion");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getClasseLabel = (classe: Classe) => {
    return `${classe.nom} ${classe.niveau ? `(${classe.niveau})` : ''} - ${classe.effectif || 0} élèves`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/enseignant/devoirs"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 text-sm font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux devoirs
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-600" />
            Créer un nouveau devoir
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Publiez un exercice ou travail à la maison pour l'une de vos classes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
              <X className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">✅ Devoir créé avec succès !</p>
                <p className="text-xs text-green-600 mt-0.5">Redirection vers la liste des devoirs...</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-gray-400" /> Classe *
              </label>
              <select
                name="classe_id"
                value={formData.classe_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                required
                disabled={submitLoading || success}
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {getClasseLabel(classe)}
                  </option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="text-xs text-orange-500">Aucune classe assignée. Contactez l'administrateur.</p>
              )}
              {enseignements.length > 0 && classes.length > 0 && (
                <p className="text-xs text-gray-400">
                  {enseignements.length} enseignement(s) disponible(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" /> Date limite *
              </label>
              <input
                type="date"
                name="date_limite"
                value={formData.date_limite}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                required
                disabled={submitLoading || success}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Titre du devoir *</label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Ex: Exercices d'algèbre (Page 45)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              required
              disabled={submitLoading || success}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              Image du sujet (optionnel)
            </label>

            <div className="flex items-center gap-4">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={submitLoading || uploadingImage || success}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitLoading || uploadingImage || success}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition text-sm text-gray-600 disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadingImage ? "Upload en cours..." : "Choisir une image"}
                </button>
              </div>

              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                    disabled={submitLoading || success}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {uploadedImageUrl && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                      ✓ Uploadé
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Formats acceptés : JPG, PNG, GIF. Taille max : 5MB.
              {uploadedImageUrl && (
                <span className="block text-green-600 mt-1">
                  ✅ Image uploadée avec succès
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Instructions et consignes</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Détaillez le travail à effectuer..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
              disabled={submitLoading || success}
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={submitLoading || classes.length === 0 || uploadingImage || success}
              className={`px-8 py-3 rounded-xl font-bold shadow-md transition flex items-center gap-2 ${success
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publication en cours...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Devoir publié !
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Publier le devoir
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);