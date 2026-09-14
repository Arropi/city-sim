"use client";

import { MAP_ITEMS } from "@/constants/helper";
import { MapItems } from "@/types";
import { createContext, useContext, useState, ReactNode } from "react";

import type { Map as LeafletMapType } from "leaflet";

export type MapMode = "view" | "build";
export type BuildMode = "renovasi" | "rekonstruksi" | "relokasi"
export type MapLayer = "semua lapisan" | "bangunan" | "drainase"

export interface MapContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  stats: MapItems[];
  setStats: (stats: MapItems[]) => void;
  buildMode: BuildMode;
  setBuildMode: (buildMode: BuildMode) => void;
  layer: MapLayer;
  setLayer: (layer: MapLayer) => void;
  mainMap: LeafletMapType | null;
  setMainMap: (map: LeafletMapType | null) => void;
  flyTo: (coords: [number, number], zoom?: number) => void;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export function useMapContext(): MapContextType {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapContextProvider / MapProvider");
  }
  return context;
}

export function MapProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MapMode>("view");
  const [buildMode, setBuildMode] = useState<BuildMode>("renovasi");
  const [stats, setStats] = useState<MapItems[]>(MAP_ITEMS);
  const [layer, setLayer] = useState<MapLayer>("semua lapisan");
  const [mainMap, setMainMap] = useState<LeafletMapType | null>(null);

  const flyTo = (coords: [number, number], zoom?: number) => {
    if (mainMap) {
      mainMap.flyTo(coords, zoom ?? mainMap.getZoom(), {
        duration: 1.5,
      });
    }
  };

  return (
    <MapContext.Provider
      value={{
        mode,
        setMode,
        stats,
        setStats,
        buildMode,
        setBuildMode,
        layer,
        setLayer,
        mainMap,
        setMainMap,
        flyTo,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const MapContextProvider = MapProvider;
