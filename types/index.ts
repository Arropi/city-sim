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

/**
 * Tipe data spesifik untuk bangunan pemukiman (Residential).
 */
export interface ResidentialBuilding {
  id: string;
  unfit_pct: number | null;
  building_levels: number;
  building_squares: number;
  has_clean_water: boolean;
  has_water_disposal: boolean;
  name: string;
  gridId: string;
  runoff_coef: number;
  // Properti spasial GeoJSON & visual
  grid_id?: string;
  city_id?: string;
  type_id?: string;
  type_name?: string;
  color_hex?: string;
  condition?: string | null;
  status?: string;
  is_safe?: boolean;
  geom: {
    type: string;
    coordinates: unknown;
  };
  [key: string]: unknown;
}

/**
 * Tipe data seragam untuk fasilitas, dining/kuliner, dan green space (RTH).
 */
export interface NonResidentialBuilding {
  id: string;
  building_levels: number;
  building_squares: number;
  name: string;
  service_radius: number;
  gridId: string;
  condition: string;
  type_id: string;
  runoff_coef: number;
  // Properti spasial GeoJSON & visual
  grid_id?: string;
  city_id?: string;
  type_name?: string;
  color_hex?: string;
  status?: string;
  unfit_pct?: number | null;
  geom: {
    type: string;
    coordinates: unknown;
  };
  [key: string]: unknown;
}

export type FacilityBuilding = NonResidentialBuilding;
export type DiningBuilding = NonResidentialBuilding;
export type GreenSpaceBuilding = NonResidentialBuilding;

export interface RawBuildingData {
  id: string;
  city_id?: string;
  grid_id?: string;
  gridId?: string;
  name: string;
  type_id?: string;
  type_name?: string;
  color_hex?: string;
  runoff_coef?: number;
  unfit_pct?: number | null;
  condition?: string | null;
  building_levels?: number;
  building_squares?: number;
  has_clean_water?: boolean;
  has_water_disposal?: boolean;
  service_radius?: number;
  status?: string;
  is_safe?: boolean;
  rtlh?: number;
  rtlh_count?: number;
  rtlh_score?: number;
  geom: {
    type: string;
    coordinates: unknown;
  };
  [key: string]: unknown;
}

export type BuildingData = ResidentialBuilding | NonResidentialBuilding | RawBuildingData;

export interface CategorizedBuildings {
  residential: ResidentialBuilding[];
  facilities: NonResidentialBuilding[];
  dinings: NonResidentialBuilding[];
  greenSpaces: NonResidentialBuilding[];
}

export interface UndergroundNetworkData {
  id: string;
  city_id?: string;
  utility_type: "drainage" | "waste_water" | "clean_water" | string;
  diameter_mm?: number | null;
  depth_m?: number | string | null;
  status?: "optimal" | "warning" | "maintenance" | string | null;
  flow_capacity_lps?: number | null;
  service_radius?: number | null;
  geom: {
    type: string;
    coordinates: unknown;
  };
  created_at?: string | null;
  [key: string]: unknown;
}

export interface RiverData {
  id: string;
  city_id: string;
  name: string;
  type?: string;
  width_m?: number;
  length_m?: number;
  area_sqm?: number;
  geom?: {
    type: string;
    coordinates: unknown;
  };
  geometry?: {
    type: string;
    coordinates: unknown;
  };
  created_at?: string;
  [key: string]: unknown;
}