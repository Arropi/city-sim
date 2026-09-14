import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Map as LeafletMapType } from "leaflet";
import { MADIUN_GEO } from "@/constants/helper";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import LayerPanel from "@/components/layer-panel";
import { useMapContext } from "@/hooks/useMapContext";
import GridBuilding from "@/components/grid-building";
import type { CityBoundaries } from "@/lib/utils";

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
}

export default function LeafletMap({ boundariesCity }: LeafleatMapProps) {
  const [map, setMap] = useState<LeafletMapType | null>(null);
  const { setMainMap } = useMapContext();

  useEffect(() => {
    setMainMap(map);
    return () => {
      setMainMap(null);
    };
  }, [map, setMainMap]);

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
        <LayerPanel />
        {boundariesCity && boundariesCity.length > 0 && (
          <GridBuilding
            type="polygon"
            buildings={"bangunan"}
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
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="rounded-none hover:bg-accent-400 active:bg-accent-500 text-neutral-900"
        >
          <PlusIcon className="size-4" />
        </Button>
        <Separator className="bg-accent-400" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="rounded-none hover:bg-accent-400 active:bg-accent-500 text-neutral-900"
        >
          <MinusIcon className="size-4" />
        </Button>
      </div>
    </section>
  );
}
