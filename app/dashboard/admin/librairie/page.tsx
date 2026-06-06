// app/dashboard/admin/librairie/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Store, ShoppingCart, Tag, Search, Plus, Trash2, Edit, CreditCard, Box, Check, ImageIcon, X, Loader2
} from "lucide-react";
import Image from "next/image";

interface Article {
  id: number;
  nom: string;
  description: string;
  prix_unitaire: number;
  quantite_stock: number;
  categorie: string;
  image_url?: string | null;
}

interface Vente {
  id: number;
  article_nom: string;
  eleve_nom: string | null;
  quantite: number;
  montant_total: number;
  date_vente: string;
  vendeur: string;
}

export default function LibrairiePage() {
  const [activeTab, setActiveTab] = useState("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showVenteForm, setShowVenteForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [articleData, setArticleData] = useState({
    nom: "", description: "", prix_unitaire: 0, quantite_stock: 0, categorie: "fourniture", image_url: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [venteData, setVenteData] = useState({
    article_id: "", eleve_id: "", quantite: 1
  });
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resArticles, resVentes, resEleves] = await Promise.all([
        fetch('/api/admin/librairie/articles'),
        fetch('/api/admin/librairie/ventes'),
        fetch('/api/admin/eleves')
      ]);
      if (resArticles.ok) setArticles(await resArticles.json());
      if (resVentes.ok) setVentes(await resVentes.json());
      if (resEleves.ok) setEleves(await resEleves.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/librairie/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (err) {
      console.error("Erreur upload:", err);
    }
    return null;
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = articleData.image_url;
      
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const method = editingArticle ? 'PUT' : 'POST';
      const body = { 
        ...articleData, 
        id: editingArticle?.id,
        image_url: imageUrl
      };
      const res = await fetch('/api/admin/librairie/articles', {
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowArticleForm(false);
        setEditingArticle(null);
        setSelectedFile(null);
        setPreviewUrl("");
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'enregistrement");
      }
    } catch (e) { 
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (confirm("Supprimer cet article de la librairie ?")) {
      try {
        await fetch(`/api/admin/librairie/articles?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (e) { console.error(e); }
    }
  };

  const handleVenteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/librairie/ventes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(venteData)
      });
      if (res.ok) {
        setShowVenteForm(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur de vente");
      }
    } catch (e) { console.error(e); }
  };

  const filteredArticles = articles.filter(a => a.nom.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredVentes = ventes.filter(v => v.article_nom.toLowerCase().includes(searchTerm.toLowerCase()) || (v.eleve_nom && v.eleve_nom.toLowerCase().includes(searchTerm.toLowerCase())));

  const stats = {
    totalArticles: articles.length,
    valeurStock: articles.reduce((acc, a) => acc + (a.prix_unitaire * a.quantite_stock), 0),
    nombreVentes: ventes.length,
    recettesVentes: ventes.reduce((acc, v) => acc + Number(v.montant_total), 0)
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Librairie de l'école</h1>
          <p className="text-gray-900">Gestion des fournitures, uniformes et ventes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-900">Articles en stock</p><p className="text-2xl font-bold">{stats.totalArticles}</p></div>
          <Box className="text-blue-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-900">Valeur du stock</p><p className="text-2xl font-bold text-purple-600">{stats.valeurStock.toLocaleString()} GNF</p></div>
          <Store className="text-purple-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-900">Nombre de ventes</p><p className="text-2xl font-bold text-green-600">{stats.nombreVentes}</p></div>
          <ShoppingCart className="text-green-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-900">Recettes</p><p className="text-2xl font-bold text-orange-600">{stats.recettesVentes.toLocaleString()} GNF</p></div>
          <CreditCard className="text-orange-200 w-10 h-10" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b">
          <button onClick={() => setActiveTab("articles")} className={`px-6 py-4 font-medium transition-colors ${activeTab === "articles" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-900 hover:bg-gray-50"}`}>
            Inventaire
          </button>
          <button onClick={() => setActiveTab("ventes")} className={`px-6 py-4 font-medium transition-colors ${activeTab === "ventes" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-900 hover:bg-gray-50"}`}>
            Historique des ventes
          </button>
        </div>

        <div className="p-4 border-b flex justify-between bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 w-4 h-4" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm text-gray-900" />
          </div>
          {activeTab === "articles" ? (
            <button onClick={() => { setEditingArticle(null); setArticleData({ nom: "", description: "", prix_unitaire: 0, quantite_stock: 0, categorie: "fourniture", image_url: "" }); setSelectedFile(null); setPreviewUrl(""); setShowArticleForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Ajouter un article
            </button>
          ) : (
            <button onClick={() => setShowVenteForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-green-700">
              <ShoppingCart className="w-4 h-4" /> Nouvelle vente
            </button>
          )}
        </div>

        {activeTab === "articles" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-black">
                <tr>
                  <th className="px-6 py-3 text-left">Article</th>
                  <th className="px-6 py-3 text-left">Catégorie</th>
                  <th className="px-6 py-3 text-right">Prix Unitaire</th>
                  <th className="px-6 py-3 text-center">En Stock</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredArticles.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {a.image_url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={a.image_url} alt={a.nom} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Box className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{a.nom}</p>
                          <p className="text-sm text-gray-900">{a.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-900 px-2 py-1 rounded-full text-xs capitalize">{a.categorie}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{a.prix_unitaire.toLocaleString()} GNF</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.quantite_stock > 10 ? "bg-green-100 text-green-700" : a.quantite_stock > 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                        {a.quantite_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => { setEditingArticle(a); setArticleData(a); setSelectedFile(null); setPreviewUrl(""); setShowArticleForm(true); }} className="text-blue-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteArticle(a.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredArticles.length === 0 && (
              <div className="text-center py-8 text-gray-900">Aucun article trouvé</div>
            )}
          </div>
        )}

        {activeTab === "ventes" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-black">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Article</th>
                  <th className="px-6 py-3 text-left">Élève</th>
                  <th className="px-6 py-3 text-center">Quantité</th>
                  <th className="px-6 py-3 text-right">Montant Total</th>
                  <th className="px-6 py-3 text-left">Vendeur</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVentes.map((v) => (
                  <tr key={v.id}>
                    <td className="px-6 py-4 text-sm">{new Date(v.date_vente).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">{v.article_nom}</td>
                    <td className="px-6 py-4 text-sm">{v.eleve_nom || "Vente libre"}</td>
                    <td className="px-6 py-4 text-center">{v.quantite}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{v.montant_total.toLocaleString()} GNF</td>
                    <td className="px-6 py-4 text-sm">{v.vendeur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVentes.length === 0 && (
              <div className="text-center py-8 text-gray-900">Aucune vente trouvée</div>
            )}
          </div>
        )}
      </div>

      {/* Formulaire Article */}
      {showArticleForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingArticle ? "Modifier l'article" : "Nouvel article"}</h2>
            <form onSubmit={handleArticleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Image de l'article</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  {previewUrl || articleData.image_url ? (
                    <div className="relative inline-block">
                      <img 
                        src={previewUrl || articleData.image_url || ""} 
                        alt="Aperçu" 
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Cliquez pour ajouter une image</p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Nom de l'article *</label>
                <input required type="text" value={articleData.nom} onChange={e => setArticleData({ ...articleData, nom: e.target.value })} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea rows={2} value={articleData.description} onChange={e => setArticleData({ ...articleData, description: e.target.value })} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Prix Unitaire (GNF) *</label>
                  <input required type="number" min="0" value={articleData.prix_unitaire} onChange={e => setArticleData({ ...articleData, prix_unitaire: parseInt(e.target.value) })} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Quantité en stock *</label>
                  <input required type="number" min="0" value={articleData.quantite_stock} onChange={e => setArticleData({ ...articleData, quantite_stock: parseInt(e.target.value) })} className="w-full border p-2 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Catégorie</label>
                <select value={articleData.categorie} onChange={e => setArticleData({ ...articleData, categorie: e.target.value })} className="w-full border p-2 rounded-lg">
                  <option value="fourniture">Fourniture scolaire</option>
                  <option value="uniforme">Uniforme / Tenue</option>
                  <option value="livre">Livre / Cahier</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowArticleForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire Vente */}
      {showVenteForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouvelle vente</h2>
            <form onSubmit={handleVenteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Article</label>
                <select required value={venteData.article_id} onChange={e => setVenteData({ ...venteData, article_id: e.target.value })} className="w-full border p-2 rounded-lg">
                  <option value="">Sélectionner un article</option>
                  {articles.filter(a => a.quantite_stock > 0).map(a => (
                    <option key={a.id} value={a.id}>{a.nom} - {a.prix_unitaire.toLocaleString()} GNF (Stock: {a.quantite_stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Élève (Optionnel)</label>
                <select value={venteData.eleve_id} onChange={e => setVenteData({ ...venteData, eleve_id: e.target.value })} className="w-full border p-2 rounded-lg">
                  <option value="">Vente libre / Anonyme</option>
                  {eleves.map(e => (
                    <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.matricule})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Quantité</label>
                <input required type="number" min="1" value={venteData.quantite} onChange={e => setVenteData({ ...venteData, quantite: parseInt(e.target.value) })} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowVenteForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Valider la vente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}