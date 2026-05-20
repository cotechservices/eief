// app/page.tsx - 6 modules sur une seule ligne
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Trophy,
  Calendar,
  CreditCard,
  Bus,
  Utensils,
  Smartphone,
  ArrowRight,
  Star,
  Library,
  BookMarked
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Statistiques animées
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    success: 0
  });

  const targetStats = {
    students: 1250,
    teachers: 85,
    classes: 32,
    success: 98
  };

  // Redirection si déjà connecté
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Animation des statistiques
  useEffect(() => {
    const duration = 2000;
    const step = 20;
    const increment = {
      students: targetStats.students / (duration / step),
      teachers: targetStats.teachers / (duration / step),
      classes: targetStats.classes / (duration / step),
      success: targetStats.success / (duration / step)
    };
    
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= duration) {
        setStats(targetStats);
        clearInterval(timer);
      } else {
        setStats({
          students: Math.min(Math.floor(increment.students * (current / step)), targetStats.students),
          teachers: Math.min(Math.floor(increment.teachers * (current / step)), targetStats.teachers),
          classes: Math.min(Math.floor(increment.classes * (current / step)), targetStats.classes),
          success: Math.min(Math.floor(increment.success * (current / step)), targetStats.success)
        });
      }
    }, step);
    
    return () => clearInterval(timer);
  }, []);

  // Slides du carrousel
  const slides = [
    {
      title: "École Internationale des Enfants Futur",
      description: "Une éducation d'excellence pour former les leaders de demain",
      image: "img/slide2.jpg",
      cta: "Découvrir l'école"
    },
    {
      title: "Inscriptions 2025-2026 ouvertes",
      description: "Rejoignez une communauté éducative d'exception",
      image: "img/slide3.jpg",
      cta: "Pré-inscrire mon enfant"
    },
    {
      title: "Plateforme de gestion 100% digitale",
      description: "Suivez la scolarité de vos enfants en temps réel",
      image: "img/slide5.jpg",
      cta: "En savoir plus"
    }
  ];

  // Navigation automatique du carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Features
  const features = [
    { icon: GraduationCap, title: "Excellence académique", description: "Un enseignement de qualité reconnu" },
    { icon: Users, title: "Encadrement", description: "Suivi individuel de chaque élève" },
    { icon: Trophy, title: "Activités extrascolaires", description: "Sport, arts, robotique et plus" },
    { icon: Smartphone, title: "Application mobile", description: "Suivez la scolarité partout" },
  ];

  // Modules de la plateforme (6 modules)
  const modules = [
    { icon: BookOpen, name: "Formation", color: "bg-blue-500" },
    { icon: Bus, name: "Transport", color: "bg-orange-500" },
    { icon: Utensils, name: "Cantine", color: "bg-red-500" },
    { icon: Star, name: "Activités", color: "bg-yellow-500" },
    { icon: Library, name: "Librairie", color: "bg-indigo-500" },
    { icon: BookMarked, name: "Bibliothèque", color: "bg-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ========== HERO CARROUSEL ========== */}
      <div className="relative h-[400px] md:h-[400px] mt-16 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4 text-white">
                <div className="max-w-2xl animate-fade-in-up">
                 <h3 className="text-3xl md:text-5xl font-bold mb-4">
                    {slide.title}
                  </h3>
                  <p className="text-lg md:text-xl mb-8 text-gray-200">
                    {slide.description}
                  </p>
                  <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2">
                    {slide.cta}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carrousel indicators */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? "w-8 bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ========== PLATEFORME MODULES - 6 SUR UNE LIGNE ========== */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              École Internationale des Enfants Futur
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une éducation d'excellence pour former les leaders de demain.
            </p>
          </div>
          {/* Grille responsive : 1 sur mobile, 2 sur tablette, 6 sur desktop */}
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {modules.map((module, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition cursor-pointer group"
              >
                <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{module.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATISTIQUES ANIMÉES ========== */}
      <section className="py-10 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="container mx-auto px-4">
          <div className="text-center text-white mb-12">
            <h2 className="text-3xl font-bold mb-4">Nos chiffres</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Découvrez les chiffres clés qui font la fierté de notre établissement
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-400">{stats.students}+</div>
              <div className="text-blue-100">Élèves</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-400">{stats.teachers}+</div>
              <div className="text-blue-100">Enseignants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-400">{stats.classes}</div>
              <div className="text-blue-100">Classes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-400">{stats.success}%</div>
              <div className="text-blue-100">Taux de réussite</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir notre école ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une éducation d'excellence dans un environnement propice à l'apprentissage
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
                  <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== APPEL À L'ACTION ========== */}
      <section className="py-10 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à rejoindre notre école ?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Inscrivez-vous dès maintenant et offrez à votre enfant une éducation d'excellence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Pré-inscription
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}