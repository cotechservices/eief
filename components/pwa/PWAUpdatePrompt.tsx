"use client";

import { useEffect, useState } from "react";

export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && registration.waiting) {
                setWaitingWorker(registration.waiting);
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setShowUpdate(false);
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50">
      <div className="bg-yellow-50 rounded-lg shadow-xl border border-yellow-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">🔄</div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800">
              Nouvelle version disponible
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Une mise à jour est disponible. Veuillez rafraîchir pour profiter
              des nouvelles fonctionnalités.
            </p>
            <button
              onClick={handleUpdate}
              className="mt-3 bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-yellow-700"
            >
              Mettre à jour maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}