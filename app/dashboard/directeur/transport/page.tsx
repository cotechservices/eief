// app/dashboard/admin/transport/page.tsx
"use client";

import { useState } from "react";
import { Bus, MapPin, Users, CreditCard, Plus, Edit, Trash2, Eye, Search, Download, AlertCircle } from "lucide-react";

export default function TransportPage() {
  const bus = [
    { id: 1, immatriculation: "RC 1234 AB", chauffeur: "M. Camara", capacite: 40, inscrits: 38, trajet: "Conakry - Koloma", horaireMatin: "06:30", horaireSoir: "16:30", statut: "actif" },
    { id: 2, immatriculation: "RC 5678 CD", chauffeur: "M. Diallo", capacite: 35, inscrits: 32, trajet: "Conakry - Ratoma", horaireMatin: "06:45", horaireSoir: "16:45", statut: "actif" },
    { id: 3, immatriculation: "RC 9012 EF", chauffeur: "Mme Barry", capacite: 45, inscrits: 40, trajet: "Conakry - Matoto", horaireMatin: "06:15", horaireSoir: "17:00", statut: "actif" },
  ];

  const stats = { totalBus: 5, totalInscrits: 125, tauxRemplissage: 87, trajets: 5 };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Gestion du transport</h1><p className="text-gray-500">Bus, trajets, inscriptions</p></div><button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Ajouter un bus</button></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Bus en service</p><p className="text-2xl font-bold text-blue-600">{stats.totalBus}</p></div><Bus className="w-8 h-8 text-blue-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Élèves inscrits</p><p className="text-2xl font-bold text-green-600">{stats.totalInscrits}</p></div><Users className="w-8 h-8 text-green-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Taux remplissage</p><p className="text-2xl font-bold text-orange-600">{stats.tauxRemplissage}%</p></div><MapPin className="w-8 h-8 text-orange-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Recettes (mois)</p><p className="text-2xl font-bold text-purple-600">2.5M GNF</p></div><CreditCard className="w-8 h-8 text-purple-200" /></div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="font-semibold">Liste des bus</h3><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" /><input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-1 border rounded-lg text-sm" /></div></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Immatriculation</th><th className="px-6 py-3 text-left text-xs">Chauffeur</th><th className="px-6 py-3 text-left text-xs">Trajet</th><th className="px-6 py-3 text-left text-xs">Horaires</th><th className="px-6 py-3 text-left text-xs">Élèves</th><th className="px-6 py-3 text-left text-xs">Capacité</th><th className="px-6 py-3 text-left text-xs">Actions</th></tr></thead>
        <tbody>{bus.map((b) => (<tr key={b.id} className="border-t"><td className="px-6 py-4 font-medium">{b.immatriculation}</td><td className="px-6 py-4">{b.chauffeur}</td><td className="px-6 py-4">{b.trajet}</td><td className="px-6 py-4">{b.horaireMatin} / {b.horaireSoir}</td><td className="px-6 py-4">{b.inscrits}</td><td className="px-6 py-4">{b.capacite}</td><td className="px-6 py-4 flex gap-2"><button className="text-blue-600"><Edit className="w-4 h-4" /></button><button className="text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
}