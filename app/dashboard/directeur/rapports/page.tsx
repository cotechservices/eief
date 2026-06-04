// app/dashboard/admin/rapports/page.tsx
"use client";

import { useState } from "react";
import { 
  Download, 
  Calendar, 
  FileText, 
  Printer,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  CreditCard,
  BookOpen,
  Bus,
  Plus,
  Utensils,
  ChevronRight,
  Eye,
  BarChart3,
  PieChart,
  FileSpreadsheet
} from "lucide-react";

export default function RapportsPage() {
  const [periode, setPeriode] = useState("mois");
  const [typeRapport, setTypeRapport] = useState("academique");

  const rapports = [
    { id: 1, titre: "Rapport académique - 1er trimestre", description: "Moyennes, classements, taux de réussite", date: "2025-03-31", type: "academique", taille: "2.4 MB" },
    { id: 2, titre: "Rapport financier - Mai 2025", description: "Recettes, dépenses, soldes", date: "2025-05-31", type: "financier", taille: "1.8 MB" },
    { id: 3, titre: "Rapport de présence - Mai 2025", description: "Taux de présence par classe", date: "2025-05-31", type: "presence", taille: "1.2 MB" },
    { id: 4, titre: "Rapport cantine - Mai 2025", description: "Consommation repas", date: "2025-05-31", type: "cantine", taille: "0.9 MB" },
    { id: 5, titre: "Rapport transport - Mai 2025", description: "Utilisation des bus", date: "2025-05-31", type: "transport", taille: "0.7 MB" },
    { id: 6, titre: "Rapport bibliothèque - Mai 2025", description: "Emprunts et retours", date: "2025-05-31", type: "bibliotheque", taille: "0.6 MB" },
  ];

  const stats = {
    totalRapports: 24,
    nouveauxMois: 6,
    telechargementsMois: 156,
    types: 5
  };

  const categories = [
    { name: "Académiques", count: 8, icon: GraduationCap, color: "bg-blue-100 text-blue-600" },
    { name: "Financiers", count: 6, icon: CreditCard, color: "bg-green-100 text-green-600" },
    { name: "Présences", count: 4, icon: Users, color: "bg-yellow-100 text-yellow-600" },
    { name: "Cantine/Transport", count: 4, icon: Utensils, color: "bg-orange-100 text-orange-600" },
  ];

  const filteredRapports = typeRapport === "all" ? rapports : rapports.filter(r => r.type === typeRapport);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Rapports</h1><p className="text-gray-500">Générez et consultez les rapports</p></div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4" />Nouveau rapport</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Rapports générés</p><p className="text-2xl font-bold text-blue-600">{stats.totalRapports}</p></div><FileText className="w-8 h-8 text-blue-200" /></div></div>
        <div className="bg-white rounded-xl shadow-sm p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Nouveaux (mois)</p><p className="text-2xl font-bold text-green-600">{stats.nouveauxMois}</p></div><Calendar className="w-8 h-8 text-green-200" /></div></div>
        <div className="bg-white rounded-xl shadow-sm p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Téléchargements</p><p className="text-2xl font-bold text-orange-600">{stats.telechargementsMois}</p></div><Download className="w-8 h-8 text-orange-200" /></div></div>
        <div className="bg-white rounded-xl shadow-sm p-4"><div className="flex justify-between"><div><p className="text-gray-500 text-sm">Types de rapports</p><p className="text-2xl font-bold text-purple-600">{stats.types}</p></div><BarChart3 className="w-8 h-8 text-purple-200" /></div></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, idx) => (<div key={idx} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"><div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-3`}><cat.icon className="w-5 h-5" /></div><h3 className="font-semibold">{cat.name}</h3><p className="text-2xl font-bold mt-1">{cat.count}</p><p className="text-xs text-gray-500">rapports disponibles</p></div>))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="font-semibold">Rapports récents</h3><select value={typeRapport} onChange={(e) => setTypeRapport(e.target.value)} className="px-3 py-1 border rounded-lg text-sm"><option value="all">Tous</option><option value="academique">Académiques</option><option value="financier">Financiers</option><option value="presence">Présences</option></select></div>
        <div className="divide-y">{filteredRapports.map((r) => (<div key={r.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center"><div><h4 className="font-medium">{r.titre}</h4><p className="text-sm text-gray-500">{r.description}</p><div className="flex items-center gap-4 mt-1"><span className="text-xs text-gray-900">{r.date}</span><span className="text-xs text-gray-900">{r.taille}</span></div></div><div className="flex gap-2"><button className="p-2 text-gray-500 hover:text-blue-600"><Eye className="w-4 h-4" /></button><button className="p-2 text-gray-500 hover:text-green-600"><Download className="w-4 h-4" /></button><button className="p-2 text-gray-500 hover:text-gray-700"><Printer className="w-4 h-4" /></button></div></div>))}</div>
      </div>
    </div>
  );
}