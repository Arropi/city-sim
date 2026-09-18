"use client";

import { Sparkles, Info, X, Loader2 } from "lucide-react";
import { MADIUN_GEO } from "@/constants/helper";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Map as LeafletMapType } from "leaflet";
import L from "leaflet";
import { useMapContext } from "@/hooks/useMapContext";
import { parseGeoJSONCoordinates } from "@/lib/utils";
import type { RecommendationResult } from "@/app/api/ai-recommendation/route";

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

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function extractFirstCoordinate(coords: unknown): [number, number] | null {
  if (!coords) return null;
  if (Array.isArray(coords)) {
    if (
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      return [coords[0], coords[1]];
    }
    for (const item of coords) {
      const found = extractFirstCoordinate(item);
      if (found) return found;
    }
  }
  return null;
}

export default function RecommendationPanel() {
  const [, setMap] = useState<LeafletMapType | null>(null);
  const { buildings, drainase, rivers, cityStats, flyTo } = useMapContext();

  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showReasons, setShowReasons] = useState<boolean>(false);
  const hasFetchedRef = useRef<boolean>(false);

  const markerPosition: [number, number] = recommendation?.center || MADIUN_GEO.CENTER;

  const handleNavigateToMarker = () => {
    flyTo(markerPosition, MADIUN_GEO.DEFAULT_ZOOM + 1);
  };

  const fetchAiRecommendation = useCallback(async () => {
    try {
      setIsLoading(true);

      // Summarize buildings
      const residential = buildings.filter(
        (b) =>
          (b as { type_id?: string }).type_id === "residential" ||
          (b as { type_name?: string }).type_name?.toLowerCase().includes("rumah")
      ).length;
      const facilities = buildings.filter(
        (b) =>
          (b as { type_id?: string }).type_id === "facilities" ||
          (b as { type_name?: string }).type_name?.toLowerCase().includes("fasilitas")
      ).length;
      const dinings = buildings.filter(
        (b) =>
          (b as { type_id?: string }).type_id === "dinings" ||
          (b as { type_name?: string }).type_name?.toLowerCase().includes("restoran")
      ).length;
      const greenSpaces = buildings.filter(
        (b) =>
          (b as { type_id?: string }).type_id === "greenSpaces" ||
          (b as { type_name?: string }).type_name?.toLowerCase().includes("taman") ||
          (b as { type_name?: string }).type_name?.toLowerCase().includes("rth")
      ).length;
      const unfitCount = buildings.filter(
        (b) => b.is_safe === false || (b.unfit_pct != null && b.unfit_pct >= 40)
      ).length;

      const sampleCentroids: [number, number][] = [];
      for (let i = 0; i < Math.min(buildings.length, 50); i++) {
        const pt = extractFirstCoordinate(
          parseGeoJSONCoordinates(buildings[i].geom || (buildings[i] as { geometry?: unknown }).geometry)
        );
        if (pt) sampleCentroids.push(pt);
      }

      // Summarize drainase
      const drainageCount = drainase.filter(
        (d) => !d.utility_type || d.utility_type === "drainage"
      ).length;
      const wasteWaterCount = drainase.filter((d) => d.utility_type === "waste_water").length;
      const cleanWaterCount = drainase.filter((d) => d.utility_type === "clean_water").length;

      const sampleEndpoints: [number, number][] = [];
      for (let i = 0; i < Math.min(drainase.length, 30); i++) {
        const pt = extractFirstCoordinate(
          parseGeoJSONCoordinates(drainase[i].geom || (drainase[i] as { geometry?: unknown }).geometry)
        );
        if (pt) sampleEndpoints.push(pt);
      }

      // Summarize rivers
      const riverNames = rivers.map((r) => r.name || "Sungai").filter(Boolean);
      const sampleCoords: [number, number][] = [];
      for (let i = 0; i < Math.min(rivers.length, 25); i++) {
        const pt = extractFirstCoordinate(
          parseGeoJSONCoordinates(rivers[i].geom || (rivers[i] as { geometry?: unknown }).geometry)
        );
        if (pt) sampleCoords.push(pt);
      }

      const res = await fetch("/api/ai-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityStats,
          buildingsSummary: {
            total: buildings.length,
            residential,
            facilities,
            dinings,
            greenSpaces,
            unfitCount,
            sampleCentroids,
          },
          drainaseSummary: {
            total: drainase.length,
            drainageCount,
            wasteWaterCount,
            cleanWaterCount,
            sampleEndpoints,
          },
          riversSummary: {
            total: rivers.length,
            riverNames,
            sampleCoords,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as RecommendationResult;
        if (data && Array.isArray(data.center)) {
          setRecommendation({
            ...data,
            reasons: (data.reasons || []).slice(0, 3),
          });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch AI recommendation:", err);
    } finally {
      setIsLoading(false);
    }
  }, [buildings, drainase, rivers, cityStats]);

  useEffect(() => {
    // Fetch once when component mounts or when core data is ready
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAiRecommendation();
    }
  }, [fetchAiRecommendation]);

  return (
    <div>
      <div className="flex gap-1 items-center justify-between">
        <div className="flex gap-1 items-center">
          <Sparkles className="w-4 h-4 text-neutral-800" />
          <span>Rekomendasi Pembangunan</span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>AI Menganalisis...</span>
          </div>
        )}
      </div>

      <div className="relative mt-1">
        {/* Tombol icon 'i' di pojok kanan atas map */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowReasons((prev) => !prev);
          }}
          className="absolute top-2 right-2 z-[1000] p-1.5 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow-md border border-neutral-200 transition-all hover:scale-105 active:scale-95"
          title="Lihat Alasan Rekomendasi"
          aria-label="Lihat Alasan Rekomendasi"
        >
          <Info className="w-4 h-4 text-neutral-700" />
        </button>

        {/* Modal / Card Alasan Rekomendasi (Maksimal 3 Poin Alasan) */}
        {showReasons && (
          <div
            className="absolute inset-x-2 top-2 bottom-2 z-[1001] bg-white/95 backdrop-blur-xs rounded-xl p-3 shadow-lg border border-neutral-200 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Alasan Rekomendasi AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReasons(false)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  aria-label="Tutup"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {recommendation?.title && (
                <p className="text-[11px] font-semibold text-neutral-900 mb-2 leading-tight">
                  {recommendation.title}
                </p>
              )}

              <ul className="space-y-1.5 text-[11px] text-neutral-600">
                {(recommendation?.reasons || [
                  "Lokasi berada pada titik strategis yang membutuhkan peningkatan infrastruktur.",
                  "Aman dari garis sempadan sungai (> 3 meter) dan tidak menimpa bangunan eksisting.",
                  "Memberikan dampak positif signifikan terhadap indikator kota saat ini.",
                ])
                  .slice(0, 3)
                  .map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{reason}</span>
                    </li>
                  ))}
              </ul>

              {recommendation?.impact && (
                <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[10px] text-neutral-500 leading-tight">
                  <span className="font-semibold text-neutral-700">Dampak: </span>
                  {recommendation.impact}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowReasons(false);
                handleNavigateToMarker();
              }}
              className="mt-2 w-full py-1 text-[11px] font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-center"
            >
              Tuju Titik Ini di Peta
            </button>
          </div>
        )}

        <MapContainer
          ref={setMap}
          center={markerPosition}
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
          <RecenterMap center={markerPosition} />
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
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        * Click untuk mengetahui detail posisi pada peta
      </p>
    </div>
  );
}
