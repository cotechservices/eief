// app/page.tsx 
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
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);

  // PWA Installation
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // Statistiques animées
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    success: 100  // ← 100% par défaut
  });

  const [targetStats, setTargetStats] = useState({
    students: 1250,
    teachers: 85,
    classes: 32,
    success: 100  // ← 100% par défaut
  });

  // Charger les statistiques réelles depuis l'API publique
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/public-stats");
        const data = await res.json();
        console.log("Stats reçues:", data);

        if (data && typeof data.students === "number") {
          setTargetStats({
            students: data.students || 0,
            teachers: data.teachers || 0,
            classes: data.classes || 0,
            success: 100  // ← Toujours 100%
          });
        }
      } catch (err) {
        console.error("Erreur chargement public stats:", err);
      }
    }

    fetchStats();
  }, []);

  // Capture événement beforeinstallprompt (Android/Chrome)
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowAndroidModal(true);
    }
  };

  const doInstallAndroid = async () => {
    if (deferredPrompt) {
      setShowAndroidModal(false);
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const installIOS = () => {
    setShowIOSModal(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
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
  }, [targetStats]);

  // Slides du carrousel
  const slides = [
    {
      title: "Inscriptions ouvertes",
      description: "Rejoignez une communauté éducative d'exception",
      image: "/img/slide3.jpg",
      cta: "Inscrire mon enfant",
      link: "/register"
    },
    {
      title: "Notre école du futur",
      description: "Une éducation d'excellence pour former les leaders",
      image: "/img/slide2.jpg",
      cta: "Reinscrire mon enfant",
      link: "/register"
    },
    {
      title: "Innovation & Digital",
      description: "Suivez la scolarité de vos enfants en temps réel",
      image: "/img/slide5.jpg",
      cta: "Inscrire mon enfant",
      link: "/register"
    }
  ];

  // Préchargement des images
  useEffect(() => {
    setLoadedImages(new Array(slides.length).fill(false));
    slides.forEach((slide, index) => {
      const img = new window.Image();
      img.src = slide.image;
      img.onload = () => {
        setLoadedImages(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      };
    });
  }, []);

  // Navigation automatique du carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Features
  const features = [
    { icon: GraduationCap, title: "Excellence académique", description: "Un enseignement de qualité", link: "/programmes" },
    { icon: Users, title: "Encadrement", description: "Suivi individuel de chaque élève", link: "/encadrement" },
    { icon: Trophy, title: "Activités extrascolaires", description: "Sport, arts, robotique et plus", link: "/activites" },
    { icon: Smartphone, title: "Application mobile", description: "Suivez la scolarité partout", link: "/mobile-app" },
  ];

  // Modules de la plateforme (6 modules)
  const modules = [
    { icon: BookOpen, name: "Formation", color: "bg-blue-500", link: "/formation" },
    { icon: Bus, name: "Transport", color: "bg-orange-500", link: "/transport" },
    { icon: Utensils, name: "Cantine", color: "bg-red-500", link: "/cantine" },
    { icon: Star, name: "Activités", color: "bg-yellow-500", link: "/activites" },
    { icon: Library, name: "Librairie", color: "bg-indigo-500", link: "/librairie" },
    { icon: BookMarked, name: "Bibliothèque", color: "bg-teal-500", link: "/bibliotheque" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ========== HERO CARROUSEL avec Next.js Image ========== */}
      <div className="relative h-[250px] md:h-[350px] mt-16 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === index ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
                quality={90}
                onError={(e) => {
                  console.error(`Erreur de chargement de l'image: ${slide.image}`);
                }}
              />
            </div>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4 text-white">
                <div className="max-w-2xl animate-fade-in-up">
                  <h3 className="text-3xl md:text-5xl font-bold mb-4">
                    {slide.title}
                  </h3>
                  <p className="text-lg md:text-xl mb-8 text-gray-900">
                    {slide.description}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <Link href="/register">
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg">
                        Inscrire mon enfant
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                    <Link href="/reinscription">
                      <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow-lg">
                        Réinscrire mon enfant
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carrousel indicators */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? "w-8 bg-white" : "bg-white/50"
                }`}
            />
          ))}
        </div>
      </div>

      {/* ========== STATISTIQUES ANIMÉES ========== */}
      <section className="py-10 bg-gradient-to-r from-blue-800 to-blue-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl text-white font-bold mb-4">
              École Internationale les Enfants du Futur
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Une éducation d'excellence pour former les leaders de demain.
            </p>
          </div>
          <br />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-100">
                {stats.students > 0 ? `${stats.students}+` : stats.students}
              </div>
              <div className="text-blue-100">Élèves</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-100">
                {stats.teachers > 0 ? `${stats.teachers}+` : stats.teachers}
              </div>
              <div className="text-blue-100">Enseignants & Personnels</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-100">
                {stats.classes > 0 ? stats.classes : stats.classes}
              </div>
              <div className="text-blue-100">Classes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-100">
                {stats.success}%  {/* ← Toujours 100% */}
              </div>
              <div className="text-blue-100">Taux de réussite</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PLATEFORME MODULES - 6 SUR UNE LIGNE ========== */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {modules.map((module, index) => (
              <Link href={module.link} key={index}>
                <div
                  className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition cursor-pointer group"
                >
                  <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{module.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SECTION MODERNITÉ & INNOVATION ========== */}
      <section className="py-5 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Une école tournée vers l'avenir
            </h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start mb-16">
            <div className="flex-1">
              <div className="space-y-8">
                <div className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Préinscriptions & Inscriptions
                  </h3>
                  <p className="text-gray-900 leading-relaxed mb-4">
                    Les préinscriptions et inscriptions sont ouvertes pour l'année scolaire
                    en cours. Notre établissement accueille les élèves dans un cadre moderne,
                    sécurisé et propice à la réussite académique.
                  </p>

                  <div className="space-y-3 text-gray-900">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p>Procédure d'inscription simple, rapide et accessible en ligne.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p>Places disponibles de la maternelle au lycée selon les capacités d'accueil.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p>Possibilité de préinscription en ligne avec suivi administratif sécurisé.</p>
                    </div>
                  </div>

                  <Link href="/register">
                    <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition">
                      Faire une inscription
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 gap-y-6">
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
                    <div className="p-2 text-center text-xs text-gray-900 bg-gray-50">Bibliothèque numérique</div>
                  </div>
                </div>

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
                    <div className="p-2 text-center text-xs text-gray-900 bg-gray-50">Laboratoire informatique</div>
                  </div>
                </div>

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
                    <div className="p-2 text-center text-xs text-gray-900 bg-gray-50">Robotique & programmation</div>
                  </div>
                </div>

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
                    <div className="p-2 text-center text-xs text-gray-900 bg-gray-50">Application mobile</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Une éducation d'excellence dans un environnement propice à l'apprentissage
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link href={feature.link} key={index}>
                <div
                  className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
                    <feature.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-900">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <div className="container mx-auto px-4 mt-10 mb-10">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ils nous font confiance</h3>
          <div className="w-16 h-1 bg-blue-600 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}
            </div>
            <p className="text-gray-900 italic mb-4">"Une école moderne avec des infrastructures de qualité. Ma fille adore ses cours de robotique !"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg"></div>
              <div><p className="font-semibold text-gray-900 text-sm">Mme Diallo</p><p className="text-xs text-gray-900">Parent d'élève</p></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-1 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}</div>
            <p className="text-gray-900 italic mb-4">"La plateforme en ligne est un vrai plus. Je peux suivre les notes et les devoirs de mon fils partout."</p>
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg"></div><div><p className="font-semibold text-gray-900 text-sm">M. Camara</p><p className="text-xs text-gray-900">Parent d'élève</p></div></div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-1 mb-4">{[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}</div>
            <p className="text-gray-900 italic mb-4">"Les enseignants sont compétents et l'ambiance est excellente. Je recommande vivement."</p>
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-lg"></div><div><p className="font-semibold text-gray-900 text-sm">Mme Barry</p><p className="text-xs text-gray-900">Parent d'élève</p></div></div>
          </div>
        </div>
      </div>

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
              Inscription
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