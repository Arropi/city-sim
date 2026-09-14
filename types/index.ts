export interface MapStats {
    value: number,
    satuan?: "percentage" | "unit" | "km²" | "jiwa/km²" | "jiwa"
    boldSatuan?: boolean
}

export interface MapItems {
  name: string;
  data: MapStats;
  description?: string;
  icon: string;
}