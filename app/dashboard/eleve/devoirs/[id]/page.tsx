// app/dashboard/eleve/devoirs/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, CheckCircle, AlertCircle, Clock,
  FileText, Calendar, User, Award, Upload, X, File
} from "lucide-react";

interface DevoirDetail {
  id: number;
  titre: string;
  description: string;
  fichier_url: string | null;
  matiere: string;
  enseignant: string;
  date_limite: string;
  date_publication: string;
  statut: string;
  joursRestants: number;
  soumission_id: number | null;
  date_soumission: string | null;
  note_soumission: number | null;
  commentaire_soumission: string | null;
  est_retard: boolean | null;
}

export default function DevoirDetailPage() {
  const params = useParams();
  const router = useRouter();
  // ⭐ Récupérer l'ID correctement
  const devoirId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [devoir, setDevoir] = useState<DevoirDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // ⭐ Vérifier que l'ID est valide avant de faire la requête
    if (!devoirId || isNaN(parseInt(devoirId))) {
      setLoading(false);
      setMessage({ type: "error", text: "ID de devoir invalide" });
      return;
    }

    fetchDevoirDetail();
  }, [devoirId]);

  const fetchDevoirDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/eleve/devoirs");
      const data = await res.json();
      const found = data.devoirs?.find(
        (dv: DevoirDetail) => dv.id === parseInt(devoirId)
      );
      setDevoir(found || null);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ type: "error", text: "Erreur lors du chargement du devoir" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Format non accepté. Veuillez choisir une image (JPEG, PNG, GIF, WEBP) ou un PDF." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Le fichier ne doit pas dépasser 10MB." });
      return;
    }

    setSelectedFile(file);
    setUploadingFile(true);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview('pdf');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enfantId', `soumission_${devoirId}`);
      formData.append('type', 'soumission');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      setUploadedFileUrl(data.url);
      setMessage({ type: "success", text: "✅ Fichier uploadé avec succès !" });
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ type: "error", text: err.message || "Erreur lors de l'upload du fichier" });
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadedFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSoumettre = async () => {
    if (!commentaire.trim() && !uploadedFileUrl) {
      setMessage({ type: "error", text: "Veuillez joindre un fichier ou ajouter un commentaire." });
      return;
    }

    if (!uploadedFileUrl) {
      setMessage({ type: "error", text: "Veuillez uploader votre fichier avant de soumettre." });
      return;
    }

    setSubmitLoading(true);
    try {
      // ⭐ Utiliser l'ID numérique pour l'API
      const numericId = parseInt(devoirId);
      const res = await fetch(`/api/eleve/devoirs/${numericId}/soumettre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentaire,
          fichier_url: uploadedFileUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: data.estRetard
            ? "Devoir soumis avec retard. Votre enseignant en sera informé."
            : "Devoir soumis avec succès ! Bien joué 🎉",
        });
        setTimeout(() => router.push("/dashboard/eleve/devoirs"), 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la soumission" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion" });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!devoir) {
    return (
      <div className="text-center py-16 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Devoir introuvable</p>
        <Link href="/dashboard/eleve/devoirs" className="text-blue-600 text-sm mt-2 block">
          ← Retour aux devoirs
        </Link>
      </div>
    );
  }

  const isExpired = devoir.statut === "en_retard";
  const isSubmitted = devoir.statut === "soumis";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/dashboard/eleve/devoirs"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux devoirs
      </Link>

      {/* En-tête devoir */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                Titre du devoir
              </span>
              <h1 className="text-xl font-bold text-gray-900 mt-2">{devoir.titre}</h1>
            </div>
            <div className="flex-shrink-0">
              {isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm px-3 py-1.5 rounded-xl font-semibold">
                  <CheckCircle className="w-4 h-4" /> Soumis
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-xl font-semibold">
                  <AlertCircle className="w-4 h-4" /> En retard
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-sm px-3 py-1.5 rounded-xl font-semibold">
                  <Clock className="w-4 h-4" /> J-{devoir.joursRestants}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Infos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Enseignant
              </p>
              <p className="text-sm font-medium text-gray-900">{devoir.enseignant}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date limite
              </p>
              <p className={`text-sm font-semibold ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                {new Date(devoir.date_limite).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Publié le
              </p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(devoir.date_publication).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Description */}
          {devoir.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {devoir.description}
              </div>
            </div>
          )}

          {/* Fichier enseignant */}
          {devoir.fichier_url && (
            <div className="mb-6">
              <a
                href={devoir.fichier_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                <FileText className="w-4 h-4" />
                Télécharger le fichier du devoir
              </a>
            </div>
          )}

          {/* Résultat si soumis */}
          {isSubmitted && devoir.note_soumission !== null && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                <Award className="w-5 h-5" />
                Résultat de votre devoir
              </h3>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-green-600">Note obtenue</p>
                  <p className="text-4xl font-black text-green-700">
                    {devoir.note_soumission}
                    <span className="text-lg font-normal text-green-500">/20</span>
                  </p>
                </div>
                {devoir.commentaire_soumission && (
                  <div className="flex-1 bg-white rounded-xl p-3 border border-green-100">
                    <p className="text-xs text-gray-400 mb-1">Commentaire de l'enseignant</p>
                    <p className="text-sm text-gray-700">{devoir.commentaire_soumission}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isSubmitted && devoir.note_soumission === null && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700 flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              Devoir soumis le {devoir.date_soumission ? new Date(devoir.date_soumission).toLocaleDateString("fr-FR") : "—"}. En attente de correction par l'enseignant.
            </div>
          )}

          {/* Formulaire de soumission */}
          {!isSubmitted && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                Soumettre votre devoir
              </h3>

              {message && (
                <div
                  className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                {/* Upload de fichier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre fichier (image ou PDF) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploadingFile || submitLoading}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile || submitLoading}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-sm text-gray-600 disabled:opacity-50"
                      >
                        {uploadingFile ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {uploadingFile ? "Upload en cours..." : "Choisir un fichier"}
                      </button>
                    </div>

                    {filePreview && (
                      <div className="relative">
                        {filePreview === 'pdf' ? (
                          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center border border-red-200">
                            <File className="w-8 h-8 text-red-600" />
                          </div>
                        ) : (
                          <img
                            src={filePreview}
                            alt="Aperçu"
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        )}
                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                          disabled={submitLoading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {uploadedFileUrl && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                            ✓ Uploadé
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Formats acceptés : JPG, PNG, GIF, WEBP, PDF. Taille max : 10MB.
                  </p>
                </div>

                {/* Commentaire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre réponse / commentaire <span className="text-gray-400 font-normal">optionnel</span>
                  </label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={5}
                    placeholder="Écrivez votre réponse, remarques ou décrivez votre travail..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>

                {isExpired && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 p-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Attention : La date limite est dépassée. Cette soumission sera marquée en retard.
                  </div>
                )}

                <button
                  onClick={handleSoumettre}
                  disabled={submitLoading || uploadingFile || !uploadedFileUrl}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitLoading ? "Envoi..." : "Soumettre le devoir"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}