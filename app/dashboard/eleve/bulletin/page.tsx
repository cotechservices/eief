// app/dashboard/eleve/bulletin/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Award, TrendingUp, BookOpen, Printer } from "lucide-react";

interface LigneBulletin {
  matiere: string;
  coefficient: number;
  enseignant: string;
  moyenne: number;
  moyenne_devoirs: number | null;
  moyenne_compositions: number | null;
  appreciation: string;
  nbNotes: number;
}

interface BulletinData {
  eleve: {
    nom: string;
    prenom: string;
    matricule: string;
    classe: string;
    niveau: string;
    annee_scolaire: string;
  };
  lignes: LigneBulletin[];
  moyenneGenerale: number;
  mentionGenerale: string;
  totalCoeff: number;
}

export default function BulletinPage() {
  const [loading, setLoading] = useState(true);
  const [bulletin, setBulletin] = useState<BulletinData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/eleve/bulletin")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setBulletin(d);
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const getAppreciationColor = (app: string) => {
    if (app === "Très Bien") return "text-green-700 bg-green-100";
    if (app === "Bien") return "text-blue-700 bg-blue-100";
    if (app === "Assez Bien") return "text-teal-700 bg-teal-100";
    if (app === "Passable") return "text-orange-700 bg-orange-100";
    return "text-red-700 bg-red-100";
  };

  const getMoyenneStyle = (moy: number) =>
    moy >= 14
      ? "text-green-700 font-bold"
      : moy >= 10
      ? "text-orange-600 font-semibold"
      : "text-red-600 font-bold";

  const getMentionBg = (moy: number) =>
    moy >= 14
      ? "from-green-500 to-emerald-600"
      : moy >= 10
      ? "from-orange-400 to-orange-500"
      : "from-red-500 to-rose-600";

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bulletin) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
        <p className="font-semibold">Bulletin indisponible</p>
        <p className="text-sm mt-1">{error || "Données non trouvées"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            Bulletin de notes
          </h1>
          <p className="text-gray-500 mt-1">Année scolaire {bulletin.eleve.annee_scolaire}</p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm print:hidden"
        >
          <Printer className="w-4 h-4" />
          Imprimer / Télécharger
        </button>
      </div>

      {/* Mention & Moyenne générale */}
      <div
        className={`bg-gradient-to-br ${getMentionBg(bulletin.moyenneGenerale)} rounded-2xl p-6 text-white shadow-lg`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold opacity-90">
              {bulletin.eleve.prenom} {bulletin.eleve.nom}
            </p>
            <p className="text-sm opacity-75 mt-1">
              Classe : {bulletin.eleve.classe} • Matricule : {bulletin.eleve.matricule}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80">Moyenne générale</p>
            <p className="text-6xl font-black">{bulletin.moyenneGenerale.toFixed(2)}</p>
            <p className="text-sm opacity-80">/20</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-80">Mention</p>
            <p className="text-2xl font-bold mt-1">{bulletin.mentionGenerale}</p>
            <p className="text-sm opacity-75 mt-1">{bulletin.totalCoeff} coefficients</p>
          </div>
        </div>
      </div>

      {/* Tableau des notes */}
      <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Détail des notes par matière
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Matière</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Coeff.</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Moy. Devoirs</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Moy. Compositions</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Moyenne</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Appréciation</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden sm:table-cell">Enseignant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bulletin.lignes.map((ligne, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{ligne.matiere}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{ligne.coefficient}</td>
                  <td className="px-4 py-3 text-center">
                    {ligne.moyenne_devoirs !== null ? (
                      <span className={getMoyenneStyle(ligne.moyenne_devoirs)}>
                        {ligne.moyenne_devoirs.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ligne.moyenne_compositions !== null ? (
                      <span className={getMoyenneStyle(ligne.moyenne_compositions)}>
                        {ligne.moyenne_compositions.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-lg ${getMoyenneStyle(ligne.moyenne)}`}
                    >
                      {ligne.moyenne.toFixed(2)}
                      <span className="text-xs font-normal text-gray-400">/20</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-lg font-medium ${getAppreciationColor(ligne.appreciation)}`}
                    >
                      {ligne.appreciation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {ligne.enseignant}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td colSpan={4} className="px-4 py-4 font-bold text-gray-900">
                  Moyenne Générale
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`text-xl font-black ${getMoyenneStyle(bulletin.moyenneGenerale)}`}
                  >
                    {bulletin.moyenneGenerale.toFixed(2)}
                    <span className="text-sm font-normal text-gray-400">/20</span>
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`text-sm px-3 py-1 rounded-lg font-semibold ${getAppreciationColor(bulletin.mentionGenerale)}`}
                  >
                    {bulletin.mentionGenerale}
                  </span>
                </td>
                <td className="hidden sm:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-500">
        <p className="font-semibold mb-2 text-gray-700">Barème des mentions :</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Très Bien", min: 16, color: "bg-green-100 text-green-700" },
            { label: "Bien", min: 14, color: "bg-blue-100 text-blue-700" },
            { label: "Assez Bien", min: 12, color: "bg-teal-100 text-teal-700" },
            { label: "Passable", min: 10, color: "bg-orange-100 text-orange-700" },
            { label: "Insuffisant", min: 0, color: "bg-red-100 text-red-700" },
          ].map((m) => (
            <span key={m.label} className={`px-2 py-1 rounded-lg ${m.color}`}>
              {m.label} (≥{m.min}/20)
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
