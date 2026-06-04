// app/blog/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import YouTubeGallery from "@/components/YouTubeGallery";
import { Calendar, User, ChevronRight, Search, Tag, Clock, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "Comment aider son enfant à réviser efficacement ?",
      date: "12 Mai 2025",
      author: "Mme Diallo",
      category: "Conseils parents",
      excerpt: "Découvrez nos astuces pour accompagner votre enfant dans ses révisions et l'aider à réussir ses examens.",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop",
      readTime: "5 min",
      views: "1.2k"
    },
    {
      id: 2,
      title: "Les bienfaits des activités extrascolaires",
      date: "8 Mai 2025",
      author: "M. Camara",
      category: "Éducation",
      excerpt: "Comment les activités sportives et artistiques contribuent au développement de l'enfant.",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
      readTime: "4 min",
      views: "890"
    },
    {
      id: 3,
      title: "L'importance de l'anglais dès le plus jeune âge",
      date: "2 Mai 2025",
      author: "Mme Barry",
      category: "Langues",
      excerpt: "Pourquoi et comment apprendre l'anglais dès la maternelle est un atout pour l'avenir.",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop",
      readTime: "6 min",
      views: "2.1k"
    },
    {
      id: 4,
      title: "La technologie au service de l'éducation",
      date: "28 Avril 2025",
      author: "M. Konaté",
      category: "Technologie",
      excerpt: "Comment les outils numériques transforment l'apprentissage en classe.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop",
      readTime: "7 min",
      views: "3.4k"
    },
    {
      id: 5,
      title: "Préparer son enfant à la rentrée scolaire",
      date: "20 Avril 2025",
      author: "Mme Touré",
      category: "Conseils parents",
      excerpt: "Nos conseils pour une rentrée scolaire réussie et sans stress.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop",
      readTime: "5 min",
      views: "1.5k"
    },
    {
      id: 6,
      title: "Les métiers de demain",
      date: "15 Avril 2025",
      author: "M. Diallo",
      category: "Orientation",
      excerpt: "Découvrez les métiers qui recruteront dans les années à venir.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop",
      readTime: "8 min",
      views: "2.8k"
    },
  ];

  const categories = [
    { name: "Tous les articles", count: articles.length, active: true },
    { name: "Conseils parents", count: 12 },
    { name: "Éducation", count: 8 },
    { name: "Langues", count: 5 },
    { name: "Technologie", count: 4 },
    { name: "Orientation", count: 3 },
    { name: "Événements", count: 7 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section avec image de fond */}
      <div className="relative h-[360px] mt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/slide3.jpg"
            alt="Bibliothèque numérique"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Vidéos</h1>
            <p className="text-xl max-w-2xl">
              Conseils, astuces et actualités éducatives en vidéo
            </p>
          </div>
        </div>
      </div>

      {/* SECTION YOUTUBE GALLERY - INTÉGRÉE ICI */}
      <YouTubeGallery />

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - À gauche */}
          <div className="lg:w-1/4 order-2 lg:order-1">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Rechercher</h3>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  className="flex-1 px-4 py-2 text-gray-800 rounded-l-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Catégories</h3>
              <ul className="space-y-2">
                {categories.map((cat, index) => (
                  <li key={index}>
                    <a 
                      href="#" 
                      className={`flex justify-between items-center px-3 py-2 rounded-lg transition ${
                        cat.active 
                          ? "bg-blue-50 text-blue-600 font-medium" 
                          : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4" /> 
                        {cat.name}
                      </span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        cat.active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {cat.count}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Newsletter</h3>
              <p className="text-sm text-blue-100 mb-4">
                Recevez nos derniers articles directement dans votre boîte mail
              </p>
              <input
                type="email"
                placeholder="Votre email"
                className="w-full px-4 py-2 rounded-lg text-gray-800 mb-3 focus:outline-none"
              />
              <button className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                S'abonner
              </button>
            </div>
          </div>

          {/* Main Content - Grille d'articles */}
          <div className="lg:w-3/4 order-1 lg:order-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Articles récents</h2>
              <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Voir tous
              </a>
            </div>

            {/* Grille d'articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <Link href={`/blog/${article.id}`} key={article.id}>
                  <article className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={article.image} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {article.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                        {article.title}
                      </h2>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {article.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {article.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {article.views}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {article.author.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-600">{article.author}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-10">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                Précédent
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                3
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}