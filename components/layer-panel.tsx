"use client";

import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { FeatureGroup, Polygon, Polyline, CircleMarker, Popup } from "react-leaflet";
import {
  BuildingPopupData,
  SeverityLevel,
  GridUndergroundNetwork,
  GridRiver,
  PopupResidential,
  PopupFacilities,
  PopupCommercial,
  PopupSpaceGreen,
  PopupRiver,
  PopupUndergroundNetwork,
  type UndergroundNetworkPopupData,
} from "@/components/grid-building";
import { type CityBoundaries } from "@/lib/utils";
import {
  getBuildingCentroid,
  getSinglePolygonPoints,
  translatePolygon,
  getBuildingPositions,
} from "@/lib/spatial-utils";
import type {
  BuildingData,
  UndergroundNetworkData,
  RiverData,
  ResidentialBuilding,
  NonResidentialBuilding,
} from "@/types";
import {
  useMapContext,
  type RelocationRequirementStatus,
  type PembangunanRequirementStatus,
} from "@/hooks/useMapContext";

export interface BuildingEvaluation {
  level: SeverityLevel;
  label: string;
  unfitValue: number | null;
  conditionText: string;
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
}

export function parseUnfitValue(b: BuildingData): number | null {
  let val: number | null = null;
  if (typeof b.unfit_pct === "number") {
    val = b.unfit_pct;
  } else if (typeof b.unfit === "number") {
    val = b.unfit;
  } else if (typeof b.unfit_score === "number") {
    val = b.unfit_score;
  } else if (typeof b.rtlh_score === "number") {
    val = b.rtlh_score;
  } else if (typeof b.rtlh === "number") {
    val = b.rtlh;
  } else if (typeof b.rtlh_count === "number") {
    val = b.rtlh_count;
  } else if (b.is_rtlh) {
    return 75;
  }

  if (val !== null) {
    if (val > 0 && val <= 1) {
      val = val * 100;
    }
    return val;
  }

  const textToCheck = `${b.status || ""} ${b.condition || ""}`.toLowerCase();
  if (
    textToCheck.includes("bahaya") ||
    textToCheck.includes("tidak aman") ||
    textToCheck.includes("rusak berat") ||
    textToCheck.includes("kritis") ||
    textToCheck.includes("danger")
  ) {
    return 75; // >= 70% (Danger)
  }
  if (
    textToCheck.includes("siaga") ||
    textToCheck.includes("alert") ||
    textToCheck.includes("rusak sedang") ||
    textToCheck.includes("butuh perbaikan") ||
    textToCheck.includes("perlu perbaikan") ||
    textToCheck.includes("rtlh")
  ) {
    return 50; // 40 - 69.9% (Alert)
  }
  if (
    textToCheck.includes("waspada") ||
    textToCheck.includes("warning") ||
    textToCheck.includes("rusak ringan") ||
    textToCheck.includes("pemantauan")
  ) {
    return 25; // 15 - 39.9% (Warning)
  }

  return null;
}

/**
 * Mengevaluasi kategori unfit untuk bangunan pemukiman (residential).
 * Rentang persentase unfit:
 * - < 15%: Aman / Layak Huni
 * - 15% - 39.9%: Warning (Waspada / Butuh Pemantauan)
 * - 40% - 69.9%: Alert (Siaga / Butuh Perbaikan)
 * - >= 70%: Danger (Bahaya / Rusak Berat / Tidak Aman)
 */
export function evaluateResidentialUnfit(b: BuildingData): BuildingEvaluation {
  const unfit = parseUnfitValue(b);

  if (unfit !== null) {
    if (unfit >= 70) {
      return {
        level: "danger",
        label: `Bahaya (${unfit.toFixed(1)}%) - Rusak Berat / Tidak Aman`,
        unfitValue: unfit,
        conditionText: "Rusak Berat / Tidak Aman",
        color: "#DC2626",
        fillColor: "#EF4444",
        fillOpacity: 0.88,
        weight: 2.5,
      };
    }
    if (unfit >= 40) {
      return {
        level: "alert",
        label: `Siaga (${unfit.toFixed(1)}%) - Rusak Sedang / Butuh Perbaikan`,
        unfitValue: unfit,
        conditionText: "Rusak Sedang / Butuh Perbaikan",
        color: "#EA580C",
        fillColor: "#F97316",
        fillOpacity: 0.78,
        weight: 2.2,
      };
    }
    if (unfit > 14.9) {
      return {
        level: "warning",
        label: `Waspada (${unfit.toFixed(1)}%) - Butuh Pemantauan`,
        unfitValue: unfit,
        conditionText: "Waspada / Perlu Pemantauan",
        color: "#64748B",
        fillColor: "#94A3B8",
        fillOpacity: 0.65,
        weight: 1.8,
      };
    }
    return {
      level: "normal",
      label: `Aman (${unfit.toFixed(1)}%) - Layak Huni`,
      unfitValue: unfit,
      conditionText: "Layak Huni (Aman)",
      color: "#64748B",
      fillColor: "#94A3B8",
      fillOpacity: 0.5,
      weight: 1.5,
    };
  }

  return {
    level: "normal",
    label: "Aman - Layak Huni",
    unfitValue: null,
    conditionText: "Layak Huni",
    color: b.color_hex || "#64748B",
    fillColor: b.color_hex || "#94A3B8",
    fillOpacity: 0.5,
    weight: 1.5,
  };
}

/**
 * Mengevaluasi kategori kondisi untuk fasilitas umum, tempat makan, dan ruang terbuka hijau.
 * Menggunakan parameter `condition` (dan fallback `status`).
 */
export function evaluateNonResidentialCondition(
  b: BuildingData,
  buildingType: "facilities" | "commercial" | "space-green"
): BuildingEvaluation {
  const condRaw = (b.condition || b.status || "").toLowerCase();

  let numericCond: number | null = null;
  const matchNum = condRaw.match(/(\d+(\.\d+)?)/);
  if (matchNum) {
    const parsed = parseFloat(matchNum[1]);
    if (!isNaN(parsed) && parsed <= 100) {
      numericCond = parsed;
    }
  }

  const defaultStyles = {
    facilities: {
      color: "#2563EB",
      fillColor: "#3B82F6",
      fillOpacity: 0.75,
      label: "Fasilitas Umum",
    },
    commercial: {
      color: "#EA580C",
      fillColor: "#F97316",
      fillOpacity: 0.75,
      label: "Tempat Makan / Komersial",
    },
    "space-green": {
      color: "#16A34A",
      fillColor: "#22C55E",
      fillOpacity: 0.7,
      label: "Ruang Terbuka Hijau",
    },
  };

  const base = defaultStyles[buildingType];

  const isDanger =
    (numericCond !== null && numericCond >= 70) ||
    condRaw.includes("danger") ||
    condRaw.includes("bahaya") ||
    condRaw.includes("rusak berat") ||
    condRaw.includes("kritis") ||
    condRaw.includes("tidak aman") ||
    condRaw.includes("hancur");

  const isAlert =
    (numericCond !== null && numericCond >= 40 && numericCond < 70) ||
    condRaw.includes("alert") ||
    condRaw.includes("siaga") ||
    condRaw.includes("rusak sedang") ||
    condRaw.includes("butuh perbaikan") ||
    condRaw.includes("perlu perbaikan") ||
    condRaw.includes("maintenance") ||
    condRaw.includes("buruk");

  const isWarning =
    (numericCond !== null && numericCond >= 15 && numericCond < 40) ||
    condRaw.includes("warning") ||
    condRaw.includes("waspada") ||
    condRaw.includes("rusak ringan") ||
    condRaw.includes("pemantauan");

  if (isDanger) {
    return {
      level: "danger",
      label: `Bahaya - Rusak Berat / Butuh Perbaikan Segera (${b.condition || "Kritis"})`,
      unfitValue: numericCond,
      conditionText: b.condition || "Rusak Berat",
      color: "#DC2626",
      fillColor: "#EF4444",
      fillOpacity: 0.88,
      weight: 2.5,
    };
  }

  if (isAlert) {
    return {
      level: "alert",
      label: `Siaga - Rusak Sedang / Butuh Perbaikan (${b.condition || "Perlu Perbaikan"})`,
      unfitValue: numericCond,
      conditionText: b.condition || "Rusak Sedang",
      color: "#EA580C",
      fillColor: "#FB923C",
      fillOpacity: 0.82,
      weight: 2.3,
    };
  }

  if (isWarning) {
    return {
      level: "warning",
      label: `Waspada - Butuh Pemantauan (${b.condition || "Rusak Ringan"})`,
      unfitValue: numericCond,
      conditionText: b.condition || "Rusak Ringan",
      color: "#64748B",
      fillColor: "#94A3B8",
      fillOpacity: 0.75,
      weight: 2,
    };
  }

  return {
    level: "normal",
    label: b.condition || `${base.label} (Optimal)`,
    unfitValue: numericCond,
    conditionText: b.condition || "Optimal / Berfungsi Baik",
    color: b.color_hex || base.color,
    fillColor: b.color_hex || base.fillColor,
    fillOpacity: base.fillOpacity,
    weight: 2,
  };
}

export function getBuildingOpacity(b: BuildingData): number {
  const evalRes = evaluateResidentialUnfit(b);
  return evalRes.fillOpacity;
}

/**
 * Poin 1 Solusi: Cache hasil evaluasi pada objek bangunan agar tidak
 * melakukan kalkulasi string & regex berulang di dalam render loop.
 */
export function getOrEvaluateBuilding(
  b: BuildingData,
  buildingType: "residential" | "commercial" | "facilities" | "drainase" | "space-green"
): BuildingEvaluation {
  const cached = (
    b as unknown as {
      _cachedEval?: { unfit_pct?: number | null; condition?: string | null; evalInfo: BuildingEvaluation };
    }
  )._cachedEval;

  if (cached && cached.unfit_pct === b.unfit_pct && cached.condition === b.condition) {
    return cached.evalInfo;
  }

  const evalInfo =
    buildingType === "residential"
      ? evaluateResidentialUnfit(b)
      : evaluateNonResidentialCondition(
          b,
          buildingType as "facilities" | "commercial" | "space-green"
        );

  (
    b as unknown as {
      _cachedEval?: { unfit_pct?: number | null; condition?: string | null; evalInfo: BuildingEvaluation };
    }
  )._cachedEval = {
    unfit_pct: b.unfit_pct,
    condition: b.condition,
    evalInfo,
  };

  return evalInfo;
}

/**
 * Poin 4 Solusi: Komponen poligon bangunan memoized modular.
 * Mencegah re-render jika id, pathOptions, posisi, dan status seleksi tidak berubah.
 */
interface BuildingPolygonItemProps {
  building: BuildingData;
  positions: CityBoundaries;
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  isSelected: boolean;
  buildingType: "residential" | "commercial" | "facilities" | "drainase" | "space-green";
  popupData: BuildingPopupData;
  onClick: (
    b: BuildingData,
    type: "residential" | "commercial" | "facilities" | "drainase" | "space-green",
    popupData: BuildingPopupData,
    latlng?: { lat: number; lng: number }
  ) => void;
}

const BuildingPolygonItem = React.memo(
  function BuildingPolygonItem({
    building,
    positions,
    color,
    fillColor,
    fillOpacity,
    weight,
    buildingType,
    popupData,
    onClick,
  }: BuildingPolygonItemProps) {
    // Poin 3 Solusi: Event listener stabil via memo
    const eventHandlers = useMemo(
      () => ({
        click: (e: { latlng?: { lat: number; lng: number } }) => {
          onClick(building, buildingType, popupData, e?.latlng);
        },
      }),
      [onClick, building, buildingType, popupData]
    );

    return (
      <Polygon
        positions={positions as CityBoundaries}
        pathOptions={{
          color,
          fillColor,
          fillOpacity,
          weight,
        }}
        eventHandlers={eventHandlers}
      />
    );
  },
  (prev, next) => {
    return (
      prev.building.id === next.building.id &&
      prev.color === next.color &&
      prev.fillColor === next.fillColor &&
      prev.fillOpacity === next.fillOpacity &&
      prev.weight === next.weight &&
      prev.isSelected === next.isSelected &&
      prev.positions === next.positions &&
      prev.onClick === next.onClick
    );
  }
);

/**
 * Poin 4 Solusi: Grup kategori bangunan modular terpisah.
 */
interface BuildingCategoryGroupProps {
  items: BuildingData[];
  defaultColor: string;
  buildingType: "residential" | "commercial" | "facilities" | "drainase" | "space-green";
  selectedHouseId: string | number | null | undefined;
  renovatedHouseIds: Set<string | number>;
  reconstructedHouseIds: Set<string | number>;
  relocatedHouseIds: Set<string | number>;
  onBuildingClick: (
    b: BuildingData,
    type: "residential" | "commercial" | "facilities" | "drainase" | "space-green",
    popupData: BuildingPopupData,
    latlng?: { lat: number; lng: number }
  ) => void;
}

const BuildingCategoryGroup = React.memo(function BuildingCategoryGroup({
  items,
  buildingType,
  selectedHouseId,
  renovatedHouseIds,
  reconstructedHouseIds,
  relocatedHouseIds,
  onBuildingClick,
}: BuildingCategoryGroupProps) {
  return (
    <>
      {items.map((b) => {
        const positions = getBuildingPositions(b);
        if (!positions) return null;

        const isSelected = selectedHouseId === b.id;
        const isRenovated = renovatedHouseIds.has(b.id);
        const isReconstructed = reconstructedHouseIds.has(b.id);
        const isRelocated = relocatedHouseIds.has(b.id);

        const evalInfo = getOrEvaluateBuilding(b, buildingType);

        let color = evalInfo.color;
        let fillColor = evalInfo.fillColor;
        let opacity = evalInfo.fillOpacity;
        let weight = evalInfo.weight;

        if (isRenovated) {
          color = evalInfo.color;
          fillColor = evalInfo.fillColor;
          opacity = 0.85;
          weight = 2.5;
        } else if (isReconstructed) {
          color = "#2563EB";
          fillColor = "#3B82F6";
          opacity = 0.85;
          weight = 2.5;
        } else if (isRelocated) {
          color = "#0891B2";
          fillColor = "#06B6D4";
          opacity = 0.85;
          weight = 2.5;
        }

        if (isSelected) {
          color = "#D97706";
          fillColor = "#F59E0B";
          opacity = 0.95;
          weight = 4;
        }

        const isResidential = buildingType === "residential";
        const resBuilding = isResidential ? (b as ResidentialBuilding) : null;
        const nonResBuilding = !isResidential ? (b as NonResidentialBuilding) : null;

        const popupData: BuildingPopupData = {
          ...b,
          unfit_pct: evalInfo.unfitValue,
          severity_level: evalInfo.level,
          severity_label: evalInfo.label,
          condition: b.condition || evalInfo.conditionText,
          has_clean_water: resBuilding?.has_clean_water,
          has_water_disposal: resBuilding?.has_water_disposal,
          building_squares: resBuilding?.building_squares ?? nonResBuilding?.building_squares,
          building_levels: b.building_levels || 1,
          service_radius: nonResBuilding?.service_radius,
          gridId: resBuilding?.gridId || nonResBuilding?.gridId || (b.grid_id as string),
          runoff_coef: b.runoff_coef,
        };

        return (
          <BuildingPolygonItem
            key={b.id}
            building={b}
            positions={positions}
            color={color}
            fillColor={fillColor}
            fillOpacity={opacity}
            weight={weight}
            isSelected={isSelected}
            buildingType={buildingType}
            popupData={popupData}
            onClick={onBuildingClick}
          />
        );
      })}
    </>
  );
});

/**
 * Poin 2 Solusi: 1 Global Popup tunggal di level map
 * Menggunakan komponen visual popup bawaan (PopupResidential, PopupFacilities, dll.)
 * tanpa modifikasi styling Tailwind sedikit pun.
 */
export interface ActivePopupState {
  latlng: [number, number];
  data: BuildingPopupData;
  buildingType: "residential" | "commercial" | "facilities" | "drainase" | "space-green" | "river";
}

export const GlobalMapPopup = React.memo(function GlobalMapPopup({
  activePopup,
  onClose,
}: {
  activePopup: ActivePopupState | null;
  onClose: () => void;
}) {
  if (!activePopup) return null;

  return (
    <Popup
      position={activePopup.latlng}
      eventHandlers={{
        remove: onClose,
      }}
    >
      {activePopup.buildingType === "residential" ? (
        <PopupResidential data={activePopup.data} />
      ) : activePopup.buildingType === "facilities" ? (
        <PopupFacilities data={activePopup.data} />
      ) : activePopup.buildingType === "commercial" ? (
        <PopupCommercial data={activePopup.data} />
      ) : activePopup.buildingType === "space-green" ? (
        <PopupSpaceGreen data={activePopup.data} />
      ) : activePopup.buildingType === "river" ? (
        <PopupRiver data={activePopup.data} />
      ) : (
        <PopupUndergroundNetwork data={activePopup.data as UndergroundNetworkPopupData} />
      )}
    </Popup>
  );
});

/**
 * Poin 4 Solusi: Layer Preview Relokasi terisolasi
 */
const RelocationPreviewLayer = React.memo(function RelocationPreviewLayer({
  selectedHouse,
  relocationTarget,
  relocationStatus,
}: {
  selectedHouse: BuildingData | null;
  relocationTarget: [number, number] | null;
  relocationStatus: RelocationRequirementStatus;
}) {
  const preview = useMemo(() => {
    if (!selectedHouse || !relocationTarget) return null;
    const poly = getSinglePolygonPoints(selectedHouse.geom);
    const origCentroid = getBuildingCentroid(selectedHouse.geom);
    if (poly.length < 3 || !origCentroid) return null;

    const translatedPoly = translatePolygon(poly, origCentroid, relocationTarget);

    let color = "#10B981"; // default hijau jika aman
    let fillColor = "#34D399";
    if (relocationStatus.isOverlap) {
      color = "#EF4444"; // merah jika overlap
      fillColor = "#F87171";
    } else if (relocationStatus.isNearRiver) {
      color = "#F59E0B"; // oranye jika <= 3m dari sungai
      fillColor = "#FBBF24";
    } else if (relocationStatus.isNearTpa) {
      color = "#8B5CF6"; // ungu jika dekat TPA
      fillColor = "#A78BFA";
    }

    return {
      origCentroid,
      targetCentroid: relocationTarget,
      polygon: translatedPoly,
      color,
      fillColor,
    };
  }, [selectedHouse, relocationTarget, relocationStatus]);

  if (!preview) return null;

  return (
    <FeatureGroup>
      <Polyline
        positions={[preview.origCentroid, preview.targetCentroid]}
        pathOptions={{
          color: "#3B82F6",
          weight: 2,
          dashArray: "6, 6",
          opacity: 0.85,
        }}
      />
      <Polygon
        positions={preview.polygon}
        pathOptions={{
          color: preview.color,
          fillColor: preview.fillColor,
          fillOpacity: 0.65,
          weight: 3,
        }}
      />
      <CircleMarker
        center={preview.targetCentroid}
        radius={5}
        pathOptions={{
          color: "#FFFFFF",
          fillColor: preview.color,
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </FeatureGroup>
  );
});

/**
 * Poin 4 Solusi: Layer Preview Pembangunan Baru terisolasi
 */
const NewBuildingPreviewLayer = React.memo(function NewBuildingPreviewLayer({
  points,
  selectedBuildType,
  pembangunanStatus,
}: {
  points: [number, number][];
  selectedBuildType: string;
  pembangunanStatus: PembangunanRequirementStatus;
}) {
  const isDrainase =
    selectedBuildType.includes("saluran") ||
    selectedBuildType.includes("drainase") ||
    selectedBuildType === "ipal";
  const isRth = selectedBuildType === "rth";

  const preview = useMemo(() => {
    if (points.length === 0) return null;

    let color = "#10B981";
    let fillColor = "#34D399";
    if (pembangunanStatus.isOverlap) {
      color = "#EF4444";
      fillColor = "#F87171";
    } else if (pembangunanStatus.isNearRiver) {
      color = "#F59E0B";
      fillColor = "#FBBF24";
    } else if (pembangunanStatus.isNearTpa) {
      color = "#8B5CF6";
      fillColor = "#A78BFA";
    } else if (isDrainase) {
      color = "#06B6D4";
      fillColor = "#22D3EE";
    } else if (isRth) {
      color = "#16A34A";
      fillColor = "#4ADE80";
    }

    return {
      points,
      color,
      fillColor,
    };
  }, [points, isDrainase, isRth, pembangunanStatus]);

  if (!preview) return null;

  return (
    <FeatureGroup>
      {isDrainase ? (
        <>
          {preview.points.length >= 2 && (
            <Polyline
              positions={preview.points}
              pathOptions={{
                color: preview.color,
                weight: 4,
                dashArray: "6, 6",
                opacity: 0.9,
              }}
            />
          )}
          {preview.points.map((pt, idx) => (
            <CircleMarker
              key={`new-drainase-pt-${idx}`}
              center={pt}
              radius={idx === 0 ? 6 : 7}
              pathOptions={{
                color: idx === 0 ? "#0891B2" : "#DC2626",
                fillColor: preview.color,
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}
        </>
      ) : (
        <>
          {preview.points.length >= 3 && (
            <Polygon
              positions={preview.points}
              pathOptions={{
                color: preview.color,
                fillColor: preview.fillColor,
                fillOpacity: 0.45,
                weight: 2.5,
                dashArray: "4, 4",
              }}
            />
          )}
          {preview.points.length === 2 && (
            <Polyline
              positions={preview.points}
              pathOptions={{
                color: preview.color,
                weight: 2.5,
                dashArray: "4, 4",
              }}
            />
          )}
          {preview.points.map((pt, idx) => (
            <CircleMarker
              key={`new-build-pt-${idx}`}
              center={pt}
              radius={5}
              pathOptions={{
                color: "#FFFFFF",
                fillColor: preview.color,
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}
        </>
      )}
    </FeatureGroup>
  );
});

/**
 * Layer Drainase & Jaringan Bawah Tanah
 */
const DrainaseLayer = React.memo(function DrainaseLayer({
  items,
}: {
  items: UndergroundNetworkData[];
}) {
  return (
    <FeatureGroup pathOptions={{ color: "#06B6D4" }}>
      {items.map((item) => (
        <GridUndergroundNetwork key={item.id} data={item} />
      ))}
    </FeatureGroup>
  );
});

/**
 * Layer Aliran Sungai
 */
const RiversLayer = React.memo(function RiversLayer({
  items,
}: {
  items: RiverData[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <FeatureGroup pathOptions={{ color: "#0284C7" }}>
      {items.map((river) => (
        <GridRiver key={river.id} data={river} />
      ))}
    </FeatureGroup>
  );
});

interface LayerPanelProps {
  buildings?: BuildingData[];
  drainase?: UndergroundNetworkData[];
  rivers?: RiverData[];
}

export default function LayerPanel({
  buildings = [],
  drainase = [],
  rivers = [],
}: LayerPanelProps) {
  const {
    layer,
    mode,
    buildMode,
    selectedHouse,
    setSelectedHouse,
    relocationTarget,
    setRelocationTarget,
    relocationStatus,
    setRelocationStatus,
    relocatedHouseIds,
    renovatedHouseIds,
    reconstructedHouseIds,
    categorizedBuildings,
    drainase: contextDrainase,
    rivers: contextRivers,
    selectedBuildType,
    newBuildingPoints,
    addBuildingPoint,
    pembangunanStatus,
  } = useMapContext();

  const activeDrainase = contextDrainase && contextDrainase.length > 0 ? contextDrainase : drainase;
  const activeRivers = contextRivers && contextRivers.length > 0 ? contextRivers : rivers;

  // Poin 2 Solusi: State Global Popup tunggal di level peta
  const [activePopup, setActivePopup] = useState<ActivePopupState | null>(null);

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  // Popup hanya terlihat saat berada pada mode view
  const visiblePopup = mode === "view" ? activePopup : null;

  // Poin 3 Solusi: Ref untuk mempertahankan referensi handler klik yang 100% stabil
  const isInteractiveBuild =
    mode === "build" &&
    (buildMode === "renovasi" ||
      buildMode === "rekonstruksi" ||
      buildMode === "relokasi");

  const mapStateRef = useRef({
    mode,
    buildMode,
    isInteractiveBuild,
    addBuildingPoint,
    setSelectedHouse,
    setRelocationTarget,
    setRelocationStatus,
  });

  useEffect(() => {
    mapStateRef.current = {
      mode,
      buildMode,
      isInteractiveBuild,
      addBuildingPoint,
      setSelectedHouse,
      setRelocationTarget,
      setRelocationStatus,
    };
  });

  // Handler klik bangunan stabil: dependency [] sehingga tidak membuat re-bind event di Leaflet
  const handleBuildingClick = useCallback(
    (
      b: BuildingData,
      buildingType: "residential" | "commercial" | "facilities" | "drainase" | "space-green",
      popupData: BuildingPopupData,
      latlng?: { lat: number; lng: number }
    ) => {
      const {
        mode: curMode,
        buildMode: curBuildMode,
        isInteractiveBuild: curInteractive,
        addBuildingPoint: doAddPoint,
        setSelectedHouse: doSelectHouse,
        setRelocationTarget: doSetTarget,
        setRelocationStatus: doSetStatus,
      } = mapStateRef.current;

      // Mode build pembangunan: klik menambah titik koordinat
      if (curMode === "build" && curBuildMode === "pembangunan") {
        if (latlng) {
          doAddPoint([latlng.lat, latlng.lng]);
        }
        return;
      }

      // Mode build interaktif (renovasi, rekonstruksi, relokasi): memilih bangunan
      if (curInteractive) {
        doSelectHouse(b);
        if (curBuildMode === "relokasi") {
          doSetTarget(null);
          doSetStatus({
            hasTarget: false,
            isOverlap: false,
            overlappingBuildingName: null,
            isNearRiver: false,
            riverDistance: null,
            isNearTpa: false,
            tpaDistance: null,
            canRelocate: false,
            notes: [],
          });
        }
        return;
      }

      // Mode view: buka 1 Global Popup di posisi koordinat yang diklik
      if (curMode === "view" && latlng) {
        setActivePopup({
          latlng: [latlng.lat, latlng.lng],
          data: popupData,
          buildingType,
        });
      }
    },
    []
  );

  // Optimasi pemisahan kategori bangunan memanfaatkan memo pada context
  const categorized = useMemo(() => {
    if (
      categorizedBuildings.residential.length > 0 ||
      categorizedBuildings.facilities.length > 0 ||
      categorizedBuildings.dinings.length > 0 ||
      categorizedBuildings.greenSpaces.length > 0
    ) {
      return categorizedBuildings;
    }

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
  }, [buildings, categorizedBuildings]);

  return (
    <>
      {/* Poin 2: Satu Global Popup Tunggal */}
      <GlobalMapPopup activePopup={visiblePopup} onClose={closePopup} />

      {/* Visual Preview Pembangunan Bangunan Baru */}
      {mode === "build" && buildMode === "pembangunan" && (
        <NewBuildingPreviewLayer
          points={newBuildingPoints}
          selectedBuildType={selectedBuildType}
          pembangunanStatus={pembangunanStatus}
        />
      )}

      {/* Visual Preview Lokasi Relokasi Baru */}
      {mode === "build" && buildMode === "relokasi" && (
        <RelocationPreviewLayer
          selectedHouse={selectedHouse}
          relocationTarget={relocationTarget}
          relocationStatus={relocationStatus}
        />
      )}

      {/* Layer Seluruh Bangunan & Fitur Kota */}
      {layer === "semua lapisan" && (
        <FeatureGroup>
          <BuildingCategoryGroup
            items={categorized.residential}
            defaultColor="#64748B"
            buildingType="residential"
            selectedHouseId={selectedHouse?.id}
            renovatedHouseIds={renovatedHouseIds}
            reconstructedHouseIds={reconstructedHouseIds}
            relocatedHouseIds={relocatedHouseIds}
            onBuildingClick={handleBuildingClick}
          />
          <BuildingCategoryGroup
            items={categorized.facilities}
            defaultColor="#3B82F6"
            buildingType="facilities"
            selectedHouseId={selectedHouse?.id}
            renovatedHouseIds={renovatedHouseIds}
            reconstructedHouseIds={reconstructedHouseIds}
            relocatedHouseIds={relocatedHouseIds}
            onBuildingClick={handleBuildingClick}
          />
          <BuildingCategoryGroup
            items={categorized.dinings}
            defaultColor="#F97316"
            buildingType="commercial"
            selectedHouseId={selectedHouse?.id}
            renovatedHouseIds={renovatedHouseIds}
            reconstructedHouseIds={reconstructedHouseIds}
            relocatedHouseIds={relocatedHouseIds}
            onBuildingClick={handleBuildingClick}
          />
          <BuildingCategoryGroup
            items={categorized.greenSpaces}
            defaultColor="#22C55E"
            buildingType="space-green"
            selectedHouseId={selectedHouse?.id}
            renovatedHouseIds={renovatedHouseIds}
            reconstructedHouseIds={reconstructedHouseIds}
            relocatedHouseIds={relocatedHouseIds}
            onBuildingClick={handleBuildingClick}
          />
        </FeatureGroup>
      )}

      {layer === "bangunan" && (
        <>
          {/* Layer Pemukiman: Warna Abu-abu (#64748B) */}
          <FeatureGroup pathOptions={{ color: "#64748B" }}>
            <BuildingCategoryGroup
              items={categorized.residential}
              defaultColor="#64748B"
              buildingType="residential"
              selectedHouseId={selectedHouse?.id}
              renovatedHouseIds={renovatedHouseIds}
              reconstructedHouseIds={reconstructedHouseIds}
              relocatedHouseIds={relocatedHouseIds}
              onBuildingClick={handleBuildingClick}
            />
          </FeatureGroup>

          {/* Layer Fasilitas: Warna Biru (#3B82F6) */}
          <FeatureGroup pathOptions={{ color: "#3B82F6" }}>
            <BuildingCategoryGroup
              items={categorized.facilities}
              defaultColor="#3B82F6"
              buildingType="facilities"
              selectedHouseId={selectedHouse?.id}
              renovatedHouseIds={renovatedHouseIds}
              reconstructedHouseIds={reconstructedHouseIds}
              relocatedHouseIds={relocatedHouseIds}
              onBuildingClick={handleBuildingClick}
            />
          </FeatureGroup>

          {/* Layer Tempat Makan / Dinings: Warna Orange (#F97316) */}
          <FeatureGroup pathOptions={{ color: "#F97316" }}>
            <BuildingCategoryGroup
              items={categorized.dinings}
              defaultColor="#F97316"
              buildingType="commercial"
              selectedHouseId={selectedHouse?.id}
              renovatedHouseIds={renovatedHouseIds}
              reconstructedHouseIds={reconstructedHouseIds}
              relocatedHouseIds={relocatedHouseIds}
              onBuildingClick={handleBuildingClick}
            />
          </FeatureGroup>

          {/* Layer Ruang Terbuka Hijau: Warna Hijau (#22C55E) */}
          <FeatureGroup pathOptions={{ color: "#22C55E" }}>
            <BuildingCategoryGroup
              items={categorized.greenSpaces}
              defaultColor="#22C55E"
              buildingType="space-green"
              selectedHouseId={selectedHouse?.id}
              renovatedHouseIds={renovatedHouseIds}
              reconstructedHouseIds={reconstructedHouseIds}
              relocatedHouseIds={relocatedHouseIds}
              onBuildingClick={handleBuildingClick}
            />
          </FeatureGroup>
        </>
      )}

      {/* Layer Drainase (Jaringan Bawah Tanah) */}
      {(layer === "semua lapisan" || layer === "drainase") && (
        <DrainaseLayer items={activeDrainase} />
      )}

      {/* Layer Sungai (Standar Pembangunan & Fitur Alami Air) */}
      {(layer === "semua lapisan" || layer === "drainase") && activeRivers && activeRivers.length > 0 && (
        <RiversLayer items={activeRivers} />
      )}
    </>
  );
}
