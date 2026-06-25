// app/dashboard/enseignant/devoirs/[id]/soumissions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, FileText, User, Save } from "lucide-react";

interface Soumission {
  id: number;
  devoir_id: number;
  eleve_id: number;
  eleve_nom: string;
  fichier_url: string | null;
  commentaire: string | null;
  date_soumission: string;
  note: string | null;
  est_retard: boolean;
  devoir_titre: string;
  classe: string;
}

export default function SoumissionsPage() {
  const params = useParams();
  const devoirId = params.id;
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSoumission, setSelectedSoumission] = useState<Soumission | null>(null);
  const [noteForm, setNoteForm] = useState({ note: "", commentaire: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/enseignant/soumissions?devoir_id=${devoirId}`)
      .then((r) => r.json())
      .then((d) => setSoumissions(d.soumissions || []))
      .finally(() => setLoading(false));
  }, [devoirId]);

  const handleSelect = (s: Soumission) => {
    setSelectedSoumission(s);
    setNoteForm({ note: s.note || "", commentaire: "" }); // Charger note existante, vider commentaire prof
    setMessage(null);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoumission) return;

    if (!noteForm.note || isNaN(Number(noteForm.note)) || Number(noteForm.note) < 0 || Number(noteForm.note) > 20) {
      setMessage({ type: "error", text: "Veuillez entrer une note valide entre 0 et 20." });
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/enseignant/soumissions/${selectedSoumission.id}/noter`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: Number(noteForm.note),
          commentaire: noteForm.commentaire,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Mettre à jour la liste locale
        setSoumissions(soumissions.map(s => 
          s.id === selectedSoumission.id 
            ? { ...s, note: data.soumission.note, commentaire: data.soumission.commentaire }
            : s
        ));
        setMessage({ type: "success", text: "Note enregistrée avec succès." });
        setTimeout(() => {
          setSelectedSoumission(null);
          setMessage(null);
        }, 1500);
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Erreur d'enregistrement." });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion." });
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

  const devoirInfo = soumissions.length > 0 ? { titre: soumissions[0].devoir_titre, classe: soumissions[0].classe } : null;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/enseignant/devoirs"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 text-sm font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux devoirs
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Liste des soumissions (Sidebar) */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-900 line-clamp-1">{devoirInfo?.titre || "Soumissions"}</h2>
            <p className="text-sm text-gray-500 mt-1">{devoirInfo?.classe} • {soumissions.length} reçues</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {soumissions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune soumission reçue.</p>
              </div>
            ) : (
              soumissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left p-4 hover:bg-orange-50 transition flex items-center justify-between group ${
                    selectedSoumission?.id === s.id ? "bg-orange-50 border-l-2 border-orange-500" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-gray-900 text-sm truncate">{s.eleve_nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(s.date_soumission).toLocaleDateString()}
                      </span>
                      {s.est_retard && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded">Retard</span>
                      )}
                    </div>
                  </div>
                  <div>
                    {s.note !== null ? (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        {s.note}/20
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-orange-400 block ml-auto" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Détail et notation (Main Content) */}
        <div className="w-full md:w-2/3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
          {selectedSoumission ? (
            <div className="flex flex-col h-full">
              {/* Header élève */}
              <div className="p-6 border-b flex justify-between items-start bg-gradient-to-r from-orange-50 to-white">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    {selectedSoumission.eleve_nom}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    Soumis le {new Date(selectedSoumission.date_soumission).toLocaleString("fr-FR")}
                    {selectedSoumission.est_retard && (
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">En retard</span>
                    )}
                  </p>
                </div>
                {selectedSoumission.note !== null && (
                  <div className="text-center">
                    <span className="block text-xs text-gray-500 mb-1">Note actuelle</span>
                    <span className="text-2xl font-black text-green-600 bg-green-50 px-3 py-1 rounded-xl">
                      {selectedSoumission.note}/20
                    </span>
                  </div>
                )}
              </div>

              {/* Contenu élève */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {selectedSoumission.commentaire && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Message de l'élève</h4>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedSoumission.commentaire}
                    </div>
                  </div>
                )}

                {selectedSoumission.fichier_url ? (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Fichier joint</h4>
                    <a
                      href={selectedSoumission.fichier_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-600 px-4 py-3 rounded-xl hover:bg-blue-50 transition text-sm font-medium shadow-sm w-full sm:w-auto"
                    >
                      <FileText className="w-4 h-4" />
                      Ouvrir le travail de l'élève
                    </a>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    L'élève n'a pas joint de fichier.
                  </div>
                )}
              </div>

              {/* Formulaire notation */}
              <div className="p-6 border-t bg-white">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Évaluer ce travail</h4>
                
                {message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleNoteSubmit} className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Note (/20)</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={noteForm.note}
                      onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-center font-bold text-lg"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Appréciation (optionnelle)</label>
                    <input
                      type="text"
                      value={noteForm.commentaire}
                      onChange={(e) => setNoteForm({ ...noteForm, commentaire: e.target.value })}
                      placeholder="Très bon travail, attention à..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full sm:w-auto bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submitLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-600">Sélectionnez une copie</p>
              <p className="text-sm mt-2">Choisissez un élève dans la liste à gauche pour voir son travail et le noter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
