// app/bibliotheque/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { Search, BookOpen, User, Calendar, Download, ChevronRight, Filter, Loader2 } from "lucide-react";

interface Livre {
  id: number;
  titre: string;
  auteur: string;
  isbn: string;
  quantite: number;
  disponible: boolean;
  emplacement: string;
  categorie: string;
}

export default function BibliothequePage() {
  const [livres, setLivres] = useState<Livre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchLivres = async () => {
    try {
      const response = await fetch('/api/public/bibliotheque');
      if (response.ok) {
        const data = await response.json();
        setLivres(data || []);
      }
    } catch (e) {
      console.error("Erreur chargement livres:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivres();
  }, []);

  const filteredLivres = livres.filter(livre => {
    const matchesSearch = livre.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      livre.auteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (livre.isbn || "").includes(searchTerm);
    const matchesCategory = selectedCategory === "all" || livre.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Dynamically calculated stats
  const totalLivresExistants = livres.length;
  const totalLivresDisponibles = livres.filter(l => l.disponible).length;
  const totalLivresEmpruntes = livres.filter(l => !l.disponible).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative h-[350px] mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/slide2.jpg"
            alt="Bibliothèque EIEF"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Bibliothèque scolaire</h1>
              <p className="text-lg mb-6">Consultez notre catalogue de livres scolaires, littérature et manuels d'histoire.</p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#catalogue"
                  className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Consulter le catalogue
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

      <div id="catalogue" className="container mx-auto px-4 py-12">
        {/* Barre de recherche */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher par titre, auteur, ou ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 text-black border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            >
              <option value="all">Toutes les catégories</option>
              <option value="scolaire">Scolaire & Sciences</option>
              <option value="litterature">Littérature & Romans</option>
              <option value="histoire">Histoire & Géo</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalLivresExistants}</p>
            <p className="text-xs text-gray-900">Titres référencés</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <User className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{totalLivresDisponibles}</p>
            <p className="text-xs text-gray-900">Disponibles de suite</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalLivresEmpruntes}</p>
            <p className="text-xs text-gray-900">Emprunts en cours</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <Download className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">4</p>
            <p className="text-xs text-gray-900">Rayons thématiques</p>
          </div>
        </div>

        {/* Catalogue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Catalogue des livres de la bibliothèque</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLivres.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-900 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">Aucun livre trouvé</p>
              <p className="text-gray-900 text-xs mt-1">Recherchez avec d'autres mots clés ou une autre catégorie.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    <th className="px-6 py-4">Titre</th>
                    <th className="px-6 py-4">Auteur</th>
                    <th className="px-6 py-4">Catégorie</th>
                    <th className="px-6 py-4">Emplacement</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Réservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredLivres.map((livre) => (
                    <tr key={livre.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {livre.titre}
                        <div className="text-[10px] text-gray-900 font-normal mt-0.5">ISBN: {livre.isbn || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{livre.auteur}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 text-gray-900 px-2.5 py-1 rounded-full font-medium capitalize">
                          {livre.categorie}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-mono text-xs">{livre.emplacement}</td>
                      <td className="px-6 py-4">
                        {livre.disponible ? (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-semibold">
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded text-xs font-semibold">
                            Emprunté
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          disabled={!livre.disponible}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-900 font-semibold text-xs transition"
                          onClick={() => alert(`Pour réserver "${livre.titre}", veuillez vous rendre à la bibliothèque avec votre identifiant élève.`)}
                        >
                          Réserver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}