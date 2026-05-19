"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Vous êtes reconnecté !
          </h1>
          <p className="text-gray-600 mb-4">
            La connexion Internet a été rétablie.
          </p>
          <Link
            href="/dashboard"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <div className="text-6xl mb-4">📴</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Vous êtes hors ligne
        </h1>
        <p className="text-gray-600 mb-6">
          Certaines fonctionnalités sont limitées. Les données que vous modifiez
          seront synchronisées automatiquement lorsque la connexion sera rétablie.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
          <h2 className="font-semibold text-blue-800 mb-2">
            Fonctionnalités disponibles hors ligne :
          </h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Consultation des cours téléchargés</li>
            <li>✅ Consultation de l'emploi du temps</li>
            <li>✅ Soumission de devoirs (envoyés automatiquement plus tard)</li>
            <li>✅ Consultation des notes déjà chargées</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Accéder au tableau de bord
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="block w-full text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100"
          >
            Réessayer la connexion
          </button>
        </div>
      </div>
    </div>
  );
}