// app/bibliotheque/page.tsx
"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, BookOpen, User, Calendar, Download, Filter } from "lucide-react";

export default function BibliothequePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const livres = [
    { id: 1, titre: "Mathématiques 5ème", auteur: "M. CAMARA", categorie: "scolaire", disponible: true, isbn: "978-2-1234-5678-9" },
    { id: 2, titre: "Français 4ème", auteur: "Mme BARRY", categorie: "scolaire", disponible: true, isbn: "978-2-1234-5679-6" },
    { id: 3, titre: "Histoire de la Guinée", auteur: "Pr. KONATÉ", categorie: "histoire", disponible: false, isbn: "978-2-1234-5680-2" },
    { id: 4, titre: "Le Petit Prince", auteur: "Saint-Exupéry", categorie: "litterature", disponible: true, isbn: "978-2-1234-5681-9" },
    { id: 5, titre: "Sciences Physiques", auteur: "M. DIALLO", categorie: "scolaire", disponible: true, isbn: "978-2-1234-5682-6" },
  ];

  const filteredLivres = livres.filter(livre => {
    const matchesSearch = livre.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          livre.auteur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || livre.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[250px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Bibliothèque</h1>
            <p className="text-lg">Découvrez notre catalogue de livres</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Barre de recherche */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un livre par titre ou auteur..."
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
              <option value="scolaire">Scolaire</option>
              <option value="litterature">Littérature</option>
              <option value="histoire">Histoire</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">1,250</p>
            <p className="text-sm text-gray-500">Livres disponibles</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <User className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">45</p>
            <p className="text-sm text-gray-500">Emprunts en cours</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">12</p>
            <p className="text-sm text-gray-500">Livres en retard</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Download className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">89</p>
            <p className="text-sm text-gray-500">Livres numériques</p>
          </div>
        </div>

        {/* Catalogue */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Catalogue des livres</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLivres.map((livre) => (
                  <tr key={livre.id}>
                    <td className="px-6 py-4 font-medium text-gray-800">{livre.titre}</td>
                    <td className="px-6 py-4 text-gray-600">{livre.auteur}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {livre.categorie}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {livre.disponible ? (
                        <span className="text-green-600 text-sm">Disponible</span>
                      ) : (
                        <span className="text-red-600 text-sm">Emprunté</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        Réserver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}