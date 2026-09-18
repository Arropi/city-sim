import type { BuildingData, UndergroundNetworkData } from "@/types";
import type { CityDetail } from "@/app/map/[slugid]/actions";

export interface SimulationProgress {
  cityId: string;
  lastSaved: number;
  cityStats: CityDetail;
  addedBuildings: BuildingData[];
  addedDrainase: UndergroundNetworkData[];
  modifiedBuildings: Record<string, Partial<BuildingData>>;
  relocatedHouseIds: string[];
  renovatedHouseIds: string[];
  reconstructedHouseIds: string[];
}

const DB_NAME = "city_simulation_db";
const STORE_NAME = "city_progress";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment."));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "cityId" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Menyimpan progress simulasi kota secara asinkron ke IndexedDB (background, non-blocking).
 */
export async function saveSimulationProgress(
  cityId: string,
  progress: Omit<SimulationProgress, "cityId" | "lastSaved">
): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record: SimulationProgress = {
        cityId,
        lastSaved: Date.now(),
        ...progress,
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn("Error saving simulation progress to IndexedDB:", request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("Could not save to IndexedDB:", err);
  }
}

/**
 * Memuat progress simulasi kota dari IndexedDB.
 */
export async function loadSimulationProgress(
  cityId: string
): Promise<SimulationProgress | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(cityId);

      request.onsuccess = () => {
        resolve((request.result as SimulationProgress) || null);
      };

      request.onerror = () => {
        console.warn("Error loading simulation progress from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("Could not load from IndexedDB:", err);
    return null;
  }
}

/**
 * Menghapus progress simulasi kota dari IndexedDB saat reset.
 */
export async function clearSimulationProgress(cityId: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(cityId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn("Error deleting simulation progress from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("Could not clear IndexedDB:", err);
  }
}
