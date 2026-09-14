"use client";

import { Sparkles } from "lucide-react";
import { MADIUN_GEO } from "@/constants/helper";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import type { Map as LeafletMapType } from "leaflet";
import L from "leaflet";
import { useMapContext } from "@/hooks/useMapContext";

// Fix default marker icon issue in Next.js / Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({
    click: () => {
      onClick();
    },
  });
  return null;
}

export default function RecommendationPanel() {
  const [map, setMap] = useState<LeafletMapType | null>(null);
  const { flyTo } = useMapContext();

  const markerPosition: [number, number] = MADIUN_GEO.CENTER;

  const handleNavigateToMarker = () => {
    flyTo(markerPosition, MADIUN_GEO.DEFAULT_ZOOM + 1);
  };

  return (
    <div>
      <div className="flex gap-1 items-center">
        <Sparkles /> <span>Rekomendasi Pembangunan</span>
      </div>
      <MapContainer
        ref={setMap}
        center={MADIUN_GEO.CENTER}
        zoom={MADIUN_GEO.DEFAULT_ZOOM + 1}
        zoomControl={false}
        scrollWheelZoom={false}
        boxZoom={false}
        doubleClickZoom={false}
        dragging={false}
        touchZoom={false}
        preferCanvas={true}
        className="w-full aspect-video z-0 cursor-crosshair rounded-2xl"
      >
        <MapClickHandler onClick={handleNavigateToMarker} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={markerPosition}
          icon={DefaultIcon}
          eventHandlers={{
            click: handleNavigateToMarker,
          }}
        />
      </MapContainer>
      <p className="text-xs text-muted-foreground">* Click untuk mengetahui detail posisi pada peta</p>
    </div>
  );
}
