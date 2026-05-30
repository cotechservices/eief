// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send, Lock, GraduationCap, BookOpen, LockOpen, Users, Award } from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden">
        <br />
        <Header />
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/img/slide3.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full mx-auto">
          <div className="flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Partie gauche - Texte de pub avec transparence */}
            <div className="lg:w-1/2 bg-black/50 backdrop-blur-md p-8 lg:p-12 flex flex-col justify-center text-white">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold"> Mot de passe oublié ?</span>
                </div>   
              </div>

              {/* Avantages */}
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Réinitialisation rapide</h3>
                    <p className="text-white/80 text-sm">Recevez un lien directement dans votre boîte mail</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Sécurisé</h3>
                    <p className="text-white/80 text-sm">Vos données sont protégées à chaque étape</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Support disponible</h3>
                    <p className="text-white/80 text-sm">Une question ? Contactez notre équipe</p>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="mt-8 pt-8 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-xs text-white/80">Support</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">Rapide</div>
                    <div className="text-xs text-white/80">Réponse sous 5min</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-xs text-white/80">Sécurisé</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partie droite - Formulaire */}
            <div className="lg:w-1/2 bg-white/95 backdrop-blur-sm p-8 lg:p-12">
              {/* Logo mobile */}
              <div className="lg:hidden flex justify-center mb-6">
                <Image
                  src="/img/logo.jpg"
                  alt="Logo E.I.E.F"
                  width={60}
                  height={60}
                  className="rounded-2xl shadow-lg"
                />
              </div>

              {/* Icône */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* En-tête */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-black">
                  Mot de passe oublié ?
                </h1>
                <p className="text-black mt-2">
                  Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {/* Formulaire */}
              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-black mb-2 font-medium">
                      Adresse email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-black border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline text-sm flex items-center justify-center gap-1">
                      <ArrowLeft className="w-4 h-4" />
                      Retour à la connexion
                    </Link>
                  </div>
                </form>
              )}

              {/* Confirmation d'envoi */}
              {submitted && (
                <div className="text-center space-y-6">
                  <div className="bg-green-50 rounded-lg p-6 text-green-700">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <h2 className="font-semibold text-xl mb-2">Email envoyé !</h2>
                    <p className="text-sm">
                      Nous avons envoyé un lien de réinitialisation à <strong className="font-semibold">{email}</strong>.
                    </p>
                    <p className="text-xs mt-4 text-green-600">
                      Vérifiez vos spams si vous ne recevez pas l'email dans les prochaines minutes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleResend}
                      className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      Renvoyer l'email
                    </button>
                    <Link
                      href="/login"
                      className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-center font-medium shadow-lg"
                    >
                      Retour à la connexion
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}