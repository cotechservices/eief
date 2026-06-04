// app/dashboard/admin/librairie/page.tsx
"use client";

import { useState } from "react";
import { ShoppingCart, Package, TrendingUp, Star, Plus, Edit, Trash2, Eye, Search, Download } from "lucide-react";

export default function LibrairiePage() {
  const produits = [
    { id: 1, nom: "Uniforme garçon", prix: 250000, stock: 50, categorie: "uniforme", ventes: 45 },
    { id: 2, nom: "Uniforme fille", prix: 250000, stock: 45, categorie: "uniforme", ventes: 42 },
    { id: 3, nom: "Cahier 100 pages", prix: 15000, stock: 200, categorie: "cahier", ventes: 320 },
    { id: 4, nom: "Stylo bleu", prix: 5000, stock: 500, categorie: "fourniture", ventes: 850 },
  ];

  const stats = { totalProduits: 24, ventesMois: 2450000, stockValeur: 12500000, commandesAttente: 8 };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Librairie scolaire</h1><p className="text-gray-500">Vente fournitures, uniformes</p></div><button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Ajouter un produit</button></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Produits</p><p className="text-2xl font-bold text-blue-600">{stats.totalProduits}</p></div><Package className="w-8 h-8 text-blue-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Ventes (mois)</p><p className="text-2xl font-bold text-green-600">{stats.ventesMois.toLocaleString()} GNF</p></div><TrendingUp className="w-8 h-8 text-green-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Valeur stock</p><p className="text-2xl font-bold text-orange-600">{stats.stockValeur.toLocaleString()} GNF</p></div><Package className="w-8 h-8 text-orange-200" /></div></div>
        <div className="bg-white rounded-xl p-4"><div className="flex justify-between"><div><p className="text-gray-500">Commandes</p><p className="text-2xl font-bold text-purple-600">{stats.commandesAttente}</p></div><ShoppingCart className="w-8 h-8 text-purple-200" /></div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="font-semibold">Catalogue produits</h3><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" /><input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-1 border rounded-lg text-sm" /></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Produit</th><th className="px-6 py-3 text-left text-xs">Catégorie</th><th className="px-6 py-3 text-left text-xs">Prix</th><th className="px-6 py-3 text-left text-xs">Stock</th><th className="px-6 py-3 text-left text-xs">Ventes</th><th className="px-6 py-3 text-left text-xs">Actions</th></tr></thead>
        <tbody>{produits.map((p) => (<tr key={p.id} className="border-t"><td className="px-6 py-4 font-medium">{p.nom}</td><td className="px-6 py-4 capitalize">{p.categorie}</td><td className="px-6 py-4">{p.prix.toLocaleString()} GNF</td><td className="px-6 py-4">{p.stock}</td><td className="px-6 py-4">{p.ventes}</td><td className="px-6 py-4 flex gap-2"><button className="text-blue-600"><Eye className="w-4 h-4" /></button><button className="text-green-600"><Edit className="w-4 h-4" /></button><button className="text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
      </div>
    </div>
  );
}