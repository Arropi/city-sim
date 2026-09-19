import type { UndergroundNetworkData, BuildingData, RiverData } from "@/types";
import { parseGeoJSONCoordinates } from "@/lib/utils";

/**
 * Menghitung jarak Haversine antara dua titik koordinat (lat, lng) dalam satuan meter.
 */
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Menghitung luas poligon dalam meter persegi (m²) dari titik-titik koordinat [lat, lng].
 * Menggunakan proyeksi planar ekuivalen lokal dan Shoelace formula.
 */
export function calculatePolygonAreaM2(points: [number, number][]): number {
  if (!points || points.length < 3) return 0;

  // Hitung rata-rata lintang untuk faktor konversi bujur ke meter
  let sumLat = 0;
  for (const pt of points) {
    sumLat += pt[0];
  }
  const meanLat = sumLat / points.length;
  const cosLat = Math.cos((meanLat * Math.PI) / 180);

  const mPerDegLat = 111139;
  const mPerDegLng = 111139 * cosLat;

  const [originLat, originLng] = points[0];

  // Konversi setiap titik koordinat ke meter planar relatif terhadap titik pertama
  const planarPoints = points.map(([lat, lng]) => [
    (lng - originLng) * mPerDegLng,
    (lat - originLat) * mPerDegLat,
  ]);

  // Shoelace formula
  let area = 0;
  for (let i = 0; i < planarPoints.length; i++) {
    const j = (i + 1) % planarPoints.length;
    area += planarPoints[i][0] * planarPoints[j][1];
    area -= planarPoints[j][0] * planarPoints[i][1];
  }

  return Math.round(Math.abs(area) / 2);
}

/**
 * Menghitung jarak terpendek (dalam meter) dari titik P ke ruas garis (segmen) A-B.
 */
export function distancePointToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const [pLat, pLng] = p;
  const [aLat, aLng] = a;
  const [bLat, bLng] = b;

  // Konversi aproksimasi derajat ke meter di sekitar lintang titik A
  const cosLat = Math.cos(((aLat + bLat) / 2 * Math.PI) / 180);
  const mPerDegLat = 110574;
  const mPerDegLng = 111320 * cosLat;

  const dx = (bLng - aLng) * mPerDegLng;
  const dy = (bLat - aLat) * mPerDegLat;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return getDistanceInMeters(pLat, pLng, aLat, aLng);
  }

  const px = (pLng - aLng) * mPerDegLng;
  const py = (pLat - aLat) * mPerDegLat;

  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));
  const projX = aLng + (t * (bLng - aLng));
  const projLat = aLat + (t * (bLat - aLat));

  return getDistanceInMeters(pLat, pLng, projLat, projX);
}

/**
 * Menghitung titik centroid [lat, lng] dari geometri poligon bangunan.
 */
export function getBuildingCentroid(geom: unknown): [number, number] | null {
  if (!geom) return null;

  const parsed = parseGeoJSONCoordinates(geom);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;

  // Kumpulkan semua titik koordinat [lat, lng]
  const points: [number, number][] = [];

  const extractPoints = (item: unknown) => {
    if (!Array.isArray(item)) return;
    if (
      item.length >= 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
    ) {
      points.push([item[0], item[1]]);
      return;
    }
    item.forEach(extractPoints);
  };

  extractPoints(parsed);

  if (points.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;
  for (const pt of points) {
    sumLat += pt[0];
    sumLng += pt[1];
  }

  return [sumLat / points.length, sumLng / points.length];
}

/**
 * Menghitung jarak terpendek (dalam meter) dari titik P ke seluruh polyline (LineString/MultiLineString).
 */
export function distancePointToPolyline(
  point: [number, number],
  positions: unknown
): number {
  if (!positions || !Array.isArray(positions) || positions.length === 0) {
    return Infinity;
  }

  let minDistance = Infinity;

  // MultiLineString: [ [ [lat, lng], ... ], ... ]
  if (
    Array.isArray(positions[0]) &&
    Array.isArray(positions[0][0]) &&
    typeof positions[0][0][0] === "number"
  ) {
    const multi = positions as [number, number][][];
    for (const line of multi) {
      for (let i = 0; i < line.length - 1; i++) {
        const d = distancePointToSegment(point, line[i], line[i + 1]);
        if (d < minDistance) minDistance = d;
      }
    }
    return minDistance;
  }

  // LineString: [ [lat, lng], ... ]
  if (
    Array.isArray(positions[0]) &&
    typeof positions[0][0] === "number" &&
    positions.length >= 2
  ) {
    const line = positions as [number, number][];
    for (let i = 0; i < line.length - 1; i++) {
      const d = distancePointToSegment(point, line[i], line[i + 1]);
      if (d < minDistance) minDistance = d;
    }
    return minDistance;
  }

  return minDistance;
}

/**
 * Memeriksa apakah bangunan berada di dalam radius layanan (service_radius) sebuah underground network.
 */
export function isBuildingInNetworkServiceRadius(
  buildingGeom: unknown,
  network: UndergroundNetworkData,
  defaultRadius = 100
): boolean {
  const centroid = getBuildingCentroid(buildingGeom);
  if (!centroid) return false;

  const netPositions = parseGeoJSONCoordinates(network.geom);
  if (!netPositions) return false;

  const distance = distancePointToPolyline(centroid, netPositions);
  const radius = network.service_radius ?? defaultRadius;

  return distance <= radius;
}

/**
 * Mengevaluasi ketersediaan air bersih (has_clean_water) dan pembuangan air/drainase (has_water_disposal)
 * untuk sebuah bangunan pemukiman berdasarkan data underground network di sekitarnya.
 */
export function evaluateResidentialWaterService(
  building: {
    geom: unknown;
    has_clean_water?: boolean;
    has_water_disposal?: boolean;
  },
  networks: UndergroundNetworkData[] = []
): {
  has_clean_water: boolean;
  has_water_disposal: boolean;
} {
  let hasCleanWater = Boolean(building.has_clean_water);
  let hasWaterDisposal = Boolean(building.has_water_disposal);

  // Jika keduanya sudah true, tidak perlu kalkulasi ulang spasial
  if (hasCleanWater && hasWaterDisposal) {
    return { has_clean_water: true, has_water_disposal: true };
  }

  const centroid = getBuildingCentroid(building.geom);
  if (!centroid || !networks || networks.length === 0) {
    return {
      has_clean_water: hasCleanWater,
      has_water_disposal: hasWaterDisposal,
    };
  }

  for (const net of networks) {
    const utilType = (net.utility_type || "").toLowerCase();
    const isCleanWaterNet =
      utilType.includes("clean") ||
      utilType.includes("bersih") ||
      utilType.includes("pdam") ||
      (utilType.includes("water") && !utilType.includes("waste"));

    const isWaterDisposalNet =
      utilType.includes("drain") ||
      utilType.includes("waste") ||
      utilType.includes("limbah") ||
      utilType.includes("got") ||
      utilType.includes("saluran");

    const netPositions = parseGeoJSONCoordinates(net.geom);
    if (!netPositions) continue;

    const radius = Number(net.service_radius) || 100; // Default service radius 100m
    const distance = distancePointToPolyline(centroid, netPositions);

    if (distance <= radius) {
      if (isCleanWaterNet) {
        hasCleanWater = true;
      }
      if (isWaterDisposalNet) {
        hasWaterDisposal = true;
      }
    }

    if (hasCleanWater && hasWaterDisposal) {
      break;
    }
  }

  return {
    has_clean_water: hasCleanWater,
    has_water_disposal: hasWaterDisposal,
  };
}

/**
 * Menghitung nilai unfit_pct hasil renovasi bangunan residential:
 * - has_clean_water memiliki penalti 8 poin jika masih false.
 * - has_water_disposal memiliki penalti 7 poin jika masih false.
 * - Jika keduanya false, unfit_pct tetap di angka 15% (masuk kategori waspada, tidak langsung safe).
 * - Jika keduanya true, unfit_pct = 0% (sepenuhnya aman / safe).
 */
export function calculateRenovationUnfit(
  has_clean_water: boolean,
  has_water_disposal: boolean
): {
  unfit_pct: number;
  is_safe: boolean;
  status: string;
  condition: string;
} {
  let penalty = 0;
  if (!has_clean_water) penalty += 8;
  if (!has_water_disposal) penalty += 7;

  const unfit_pct = penalty;
  // Sesuai aturan: aman jika < 15%, waspada jika 15 - 39.9%
  const is_safe = unfit_pct < 15;

  let status = "Layak Huni";
  let condition = "Baik (Hasil Renovasi)";

  if (!is_safe) {
    // unfit_pct === 15%
    status = "Waspada";
    condition = "Hasil Renovasi (Sanitasi Belum Terhubung Jaringan)";
  } else if (unfit_pct > 0) {
    status = "Layak Huni";
    condition = "Cukup Baik (Hasil Renovasi Parsial)";
  }

  return {
    unfit_pct,
    is_safe,
    status,
    condition,
  };
}

/**
 * Menghitung bounding box poligon [minLat, maxLat, minLng, maxLng].
 */
export function getPolygonBounds(points: [number, number][]) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Memeriksa apakah sebuah titik berada di dalam poligon (Ray-Casting Algorithm).
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const intersect =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Memeriksa apakah dua ruas garis p1-p2 dan p3-p4 berpotongan.
 */
function ccw(
  a: [number, number],
  b: [number, number],
  c: [number, number]
): boolean {
  return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
}

export function doLineSegmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean {
  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

/**
 * Memeriksa apakah dua poligon saling bertumpukan / overlap.
 */
export function doPolygonsOverlap(
  poly1: [number, number][],
  poly2: [number, number][]
): boolean {
  if (poly1.length < 3 || poly2.length < 3) return false;

  // 1. Fast bounding box check
  const b1 = getPolygonBounds(poly1);
  const b2 = getPolygonBounds(poly2);
  if (
    b1.maxLat < b2.minLat ||
    b1.minLat > b2.maxLat ||
    b1.maxLng < b2.minLng ||
    b1.minLng > b2.maxLng
  ) {
    return false;
  }

  // 2. Vertex inside check
  for (const pt of poly1) {
    if (isPointInPolygon(pt, poly2)) return true;
  }
  for (const pt of poly2) {
    if (isPointInPolygon(pt, poly1)) return true;
  }

  // 3. Edge intersection check
  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    const p2 = poly1[(i + 1) % poly1.length];
    for (let j = 0; j < poly2.length; j++) {
      const q1 = poly2[j];
      const q2 = poly2[(j + 1) % poly2.length];
      if (doLineSegmentsIntersect(p1, p2, q1, q2)) return true;
    }
  }

  return false;
}

/**
 * Mengonversi geometri bangunan menjadi poligon datar [number, number][].
 */
export function getSinglePolygonPoints(geom: unknown): [number, number][] {
  const parsed = parseGeoJSONCoordinates(geom);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return [];

  // Jika format [[lat, lng], ...]
  if (
    parsed.length > 0 &&
    Array.isArray(parsed[0]) &&
    typeof parsed[0][0] === "number" &&
    typeof parsed[0][1] === "number"
  ) {
    return parsed as [number, number][];
  }

  // Jika MultiPolygon [ [ [lat, lng], ... ] ]
  if (
    Array.isArray(parsed[0]) &&
    Array.isArray(parsed[0][0]) &&
    typeof parsed[0][0][0] === "number"
  ) {
    return parsed[0] as [number, number][];
  }

  return [];
}

/**
 * Mentranslasikan seluruh verteks poligon dari centroid asal ke centroid target.
 */
export function translatePolygon(
  polygon: [number, number][],
  currentCentroid: [number, number],
  targetCentroid: [number, number]
): [number, number][] {
  const deltaLat = targetCentroid[0] - currentCentroid[0];
  const deltaLng = targetCentroid[1] - currentCentroid[1];
  return polygon.map(([lat, lng]) => [lat + deltaLat, lng + deltaLng]);
}

/**
 * Memeriksa apakah poligon target overlap dengan salah satu bangunan lain.
 */
export function checkBuildingOverlap(
  targetPolygon: [number, number][],
  buildings: BuildingData[],
  excludeId?: string | number
): { isOverlap: boolean; overlappingBuilding?: BuildingData } {
  for (const b of buildings) {
    if (excludeId !== undefined && String(b.id) === String(excludeId)) continue;
    const bPoly = getSinglePolygonPoints(b.geom);
    if (bPoly.length >= 3 && doPolygonsOverlap(targetPolygon, bPoly)) {
      return { isOverlap: true, overlappingBuilding: b };
    }
  }
  return { isOverlap: false };
}

/**
 * Memeriksa jarak poligon target ke sungai/kali terdekat.
 * Menghitung jarak terhadap bibir sungai (jarak centerline dikurangi setengah lebar sungai).
 */
export function checkRiverProximity(
  targetPolygon: [number, number][],
  rivers: RiverData[],
  thresholdMeters = 3
): { isNearRiver: boolean; minDistance: number; nearestRiver?: RiverData } {
  if (!rivers || rivers.length === 0) {
    return { isNearRiver: false, minDistance: Infinity };
  }

  let minDistance = Infinity;
  let nearestRiver: RiverData | undefined = undefined;

  const centroid = getBuildingCentroid(targetPolygon);
  const pointsToCheck = centroid ? [centroid, ...targetPolygon] : targetPolygon;

  for (const river of rivers) {
    const riverPositions = parseGeoJSONCoordinates(river.geom || river.geometry);
    if (!riverPositions) continue;

    const width = Number(river.width_m) || 3;
    const halfWidth = width / 2;

    for (const pt of pointsToCheck) {
      const distToCenter = distancePointToPolyline(pt, riverPositions);
      const distToBank = Math.max(0, distToCenter - halfWidth);
      if (distToBank < minDistance) {
        minDistance = distToBank;
        nearestRiver = river;
      }
    }
  }

  const isNearRiver = minDistance <= thresholdMeters;
  return { isNearRiver, minDistance, nearestRiver };
}

/**
 * Memeriksa apakah lokasi target sangat dekat dengan TPA (Tempat Pembuangan Akhir / Sampah).
 */
export function checkTpaProximity(
  targetCentroid: [number, number],
  buildings: BuildingData[],
  thresholdMeters = 150
): { isNearTpa: boolean; minDistance: number; nearestTpa?: BuildingData } {
  let minDistance = Infinity;
  let nearestTpa: BuildingData | undefined = undefined;

  for (const b of buildings) {
    const typeId = (b.type_id || "").toLowerCase();
    const typeName = (b.type_name || "").toLowerCase();
    const name = (b.name || "").toLowerCase();

    const isTpa =
      typeId === "tpa" ||
      typeId.includes("tpa") ||
      typeName.includes("tpa") ||
      name.includes("tpa") ||
      name.includes("sampah") ||
      name.includes("pembuangan akhir") ||
      name.includes("landfill");

    if (!isTpa) continue;

    const bCentroid = getBuildingCentroid(b.geom);
    if (!bCentroid) continue;

    const dist = getDistanceInMeters(
      targetCentroid[0],
      targetCentroid[1],
      bCentroid[0],
      bCentroid[1]
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearestTpa = b;
    }
  }

  const isNearTpa = minDistance <= thresholdMeters;
  return { isNearTpa, minDistance, nearestTpa };
}

import type { CityBoundaries } from "@/lib/utils";

/**
 * Mengambil koordinat poligon bangunan yang sudah diparsing, dengan caching memori internal
 * agar tidak melakukan parsing rekursif GeoJSON berulang-ulang di render loop.
 */
export function getBuildingPositions(b: BuildingData): CityBoundaries | null {
  if (!b) return null;
  const cached = (b as unknown as { _parsedPositions?: CityBoundaries | null })._parsedPositions;
  if (cached !== undefined) {
    return cached;
  }
  const pos = parseGeoJSONCoordinates(b.geom);
  (b as unknown as { _parsedPositions?: CityBoundaries | null })._parsedPositions = pos;
  return pos;
}

/**
 * Menghitung bounding box [[minLat, minLng], [maxLat, maxLng]] dari CityBoundaries.
 */
export function getBoundsFromBoundaries(
  boundaries: CityBoundaries | null | undefined,
  paddingPercent = 0.03
): [[number, number], [number, number]] | null {
  if (!boundaries || !Array.isArray(boundaries) || boundaries.length === 0) return null;

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  let count = 0;

  const traverse = (item: unknown) => {
    if (!Array.isArray(item)) return;
    if (
      item.length >= 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
    ) {
      const lat = item[0];
      const lng = item[1];
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      count++;
      return;
    }
    item.forEach(traverse);
  };

  traverse(boundaries);

  if (count === 0) return null;

  const padLat = (maxLat - minLat) * paddingPercent || 0.01;
  const padLng = (maxLng - minLng) * paddingPercent || 0.01;

  return [
    [minLat - padLat, minLng - padLng],
    [maxLat + padLat, maxLng + padLng],
  ];
}

/**
 * Menghitung titik tengah centroid [lat, lng] dari CityBoundaries.
 */
export function getCenterFromBoundaries(
  boundaries: CityBoundaries | null | undefined
): [number, number] | null {
  const bounds = getBoundsFromBoundaries(boundaries, 0);
  if (!bounds) return null;
  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ];
}

