"use client";

import React, { Fragment } from "react";
import {
  CircleMarker,
  Polygon,
  Rectangle,
  Polyline,
  Popup,
  Tooltip,
} from "react-leaflet";
import type {
  PolygonProps,
  RectangleProps,
  PolylineProps,
  CircleMarkerProps,
} from "react-leaflet";

import { cn, parseGeoJSONCoordinates } from "@/lib/utils";
import type { UndergroundNetworkData, RiverData } from "@/types";

export type SeverityLevel = "normal" | "warning" | "alert" | "danger";

export interface BuildingPopupData {
  id?: string | number;
  name?: string;
  type_name?: string;
  type_id?: string;
  type?: string;
  status?: string;
  description?: string;
  condition?: string | null;
  building_levels?: number;
  building_squares?: number;
  has_clean_water?: boolean;
  has_water_disposal?: boolean;
  service_radius?: number;
  gridId?: string;
  runoff_coef?: number;
  rtlh?: number;
  rtlh_score?: number;
  unfit_pct?: number | null;
  severity_level?: SeverityLevel;
  severity_label?: string;
  dimension?: string;
  width_m?: number;
  length_m?: number;
  area_sqm?: number;
  [key: string]: unknown;
}

export function PopupResidential({ data }: { data?: BuildingPopupData }) {
  const unfit =
    data?.unfit_pct !== undefined && data?.unfit_pct !== null
      ? Number(data.unfit_pct)
      : null;

  const isBahaya = unfit !== null && unfit >= 70;
  const isSiaga = unfit !== null && unfit >= 40 && unfit < 70;
  const isWaspada = unfit !== null && unfit > 14.9 && unfit < 40;

  let statusBg = "bg-emerald-50 text-emerald-800 border-emerald-300";
  let statusText = "Aman (< 15%)";

  if (isBahaya) {
    statusBg = "bg-red-50 text-red-800 border-red-300";
    statusText = "Bahaya (≥ 70%)";
  } else if (isSiaga) {
    statusBg = "bg-orange-50 text-orange-800 border-orange-300";
    statusText = "Siaga (40 - 69.9%)";
  } else if (isWaspada) {
    statusBg = "bg-neutral-100 text-neutral-800 border-neutral-300";
    statusText = "Waspada (15 - 39.9%)";
  }

  return (
    <div className="p-1 min-w-[240px] text-xs font-sans text-neutral-800">
      {/* Title full satu baris line-clamp-1 (tanpa badge Pemukiman) */}
      <div className="font-bold text-sm text-neutral-900 line-clamp-1">
        {data?.name || "Hunian Warga"}
      </div>

      {/* Garis Separator */}
      <div className="border-b border-neutral-200 my-1.5" />

      {/* Full garis/badge status: hijau aman kurang dari 15% dan di ujungnya di-bold nilai unfitnya */}
      <div
        className={cn(
          "w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-semibold border mb-2",
          statusBg
        )}
      >
        <span>{statusText}</span>
        {unfit !== null && <span className="font-bold">{unfit.toFixed(1)}%</span>}
      </div>

      {/* Rincian: Akses air bersih, pembuangan limbah, luas, tingkat lantai, dan koefisien limpahan */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Akses Air Bersih:</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0",
              data?.has_clean_water
                ? "bg-cyan-50 text-cyan-700 border border-cyan-300"
                : "bg-neutral-100 text-neutral-600 border border-neutral-300"
            )}
          >
            {data?.has_clean_water ? "Tersedia" : "Belum Terhubung"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Pembuangan Limbah:</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0",
              data?.has_water_disposal
                ? "bg-teal-50 text-teal-700 border border-teal-300"
                : "bg-neutral-100 text-neutral-600 border border-neutral-300"
            )}
          >
            {data?.has_water_disposal ? "Tersedia" : "Belum Terhubung"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Luas Bangunan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.building_squares || 36} m²
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Tingkat Lantai:</span>
          <span className="font-semibold text-neutral-800">
            {data?.building_levels || 1} Lantai
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Koefisien Limpasan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.runoff_coef ?? 0.7}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PopupFacilities({ data }: { data?: BuildingPopupData }) {
  const condition = data?.condition || "Optimal";
  const condLower = condition.toLowerCase();
  const isAlert =
    condLower.includes("rusak") ||
    condLower.includes("perbaikan") ||
    condLower.includes("siaga");
  const isWarning =
    condLower.includes("waspada") || condLower.includes("pemantauan");

  const statusBg = isAlert
    ? "bg-orange-50 text-orange-800 border-orange-300"
    : isWarning
    ? "bg-neutral-100 text-neutral-800 border-neutral-300"
    : "bg-blue-50 text-blue-800 border-blue-300";

  return (
    <div className="p-1 min-w-[230px] text-xs font-sans text-neutral-800">
      <div className="font-bold text-sm text-neutral-900 line-clamp-1">
        {data?.name || "Fasilitas Umum"}
      </div>

      <div className="border-b border-neutral-200 my-1.5" />

      <div
        className={cn(
          "w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-semibold border mb-2",
          statusBg
        )}
      >
        <span>Kondisi Fasilitas</span>
        <span className="font-bold">{condition}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Luas Bangunan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.building_squares || 120} m²
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Tinggi Lantai:</span>
          <span className="font-semibold text-neutral-800">
            {data?.building_levels || 1} Lantai
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Radius Layanan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.service_radius ?? 200} m
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Koefisien Limpasan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.runoff_coef ?? 0.7}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PopupCommercial({ data }: { data?: BuildingPopupData }) {
  const condition = data?.condition || "Optimal";
  const condLower = condition.toLowerCase();
  const isAlert =
    condLower.includes("rusak") ||
    condLower.includes("perbaikan") ||
    condLower.includes("siaga");
  const isWarning =
    condLower.includes("waspada") || condLower.includes("pemantauan");

  const statusBg = isAlert
    ? "bg-orange-50 text-orange-800 border-orange-300"
    : isWarning
    ? "bg-neutral-100 text-neutral-800 border-neutral-300"
    : "bg-amber-50 text-amber-800 border-amber-300";

  return (
    <div className="p-1 min-w-[230px] text-xs font-sans text-neutral-800">
      <div className="font-bold text-sm text-neutral-900 line-clamp-1">
        {data?.name || "Tempat Makan / Kuliner"}
      </div>

      <div className="border-b border-neutral-200 my-1.5" />

      <div
        className={cn(
          "w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-semibold border mb-2",
          statusBg
        )}
      >
        <span>Kondisi Bangunan</span>
        <span className="font-bold">{condition}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Luas Bangunan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.building_squares || 80} m²
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Tinggi Lantai:</span>
          <span className="font-semibold text-neutral-800">
            {data?.building_levels || 1} Lantai
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Radius Layanan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.service_radius ?? 150} m
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Koefisien Limpasan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.runoff_coef ?? 0.7}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PopupSpaceGreen({ data }: { data?: BuildingPopupData }) {
  const condition = data?.condition || "Optimal / Asri";
  const condLower = condition.toLowerCase();
  const isAlert =
    condLower.includes("kritis") ||
    condLower.includes("rusak") ||
    condLower.includes("siaga");
  const isWarning =
    condLower.includes("waspada") || condLower.includes("pemantauan");

  const statusBg = isAlert
    ? "bg-orange-50 text-orange-800 border-orange-300"
    : isWarning
    ? "bg-neutral-100 text-neutral-800 border-neutral-300"
    : "bg-emerald-50 text-emerald-800 border-emerald-300";

  return (
    <div className="p-1 min-w-[230px] text-xs font-sans text-neutral-800">
      <div className="font-bold text-sm text-neutral-900 line-clamp-1">
        {data?.name || "Ruang Terbuka Hijau"}
      </div>

      <div className="border-b border-neutral-200 my-1.5" />

      <div
        className={cn(
          "w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-semibold border mb-2",
          statusBg
        )}
      >
        <span>Kondisi Area</span>
        <span className="font-bold">{condition}</span>
      </div>

      {/* Detail Ruang Terbuka Hijau tanpa tinggi */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Luas Area:</span>
          <span className="font-semibold text-neutral-800">
            {data?.building_squares || 250} m²
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Radius Layanan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.service_radius ?? 300} m
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-neutral-500">Koefisien Limpasan:</span>
          <span className="font-semibold text-neutral-800">
            {data?.runoff_coef ?? 0.2}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Interface data untuk popup jaringan bawah tanah (Underground Network).
 */
export interface UndergroundNetworkPopupData {
  id?: string | number;
  name?: string;
  utility_type?: string;
  condition?: string | null;
  status?: string | null;
  diameter_mm?: number | null;
  depth_m?: number | string | null;
  flow_capacity_lps?: number | null;
  service_radius?: number | null;
  node_type?: "inlet" | "outlet" | "pipeline" | string;
  dimension?: string;
  [key: string]: unknown;
}

/**
 * Komponen popup untuk utilitas jaringan bawah tanah (Drainase / Air Bersih / Air Limbah).
 */
export function PopupUndergroundNetwork({
  data,
}: {
  data?: UndergroundNetworkPopupData;
}) {
  const utilType = data?.utility_type || "drainage";
  const isDrainage = utilType.includes("drain");
  const isCleanWater = utilType.includes("clean") || utilType.includes("bersih");

  const typeLabel = isCleanWater
    ? "Air Bersih"
    : isDrainage
    ? "Drainase"
    : "Air Limbah";

  const status = data?.status || data?.condition || "Optimal";
  const statusLower = status.toLowerCase();
  const isMaintenance =
    statusLower.includes("perawatan") || statusLower.includes("rusak");
  const isWarning =
    statusLower.includes("waspada") || statusLower.includes("warning");

  const statusBg = isMaintenance
    ? "bg-red-50 text-red-800 border-red-300"
    : isWarning
    ? "bg-neutral-100 text-neutral-800 border-neutral-300"
    : "bg-cyan-50 text-cyan-800 border-cyan-300";

  return (
    <div className="p-1 min-w-[230px] text-xs font-sans text-neutral-800">
      <div className="font-bold text-sm text-neutral-900 line-clamp-1">
        {data?.name ||
          (data?.node_type
            ? `Titik ${data.node_type === "inlet" ? "Awal (Inlet)" : "Akhir (Outlet)"}`
            : `Jaringan ${typeLabel} #${data?.id || ""}`)}
      </div>

      <div className="border-b border-neutral-200 my-1.5" />

      <div
        className={cn(
          "w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-semibold border mb-2",
          statusBg
        )}
      >
        <span>Status Jaringan</span>
        <span className="font-bold">{status}</span>
      </div>

      <div className="space-y-1.5">
        {data?.diameter_mm ? (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Diameter Pipa:</span>
            <span className="font-semibold text-neutral-800">
              Ø {data.diameter_mm} mm
            </span>
          </div>
        ) : null}

        {data?.depth_m ? (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Kedalaman:</span>
            <span className="font-semibold text-neutral-800">
              {data.depth_m} m
            </span>
          </div>
        ) : null}

        {data?.flow_capacity_lps ? (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Kapasitas Debit:</span>
            <span className="font-semibold text-neutral-800">
              {data.flow_capacity_lps} L/dtk
            </span>
          </div>
        ) : null}

        {data?.service_radius ? (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Radius Layanan:</span>
            <span className="font-semibold text-neutral-800">
              {data.service_radius} m
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const PopupDrainase = PopupUndergroundNetwork;

/**
 * Komponen popup untuk fitur alami sungai.
 */
export function PopupRiver({ data }: { data?: BuildingPopupData }) {
  return (
    <div className="p-1 min-w-[230px] text-xs font-sans text-neutral-800">
      <div className="font-bold text-sm text-neutral-900 line-clamp-1">
        {data?.name || "Aliran Sungai"}
      </div>

      <div className="border-b border-neutral-200 my-1.5" />

      <div className="w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-semibold border mb-2 bg-sky-50 text-sky-800 border-sky-300">
        <span>Kategori Sungai</span>
        <span className="font-bold">
          {data?.type_name || (data?.type as string) || "Aliran Alami"}
        </span>
      </div>

      <div className="space-y-1.5">
        {data?.width_m ? (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Lebar Sungai:</span>
            <span className="font-semibold text-neutral-800">{data.width_m} m</span>
          </div>
        ) : null}

        {data?.length_m ? (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Panjang Aliran:</span>
            <span className="font-semibold text-neutral-800">
              {Number(data.length_m).toFixed(1)} m
            </span>
          </div>
        ) : null}

        {data?.area_sqm ? (
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-neutral-500">Luas Permukaan:</span>
            <span className="font-semibold text-neutral-800">
              {Number(data.area_sqm).toFixed(1)} m²
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Ekstraksi titik awal (inlet) dan titik akhir (outlet) dari polyline koordinat jaringan.
 */
export function getEndpoints(
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

/**
 * Komponen representasi elemen poligon / polyline pada peta Leaflet.
 */
export default function GridBuilding<
  T extends PolygonProps | RectangleProps | PolylineProps | CircleMarkerProps
>({
  type,
  buildings,
  popup = false,
  tooltip = true,
  data,
  props,
}: {
  type: "polygon" | "rectangle" | "polyline" | "circle-marker";
  buildings:
    | "residential"
    | "commercial"
    | "facilities"
    | "drainase"
    | "space-green"
    | "river";
  popup?: boolean;
  tooltip?: boolean;
  data?: BuildingPopupData;
  props: T;
}) {
  const renderPopup = () => {
    if (!popup) return null;
    return (
      <Popup>
        {buildings === "residential" ? (
          <PopupResidential data={data} />
        ) : buildings === "facilities" ? (
          <PopupFacilities data={data} />
        ) : buildings === "commercial" ? (
          <PopupCommercial data={data} />
        ) : buildings === "space-green" ? (
          <PopupSpaceGreen data={data} />
        ) : buildings === "river" ? (
          <PopupRiver data={data} />
        ) : (
          <PopupUndergroundNetwork data={data as UndergroundNetworkPopupData} />
        )}
      </Popup>
    );
  };

  const renderTooltip = () => {
    if (!tooltip || !data) return null;
    // Tooltip saat hover hanya dimunculkan khusus untuk objek sungai
    if (buildings === "river") {
      return (
        <Tooltip sticky direction="top">
          <div className="text-xs font-sans p-0.5">
            <span className="font-bold text-sky-800">{data.name || "Sungai"}</span>
            {data.width_m && (
              <p className="text-[11px] text-neutral-600">Lebar: {data.width_m} m</p>
            )}
          </div>
        </Tooltip>
      );
    }
    return null;
  };

  if (type === "polygon") {
    return (
      <Polygon {...(props as PolygonProps)}>
        {renderTooltip()}
        {renderPopup()}
      </Polygon>
    );
  }
  if (type === "rectangle") {
    return (
      <Rectangle {...(props as RectangleProps)}>
        {renderTooltip()}
        {renderPopup()}
      </Rectangle>
    );
  }
  if (type === "polyline") {
    return (
      <Polyline {...(props as PolylineProps)}>
        {renderTooltip()}
        {renderPopup()}
      </Polyline>
    );
  }
  return (
    <CircleMarker {...(props as CircleMarkerProps)}>
      {renderTooltip()}
      {renderPopup()}
    </CircleMarker>
  );
}

/**
 * Komponen terpadu representasi Sungai pada peta melalui GridBuilding.
 */
export function GridRiver({ data }: { data: RiverData }) {
  const positions = parseGeoJSONCoordinates(data.geom || data.geometry);
  if (!positions || (Array.isArray(positions) && positions.length === 0)) {
    return null;
  }

  const riverPayload: BuildingPopupData = {
    id: data.id,
    name: data.name || "Aliran Sungai",
    type_name: data.type || "Sungai",
    type: data.type,
    width_m: data.width_m,
    length_m: data.length_m,
    area_sqm: data.area_sqm,
  };

  return (
    <GridBuilding
      type="polyline"
      buildings="river"
      popup={true}
      tooltip={true}
      data={riverPayload}
      props={{
        positions: positions as [number, number][] | [number, number][][],
        color: "#0284C7",
        weight: Math.min(Math.max(Number(data.width_m) || 3, 3), 8),
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
}

/**
 * Komponen terpadu Underground Network (pipa dan titik inlet/outlet)
 * yang memanfaatkan GridBuilding dan popup terstandarisasi.
 */
export function GridUndergroundNetwork({
  data,
  showEndpoints = true,
}: {
  data: UndergroundNetworkData;
  showEndpoints?: boolean;
}) {
  const positions = parseGeoJSONCoordinates(data.geom);
  if (!positions || (Array.isArray(positions) && positions.length === 0)) {
    return null;
  }

  const status = (data.status || "optimal").toLowerCase();
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

  const endpoints = showEndpoints ? getEndpoints(positions) : [];

  const popupPayload: UndergroundNetworkPopupData = {
    id: data.id,
    name: `Jaringan ${data.utility_type || "Drainase"} #${data.id}`,
    utility_type: data.utility_type || "drainage",
    status: statusLabel,
    condition: statusLabel,
    diameter_mm: data.diameter_mm,
    depth_m: data.depth_m,
    flow_capacity_lps: data.flow_capacity_lps,
    service_radius: data.service_radius ?? 100,
    dimension: data.diameter_mm
      ? `Ø ${data.diameter_mm} mm (Kedalaman: ${data.depth_m || "-"} m)`
      : `${data.depth_m || "-"} m`,
  };

  return (
    <Fragment>
      {/* Pipa Jalur Jaringan Bawah Tanah via GridBuilding */}
      <GridBuilding
        type="polyline"
        buildings="drainase"
        popup={true}
        data={popupPayload as BuildingPopupData}
        props={{
          positions: positions as [number, number][] | [number, number][][],
          color: statusColor,
          weight: 4,
          opacity: 0.9,
        }}
      />

      {/* Titik-titik Node Ujung Pipa (Inlet & Outlet) */}
      {endpoints.map((ep, idx) => (
        <Fragment key={`ep-${data.id}-${idx}`}>
          {/* Titik Awal (Inlet) */}
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
            <Popup>
              <PopupUndergroundNetwork
                data={{
                  ...popupPayload,
                  node_type: "inlet",
                  name: `Titik Awal (Inlet) #${data.id}`,
                }}
              />
            </Popup>
          </CircleMarker>

          {/* Titik Akhir (Outlet) */}
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
            <Popup>
              <PopupUndergroundNetwork
                data={{
                  ...popupPayload,
                  node_type: "outlet",
                  name: `Titik Akhir (Outlet) #${data.id}`,
                }}
              />
            </Popup>
          </CircleMarker>
        </Fragment>
      ))}
    </Fragment>
  );
}