// app/dashboard/eleve/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Download,
  TrendingUp,
  Award
} from "lucide-react";

export default function EleveDashboard() {
  const [loading, setLoading] = useState(true);
  const [eleve, setEleve] = useState({
    nom: "Ibrahim",
    prenom: "Diallo",
    classe: "5ème A",
    moyenne: 14.5,
    rang: 6,
    totalEleves: 25
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const emploiDuTemps = [
    { heure: "08:00 - 09:30", matiere: "Mathématiques", salle: "Salle 12", professeur: "M. Camara" },
    { heure: "09:45 - 11:15", matiere: "Français", salle: "Salle 12", professeur: "Mme Barry" },
    { heure: "11:30 - 12:30", matiere: "Anglais", salle: "Labo 3", professeur: "M. Smith" },
    { heure: "12:30 - 13:30", matiere: "Pause déjeuner", salle: "Cantine", professeur: "-" },
    { heure: "13:30 - 15:00", matiere: "Histoire-Géo", salle: "Salle 8", professeur: "M. Konaté" },
  ];

  const devoirs = [
    { id: 1, matiere: "Mathématiques", titre: "Exercices p45", dateLimite: "15/05/2025", statut: "a_rendre", urgent: true },
    { id: 2, matiere: "Français", titre: "Rédaction", dateLimite: "18/05/2025", statut: "a_rendre", urgent: false },
    { id: 3, matiere: "Histoire", titre: "Dissertation", dateLimite: "10/05/2025", statut: "en_retard", urgent: true },
  ];

  const notes = [
    { matiere: "Mathématiques", note: 15, moyenneClasse: 12, appreciation: "Très bien" },
    { matiere: "Français", note: 14, moyenneClasse: 11, appreciation: "Bien" },
    { matiere: "Anglais", note: 12, moyenneClasse: 11, appreciation: "Bien" },
    { matiere: "Histoire", note: 10, moyenneClasse: 11, appreciation: "Passable" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Bonjour {eleve.prenom} !
        </h1>
        <p className="text-gray-500">{eleve.classe} - Année scolaire 2025-2026</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-4 text-white">
          <p className="text-sm opacity-90">Moyenne générale</p>
          <p className="text-3xl font-bold">{eleve.moyenne}/20</p>
          <p className="text-xs mt-2">Rang: {eleve.rang}e / {eleve.totalEleves}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-gray-500 text-sm">Absences</p>
          <p className="text-2xl font-bold text-orange-600">2</p>
          <p className="text-xs text-gray-500 mt-2">Dont 0 justifiée</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-gray-500 text-sm">Devoirs à rendre</p>
          <p className="text-2xl font-bold text-red-600">3</p>
          <p className="text-xs text-red-500 mt-2">1 en retard</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-gray-500 text-sm">Progression</p>
          <p className="text-2xl font-bold text-green-600">+2 pts</p>
          <p className="text-xs text-green-600 mt-2">vs trimestre dernier</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emploi du temps */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Emploi du temps - Aujourd'hui</h3>
            <button className="text-blue-600 text-sm hover:underline">Voir semaine</button>
          </div>
          <div className="divide-y">
            {emploiDuTemps.map((cours, idx) => (
              <div key={idx} className="px-6 py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{cours.matiere}</p>
                  <p className="text-xs text-gray-500">{cours.salle} • {cours.professeur}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{cours.heure}</p>
                  {cours.matiere === "Pause déjeuner" && (
                    <span className="text-xs text-green-600">🍽️</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devoirs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Devoirs à rendre</h3>
            <Link href="/dashboard/eleve/devoirs" className="text-blue-600 text-sm hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y">
            {devoirs.map((devoir) => (
              <div key={devoir.id} className="px-6 py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{devoir.matiere}</p>
                    <p className="text-sm text-gray-600">{devoir.titre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">À rendre le {devoir.dateLimite}</p>
                    {devoir.urgent && (
                      <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dernières notes */}
      <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Dernières notes</h3>
          <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
            <Download className="w-4 h-4" />
            Télécharger bulletin
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matière</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moyenne classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appréciation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notes.map((note, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 font-medium text-gray-800">{note.matiere}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${note.note >= 12 ? "text-green-600" : note.note >= 10 ? "text-orange-600" : "text-red-600"}`}>
                      {note.note}/20
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{note.moyenneClasse}/20</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${note.appreciation === "Très bien" || note.appreciation === "Bien" ? "text-green-600" : "text-orange-600"}`}>
                      {note.appreciation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}