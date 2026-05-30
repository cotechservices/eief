// app/blog/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, User, ChevronRight, Search, Tag } from "lucide-react";

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "Comment aider son enfant à réviser efficacement ?",
      date: "12 Mai 2025",
      author: "Mme Diallo",
      category: "Conseils parents",
      excerpt: "Découvrez nos astuces pour accompagner votre enfant dans ses révisions et l'aider à réussir ses examens.",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop"
    },
    {
      id: 2,
      title: "Les bienfaits des activités extrascolaires",
      date: "8 Mai 2025",
      author: "M. Camara",
      category: "Éducation",
      excerpt: "Comment les activités sportives et artistiques contribuent au développement de l'enfant.",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop"
    },
    {
      id: 3,
      title: "L'importance de l'anglais dès le plus jeune âge",
      date: "2 Mai 2025",
      author: "Mme Barry",
      category: "Langues",
      excerpt: "Pourquoi et comment apprendre l'anglais dès la maternelle est un atout pour l'avenir.",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop"
    },
  ];

  const categories = [
    { name: "Conseils parents", count: 12 },
    { name: "Éducation", count: 8 },
    { name: "Langues", count: 5 },
    { name: "Technologie", count: 4 },
    { name: "Événements", count: 7 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[300px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-xl max-w-2xl">
              Conseils, astuces et actualités éducatives
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <div className="space-y-12">
              {articles.map((article) => (
                <article key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <img src={article.image} alt={article.title} className="w-full h-64 object-cover" />
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {article.date}</span>
                      <span className="flex items-center gap-1"><User className="w-4 h-4" /> {article.author}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">{article.title}</h2>
                    <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    <a href="#" className="text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                      Lire la suite <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Search */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Rechercher</h3>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  className="flex-1 px-4 py-2 rounded-l-lg border focus:outline-none focus:border-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Catégories</h3>
              <ul className="space-y-2">
                {categories.map((cat, index) => (
                  <li key={index}>
                    <a href="#" className="flex justify-between items-center text-gray-600 hover:text-blue-600 transition">
                      <span className="flex items-center gap-2"><Tag className="w-4 h-4" /> {cat.name}</span>
                      <span className="text-sm bg-gray-200 px-2 py-0.5 rounded-full">{cat.count}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}