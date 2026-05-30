// app/register/page.tsx
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[250px] bg-gradient-to-r from-blue-900 to-blue-700 mt-16">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Pré-inscription</h1>
            <p className="text-lg">
              Inscription pour l'année scolaire 2025-2026
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement du formulaire...</p>
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