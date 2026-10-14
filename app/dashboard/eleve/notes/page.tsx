// app/dashboard/eleve/notes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  GraduationCap, Award, TrendingUp, BookOpen, Clock,
  CheckCircle, AlertCircle, FileText, ChevronRight, User
} from "lucide-react";

interface NoteItem {
  id: number;
  valeur: number;
  coefficient: number;
  type_note: string;
  date_saisie: string;
  commentaire?: string;
}

interface MatiereNotes {
  matiere: string;
  coefficient: number;
  enseignant: string;
  moyenne: number;
  notes: NoteItem[];
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const eleveId = searchParams.get("eleveId");
  const [loading, setLoading] = useState(true);
  const [matieres, setMatieres] = useState<MatiereNotes[]>([]);
  const [moyenneGenerale, setMoyenneGenerale] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eleveId) {
      document.cookie = `active_eleve_id=${eleveId}; path=/; max-age=86400`;
    }

    async function loadNotes() {
      try {
        const queryParam = eleveId ? `?eleveId=${eleveId}` : "";
        const res = await fetch(`/api/eleve/notes${queryParam}`);
        if (!res.ok) throw new Error("Erreur de chargement");
        const data = await res.json();
        setMatieres(data.matieres || []);
        setMoyenneGenerale(data.moyenneGenerale || 0);
        setTotalNotes(data.totalNotes || 0);
      } catch (err) {
        setError("Impossible de charger les notes");
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [eleveId]);

  const getMoyenneColor = (moy: number) => {
    if (moy >= 16) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (moy >= 14) return "text-blue-700 bg-blue-50 border-blue-200";
    if (moy >= 12) return "text-indigo-700 bg-indigo-50 border-indigo-200";
    if (moy >= 10) return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const getMention = (moy: number) => {
    if (moy >= 16) return "Très Bien";
    if (moy >= 14) return "Bien";
    if (moy >= 12) return "Assez Bien";
    if (moy >= 10) return "Passable";
    return "Insuffisant";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            Mes Notes et Évaluations
          </h1>
          <p className="text-gray-900 mt-1">Détails des notes par matière et moyennes trimestrielles</p>
        </div>
        <Link
          href={`/dashboard/eleve/bulletin${eleveId ? `?eleveId=${eleveId}` : ""}`}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-sm text-sm"
        >
          <FileText className="w-4 h-4" />
          Consulter le bulletin officiel
        </Link>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Moyenne Générale</p>
            <Award className="w-5 h-5 text-blue-200" />
          </div>
          <p className="text-3xl font-extrabold mt-2">{moyenneGenerale.toFixed(2)} / 20</p>
          <p className="text-xs text-blue-100 mt-1">Mention: {getMention(moyenneGenerale)}</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-gray-900 text-xs font-semibold uppercase tracking-wider">Total Évaluations</p>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalNotes}</p>
          <p className="text-xs text-gray-900 mt-1">Notes enregistrées</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-gray-900 text-xs font-semibold uppercase tracking-wider">Matières Évaluées</p>
            <BookOpen className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{matieres.length}</p>
          <p className="text-xs text-gray-900 mt-1">Matières au programme</p>
        </div>
      </div>

      {/* Liste des matières */}
      {matieres.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">Aucune note enregistrée</h3>
          <p className="text-sm text-gray-900 mt-1">Les évaluations apparaîtront dès leur saisie par les enseignants.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matieres.map((m, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{m.matiere}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-900 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {m.enseignant}
                    </span>
                    <span>•</span>
                    <span>Coeff: {m.coefficient}</span>
                    <span>•</span>
                    <span>{m.notes.length} note(s)</span>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-xl border font-bold text-base ${getMoyenneColor(m.moyenne)}`}>
                  Moyenne : {m.moyenne.toFixed(2)} / 20
                </div>
              </div>

              {/* Liste des notes de la matière */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {m.notes.map((n) => (
                  <div key={n.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-gray-900 tracking-wider">
                        {n.type_note || "Devoir"}
                      </span>
                      <span className="text-xs text-gray-900">
                        Coeff {n.coefficient}
                      </span>
                    </div>

                    <div className="my-2">
                      <span className={`text-xl font-black ${n.valeur >= 10 ? "text-blue-700" : "text-red-600"}`}>
                        {n.valeur}
                      </span>
                      <span className="text-xs text-gray-900"> / 20</span>
                    </div>

                    <div className="text-[11px] text-gray-900 flex items-center justify-between">
                      <span>{new Date(n.date_saisie).toLocaleDateString()}</span>
                      {n.commentaire && (
                        <span className="truncate max-w-[120px] italic" title={n.commentaire}>
                          "{n.commentaire}"
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
