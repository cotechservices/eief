// app/dashboard/eleve/devoirs/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, CheckCircle, AlertCircle, Clock, Upload, ChevronRight, Filter
} from "lucide-react";

interface Devoir {
  id: number;
  titre: string;
  description: string;
  matiere: string;
  enseignant: string;
  date_limite: string;
  date_publication: string;
  statut: "a_rendre" | "soumis" | "en_retard";
  joursRestants: number;
  soumission_id: number | null;
  note_soumission: number | null;
  commentaire_soumission: string | null;
}

export default function DevoirsPage() {
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<"tous" | "a_rendre" | "soumis" | "en_retard">("tous");

  useEffect(() => {
    fetch("/api/eleve/devoirs")
      .then((r) => r.json())
      .then((d) => setDevoirs(d.devoirs || []))
      .finally(() => setLoading(false));
  }, []);

  const devoirsFiltres =
    filtre === "tous" ? devoirs : devoirs.filter((d) => d.statut === filtre);

  const stats = {
    aRendre: devoirs.filter((d) => d.statut === "a_rendre").length,
    soumis: devoirs.filter((d) => d.statut === "soumis").length,
    enRetard: devoirs.filter((d) => d.statut === "en_retard").length,
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "soumis":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">
            <CheckCircle className="w-3 h-3" /> Soumis
          </span>
        );
      case "en_retard":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">
            <AlertCircle className="w-3 h-3" /> En retard
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-medium">
            <Clock className="w-3 h-3" /> À rendre
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-500" />
          Mes devoirs
        </h1>
        <p className="text-gray-500 mt-1">Tous les devoirs envoyés par vos enseignants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{stats.aRendre}</p>
          <p className="text-xs text-orange-500 mt-1">À rendre</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.soumis}</p>
          <p className="text-xs text-green-500 mt-1">Soumis</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.enRetard}</p>
          <p className="text-xs text-red-500 mt-1">En retard</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(["tous", "a_rendre", "en_retard", "soumis"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filtre === f
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            {f === "tous" ? "Tous" : f === "a_rendre" ? "À rendre" : f === "en_retard" ? "En retard" : "Soumis"}
          </button>
        ))}
      </div>

      {/* Liste devoirs */}
      <div className="space-y-3">
        {devoirsFiltres.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p className="font-medium">Aucun devoir dans cette catégorie</p>
          </div>
        ) : (
          devoirsFiltres.map((devoir) => (
            <Link
              key={devoir.id}
              href={`/dashboard/eleve/devoirs/${devoir.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-300 hover:shadow-sm transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                      {devoir.matiere}
                    </span>
                    {getStatutBadge(devoir.statut)}
                    {devoir.note_soumission !== null && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-semibold">
                        Note : {devoir.note_soumission}/20
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1 truncate">{devoir.titre}</h3>
                  {devoir.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{devoir.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>Enseignant : {devoir.enseignant}</span>
                    <span>
                      Date limite :{" "}
                      {new Date(devoir.date_limite).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {devoir.statut !== "soumis" && (
                    <span
                      className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        devoir.joursRestants <= 0
                          ? "bg-red-100 text-red-600"
                          : devoir.joursRestants <= 2
                          ? "bg-red-100 text-red-600"
                          : devoir.joursRestants <= 5
                          ? "bg-orange-100 text-orange-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {devoir.joursRestants > 0 ? `J-${devoir.joursRestants}` : "Expiré"}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
