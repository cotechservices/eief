// app/dashboard/enseignant/lecons/page.tsx - Version avec champ matière

"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, Download, Search, Filter, Loader2, Video, FileText } from "lucide-react";
import Link from "next/link";

interface Lecon {
  id: number;
  titre: string;
  description: string;
  fichier: string;
  video_url: string;
  matiere: string;
  classe: string;
  date: string;
  vues: number;
}

interface Enseignement {
  id: number;
  classe: string;
  matiere: string;
}

export default function EnseignantLeconsPage() {
  const [showForm, setShowForm] = useState(false);
  const [lecons, setLecons] = useState<Lecon[]>([]);
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [enseignementId, setEnseignementId] = useState("");
  const [matiere, setMatiere] = useState(""); // ⭐ NOUVEAU CHAMP
  const [fichier, setFichier] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leconsRes, enseignementsRes] = await Promise.all([
        fetch("/api/enseignant/lecons"),
        fetch("/api/enseignant/enseignements")
      ]);

      if (!leconsRes.ok || !enseignementsRes.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const leconsData = await leconsRes.json();
      const enseignementsData = await enseignementsRes.json();

      setLecons(leconsData);
      setEnseignements(enseignementsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre || !enseignementId) {
      alert("Veuillez remplir les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("enseignement_id", enseignementId);
      formData.append("titre", titre);
      formData.append("description", description);
      if (videoUrl) formData.append("video_url", videoUrl);
      if (fichier) formData.append("fichier", fichier);
      if (matiere) formData.append("matiere", matiere); // ⭐ AJOUT DU CHAMP MATIERE

      const response = await fetch("/api/enseignant/lecons", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      // Reset form
      setTitre("");
      setDescription("");
      setEnseignementId("");
      setMatiere(""); // ⭐ RESET DU CHAMP MATIERE
      setFichier(null);
      setVideoUrl("");
      setShowForm(false);

      // Refresh list
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-900">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
        <p className="font-medium">❌ {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mes leçons</h1>
          <p className="text-gray-900">Gérez vos cours et supports pédagogiques</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouvelle leçon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Ajouter une leçon</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Titre *</label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Classe *</label>
              <select
                value={enseignementId}
                onChange={(e) => setEnseignementId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Sélectionnez une classe</option>
                {enseignements.map(e => (
                  <option key={e.id} value={e.id}>{e.classe}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">
                Matière
                <span className="text-xs text-gray-900 ml-1">(optionnel)</span>
              </label>
              <input
                type="text"
                value={matiere}
                onChange={(e) => setMatiere(e.target.value)}
                placeholder="Ex: Mathématiques, Français..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-gray-900 mt-1">Laisse vide pour utiliser la matière par défaut de la classe</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Fichier (PDF, Image, etc.)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFichier(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Lien vidéo YouTube (optionnel)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-900">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Publier
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
            <input type="text" placeholder="Rechercher une leçon..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <span>{lecons.length} leçon(s)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {lecons.length === 0 ? (
            <div className="p-8 text-center text-gray-900">
              <FileText className="w-12 h-12 mx-auto text-gray-900 mb-3" />
              <p>Aucune leçon publiée pour le moment.</p>
              <p className="text-sm text-gray-900 mt-1">Cliquez sur "Nouvelle leçon" pour commencer</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Leçon</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Matière</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">Fichier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lecons.map((l) => (
                  <tr key={l.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{l.titre}</div>
                      {l.description && <div className="text-sm text-gray-900 truncate max-w-xs">{l.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {l.classe}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {l.matiere}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {l.date || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center gap-3">
                        {l.fichier ? (
                          <a href={l.fichier} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-blue-600" title="Voir le fichier">
                            <FileText className="w-5 h-5" />
                          </a>
                        ) : <div className="w-5" />}
                        {l.video_url ? (
                          <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-red-600" title="Voir la vidéo">
                            <Video className="w-5 h-5" />
                          </a>
                        ) : <div className="w-5" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}