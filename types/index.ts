export interface MapStats {
    value: number;
    initialValue?: number;
    satuan?: "percentage" | "unit" | "km²" | "jiwa/km²" | "jiwa";
    boldSatuan?: boolean;
    usingSpace?: boolean;
    mini?: boolean;
}

export interface MapItems {
  id?: string;
  name: string;
  data: MapStats;
  initialValue?: number;
  initialData?: MapStats;
  description?: string;
  srcIcon: string;
}