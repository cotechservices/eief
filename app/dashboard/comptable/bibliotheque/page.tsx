// app/dashboard/admin/bibliotheque/page.tsx
"use client";

import { useState } from "react";
import { Library, BookOpen, Users, Search, Plus, Edit, Trash2, Eye, Download } from "lucide-react";

export default function BibliothequePage() {
  const livres = [
    { id: 1, titre: "Mathématiques 5ème", auteur: "M. CAMARA", isbn: "978-2-1234-5678-9", quantite: 5, disponible: 3, emprunts: 12 },
    { id: 2, titre: "Français 4ème", auteur: "Mme BARRY", isbn: "978-2-1234-5679-6", quantite: 3, disponible: 1, emprunts: 8 },
    { id: 3, titre: "Histoire de la Guinée", auteur: "Pr. KONATÉ", isbn: "978-2-1234-5680-2", quantite: 2, disponible: 0, emprunts: 15 },
  ];

  const stats = { totalLivres: 1250, empruntsEnCours: 78, livresRetard: 12, membresActifs: 890 };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Bibliothèque</h1><p className="text-gray-900">Gestion des livres et emprunts</p></div><button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Ajouter un livre</button></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Total livres</p><p className="text-2xl font-bold text-blue-600">{stats.totalLivres}</p></div><Library className="w-8 h-8 text-blue-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Emprunts en cours</p><p className="text-2xl font-bold text-green-600">{stats.empruntsEnCours}</p></div><BookOpen className="w-8 h-8 text-green-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Livres en retard</p><p className="text-2xl font-bold text-red-600">{stats.livresRetard}</p></div><BookOpen className="w-8 h-8 text-red-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-900">Membres actifs</p><p className="text-2xl font-bold text-purple-600">{stats.membresActifs}</p></div><Users className="w-8 h-8 text-purple-200" /></div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="font-semibold">Catalogue des livres</h3><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" /><input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-1 border rounded-lg text-sm" /></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Titre</th><th className="px-6 py-3 text-left text-xs">Auteur</th><th className="px-6 py-3 text-left text-xs">ISBN</th><th className="px-6 py-3 text-left text-xs">Quantité</th><th className="px-6 py-3 text-left text-xs">Disponible</th><th className="px-6 py-3 text-left text-xs">Emprunts</th><th className="px-6 py-3 text-left text-xs">Actions</th></tr></thead>
          <tbody>{livres.map((l) => (<tr key={l.id} className="border-t"><td className="px-6 py-4 font-medium">{l.titre}</td><td className="px-6 py-4">{l.auteur}</td><td className="px-6 py-4 text-sm">{l.isbn}</td><td className="px-6 py-4">{l.quantite}</td><td className="px-6 py-4">{l.disponible}</td><td className="px-6 py-4">{l.emprunts}</td><td className="px-6 py-4 flex gap-2"><button className="text-blue-600"><Eye className="w-4 h-4" /></button><button className="text-green-600"><Edit className="w-4 h-4" /></button><button className="text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
}