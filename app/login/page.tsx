"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { Mail, Lock, Eye, EyeOff, GraduationCap, BookOpen, Users, Award } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    }
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
            <div className="lg:w-1/2 bg-black/50 backdrop-blur-s p-8 lg:p-12 flex flex-col justify-center text-white">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold">Bienvenue à E.I.E.F</span>
                </div>
              </div>

              {/* Avantages */}
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Excellence Académique</h3>
                    <p className="text-white/80 text-sm">Programme éducatif reconnu internationalement</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Communauté Dynamique</h3>
                    <p className="text-white/80 text-sm">Plus de 2000 élèves et 150 enseignants</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Infrastructures Modernes</h3>
                    <p className="text-white/80 text-sm">Laboratoires, bibliothèque, sports et plus</p>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="mt-8 pt-8 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">20+</div>
                    <div className="text-xs text-white/80">Années d'excellence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2000+</div>
                    <div className="text-xs text-white/80">Élèves</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">98%</div>
                    <div className="text-xs text-white/80">Taux de réussite</div>
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

              {/* Title */}
              <div className="text-center mb-8">
<<<<<<< HEAD
                <h1 className="text-2xl font-bold text-black">
                  Connexion
                </h1>
                <p className="text-black mt-2">
=======
                <h1 className="text-2xl font-bold text-gray-800">
                  Connexion
                </h1>
                <p className="text-gray-500 mt-2">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                  Accédez à votre espace personnel
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
<<<<<<< HEAD
                  <label className="block text-black mb-2 font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
=======
                  <label className="block text-gray-700 mb-2 font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
<<<<<<< HEAD
                      className="w-full pl-10 pr-4 py-3 text-black border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
=======
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
<<<<<<< HEAD
                  <label className="block text-black mb-2 font-medium">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
=======
                  <label className="block text-gray-700 mb-2 font-medium">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
                      className="w-full pl-10 pr-12 py-3 text-black border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
=======
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
<<<<<<< HEAD
                        <EyeOff className="w-5 h-5 text-black hover:text-black" />
                      ) : (
                        <Eye className="w-5 h-5 text-black hover:text-black" />
=======
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="text-right">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
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
                      Connexion...
                    </span>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>

              {/* Register link */}
              <div className="mt-6 text-center">
<<<<<<< HEAD
                <p className="text-black">
=======
                <p className="text-gray-600">
>>>>>>> 7712259007b165b3195b75c2e91ddf9095ff6fd5
                  Pas encore de compte ?{" "}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    Créer un compte
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}