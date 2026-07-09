// app/dashboard/admin_cantine/cantine/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchWithOffline } from "@/utils/fetchWithOffline";
import {
  Utensils, Plus, Edit, Trash2, Search, X, Loader2,
  Calendar, Users, UserCheck, Clock, AlertCircle, FileText,
  Coffee, Soup, Cake, ShoppingBag, CheckCircle, XCircle
} from "lucide-react";

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
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    plat: "",
    accompagnement: "",
    dessert: "",
    regime_special: false,
    prix: "" as string,
    prix_annuel: "" as string
  });

  const fetchMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithOffline('/api/admin/cantine', 'menus');
      setMenus(data.menus || []);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les menus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
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
        fetchMenus();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement du menu");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce menu ?")) {
      try {
        const response = await fetch(`/api/admin/cantine?id=${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchMenus();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const formatPrix = (valeur: number) => {
    return new Intl.NumberFormat('fr-FR').format(valeur);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const menusFiltres = menus.filter(m =>
    m.plat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.accompagnement.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.dessert.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-7 h-7 text-purple-600" />
            Gestion de la Cantine
          </h1>
          <p className="text-gray-500 mt-1">Gérez les repas et les menus de la cantine</p>
        </div>
        
        <div className="flex gap-2">
         {/* <Link
            href="/dashboard/admin_cantine/rapports"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Rapports
          </Link> */}
          <button
            onClick={handleOpenAdd}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un menu
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Total menus</p>
          <p className="text-2xl font-bold text-blue-600">{menus.length}</p>
          <Utensils className="w-4 h-4 text-blue-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Avec prix annuel</p>
          <p className="text-2xl font-bold text-green-600">{menus.filter(m => m.prix_annuel).length}</p>
          <ShoppingBag className="w-4 h-4 text-green-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Régime spécial</p>
          <p className="text-2xl font-bold text-orange-600">{menus.filter(m => m.regime_special).length}</p>
          <UserCheck className="w-4 h-4 text-orange-200 mt-1" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs">Total inscrits</p>
          <p className="text-2xl font-bold text-purple-600">{menus.reduce((acc, m) => acc + m.inscrits, 0)}</p>
          <Users className="w-4 h-4 text-purple-200 mt-1" />
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Liste des menus */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Accompagnement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dessert</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Régime spécial</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Prix annuel</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Inscrits</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Présents</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {menusFiltres.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-purple-400" />
                      <span className="font-medium text-gray-900">{menu.plat}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{menu.accompagnement}</td>
                  <td className="px-4 py-3 text-gray-600">{menu.dessert}</td>
                  <td className="px-4 py-3 text-center">
                    {menu.regime_special ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Oui
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-purple-600">
                    {menu.prix_annuel ? `${formatPrix(menu.prix_annuel)} GNF` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{menu.inscrits}</td>
                  <td className="px-4 py-3 text-center font-medium text-green-600">{menu.presents}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(menu)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(menu.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menusFiltres.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucun menu trouvé</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter un menu" pour commencer</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMenu ? "Modifier le menu" : "Ajouter un menu"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Plat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plat principal *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Riz au gras sauce poulet"
                  value={formData.plat}
                  onChange={e => setFormData({ ...formData, plat: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Accompagnement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accompagnement *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Frites ou Salade"
                  value={formData.accompagnement}
                  onChange={e => setFormData({ ...formData, accompagnement: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Dessert */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dessert *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Yaourt ou Fruit"
                  value={formData.dessert}
                  onChange={e => setFormData({ ...formData, dessert: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Prix annuel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix annuel (GNF)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ex: 2500000"
                  value={formData.prix_annuel}
                  onChange={e => setFormData({ ...formData, prix_annuel: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Laissez vide si non défini</p>
              </div>

              {/* Régime spécial */}
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="regime_special"
                  checked={formData.regime_special}
                  onChange={e => setFormData({ ...formData, regime_special: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="regime_special" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                  Régime spécial disponible (végétarien, allergies...)
                </label>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  {editingMenu ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}