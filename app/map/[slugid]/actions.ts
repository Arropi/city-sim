"use server";

export interface CityDetail {
  id: string;
  name: string;
  province: string;
  area_km2: number;
  boundary?: unknown;
  unfit_housing_count?: number;
  building_coverage_ratio?: string | number;
  floor_area_ratio?: number;
  green_open_space_ratio?: string | number;
  drainage_adequacy_ratio?: string | number;
  waste_water_coverage?: string | number;
  clean_water_access_ratio?: string | number;
  hydrant_adequacy_ratio?: string | number;
  population?: number;
  population_density?: string | number;
  created_at?: string;
  residential_count?: number;
  facility_count?: number;
  dining_count?: number;
  green_space_count?: number;
  total_building_count?: number;
  total_building_area_sqm?: number;
  total_building_floor?: number;
  total_green_space_area_sqm?: number;
  rtlh_safe_count?: number;
  rtlh_warning_count?: number;
  rtlh_alert_count?: number;
  rtlh_danger_count?: number;
  [key: string]: unknown;
}

export async function getCityBoundaries(cityId: string): Promise<CityDetail | null> {
  try {
    const res = await fetch(`${process.env.API_URL}/cities/${cityId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Gagal mengambil data kota ${cityId}, status: ${res.status}`);
      return null;
    }

    const response = await res.json();
    return (response.data || null) as CityDetail | null;
  } catch (error) {
    console.warn(`Gagal terhubung ke ${process.env.API_URL}/cities/${cityId}:`, error);
    return null;
  }
}

export const getBoundaryCities = getCityBoundaries;

export interface CityGrid {
  id: string;
  city_id: string;
  geom: {
    type: string;
    coordinates: number[][][];
  };
  building_count: number;
  created_at?: string;
}

export interface BuildingData {
  id: string;
  city_id: string;
  grid_id: string;
  name: string;
  type_id: string;
  type_name: string;
  color_hex: string;
  runoff_coef?: number;
  unfit_pct?: number | null;
  condition?: string | null;
  building_levels?: number;
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

export async function getCityGrids(slugid: string): Promise<CityGrid[]> {
  try {
    const res = await fetch(`${process.env.API_URL}/grids/by-city/${slugid}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const fallback = await fetch(`${process.env.API_URL}/grids/bycity/${slugid}`, {
        cache: "no-store",
      });
      if (!fallback.ok) return [];
      const json = await fallback.json();
      return (json.data || []) as CityGrid[];
    }
    const json = await res.json();
    return (json.data || []) as CityGrid[];
  } catch (error) {
    console.warn(`Gagal mengambil data grid untuk kota ${slugid}:`, error);
    return [];
  }
}

export async function getBuildingsByGridIds(gridIds: string[]): Promise<BuildingData[]> {
  if (!gridIds || gridIds.length === 0) return [];
  try {
    const res = await fetch(`${process.env.API_URL}/buildings/by-grids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gridIds }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Gagal mengambil data bangunan batch (Status ${res.status})`);
      return [];
    }

    const json = await res.json();
    return (json.data || []) as BuildingData[];
  } catch (error) {
    console.warn("Gagal mengambil data bangunan per grid:", error);
    return [];
  }
}

export interface UndergroundNetworkData {
  id: string;
  city_id: string;
  utility_type: "drainage" | "waste_water" | string;
  diameter_mm?: number | null;
  depth_m?: number | string | null;
  status?: "optimal" | "warning" | "maintenance" | string | null;
  flow_capacity_lps?: number | null;
  geom: {
    type: string;
    coordinates: unknown;
  };
  created_at?: string | null;
  [key: string]: unknown;
}

export type DrainaseData = UndergroundNetworkData;

export async function getDrainase(slugid: string): Promise<UndergroundNetworkData[]> {
  try {
    const res = await fetch(
      `${process.env.API_URL}/networks/by-city/${slugid}?utility_type=drainage`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.warn(`Gagal mengambil data drainase kota ${slugid} (Status ${res.status})`);
      return [];
    }

    const json = await res.json();
    const data = (json.data || []) as UndergroundNetworkData[];
    return data.filter(
      (item) => !item.utility_type || item.utility_type === "drainage"
    );
  } catch (error) {
    console.warn(`Gagal mengambil data drainase kota ${slugid}:`, error);
    return [];
  }
}

export async function getCityNetworks(
  slugid: string,
  utilityType?: "drainage" | "waste_water" | string
): Promise<UndergroundNetworkData[]> {
  try {
    const url = new URL(`${process.env.API_URL}/networks/by-city/${slugid}`);
    if (utilityType) {
      url.searchParams.set("utility_type", utilityType);
    }
    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Gagal mengambil data jaringan utilitas kota ${slugid} (Status ${res.status})`);
      return [];
    }

    const json = await res.json();
    return (json.data || []) as UndergroundNetworkData[];
  } catch (error) {
    console.warn(`Gagal mengambil data jaringan utilitas kota ${slugid}:`, error);
    return [];
  }
}

