'use client'
import dynamic from "next/dynamic";

import type { CityBoundaries } from "@/lib/utils";

const MapDynamicLeaflet = dynamic(() => import("@/modules/map/map-leaflet"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export function MapContainer({
  boundariesCity,
}: {
  boundariesCity?: CityBoundaries | null;
}) {
  return <MapDynamicLeaflet boundariesCity={boundariesCity} />;
}
