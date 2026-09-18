"use client";

import { buildMapItemsFromCity, BUILDING_TYPE, isDrainaseType, DEFAULT_CITY_DETAIL } from "@/constants/helper";
import {
  MapItems,
  ResidentialBuilding,
  NonResidentialBuilding,
  CategorizedBuildings,
  BuildingData,
  UndergroundNetworkData,
  RiverData,
} from "@/types";
import {
  evaluateResidentialWaterService,
  calculateRenovationUnfit,
  getBuildingCentroid,
  getSinglePolygonPoints,
  translatePolygon,
  checkBuildingOverlap,
  checkRiverProximity,
  checkTpaProximity,
  calculatePolygonAreaM2,
} from "@/lib/spatial-utils";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";

import type { Map as LeafletMapType } from "leaflet";
import type { CityGrid, CityDetail } from "@/app/map/[slugid]/actions";
import {
  saveSimulationProgress,
  loadSimulationProgress,
  clearSimulationProgress,
} from "@/lib/storage/simulation-db";

export type MapMode = "view" | "build";
export type BuildMode = "renovasi" | "pembangunan" | "rekonstruksi" | "relokasi" | null;
export type MapLayer = "semua lapisan" | "bangunan" | "drainase";

export interface RelocationRequirementStatus {
  hasTarget: boolean;
  isOverlap: boolean;
  overlappingBuildingName?: string | null;
  isNearRiver: boolean; // <= 3 meter dari bibir sungai/kali
  riverDistance?: number | null;
  isNearTpa: boolean; // sangat dekat TPA
  tpaDistance?: number | null;
  canRelocate: boolean; // !isOverlap
  notes: string[];
}

export interface PembangunanRequirementStatus {
  hasMinPoints: boolean;
  isOverlap: boolean;
  overlappingBuildingName?: string | null;
  isNearRiver: boolean;
  riverDistance?: number | null;
  isNearTpa: boolean;
  tpaDistance?: number | null;
  canBuild: boolean;
  notes: string[];
}

export type { CategorizedBuildings, RiverData };

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
  relocationTarget: [number, number] | null;
  setRelocationTarget: (target: [number, number] | null) => void;
  relocationStatus: RelocationRequirementStatus;
  setRelocationStatus: React.Dispatch<React.SetStateAction<RelocationRequirementStatus>>;
  relocatedHouseIds: Set<string | number>;
  setRelocatedHouseIds: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  relocateBuilding: (buildingId: string, targetCoords: [number, number]) => boolean;
  renovatedHouseIds: Set<string | number>;
  setRenovatedHouseIds: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  reconstructedHouseIds: Set<string | number>;
  setReconstructedHouseIds: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  buildings: BuildingData[];
  setBuildings: React.Dispatch<React.SetStateAction<BuildingData[]>>;
  categorizedBuildings: CategorizedBuildings;
  cityGrids: CityGrid[];
  setCityGrids: (grids: CityGrid[]) => void;
  drainase: UndergroundNetworkData[];
  setDrainase: (drainase: UndergroundNetworkData[]) => void;
  rivers: RiverData[];
  setRivers: (rivers: RiverData[]) => void;
  layer: MapLayer;
  setLayer: (layer: MapLayer) => void;
  mainMap: LeafletMapType | null;
  setMainMap: (map: LeafletMapType | null) => void;
  flyTo: (coords: [number, number], zoom?: number) => void;
  selectedBuildType: string;
  setSelectedBuildType: (type: string) => void;
  buildingFloors: number;
  setBuildingFloors: (floors: number) => void;
  newBuildingPoints: [number, number][];
  setNewBuildingPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
  addBuildingPoint: (pt: [number, number]) => void;
  removeLastBuildingPoint: () => void;
  resetNewBuildingPoints: () => void;
  createNewBuilding: () => BuildingData | UndergroundNetworkData | null;
  pembangunanStatus: PembangunanRequirementStatus;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export function useMapContext(): MapContextType {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapContextProvider / MapProvider");
  }
  return context;
}

const initialRelocationStatus: RelocationRequirementStatus = {
  hasTarget: false,
  isOverlap: false,
  overlappingBuildingName: null,
  isNearRiver: false,
  riverDistance: null,
  isNearTpa: false,
  tpaDistance: null,
  canRelocate: false,
  notes: [],
};

export function MapProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MapMode>("view");
  const [buildMode, setBuildMode] = useState<BuildMode>(null);
  const [selectedHouse, setSelectedHouse] = useState<BuildingData | null>(null);
  const [relocationTarget, setRelocationTarget] = useState<[number, number] | null>(null);
  const [relocationStatus, setRelocationStatus] = useState<RelocationRequirementStatus>(initialRelocationStatus);
  const [relocatedHouseIds, setRelocatedHouseIds] = useState<Set<string | number>>(new Set());
  const [renovatedHouseIds, setRenovatedHouseIds] = useState<Set<string | number>>(new Set());
  const [reconstructedHouseIds, setReconstructedHouseIds] = useState<Set<string | number>>(new Set());
  const [selectedBuildType, _setSelectedBuildType] = useState<string>("rumah");
  const [buildingFloors, setBuildingFloors] = useState<number>(1);
  const [newBuildingPoints, setNewBuildingPoints] = useState<[number, number][]>([]);

  const setSelectedBuildType = useCallback((type: string) => {
    _setSelectedBuildType((prev) => {
      if (prev !== type) {
        setNewBuildingPoints([]);
      }
      return type;
    });
  }, []);
  const [buildings, _setBuildings] = useState<BuildingData[]>([]);
  const [cityGrids, setCityGrids] = useState<CityGrid[]>([]);
  const [drainase, setDrainaseState] = useState<UndergroundNetworkData[]>([]);
  const [rivers, setRiversState] = useState<RiverData[]>([]);
  const [cityStats, setCityStats] = useState<CityDetail | null>(DEFAULT_CITY_DETAIL);
  const [initialCityStats, setInitialCityStats] = useState<CityDetail | null>(DEFAULT_CITY_DETAIL);
  const [manualStatsOverride, setManualStatsOverride] = useState<MapItems[] | null>(null);
  const [layer, setLayer] = useState<MapLayer>("semua lapisan");
  const [mainMap, setMainMap] = useState<LeafletMapType | null>(null);

  // Delta Storage Refs for IndexedDB (Background & Non-blocking)
  const addedBuildingsRef = useRef<BuildingData[]>([]);
  const addedDrainaseRef = useRef<UndergroundNetworkData[]>([]);
  const modifiedBuildingsRef = useRef<Record<string, Partial<BuildingData>>>({});
  const relocatedHouseIdsRef = useRef<Set<string | number>>(relocatedHouseIds);
  const renovatedHouseIdsRef = useRef<Set<string | number>>(renovatedHouseIds);
  const reconstructedHouseIdsRef = useRef<Set<string | number>>(reconstructedHouseIds);
  const cityStatsRef = useRef<CityDetail | null>(cityStats);
  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHydratedRef = useRef<boolean>(false);

  useEffect(() => {
    relocatedHouseIdsRef.current = relocatedHouseIds;
    renovatedHouseIdsRef.current = renovatedHouseIds;
    reconstructedHouseIdsRef.current = reconstructedHouseIds;
    cityStatsRef.current = cityStats;
  }, [relocatedHouseIds, renovatedHouseIds, reconstructedHouseIds, cityStats]);

  // Auto-Save Trigger to IndexedDB with 400ms Debounce
  const triggerAutoSave = useCallback((overrideStats?: CityDetail) => {
    if (saveDebounceTimerRef.current) {
      clearTimeout(saveDebounceTimerRef.current);
    }
    saveDebounceTimerRef.current = setTimeout(() => {
      const statsToSave = overrideStats || cityStatsRef.current || DEFAULT_CITY_DETAIL;
      const cityKey = (statsToSave.id || "madiun") as string;

      saveSimulationProgress(cityKey, {
        cityStats: statsToSave,
        addedBuildings: addedBuildingsRef.current,
        addedDrainase: addedDrainaseRef.current,
        modifiedBuildings: modifiedBuildingsRef.current,
        relocatedHouseIds: Array.from(relocatedHouseIdsRef.current).map(String),
        renovatedHouseIds: Array.from(renovatedHouseIdsRef.current).map(String),
        reconstructedHouseIds: Array.from(reconstructedHouseIdsRef.current).map(String),
      });
    }, 400);
  }, []);

  // Helper to apply loaded simulation progress
  const applySimulationProgress = useCallback(
    (saved: NonNullable<Awaited<ReturnType<typeof loadSimulationProgress>>>) => {
      if (saved.cityStats) {
        setCityStats(saved.cityStats);
        cityStatsRef.current = saved.cityStats;
      }
      if (saved.relocatedHouseIds) {
        const relSet = new Set<string | number>(saved.relocatedHouseIds);
        setRelocatedHouseIds(relSet);
        relocatedHouseIdsRef.current = relSet;
      }
      if (saved.renovatedHouseIds) {
        const renSet = new Set<string | number>(saved.renovatedHouseIds);
        setRenovatedHouseIds(renSet);
        renovatedHouseIdsRef.current = renSet;
      }
      if (saved.reconstructedHouseIds) {
        const recSet = new Set<string | number>(saved.reconstructedHouseIds);
        setReconstructedHouseIds(recSet);
        reconstructedHouseIdsRef.current = recSet;
      }
      if (saved.addedBuildings && saved.addedBuildings.length > 0) {
        addedBuildingsRef.current = saved.addedBuildings;
        _setBuildings((prev) => {
          const existingIds = new Set(prev.map((b) => String(b.id)));
          const toAdd = saved.addedBuildings.filter((b) => !existingIds.has(String(b.id)));
          return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
        });
      }
      if (saved.addedDrainase && saved.addedDrainase.length > 0) {
        addedDrainaseRef.current = saved.addedDrainase;
        setDrainaseState((prev) => {
          const existingIds = new Set(prev.map((d) => String(d.id)));
          const toAdd = saved.addedDrainase.filter((d) => !existingIds.has(String(d.id)));
          return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
        });
      }
      if (saved.modifiedBuildings) {
        modifiedBuildingsRef.current = saved.modifiedBuildings;
        _setBuildings((prev) =>
          prev.map((b) => {
            const mod = saved.modifiedBuildings[String(b.id)];
            if (mod) {
              return { ...b, ...mod };
            }
            return b;
          })
        );
      }
    },
    []
  );

  // Initial load from IndexedDB on component mount
  useEffect(() => {
    if (isHydratedRef.current) return;
    const cityKey = (cityStats?.id || "madiun") as string;
    loadSimulationProgress(cityKey).then((saved) => {
      if (saved) {
        applySimulationProgress(saved);
      }
      isHydratedRef.current = true;
    });
  }, [cityStats?.id, applySimulationProgress]);

  // Wrapper setBuildings to automatically maintain user modifications and added buildings
  const setBuildings = useCallback<React.Dispatch<React.SetStateAction<BuildingData[]>>>(
    (action) => {
      _setBuildings((prev) => {
        const nextRaw = typeof action === "function" ? action(prev) : action;
        const modifiedMap = modifiedBuildingsRef.current;
        const added = addedBuildingsRef.current;

        const updated = nextRaw.map((b) => {
          const mod = modifiedMap[String(b.id)];
          if (mod) {
            return { ...b, ...mod };
          }
          return b;
        });

        if (added.length > 0) {
          const updatedIds = new Set(updated.map((b) => String(b.id)));
          const missingAdded = added.filter((b) => !updatedIds.has(String(b.id)));
          return missingAdded.length > 0 ? [...missingAdded, ...updated] : updated;
        }

        return updated;
      });
    },
    []
  );

  const setDrainase = useCallback((data: UndergroundNetworkData[]) => {
    const initialData = data || [];
    setDrainaseState(() => {
      const added = addedDrainaseRef.current;
      if (added.length > 0) {
        const addedIds = new Set(added.map((d) => String(d.id)));
        const filteredInitial = initialData.filter((d) => !addedIds.has(String(d.id)));
        return [...added, ...filteredInitial];
      }
      return initialData;
    });
  }, []);

  const setRivers = useCallback((data: RiverData[]) => {
    setRiversState(data || []);
  }, []);

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

  const setCityData = useCallback(
    (data: CityDetail | null) => {
      if (data) {
        const merged: CityDetail = {
          ...DEFAULT_CITY_DETAIL,
          ...data,
          drainage_adequacy_ratio:
            data.drainage_adequacy_ratio != null
              ? Number(data.drainage_adequacy_ratio)
              : DEFAULT_CITY_DETAIL.drainage_adequacy_ratio,
          waste_water_coverage:
            data.waste_water_coverage != null
              ? Number(data.waste_water_coverage)
              : DEFAULT_CITY_DETAIL.waste_water_coverage,
          clean_water_access_ratio:
            data.clean_water_access_ratio != null
              ? Number(data.clean_water_access_ratio)
              : DEFAULT_CITY_DETAIL.clean_water_access_ratio,
          hydrant_adequacy_ratio:
            data.hydrant_adequacy_ratio != null
              ? Number(data.hydrant_adequacy_ratio)
              : DEFAULT_CITY_DETAIL.hydrant_adequacy_ratio,
        };
        setInitialCityStats(merged);

        const cityKey = (data.id || "madiun") as string;
        loadSimulationProgress(cityKey).then((saved) => {
          if (saved && saved.cityStats) {
            applySimulationProgress(saved);
          } else {
            setCityStats(merged);
            cityStatsRef.current = merged;
          }
          isHydratedRef.current = true;
        });
      }
      setManualStatsOverride(null);
      if (data?.rivers && Array.isArray(data.rivers)) {
        setRiversState(data.rivers);
      }
    },
    [applySimulationProgress]
  );

  const renovateBuilding = useCallback(
    (buildingId: string) => {
      // 1. Ubah data bangunan di state buildings
      const targetB = buildings.find((item) => String(item.id) === String(buildingId));
      if (targetB) {
        const type = (targetB.type_id || targetB.type_name || "").toLowerCase();
        const isResidential =
          !type.includes("facility") &&
          !type.includes("dining") &&
          !type.includes("green");

        if (isResidential) {
          const waterService = evaluateResidentialWaterService(targetB, drainase);
          const renoCalc = calculateRenovationUnfit(
            waterService.has_clean_water,
            waterService.has_water_disposal
          );
          modifiedBuildingsRef.current[String(buildingId)] = {
            has_clean_water: waterService.has_clean_water,
            has_water_disposal: waterService.has_water_disposal,
            unfit_pct: renoCalc.unfit_pct,
            is_safe: renoCalc.is_safe,
            is_rtlh: false,
            status: renoCalc.status,
            condition: renoCalc.condition,
            color_hex: renoCalc.unfit_pct < 15 ? "#22C55E" : "#94A3B8",
          };
        } else {
          modifiedBuildingsRef.current[String(buildingId)] = {
            unfit_pct: 0,
            is_safe: true,
            is_rtlh: false,
            status: "Optimal",
            condition: "Baik (Hasil Renovasi)",
            color_hex: "#22C55E",
          };
        }
      }

      setBuildings((prev) =>
        prev.map((b) => {
          if (String(b.id) === String(buildingId)) {
            const mod = modifiedBuildingsRef.current[String(buildingId)];
            return mod ? { ...b, ...mod } : b;
          }
          return b;
        })
      );

      // 2. Tandai id bangunan yang sudah direnovasi
      setRenovatedHouseIds((prev) => {
        const next = new Set(prev).add(buildingId);
        renovatedHouseIdsRef.current = next;
        return next;
      });

      // 3. Kurangi jumlah RTLH pada cityStats (karena bangunan kini unfit_pct <= 15, bukan RTLH lagi)
      setCityStats((prev) => {
        const current = prev || DEFAULT_CITY_DETAIL;
        const currentUnfit = Number(current.unfit_housing_count) || 17879;
        const updated = {
          ...current,
          unfit_housing_count: Math.max(0, currentUnfit - 1),
        };
        cityStatsRef.current = updated;
        triggerAutoSave(updated);
        return updated;
      });
      setManualStatsOverride(null);
    },
    [buildings, drainase, setBuildings, triggerAutoSave]
  );

  const reconstructBuilding = useCallback(() => {
    // Kosongkan dahulu sesuai instruksi pengguna untuk persiapan Standar Pembangunan baru
  }, []);

  const relocateBuilding = useCallback(
    (buildingId: string, targetCoords: [number, number]): boolean => {
      const b = buildings.find((item) => String(item.id) === String(buildingId));
      if (!b) return false;

      const poly = getSinglePolygonPoints(b.geom);
      const currentCentroid = getBuildingCentroid(b.geom);
      if (poly.length < 3 || !currentCentroid) return false;

      const translatedPoly = translatePolygon(poly, currentCentroid, targetCoords);

      // 1. Validasi overlap dengan bangunan lain
      const overlapResult = checkBuildingOverlap(translatedPoly, buildings, buildingId);
      if (overlapResult.isOverlap) {
        setRelocationStatus((prev) => ({
          ...prev,
          hasTarget: true,
          isOverlap: true,
          overlappingBuildingName: overlapResult.overlappingBuilding?.name || "Bangunan Lain",
          canRelocate: false,
        }));
        return false;
      }

      // 2. Evaluasi kedekatan dengan TPA
      const tpaResult = checkTpaProximity(targetCoords, buildings, 150);

      // 3. Evaluasi kedekatan dengan sungai
      const riverResult = checkRiverProximity(translatedPoly, rivers, 3);

      // Susun GeoJSON baru untuk posisi baru (format GeoJSON [lng, lat])
      const newCoordinates = [
        [
          ...translatedPoly.map(([lat, lng]) => [lng, lat]),
          [translatedPoly[0][1], translatedPoly[0][0]],
        ],
      ];
      const newGeom = {
        type: "Polygon",
        coordinates: newCoordinates,
      };

      let hasCleanWater = false;
      let hasWaterDisposal = false;
      let unfitPct = 15;
      let isSafe = false;
      let status = "Waspada";
      let condition = "Hasil Relokasi";

      if (tpaResult.isNearTpa) {
        // Sangat dekat dengan TPA: tidak mendapatkan akses air bersih maupun pembuangan limbah
        hasCleanWater = false;
        hasWaterDisposal = false;
        unfitPct = 15;
        isSafe = false;
        status = "Waspada";
        condition = "Terdampak TPA (Tidak Ada Akses Air Bersih & Limbah)";
      } else if (riverResult.isNearRiver) {
        const waterService = evaluateResidentialWaterService({ geom: newGeom }, drainase);
        hasCleanWater = waterService.has_clean_water;
        hasWaterDisposal = waterService.has_water_disposal;
        const calc = calculateRenovationUnfit(hasCleanWater, hasWaterDisposal);
        unfitPct = calc.unfit_pct;
        isSafe = calc.is_safe;
        status = calc.status;
        condition = `Hasil Relokasi (Dekat Bibir Sungai ${riverResult.minDistance.toFixed(1)}m)`;
      } else {
        // Evaluasi air dan limbah dari underground network di lokasi baru
        const waterService = evaluateResidentialWaterService({ geom: newGeom }, drainase);
        hasCleanWater = waterService.has_clean_water;
        hasWaterDisposal = waterService.has_water_disposal;
        const calc = calculateRenovationUnfit(hasCleanWater, hasWaterDisposal);
        unfitPct = calc.unfit_pct;
        isSafe = calc.is_safe;
        status = calc.status;
        condition = `Hasil Relokasi (${calc.condition})`;
      }

      // Update state buildings
      setBuildings((prev) =>
        prev.map((item) => {
          if (String(item.id) === String(buildingId)) {
            return {
              ...item,
              geom: newGeom,
              has_clean_water: hasCleanWater,
              has_water_disposal: hasWaterDisposal,
              unfit_pct: unfitPct,
              is_safe: isSafe,
              is_rtlh: unfitPct >= 40,
              status,
              condition,
              color_hex: isSafe ? "#22C55E" : "#94A3B8",
            };
          }
          return item;
        })
      );

      // Simpan perubahan ke modifiedBuildingsRef
      modifiedBuildingsRef.current[String(buildingId)] = {
        geom: newGeom,
        has_clean_water: hasCleanWater,
        has_water_disposal: hasWaterDisposal,
        unfit_pct: unfitPct,
        is_safe: isSafe,
        is_rtlh: unfitPct >= 40,
        status,
        condition,
        color_hex: isSafe ? "#22C55E" : "#94A3B8",
      };

      setRelocatedHouseIds((prev) => {
        const next = new Set(prev).add(buildingId);
        relocatedHouseIdsRef.current = next;
        return next;
      });

      if (!b.is_safe && isSafe) {
        setCityStats((prev) => {
          const current = prev || DEFAULT_CITY_DETAIL;
          const currentUnfit = Number(current.unfit_housing_count) || 17879;
          const updated = {
            ...current,
            unfit_housing_count: Math.max(0, currentUnfit - 1),
          };
          cityStatsRef.current = updated;
          triggerAutoSave(updated);
          return updated;
        });
        setManualStatsOverride(null);
      } else {
        triggerAutoSave();
      }

      setSelectedHouse(null);
      setRelocationTarget(null);
      setRelocationStatus(initialRelocationStatus);

      return true;
    },
    [buildings, drainase, rivers, setBuildings, triggerAutoSave]
  );

  const addBuildingPoint = useCallback(
    (pt: [number, number]) => {
      setNewBuildingPoints((prev) => {
        const isDrainase = isDrainaseType(selectedBuildType);

        // Untuk jaringan utilitas drainase, IPAL, dan saluran air bersih: cukup 2 titik saja.
        // Jika sudah ada 2 titik dan diklik lagi, perbarui titik ke-2 (endpoint outlet).
        if (isDrainase && prev.length >= 2) {
          return [prev[0], pt];
        }
        return [...prev, pt];
      });
    },
    [selectedBuildType]
  );

  const removeLastBuildingPoint = useCallback(() => {
    setNewBuildingPoints((prev) => prev.slice(0, -1));
  }, []);

  const resetNewBuildingPoints = useCallback(() => {
    setNewBuildingPoints([]);
  }, []);

  const pembangunanStatus = useMemo<PembangunanRequirementStatus>(() => {
    const isDrainase = isDrainaseType(selectedBuildType);
    const minPoints = isDrainase ? 2 : 3;

    if (newBuildingPoints.length < minPoints) {
      return {
        hasMinPoints: false,
        isOverlap: false,
        overlappingBuildingName: null,
        isNearRiver: false,
        riverDistance: null,
        isNearTpa: false,
        tpaDistance: null,
        canBuild: false,
        notes: isDrainase
          ? [
              newBuildingPoints.length === 0
                ? "Tentukan 2 titik jalur di peta (titik 1: awal inlet, titik 2: akhir outlet)."
                : "Tentukan 1 titik lagi di peta sebagai titik akhir (outlet) jalur utilitas.",
            ]
          : ["Tentukan minimal 3 titik poligon di peta untuk membentuk bangunan."],
      };
    }

    // Untuk drainase, IPAL, dan saluran air bersih:
    // Tepat 2 titik saja, utilitas bawah tanah tidak terhalang sempadan sungai atau overlap bangunan darat
    if (isDrainase) {
      return {
        hasMinPoints: true,
        isOverlap: false,
        overlappingBuildingName: null,
        isNearRiver: false,
        riverDistance: null,
        isNearTpa: false,
        tpaDistance: null,
        canBuild: true,
        notes: [
          "Jalur jaringan utilitas bawah tanah valid (2 titik terhubung) dan siap dibangun.",
        ],
      };
    }

    // 1. Cek overlap dengan bangunan yang ada (khusus layer bangunan)
    const overlapResult = checkBuildingOverlap(newBuildingPoints, buildings);

    // 2. Cek jarak ke bibir sungai (<= 3 meter)
    const riverResult = checkRiverProximity(newBuildingPoints, rivers, 3);

    // 3. Cek jarak ke TPA (<= 150 meter dari centroid)
    const lats = newBuildingPoints.map((p) => p[0]);
    const lngs = newBuildingPoints.map((p) => p[1]);
    const centroid: [number, number] = [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lngs.reduce((a, b) => a + b, 0) / lngs.length,
    ];
    const tpaResult = checkTpaProximity(centroid, buildings, 150);

    const notes: string[] = [];
    if (overlapResult.isOverlap) {
      notes.push("Overlap dengan bangunan lain: tidak dapat dibangun.");
    }
    if (riverResult.isNearRiver) {
      notes.push(
        `Terlalu dekat bibir sungai (${riverResult.minDistance.toFixed(1)} m <= 3 m).`
      );
    }
    if (tpaResult.isNearTpa) {
      notes.push("Sangat dekat dengan TPA: tidak mendapatkan akses air bersih & limbah.");
    }

    return {
      hasMinPoints: true,
      isOverlap: overlapResult.isOverlap,
      overlappingBuildingName: overlapResult.overlappingBuilding?.name || null,
      isNearRiver: riverResult.isNearRiver,
      riverDistance: riverResult.minDistance,
      isNearTpa: tpaResult.isNearTpa,
      tpaDistance: tpaResult.minDistance,
      canBuild: !overlapResult.isOverlap,
      notes,
    };
  }, [newBuildingPoints, buildings, rivers, selectedBuildType]);

  const createNewBuilding = useCallback((): BuildingData | UndergroundNetworkData | null => {
    const bType = BUILDING_TYPE.find((item) => item.id === selectedBuildType) || {
      id: selectedBuildType || "rumah",
      label: "Rumah",
      category: "Hunian",
      layer: "bangunan",
    };

    const isDrainase = isDrainaseType(bType.id);

    // 1. PEMBUATAN JARINGAN DRAINASE / IPAL / SALURAN AIR BERSIH
    // Cukup 2 titik saja, tidak termasuk bangunan, masuk ke state drainase (UndergroundNetworkData)
    if (isDrainase) {
      if (newBuildingPoints.length < 2) return null;

      let utilityType: "waste_water" | "clean_water" | "drainage" = "drainage";
      let networkName = "Saluran Drainase";
      let diameter = 600;

      if (bType.id === "ipal") {
        utilityType = "waste_water";
        networkName = "Saluran Air Limbah (IPAL)";
        diameter = 500;
      } else if (bType.id === "saluran-air-bersih") {
        utilityType = "clean_water";
        networkName = "Saluran Air Bersih";
        diameter = 350;
      }

      // GeoJSON LineString format [ [lng, lat], [lng, lat] ]
      const lineCoords = [
        [newBuildingPoints[0][1], newBuildingPoints[0][0]],
        [newBuildingPoints[1][1], newBuildingPoints[1][0]],
      ];

      const newId = `network-${Date.now()}`;
      const newDrainaseItem: UndergroundNetworkData = {
        id: newId,
        city_id: (cityStats?.id as string) || "madiun",
        name: `${networkName} #${newId.slice(-4)}`,
        utility_type: utilityType,
        geom: {
          type: "LineString",
          coordinates: lineCoords,
        },
        diameter_mm: diameter,
        depth_m: 1.8,
        flow_capacity_lps: 150,
        service_radius: 150,
        status: "optimal",
        condition: "Lancar (Optimal)",
        created_at: new Date().toISOString(),
      };

      // Tambahkan ke bagian DRAINASE (tempat getDrainase pada actions), BUKAN ke buildings
      setDrainaseState((prev) => [newDrainaseItem, ...prev]);

      // Re-evaluasi seluruh status bangunan hunian di sekitar jaringan baru
      let newlyRedeemedHouses = 0;
      setBuildings((prev) =>
        prev.map((b) => {
          const type = (b.type_id || b.type_name || "").toLowerCase();
          const isRes =
            !type.includes("facility") &&
            !type.includes("dining") &&
            !type.includes("green");
          if (isRes) {
            const waterService = evaluateResidentialWaterService(b, [
              newDrainaseItem,
              ...drainase,
            ]);
            if (
              (waterService.has_clean_water && !b.has_clean_water) ||
              (waterService.has_water_disposal && !b.has_water_disposal)
            ) {
              const renoCalc = calculateRenovationUnfit(
                waterService.has_clean_water,
                waterService.has_water_disposal
              );
              if (!b.is_safe && renoCalc.is_safe) {
                newlyRedeemedHouses++;
              }
              return {
                ...b,
                has_clean_water: waterService.has_clean_water,
                has_water_disposal: waterService.has_water_disposal,
                unfit_pct:
                  b.unfit_pct !== null && b.unfit_pct !== undefined
                    ? Math.min(b.unfit_pct, renoCalc.unfit_pct)
                    : renoCalc.unfit_pct,
                is_safe: renoCalc.is_safe,
                is_rtlh: renoCalc.unfit_pct >= 40,
                status: renoCalc.status,
                condition: renoCalc.condition,
                color_hex: renoCalc.is_safe ? "#22C55E" : "#94A3B8",
              };
            }
          }
          return b;
        })
      );

      // Update CityStats: Meningkatkan Ketercukupan Air Bersih, Saluran Air Limbah, atau Ketercukupan Saluran Drainase
      addedDrainaseRef.current = [newDrainaseItem, ...addedDrainaseRef.current];

      setCityStats((prev) => {
        const current = prev || DEFAULT_CITY_DETAIL;
        const currentDrainageRatio = Number(current.drainage_adequacy_ratio) || 78.4;
        const currentWasteWater = Number(current.waste_water_coverage) || 69.5;
        const currentCleanWater = Number(current.clean_water_access_ratio) || 96.6;
        const currentUnfit = Number(current.unfit_housing_count) || 17879;

        let newDrainageRatio = currentDrainageRatio;
        let newWasteWater = currentWasteWater;
        let newCleanWater = currentCleanWater;

        if (utilityType === "drainage") {
          newDrainageRatio = Math.min(100, Number((currentDrainageRatio + 0.5).toFixed(1)));
        } else if (utilityType === "waste_water") {
          newWasteWater = Math.min(100, Number((currentWasteWater + 0.5).toFixed(1)));
        } else if (utilityType === "clean_water") {
          newCleanWater = Math.min(100, Number((currentCleanWater + 0.5).toFixed(1)));
        }

        const updated = {
          ...current,
          drainage_adequacy_ratio: newDrainageRatio,
          waste_water_coverage: newWasteWater,
          clean_water_access_ratio: newCleanWater,
          unfit_housing_count: Math.max(0, currentUnfit - newlyRedeemedHouses),
        };
        cityStatsRef.current = updated;
        triggerAutoSave(updated);
        return updated;
      });

      setManualStatsOverride(null);
      setNewBuildingPoints([]);
      return newDrainaseItem;
    }

    // 2. PEMBUATAN BANGUNAN & RTH (LAYER BANGUNAN)
    if (newBuildingPoints.length < 3) return null;
    if (pembangunanStatus.isOverlap) return null;

    const isRth = bType.id === "rth";
    const isHunian = bType.category === "Hunian" && !isRth;

    const area = calculatePolygonAreaM2(newBuildingPoints);
    const squares = Math.max(area, 24);
    const levels = isRth ? 1 : Math.max(1, buildingFloors);

    // Format koordinat poligon GeoJSON: [ [ [lng, lat], ... ] ]
    const newCoordinates = [
      [
        ...newBuildingPoints.map(([lat, lng]) => [lng, lat]),
        [newBuildingPoints[0][1], newBuildingPoints[0][0]],
      ],
    ];

    const newGeom = {
      type: "Polygon",
      coordinates: newCoordinates,
    };

    const newId = `build-${Date.now()}`;
    const runoff = isRth ? 0.2 : 0.7;

    let hasCleanWater = false;
    let hasWaterDisposal = false;
    let unfitPct: number | null = null;
    let isSafe = true;
    let colorHex = "#3B82F6";

    if (isHunian) {
      const waterService = evaluateResidentialWaterService({ geom: newGeom }, drainase);
      hasCleanWater = waterService.has_clean_water;
      hasWaterDisposal = waterService.has_water_disposal;

      const renoCalc = calculateRenovationUnfit(hasCleanWater, hasWaterDisposal);
      unfitPct = renoCalc.unfit_pct;
      isSafe = renoCalc.is_safe;
      colorHex = isSafe ? "#64748B" : "#94A3B8";
    } else if (isRth) {
      colorHex = "#22C55E";
      unfitPct = 0;
      isSafe = true;
    } else {
      colorHex = "#3B82F6";
      unfitPct = 0;
      isSafe = true;
    }

    const newBuilding: BuildingData = {
      id: newId,
      name: bType.label,
      type_id: bType.id,
      type_name: bType.label,
      building_levels: levels,
      building_squares: squares,
      condition: "Baik",
      status: "Optimal",
      runoff_coef: runoff,
      service_radius: isHunian ? undefined : 200,
      geom: newGeom,
      has_clean_water: isHunian ? hasCleanWater : undefined,
      has_water_disposal: isHunian ? hasWaterDisposal : undefined,
      unfit_pct: unfitPct ?? undefined,
      is_safe: isSafe,
      is_rtlh: unfitPct !== null && unfitPct >= 40,
      color_hex: colorHex,
    };

    addedBuildingsRef.current = [newBuilding, ...addedBuildingsRef.current];
    setBuildings((prev) => [newBuilding, ...prev]);

    // Update seluruh status data CityDetail secara reaktif
    setCityStats((prev) => {
      const current = prev || DEFAULT_CITY_DETAIL;
      const areaKm2 = Number(current.area_km2) || 33.23;
      const totalLandArea =
        Number(current.total_land_area_sqm) || areaKm2 * 1_000_000;

      const currentResCount = Number(current.residential_count) || 71974;
      const currentUnfitCount = Number(current.unfit_housing_count) || 17879;
      const currentGreenArea = Number(current.total_green_space_area_sqm) || 364746;
      const currentTotalBldCount =
        Number(current.total_building_count) || currentResCount;

      const currentBldArea = Number(current.total_building_area_sqm) || 8041660;
      const currentAvgFloorArea =
        Number(current.total_floor_area_sqm) ||
        Number(current.total_building_area_sqm) ||
        609.46;

      const currentPop = Number(current.population) || 201733;

      // 1. Total Building Count
      const newTotalBldCount = currentTotalBldCount + 1;

      // 2. Kepadatan Luas Bangunan (KDB / building_coverage_ratio)
      const newTotalBldArea = currentBldArea + squares;
      const newKdb =
        totalLandArea > 0
          ? Number(((newTotalBldArea / totalLandArea) * 100).toFixed(1))
          : 24.2;

      // 3. Kepadatan Vertikal / Floor Area Ratio (FAR / KLB):
      const addedGrossFloorArea = squares * levels;
      const currentTotalGrossFloorArea = currentTotalBldCount * currentAvgFloorArea;
      const newTotalGrossFloorArea = currentTotalGrossFloorArea + addedGrossFloorArea;
      const newAvgFloorArea =
        newTotalBldCount > 0 ? newTotalGrossFloorArea / newTotalBldCount : currentAvgFloorArea;
      const newFar =
        totalLandArea > 0
          ? Number(((newTotalBldCount * newAvgFloorArea) / totalLandArea).toFixed(2))
          : 1.32;

      // 4. RTH
      const newGreenArea = isRth ? currentGreenArea + squares : currentGreenArea;
      const newRthRatio =
        totalLandArea > 0
          ? Number(((newGreenArea / totalLandArea) * 100).toFixed(1))
          : 1.1;

      // 5. Infrastruktur Spesifik: PDAM & Hydrant
      const isPdam = bType.id === "pdam";
      const isHydrant = bType.id === "hydrant";

      const currentCleanWater = Number(current.clean_water_access_ratio) || 96.6;
      const newCleanWater = isPdam
        ? Math.min(100, Number((currentCleanWater + 0.8).toFixed(1)))
        : currentCleanWater;

      const currentHydrant = Number(current.hydrant_adequacy_ratio) || 43.3;
      const newHydrant = isHydrant
        ? Math.min(100, Number((currentHydrant + 0.6).toFixed(1)))
        : currentHydrant;

      // 6. Populasi & Hunian: Jumlah penduduk tidak akan bertambah
      const newPopulation = currentPop;
      const newPopDensity =
        current.population_density != null
          ? Number(current.population_density)
          : Number((newPopulation / areaKm2).toFixed(1));

      const updated = {
        ...current,
        residential_count: isHunian ? currentResCount + 1 : currentResCount,
        unfit_housing_count: isHunian && !isSafe ? currentUnfitCount + 1 : currentUnfitCount,
        total_building_count: newTotalBldCount,
        total_building_area_sqm: newTotalBldArea,
        building_coverage_ratio: newKdb,
        total_floor_area_sqm: Number(newAvgFloorArea.toFixed(2)),
        floor_area_ratio: newFar,
        vertical_building_density: newFar,
        total_green_space_area_sqm: newGreenArea,
        green_open_space_ratio: newRthRatio,
        clean_water_access_ratio: newCleanWater,
        hydrant_adequacy_ratio: newHydrant,
        population: newPopulation,
        population_density: newPopDensity,
      };
      cityStatsRef.current = updated;
      triggerAutoSave(updated);
      return updated;
    });

    setManualStatsOverride(null);
    setNewBuildingPoints([]);
    return newBuilding;
  }, [newBuildingPoints, selectedBuildType, buildingFloors, drainase, pembangunanStatus.isOverlap, cityStats?.id, triggerAutoSave, setBuildings]);

  const resetStats = useCallback(() => {
    const cityKey = (cityStats?.id || "madiun") as string;
    clearSimulationProgress(cityKey);

    addedBuildingsRef.current = [];
    addedDrainaseRef.current = [];
    modifiedBuildingsRef.current = {};

    setRelocatedHouseIds(new Set());
    setRenovatedHouseIds(new Set());
    setReconstructedHouseIds(new Set());
    relocatedHouseIdsRef.current = new Set();
    renovatedHouseIdsRef.current = new Set();
    reconstructedHouseIdsRef.current = new Set();

    setRelocationTarget(null);
    setRelocationStatus(initialRelocationStatus);
    setNewBuildingPoints([]);

    // Hapus bangunan baru pengguna dari state
    _setBuildings((prev) =>
      prev.filter((b) => !String(b.id).startsWith("build-") && !String(b.id).startsWith("bld-new-"))
    );

    // Hapus jaringan baru pengguna dari state
    setDrainaseState((prev) =>
      prev.filter((d) => !String(d.id).startsWith("net-new-") && !String(d.id).startsWith("net-"))
    );

    const def = initialCityStats || DEFAULT_CITY_DETAIL;
    setCityStats(def);
    cityStatsRef.current = def;
    setManualStatsOverride(null);
  }, [cityStats?.id, initialCityStats]);

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

  // Memo kategorisasi bangunan dengan deklarasi tipe terpisah
  const categorizedBuildings = useMemo<CategorizedBuildings>(() => {
    const residential: ResidentialBuilding[] = [];
    const facilities: NonResidentialBuilding[] = [];
    const dinings: NonResidentialBuilding[] = [];
    const greenSpaces: NonResidentialBuilding[] = [];

    buildings.forEach((b) => {
      const type = (b.type_id || b.type_name || "").toLowerCase();
      const gridId = String(b.gridId || b.grid_id || "");
      const levels = Number(b.building_levels || 1);
      const runoff = Number(b.runoff_coef ?? 0.7);

      if (type.includes("facility") || type.includes("umum")) {
        facilities.push({
          id: b.id,
          building_levels: levels,
          building_squares: Number(b.building_squares || b.area_sqm || 120),
          name: b.name || "Fasilitas Umum",
          service_radius: Number(b.service_radius ?? 200),
          gridId,
          condition: String(b.condition || "Optimal"),
          type_id: b.type_id || "facility",
          runoff_coef: runoff,
          geom: b.geom,
          color_hex: typeof b.color_hex === "string" ? b.color_hex : undefined,
          status: typeof b.status === "string" ? b.status : undefined,
          grid_id: typeof b.grid_id === "string" ? b.grid_id : undefined,
        });
      } else if (
        type.includes("dining") ||
        type.includes("makan") ||
        type.includes("resto") ||
        type.includes("kuliner") ||
        type.includes("cafe")
      ) {
        dinings.push({
          id: b.id,
          building_levels: levels,
          building_squares: Number(b.building_squares || b.area_sqm || 80),
          name: b.name || "Tempat Makan / Kuliner",
          service_radius: Number(b.service_radius ?? 150),
          gridId,
          condition: String(b.condition || "Optimal"),
          type_id: typeof b.type_id === "string" ? b.type_id : "dining",
          runoff_coef: runoff,
          geom: b.geom,
          color_hex: typeof b.color_hex === "string" ? b.color_hex : undefined,
          status: typeof b.status === "string" ? b.status : undefined,
          grid_id: typeof b.grid_id === "string" ? b.grid_id : undefined,
        });
      } else if (
        type.includes("green") ||
        type.includes("taman") ||
        type.includes("hijau") ||
        type.includes("rth")
      ) {
        greenSpaces.push({
          id: b.id,
          building_levels: levels,
          building_squares: Number(b.building_squares || b.area_sqm || 250),
          name: b.name || "Ruang Terbuka Hijau",
          service_radius: Number(b.service_radius ?? 300),
          gridId,
          condition: String(b.condition || "Terawat"),
          type_id: typeof b.type_id === "string" ? b.type_id : "green_spaces",
          runoff_coef: Number(b.runoff_coef ?? 0.2),
          geom: b.geom,
          color_hex: typeof b.color_hex === "string" ? b.color_hex : undefined,
          status: typeof b.status === "string" ? b.status : undefined,
          grid_id: typeof b.grid_id === "string" ? b.grid_id : undefined,
        });
      } else {
        // Residential: id, unfit_pct, building_levels, building_squares, has_clean_water, has_water_disposal, name, gridId, runoff_coef
        const waterService = evaluateResidentialWaterService(b, drainase);
        residential.push({
          id: b.id,
          unfit_pct: b.unfit_pct ?? null,
          building_levels: levels,
          building_squares: Number(b.building_squares || b.area_sqm || 36),
          has_clean_water: b.has_clean_water !== undefined ? Boolean(b.has_clean_water) : waterService.has_clean_water,
          has_water_disposal: b.has_water_disposal !== undefined ? Boolean(b.has_water_disposal) : waterService.has_water_disposal,
          name: b.name || "Hunian",
          gridId,
          runoff_coef: runoff,
          geom: b.geom,
          color_hex: typeof b.color_hex === "string" ? b.color_hex : undefined,
          condition: typeof b.condition === "string" ? b.condition : null,
          status: typeof b.status === "string" ? b.status : undefined,
          is_safe: typeof b.is_safe === "boolean" ? b.is_safe : undefined,
          grid_id: typeof b.grid_id === "string" ? b.grid_id : undefined,
          type_id: typeof b.type_id === "string" ? b.type_id : "residential",
          type_name: typeof b.type_name === "string" ? b.type_name : "Hunian",
        });
      }
    });

    return { residential, facilities, dinings, greenSpaces };
  }, [buildings, drainase]);

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
        relocationTarget,
        setRelocationTarget,
        relocationStatus,
        setRelocationStatus,
        relocatedHouseIds,
        setRelocatedHouseIds,
        relocateBuilding,
        renovatedHouseIds,
        setRenovatedHouseIds,
        reconstructedHouseIds,
        setReconstructedHouseIds,
        buildings,
        setBuildings,
        categorizedBuildings,
        cityGrids,
        setCityGrids,
        drainase,
        setDrainase,
        rivers,
        setRivers,
        layer,
        setLayer,
        mainMap,
        setMainMap,
        flyTo,
        selectedBuildType,
        setSelectedBuildType,
        buildingFloors,
        setBuildingFloors,
        newBuildingPoints,
        setNewBuildingPoints,
        addBuildingPoint,
        removeLastBuildingPoint,
        resetNewBuildingPoints,
        createNewBuilding,
        pembangunanStatus,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const MapContextProvider = MapProvider;
