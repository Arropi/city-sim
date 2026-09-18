'use client'
import dynamic from "next/dynamic";

import type { CityBoundaries } from "@/lib/utils";
import type { CityGrid, UndergroundNetworkData, RiverData } from "@/app/map/[slugid]/actions";

const MapDynamicLeaflet = dynamic(() => import("@/modules/map/map-leaflet"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export function MapContainer({
  boundariesCity,
  cityGrids,
  drainase,
  rivers,
}: {
  boundariesCity?: CityBoundaries | null;
  cityGrids?: CityGrid[];
  drainase?: UndergroundNetworkData[];
  rivers?: RiverData[];
}) {
  return (
    <MapDynamicLeaflet
      boundariesCity={boundariesCity}
      cityGrids={cityGrids}
      drainase={drainase}
      rivers={rivers}
    />
  );
}
