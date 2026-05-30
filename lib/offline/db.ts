import { openDB, IDBPDatabase } from "idb";

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
    value: {
      id: string;
      type: string;
      data: any;
      retryCount: number;
    };
  };
}

let db: IDBPDatabase<OfflineDB>;

export async function initOfflineDB() {
  db = await openDB<OfflineDB>("ecole-futur-offline", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("presences")) {
        db.createObjectStore("presences", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        const store = db.createObjectStore("syncQueue", { keyPath: "id" });
        store.createIndex("by-type", "type");
      }
    },
  });
  return db;
}

export async function addToSyncQueue(type: string, data: any) {
  const db = await initOfflineDB();
  await db.add("syncQueue", {
    id: crypto.randomUUID(),
    type,
    data,
    retryCount: 0,
  });
}

export async function syncOfflineData() {
  if (!navigator.onLine) return;

  const db = await initOfflineDB();
  const queue = await db.getAll("syncQueue");

  for (const item of queue) {
    try {
      const response = await fetch(`/api/sync/${item.type}`, {
        method: "POST",
        body: JSON.stringify(item.data),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await db.delete("syncQueue", item.id);
      } else if (item.retryCount >= 3) {
        await db.delete("syncQueue", item.id);
      } else {
        await db.put("syncQueue", { ...item, retryCount: item.retryCount + 1 });
      }
    } catch (error) {
      console.error("Sync error", error);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineData();
  });
}