"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, BookOpen, CheckCircle, Clock, TrendingUp,
  Calendar, FileText, UserCheck, AlertCircle, Award, GraduationCap,
  Loader2, Plus, Eye, Mail, Phone, MapPin
} from "lucide-react";

interface Profil {
  prenom: string;
  nom: string;
  email: string;
  statut: string;
}

interface Classe {
  classe_id: number;
  classe_nom: string;
  classe_niveau: string;
  salle: string;
  capacite_max: number;
  nb_eleves_inscrits: number;
  nb_garcons: number;
  nb_filles: number;
  matieres: string;
}

interface Stats {
  total_devoirs: number;
  soumissions_a_noter: number;
  total_examens: number;
  total_eleves: number;
  total_classes: number;
}

export default function EnseignantDashboard() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnseignantData();
  }, []);

  const fetchEnseignantData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/enseignant/profil");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur de chargement des données");
      }
      const data = await response.json();
      
      setProfil(data.profil);
      setClasses(data.classes || []);
      setStats(data.stats);
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err.message || "Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium">{error}</p>
        <button 
          onClick={fetchEnseignantData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profil?.prenom} {profil?.nom}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${profil?.statut === 'actif' ? 'bg-green-500' : 'bg-gray-400'}`} />
            Enseignant {profil?.statut || 'inconnu'} • {profil?.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
         {/*  <Link href="/dashboard/enseignant/quiz/nouveau" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau quiz
          </Link> */}
          <Link href="/dashboard/enseignant/devoirs/nouveau" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Devoir
          </Link>
          <Link href="/dashboard/enseignant/evaluations/nouveau" className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Évaluation
          </Link>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Mes classes</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.total_classes || 0}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total élèves</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats?.total_eleves || 0}</p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Devoirs</p>
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
              <p className="text-gray-500 text-sm">Évaluations</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats?.total_examens || 0}</p>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-xl">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      {/* Espace pédagogique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <FileText className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="font-bold text-gray-900 text-lg">Gestion des Devoirs</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              {stats?.total_devoirs || 0} devoir(s) publié(s)
              {stats?.soumissions_a_noter && stats.soumissions_a_noter > 0 && (
                <span className="block text-orange-600 font-medium mt-1">
                  {stats.soumissions_a_noter} soumission(s) à noter
                </span>
              )}
            </p>
            <Link href="/dashboard/enseignant/devoirs" className="text-sm font-semibold text-orange-700 hover:underline inline-flex items-center gap-1">
              Gérer les devoirs →
            </Link>
          </div>
          <FileText className="w-32 h-32 text-orange-100 absolute -right-6 -bottom-6 transform rotate-12 group-hover:rotate-6 transition-transform" />
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl p-6 border border-purple-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <Award className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-bold text-gray-900 text-lg">Évaluations</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              {stats?.total_examens || 0} évaluation(s) créée(s)
              <span className="block text-purple-600 font-medium mt-1">
                Correction automatique
              </span>
            </p>
            <Link href="/dashboard/enseignant/evaluations" className="text-sm font-semibold text-purple-700 hover:underline inline-flex items-center gap-1">
              Gérer les évaluations →
            </Link>
          </div>
          <Award className="w-32 h-32 text-purple-100 absolute -right-6 -bottom-6 transform rotate-12 group-hover:rotate-6 transition-transform" />
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <UserCheck className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-bold text-gray-900 text-lg">Présences</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              {stats?.total_eleves || 0} élèves à suivre
              <span className="block text-green-600 font-medium mt-1">
                Gérez les présences de vos classes
              </span>
            </p>
            <Link href="/dashboard/enseignant/classes" className="text-sm font-semibold text-green-700 hover:underline inline-flex items-center gap-1">
              Voir les présences →
            </Link>
          </div>
          <UserCheck className="w-32 h-32 text-green-100 absolute -right-6 -bottom-6 transform rotate-12 group-hover:rotate-6 transition-transform" />
        </div>
      </div>
    </div>
  );
}