"use client";

import { useEffect, useState, useCallback } from "react";
import { initOfflineDB, addToSyncQueue, syncOfflineData, SyncItem } from "@/lib/offline/db";
import { WifiOff, Wifi, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
}

export function OfflineManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const addToast = useCallback((message: string, type: "info" | "success" | "warning" = "info") => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const handleSync = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      setIsSyncing(true);
      let syncedCount = 0;
      let failedCount = 0;

      try {
        await syncOfflineData((item, success) => {
          if (success) {
            syncedCount++;
          } else {
            failedCount++;
          }
        });

        if (syncedCount > 0) {
          addToast(
            `Synchronisation réussie : ${syncedCount} modification(s) enregistrée(s) avec succès !`,
            "success"
          );
        }
        if (failedCount > 0) {
          addToast(
            `Échec de synchronisation pour ${failedCount} modification(s). Les données seront conservées pour un nouvel essai.`,
            "warning"
          );
        }
      } catch (err) {
        console.error("Error during syncOfflineData", err);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize database
    initOfflineDB().catch(err => console.error("Could not init IndexedDB", err));

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      addToast("Connexion Internet rétablie. Lancement de la synchronisation...", "success");
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast("Connexion Internet perdue. Passage en mode hors connexion.", "warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Run sync on mount if online
    if (navigator.onLine) {
      handleSync();
    }

    // Intercept window.fetch
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input instanceof Request) {
        url = input.url;
      }

      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const isApiRequest = url.startsWith("/api/") || url.includes(window.location.origin + "/api/");
      const isMutation = ["POST", "PUT", "DELETE"].includes(method);

      if (isApiRequest && isMutation) {
        // Parse headers
        const headers: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else {
            Object.assign(headers, init.headers);
          }
        }

        // Parse body
        let bodyStr: string | undefined;
        if (init?.body) {
          if (typeof init.body === "string") {
            bodyStr = init.body;
          } else if (init.body instanceof URLSearchParams) {
            bodyStr = init.body.toString();
          } else if (init.body instanceof Blob) {
            bodyStr = await init.body.text();
          } else if (init.body instanceof FormData) {
            const obj: Record<string, any> = {};
            init.body.forEach((value, key) => {
              obj[key] = value;
            });
            bodyStr = JSON.stringify(obj);
          } else {
            bodyStr = String(init.body);
          }
        }

        // Queue request if offline
        if (!navigator.onLine) {
          console.log(`[OfflineManager] Navigator is offline, queueing ${method} ${url}`);
          const item = await addToSyncQueue(url, method, bodyStr, headers);
          
          if ((window as any).showOfflineToast) {
            (window as any).showOfflineToast(
              `Mode hors ligne : Modification enregistrée localement. Elle sera synchronisée au retour de la connexion.`,
              "info"
            );
          }

          const mockResponseData = {
            success: true,
            offline: true,
            queuedId: item.id,
            message: "Enregistré hors ligne"
          };

          return new Response(JSON.stringify(mockResponseData), {
            status: 200,
            statusText: "OK",
            headers: { "Content-Type": "application/json" }
          });
        }

        // Try original fetch, fallback to queue if network error occurs
        try {
          const res = await originalFetch(input, init);
          return res;
        } catch (err) {
          console.warn(`[OfflineManager] Network error during fetch, queueing ${method} ${url}`, err);
          const item = await addToSyncQueue(url, method, bodyStr, headers);
          
          if ((window as any).showOfflineToast) {
            (window as any).showOfflineToast(
              `Erreur réseau : Action mise en attente pour synchronisation ultérieure.`,
              "info"
            );
          }

          const mockResponseData = {
            success: true,
            offline: true,
            queuedId: item.id,
            message: "Enregistré hors ligne suite à une erreur réseau"
          };

          return new Response(JSON.stringify(mockResponseData), {
            status: 200,
            statusText: "OK",
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return originalFetch(input, init);
    };

    // Register toast callback globally for fetch interceptor
    (window as any).showOfflineToast = addToast;

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.fetch = originalFetch;
      delete (window as any).showOfflineToast;
    };
  }, [addToast, handleSync]);

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-start gap-3 border transition-all duration-300 transform translate-y-0 animate-fade-in ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {toast.type === "info" && <WifiOff className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Offline Banner & Sync Status */}
      {!isOnline && (
        <div className="fixed top-16 left-0 right-0 z-[9999] bg-rose-600 text-white text-xs sm:text-sm py-2 px-4 shadow-md flex items-center justify-center gap-2 font-semibold select-none animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>Vous êtes actuellement hors connexion. Mode hors ligne activé.</span>
        </div>
      )}

      {isSyncing && (
        <div className="fixed bottom-4 left-4 z-[9999] bg-slate-900/90 text-white text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 font-medium backdrop-blur-sm select-none">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Synchronisation des modifications...</span>
        </div>
      )}
    </>
  );
}
