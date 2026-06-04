// app/librairie/page.tsx
"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Search, ShoppingCart, Package, TrendingUp, Star, Filter, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function LibrairiePage() {
  const [cart, setCart] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const produits = [
    { 
      id: 1, 
      nom: "Uniforme garçon", 
      prix: 250000, 
      categorie: "uniforme", 
      stock: 50,
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop",
      description: "Ensemble complet garçon (chemise, pantalon, ceinture)"
    },
    { 
      id: 2, 
      nom: "Uniforme fille", 
      prix: 250000, 
      categorie: "uniforme", 
      stock: 45,
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=300&fit=crop",
      description: "Ensemble complet fille (robe, chemisier, nœud)"
    },
    { 
      id: 3, 
      nom: "Cahier 100 pages", 
      prix: 15000, 
      categorie: "cahier", 
      stock: 200,
      image: "https://images.unsplash.com/photo-1584779867502-0acf0c50ed7a?w=400&h=300&fit=crop",
      description: "Cahier grand format 100 pages, couverture rigide"
    },
    { 
      id: 4, 
      nom: "Cahier 200 pages", 
      prix: 25000, 
      categorie: "cahier", 
      stock: 150,
      image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400&h=300&fit=crop",
      description: "Cahier grand format 200 pages, couverture renforcée"
    },
    { 
      id: 5, 
      nom: "Stylo bleu", 
      prix: 5000, 
      categorie: "fourniture", 
      stock: 500,
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=300&fit=crop",
      description: "Stylo à bille bleu, écriture fluide, lot de 5"
    },
    { 
      id: 6, 
      nom: "Stylo rouge", 
      prix: 5000, 
      categorie: "fourniture", 
      stock: 300,
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=300&fit=crop&color=red",
      description: "Stylo à bille rouge, correction et annotation"
    },
    { 
      id: 7, 
      nom: "Gomme", 
      prix: 3000, 
      categorie: "fourniture", 
      stock: 400,
      image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=300&fit=crop",
      description: "Gomme blanche sans traces, efface propre"
    },
    { 
      id: 8, 
      nom: "Trousse", 
      prix: 25000, 
      categorie: "fourniture", 
      stock: 100,
      image: "https://images.unsplash.com/photo-1577991559883-4d7e5df1729a?w=400&h=300&fit=crop",
      description: "Trousse en toile, 3 compartiments, fermeture zip"
    },
    { 
      id: 9, 
      nom: "Sac à dos", 
      prix: 350000, 
      categorie: "accessoire", 
      stock: 50,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
      description: "Sac à dos ergonomique, renforcé, plusieurs poches"
    },
    { 
      id: 10, 
      nom: "Calculatrice scientifique", 
      prix: 200000, 
      categorie: "accessoire", 
      stock: 30,
      image: "https://images.unsplash.com/photo-1587145823266-9c2e3009b3bc?w=400&h=300&fit=crop",
      description: "Calculatrice scientifique, 240+ fonctions"
    },
    { 
      id: 11, 
      nom: "Manuel de Mathématiques 3ème", 
      prix: 85000, 
      categorie: "manuel", 
      stock: 75,
      image: "https://images.unsplash.com/photo-1509228627152-72ae9ae6841d?w=400&h=300&fit=crop",
      description: "Manuel complet, programme officiel, exercices corrigés"
    },
    { 
      id: 12, 
      nom: "Règle et compas", 
      prix: 12000, 
      categorie: "fourniture", 
      stock: 200,
      image: "https://images.unsplash.com/photo-1584779858347-6b8d9f4d3d6a?w=400&h=300&fit=crop",
      description: "Kit géométrie complet (règle, équerre, compas, rapporteur)"
    }
  ];

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "uniforme", label: "Uniformes" },
    { value: "cahier", label: "Cahiers" },
    { value: "fourniture", label: "Fournitures" },
    { value: "accessoire", label: "Accessoires" },
    { value: "manuel", label: "Manuels" }
  ];

  const filteredProduits = produits.filter(produit => {
    const matchesSearch = produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produit.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || produit.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (id: number) => {
    setCart([...cart, id]);
    alert("Produit ajouté au panier !");
  };

  const removeFromCart = (id: number) => {
    const index = cart.indexOf(id);
    if (index !== -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  const getCartItemCount = (id: number) => {
    return cart.filter(itemId => itemId === id).length;
  };

  const totalPanier = cart.reduce((total, id) => {
    const produit = produits.find(p => p.id === id);
    return total + (produit?.prix || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[350px] mt-16 overflow-hidden">        
        <div className="absolute inset-0 bg-black/50 z-10" />
        {/* Image de fond */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/slide2.jpg"
            alt="École Internationale des Enfants Futur"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Contenu du Hero */}
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Librairie scolaire</h1>
            <p className="text-xl max-w-2xl">
              Fournitures, uniformes, manuels scolaires et accessoires de qualité
            </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="#mission" 
                  className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Découvrir notre mission
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Barre de recherche et filtre */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border text-black rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Panier résumé */}
        {cart.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-blue-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{cart.length} article(s) dans le panier</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm text-gray-800">
                  {cart.map((id, idx) => {
                    const produit = produits.find(p => p.id === id);
                    return produit && (
                      <span key={idx} className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs mr-1 mb-1">
                        {produit.nom} x{getCartItemCount(id)}
                      </span>
                    );
                  })}
                </div>
                <span className="text-xl font-bold text-blue-600">{totalPanier.toLocaleString()} GNF</span>
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold">
                  Commander
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition">
            <Package className="w-10 h-10 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{produits.length}</p>
            <p className="text-sm text-gray-500">Produits disponibles</p>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition">
            <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">2,500,000 GNF</p>
            <p className="text-sm text-gray-500">Ventes du mois</p>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition">
            <Star className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">4.8/5</p>
            <p className="text-sm text-gray-500">Satisfaction client</p>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition">
            <ShoppingCart className="w-10 h-10 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">156</p>
            <p className="text-sm text-gray-500">Commandes ce mois</p>
          </div>
        </div>

        {/* Produits */}
        {filteredProduits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Package className="w-16 h-16 text-gray-900 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProduits.map((produit) => (
              <div key={produit.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={produit.image}
                    alt={produit.nom}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {produit.categorie}
                  </div>
                  {produit.stock < 50 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      Stock limité
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">{produit.nom}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{produit.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-blue-600">
                      {produit.prix.toLocaleString()} GNF
                    </span>
                    <span className="text-xs text-gray-900">Stock: {produit.stock}</span>
                  </div>
                  <button
                    onClick={() => addToCart(produit.id)}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter au panier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section avantages */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Pourquoi acheter chez nous ?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Livraison rapide</h4>
              <p className="text-sm text-gray-600">Livraison à domicile en 48h sur Conakry</p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Qualité garantie</h4>
              <p className="text-sm text-gray-600">Produits certifiés conformes aux normes</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Meilleurs prix</h4>
              <p className="text-sm text-gray-600">Prix compétitifs sur toute la gamme</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}