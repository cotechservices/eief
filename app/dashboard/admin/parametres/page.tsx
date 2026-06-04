"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Calendar, Shield, Database, Bell, CheckCircle, Clock, Save, Plus, Trash2 
} from "lucide-react";

interface AnneeScolaire {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  est_active: boolean;
}

export default function ParametresPage() {
  const [annees, setAnnees] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    libelle: "",
    date_debut: "",
    date_fin: "",
    est_active: false
  });

  const fetchAnnees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/parametres');
      if (res.ok) {
        const data = await res.json();
        setAnnees(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/parametres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ libelle: "", date_debut: "", date_fin: "", est_active: false });
        fetchAnnees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetActive = async (id: number) => {
    if (confirm("Définir cette année comme l'année active par défaut ?")) {
      try {
        const res = await fetch('/api/admin/parametres', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        if (res.ok) {
          fetchAnnees();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer cette année scolaire ?")) {
      try {
        const res = await fetch(`/api/admin/parametres?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchAnnees();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Paramètres système</h1>
          <p className="text-gray-500">Configuration générale de l'établissement</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-lg text-black font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600"/> Années scolaires</h2>
          <p className="text-sm text-gray-900 mt-1">Gérez les années académiques (une seule peut être active à la fois)</p>
        </div>
        
        <div className="p-6">
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowForm(true)} className="bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800">
              <Plus className="w-4 h-4" /> Ajouter une année
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="pb-3 font-medium text-gray-900">Année scolaire</th>
                <th className="pb-3 font-medium text-gray-900">Période</th>
                <th className="pb-3 font-medium text-gray-900">Statut</th>
                <th className="pb-3 font-medium text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : (
                annees.map(annee => (
                  <tr key={annee.id} className="hover:bg-gray-50">
                    <td className="py-4 font-bold text-gray-900">{annee.libelle}</td>
                    <td className="py-4 text-sm text-gray-900">
                      {new Date(annee.date_debut).toLocaleDateString()} - {new Date(annee.date_fin).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      {annee.est_active ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1">
                          <CheckCircle className="w-3 h-3"/> Active
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center w-max gap-1">
                          Archivée
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {!annee.est_active && (
                        <button onClick={() => handleSetActive(annee.id)} className="text-blue-600 hover:underline text-sm mr-4">
                          Définir active
                        </button>
                      )}
                      <button onClick={() => handleDelete(annee.id)} className="text-red-600 hover:text-red-800 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">Nouvelle année scolaire</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Libellé (ex: 2024-2025)</label>
                <input required type="text" value={formData.libelle} onChange={e => setFormData({...formData, libelle: e.target.value})} className="w-full border px-3 py-2 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début</label>
                  <input required type="date" value={formData.date_debut} onChange={e => setFormData({...formData, date_debut: e.target.value})} className="w-full border px-3 py-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de fin</label>
                  <input required type="date" value={formData.date_fin} onChange={e => setFormData({...formData, date_fin: e.target.value})} className="w-full border px-3 py-2 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="active" checked={formData.est_active} onChange={e => setFormData({...formData, est_active: e.target.checked})} />
                <label htmlFor="active" className="text-sm">Définir comme année active par défaut</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}