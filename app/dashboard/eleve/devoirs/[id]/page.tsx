// app/dashboard/eleve/devoirs/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, CheckCircle, AlertCircle, Clock,
  FileText, Calendar, User, Award
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
  const devoirId = params.id;

  const [devoir, setDevoir] = useState<DevoirDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [fichierUrl, setFichierUrl] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/eleve/devoirs")
      .then((r) => r.json())
      .then((d) => {
        const found = d.devoirs?.find((dv: DevoirDetail) => dv.id === parseInt(devoirId as string));
        setDevoir(found || null);
      })
      .finally(() => setLoading(false));
  }, [devoirId]);

  const handleSoumettre = async () => {
    if (!commentaire.trim() && !fichierUrl.trim()) {
      setMessage({ type: "error", text: "Veuillez ajouter un commentaire ou un lien vers votre travail." });
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/eleve/devoirs/${devoirId}/soumettre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentaire, fichier_url: fichierUrl }),
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
                {devoir.matiere}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien vers votre travail (Drive, OneDrive, etc.) <span className="text-gray-400 font-normal">optionnel</span>
                  </label>
                  <input
                    type="url"
                    value={fichierUrl}
                    onChange={(e) => setFichierUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
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
                  disabled={submitLoading}
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
