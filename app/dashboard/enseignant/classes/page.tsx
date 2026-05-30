// app/dashboard/enseignant/classes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, GraduationCap, Eye, BookOpen, Calendar, CheckCircle } from "lucide-react";

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  effectif: number;
  heuresSemaine: number;
  presence: number;
  moyenne: number;
}

export default function EnseignantClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setClasses([
        { id: 1, nom: "5ème A", niveau: "5ème", effectif: 25, heuresSemaine: 6, presence: 94, moyenne: 14.5 },
        { id: 2, nom: "4ème A", niveau: "4ème", effectif: 24, heuresSemaine: 5, presence: 90, moyenne: 13.8 },
        { id: 3, nom: "6ème B", niveau: "6ème", effectif: 22, heuresSemaine: 4, presence: 88, moyenne: 12.5 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Mes classes</h1><p className="text-gray-500">Gérez vos classes et vos élèves</p></div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classe) => (
          <div key={classe.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white"><h3 className="text-xl font-bold">{classe.nom}</h3><p className="text-sm opacity-90">{classe.niveau}</p></div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-gray-600"><Users className="w-4 h-4" />Élèves</div><span className="font-medium">{classe.effectif}</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4" />Heures/semaine</div><span className="font-medium">{classe.heuresSemaine}h</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-gray-600"><CheckCircle className="w-4 h-4" />Présence</div><span className="text-green-600 font-medium">{classe.presence}%</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-gray-600"><GraduationCap className="w-4 h-4" />Moyenne</div><span className="text-blue-600 font-medium">{classe.moyenne}/20</span></div>
              <div className="flex gap-2 pt-2">
                <Link href={`/dashboard/enseignant/classes/${classe.id}/presences`} className="flex-1 text-center text-sm bg-blue-50 text-blue-600 px-2 py-1.5 rounded-lg">Présences</Link>
                <Link href={`/dashboard/enseignant/classes/${classe.id}/devoirs`} className="flex-1 text-center text-sm bg-orange-50 text-orange-600 px-2 py-1.5 rounded-lg">Devoirs</Link>
                <Link href={`/dashboard/enseignant/classes/${classe.id}/notes`} className="flex-1 text-center text-sm bg-green-50 text-green-600 px-2 py-1.5 rounded-lg">Notes</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}