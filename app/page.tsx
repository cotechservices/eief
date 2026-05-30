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
  CheckCircle,
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
    success: 100
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
      {/* ========== STATISTIQUES ANIMÉES ========== */}
      <section className="py-10 bg-gradient-to-r from-blue-800 to-blue-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl text-white font-bold text-gray-900 mb-4">
              École Internationale des Enfants Futur
            </h2>
<<<<<<< HEAD
            <p className="text-gray-100 max-w-2xl mx-auto">
=======
            <p className="text-gray-400 max-w-2xl mx-auto">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
              Une éducation d'excellence pour former les leaders de demain.
            </p>
          </div> 
          <br />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
<<<<<<< HEAD
              <div className="text-4xl font-bold mb-2 text-gray-200">{stats.students}+</div>
              <div className="text-blue-100">Élèves</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-200">{stats.teachers}+</div>
              <div className="text-blue-100">Enseignants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-200">{stats.classes}</div>
              <div className="text-blue-100">Classes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-200">{stats.success}%</div>
=======
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
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
              <div className="text-blue-100">Taux de réussite</div>
            </div>
          </div>
        </div>
      </section>
      {/* ========== PLATEFORME MODULES - 6 SUR UNE LIGNE ========== */}
      <section className="py-10">
        <div className="container mx-auto px-4">
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
      {/* ========== SECTION MODERNITÉ & INNOVATION ========== */}
      <section className="py-5 bg-white">
        <div className="container mx-auto px-4">
          {/* Titre de section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Une école tournée vers l'avenir
            </h2>
<<<<<<< HEAD
            <div className="w-20 h-1 bg-blue-800 mx-auto mb-6"></div>
=======
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
          </div>
        {/* Deux colonnes : Texte à gauche + Grille images à droite */}
        <div className="flex flex-col md:flex-row gap-12 items-start mb-16">
          {/* Colonne gauche - Texte */}
          <div className="flex-1">
            <div className="space-y-8">
              {/* Préinscriptions & Inscriptions */}
<<<<<<< HEAD
              <div className="border-l-4 border-blue-800 pl-6">
=======
              <div className="border-l-4 border-blue-600 pl-6">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Préinscriptions & Inscriptions
                </h3>

<<<<<<< HEAD
                <p className="text-gray-800 leading-relaxed mb-4">
=======
                <p className="text-gray-600 leading-relaxed mb-4">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                  Les préinscriptions et inscriptions sont ouvertes pour l’année scolaire
                  en cours. Notre établissement accueille les élèves dans un cadre moderne,
                  sécurisé et propice à la réussite académique.
                </p>

                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start gap-3">
<<<<<<< HEAD
                    <div className="w-2 h-2 bg-blue-800 rounded-full mt-2"></div>
=======
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    <p>
                      Procédure d’inscription simple, rapide et accessible en ligne.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
<<<<<<< HEAD
                    <div className="w-2 h-2 bg-blue-800 rounded-full mt-2"></div>
=======
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    <p>
                      Places disponibles de la maternelle au lycée selon les capacités d’accueil.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
<<<<<<< HEAD
                    <div className="w-2 h-2 bg-blue-800 rounded-full mt-2"></div>
=======
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    <p>
                      Possibilité de préinscription en ligne avec suivi administratif sécurisé.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
<<<<<<< HEAD
                    <div className="w-2 h-2 bg-blue-800 rounded-full mt-2"></div>
=======
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    <p>
                      Possibilité de préinscription en ligne avec suivi administratif sécurisé.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
<<<<<<< HEAD
                    <div className="w-2 h-2 bg-blue-800 rounded-full mt-2"></div>
=======
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    <p>
                      Possibilité de préinscription en ligne avec suivi administratif sécurisé.
                    </p>
                  </div>
                </div>

               <Link href="/register">
<<<<<<< HEAD
                  <button className="mt-6 bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
=======
                  <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    Faire une préinscription
                  </button>
                </Link>
              </div>

            </div>
          </div>
            {/* Colonne droite - Images 2 par ligne avec effet de superposition */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 gap-y-6">
                {/* Image 1 */}
                <div className="relative group">
                  <div className="relative z-10 bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                    <div className="relative w-full h-40">
                      <Image
                        src="/img/slide3.jpg"
                        alt="Bibliothèque numérique"
                        width={300}
                        height={160}
                        className="object-cover w-full h-full hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">Bibliothèque numérique</div>
                  </div>
                </div>
                
                {/* Image 2 - avec décalage vers le bas */}
                <div className="relative group mt-6">
                  <div className="relative z-10 bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                    <div className="relative w-full h-40">
                      <Image
                        src="/img/slide5.jpg"
                        alt="Laboratoire informatique"
                        width={300}
                        height={160}
                        className="object-cover w-full h-full hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">Laboratoire informatique</div>
                  </div>
                </div>
                
                {/* Image 3 */}
                <div className="relative group -mt-4">
                  <div className="relative z-10 bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                    <div className="relative w-full h-40">
                      <Image
                        src="/img/slide2.jpg"
                        alt="Robotique"
                        width={300}
                        height={160}
                        className="object-cover w-full h-full hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">Robotique & programmation</div>
                  </div>
                </div>
                
                {/* Image 4 - avec décalage */}
                <div className="relative group mt-2">
                  <div className="relative z-10 bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300">
                    <div className="relative w-full h-40">
                      <Image
                        src="/img/logo.jpg"
                        alt="Application mobile"
                        width={300}
                        height={160}
                        className="object-cover w-full h-full hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">Application mobile</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ========== FEATURES ========== */}
          <section className=" bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Une éducation d'excellence dans un environnement propice à l'apprentissage
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition group"
                  >
<<<<<<< HEAD
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-800 transition">
                      <feature.icon className="w-8 h-8 text-blue-800 group-hover:text-white transition" />
                    </div>
                    <h3 className="text-xl text-black font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-500 ">{feature.description}</p>
=======
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
                      <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                  </div>
                ))}
              </div>
            </div>
          </section>
          <br />
          {/* Bannière de pub */}
<<<<<<< HEAD
          <div className="relative bg-gradient-to-r from-blue-800 to-indigo-700 rounded-2xl overflow-hidden shadow-xl">
=======
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-xl">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 grid md:grid-cols-2 gap-8 p-8 md:p-12">
              <div className="text-white">
                <div className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm mb-4">
                  🌟 Innovation & Excellence
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  La première école 100% digitale de Guinée
                </h3>
                <p className="text-blue-100 mb-6">
                  Découvrez notre plateforme de gestion scolaire intégrée. Suivez la scolarité de vos enfants en temps réel, 
                  accédez aux cours en ligne, et communiquez directement avec les enseignants.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Cours en ligne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Paiements sécurisés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Application mobile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm">Suivi en temps réel</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center text-center md:text-right">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 w-full">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-white font-semibold mb-2">Application mobile disponible</p>
                  <p className="text-blue-100 text-sm mb-4">iOS & Android</p>
                  <div className="flex justify-center gap-3">
                    <div className="bg-black rounded-lg px-3 py-1 flex items-center gap-2 cursor-pointer hover:bg-gray-900 transition">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.86-3.08.42-1.1-.47-2.11-.48-3.24 0-1.72.74-2.69.22-3.24-.42-2.2-2.58-2.88-6.18-1.47-8.56.84-1.42 2.22-2.28 3.66-2.28 1.44 0 2.34.72 3.24.72.9 0 2.28-.96 3.9-.72 1.44.24 2.52 1.08 3.18 2.28-2.52 1.56-2.16 4.92.42 6.36-.6 1.44-1.44 2.88-2.4 4.2zM12 5.4c-.48-1.2-1.44-2.04-2.52-2.16-1.08-.12-2.16.48-2.64 1.56-1.08.48-2.16 1.56-2.64 3.12.48-.12 1.08-.24 1.68-.24.96 0 1.92.24 2.64.72.72.48 1.08 1.2 1.2 2.04.12.84-.12 1.68-.48 2.4.96.48 2.04.72 3.12.72 1.08 0 2.16-.24 3.12-.72-.36-.72-.6-1.56-.48-2.4.12-.84.48-1.56 1.2-2.04.72-.48 1.68-.72 2.64-.72.6 0 1.2.12 1.68.24-.48-1.56-1.56-2.64-2.64-3.12-.48-1.08-1.56-1.68-2.64-1.56-1.08.12-2.04.96-2.52 2.16z"/>
                      </svg>
                      <span className="text-xs text-white">App Store</span>
                    </div>
                    <div className="bg-black rounded-lg px-3 py-1 flex items-center gap-2 cursor-pointer hover:bg-gray-900 transition">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zM14.5 11.293l5.5-5.5-2.5 2.5-2.5 2.5-2.5-2.5-2.5-2.5-2.5 2.5 5.5 5.5z"/>
                      </svg>
                      <span className="text-xs text-white">Google Play</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Témoignages */}
          <div className="mt-10">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Ils nous font confiance</h3>
<<<<<<< HEAD
              <div className="w-16 h-1 bg-blue-800 mx-auto"></div>
=======
              <div className="w-16 h-1 bg-blue-600 mx-auto"></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}
                </div>
<<<<<<< HEAD
                <p className="text-gray-800 italic mb-4">"Une école moderne avec des infrastructures de qualité. Ma fille adore ses cours de robotique !"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg">👩</div>
                  <div><p className="font-semibold text-black text-sm">Mme Diallo</p><p className="text-xs text-gray-500">Parent d'élève</p></div>
=======
                <p className="text-gray-600 italic mb-4">"Une école moderne avec des infrastructures de qualité. Ma fille adore ses cours de robotique !"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg">👩</div>
                  <div><p className="font-semibold text-sm">Mme Diallo</p><p className="text-xs text-gray-500">Parent d'élève</p></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-1 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}</div>
<<<<<<< HEAD
                <p className="text-gray-800 italic mb-4">"La plateforme en ligne est un vrai plus. Je peux suivre les notes et les devoirs de mon fils partout."</p>
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg">👨</div><div><p className="font-semibold text-black text-sm">M. Camara</p><p className="text-xs text-gray-500">Parent d'élève</p></div></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-1 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}</div>
                <p className="text-gray-800 italic mb-4">"Les enseignants sont compétents et l'ambiance est excellente. Je recommande vivement."</p>
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg">👩</div><div><p className="font-semibold text-black text-sm">Mme Barry</p><p className="text-xs text-gray-500">Parent d'élève</p></div></div>
=======
                <p className="text-gray-600 italic mb-4">"La plateforme en ligne est un vrai plus. Je peux suivre les notes et les devoirs de mon fils partout."</p>
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg">👨</div><div><p className="font-semibold text-sm">M. Camara</p><p className="text-xs text-gray-500">Parent d'élève</p></div></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-1 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}</div>
                <p className="text-gray-600 italic mb-4">"Les enseignants sont compétents et l'ambiance est excellente. Je recommande vivement."</p>
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg">👩</div><div><p className="font-semibold text-sm">Mme Barry</p><p className="text-xs text-gray-500">Parent d'élève</p></div></div>
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ========== APPEL À L'ACTION ========== */}
<<<<<<< HEAD
      <section className="py-10 bg-gradient-to-r from-blue-800 to-blue-800">
=======
      <section className="py-10 bg-gradient-to-r from-blue-600 to-blue-800">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
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