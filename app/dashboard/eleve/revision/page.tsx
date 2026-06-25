// app/dashboard/eleve/revision/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Brain, BookOpen, Search, Video, FileText, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Lecon {
  id: number;
  titre: string;
  description: string;
  contenu: string;
  fichier_url: string | null;
  video_url: string | null;
  date_publication: string;
}

interface MatiereLecons {
  matiere: string;
  enseignant: string;
  lecons: Lecon[];
}

export default function RevisionPage() {
  const [data, setData] = useState<MatiereLecons[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMatiere, setExpandedMatiere] = useState<string | null>(null);
  const [selectedLecon, setSelectedLecon] = useState<Lecon | null>(null);

  useEffect(() => {
    fetch("/api/eleve/lecons")
      .then((r) => r.json())
      .then((d) => {
        setData(d.parMatiere || []);
        if (d.parMatiere?.length > 0) {
          setExpandedMatiere(d.parMatiere[0].matiere);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredData = data.map((m) => ({
    ...m,
    lecons: m.lecons.filter((l) =>
      l.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter((m) => m.lecons.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar - Liste des cours */}
      <div className="w-full md:w-1/3 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-blue-600" />
            Espace Révision
          </h1>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chercher une leçon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune leçon trouvée</p>
            </div>
          ) : (
            filteredData.map((m) => (
              <div key={m.matiere} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedMatiere(expandedMatiere === m.matiere ? null : m.matiere)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <span className="font-semibold text-gray-800 text-sm">{m.matiere}</span>
                  {expandedMatiere === m.matiere ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {expandedMatiere === m.matiere && (
                  <div className="divide-y divide-gray-50">
                    {m.lecons.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLecon(l)}
                        className={`w-full text-left p-3 hover:bg-blue-50 transition ${
                          selectedLecon?.id === l.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{l.titre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">
                            {new Date(l.date_publication).toLocaleDateString()}
                          </span>
                          {l.video_url && <Video className="w-3 h-3 text-red-400" />}
                          {l.fichier_url && <FileText className="w-3 h-3 text-blue-400" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Détail leçon */}
      <div className="w-full md:w-2/3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
        {selectedLecon ? (
          <>
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedLecon.titre}</h2>
              <p className="text-sm text-gray-600">{selectedLecon.description}</p>
              
              <div className="flex gap-3 mt-4">
                {selectedLecon.video_url && (
                  <a
                    href={selectedLecon.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition font-medium"
                  >
                    <Video className="w-4 h-4" /> Voir la vidéo
                  </a>
                )}
                {selectedLecon.fichier_url && (
                  <a
                    href={selectedLecon.fichier_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition font-medium"
                  >
                    <FileText className="w-4 h-4" /> Télécharger PDF
                  </a>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 prose prose-blue max-w-none">
              <ReactMarkdown>{selectedLecon.contenu}</ReactMarkdown>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Brain className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-600">Sélectionnez une leçon</p>
            <p className="text-sm mt-2">Choisissez une leçon dans le menu de gauche pour commencer vos révisions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
