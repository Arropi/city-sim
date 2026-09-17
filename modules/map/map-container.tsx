'use client'
import dynamic from "next/dynamic";

import type { CityBoundaries } from "@/lib/utils";
import type { CityGrid, UndergroundNetworkData } from "@/app/map/[slugid]/actions";

const MapDynamicLeaflet = dynamic(() => import("@/modules/map/map-leaflet"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export function MapContainer({
  boundariesCity,
  cityGrids,
  drainase,
}: {
  boundariesCity?: CityBoundaries | null;
  cityGrids?: CityGrid[];
  drainase?: UndergroundNetworkData[];
}) {
  return (
    <MapDynamicLeaflet
      boundariesCity={boundariesCity}
      cityGrids={cityGrids}
      drainase={drainase}
    />
  );
}
