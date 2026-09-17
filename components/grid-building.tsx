"use client";

import {
  CircleMarker,
  Polygon,
  Rectangle,
  Polyline,
  Popup,
} from "react-leaflet";
import type {
  PolygonProps,
  RectangleProps,
  PolylineProps,
  CircleMarkerProps,
} from "react-leaflet";

import { cn } from "@/lib/utils";

export type SeverityLevel = "normal" | "warning" | "alert" | "danger";

export interface BuildingPopupData {
  name?: string;
  type_name?: string;
  status?: string;
  description?: string;
  condition?: string | null;
  building_levels?: number;
  rtlh?: number;
  rtlh_score?: number;
  unfit_pct?: number | null;
  severity_level?: SeverityLevel;
  severity_label?: string;
  dimension?: string;
  [key: string]: unknown;
}

export function PopupResidential({ data }: { data?: BuildingPopupData }) {
  const level: SeverityLevel = data?.severity_level || "normal";
  const badgeClasses: Record<SeverityLevel, string> = {
    normal: "bg-emerald-50 text-emerald-700 border-emerald-300",
    warning: "bg-amber-50 text-amber-700 border-amber-300",
    alert: "bg-orange-50 text-orange-700 border-orange-300",
    danger: "bg-red-50 text-red-700 border-red-300",
  };

  const levelBadgeTitle: Record<SeverityLevel, string> = {
    normal: "Aman (< 15%)",
    warning: "Waspada (15 - 39.9%)",
    alert: "Siaga (40 - 69.9%)",
    danger: "Bahaya (≥ 70%)",
  };

  return (
    <div className="p-1 min-w-[220px] text-xs font-sans text-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2 gap-2">
        <span className="font-bold text-sm text-neutral-900 truncate">
          {data?.name || "Batas Bangunan / Wilayah"}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 shrink-0">
          {data?.type_name || "Hunian"}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-neutral-600">Status Kelayakan:</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0",
              badgeClasses[level]
            )}
          >
            {levelBadgeTitle[level]}
          </span>
        </div>
        {data?.unfit_pct !== undefined && data?.unfit_pct !== null && (
          <p className="text-neutral-600">
            Tingkat Unfit:{" "}
            <span className="font-semibold text-neutral-800">
              {Number(data.unfit_pct).toFixed(1)}%
            </span>
          </p>
        )}
        <p className="text-neutral-600">
          Kondisi:{" "}
          <span className="font-semibold text-neutral-800">
            {data?.condition || (level === "normal" ? "Layak Huni" : "Butuh Perbaikan")}
          </span>
        </p>
        {data?.building_levels ? (
          <p className="text-neutral-600">
            Tingkat: <span className="font-semibold text-neutral-800">{data.building_levels} Lantai</span>
          </p>
        ) : null}
        <p className="text-neutral-600">
          Keterangan: <span className="text-neutral-800">{data?.description || "Area pemukiman"}</span>
        </p>
      </div>
    </div>
  );
}

export function PopupFacilities({ data }: { data?: BuildingPopupData }) {
  const level: SeverityLevel = data?.severity_level || "normal";
  const badgeClasses: Record<SeverityLevel, string> = {
    normal: "bg-blue-50 text-blue-700 border-blue-300",
    warning: "bg-amber-50 text-amber-700 border-amber-300",
    alert: "bg-orange-50 text-orange-700 border-orange-300",
    danger: "bg-red-50 text-red-700 border-red-300",
  };

  const levelBadgeTitle: Record<SeverityLevel, string> = {
    normal: "Optimal",
    warning: "Waspada",
    alert: "Siaga (Perbaikan)",
    danger: "Bahaya (Rusak)",
  };

  return (
    <div className="p-1 min-w-[220px] text-xs font-sans text-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2 gap-2">
        <span className="font-bold text-sm text-neutral-900 truncate">
          {data?.name || "Batas Bangunan / Wilayah"}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 shrink-0">
          {data?.type_name || "Fasilitas"}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-neutral-600">Kondisi Fasilitas:</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0",
              badgeClasses[level]
            )}
          >
            {levelBadgeTitle[level]}
          </span>
        </div>
        <p className="text-neutral-600">
          Status: <span className="font-semibold text-neutral-800">{data?.status || "Aktif"}</span>
        </p>
        {data?.condition ? (
          <p className="text-neutral-600">
            Keterangan Kondisi: <span className="font-semibold text-neutral-800">{data.condition}</span>
          </p>
        ) : null}
        {data?.building_levels ? (
          <p className="text-neutral-600">
            Tingkat: <span className="font-semibold text-neutral-800">{data.building_levels} Lantai</span>
          </p>
        ) : null}
        <p className="text-neutral-600">
          Keterangan: <span className="text-neutral-800">{data?.description || "Fasilitas umum / publik"}</span>
        </p>
      </div>
    </div>
  );
}

export function PopupCommercial({ data }: { data?: BuildingPopupData }) {
  const level: SeverityLevel = data?.severity_level || "normal";
  const badgeClasses: Record<SeverityLevel, string> = {
    normal: "bg-orange-50 text-orange-700 border-orange-300",
    warning: "bg-amber-50 text-amber-700 border-amber-300",
    alert: "bg-orange-50 text-orange-700 border-orange-300",
    danger: "bg-red-50 text-red-700 border-red-300",
  };

  const levelBadgeTitle: Record<SeverityLevel, string> = {
    normal: "Optimal",
    warning: "Waspada",
    alert: "Siaga (Perbaikan)",
    danger: "Bahaya (Rusak)",
  };

  return (
    <div className="p-1 min-w-[220px] text-xs font-sans text-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2 gap-2">
        <span className="font-bold text-sm text-neutral-900 truncate">
          {data?.name || "Batas Bangunan / Wilayah"}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 shrink-0">
          {data?.type_name || "Komersial"}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-neutral-600">Kondisi Bangunan:</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0",
              badgeClasses[level]
            )}
          >
            {levelBadgeTitle[level]}
          </span>
        </div>
        <p className="text-neutral-600">
          Status: <span className="font-semibold text-neutral-800">{data?.status || "Aktif"}</span>
        </p>
        {data?.condition ? (
          <p className="text-neutral-600">
            Keterangan Kondisi: <span className="font-semibold text-neutral-800">{data.condition}</span>
          </p>
        ) : null}
        {data?.building_levels ? (
          <p className="text-neutral-600">
            Tingkat: <span className="font-semibold text-neutral-800">{data.building_levels} Lantai</span>
          </p>
        ) : null}
        <p className="text-neutral-600">
          Keterangan: <span className="text-neutral-800">{data?.description || "Area niaga & kuliner"}</span>
        </p>
      </div>
    </div>
  );
}

export function PopupSpaceGreen({ data }: { data?: BuildingPopupData }) {
  const level: SeverityLevel = data?.severity_level || "normal";
  const badgeClasses: Record<SeverityLevel, string> = {
    normal: "bg-emerald-50 text-emerald-700 border-emerald-300",
    warning: "bg-amber-50 text-amber-700 border-amber-300",
    alert: "bg-orange-50 text-orange-700 border-orange-300",
    danger: "bg-red-50 text-red-700 border-red-300",
  };

  const levelBadgeTitle: Record<SeverityLevel, string> = {
    normal: "Optimal / Asri",
    warning: "Waspada",
    alert: "Siaga (Perawatan)",
    danger: "Bahaya (Kritis)",
  };

  return (
    <div className="p-1 min-w-[220px] text-xs font-sans text-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2 gap-2">
        <span className="font-bold text-sm text-neutral-900 truncate">
          {data?.name || "Batas Bangunan / Wilayah"}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 shrink-0">
          {data?.type_name || "RTH"}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-neutral-600">Kondisi Area:</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0",
              badgeClasses[level]
            )}
          >
            {levelBadgeTitle[level]}
          </span>
        </div>
        <p className="text-neutral-600">
          Status: <span className="font-semibold text-neutral-800">{data?.status || "Terawat"}</span>
        </p>
        {data?.condition ? (
          <p className="text-neutral-600">
            Keterangan Kondisi: <span className="font-semibold text-neutral-800">{data.condition}</span>
          </p>
        ) : null}
        <p className="text-neutral-600">
          Keterangan: <span className="text-neutral-800">{data?.description || "Taman & Ruang Terbuka Hijau"}</span>
        </p>
      </div>
    </div>
  );
}

export function PopupDrainase({ data }: { data?: BuildingPopupData }) {
  return (
    <div className="p-1 min-w-[200px] text-xs font-sans text-neutral-800">
      <div className="flex items-center justify-between border-b border-cyan-200 pb-1.5 mb-2">
        <span className="font-bold text-sm text-neutral-900">
          {data?.name || "Jaringan Drainase"}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-100 text-cyan-800">
          Drainase
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-neutral-600">
          Kondisi Aliran: <span className="font-semibold text-cyan-800">{data?.condition || "Lancar"}</span>
        </p>
        <p className="text-neutral-600">
          Lebar/Dimensi: <span className="text-neutral-800">{data?.dimension || "Standar"}</span>
        </p>
      </div>
    </div>
  );
}

export default function GridBuilding<
  T extends PolygonProps | RectangleProps | PolylineProps | CircleMarkerProps
>({
  type,
  buildings,
  popup = false,
  data,
  props,
}: {
  type: "polygon" | "rectangle" | "polyline" | "circle-marker";
  buildings: "residential" | "commercial" | "facilities" | "drainase" | "space-green";
  popup?: boolean;
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
        ) : (
          <PopupDrainase data={data} />
        )}
      </Popup>
    );
  };

  if (type === "polygon") {
    return <Polygon {...(props as PolygonProps)}>{renderPopup()}</Polygon>;
  }
  if (type === "rectangle") {
    return <Rectangle {...(props as RectangleProps)}>{renderPopup()}</Rectangle>;
  }
  if (type === "polyline") {
    return <Polyline {...(props as PolylineProps)}>{renderPopup()}</Polyline>;
  }
  return <CircleMarker {...(props as CircleMarkerProps)}>{renderPopup()}</CircleMarker>;
}