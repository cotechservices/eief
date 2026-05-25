// app/dashboard/parent/enfants/page.tsx
"use client";

import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  Calendar, 
  GraduationCap,
  Eye,
  TrendingUp,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";

interface Enfant {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  moyenne: number;
  rang: number;
  absences: number;
  retards: number;
  frais: { total: number; paye: number; reste: number };
}

export default function MesEnfantsPage() {
  // Données statiques des enfants
  const enfants: Enfant[] = [
    { 
      id: 1, 
      nom: "Diallo", 
      prenom: "Ibrahim", 
      classe: "5ème A", 
      moyenne: 14.5, 
      rang: 6, 
      absences: 2, 
      retards: 0,
      frais: { total: 1200000, paye: 800000, reste: 400000 }
    },
    { 
      id: 2, 
      nom: "Diallo", 
      prenom: "Aïssatou", 
      classe: "3ème A", 
      moyenne: 16, 
      rang: 3, 
      absences: 0, 
      retards: 1,
      frais: { total: 1200000, paye: 1200000, reste: 0 }
    },
    { 
      id: 3, 
      nom: "Diallo", 
      prenom: "Mamadou", 
      classe: "6ème A", 
      moyenne: 12, 
      rang: 15, 
      absences: 4, 
      retards: 2,
      frais: { total: 1200000, paye: 600000, reste: 600000 }
    },
  ];

  // Données pour les graphiques
  const moyennesParEnfant = enfants.map(e => ({
    nom: e.prenom,
    moyenne: e.moyenne,
    couleur: e.moyenne >= 14 ? "#22c55e" : e.moyenne >= 10 ? "#3b82f6" : "#f97316"
  }));

  const absencesParEnfant = enfants.map(e => ({
    nom: e.prenom,
    absences: e.absences,
    retards: e.retards
  }));

  const repartitionFrais = {
    paye: enfants.reduce((acc, e) => acc + e.frais.paye, 0),
    reste: enfants.reduce((acc, e) => acc + e.frais.reste, 0),
    total: enfants.reduce((acc, e) => acc + e.frais.total, 0)
  };

  const pourcentagePaye = (repartitionFrais.paye / repartitionFrais.total) * 100;
  const pourcentageReste = (repartitionFrais.reste / repartitionFrais.total) * 100;

  // Statistiques globales
  const statsGlobales = {
    totalEnfants: enfants.length,
    moyenneGenerale: (enfants.reduce((acc, e) => acc + e.moyenne, 0) / enfants.length).toFixed(1),
    totalAbsences: enfants.reduce((acc, e) => acc + e.absences, 0),
    totalRetards: enfants.reduce((acc, e) => acc + e.retards, 0),
    totalFrais: repartitionFrais.total,
    totalPaye: repartitionFrais.paye,
    totalReste: repartitionFrais.reste,
    meilleureMoyenne: Math.max(...enfants.map(e => e.moyenne)),
    meilleurEleve: enfants.find(e => e.moyenne === Math.max(...enfants.map(e => e.moyenne)))?.prenom
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mes enfants</h1>
        <p className="text-gray-500">Gérez le suivi scolaire de vos enfants</p>
      </div>

      {/* Statistiques globales en cartes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><p className="text-sm opacity-90">Enfants inscrits</p></div>
          <p className="text-3xl font-bold">{statsGlobales.totalEnfants}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><GraduationCap className="w-5 h-5" /><p className="text-sm">Moyenne générale</p></div>
          <p className="text-2xl font-bold text-blue-600">{statsGlobales.moyenneGenerale}/20</p>
          <p className="text-xs text-green-600">Meilleur: {statsGlobales.meilleurEleve} ({statsGlobales.meilleureMoyenne}/20)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><Calendar className="w-5 h-5" /><p className="text-sm">Absences totales</p></div>
          <p className="text-2xl font-bold text-orange-600">{statsGlobales.totalAbsences}</p>
          <p className="text-xs text-gray-500">Retards: {statsGlobales.totalRetards}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500"><CreditCard className="w-5 h-5" /><p className="text-sm">Frais payés</p></div>
          <p className="text-lg font-bold text-green-600">{statsGlobales.totalPaye.toLocaleString()} GNF</p>
          <p className="text-xs text-red-500">Reste: {statsGlobales.totalReste.toLocaleString()} GNF</p>
        </div>
      </div>

      {/* Liste des enfants */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Liste détaillée</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enfants.map((enfant) => (
            <Link key={enfant.id} href={`/dashboard/parent/enfants/${enfant.id}`}>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition cursor-pointer group">
                <div className={`p-4 text-white ${
                  enfant.moyenne >= 14 ? "bg-green-600" : 
                  enfant.moyenne >= 10 ? "bg-blue-600" : "bg-orange-600"
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h3>
                      <p className="text-sm opacity-90">{enfant.classe}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{enfant.moyenne}/20</p>
                      <p className="text-xs opacity-75">Rang: {enfant.rang}e</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm flex items-center gap-1"><Calendar className="w-4 h-4" /> Absences</span>
                    <span className="font-medium text-orange-600">{enfant.absences}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Retards</span>
                    <span className="font-medium text-red-600">{enfant.retards}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm flex items-center gap-1"><CreditCard className="w-4 h-4" /> Frais payés</span>
                    <span className="font-medium text-green-600">{((enfant.frais.paye / enfant.frais.total) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(enfant.frais.paye / enfant.frais.total) * 100}%` }}></div>
                  </div>
                  <button className="w-full mt-3 text-blue-600 text-sm font-medium flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                    Voir le détail <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {enfants.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">Aucun enfant inscrit</h3>
          <p className="text-gray-500 mt-2">Vous n'avez pas encore d'enfant inscrit dans l'école.</p>
          <Link href="/register" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Inscrire un enfant</Link>
        </div>
      )}
    </div>
  );
}