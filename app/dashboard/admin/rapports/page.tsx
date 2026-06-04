"use client";

import { useState, useEffect } from "react";
import { 
  Users, GraduationCap, CreditCard, Banknote, Calendar, BarChart3, TrendingUp
} from "lucide-react";

interface ReportData {
  kpis: {
    totalEleves: number;
    totalPersonnel: number;
    totalRecettes: number;
    totalSalaires: number;
    soldeGlobal: number;
  };
  charts: {
    evolution: { name: string; recettes: number }[];
    studentsByCycle: { name: string; value: number }[];
    recettesByType: { name: string; value: number }[];
  };
}

export default function RapportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/admin/rapports');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports & Statistiques</h1>
          <p className="text-gray-500">Vue globale sur les indicateurs de l'école</p>
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Élèves actifs</p>
          <div className="flex items-center gap-2 mt-1">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            <p className="text-2xl font-bold text-gray-800">{data.kpis.totalEleves}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm">Personnel</p>
          <div className="flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-purple-500" />
            <p className="text-2xl font-bold text-gray-800">{data.kpis.totalPersonnel}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Recettes Totales</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <p className="text-xl font-bold text-gray-800">{data.kpis.totalRecettes.toLocaleString()} GNF</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Salaires Versés</p>
          <div className="flex items-center gap-2 mt-1">
            <CreditCard className="w-5 h-5 text-red-500" />
            <p className="text-xl font-bold text-gray-800">{data.kpis.totalSalaires.toLocaleString()} GNF</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-sm p-4 text-white">
          <p className="text-blue-100 text-sm">Solde Global</p>
          <div className="flex items-center gap-2 mt-1">
            <Banknote className="w-5 h-5 text-blue-200" />
            <p className="text-xl font-bold">{data.kpis.soldeGlobal.toLocaleString()} GNF</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Évolution des recettes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500"/> Évolution des recettes (6 derniers mois)</h3>
          <div className="space-y-4">
            {data.charts.evolution.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4" /> {item.name}</span>
                <span className="font-bold text-green-600">{item.recettes.toLocaleString()} GNF</span>
              </div>
            ))}
            {data.charts.evolution.length === 0 && <p className="text-gray-500 italic">Aucune donnée</p>}
          </div>
        </div>

        <div className="space-y-6">
          {/* Répartition par cycle */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-500"/> Élèves par niveau/cycle</h3>
            <div className="space-y-3">
              {data.charts.studentsByCycle.map((item, idx) => {
                const percentage = data.kpis.totalEleves > 0 ? Math.round((item.value / data.kpis.totalEleves) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="text-gray-500">{item.value} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Répartition des recettes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-500"/> Répartition des recettes par type</h3>
            <div className="space-y-3">
              {data.charts.recettesByType.map((item, idx) => {
                const percentage = data.kpis.totalRecettes > 0 ? Math.round((item.value / data.kpis.totalRecettes) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{item.name}</span>
                      <span className="text-gray-500">{item.value.toLocaleString()} GNF</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}