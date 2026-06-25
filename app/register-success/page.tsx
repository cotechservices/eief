// app/register-success/page.tsx
"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function RegisterSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardUrl, setDashboardUrl] = useState("/");
  const [countdown, setCountdown] = useState(5);
  const isMounted = useRef(true);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Nettoyage du composant
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      
      const roleUrls: { [key: string]: string } = {
        'SUPER_ADMIN': '/dashboard/admin',
        'DIRECTEUR_GENERAL': '/dashboard/directeur',
        'DIRECTEUR_ETUDES': '/dashboard/directeur-etudes',
        'COMPTABLE': '/dashboard/comptable',
        'SECRETARIAT': '/dashboard/secretariat',
        'SURVEILLANT': '/dashboard/surveillant',
        'ENSEIGNANT': '/dashboard/enseignant',
        'PARENT': '/dashboard/parent',
        'ELEVE': '/dashboard/eleve'
      };
      
      const url = roleUrls[role] || '/';
      setDashboardUrl(url);
      
      // Nettoyer l'ancien timeout s'il existe
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }

      // Redirection après 5 secondes avec setTimeout
      let seconds = 5;
      
      const updateCountdown = () => {
        seconds -= 1;
        setCountdown(seconds);
        
        if (seconds <= 0) {
          // Nettoyer le timeout avant la redirection
          if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = null;
          }
          // Rediriger seulement si le composant est monté
          if (isMounted.current) {
            router.push(url);
          }
        } else {
          // Planifier la prochaine mise à jour
          redirectTimeoutRef.current = setTimeout(updateCountdown, 1000);
        }
      };
      
      // Démarrer le compte à rebours après un court délai
      redirectTimeoutRef.current = setTimeout(updateCountdown, 1000);
      
      return () => {
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = null;
        }
      };
    } else if (status === "unauthenticated") {
      setDashboardUrl("/");
    }
  }, [session, status, router]);

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'SUPER_ADMIN': 'Administrateur',
      'DIRECTEUR_GENERAL': 'Directeur Général',
      'DIRECTEUR_ETUDES': 'Directeur des Études',
      'COMPTABLE': 'Comptable',
      'SECRETARIAT': 'Secrétariat',
      'SURVEILLANT': 'Surveillant',
      'ENSEIGNANT': 'Enseignant',
      'PARENT': 'Parent',
      'ELEVE': 'Élève'
    };
    return labels[role] || role;
  };

  const handleRedirect = () => {
    // Nettoyer le timeout si l'utilisateur clique manuellement
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    router.push(dashboardUrl);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Chargement...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
          <p className="text-gray-900 mb-6">
            Votre demande a été enregistrée avec succès. Vous recevrez un email de confirmation dans les plus brefs délais.
          </p>
          
          {session?.user && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-700">
                Redirection vers votre dashboard dans {countdown} secondes...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {session.user.name || session.user.email} • {getRoleLabel((session.user as any).role)}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Fermer
            </Link>
            
            {session?.user ? (
              <button
                onClick={handleRedirect}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                📊 Aller au Dashboard
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Se connecter
              </Link>
            )}
          </div>

          {session?.user && (
            <p className="text-xs text-gray-500 mt-4">
              Connecté en tant que {session.user.name || session.user.email} 
              <span className="ml-1 text-blue-600">
                ({getRoleLabel((session.user as any).role)})
              </span>
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}