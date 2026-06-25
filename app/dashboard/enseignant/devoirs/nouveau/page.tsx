// app/dashboard/enseignant/devoirs/nouveau/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Calendar, BookOpen, Link as LinkIcon, FileText } from "lucide-react";

interface Enseignement {
  enseignement_id: number;
  classe_nom: string;
  matiere_nom: string;
}

export default function NouveauDevoirPage() {
  const router = useRouter();
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    enseignement_id: "",
    titre: "",
    description: "",
    fichier_url: "",
    date_limite: "",
  });

  useEffect(() => {
    fetch("/api/enseignant/profil")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setEnseignements(d.enseignements || []);
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.enseignement_id || !formData.titre || !formData.date_limite) {
      setError("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/enseignant/devoirs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/dashboard/enseignant/devoirs");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
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
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-gray-400" /> Classe et Matière *
              </label>
              <select
                name="enseignement_id"
                value={formData.enseignement_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
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
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" /> Date limite à rendre *
              </label>
              <input
                type="date"
                name="date_limite"
                value={formData.date_limite}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                required
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
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-gray-400" />
              Lien vers un fichier (optionnel)
            </label>
            <input
              type="url"
              name="fichier_url"
              value={formData.fichier_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-400">Ajoutez un lien vers le sujet complet en PDF ou image si nécessaire.</p>
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
            />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={submitLoading}
              className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 shadow-md transition flex items-center gap-2 disabled:opacity-70"
            >
              {submitLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {submitLoading ? "Publication..." : "Publier le devoir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
