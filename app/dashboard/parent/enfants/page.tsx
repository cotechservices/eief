// app/dashboard/parent/enfants/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  Calendar, 
  GraduationCap,
  Eye,
  AlertCircle,
  Loader2
} from "lucide-react";

interface Enfant {
  id: number;
  eleve_id: number;
  nom: string;
  prenom: string;
  classe_nom: string;
  matricule: string;
}

interface Stats {
  notes: Array<{ matiere: string; moyenne: number; coefficient: number }>;
  presences: { total: number; presents: number; absents: number; retards: number };
  paiements: { total_paye: number; nombre_paiements: number };
}

export default function MesEnfantsPage() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [statsEnfant, setStatsEnfant] = useState<{ [key: number]: Stats }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnfants();
  }, []);

  const fetchEnfants = async () => {
    try {
      const response = await fetch("/api/parent/enfants");
      const data = await response.json();
      setEnfants(data);
      
      // Charger les statistiques pour chaque enfant
      for (const enfant of data) {
        const statsResponse = await fetch(`/api/parent/enfants/${enfant.eleve_id}/stats`);
        const statsData = await statsResponse.json();
        
        // 🔥 CORRECTION : Nettoyer les données reçues
        const cleanedStats = {
          ...statsData,
          paiements: {
            total_paye: typeof statsData.paiements?.total_paye === 'number' 
              ? statsData.paiements.total_paye 
              : parseFloat(statsData.paiements?.total_paye) || 0,
            nombre_paiements: typeof statsData.paiements?.nombre_paiements === 'number'
              ? statsData.paiements.nombre_paiements
              : parseInt(statsData.paiements?.nombre_paiements) || 0
          }
        };
        
        setStatsEnfant(prev => ({ ...prev, [enfant.eleve_id]: cleanedStats }));
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CORRECTION : Calculer le total des paiements correctement
  const totalPayeCalcule = () => {
    let total = 0;
    Object.values(statsEnfant).forEach(s => {
      if (s?.paiements?.total_paye) {
        const montant = typeof s.paiements.total_paye === 'number' 
          ? s.paiements.total_paye 
          : parseFloat(String(s.paiements.total_paye));
        if (!isNaN(montant) && montant < 100000000) { // Vérifier que c'est plausible
          total += montant;
        }
      }
    });
    return total;
  };

  const statsGlobales = {
    totalEnfants: enfants.length,
    totalAbsences: Object.values(statsEnfant).reduce((acc, s) => acc + (s.presences?.absents || 0), 0),
    totalRetards: Object.values(statsEnfant).reduce((acc, s) => acc + (s.presences?.retards || 0), 0),
    totalPaye: totalPayeCalcule(),
  };

  // 🔥 Debug: Afficher les valeurs dans la console
  console.log("=== DEBUG STATS GLOBALES ===");
  console.log("statsEnfant:", statsEnfant);
  console.log("totalPaye calcule:", totalPayeCalcule());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mes enfants</h1>
        <p className="text-gray-500">Gérez le suivi scolaire de vos enfants</p>
      </div>

      {/* Statistiques globales en cartes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><Calendar className="w-5 h-5" /><p className="text-sm">Absences totales</p></div>
          <p className="text-2xl font-bold text-orange-600">{statsGlobales.totalAbsences}</p>
          <p className="text-xs text-gray-500">Retards: {statsGlobales.totalRetards}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><CreditCard className="w-5 h-5" /><p className="text-sm">Frais payés</p></div>
          <p className="text-lg font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Liste des enfants */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Liste détaillée</h2>
        
        {enfants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800">Aucun enfant inscrit</h3>
            <p className="text-gray-500 mt-2">Vous n'avez pas encore d'enfant inscrit dans l'école.</p>
            <Link href="/register" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Inscrire un enfant</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enfants.map((enfant) => {
              const stats = statsEnfant[enfant.eleve_id];
              
              // 🔥 Vérifier que le montant est valide
              const montantPaye = stats?.paiements?.total_paye || 0;
              const montantValide = typeof montantPaye === 'number' ? montantPaye : parseFloat(String(montantPaye));
              
              return (
                <Link key={enfant.id} href={`/dashboard/parent/enfants/${enfant.eleve_id}`}>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition cursor-pointer group">
                    <div className="bg-blue-600 p-4 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h3>
                          <p className="text-sm opacity-90">{enfant.classe_nom}</p>
                          <p className="text-xs opacity-75 mt-1">Matricule: {enfant.matricule}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {stats && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Absences/Retards</span>
                            <span className="font-medium text-orange-600">{stats.presences?.absents || 0} abs. / {stats.presences?.retards || 0} ret.</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm flex items-center gap-1"><CreditCard className="w-4 h-4" /> Frais payés</span>
                            <span className="font-medium text-green-600">{!isNaN(montantValide) ? montantValide.toLocaleString() : "0"} GNF</span>
                          </div>
                          {stats.notes && stats.notes.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs text-gray-500 mb-1">Matières:</p>
                              <div className="flex flex-wrap gap-1">
                                {stats.notes.slice(0, 3).map((note, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                    {note.matiere}: {typeof note.moyenne === 'number' ? note.moyenne.toFixed(1) : '0.0'}/20
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <button className="w-full mt-3 text-blue-600 text-sm font-medium flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                        Voir le détail <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}