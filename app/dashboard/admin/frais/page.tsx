// app/dashboard/admin/finances/frais/page.tsx
"use client";

import { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Euro,
  Calendar,
  Users,
  Bus,
  Utensils,
  BookOpen,
  GraduationCap
} from "lucide-react";

interface Frais {
  id: number;
  type: string;
  libelle: string;
  montant: number;
  periodicite: string;
  classe?: string;
  anneeScolaire: string;
}

export default function FraisScolairesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    type: "mensualite",
    libelle: "",
    montant: "",
    periodicite: "mensuel",
    classe: "",
    anneeScolaire: "2025-2026"
  });

  const [frais, setFrais] = useState<Frais[]>([
    { id: 1, type: "inscription", libelle: "Frais d'inscription", montant: 300000, periodicite: "annuel", anneeScolaire: "2025-2026" },
    { id: 2, type: "mensualite", libelle: "Mensualité scolarité", montant: 150000, periodicite: "mensuel", anneeScolaire: "2025-2026" },
    { id: 3, type: "cantine", libelle: "Cantine", montant: 100000, periodicite: "mensuel", anneeScolaire: "2025-2026" },
    { id: 4, type: "transport", libelle: "Transport scolaire", montant: 80000, periodicite: "mensuel", anneeScolaire: "2025-2026" },
    { id: 5, type: "bibliotheque", libelle: "Bibliothèque", montant: 25000, periodicite: "annuel", anneeScolaire: "2025-2026" },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setFrais(frais.map(f => f.id === editingId ? { ...f, ...formData, montant: parseInt(formData.montant) } : f));
    } else {
      setFrais([...frais, { 
        id: frais.length + 1, 
        ...formData, 
        montant: parseInt(formData.montant) 
      }]);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ type: "mensualite", libelle: "", montant: "", periodicite: "mensuel", classe: "", anneeScolaire: "2025-2026" });
  };

  const handleEdit = (f: Frais) => {
    setEditingId(f.id);
    setFormData({
      type: f.type,
      libelle: f.libelle,
      montant: f.montant.toString(),
      periodicite: f.periodicite,
      classe: f.classe || "",
      anneeScolaire: f.anneeScolaire
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce frais ?")) {
      setFrais(frais.filter(f => f.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'inscription': return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case 'mensualite': return <Euro className="w-5 h-5 text-green-600" />;
      case 'cantine': return <Utensils className="w-5 h-5 text-orange-600" />;
      case 'transport': return <Bus className="w-5 h-5 text-purple-600" />;
      case 'bibliotheque': return <BookOpen className="w-5 h-5 text-teal-600" />;
      default: return <Euro className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      inscription: "Inscription",
      mensualite: "Mensualité",
      cantine: "Cantine",
      transport: "Transport",
      bibliotheque: "Bibliothèque",
    };
    return types[type] || type;
  };

  const getPeriodiciteLabel = (periode: string) => {
    const periodes: Record<string, string> = {
      mensuel: "Mensuel",
      trimestriel: "Trimestriel",
      semestriel: "Semestriel",
      annuel: "Annuel",
    };
    return periodes[periode] || periode;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Frais scolaires</h1>
          <p className="text-gray-500">Gestion des tarifs et frais de l'école</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau frais
        </button>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingId ? "Modifier le frais" : "Ajouter un nouveau frais"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Type de frais *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="inscription">Inscription</option>
                <option value="mensualite">Mensualité</option>
                <option value="cantine">Cantine</option>
                <option value="transport">Transport</option>
                <option value="bibliotheque">Bibliothèque</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Libellé *</label>
              <input
                type="text"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Montant (GNF) *</label>
              <input
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Périodicité *</label>
              <select
                value={formData.periodicite}
                onChange={(e) => setFormData({ ...formData, periodicite: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="semestriel">Semestriel</option>
                <option value="annuel">Annuel</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Classe (optionnel)</label>
              <input
                type="text"
                value={formData.classe}
                onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                placeholder="Toutes classes"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Année scolaire</label>
              <select
                value={formData.anneeScolaire}
                onChange={(e) => setFormData({ ...formData, anneeScolaire: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des frais */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Périodicité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {frais.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(f.type)}
                      <span>{getTypeLabel(f.type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{f.libelle}</td>
                  <td className="px-6 py-4 text-right font-medium">{f.montant.toLocaleString()} GNF</td>
                  <td className="px-6 py-4">{getPeriodiciteLabel(f.periodicite)}</td>
                  <td className="px-6 py-4">{f.anneeScolaire}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(f)} className="text-blue-600 hover:text-blue-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(f.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}