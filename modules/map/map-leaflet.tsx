import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Map as LeafletMapType } from "leaflet";
import { MADIUN_GEO } from "@/constants/helper";
import { MapContainer, TileLayer } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import LayerPanel from "@/components/layer-panel";
import { useMapContext } from "@/hooks/useMapContext";
import GridBuilding from "@/components/grid-building";
import type { CityBoundaries } from "@/lib/utils";
import { getBuildingsByGridIds, type CityGrid, type UndergroundNetworkData } from "@/app/map/[slugid]/actions";

// Fix default marker icon issue in Next.js / Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
interface LeafleatMapProps {
  boundariesCity?: CityBoundaries | null;
  cityGrids?: CityGrid[];
  drainase?: UndergroundNetworkData[];
}

export default function LeafletMap({
  boundariesCity,
  cityGrids,
  drainase,
}: LeafleatMapProps) {
  const [map, setMap] = useState<LeafletMapType | null>(null);
  const fetchedGridIdsRef = useRef<Set<string>>(new Set());
  const { setMainMap, buildings, setBuildings, setCityGrids } = useMapContext();

  useEffect(() => {
    if (cityGrids && cityGrids.length > 0) {
      setCityGrids(cityGrids);
    }
  }, [cityGrids, setCityGrids]);

  useEffect(() => {
    setMainMap(map);
    return () => {
      setMainMap(null);
    };
  }, [map, setMainMap]);

  // Deteksi zoom >= 16 untuk mem-fetch bangunan dari grid yang terlihat di viewport
  useEffect(() => {
    if (!map || !cityGrids || cityGrids.length === 0) return;

    let timer: NodeJS.Timeout;

    const handleFetchVisibleBuildings = () => {
      const zoom = map.getZoom();
      if (zoom < 16) return;

      const mapBounds = map.getBounds();

      // Cari grid yang terlihat dan memiliki bangunan (> 0)
      const visibleGrids = cityGrids.filter((grid) => {
        if (!grid.building_count || grid.building_count === 0) return false;
        const coords = grid.geom?.coordinates?.[0];
        if (!coords || coords.length === 0) return false;

        let minLat = 90;
        let maxLat = -90;
        let minLng = 180;
        let maxLng = -180;

        for (const [lng, lat] of coords) {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        }

        const gridBounds = L.latLngBounds([
          [minLat, minLng],
          [maxLat, maxLng],
        ]);

        return mapBounds.intersects(gridBounds);
      });

      const newGridIds = visibleGrids
        .map((g) => g.id)
        .filter((id) => !fetchedGridIdsRef.current.has(id));

      if (newGridIds.length === 0) return;

      // Tandai grid sudah dalam proses fetch agar tidak dobel request
      newGridIds.forEach((id) => fetchedGridIdsRef.current.add(id));

      // Panggil Server Action untuk mengambil data bangunan
      getBuildingsByGridIds(newGridIds).then((newBuildings) => {
        if (newBuildings && newBuildings.length > 0) {
          setBuildings((prev) => {
            const existingIds = new Set(prev.map((b) => b.id));
            const toAdd = newBuildings.filter((b) => !existingIds.has(b.id));
            return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
          });
        }
      });
    };

    const onMove = () => {
      clearTimeout(timer);
      timer = setTimeout(handleFetchVisibleBuildings, 300);
    };

    handleFetchVisibleBuildings();

    map.on("moveend", onMove);
    map.on("zoomend", onMove);

    return () => {
      clearTimeout(timer);
      map.off("moveend", onMove);
      map.off("zoomend", onMove);
    };
  }, [map, cityGrids, setBuildings]);

  const handleZoomIn = () => {
    map?.zoomIn();
  };

  const handleZoomOut = () => {
    map?.zoomOut();
  };

  return (
    <section className="relative w-full h-screen max-w-full overflow-hidden">
      <MapContainer
        ref={setMap}
        center={MADIUN_GEO.CENTER}
        zoom={MADIUN_GEO.DEFAULT_ZOOM}
        minZoom={MADIUN_GEO.MIN_ZOOM}
        maxZoom={MADIUN_GEO.MAX_ZOOM}
        maxBounds={MADIUN_GEO.BOUNDS}
        maxBoundsViscosity={1.0} // Mengunci peta agar tidak bisa digeser keluar batas resmi Kota Madiun
        zoomControl={false}
        scrollWheelZoom={false}
        preferCanvas={true} // Akselerasi grafis HTML5 Canvas untuk ribuan poligon
        className="w-full h-full z-0 cursor-crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LayerPanel buildings={buildings} drainase={drainase} />
        {boundariesCity && boundariesCity.length > 0 && (
          <GridBuilding
            type="polygon"
            buildings={"residential"}
            popup={false}
            props={{
              positions: boundariesCity,
              color: "#2563eb",
              fill: false,
              weight: 3.0,
              dashArray: "8, 6",
              lineCap: "round",
              lineJoin: "round",
              interactive: false,
            }}
          />
        )}
      </MapContainer>

      <div className="absolute bottom-8 right-8  flex flex-col rounded-lg bg-accent-300 border border-accent-400 shadow-md overflow-hidden">
        <Button
          variant="orange"
          size="icon"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="rounded-none bg-neutral-100 hover:bg-neutral-200 active:bg-accent-500 text-neutral-900 border-neutral-100 ring-neutral-100"
        >
          <PlusIcon className="size-4" />
        </Button>
        <Separator className="bg-accent-400" />
        <Button
          variant="orange"
          size="icon"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="rounded-none bg-neutral-100 hover:bg-neutral-200 active:bg-accent-500 text-neutral-900 border-neutral-100 ring-neutral-100"
        >
          <MinusIcon className="size-4" />
        </Button>
      </div>
    </section>
  );
}
