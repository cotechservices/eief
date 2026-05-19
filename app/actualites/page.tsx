// app/actualites/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, Eye, ChevronRight } from "lucide-react";

export default function ActualitesPage() {
  const actualites = [
    {
      id: 1,
      title: "Inscriptions 2025-2026 ouvertes",
      date: "15 Mai 2025",
      category: "Inscriptions",
      description: "Les inscriptions pour la nouvelle année scolaire sont désormais ouvertes. Rejoignez notre communauté éducative d'exception.",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop",
      views: 1250
    },
    {
      id: 2,
      title: "Journée portes ouvertes",
      date: "10 Juin 2025",
      category: "Événement",
      description: "Venez découvrir notre établissement lors de notre journée portes ouvertes. Rencontrez nos enseignants et visitez nos installations.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=400&fit=crop",
      views: 890
    },
    {
      id: 3,
      title: "Nos élèves remportent le concours de robotique",
      date: "5 Mai 2025",
      category: "Réussite",
      description: "Félicitations à notre équipe de robotique qui a remporté la première place au concours national.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop",
      views: 2100
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[300px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Actualités</h1>
            <p className="text-xl max-w-2xl">
              Toute l'actualité de l'École Internationale des Enfants Futur
            </p>
          </div>
        </div>
      </div>

      {/* Liste des actualités */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {actualites.map((article) => (
              <div key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {article.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h3>
                  <p className="text-gray-600 mb-4">{article.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {article.views} vues
                    </span>
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      Lire plus <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}