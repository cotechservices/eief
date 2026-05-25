// app/dashboard/parent/page.tsx
"use client";

import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  Bus, 
  Calendar,
  AlertCircle,
  MessageSquare,
  GraduationCap,
  Eye,
  BarChart3,
  PieChart,
  TrendingUp
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

export default function ParentDashboard() {
  // Données statiques des enfants
  const enfants: Enfant[] = [
    { id: 1, nom: "Diallo", prenom: "Ibrahim", classe: "5ème A", moyenne: 14.5, rang: 6, absences: 2, retards: 0, frais: { total: 1200000, paye: 800000, reste: 400000 } },
    { id: 2, nom: "Diallo", prenom: "Aïssatou", classe: "3ème A", moyenne: 16, rang: 3, absences: 0, retards: 1, frais: { total: 1200000, paye: 1200000, reste: 0 } },
    { id: 3, nom: "Diallo", prenom: "Mamadou", classe: "6ème A", moyenne: 12, rang: 15, absences: 4, retards: 2, frais: { total: 1200000, paye: 600000, reste: 600000 } },
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Espace Parent</h1>
        <p className="text-gray-500">Bienvenue Mme Diallo</p>
      </div>

      {/* Statistiques globales en cartes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {/* Section Graphiques */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        
        {/* Graphique 1 : Comparaison des moyennes (barres) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Comparaison des moyennes
            </h3>
            <Link href="/dashboard/parent/enfants" className="text-xs text-blue-600 hover:underline">Voir détails</Link>
          </div>
          <div className="space-y-4">
            {moyennesParEnfant.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.nom}</span>
                  <span className="text-gray-600">{item.moyenne}/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(item.moyenne / 20) * 100}%`, backgroundColor: item.couleur }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Excellent (≥14)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Bien (10-14)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-full"></div> À améliorer (&lt;10)</span>
          </div>
        </div>

        {/* Graphique 2 : Répartition des frais (donut circulaire) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Répartition des frais
            </h3>
            <span className="text-xs text-gray-400">total {statsGlobales.totalFrais.toLocaleString()} GNF</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="15" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="15"
                  strokeDasharray={`${pourcentagePaye * 2.51} ${(100 - pourcentagePaye) * 2.51}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="15"
                  strokeDasharray={`${pourcentageReste * 2.51} ${(100 - pourcentageReste) * 2.51}`}
                  strokeLinecap="round"
                  strokeDashoffset={`-${pourcentagePaye * 2.51}`}
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="45" textAnchor="middle" fontSize="10" fill="#4b5563">{statsGlobales.totalPaye.toLocaleString()}</text>
                <text x="50" y="58" textAnchor="middle" fontSize="8" fill="#9ca3af">GNF</text>
              </svg>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span>Payé: {pourcentagePaye.toFixed(0)}%</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span>Reste: {pourcentageReste.toFixed(0)}%</span></div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            {enfants.map((enfant, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span>{enfant.prenom}</span>
                <div className="flex-1 mx-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${(enfant.frais.paye / enfant.frais.total) * 100}%` }}></div>
                </div>
                <span className="text-xs text-gray-500">{((enfant.frais.paye / enfant.frais.total) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique 3 : Absences et retards */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Absences et retards
            </h3>
            <span className="text-xs text-gray-400">année scolaire</span>
          </div>
          <div className="space-y-4">
            {absencesParEnfant.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.nom}</span>
                  <div className="flex gap-3">
                    <span className="text-orange-600">Abs: {item.absences}</span>
                    <span className="text-red-600">Ret: {item.retards}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((item.absences / 10) * 100, 100)}%` }}></div>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((item.retards / 5) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-full"></div> Taux d'absence</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Taux de retard</span>
          </div>
        </div>

        {/* Graphique 4 : Progression trimestrielle */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Progression trimestrielle
            </h3>
            <span className="text-xs text-gray-400">moyennes / trimestre</span>
          </div>
          <div className="space-y-4">
            {enfants.map((enfant, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{enfant.prenom}</span>
                  <span className="text-gray-500">T1: {(enfant.moyenne - 1.2).toFixed(1)} → T2: {enfant.moyenne}</span>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-blue-500 opacity-30 rounded-l-lg" style={{ width: `${((enfant.moyenne - 1.2) / 20) * 100}%` }}></div>
                  <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-l-lg" style={{ width: `${(enfant.moyenne / 20) * 100}%` }}></div>
                  <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium">{enfant.moyenne}/20</div>
                </div>
                <p className="text-xs text-green-600 mt-1">+{(enfant.moyenne - (enfant.moyenne - 1.2)).toFixed(1)} points</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between text-xs text-gray-500">
              <span>📈 Progression moyenne: +0.6 pts</span>
              <span>🎯 Objectif trimestre prochain: 15/20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des enfants avec lien vers page détail */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Mes enfants</h2>
          <Link href="/dashboard/parent/enfants" className="text-blue-600 text-sm hover:underline">Voir tous →</Link>
        </div>
        <div className="divide-y">
          {enfants.map((enfant) => (
            <Link key={enfant.id} href={`/dashboard/parent/enfants/${enfant.id}`}>
              <div className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{enfant.prenom} {enfant.nom}</h3>
                    <p className="text-sm text-gray-500">{enfant.classe}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{enfant.moyenne}/20</p>
                    <p className="text-xs text-gray-500">Rang: {enfant.rang}e</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-orange-600"><Calendar className="w-4 h-4" />{enfant.absences} abs.</span>
                  <span className="flex items-center gap-1 text-green-600"><CreditCard className="w-4 h-4" />{((enfant.frais.paye / enfant.frais.total) * 100).toFixed(0)}% payé</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${(enfant.frais.paye / enfant.frais.total) * 100}%` }}></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/parent/messages" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition"><MessageSquare className="w-6 h-6 text-blue-600 group-hover:text-white" /></div>
          <p className="text-sm font-medium">Messagerie</p>
        </Link>
        <Link href="/dashboard/parent/transport" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition"><Bus className="w-6 h-6 text-green-600 group-hover:text-white" /></div>
          <p className="text-sm font-medium">Transport</p>
        </Link>
        <Link href="/dashboard/parent/finances" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition"><CreditCard className="w-6 h-6 text-purple-600 group-hover:text-white" /></div>
          <p className="text-sm font-medium">Finances</p>
        </Link>
        <Link href="/dashboard/parent/emploi-temps" className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-yellow-600 transition"><Calendar className="w-6 h-6 text-yellow-600 group-hover:text-white" /></div>
          <p className="text-sm font-medium">Emploi du temps</p>
        </Link>
      </div>
    </div>
  );
}