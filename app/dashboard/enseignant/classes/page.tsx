// app/dashboard/enseignant/classes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, GraduationCap, Eye, BookOpen, Calendar, CheckCircle, Loader2 } from "lucide-react";

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  effectif: number;
  heuresSemaine: number;
  presence: number;
  moyenne: number;
  matieres?: string[];
}

export default function EnseignantClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les classes de l'enseignant connecté
      const response = await fetch("/api/enseignant/classes");
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du chargement des classes");
      }
      
      const data = await response.json();
      setClasses(data);
    } catch (error: any) {
      console.error("Erreur:", error);
      setError(error.message || "Impossible de charger les classes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement de vos classes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
        <p className="font-medium">❌ {error}</p>
        <button 
          onClick={fetchClasses}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Aucune classe assignée</h3>
        <p className="text-gray-500 mt-1">Vous n'avez pas encore de classes assignées.</p>
        <p className="text-sm text-gray-400 mt-2">Contactez l'administrateur pour obtenir des classes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes classes</h1>
        <p className="text-gray-500">Gérez vos classes et vos élèves</p>
        <p className="text-sm text-blue-600 mt-1">
          {classes.length} classe{classes.length > 1 ? 's' : ''} assignée{classes.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Grille des classes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classe) => (
          <div 
            key={classe.id} 
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition border border-gray-100"
          >
            {/* En-tête de la classe */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <h3 className="text-xl font-bold">{classe.nom}</h3>
              <p className="text-sm opacity-90">{classe.niveau}</p>
              {classe.matieres && classe.matieres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {classe.matieres.slice(0, 3).map((matiere, index) => (
                    <span key={index} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {matiere}
                    </span>
                  ))}
                  {classe.matieres.length > 3 && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      +{classe.matieres.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Élèves</span>
                </div>
                <span className="font-medium text-gray-900">{classe.effectif}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Heures/semaine</span>
                </div>
                <span className="font-medium text-gray-900">{classe.heuresSemaine}h</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Présence</span>
                </div>
                <span className={`font-medium ${
                  (classe.presence || 0) >= 90 ? 'text-green-600' : 
                  (classe.presence || 0) >= 75 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {classe.presence || 0}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-sm">Moyenne</span>
                </div>
                <span className={`font-medium ${
                  (classe.moyenne || 0) >= 14 ? 'text-green-600' : 
                  (classe.moyenne || 0) >= 10 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {classe.moyenne || 0}/20
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Link 
                  href={`/dashboard/enseignant/classes/${classe.id}/presences`}
                  className="flex-1 text-center text-xs bg-blue-50 text-blue-600 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium"
                >
                  Présences
                </Link>
                <Link 
                  href={`/dashboard/enseignant/classes/${classe.id}/devoirs`}
                  className="flex-1 text-center text-xs bg-orange-50 text-orange-600 px-2 py-1.5 rounded-lg hover:bg-orange-100 transition font-medium"
                >
                  Devoirs
                </Link>
                <Link 
                  href={`/dashboard/enseignant/classes/${classe.id}/notes`}
                  className="flex-1 text-center text-xs bg-green-50 text-green-600 px-2 py-1.5 rounded-lg hover:bg-green-100 transition font-medium"
                >
                  Notes
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}