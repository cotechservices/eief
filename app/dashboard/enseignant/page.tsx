// app/dashboard/enseignant/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, BookOpen, CheckCircle, Clock, TrendingUp,
  Calendar, FileText, UserCheck, AlertCircle, Award
} from "lucide-react";

interface Profil {
  prenom: string;
  nom: string;
  email: string;
  statut: string;
}

interface Enseignement {
  enseignement_id: number;
  classe_nom: string;
  classe_niveau: string;
  matiere_nom: string;
  nb_eleves: number;
}

interface Stats {
  total_devoirs: number;
  soumissions_a_noter: number;
  total_examens: number;
}

export default function EnseignantDashboard() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/enseignant/profil")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setProfil(d.profil);
          setEnseignements(d.enseignements || []);
          setStats(d.stats);
        }
      })
      .catch(() => setError("Erreur de chargement des données"))
      .finally(() => setLoading(false));
  }, []);

  const classes = enseignements.reduce((acc, curr) => {
    if (!acc.find(c => c.classe_nom === curr.classe_nom)) {
      acc.push(curr);
    }
    return acc;
  }, [] as Enseignement[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord — M. {profil?.nom}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Enseignant {profil?.statut} • {profil?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/enseignant/devoirs/nouveau" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            + Nouveau Devoir
          </Link>
          <Link href="/dashboard/enseignant/evaluations/nouveau" className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition">
            + Créer QCM
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Mes classes</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{classes.length}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Devoirs publiés</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats?.total_devoirs || 0}</p>
            </div>
            <div className="bg-orange-50 p-2.5 rounded-xl">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Évaluations QCM</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats?.total_examens || 0}</p>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-xl">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-sm p-5 border ${Number(stats?.soumissions_a_noter) > 0 ? "border-red-200" : "border-gray-100"}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Copies à noter</p>
              <p className={`text-3xl font-bold mt-1 ${Number(stats?.soumissions_a_noter) > 0 ? "text-red-600" : "text-green-600"}`}>
                {stats?.soumissions_a_noter || 0}
              </p>
            </div>
            <div className={`${Number(stats?.soumissions_a_noter) > 0 ? "bg-red-50" : "bg-green-50"} p-2.5 rounded-xl`}>
              <CheckCircle className={`w-6 h-6 ${Number(stats?.soumissions_a_noter) > 0 ? "text-red-600" : "text-green-600"}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mes classes & enseignements */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Mes classes et matières
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {enseignements.length > 0 ? (
              enseignements.map((ens) => (
                <div key={ens.enseignement_id} className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900 text-lg">{ens.classe_nom}</h4>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">
                      {ens.nb_eleves} élèves
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{ens.matiere_nom}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/enseignant/devoirs?classe=${ens.classe_nom}`}
                      className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-100 font-medium"
                    >
                      Voir Devoirs
                    </Link>
                    <Link
                      href={`/dashboard/enseignant/evaluations?classe=${ens.classe_nom}`}
                      className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 font-medium"
                    >
                      Voir QCM
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p>Aucune classe ne vous a été assignée.</p>
              </div>
            )}
          </div>
        </div>

        {/* Espace pédagogique */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <FileText className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="font-bold text-gray-900 text-lg">Gestion des Devoirs</h3>
              <p className="text-sm text-gray-600 mt-1 mb-4">Créez des devoirs, suivez les soumissions et notez les travaux de vos élèves.</p>
              <Link href="/dashboard/enseignant/devoirs" className="text-sm font-semibold text-orange-700 hover:underline inline-flex items-center gap-1">
                Gérer les devoirs →
              </Link>
            </div>
            <FileText className="w-32 h-32 text-orange-100 absolute -right-6 -bottom-6 transform rotate-12 group-hover:rotate-6 transition-transform" />
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl p-6 border border-purple-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <Award className="w-8 h-8 text-purple-500 mb-3" />
              <h3 className="font-bold text-gray-900 text-lg">Évaluations QCM</h3>
              <p className="text-sm text-gray-600 mt-1 mb-4">Créez des QCM interactifs pour vos classes avec correction automatique.</p>
              <Link href="/dashboard/enseignant/evaluations" className="text-sm font-semibold text-purple-700 hover:underline inline-flex items-center gap-1">
                Gérer les QCM →
              </Link>
            </div>
            <Award className="w-32 h-32 text-purple-100 absolute -right-6 -bottom-6 transform rotate-12 group-hover:rotate-6 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}