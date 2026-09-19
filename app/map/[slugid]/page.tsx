import { MapContainer } from "@/modules/map/map-container";
import SidebarMap from "@/modules/map/sidebar";
import TopPanel from "@/modules/map/top-panel";
import { parseGeoJSONCoordinates } from "@/lib/utils";
import { getCityGrids, getDrainase, getCityBoundaries } from "./actions";
import { CITY_COORDINATES, MADIUN_GEO } from "@/constants/helper";
import { getBoundsFromBoundaries, getCenterFromBoundaries } from "@/lib/spatial-utils";

interface PageProps {
  params: Promise<{
    slugid: string;
  }>;
  searchParams?: Promise<{
    lat?: string;
    lng?: string;
    center?: string;
    bounds?: string;
    minLat?: string;
    maxLat?: string;
    minLng?: string;
    maxLng?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slugid } = await params;
  const sParams = searchParams ? await searchParams : {};

  const [mapData, cityGrids, drainase] = await Promise.all([
    getCityBoundaries(slugid),
    getCityGrids(slugid),
    getDrainase(slugid),
  ]);

  const preset = CITY_COORDINATES[slugid.toLowerCase()];

  // 1. Tentukan boundaries kota (dari GeoJSON backend atau preset boundaries)
  let boundaries = parseGeoJSONCoordinates(mapData?.boundary);
  if ((!boundaries || (Array.isArray(boundaries) && boundaries.length === 0)) && preset?.boundaries) {
    boundaries = preset.boundaries;
  }

  // 2. Tentukan koordinat batasan (bounds) kota
  let bounds: [[number, number], [number, number]] | undefined = undefined;
  if (sParams.minLat && sParams.minLng && sParams.maxLat && sParams.maxLng) {
    const minLat = parseFloat(sParams.minLat);
    const minLng = parseFloat(sParams.minLng);
    const maxLat = parseFloat(sParams.maxLat);
    const maxLng = parseFloat(sParams.maxLng);
    if (!isNaN(minLat) && !isNaN(minLng) && !isNaN(maxLat) && !isNaN(maxLng)) {
      bounds = [
        [minLat, minLng],
        [maxLat, maxLng],
      ];
    }
  } else if (sParams.bounds) {
    const parts = sParams.bounds.split(",").map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      bounds = [
        [parts[0], parts[1]],
        [parts[2], parts[3]],
      ];
    }
  }

  if (!bounds) {
    if (preset?.bounds) {
      bounds = preset.bounds;
    } else if (boundaries) {
      const computed = getBoundsFromBoundaries(boundaries);
      if (computed) bounds = computed;
    } else {
      bounds = MADIUN_GEO.BOUNDS;
    }
  }

  // 3. Tentukan titik center kota
  let center: [number, number] | undefined = undefined;
  if (sParams.lat && sParams.lng) {
    const lat = parseFloat(sParams.lat);
    const lng = parseFloat(sParams.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      center = [lat, lng];
    }
  } else if (sParams.center) {
    const parts = sParams.center.split(",").map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) {
      center = [parts[0], parts[1]];
    }
  }

  if (!center) {
    if (preset?.center) {
      center = preset.center;
    } else if (boundaries) {
      const computedCenter = getCenterFromBoundaries(boundaries);
      if (computedCenter) center = computedCenter;
    } else if (bounds) {
      center = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
    } else {
      center = MADIUN_GEO.CENTER;
    }
  }

  const rivers = mapData?.rivers || [];

  return (
    <>
      <MapContainer
        boundariesCity={boundaries}
        cityGrids={cityGrids}
        drainase={drainase}
        rivers={rivers}
        center={center}
        bounds={bounds}
      />
      <SidebarMap
        title={mapData?.name || preset?.name || "Kota Madiun"}
        subtitle={`${mapData?.provinsi || mapData?.province || preset?.province || "Jawa Timur"} - ${mapData?.area_km2 || preset?.area_km2 || 33.23} km²`}
        cityGrids={cityGrids}
        cityData={mapData}
      />
      <TopPanel />
    </>
  );
}
