// app/librairie/page.tsx
"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, ShoppingCart, Package, TrendingUp, Star, Filter } from "lucide-react";

export default function LibrairiePage() {
  const [cart, setCart] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const produits = [
    { id: 1, nom: "Uniforme garçon", prix: 250000, categorie: "uniforme", stock: 50 },
    { id: 2, nom: "Uniforme fille", prix: 250000, categorie: "uniforme", stock: 45 },
    { id: 3, nom: "Cahier 100 pages", prix: 15000, categorie: "cahier", stock: 200 },
    { id: 4, nom: "Cahier 200 pages", prix: 25000, categorie: "cahier", stock: 150 },
    { id: 5, nom: "Stylo bleu", prix: 5000, categorie: "fourniture", stock: 500 },
    { id: 6, nom: "Stylo rouge", prix: 5000, categorie: "fourniture", stock: 300 },
    { id: 7, nom: "Gomme", prix: 3000, categorie: "fourniture", stock: 400 },
    { id: 8, nom: "Trousse", prix: 25000, categorie: "fourniture", stock: 100 },
    { id: 9, nom: "Sac à dos", prix: 350000, categorie: "accessoire", stock: 50 },
    { id: 10, nom: "Calculatrice", prix: 200000, categorie: "accessoire", stock: 30 },
  ];

  const filteredProduits = produits.filter(produit => {
    const matchesSearch = produit.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || produit.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (id: number) => {
    setCart([...cart, id]);
    alert("Produit ajouté au panier !");
  };

  const totalPanier = cart.reduce((total, id) => {
    const produit = produits.find(p => p.id === id);
    return total + (produit?.prix || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[250px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Librairie scolaire</h1>
            <p className="text-lg">Fournitures, uniformes et manuels scolaires</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Barre de recherche et filtre */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="uniforme">Uniformes</option>
            <option value="cahier">Cahiers</option>
            <option value="fourniture">Fournitures</option>
            <option value="accessoire">Accessoires</option>
          </select>
        </div>

        {/* Panier résumé */}
        {cart.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{cart.length} article(s) dans le panier</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-blue-600">{totalPanier.toLocaleString()} GNF</span>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                  Commander
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{produits.length}</p>
            <p className="text-sm text-gray-500">Produits</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">2,500,000 GNF</p>
            <p className="text-sm text-gray-500">Ventes du mois</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">4.8/5</p>
            <p className="text-sm text-gray-500">Satisfaction des élèves</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <ShoppingCart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">156</p>
            <p className="text-sm text-gray-500">Commandes ce mois</p>
          </div>
        </div>

        {/* Produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProduits.map((produit) => (
            <div key={produit.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition">
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Package className="w-12 h-12 text-blue-500" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{produit.nom}</h3>
                <p className="text-sm text-gray-500 mb-2 capitalize">{produit.categorie}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-blue-600">
                    {produit.prix.toLocaleString()} GNF
                  </span>
                  <span className="text-xs text-gray-500">Stock: {produit.stock}</span>
                </div>
                <button
                  onClick={() => addToCart(produit.id)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ajouter au panier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}