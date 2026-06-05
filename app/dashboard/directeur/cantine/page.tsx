// app/dashboard/admin/cantine/page.tsx
"use client";

import { useState } from "react";
import { Utensils, Calendar, Users, CreditCard, Plus, Edit, Trash2, Eye, Search, Download } from "lucide-react";

export default function CantinePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const menus = [
    { id: 1, date: "2025-05-21", plat: "Riz au gras", accompagnement: "Légumes", dessert: "Fruit", prix: 5000, inscrits: 245, presents: 230 },
    { id: 2, date: "2025-05-22", plat: "Poisson braisé", accompagnement: "Frites", dessert: "Yaourt", prix: 5500, inscrits: 248, presents: 242 },
    { id: 3, date: "2025-05-23", plat: "Poulet DG", accompagnement: "Bananes plantain", dessert: "Glace", prix: 6000, inscrits: 250, presents: 248 },
  ];

  const stats = { totalInscrits: 1250, moyenneJour: 240, recettesMois: 3250000, tauxPresence: 94 };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Gestion de la cantine</h1><p className="text-gray-900">Menus, réservations, présence</p></div><button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Ajouter un menu</button></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Inscrits cantine</p><p className="text-2xl font-bold text-blue-600">{stats.totalInscrits}</p></div><Users className="w-8 h-8 text-blue-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Moyenne/jour</p><p className="text-2xl font-bold text-green-600">{stats.moyenneJour}</p></div><Utensils className="w-8 h-8 text-green-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Recettes (mois)</p><p className="text-2xl font-bold text-orange-600">{stats.recettesMois.toLocaleString()} GNF</p></div><CreditCard className="w-8 h-8 text-orange-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Taux présence</p><p className="text-2xl font-bold text-purple-600">{stats.tauxPresence}%</p></div><Users className="w-8 h-8 text-purple-200" /></div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="font-semibold">Menus de la semaine</h3><div className="flex gap-2"><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1 border rounded-lg" /><button className="p-2 border rounded-lg"><Search className="w-4 h-4" /></button><button className="p-2 border rounded-lg"><Download className="w-4 h-4" /></button></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Date</th><th className="px-6 py-3 text-left text-xs">Plat</th><th className="px-6 py-3 text-left text-xs">Accompagnement</th><th className="px-6 py-3 text-left text-xs">Dessert</th><th className="px-6 py-3 text-left text-xs">Prix</th><th className="px-6 py-3 text-left text-xs">Inscrits</th><th className="px-6 py-3 text-left text-xs">Présents</th><th className="px-6 py-3 text-left text-xs">Actions</th></tr></thead>
          <tbody>{menus.map((m) => (<tr key={m.id} className="border-t"><td className="px-6 py-4">{m.date}</td><td className="px-6 py-4 font-medium">{m.plat}</td><td className="px-6 py-4">{m.accompagnement}</td><td className="px-6 py-4">{m.dessert}</td><td className="px-6 py-4">{m.prix.toLocaleString()} GNF</td><td className="px-6 py-4">{m.inscrits}</td><td className="px-6 py-4">{m.presents}</td><td className="px-6 py-4 flex gap-2"><button className="text-blue-600"><Edit className="w-4 h-4" /></button><button className="text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
}