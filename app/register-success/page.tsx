// app/register-success/page.tsx
"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-32 text-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pré-inscription envoyée !
          </h1>
          <p className="text-gray-600 mb-6">
            Votre demande a été enregistrée avec succès. Vous recevrez un email de confirmation dans les plus brefs délais.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}