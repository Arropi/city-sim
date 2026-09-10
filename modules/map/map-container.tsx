'use client'
import dynamic from "next/dynamic";

const MapDynamicLeaflet = dynamic(() => import("@/modules/map/map-leaflet"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export function MapContainer() {
  return <MapDynamicLeaflet />;
}
