"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Tag, CheckCircle, XCircle } from "lucide-react";

interface Frais {
  id: number;
  nom: string;
  montant: number;
  type: string;
  obligatoire: boolean;
  frequence: string;
}

export default function FraisScolairesPage() {
  const [frais, setFrais] = useState<Frais[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFrais, setEditingFrais] = useState<Frais | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    montant: 0,
    type: "scolarite",
    obligatoire: true,
    frequence: "annuel"
  });

  const fetchFrais = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/frais');
      if (res.ok) {
        const data = await res.json();
        setFrais(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrais();
  }, []);

  const openForm = (f: Frais | null) => {
    setEditingFrais(f);
    if (f) {
      setFormData({
        nom: f.nom,
        montant: f.montant,
        type: f.type,
        obligatoire: f.obligatoire,
        frequence: f.frequence
      });
    } else {
      setFormData({
        nom: "", montant: 0, type: "scolarite", obligatoire: true, frequence: "annuel"
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const url = '/api/admin/frais';
      const method = editingFrais ? 'PUT' : 'POST';
      const body = JSON.stringify({ ...formData, id: editingFrais?.id });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        setShowForm(false);
        fetchFrais();
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce type de frais ?")) {
      try {
        await fetch(`/api/admin/frais?id=${id}`, { method: "DELETE" });
        fetchFrais();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Frais scolaires</h1>
          <p className="text-gray-500">Paramétrage des tarifs et frais pour l'année scolaire</p>
        </div>
        <button onClick={() => openForm(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nouveau tarif
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fréquence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obligatoire</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {frais.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{f.nom}</td>
                <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded-full uppercase">{f.type}</span></td>
                <td className="px-6 py-4 font-bold text-blue-600">{Number(f.montant).toLocaleString()} GNF</td>
                <td className="px-6 py-4 capitalize">{f.frequence}</td>
                <td className="px-6 py-4">
                  {f.obligatoire ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-900" />}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button onClick={() => openForm(f)} className="text-green-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {frais.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Aucun tarif configuré</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b"><h2 className="text-xl font-bold">{editingFrais ? "Modifier" : "Ajouter"} un tarif</h2></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1">Nom du frais</label>
                <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Scolarité mensuelle 6ème" />
              </div>
              <div>
                <label className="block text-sm mb-1">Type de frais</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="scolarite">Scolarité</option>
                  <option value="inscription">Inscription</option>
                  <option value="cantine">Cantine</option>
                  <option value="transport">Transport</option>
                  <option value="bibliotheque">Bibliothèque</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Montant (GNF)</label>
                <input type="number" value={formData.montant} onChange={e => setFormData({...formData, montant: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm mb-1">Fréquence</label>
                <select value={formData.frequence} onChange={e => setFormData({...formData, frequence: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="annuel">Annuel</option>
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="unique">Paiement unique</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ob" checked={formData.obligatoire} onChange={e => setFormData({...formData, obligatoire: e.target.checked})} />
                <label htmlFor="ob" className="text-sm">Obligatoire pour tous les élèves ?</label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}