// app/dashboard/enseignant/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  UserCheck
} from "lucide-react";

export default function EnseignantDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const classes = [
    { id: 1, nom: "5ème A", eleves: 25, heuresSemaine: 6, presence: 92, devoirsNonCorriges: 8 },
    { id: 2, nom: "4ème A", eleves: 22, heuresSemaine: 5, presence: 88, devoirsNonCorriges: 5 },
    { id: 3, nom: "6ème B", eleves: 24, heuresSemaine: 4, presence: 90, devoirsNonCorriges: 3 },
  ];

  const emploiDuTemps = [
    { heure: "08:00 - 09:30", classe: "5ème A", salle: "Salle 12", statut: "cours" },
    { heure: "09:45 - 11:15", classe: "4ème A", salle: "Salle 12", statut: "cours" },
    { heure: "11:30 - 12:30", classe: "Conseil pédagogique", salle: "Salle des profs", statut: "reunion" },
    { heure: "13:30 - 15:00", classe: "6ème B", salle: "Salle 8", statut: "cours" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Enseignant</h1>
        <p className="text-gray-900">Mathématiques - Année scolaire 2025-2026</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Mes classes</p>
              <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Total élèves</p>
              <p className="text-2xl font-bold text-green-600">
                {classes.reduce((acc, c) => acc + c.eleves, 0)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Devoirs à corriger</p>
              <p className="text-2xl font-bold text-orange-600">
                {classes.reduce((acc, c) => acc + c.devoirsNonCorriges, 0)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-900 text-sm">Présence moyenne</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(classes.reduce((acc, c) => acc + c.presence, 0) / classes.length)}%
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes classes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Mes classes</h3>
          </div>
          <div className="divide-y">
            {classes.map((classe) => (
              <div key={classe.id} className="px-6 py-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{classe.nom}</h4>
                  <span className="text-sm text-gray-900">{classe.eleves} élèves</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-900">Heures/semaine</p>
                    <p className="text-sm font-medium">{classe.heuresSemaine}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-900">Présence</p>
                    <p className="text-sm font-medium text-green-600">{classe.presence}%</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/enseignant/classes/${classe.id}/presences`}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100"
                  >
                    Appel
                  </Link>
                  <Link
                    href={`/dashboard/enseignant/classes/${classe.id}/devoirs`}
                    className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-lg hover:bg-orange-100"
                  >
                    Devoirs ({classe.devoirsNonCorriges})
                  </Link>
                  <Link
                    href={`/dashboard/enseignant/classes/${classe.id}/notes`}
                    className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100"
                  >
                    Notes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emploi du temps */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Emploi du temps - Aujourd'hui</h3>
            <button className="text-blue-600 text-sm hover:underline">Voir la semaine</button>
          </div>
          <div className="divide-y">
            {emploiDuTemps.map((cours, idx) => (
              <div key={idx} className="px-6 py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{cours.classe}</p>
                  <p className="text-xs text-gray-900">{cours.salle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{cours.heure}</p>
                  {cours.statut === "cours" && (
                    <span className="text-xs text-green-600">Cours</span>
                  )}
                  {cours.statut === "reunion" && (
                    <span className="text-xs text-purple-600">Réunion</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/enseignant/lecons/nouvelle"
          className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
            <BookOpen className="w-6 h-6 text-blue-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900">Nouvelle leçon</p>
        </Link>
        <Link
          href="/dashboard/enseignant/devoirs/nouveau"
          className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-600 transition">
            <FileText className="w-6 h-6 text-orange-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900">Nouveau devoir</p>
        </Link>
        <Link
          href="/dashboard/enseignant/presences/appel"
          className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition">
            <UserCheck className="w-6 h-6 text-green-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900">Faire l'appel</p>
        </Link>
        <Link
          href="/dashboard/enseignant/notes/saisie"
          className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition">
            <TrendingUp className="w-6 h-6 text-purple-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900">Saisir notes</p>
        </Link>
      </div>
    </div>
  );
}