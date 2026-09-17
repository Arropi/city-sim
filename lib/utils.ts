import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { Home, Building, Building2, Percent, Waves, Recycle, Droplets, Flame, Users, UserCheck, Trash2 } from "lucide-react";

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
