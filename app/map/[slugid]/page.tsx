import { MapContainer } from "@/modules/map/map-container";
import SidebarMap from "@/modules/map/sidebar";
import TopPanel from "@/modules/map/top-panel";
import { parseGeoJSONCoordinates } from "@/lib/utils";
import { getCityGrids, getDrainase, getCityBoundaries } from "./actions";

interface PageProps {
  params: Promise<{
    slugid: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slugid } = await params;
  const [mapData, cityGrids, drainase] = await Promise.all([
    getCityBoundaries(slugid),
    getCityGrids(slugid),
    getDrainase(slugid),
  ]);

  const boundaries = parseGeoJSONCoordinates(mapData?.boundary);

  return (
    <>
      <MapContainer
        boundariesCity={boundaries}
        cityGrids={cityGrids}
        drainase={drainase}
      />
      <SidebarMap
        title={mapData?.name || "Kota Madiun"}
        subtitle={`${mapData?.provinsi || "Jawa Timur"} - ${mapData?.area_km2 || 33.23} km²`}
        cityGrids={cityGrids}
        cityData={mapData}
      />
      <TopPanel />
    </>
  );
}
