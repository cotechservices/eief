// app/reset-password/[token]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, GraduationCap, BookOpen, Users, Award } from "lucide-react";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    // Simulation de réinitialisation (à remplacer par appel API réel)
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe modifié !</h1>
              <p className="text-gray-500 mb-6">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <Link
                href="/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-center font-medium shadow-lg"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
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
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold">E.I.E.F</span>
                </div>
                <h2 className="text-3xl lg:text-3xl font-bold mb-4">
                  Réinitialisation du mot de passe
                </h2>
                <p className="text-white/90 text-lg mb-8">
                  Sécurisez votre compte avec un nouveau mot de passe
                </p>
              </div>

              {/* Avantages */}
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Sécurité renforcée</h3>
                    <p className="text-white/80 text-sm">Protégez votre compte avec un mot de passe unique</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Accès sécurisé</h3>
                    <p className="text-white/80 text-sm">Reprenez le contrôle de votre compte en toute sécurité</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Assistance disponible</h3>
                    <p className="text-white/80 text-sm">Une question ? Contactez notre support</p>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="mt-8 pt-8 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-xs text-white/80">Support disponible</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-xs text-white/80">Sécurisé</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">Rapide</div>
                    <div className="text-xs text-white/80">Réinitialisation</div>
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
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* En-tête */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">
                  Nouveau mot de passe
                </h1>
                <p className="text-gray-500 mt-2">
                  Choisissez un mot de passe sécurisé pour votre compte
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Password */}
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Minimum 6 caractères"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Retapez votre mot de passe"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Modification...
                    </span>
                  ) : (
                    "Réinitialiser le mot de passe"
                  )}
                </button>

                {/* Login link */}
                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}