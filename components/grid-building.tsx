"use client";

import React from "react";
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

// Function UI Popup khusus untuk tipe "bangunan"
export function PopupBangunan({ data }: { data?: any }) {
  return (
    <div className="p-1 min-w-[200px] text-xs font-sans text-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2">
        <span className="font-bold text-sm text-neutral-900">
          {data?.name || "Batas Bangunan / Wilayah"}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
          Bangunan
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-neutral-600">
          Status: <span className="font-semibold text-neutral-800">{data?.status || "Aktif"}</span>
        </p>
        <p className="text-neutral-600">
          Keterangan: <span className="text-neutral-800">{data?.description || "Area terdata"}</span>
        </p>
      </div>
    </div>
  );
}

// Function UI Popup khusus untuk tipe "drainase"
export function PopupDrainase({ data }: { data?: any }) {
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

const TypeBuilding = {
  polygon: Polygon,
  rectangle: Rectangle,
  polyline: Polyline,
  "circle-marker": CircleMarker,
};

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
  buildings: "bangunan" | "drainase";
  popup?: boolean;
  data?: any;
  props: T;
}) {
  const Type = TypeBuilding[type] as React.ComponentType<any>;

  return (
    <Type {...props}>
      {popup && (
        <Popup>
          {buildings === "bangunan" ? (
            <PopupBangunan data={data} />
          ) : (
            <PopupDrainase data={data} />
          )}
        </Popup>
      )}
    </Type>
  );
}