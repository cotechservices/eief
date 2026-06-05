// app/dashboard/enseignant/lecons/page.tsx
"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Download, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function EnseignantLeconsPage() {
  const [showForm, setShowForm] = useState(false);
  const [lecons, setLecons] = useState([
    { id: 1, titre: "Les équations du premier degré", matiere: "Mathématiques", classe: "5ème A", date: "2025-05-20", fichier: "equations.pdf", vues: 24 },
    { id: 2, titre: "Les fractions", matiere: "Mathématiques", classe: "6ème B", date: "2025-05-18", fichier: "fractions.pdf", vues: 18 },
    { id: 3, titre: "Théorème de Pythagore", matiere: "Mathématiques", classe: "4ème A", date: "2025-05-15", fichier: "pythagore.pdf", vues: 22 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Mes leçons</h1><p className="text-gray-900">Gérez vos cours et supports pédagogiques</p></div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Nouvelle leçon</button></div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-lg font-semibold mb-4">Ajouter une leçon</h3>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Titre *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm mb-1">Classe *</label><select className="w-full px-3 py-2 border rounded-lg"><option>5ème A</option><option>4ème A</option><option>6ème B</option></select></div>
            <div><label className="block text-sm mb-1">Fichier PDF</label><input type="file" accept=".pdf" className="w-full" /></div>
            <div><label className="block text-sm mb-1">Lien vidéo (optionnel)</label><input type="url" placeholder="https://..." className="w-full px-3 py-2 border rounded-lg" /></div>
            <div className="md:col-span-2"><label className="block text-sm mb-1">Description</label><textarea rows={3} className="w-full px-3 py-2 border rounded-lg"></textarea></div></div>
          <div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button><button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Publier</button></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" /><input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-1.5 border rounded-lg text-sm" /></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Titre</th><th className="px-6 py-3 text-left text-xs">Classe</th><th className="px-6 py-3 text-left text-xs">Date</th><th className="px-6 py-3 text-left text-xs">Vues</th><th className="px-6 py-3 text-left text-xs">Actions</th></tr></thead>
          <tbody>{lecons.map((l) => (<tr key={l.id} className="border-t hover:bg-gray-50"><td className="px-6 py-4 font-medium">{l.titre}</td><td className="px-6 py-4">{l.classe}</td><td className="px-6 py-4">{l.date}</td><td className="px-6 py-4">{l.vues}</td><td className="px-6 py-4 flex gap-2"><button className="text-blue-600"><Eye className="w-4 h-4" /></button><button className="text-green-600"><Edit className="w-4 h-4" /></button><button className="text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
}