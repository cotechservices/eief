// app/dashboard/enseignant/devoirs/page.tsx
"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Eye, FileText, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function EnseignantDevoirsPage() {
  const [showForm, setShowForm] = useState(false);
  const [devoirs, setDevoirs] = useState([
    { id: 1, titre: "Exercices p45", matiere: "Mathématiques", classe: "5ème A", dateLimite: "2025-05-25", soumis: 18, total: 25, statut: "actif" },
    { id: 2, titre: "Problèmes", matiere: "Mathématiques", classe: "4ème A", dateLimite: "2025-05-26", soumis: 12, total: 24, statut: "actif" },
    { id: 3, titre: "Contrôle", matiere: "Mathématiques", classe: "6ème B", dateLimite: "2025-05-27", soumis: 8, total: 22, statut: "actif" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Devoirs</h1><p className="text-gray-500">Créez et gérez les devoirs</p></div>
      <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Nouveau devoir</button></div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-lg font-semibold mb-4">Ajouter un devoir</h3>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm mb-1">Titre *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm mb-1">Classe *</label><select className="w-full px-3 py-2 border rounded-lg"><option>5ème A</option><option>4ème A</option><option>6ème B</option></select></div>
          <div><label className="block text-sm mb-1">Description</label><textarea rows={3} className="w-full px-3 py-2 border rounded-lg"></textarea></div>
          <div><label className="block text-sm mb-1">Date limite *</label><input type="date" className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm mb-1">Fichier (optionnel)</label><input type="file" className="w-full" /></div></div>
          <div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button><button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Publier</button></div>
        </div>
      )}

      <div className="grid gap-4">{devoirs.map((d) => (<div key={d.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"><div className="flex justify-between items-start"><div><h3 className="font-semibold text-gray-800">{d.titre}</h3><p className="text-sm text-gray-500">{d.matiere} - {d.classe}</p></div><div className="text-right"><p className="text-sm text-orange-600 flex items-center gap-1"><Clock className="w-3 h-3" />À rendre le {d.dateLimite}</p><p className="text-xs text-gray-500">{d.soumis}/{d.total} soumissions</p></div></div>
      <div className="flex justify-between items-center mt-3"><div className="flex gap-2"><button className="text-blue-600 text-sm flex items-center gap-1"><Eye className="w-4 h-4" />Voir soumissions</button><button className="text-green-600 text-sm flex items-center gap-1"><Edit className="w-4 h-4" />Modifier</button></div><div className="w-32 bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(d.soumis / d.total) * 100}%` }}></div></div></div></div>))}</div>
    </div>
  );
}