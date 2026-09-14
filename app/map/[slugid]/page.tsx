import { MapContainer } from "@/modules/map/map-container";
import SidebarMap from "@/modules/map/sidebar";
import TopPanel from "@/modules/map/top-panel";
import { parseGeoJSONCoordinates } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    slugid: string;
  }>;
}

async function getCityBoundaries(cityId: string) {
  try {
    const res = await fetch(`${process.env.API_URL}/cities/${cityId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Gagal mengambil data kota ${cityId}, status: ${res.status}`);
      return null;
    }

    const response = await res.json();
    return response.data;
  } catch (error) {
    console.warn(`Gagal terhubung ke ${process.env.API_URL}/cities/${cityId}:`, error);
    return null;
  }
}

export default async function Page({ params }: PageProps) {
  const { slugid } = await params;
  const mapData = await getCityBoundaries(slugid);
  const boundaries = parseGeoJSONCoordinates(mapData?.boundary);

  return (
    <>
      <MapContainer boundariesCity={boundaries} />
      <SidebarMap />
      <TopPanel />
    </>
  );
}
