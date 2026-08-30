//app\dashboard\admin\librairie_niveau
"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, CheckCircle, XCircle, Loader2,
  ShoppingCart, DollarSign, Package, AlertTriangle, X
} from "lucide-react";

interface Article {
  id: number;
  nom: string;
  description: string;
  prix_unitaire: number;
  quantite_stock: number;
  categorie: string;
  image_url: string | null;
  niveaux_cibles: string[] | null;
}

export default function AdminLibrairiePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix_unitaire: 0,
    quantite_stock: 0,
    categorie: "fourniture",
    image_url: "",
    niveaux_cibles: [] as string[],
  });
  const [notifications, setNotifications] = useState<{ id: number; type: string; message: string }[]>([]);

  // Niveaux disponibles
  const niveauxDisponibles = ["Maternelle", "Primaire", "Collège", "Lycée"];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/librairie");
      const data = await res.json();
      setArticles(data);
    } catch (error) {
      addNotification("error", "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (type: string, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingArticle ? "/api/admin/librairie" : "/api/admin/librairie";
      const method = editingArticle ? "PUT" : "POST";
      const body = editingArticle ? { id: editingArticle.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchArticles();
        setShowForm(false);
        setEditingArticle(null);
        resetForm();
        addNotification("success", editingArticle ? "Article modifié" : "Article créé");
      } else {
        const error = await res.json();
        addNotification("error", error.error || "Erreur");
      }
    } catch (error) {
      addNotification("error", "Erreur serveur");
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      prix_unitaire: 0,
      quantite_stock: 0,
      categorie: "fourniture",
      image_url: "",
      niveaux_cibles: [],
    });
  };

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/librairie?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchArticles();
        addNotification("success", "Article supprimé");
      } else {
        addNotification("error", "Erreur suppression");
      }
    } catch (error) {
      addNotification("error", "Erreur serveur");
    }
  };

  const toggleNiveau = (niveau: string) => {
    setFormData(prev => {
      const cibles = prev.niveaux_cibles || [];
      if (cibles.includes(niveau)) {
        return { ...prev, niveaux_cibles: cibles.filter(n => n !== niveau) };
      } else {
        return { ...prev, niveaux_cibles: [...cibles, niveau] };
      }
    });
  };

  const filteredArticles = articles.filter(a =>
    a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = articles.reduce((acc, a) => acc + (a.quantite_stock || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${n.type === "success" ? "bg-green-50 border-l-4 border-green-500" : "bg-red-50 border-l-4 border-red-500"}`}>
            <p className="text-sm">{n.message}</p>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion de la librairie</h1>
          <p className="text-gray-900">Articles scolaires et fournitures</p>
        </div>
        <button
          onClick={() => {
            setEditingArticle(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Total articles</p><p className="text-2xl font-bold text-blue-600">{articles.length}</p></div>
            <ShoppingCart className="w-8 h-8 text-blue-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Stock total</p><p className="text-2xl font-bold text-green-600">{totalStock}</p></div>
            <Package className="w-8 h-8 text-green-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Prix moyen</p><p className="text-2xl font-bold text-orange-600">
              {articles.length > 0 ? Math.round(articles.reduce((a, b) => a + b.prix_unitaire, 0) / articles.length).toLocaleString() : 0} GNF
            </p></div>
            <DollarSign className="w-8 h-8 text-orange-700" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-900 text-sm">Catégories</p><p className="text-2xl font-bold text-purple-600">
              {new Set(articles.map(a => a.categorie)).size}
            </p></div>
            <ShoppingCart className="w-8 h-8 text-purple-700" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative text-black">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Prix unitaire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Niveaux cibles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-black">{article.nom}</td>
                  <td className="px-6 py-4 text-black">{article.categorie}</td>
                  <td className="px-6 py-4 text-black">{article.prix_unitaire.toLocaleString()} GNF</td>
                  <td className="px-6 py-4 text-black">{article.quantite_stock}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(article.niveaux_cibles || []).map(n => (
                        <span key={n} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {n}
                        </span>
                      ))}
                      {(!article.niveaux_cibles || article.niveaux_cibles.length === 0) && (
                        <span className="text-gray-900 text-xs">Aucun</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingArticle(article);
                          setFormData({
                            nom: article.nom,
                            description: article.description || "",
                            prix_unitaire: article.prix_unitaire,
                            quantite_stock: article.quantite_stock,
                            categorie: article.categorie,
                            image_url: article.image_url || "",
                            niveaux_cibles: article.niveaux_cibles || [],
                          });
                          setShowForm(true);
                        }}
                        className="text-green-600 hover:text-green-800 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id, article.nom)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredArticles.length === 0 && (
          <div className="text-center py-12 text-gray-900">Aucun article trouvé</div>
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingArticle ? "Modifier" : "Ajouter"} un article</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Prix unitaire (GNF) *</label>
                  <input
                    type="number"
                    value={formData.prix_unitaire}
                    onChange={(e) => setFormData({ ...formData, prix_unitaire: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Quantité en stock</label>
                  <input
                    type="number"
                    value={formData.quantite_stock}
                    onChange={(e) => setFormData({ ...formData, quantite_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="fourniture">Fourniture</option>
                  <option value="uniforme">Uniforme</option>
                  <option value="livre">Livre</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">Niveaux cibles (obligatoire pour ces niveaux)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {niveauxDisponibles.map(niveau => (
                    <button
                      key={niveau}
                      type="button"
                      onClick={() => toggleNiveau(niveau)}
                      className={`px-3 py-1 rounded-full text-sm ${(formData.niveaux_cibles || []).includes(niveau) ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}
                    >
                      {niveau}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-900 mt-1">Sélectionnez les niveaux pour lesquels cet article est obligatoire.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">URL de l'image (optionnel)</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {editingArticle ? "Modifier" : "Créer"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingArticle(null); }} className="flex-1 border rounded-lg py-2 hover:bg-gray-50 text-black">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}