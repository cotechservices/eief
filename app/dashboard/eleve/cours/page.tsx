"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, Video, FileText, Download, Calendar,
  BookMarked, ExternalLink, Loader2
} from "lucide-react";

interface Lecon {
  id: number;
  titre: string;
  description: string;
  contenu: string;
  fichier_url: string;
  video_url: string;
  date_publication: string;
}

interface MatiereLecons {
  matiere: string;
  enseignant: string;
  lecons: Lecon[];
}

export default function CoursElevePage() {
  const [loading, setLoading] = useState(true);
  const [leconsParMatiere, setLeconsParMatiere] = useState<MatiereLecons[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/eleve/lecons");
        if (res.ok) {
          const data = await res.json();
          setLeconsParMatiere(data.parMatiere || []);
        } else {
          setError("Erreur de chargement des cours.");
        }
      } catch (err) {
        setError("Impossible de charger les cours.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
        <BookOpen className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  const toutesLesLecons = leconsParMatiere
    .flatMap(m => m.lecons.map(l => ({ ...l, matiere: m.matiere, enseignant: m.enseignant })))
    .sort((a, b) => new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime());

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-blue-600" />
          Mes Cours & Leçons
        </h1>
        <p className="text-gray-900 mt-1">Consultez les supports de cours partagés par vos professeurs.</p>
      </div>

      {toutesLesLecons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <BookOpen className="w-12 h-12 text-gray-900 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours disponible</h3>
          <p className="text-gray-900">Vos professeurs n'ont pas encore publié de leçons pour votre classe.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {toutesLesLecons.map((lecon) => (
            <div key={lecon.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{lecon.titre}</h3>
                    <p className="text-sm text-gray-900 mt-1">
                      Professeur: {lecon.enseignant}
                      {lecon.matiere && lecon.matiere !== 'Général' && ` • Matière: ${lecon.matiere}`}
                    </p>
                  </div>
                  <div className="flex items-center text-xs text-gray-900 bg-gray-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {new Date(lecon.date_publication).toLocaleDateString()}
                  </div>
                </div>
                {lecon.description && (
                  <p className="text-gray-900 text-sm mt-3">{lecon.description}</p>
                )}
                {lecon.contenu && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">
                    {lecon.contenu}
                  </div>
                )}
              </div>

              {/* Ressources jointes */}
              {(lecon.fichier_url || lecon.video_url) && (
                <div className="bg-gray-50/50 p-4 px-6 flex flex-wrap gap-3">
                  {lecon.fichier_url && (
                    <a
                      href={lecon.fichier_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium rounded-lg text-gray-900 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition"
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      Document joint
                      <Download className="w-3.5 h-3.5 ml-1 opacity-50" />
                    </a>
                  )}
                  {lecon.video_url && (
                    <a
                      href={lecon.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium rounded-lg text-gray-900 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                    >
                      <Video className="w-4 h-4 text-red-500" />
                      Voir la vidéo
                      <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-50" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
