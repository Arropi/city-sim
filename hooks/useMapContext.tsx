"use client";

import { buildMapItemsFromCity } from "@/constants/helper";
import { MapItems } from "@/types";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

import type { Map as LeafletMapType } from "leaflet";
import type { BuildingData, CityGrid, CityDetail } from "@/app/map/[slugid]/actions";

export type MapMode = "view" | "build";
export type BuildMode = "renovasi" | "rekonstruksi" | "relokasi" | null;
export type MapLayer = "semua lapisan" | "bangunan" | "drainase";

export interface CategorizedBuildings {
  residential: BuildingData[];
  facilities: BuildingData[];
  dinings: BuildingData[];
  greenSpaces: BuildingData[];
}

export interface MapContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
  stats: MapItems[];
  setStats: React.Dispatch<React.SetStateAction<MapItems[]>>;
  initialStats: MapItems[];
  setInitialStats: React.Dispatch<React.SetStateAction<MapItems[]>>;
  cityStats: CityDetail | null;
  setCityStats: React.Dispatch<React.SetStateAction<CityDetail | null>>;
  cityData: CityDetail | null;
  setCityData: (data: CityDetail | null) => void;
  resetStats: () => void;
  updateStat: (idOrName: string, newValue: number, newDescription?: string) => void;
  renovateBuilding: (buildingId: string) => void;
  reconstructBuilding: (buildingId: string) => void;
  buildMode: BuildMode;
  setBuildMode: (buildMode: BuildMode) => void;
  selectedHouse: BuildingData | null;
  setSelectedHouse: (house: BuildingData | null) => void;
  renovatedHouseIds: Set<string | number>;
  setRenovatedHouseIds: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  reconstructedHouseIds: Set<string | number>;
  setReconstructedHouseIds: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  buildings: BuildingData[];
  setBuildings: React.Dispatch<React.SetStateAction<BuildingData[]>>;
  categorizedBuildings: CategorizedBuildings;
  cityGrids: CityGrid[];
  setCityGrids: (grids: CityGrid[]) => void;
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
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [selectedHouse, setSelectedHouse] = useState<BuildingData | null>(null);
  const [renovatedHouseIds, setRenovatedHouseIds] = useState<Set<string | number>>(new Set());
  const [reconstructedHouseIds, setReconstructedHouseIds] = useState<Set<string | number>>(new Set());
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [cityGrids, setCityGrids] = useState<CityGrid[]>([]);
  const [cityStats, setCityStats] = useState<CityDetail | null>(null);
  const [initialCityStats, setInitialCityStats] = useState<CityDetail | null>(null);
  const [manualStatsOverride, setManualStatsOverride] = useState<MapItems[] | null>(null);
  const [layer, setLayer] = useState<MapLayer>("semua lapisan");
  const [mainMap, setMainMap] = useState<LeafletMapType | null>(null);

  // Nilai MAP_ITEMS (stats) di-memo dan dihitung secara reaktif langsung dari data stats satu kota (cityStats)
  const stats = useMemo(() => {
    if (manualStatsOverride) return manualStatsOverride;
    return buildMapItemsFromCity(cityStats);
  }, [cityStats, manualStatsOverride]);

  const initialStats = useMemo(() => {
    return buildMapItemsFromCity(initialCityStats);
  }, [initialCityStats]);

  const setStats = useCallback<React.Dispatch<React.SetStateAction<MapItems[]>>>(
    (action) => {
      setManualStatsOverride((prev) => {
        const current = prev ?? buildMapItemsFromCity(cityStats);
        return typeof action === "function" ? action(current) : action;
      });
    },
    [cityStats]
  );

  const setInitialStats = useCallback<React.Dispatch<React.SetStateAction<MapItems[]>>>(
    () => {},
    []
  );

  const setCityData = useCallback((data: CityDetail | null) => {
    setCityStats(data);
    setInitialCityStats((prev) => prev ?? data);
    setManualStatsOverride(null);
  }, []);

  const renovateBuilding = useCallback((buildingId: string) => {
    // 1. Ubah data bangunan yang menyimpan isi bangunan (buildings) dengan ID yang sama
    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          return {
            ...b,
            unfit_pct: 0,
            is_safe: true,
            is_rtlh: false,
            status: "Layak Huni",
            condition: "Baik (Hasil Renovasi)",
          };
        }
        return b;
      })
    );

    // 2. Tandai id bangunan yang sudah direnovasi
    setRenovatedHouseIds((prev) => new Set(prev).add(buildingId));

    // 3. Kurangi jumlah RTLH pada cityStats, yang otomatis mentrigger useEffect untuk mengupdate stats (MAP_ITEMS) di sidebar
    setCityStats((prev) => {
      if (!prev) return prev;
      const currentUnfit = Number(prev.unfit_housing_count) || 0;
      return {
        ...prev,
        unfit_housing_count: Math.max(0, currentUnfit - 1),
      };
    });
  }, []);

  const reconstructBuilding = useCallback((buildingId: string) => {
    // 1. Ubah data bangunan yang menyimpan isi bangunan (buildings) dengan ID yang sama
    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          return {
            ...b,
            unfit_pct: 0,
            is_safe: true,
            is_rtlh: false,
            status: "Layak Huni Modern",
            condition: "Sangat Baik (Hasil Rekonstruksi)",
            building_levels: (b.building_levels || 1) + 1,
          };
        }
        return b;
      })
    );

    // 2. Tandai id bangunan yang sudah direkonstruksi
    setReconstructedHouseIds((prev) => new Set(prev).add(buildingId));

    // 3. Kurangi jumlah RTLH pada cityStats dan tambah kepadatan vertikal,
    // yang otomatis mentrigger useEffect untuk memperbarui MAP_ITEMS di sidebar
    setCityStats((prev) => {
      if (!prev) return prev;
      const currentUnfit = Number(prev.unfit_housing_count) || 0;
      const nextUnfit = Math.max(0, currentUnfit - 1);
      const currentFloor = Number(prev.total_building_floor) || 96495;
      const totalBld = Number(prev.total_building_count) || 73218;
      const nextFloor = currentFloor + 1;
      const nextVert = Number((nextFloor / totalBld).toFixed(2));
      return {
        ...prev,
        unfit_housing_count: nextUnfit,
        total_building_floor: nextFloor,
        vertical_building_density: nextVert,
      };
    });
  }, []);

  const resetStats = useCallback(() => {
    if (initialCityStats) {
      setCityStats(initialCityStats);
    }
    setManualStatsOverride(null);
    setRenovatedHouseIds(new Set());
    setReconstructedHouseIds(new Set());
  }, [initialCityStats]);

  const updateStat = useCallback((idOrName: string, newValue: number, newDescription?: string) => {
    setStats((prevStats) =>
      prevStats.map((item) => {
        const match =
          (item.id && item.id.toLowerCase() === idOrName.toLowerCase()) ||
          item.name.toLowerCase().includes(idOrName.toLowerCase());
        if (match) {
          return {
            ...item,
            data: {
              ...item.data,
              value: newValue,
            },
            ...(newDescription ? { description: newDescription } : {}),
          };
        }
        return item;
      })
    );
  }, [setStats]);

  const categorizedBuildings = useMemo<CategorizedBuildings>(() => {
    const residential: BuildingData[] = [];
    const facilities: BuildingData[] = [];
    const dinings: BuildingData[] = [];
    const greenSpaces: BuildingData[] = [];

    buildings.forEach((b) => {
      const type = (b.type_id || b.type_name || "").toLowerCase();
      if (type.includes("facilit") || type.includes("umum")) {
        facilities.push(b);
      } else if (
        type.includes("din") ||
        type.includes("makan") ||
        type.includes("resto") ||
        type.includes("kuliner") ||
        type.includes("cafe")
      ) {
        dinings.push(b);
      } else if (
        type.includes("green") ||
        type.includes("taman") ||
        type.includes("hijau") ||
        type.includes("rth")
      ) {
        greenSpaces.push(b);
      } else {
        residential.push(b);
      }
    });

    return { residential, facilities, dinings, greenSpaces };
  }, [buildings]);

  const flyTo = useCallback(
    (coords: [number, number], zoom?: number) => {
      if (mainMap) {
        mainMap.flyTo(coords, zoom ?? mainMap.getZoom(), {
          duration: 1.5,
        });
      }
    },
    [mainMap]
  );

  return (
    <MapContext.Provider
      value={{
        mode,
        setMode,
        stats,
        setStats,
        initialStats,
        setInitialStats,
        resetStats,
        updateStat,
        cityStats,
        setCityStats,
        cityData: cityStats,
        setCityData,
        renovateBuilding,
        reconstructBuilding,
        buildMode,
        setBuildMode,
        selectedHouse,
        setSelectedHouse,
        renovatedHouseIds,
        setRenovatedHouseIds,
        reconstructedHouseIds,
        setReconstructedHouseIds,
        buildings,
        setBuildings,
        categorizedBuildings,
        cityGrids,
        setCityGrids,
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
