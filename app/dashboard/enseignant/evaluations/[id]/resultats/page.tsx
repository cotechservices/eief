// app/dashboard/enseignant/evaluations/[id]/resultats/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, Users, Printer, CheckCircle, TrendingUp, BookOpen } from "lucide-react";

interface Resultat {
  eleve_id: number;
  nom: string;
  prenom: string;
  email: string;
  score: number;
  total_points: number;
  nb_correctes: number;
  nb_reponses: number;
  note: string; // venant de la DB c'est un string numeric
}

interface Examen {
  id: number;
  titre: string;
  matiere: string;
  classe: string;
}

export default function ResultatsQCMPage() {
  const params = useParams();
  const examenId = params.id;
  
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [examen, setExamen] = useState<Examen | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/enseignant/evaluations/${examenId}/resultats`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setExamen(d.examen);
          setResultats(d.resultats || []);
        }
      })
      .finally(() => setLoading(false));
  }, [examenId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!examen) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Évaluation introuvable ou vous n'avez pas l'accès.</p>
        <Link href="/dashboard/enseignant/evaluations" className="text-purple-600 text-sm mt-2 block hover:underline">
          ← Retour aux évaluations
        </Link>
      </div>
    );
  }

  // Stats
  const notesNumber = resultats.map(r => parseFloat(r.note));
  const moyenneClass = notesNumber.length > 0 
    ? (notesNumber.reduce((a,b) => a+b, 0) / notesNumber.length).toFixed(2) 
    : "0.00";
  const maxNote = notesNumber.length > 0 ? Math.max(...notesNumber).toFixed(2) : "0.00";
  const minNote = notesNumber.length > 0 ? Math.min(...notesNumber).toFixed(2) : "0.00";
  const reussites = notesNumber.filter(n => n >= 10).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/dashboard/enseignant/evaluations"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux évaluations
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimer les résultats
        </button>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Header Examen */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-purple-50 to-fuchsia-50">
            <div>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wide">
                Résultats QCM
              </span>
              <h1 className="text-2xl font-black text-gray-900 mt-3">{examen.titre}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 font-medium">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-purple-500" /> {examen.matiere}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-purple-500" /> {examen.classe}</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm text-center min-w-[120px]">
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Moyenne</p>
                <p className="text-3xl font-black text-purple-600">{moyenneClass}<span className="text-lg text-purple-400">/20</span></p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm text-center min-w-[120px]">
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Taux réussite</p>
                <p className="text-3xl font-black text-green-600">
                  {resultats.length > 0 ? Math.round((reussites / resultats.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white px-6 py-4 flex flex-wrap justify-between items-center text-sm font-medium border-t border-purple-100">
            <div className="flex gap-6">
              <span className="text-gray-600">Participants : <strong className="text-gray-900">{resultats.length}</strong></span>
              <span className="text-gray-600">Note max : <strong className="text-green-600">{maxNote}</strong></span>
              <span className="text-gray-600">Note min : <strong className="text-red-600">{minNote}</strong></span>
            </div>
          </div>
        </div>

        {/* Tableau des résultats */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 border-b">Élève</th>
                  <th className="px-6 py-4 border-b text-center">Score exact</th>
                  <th className="px-6 py-4 border-b text-center">Rép. Correctes</th>
                  <th className="px-6 py-4 border-b text-center">Note /20</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      Aucun élève n'a encore passé cet examen.
                    </td>
                  </tr>
                ) : (
                  resultats.map((res, index) => {
                    const noteNum = parseFloat(res.note);
                    return (
                      <tr key={res.eleve_id} className="hover:bg-purple-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 font-mono text-xs">{index + 1}.</span>
                            <div>
                              <p className="font-bold text-gray-900">{res.nom} {res.prenom}</p>
                              <p className="text-xs text-gray-500">{res.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {res.score} / {res.total_points} pts
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            {res.nb_correctes} / {res.nb_reponses}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[3.5rem] px-2 py-1 rounded-xl font-bold text-base ${
                            noteNum >= 14 ? "bg-green-100 text-green-700" :
                            noteNum >= 10 ? "bg-orange-100 text-orange-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {res.note}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
