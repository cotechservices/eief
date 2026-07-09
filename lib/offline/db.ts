import { openDB, IDBPDatabase } from "idb";

export interface SyncItem {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
}

interface OfflineDB {
  presences: {
    key: string;
    value: {
      id: string;
      eleveId: number;
      classeId: number;
      date: string;
      statut: string;
      synced: boolean;
    };
  };
  syncQueue: {
    key: string;
    value: SyncItem;
  };
}

let db: IDBPDatabase<OfflineDB>;

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export async function initOfflineDB() {
  if (db) return db;
  db = await openDB<OfflineDB>("ecole-futur-offline", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("presences")) {
        db.createObjectStore("presences", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id" });
      }
    },
  });
  return db;
}

export async function addToSyncQueue(
  url: string,
  method: string,
  body?: string,
  headers?: Record<string, string>
) {
  const db = await initOfflineDB();
  const item: SyncItem = {
    id: generateUUID(),
    url,
    method,
    headers,
    body,
    timestamp: Date.now(),
    retryCount: 0,
  };
  await db.add("syncQueue", item);
  return item;
}

export async function getPendingSyncItems(urlPrefix: string): Promise<SyncItem[]> {
  const db = await initOfflineDB();
  const queue = await db.getAll("syncQueue");
  // Filtrer par préfixe d'URL (utile car les URLs peuvent contenir des query strings)
  return queue.filter(item => item.url.startsWith(urlPrefix)).sort((a, b) => a.timestamp - b.timestamp);
}

export async function syncOfflineData(
  onItemSynced?: (item: SyncItem, success: boolean) => void
) {
  if (typeof navigator === "undefined" || !navigator.onLine) return;

  const db = await initOfflineDB();
  const queue = await db.getAll("syncQueue");

  if (queue.length === 0) return;

  // Sort by timestamp to preserve execution order
  queue.sort((a, b) => a.timestamp - b.timestamp);

  for (const item of queue) {
    try {
      // Replay the request
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          ...item.headers,
          "X-Offline-Synced": "true",
        },
        body: item.body,
      });

      if (response.ok) {
        await db.delete("syncQueue", item.id);
        if (onItemSynced) onItemSynced(item, true);
      } else {
        console.warn(`Sync failed for request ${item.url} with status ${response.status}`);
        if (item.retryCount >= 3) {
          // Drop item after 3 failed retries
          await db.delete("syncQueue", item.id);
          if (onItemSynced) onItemSynced(item, false);
        } else {
          await db.put("syncQueue", {
            ...item,
            retryCount: item.retryCount + 1,
          });
        }
      }
    } catch (error) {
      console.error(`Sync network error for request ${item.url}`, error);
      // Stop the queue replay if there's a network error during sync
      break;
    }
  }
}