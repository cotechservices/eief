// app/librairie/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Star, 
  Filter, 
  ChevronRight, 
  Loader2, 
  ImageIcon,
  X,
  CheckCircle,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  User,
  XCircle,
  CreditCard,
  ShoppingBag,
  FileText
} from "lucide-react";
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

interface CartItem extends Produit {
  quantite: number;
}

// ⭐ Interface pour les notifications
interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function LibrairiePage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  // ⭐ États pour le modal d'ajout au panier
  const [showModal, setShowModal] = useState(false);
  const [modalProduit, setModalProduit] = useState<Produit | null>(null);
  const [modalQuantite, setModalQuantite] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);

  // ⭐ État pour le modal de confirmation de commande
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [commandeLoading, setCommandeLoading] = useState(false);
  
  // ⭐ État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ⭐ Fonction pour ajouter une notification
  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // ⭐ Fonction pour supprimer une notification
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/public/librairie');
      if (response.ok) {
        const data = await response.json();
        console.log("Produits chargés:", data);
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

  // Fonction pour obtenir l'image du produit
  const getProductImage = (produit: Produit) => {
    if (produit.image_url && !imageErrors[produit.id]) {
      return produit.image_url;
    }
    
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

  // ⭐ Ouvrir le modal d'ajout au panier
  const openAddToCartModal = (produit: Produit) => {
    setModalProduit(produit);
    setModalQuantite(1);
    setShowModal(true);
  };

  // ⭐ Confirmer l'ajout au panier
  const confirmAddToCart = () => {
    if (!modalProduit) return;
    
    setModalLoading(true);
    
    setTimeout(() => {
      const existingItem = cart.find(item => item.id === modalProduit.id);
      
      if (existingItem) {
        setCart(cart.map(item => 
          item.id === modalProduit.id 
            ? { ...item, quantite: item.quantite + modalQuantite }
            : item
        ));
      } else {
        setCart([...cart, { ...modalProduit, quantite: modalQuantite }]);
      }
      
      setModalLoading(false);
      setShowModal(false);
      setModalProduit(null);
      setModalQuantite(1);
      addNotification("success", `${modalProduit.nom} ajouté au panier !`);
    }, 500);
  };

  // ⭐ Supprimer un article du panier
  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
    addNotification("info", "Article retiré du panier");
  };

  // ⭐ Mettre à jour la quantité
  const updateQuantity = (id: number, newQuantite: number) => {
    if (newQuantite <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantite: newQuantite } : item
    ));
  };

  // ⭐ Fonction pour valider la commande
  const handleCommander = async () => {
    if (cart.length === 0) {
      addNotification("error", "Votre panier est vide");
      return;
    }

    setCommandeLoading(true);
    try {
      const articles = cart.map(item => ({
        id: item.id,
        quantite: item.quantite,
        prix_unitaire: item.prix
      }));

      const total = cart.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

      const response = await fetch("/api/parent/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles, total }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification("success", `✅ Commande ${data.data.numero_commande} créée avec succès !`);
        setCart([]);
        setShowCommandeModal(false);
      } else {
        addNotification("error", data.error || "Erreur lors de la commande");
      }
    } catch (error) {
      console.error("Erreur commande:", error);
      addNotification("error", "Une erreur est survenue lors de la commande");
    } finally {
      setCommandeLoading(false);
    }
  };

  const totalPanier = cart.reduce((total, item) => total + (item.prix * item.quantite), 0);
  const totalArticles = cart.reduce((total, item) => total + item.quantite, 0);
  const totalArticlesDisponibles = produits.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ⭐ NOTIFICATIONS */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${
              notification.type === "success"
                ? "bg-green-50 border-l-4 border-green-500 text-green-800"
                : notification.type === "error"
                ? "bg-red-50 border-l-4 border-red-500 text-red-800"
                : notification.type === "warning"
                ? "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800"
                : "bg-blue-50 border-l-4 border-blue-500 text-blue-800"
            }`}
          >
            <div className="flex-1">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notification.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
              {notification.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {notification.type === "info" && <FileText className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header avec lien vers les commandes */}
      <div className="container mx-auto px-4 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center gap-3">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
              Librairie Scolaire
            </h1>
            <p className="text-gray-900">Commandez des fournitures pour vos enfants</p>
          </div>
          <Link
            href="/dashboard/parent/commandes"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Voir mes commandes
          </Link>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalArticlesDisponibles}</p>
            <p className="text-xs text-gray-900">Articles disponibles</p>
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
      </div>

      {/* ⭐ MODAL D'AJOUT AU PANIER */}
      {showModal && modalProduit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Ajouter au panier</h3>
                  <p className="text-xs text-gray-600">Choisissez la quantité souhaitée</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border">
                  <img
                    src={getProductImage(modalProduit)}
                    alt={modalProduit.nom}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(modalProduit.id)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{modalProduit.nom}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{modalProduit.description || "Aucune description"}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-bold text-blue-600 text-base">{modalProduit.prix.toLocaleString()} GNF</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${modalProduit.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {modalProduit.stock} en stock
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <label className="text-sm font-medium text-gray-700 block mb-3">Quantité</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setModalQuantite(Math.max(1, modalQuantite - 1))}
                    disabled={modalQuantite <= 1}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-12 text-center">{modalQuantite}</span>
                  <button
                    onClick={() => setModalQuantite(Math.min(modalProduit.stock, modalQuantite + 1))}
                    disabled={modalQuantite >= modalProduit.stock}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-sm text-gray-600 ml-2">
                    Max: {modalProduit.stock}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-blue-50 rounded-xl p-3 mb-5">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  {(modalProduit.prix * modalQuantite).toLocaleString()} GNF
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-gray-700 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAddToCart}
                  disabled={modalLoading || modalQuantite > modalProduit.stock}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Ajouter au panier
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

        {/* ⭐ Panier résumé avec bouton Commander */}
        {cart.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-blue-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalArticles}
                  </span>
                </div>
                <span className="font-medium text-black">
                  {totalArticles} article{totalArticles > 1 ? 's' : ''} dans le panier
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xl font-bold text-blue-600">{totalPanier.toLocaleString()} GNF</span>
                <button 
                  onClick={() => setShowCommandeModal(true)}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-semibold text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Commander
                </button>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {cart.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full text-sm">
                    <span className="font-medium text-gray-700">{item.nom}</span>
                    <span className="text-gray-400">x</span>
                    <span className="font-semibold text-gray-900">{item.quantite}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-600 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {cart.length > 3 && (
                  <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                    +{cart.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

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
              const isInCart = cart.some(item => item.id === produit.id);
              const cartItem = cart.find(item => item.id === produit.id);
              
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
                      {isInCart && (
                        <div className="absolute bottom-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Dans le panier ({cartItem?.quantite})
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
                      onClick={() => openAddToCartModal(produit)}
                      disabled={produit.stock === 0}
                      className={`w-full py-2.5 rounded-xl transition flex items-center justify-center gap-2 font-semibold text-sm shadow-sm hover:shadow ${
                        isInCart 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:bg-gray-200 disabled:text-gray-900 disabled:cursor-not-allowed`}
                    >
                      {isInCart ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Modifier la quantité
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Ajouter au panier
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ⭐ MODAL DE CONFIRMATION DE COMMANDE */}
      {showCommandeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Confirmer la commande</h3>
                  <p className="text-xs text-gray-600">Vérifiez votre panier avant de commander</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCommandeModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5">
              {/* Liste des articles */}
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.nom}</p>
                      <p className="text-xs text-gray-500">x{item.quantite}</p>
                    </div>
                    <p className="font-bold text-green-600">{(item.prix * item.quantite).toLocaleString()} GNF</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-gray-100 p-3 rounded-lg mb-4">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-green-600">{totalPanier.toLocaleString()} GNF</span>
                </div>
              </div>

              {/* Informations de livraison */}
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-gray-700 flex items-start gap-2">
                <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Livraison à l'école</p>
                  <p className="text-xs text-gray-600">Les articles seront disponibles au bureau de la librairie.</p>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCommandeModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-gray-700 text-sm"
                  disabled={commandeLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCommander}
                  disabled={commandeLoading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commandeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Commande en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirmer la commande
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}