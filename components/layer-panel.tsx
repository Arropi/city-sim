import {
  LayersControl,
  Marker,
  Popup,
  Circle,
  Rectangle,
  FeatureGroup
} from "react-leaflet";
import { MADIUN_GEO } from "@/constants/helper";

export default function LayerPanel() {
  const center = MADIUN_GEO.CENTER;
  const rectangle = [
    [41.9028, 12.4964],
    [41.9028, 12.4964],
  ] as [number, number][];
  return (
    <LayersControl position="topright">
      <LayersControl.Overlay checked name="semua lapisan">
        <Marker position={center}>
          <Popup>
            <div className="flex flex-row gap-10">
              <h1 className="text-sm font-semibold">Nama Bangunan</h1>
              <p className="text-xs text-muted-foreground">Deskripsi</p>
            </div>
          </Popup>
        </Marker>
      </LayersControl.Overlay>
      <LayersControl.Overlay name="bangunan">
        <FeatureGroup>
          
        </FeatureGroup>
      </LayersControl.Overlay>
      <LayersControl.Overlay name="drainase">
        <FeatureGroup pathOptions={{ color: "purple" }}>
          <Popup className="w-100 flex flex-col gap-1">
            <h1 className="text-sm font-semibold">Nama Drainase</h1>
            <p className="text-xs text-muted-foreground">Deskripsi</p>
          </Popup>
          <Circle center={[51.51, -0.06]} radius={200} />
          <Rectangle bounds={rectangle} />
        </FeatureGroup>
      </LayersControl.Overlay>
    </LayersControl>
  );
}
