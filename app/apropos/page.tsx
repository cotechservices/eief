// app/apropos/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GraduationCap, Users, Award, Clock, Target, Heart, Globe, BookOpen, ChevronRight, Calendar, MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AproposPage() {
  const valeurs = [
    { icon: Heart, title: "Bienveillance", description: "Un environnement respectueux et bienveillant pour chaque élève", color: "bg-red-100", iconColor: "text-red-600" },
    { icon: Target, title: "Excellence", description: "La recherche constante de la qualité et de la performance", color: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: Globe, title: "Ouverture", description: "Une éducation tournée vers le monde et les autres cultures", color: "bg-green-100", iconColor: "text-green-600" },
    { icon: BookOpen, title: "Innovation", description: "Des méthodes pédagogiques modernes et adaptées", color: "bg-purple-100", iconColor: "text-purple-600" },
  ];

  const chiffresCles = [
    { valeur: "1200+", label: "Élèves", icon: Users },
    { valeur: "15+", label: "Classes", icon: GraduationCap },
    { valeur: "10+", label: "Années d'excellence", icon: Award },
    { valeur: "50+", label: "Enseignants", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section avec image */}
      <div className="relative h-[350px] mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        {/* Image de fond */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/slide2.jpg"
            alt="École Internationale des Enfants Futur"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Contenu du Hero */}
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
                À propos de notre école
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-6">
                Découvrez l'histoire, la mission et les valeurs de l'École Internationale des Enfants Futur
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#mission"
                  className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Découvrir notre mission
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

      {/* Mission Section - Côte à côte avec image */}
      <section id="mission" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texte de la mission */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre mission</h2>
              <div className="w-20 h-1 bg-blue-600 mb-6"></div>
              <p className="text-gray-900 text-lg leading-relaxed mb-6">
                Former les leaders de demain en offrant une éducation d'excellence,
                inclusive et innovante, qui développe le plein potentiel de chaque élève
                et les prépare à réussir dans un monde en constante évolution.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-900">Un enseignement personnalisé adapté à chaque élève</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-900">Des infrastructures modernes et sécurisées</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-900">Une équipe pédagogique qualifiée et passionnée</p>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-blue-600 font-medium">
                <span>En savoir plus sur notre pédagogie</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Image */}
            <div className="relative h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/img/slide3.jpg"
                alt="Notre école"
                fill
                className="object-cover hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition">
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm">Notre campus moderne</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre histoire */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-xl order-2 md:order-1">
              <Image
                src="/img/slide5.jpg"
                alt="Histoire de l'école"
                fill
                className="object-cover hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition">
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm">Depuis 2010</p>
                </div>
              </div>
            </div>

            {/* Texte */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre histoire</h2>
              <div className="w-20 h-1 bg-blue-600 mb-6"></div>
              <p className="text-gray-900 text-lg leading-relaxed mb-4">
                Fondée en 2010, l'École Internationale des Enfants Futur est née d'une vision :
                offrir une éducation de qualité accessible à tous, qui prépare les enfants aux défis du monde moderne.
              </p>
              <p className="text-gray-900 text-lg leading-relaxed mb-4">
                Depuis notre création, nous n'avons cessé d'innover et de nous développer,
                pour aujourd'hui accueillir plus de 1200 élèves de la maternelle au lycée.
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-medium mt-4">
                <Calendar className="w-4 h-4" />
                <span>Ouverture en septembre 2010</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre équipe 
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre équipe</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-900 max-w-2xl mx-auto">
              Une équipe passionnée et dévouée à la réussite de vos enfants
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-lg">
                <Image
                  src="/img/slide2.jpg"
                  alt="Directeur"
                  fill
                  className="object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Dr. Jean Diallo</h3>
              <p className="text-blue-600 mb-2">Directeur Général</p>
              <p className="text-gray-900 text-sm">20 ans d'expérience dans l'éducation</p>
            </div>
            <div className="text-center group">
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-lg">
                <Image
                  src="/img/slide3.jpg"
                  alt="Directrice pédagogique"
                  fill
                  className="object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Mme. Fatou Sow</h3>
              <p className="text-blue-600 mb-2">Directrice Pédagogique</p>
              <p className="text-gray-900 text-sm">Experte en innovation éducative</p>
            </div>
            <div className="text-center group">
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-lg">
                <Image
                  src="/img/slide5.jpg"
                  alt="Coordinateur"
                  fill
                  className="object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">M. Mamadou Barry</h3>
              <p className="text-blue-600 mb-2">Coordinateur des programmes</p>
              <p className="text-gray-900 text-sm">Spécialiste en développement pédagogique</p>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos valeurs</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-900 max-w-2xl mx-auto">
              Des principes fondamentaux qui guident notre action au quotidien
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valeurs.map((valeur, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-xl transition group">
                <div className={`w-16 h-16 ${valeur.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition`}>
                  <valeur.icon className={`w-8 h-8 ${valeur.iconColor} group-hover:scale-110 transition`} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{valeur.title}</h3>
                <p className="text-gray-900">{valeur.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Contact */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à rejoindre notre école ?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Inscrivez votre enfant dès maintenant et offrez-lui une éducation d'excellence
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/inscription"
              className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Inscrire mon enfant
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
    </div>
  );
}