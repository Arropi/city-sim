"use client";

import React, { useMemo, useCallback, Fragment } from "react";
import {
  Popup,
  FeatureGroup,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import GridBuilding, { BuildingPopupData, SeverityLevel } from "@/components/grid-building";
import { parseGeoJSONCoordinates } from "@/lib/utils";
import type { BuildingData, UndergroundNetworkData } from "@/app/map/[slugid]/actions";
import { useMapContext } from "@/hooks/useMapContext";

function getEndpoints(
  positions: unknown
): { start: [number, number]; end: [number, number] }[] {
  if (!Array.isArray(positions) || positions.length === 0) return [];

  // MultiLineString: [ [ [lat, lng], ... ], ... ]
  if (
    Array.isArray(positions[0]) &&
    Array.isArray(positions[0][0]) &&
    typeof positions[0][0][0] === "number"
  ) {
    return (positions as [number, number][][])
      .filter((line) => line.length > 0)
      .map((line) => ({
        start: line[0],
        end: line[line.length - 1],
      }));
  }

  // LineString: [ [lat, lng], ... ]
  if (
    Array.isArray(positions[0]) &&
    typeof positions[0][0] === "number" &&
    positions.length > 0
  ) {
    const line = positions as [number, number][];
    return [{ start: line[0], end: line[line.length - 1] }];
  }

  return [];
}

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
    return 75; // RTLH default to danger (>= 70%)
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
    if (unfit >= 15) {
      return {
        level: "warning",
        label: `Waspada (${unfit.toFixed(1)}%) - Butuh Pemantauan`,
        unfitValue: unfit,
        conditionText: "Waspada / Perlu Pemantauan",
        color: "#D97706",
        fillColor: "#F59E0B",
        fillOpacity: 0.68,
        weight: 2,
      };
    }
    return {
      level: "normal",
      label: `Aman (${unfit.toFixed(1)}%) - Layak Huni`,
      unfitValue: unfit,
      conditionText: "Layak Huni (Aman)",
      color: b.color_hex || "#64748B",
      fillColor: b.color_hex || "#94A3B8",
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
 * Membuat fill warna lebih terang sehingga terlihat jelas di peta.
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
      color: "#D97706",
      fillColor: "#FBBF24",
      fillOpacity: 0.78,
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

interface LayerPanelProps {
  buildings?: BuildingData[];
  drainase?: UndergroundNetworkData[];
}

export default function LayerPanel({
  buildings = [],
  drainase = [],
}: LayerPanelProps) {
  const {
    layer,
    mode,
    buildMode,
    selectedHouse,
    setSelectedHouse,
    renovatedHouseIds,
    reconstructedHouseIds,
    categorizedBuildings,
  } = useMapContext();

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

  const renderBuildingGroup = useCallback(
    (
      items: BuildingData[],
      defaultColor: string,
      buildingType: "residential" | "commercial" | "facilities" | "drainase" | "space-green"
    ) => {
      return items.map((b) => {
        const positions = parseGeoJSONCoordinates(b.geom);
        if (!positions) return null;

        const isSelected = selectedHouse?.id === b.id;
        const isRenovated = renovatedHouseIds.has(b.id);
        const isReconstructed = reconstructedHouseIds.has(b.id);
        const isInteractiveBuild =
          mode === "build" && (buildMode === "renovasi" || buildMode === "rekonstruksi");

        // Evaluasi kategori unfit untuk residential, atau parameter condition untuk fasilitas, dining, dan RTH
        const evalInfo =
          buildingType === "residential"
            ? evaluateResidentialUnfit(b)
            : evaluateNonResidentialCondition(
                b,
                buildingType as "facilities" | "commercial" | "space-green"
              );

        let color = evalInfo.color;
        let fillColor = evalInfo.fillColor;
        let opacity = evalInfo.fillOpacity;
        let weight = evalInfo.weight;

        if (isRenovated) {
          color = "#16A34A";
          fillColor = "#22C55E";
          opacity = 0.85;
          weight = 2.5;
        } else if (isReconstructed) {
          color = "#2563EB";
          fillColor = "#3B82F6";
          opacity = 0.85;
          weight = 2.5;
        }

        if (isSelected) {
          color = "#D97706";
          fillColor = "#F59E0B";
          opacity = 0.95;
          weight = 4;
        }

        const popupData: BuildingPopupData = {
          ...b,
          unfit_pct: evalInfo.unfitValue,
          severity_level: evalInfo.level,
          severity_label: evalInfo.label,
          condition: b.condition || evalInfo.conditionText,
        };

        return (
          <GridBuilding
            key={b.id}
            type="polygon"
            buildings={buildingType}
            popup={!isInteractiveBuild}
            data={popupData}
            props={{
              positions,
              color,
              fillColor,
              fillOpacity: opacity,
              weight,
              eventHandlers: {
                click: () => {
                  if (isInteractiveBuild) {
                    setSelectedHouse(b);
                  }
                },
              },
            }}
          />
        );
      });
    },
    [
      buildMode,
      mode,
      reconstructedHouseIds,
      renovatedHouseIds,
      selectedHouse?.id,
      setSelectedHouse,
    ]
  );

  return (
    <>
      {layer === "semua lapisan" && (
        <FeatureGroup>
          {renderBuildingGroup(categorized.residential, "#64748B", "residential")}
          {renderBuildingGroup(categorized.facilities, "#3B82F6", "facilities")}
          {renderBuildingGroup(categorized.dinings, "#F97316", "commercial")}
          {renderBuildingGroup(categorized.greenSpaces, "#22C55E", "space-green")}
        </FeatureGroup>
      )}

      {layer === "bangunan" && (
        <>
          {/* Layer Pemukiman: Warna Abu-abu (#64748B) */}
          <FeatureGroup pathOptions={{ color: "#64748B" }}>
            {renderBuildingGroup(categorized.residential, "#64748B", "residential")}
          </FeatureGroup>

          {/* Layer Fasilitas: Warna Biru (#3B82F6) */}
          <FeatureGroup pathOptions={{ color: "#3B82F6" }}>
            {renderBuildingGroup(categorized.facilities, "#3B82F6", "facilities")}
          </FeatureGroup>

          {/* Layer Tempat Makan / Dinings: Warna Orange (#F97316) */}
          <FeatureGroup pathOptions={{ color: "#F97316" }}>
            {renderBuildingGroup(categorized.dinings, "#F97316", "commercial")}
          </FeatureGroup>

          {/* Layer Ruang Terbuka Hijau: Warna Hijau (#22C55E) */}
          <FeatureGroup pathOptions={{ color: "#22C55E" }}>
            {renderBuildingGroup(categorized.greenSpaces, "#22C55E", "space-green")}
          </FeatureGroup>
        </>
      )}

      {(layer === "semua lapisan" || layer === "drainase") && (
        <FeatureGroup pathOptions={{ color: "#06B6D4" }}>
          {drainase.map((item) => {
            const positions = parseGeoJSONCoordinates(item.geom);
            if (!positions || (Array.isArray(positions) && positions.length === 0)) {
              return null;
            }

            const status = item.status?.toLowerCase();
            const isOptimal = status === "optimal";
            const isWarning = status === "warning";
            const isMaintenance = status === "maintenance";

            const statusColor = isOptimal
              ? "#06B6D4"
              : isWarning
              ? "#F59E0B"
              : isMaintenance
              ? "#EF4444"
              : "#0891B2";

            const endBorderColor = isOptimal
              ? "#0891B2"
              : isWarning
              ? "#D97706"
              : isMaintenance
              ? "#DC2626"
              : "#0e7490";

            const statusLabel = isOptimal
              ? "Lancar (Optimal)"
              : isWarning
              ? "Waspada"
              : isMaintenance
              ? "Perawatan"
              : "Standar";

            const endpoints = getEndpoints(positions);

            return (
              <Fragment key={item.id}>
                <GridBuilding
                  type="polyline"
                  buildings="drainase"
                  popup={true}
                  data={{
                    name: item.id,
                    condition: statusLabel,
                    dimension: item.diameter_mm
                      ? `Ø ${item.diameter_mm} mm (Kedalaman: ${item.depth_m || "-"} m)`
                      : `${item.depth_m || "-"} m`,
                  }}
                  props={{
                    positions: positions as [number, number][] | [number, number][][],
                    color: statusColor,
                    weight: 4,
                    opacity: 0.9,
                  }}
                />

                {endpoints.map((ep, idx) => (
                  <Fragment key={`ep-${item.id}-${idx}`}>
                    {/* Dot Point Ujung Awal (Inlet) */}
                    <CircleMarker
                      center={ep.start}
                      radius={6}
                      pathOptions={{
                        color: "#FFFFFF",
                        fillColor: statusColor,
                        fillOpacity: 1,
                        weight: 2,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -6]}>
                        <span className="font-semibold">Titik Awal (Inlet)</span> • {statusLabel}
                      </Tooltip>
                      <Popup>
                        <div className="p-1 min-w-[190px] text-xs font-sans text-neutral-800">
                          <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2">
                            <span className="font-bold text-sm text-neutral-900">
                              Titik Awal (Inlet)
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                              style={{ backgroundColor: statusColor }}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-neutral-600">
                              ID Jaringan: <span className="font-semibold text-neutral-800">{item.id}</span>
                            </p>
                            <p className="text-neutral-600">
                              Kondisi:{" "}
                              <span className="font-semibold" style={{ color: statusColor }}>
                                {statusLabel}
                              </span>
                            </p>
                            {item.diameter_mm ? (
                              <p className="text-neutral-600">
                                Diameter: <span className="text-neutral-800">{item.diameter_mm} mm</span>
                              </p>
                            ) : null}
                            {item.depth_m ? (
                              <p className="text-neutral-600">
                                Kedalaman: <span className="text-neutral-800">{item.depth_m} m</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>

                    {/* Dot Point Ujung Akhir (Outlet) */}
                    <CircleMarker
                      center={ep.end}
                      radius={6}
                      pathOptions={{
                        color: endBorderColor,
                        fillColor: "#FFFFFF",
                        fillOpacity: 1,
                        weight: 3,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -6]}>
                        <span className="font-semibold">Titik Akhir (Outlet)</span> • {statusLabel}
                      </Tooltip>
                      <Popup>
                        <div className="p-1 min-w-[190px] text-xs font-sans text-neutral-800">
                          <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2">
                            <span className="font-bold text-sm text-neutral-900">
                              Titik Akhir (Outlet)
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                              style={{ backgroundColor: statusColor }}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-neutral-600">
                              ID Jaringan: <span className="font-semibold text-neutral-800">{item.id}</span>
                            </p>
                            <p className="text-neutral-600">
                              Kondisi:{" "}
                              <span className="font-semibold" style={{ color: statusColor }}>
                                {statusLabel}
                              </span>
                            </p>
                            {item.diameter_mm ? (
                              <p className="text-neutral-600">
                                Diameter: <span className="text-neutral-800">{item.diameter_mm} mm</span>
                              </p>
                            ) : null}
                            {item.depth_m ? (
                              <p className="text-neutral-600">
                                Kedalaman: <span className="text-neutral-800">{item.depth_m} m</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </Fragment>
                ))}
              </Fragment>
            );
          })}
        </FeatureGroup>
      )}
    </>
  );
}
