// app/librairie/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Search, ShoppingCart, Package, TrendingUp, Star, Filter, ChevronRight, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";

interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  categorie: string;
  image_url?: string | null;
}

export default function LibrairiePage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/public/librairie');
      if (response.ok) {
        const data = await response.json();
        console.log("Produits chargés:", data); // Debug: voir si image_url est présent
        setProduits(data || []);
      }
    } catch (error) {
      console.error("Erreur chargement articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Fonction pour obtenir l'image du produit - PRIORITÉ À L'IMAGE DE LA BD
  const getProductImage = (produit: Produit) => {
    // PRIORITÉ 1: Image de la base de données (uploadée dans l'admin)
    if (produit.image_url && !imageErrors[produit.id]) {
      console.log(`Image BD pour ${produit.nom}: ${produit.image_url}`);
      return produit.image_url;
    }
    
    // PRIORITÉ 2: Image de fallback basée sur la catégorie
    const nom = produit.nom.toLowerCase();
    const categorie = (produit.categorie || "").toLowerCase();

    if (categorie === "uniforme" || nom.includes("uniforme") || nom.includes("tenue") || nom.includes("chemise") || nom.includes("pantalon") || nom.includes("veste")) {
      return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop";
    }
    if (categorie === "cahier" || nom.includes("cahier") || nom.includes("carnet") || nom.includes("bloc")) {
      return "https://images.unsplash.com/photo-1584779867502-0acf0c50ed7a?w=400&h=300&fit=crop";
    }
    if (categorie === "livre" || nom.includes("manuel") || nom.includes("livre") || nom.includes("dictionnaire")) {
      return "https://images.unsplash.com/photo-1509228627152-72ae9ae6841d?w=400&h=300&fit=crop";
    }
    if (nom.includes("sac") || nom.includes("cartable") || nom.includes("backpack")) {
      return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop";
    }
    if (nom.includes("calculatrice") || nom.includes("casio") || nom.includes("calcul")) {
      return "https://images.unsplash.com/photo-1587145823266-9c2e3009b3bc?w=400&h=300&fit=crop";
    }
    if (nom.includes("stylo") || nom.includes("crayon") || nom.includes("feutre")) {
      return "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=300&fit=crop";
    }
    
    // Image par défaut
    return "https://images.unsplash.com/photo-1584779858347-6b8d9f4d3d6a?w=400&h=300&fit=crop";
  };

  const handleImageError = (produitId: number) => {
    console.log(`Erreur chargement image pour le produit ${produitId}`);
    setImageErrors(prev => ({ ...prev, [produitId]: true }));
  };

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "uniforme", label: "Uniformes" },
    { value: "cahier", label: "Cahiers" },
    { value: "fourniture", label: "Fournitures" },
    { value: "livre", label: "Livres / Manuels" },
    { value: "autre", label: "Autres" }
  ];

  const filteredProduits = produits.filter(produit => {
    const matchesSearch = produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produit.description || "").toLowerCase().includes(searchTerm.toLowerCase());
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

  const totalArticlesDisponibles = produits.length;
  const valeurTotaleStock = produits.reduce((acc, p) => acc + (p.prix * p.stock), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative h-[350px] mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/slide2.jpg"
            alt="Librairie EIEF"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Librairie scolaire</h1>
              <p className="text-xl max-w-2xl mb-6">
                Fournitures, uniformes, manuels scolaires et accessoires de qualité pour vos enfants.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#boutique"
                  className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Découvrir la boutique
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

      <div id="boutique" className="container mx-auto px-4 py-12">
        {/* Barre de recherche et filtre */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-900" />
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
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-blue-600">{totalPanier.toLocaleString()} GNF</span>
                <button className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-semibold text-sm">
                  Commander
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalArticlesDisponibles}</p>
            <p className="text-xs text-gray-900">Articles disponibles</p>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{valeurTotaleStock.toLocaleString()} GNF</p>
            <p className="text-xs text-gray-900">Valeur totale du stock</p>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">4.9/5</p>
            <p className="text-xs text-gray-900">Satisfaction parents</p>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition">
            <ShoppingCart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Dispo</p>
            <p className="text-xs text-gray-900">Service de retrait rapide</p>
          </div>
        </div>

        {/* Liste des Produits */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredProduits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Package className="w-16 h-16 text-gray-900 mx-auto mb-4" />
            <p className="text-gray-900 text-lg font-medium">Aucun produit trouvé</p>
            <p className="text-gray-900 text-sm mt-1">Essayez d'ajuster votre recherche ou filtre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProduits.map((produit) => {
              const imageSrc = getProductImage(produit);
              return (
                <div key={produit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 group flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <img
                        src={imageSrc}
                        alt={produit.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => handleImageError(produit.id)}
                      />
                      <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                        {produit.categorie}
                      </div>
                      {produit.stock <= 5 && produit.stock > 0 && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                          Stock critique
                        </div>
                      )}
                      {produit.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm tracking-wide">
                          Rupture de stock
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-base mb-1.5 line-clamp-1">{produit.nom}</h3>
                      <p className="text-xs text-gray-900 mb-4 line-clamp-2 min-h-[32px]">{produit.description || "Aucune description fournie."}</p>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-lg font-extrabold text-blue-600">
                          {produit.prix.toLocaleString()} GNF
                        </span>
                        <span className={`text-[11px] font-semibold ${produit.stock > 10 ? 'text-green-600' : 'text-orange-500'}`}>
                          {produit.stock} en stock
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => addToCart(produit.id)}
                      disabled={produit.stock === 0}
                      className="w-full bg-blue-600 disabled:bg-gray-200 disabled:text-gray-900 text-white py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold text-sm shadow-sm hover:shadow"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section avantages */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100/50">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Pourquoi acheter à la librairie scolaire ?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/60 rounded-2xl shadow-sm border border-white">
              <Package className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">Conformité Garantie</h4>
              <p className="text-xs text-gray-900">Uniformes et fournitures officiels, respectant scrupuleusement la charte et le programme de l'établissement.</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-2xl shadow-sm border border-white">
              <Star className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">Qualité Premium</h4>
              <p className="text-xs text-gray-900">Sélection d'articles scolaires durables et de tissus de haute qualité pour les uniformes des enfants.</p>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-2xl shadow-sm border border-white">
              <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">Retrait Simplifié</h4>
              <p className="text-xs text-gray-900">Commandez en ligne ou achetez sur place pour un retrait immédiat et sans attente au secrétariat.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}