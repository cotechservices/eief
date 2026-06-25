// app/dashboard/enseignant/devoirs/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Plus, Users, Calendar, AlertCircle, Eye, CheckCircle } from "lucide-react";

interface Devoir {
  id: number;
  titre: string;
  matiere: string;
  classe: string;
  date_limite: string;
  date_publication: string;
  nb_soumissions: number;
  nb_eleves_classe: number;
  nb_notes: number;
}

export default function EnseignantDevoirsPage() {
  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/enseignant/devoirs")
      .then((r) => r.json())
      .then((d) => setDevoirs(d.devoirs || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" />
            Gestion des Devoirs
          </h1>
          <p className="text-gray-500 mt-1">Vos devoirs publiés et suivi des soumissions</p>
        </div>
        <Link
          href="/dashboard/enseignant/devoirs/nouveau"
          className="inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-700 transition"
        >
          <Plus className="w-4 h-4" /> Créer un devoir
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devoirs.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">Aucun devoir publié</p>
            <p className="text-sm mt-1">Cliquez sur "Créer un devoir" pour commencer.</p>
          </div>
        ) : (
          devoirs.map((devoir) => {
            const tauxSoumission = devoir.nb_eleves_classe > 0
              ? Math.round((devoir.nb_soumissions / devoir.nb_eleves_classe) * 100)
              : 0;
              
            const isFinished = devoir.nb_notes === devoir.nb_soumissions && devoir.nb_soumissions > 0;

            return (
              <div key={devoir.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
                <div className="p-5 border-b flex-1">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">
                      {devoir.classe}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(devoir.date_publication).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 leading-tight">{devoir.titre}</h3>
                  <p className="text-sm text-gray-500 mt-1">{devoir.matiere}</p>
                </div>
                
                <div className="bg-gray-50 p-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium flex items-center gap-1">
                      <Users className="w-4 h-4" /> Soumissions
                    </span>
                    <span className="font-bold text-gray-900">
                      {devoir.nb_soumissions} / {devoir.nb_eleves_classe}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full ${tauxSoumission === 100 ? 'bg-green-500' : 'bg-orange-500'}`} 
                      style={{ width: `${tauxSoumission}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs font-medium">
                      {isFinished ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Entièrement noté
                        </span>
                      ) : devoir.nb_soumissions > 0 ? (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {devoir.nb_soumissions - devoir.nb_notes} à noter
                        </span>
                      ) : (
                        <span className="text-gray-400">En attente des élèves</span>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/enseignant/devoirs/${devoir.id}/soumissions`}
                      className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-orange-300 hover:text-orange-600 transition flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> Voir copies
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}