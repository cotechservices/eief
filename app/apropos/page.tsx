// app/apropos/page.tsx
"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GraduationCap, Users, Award, Clock, Target, Heart, Globe, BookOpen, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function AproposPage() {
  const valeurs = [
    { icon: Heart, title: "Bienveillance", description: "Un environnement respectueux et bienveillant" },
    { icon: Target, title: "Excellence", description: "La recherche constante de la qualité" },
    { icon: Globe, title: "Ouverture", description: "Une éducation tournée vers le monde" },
    { icon: BookOpen, title: "Innovation", description: "Des méthodes pédagogiques modernes" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[300px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">À propos de notre école</h1>
            <p className="text-xl max-w-2xl">
              Découvrez l'histoire, la mission et les valeurs de l'École Internationale des Enfants Futur
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section - Côte à côte avec image */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texte de la mission */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre mission</h2>
              <div className="w-20 h-1 bg-blue-600 mb-6"></div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Former les leaders de demain en offrant une éducation d'excellence,
                inclusive et innovante, qui développe le plein potentiel de chaque élève
                et les prépare à réussir dans un monde en constante évolution.
              </p>
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <span>En savoir plus sur notre pédagogie</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            
            {/* Image */}
            <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/img/slide3.jpg"
                alt="Notre école"
                fill
                className="object-cover hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>
      </section>

    {/* Notre histoire */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative h-[300px] md:h-[350px] rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <Image
                src="/img/slide3.jpg"
                alt="Histoire de l'école"
                fill
                className="object-cover hover:scale-105 transition duration-500"
              />
            </div>
            
            {/* Texte */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre histoire</h2>
              <div className="w-20 h-1 bg-blue-600 mb-6"></div>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Fondée en 2010, l'École Internationale des Enfants Futur est née d'une vision : 
                offrir une éducation de qualité accessible à tous, qui prépare les enfants aux défis du monde moderne.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Depuis notre création, nous n'avons cessé d'innover et de nous développer,
                pour aujourd'hui accueillir plus de 1200 élèves de la maternelle au lycée.
              </p>
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
            <p className="text-gray-600 max-w-2xl mx-auto">
              Des principes fondamentaux qui guident notre action au quotidien
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valeurs.map((valeur, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition group">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
                  <valeur.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{valeur.title}</h3>
                <p className="text-gray-600">{valeur.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}