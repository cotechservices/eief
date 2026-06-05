// app/register/page.tsx
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegisterForm from "./RegisterForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section avec image de fond */}
      <div className="relative h-[350px] mt-16 overflow-hidden">
        {/* Image de fond */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/slide3.jpg"
            alt="Bibliothèque numérique"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-black/50 z-10" />

        {/* Contenu */}
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Pré-inscription</h1>
            <p className="text-lg">
              Inscription pour l'année scolaire en cours
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-900">Chargement du formulaire...</p>
            </div>
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}