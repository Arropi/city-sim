import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { Home, Building, Building2, Percent, Waves, Recycle, Droplets, Flame, Users, UserCheck, Trash2, Trees } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIcon(iconName: string) {
  const IconMap = {
    Home,
    Building,
    Building2,
    Percent,
    Waves,
    Recycle,
    Droplets,
    Flame,
    Users,
    UserCheck,
    Trash2,
    Trees,
    WavePlus: Waves,
  }
  return IconMap[iconName as keyof typeof IconMap] || Home;
}

import type { LatLngExpression } from "leaflet";

export type CityBoundaries =
  | LatLngExpression[]
  | LatLngExpression[][]
  | LatLngExpression[][][];

interface GeoJSONGeometry {
  type?: string;
  coordinates?: unknown;
}

export function parseGeoJSONCoordinates(
  input: GeoJSONGeometry | unknown
): CityBoundaries | null {
  if (!input) return null;

  const geometry = input as { coordinates?: unknown };
  const rawCoords = geometry.coordinates ?? input;

  if (!Array.isArray(rawCoords) || rawCoords.length === 0) return null;

  const reverseCoords = (coords: unknown): unknown => {
    if (!Array.isArray(coords) || coords.length === 0) return [];
    if (
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      const [lng, lat] = coords as [number, number];
      return [lat, lng] as [number, number];
    }
    return coords.map(reverseCoords);
  };

  return reverseCoords(rawCoords) as CityBoundaries;
}

/**
 * Memformat angka kepadatan penduduk menjadi format ribuan ringkas (k).
 * Contoh:
 * - 6040 -> "6.04k jiwa" (atau "6.04k" jika includeUnit = false)
 * - 6000 -> "6k jiwa" (atau "6k" jika includeUnit = false)
 * - 6071 -> "6.07k jiwa"
 */
export function formatDensity(
  value: number | string | null | undefined,
  includeUnit = true
): string {
  if (value == null || value === "") {
    return includeUnit ? "0k jiwa" : "0k";
  }

  // Jika berupa string yang sudah berformat 'k'
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/[0-9.]+\s*k(\s*jiwa)?/i.test(trimmed)) {
      if (!includeUnit) {
        return trimmed.replace(/\s*jiwa$/i, "").trim();
      }
      return trimmed.toLowerCase().includes("jiwa") ? trimmed : `${trimmed} jiwa`;
    }
  }

  const num =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/,/g, ""));

  if (isNaN(num) || num <= 0) {
    return includeUnit ? "0k jiwa" : "0k";
  }

  // Jika angka dalam skala ribuan (misal >= 1000: 6040 -> 6.04, 6000 -> 6)
  const numInK = num >= 1000 ? num / 1000 : num;

  // Format hingga 2 desimal tanpa trailing zero yang tidak perlu
  const formatted = parseFloat(numInK.toFixed(2));

  return includeUnit ? `${formatted}k jiwa` : `${formatted}k`;
}

