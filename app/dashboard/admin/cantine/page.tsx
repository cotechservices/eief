// app/dashboard/admin/cantine/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Utensils, Calendar, Users, CreditCard, Plus, Edit, Trash2, Eye, Search, Download, Check, X } from "lucide-react";

interface Menu {
  id: number;
  date: string;
  plat: string;
  accompagnement: string;
  dessert: string;
  regime_special: boolean;
  prix: number | null;
  prix_annuel: number | null;
  inscrits: number;
  presents: number;
}

export default function CantinePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    plat: "",
    accompagnement: "",
    dessert: "",
    regime_special: false,
    prix: "" as string, // ⭐ Champ text pour éviter les valeurs par défaut
    prix_annuel: "" as string // ⭐ Champ text pour éviter les valeurs par défaut
  });

  const fetchCantine = async () => {
    try {
      const response = await fetch('/api/admin/cantine');
      if (response.ok) {
        const data = await response.json();
        setMenus(data.menus || []);
        setStats(data.stats || {
          totalInscrits: 0,
          moyenneJour: 0,
          recettesMois: 0,
          tauxPresence: 0
        });
      }
    } catch (error) {
      console.error("Erreur chargement cantine:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCantine();
  }, []);

  const handleOpenAdd = () => {
    setEditingMenu(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      plat: "",
      accompagnement: "",
      dessert: "",
      regime_special: false,
      prix: "",
      prix_annuel: ""
    });
    setShowForm(true);
  };

  const handleOpenEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      date: menu.date,
      plat: menu.plat,
      accompagnement: menu.accompagnement,
      dessert: menu.dessert,
      regime_special: menu.regime_special,
      prix: menu.prix ? String(menu.prix) : "",
      prix_annuel: menu.prix_annuel ? String(menu.prix_annuel) : ""
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingMenu ? "PUT" : "POST";
      const body = {
        ...formData,
        // ⭐ Convertir en nombre ou null
        prix: formData.prix ? parseInt(formData.prix) : null,
        prix_annuel: formData.prix_annuel ? parseInt(formData.prix_annuel) : null,
        id: editingMenu?.id
      };

      const response = await fetch('/api/admin/cantine', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowForm(false);
        fetchCantine();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement du menu");
      }
    } catch (error) {
      console.error("Erreur soumission menu:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce menu ?")) {
      try {
        const response = await fetch(`/api/admin/cantine?id=${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchCantine();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur suppression menu:", error);
      }
    }
  };

  if (loading || !stats) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion de la cantine</h1>
          <p className="text-gray-900">Menus, réservations, présence</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />Ajouter un menu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Inscrits cantine</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalInscrits}</p>
          </div>
          <Users className="w-8 h-8 text-blue-200" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Moyenne/jour</p>
            <p className="text-2xl font-bold text-green-600">{stats.moyenneJour}</p>
          </div>
          <Utensils className="w-8 h-8 text-green-200" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Recettes (mois)</p>
            <p className="text-2xl font-bold text-orange-600">{stats.recettesMois.toLocaleString()} GNF</p>
          </div>
          <CreditCard className="w-8 h-8 text-orange-200" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Taux présence</p>
            <p className="text-2xl font-bold text-purple-600">{stats.tauxPresence}%</p>
          </div>
          <Users className="w-8 h-8 text-purple-200" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Menus enregistrés</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            />
            <button className="p-2 border rounded-lg hover:bg-gray-50"><Search className="w-4 h-4 text-gray-900" /></button>
            <button className="p-2 border rounded-lg hover:bg-gray-50"><Download className="w-4 h-4 text-gray-900" /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
              <tr>
                <th className="px-6 py-3">Plat Principal</th>
                <th className="px-6 py-3">Accompagnement</th>
                <th className="px-6 py-3">Dessert</th>
                <th className="px-6 py-3">Prix Annuel</th>
                <th className="px-6 py-3">Régime Spécial</th>
                <th className="px-6 py-3">Inscrits</th>
                <th className="px-6 py-3">Présents</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {menus.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-900">{m.plat}</td>
                  <td className="px-6 py-4 text-gray-900">{m.accompagnement}</td>
                  <td className="px-6 py-4 text-gray-900">{m.dessert}</td>
                  <td className="px-6 py-4 font-medium text-purple-600">
                    {m.prix_annuel ? `${m.prix_annuel.toLocaleString()} GNF` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {m.regime_special ? (
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Oui</span>
                    ) : (
                      <span className="text-gray-900 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{m.inscrits}</td>
                  <td className="px-6 py-4 text-gray-900">{m.presents}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-900">Aucun menu disponible.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal avec prix et prix_annuel - Sans boutons + et - */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMenu ? "Modifier le menu" : "Ajouter un menu"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-900 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-black">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Plat principal</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Riz au gras sauce poulet"
                  value={formData.plat}
                  onChange={e => setFormData({ ...formData, plat: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Accompagnement</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Frites ou Salade de fruits"
                  value={formData.accompagnement}
                  onChange={e => setFormData({ ...formData, accompagnement: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Dessert</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Yaourt ou Pomme"
                  value={formData.dessert}
                  onChange={e => setFormData({ ...formData, dessert: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Prix Annuel (GNF)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ex: 2500000"
                    value={formData.prix_annuel}
                    onChange={e => setFormData({ ...formData, prix_annuel: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Laissez vide si non défini</p>
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="regime_special"
                  checked={formData.regime_special}
                  onChange={e => setFormData({ ...formData, regime_special: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="regime_special" className="text-sm font-medium text-gray-900 select-none cursor-pointer">
                  Option de régime spécial disponible (végétarien, allergies...)
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 text-sm font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}