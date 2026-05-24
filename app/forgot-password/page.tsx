// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulation d'envoi (à remplacer par appel API réel)
    setTimeout(() => {
      if (email && email.includes("@")) {
        setSubmitted(true);
        setShowForm(false);
      } else {
        setError("Veuillez entrer une adresse email valide");
      }
      setLoading(false);
    }, 1500);
  };

  const handleResend = () => {
    setShowForm(true);
    setSubmitted(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-20 pb-10">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          {/* Logo / Icône */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* En-tête */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
            <p className="text-gray-500 mt-2">
              Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Formulaire */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="votre@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le lien
                  </>
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-blue-600 hover:underline text-sm flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}

          {/* Confirmation d'envoi */}
          {submitted && (
            <div className="text-center space-y-6">
              <div className="bg-green-50 rounded-lg p-4 text-green-700">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h2 className="font-semibold text-lg">Email envoyé !</h2>
                <p className="text-sm mt-2">
                  Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
                </p>
                <p className="text-xs mt-4 text-green-600">
                  Vérifiez vos spams si vous ne recevez pas l'email dans les prochaines minutes.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResend}
                  className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  Renvoyer l'email
                </button>
                <Link
                  href="/login"
                  className="block w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-center"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}