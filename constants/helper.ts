import { MapItems } from "@/types";
import type { CityDetail } from "@/app/map/[slugid]/actions";

export const MADIUN_OSM_RELATION_METADATA = {
  relationId: 9676370,
  adminLevel: 5,
  boundary: 'administrative',
  name: 'Kota Madiun',
  officialName: 'Kota Madiun',
  nameArabic: 'ماديون',
  nameJavanese: 'ꦏꦸꦛꦩꦢꦶꦪꦸꦤ꧀',
  wikidata: 'Q11444',
  wikipedia: 'id:Kota Madiun',
  osmUrl: 'https://www.openstreetmap.org/relation/9676370',
  bounds: {
    minLat: -7.6649093,
    minLng: 111.498768,
    maxLat: -7.59485,
    maxLng: 111.5664368,
  },
};

export const MADIUN_GEO = {
  // Titik tengah centroid resmi Kota Madiun
  CENTER: [
    (MADIUN_OSM_RELATION_METADATA.bounds.minLat + MADIUN_OSM_RELATION_METADATA.bounds.maxLat) / 2,
    (MADIUN_OSM_RELATION_METADATA.bounds.minLng + MADIUN_OSM_RELATION_METADATA.bounds.maxLng) / 2,
  ] as [number, number], // ~ [-7.62988, 111.53260]

  DEFAULT_ZOOM: 15,
  MIN_ZOOM: 14,
  MAX_ZOOM: 18,

  // Bounding box terkunci persis sesuai batas wilayah Kota Madiun OSM Relation 9676370
  BOUNDS: [
    [-7.6750, 111.4880], // Barat Daya (South-West)
    [-7.5850, 111.5760], // Timur Laut (North-East)
  ] as [[number, number], [number, number]],

  GRID_BOUNDS: {
    minLat: MADIUN_OSM_RELATION_METADATA.bounds.minLat,
    maxLat: MADIUN_OSM_RELATION_METADATA.bounds.maxLat,
    minLng: MADIUN_OSM_RELATION_METADATA.bounds.minLng,
    maxLng: MADIUN_OSM_RELATION_METADATA.bounds.maxLng,
  },
};

export const MAP_ITEMS: MapItems[] = [
  {
    id: "rtlh",
    name: "Jumlah Rumah Tidak Layak Huni",
    data: {
      value: 24.8,
      initialValue: 24.8,
      satuan: "percentage",
      usingSpace: false,
      boldSatuan: true,
      mini: false,
    },
    initialValue: 24.8,
    description: "17.879 unit rumah tidak layak huni",
    srcIcon: "/icons/home.svg",
  },
  {
    id: "kepadatan_luas",
    name: "Kepadatan Luas Bangunan",
    data: {
      value: 24.2,
      initialValue: 24.2,
      satuan: "percentage",
      boldSatuan: true,
    },
    initialValue: 24.2,
    description: "2.203 unit bangunan / km²",
    srcIcon: "/icons/triple-home.svg",
  },
  {
    id: "kepadatan_vertikal",
    name: "Kepadatan Bangunan Vertikal",
    data: {
      value: 1.32,
      initialValue: 1.32,
    },
    initialValue: 1.32,
    description: "Unit bertingkat / km²",
    srcIcon: "/icons/building.svg",
  },
  {
    id: "rth",
    name: "Ruang Terbuka Hijau",
    data: {
      value: 1.1,
      initialValue: 1.1,
      satuan: "percentage",
      boldSatuan: true,
      usingSpace: false,
    },
    initialValue: 1.1,
    description: "Luas 364.746 m² RTH",
    srcIcon: "/icons/blues-home.svg",
  },
  {
    id: "drainase",
    name: "Ketercukupan Saluran Drainase",
    data: {
      value: 78.4,
      initialValue: 78.4,
      satuan: "percentage",
      usingSpace: false,
      boldSatuan: true,
    },
    initialValue: 78.4,
    description: "Kondisi jaringan drainase baik",
    srcIcon: "/icons/water.svg",
  },
  {
    id: "air_limbah",
    name: "Saluran Air Limbah",
    data: {
      value: 69.5,
      initialValue: 69.5,
      satuan: "percentage",
      boldSatuan: true,
      usingSpace: false,
    },
    initialValue: 69.5,
    description: "Akses pengolahan limbah layak",
    srcIcon: "/icons/recycle.svg",
  },
  {
    id: "air_bersih",
    name: "Akses Air Bersih",
    data: {
      value: 96.6,
      initialValue: 96.6,
      satuan: "percentage",
      usingSpace: false,
      boldSatuan: true,
    },
    initialValue: 96.6,
    description: "Cakupan layanan air minum perpipaan",
    srcIcon: "/icons/yellow-water.svg",
  },
  {
    id: "hydrant",
    name: "Ketercukupan Hydrant",
    data: {
      value: 43.3,
      initialValue: 43.3,
      satuan: "percentage",
      usingSpace: false,
      boldSatuan: true,
    },
    initialValue: 43.3,
    description: "Titik hydrant aktif damkar",
    srcIcon: "/icons/hydrant.svg",
  },
  {
    id: "penduduk",
    name: "Jumlah Penduduk",
    data: {
      value: 201.733,
      initialValue: 201.733,
      satuan: "jiwa",
      usingSpace: true,
      mini: true,
    },
    initialValue: 201.733,
    description: "Total jiwa penduduk terdata",
    srcIcon: "/icons/people-grup.svg",
  },
  {
    id: "kepadatan_penduduk",
    name: "Kepadatan Penduduk",
    data: {
      value: 6.071,
      initialValue: 6.071,
      satuan: "jiwa/km²",
      usingSpace: true,
      mini: true,
    },
    initialValue: 6.071,
    description: "Jiwa per km²",
    srcIcon: "/icons/people-home.svg",
  },
];

export function buildMapItemsFromCity(
  cityData?: CityDetail | null
): MapItems[] {
  if (!cityData) {
    return MAP_ITEMS.map((item) => {
      const val = item.data.value;
      const initVal = item.data.initialValue ?? item.initialValue ?? val;
      return {
        ...item,
        initialValue: initVal,
        data: {
          ...item.data,
          value: val,
          initialValue: initVal,
        },
      };
    });
  }

  const area = Number(cityData.area_km2) || 33.23;
  const unfitCount = Number(cityData.unfit_housing_count) || 0;
  const resCount = Number(cityData.residential_count) || 71974;
  const totalBldCount =
    Number(cityData.total_building_count) ||
    resCount + (Number(cityData.facility_count) || 0) + (Number(cityData.dining_count) || 0);

  // 1. RTLH percentage: (unfit_housing_count / residential_count) * 100
  const rtlhPct =
    resCount > 0
      ? Number(((unfitCount / resCount) * 100).toFixed(1))
      : 24.8;

  // 2. Kepadatan Luas Bangunan (Coverage ratio / KDB): building_coverage_ratio
  const kdb =
    cityData.building_coverage_ratio != null
      ? Number(parseFloat(String(cityData.building_coverage_ratio)).toFixed(1))
      : 24.2;

  // Perhitungan unit bangunan per km² pada dasar lahan kota: total_building_count / area_km2
  const unitsPerKm2 =
    area > 0 && totalBldCount > 0
      ? Math.round(totalBldCount / area).toLocaleString("id-ID")
      : "2.203";

  // 3. Kepadatan Bangunan Vertikal: vertical_building_density
  const verticalDensity =
    cityData.vertical_building_density != null
      ? Number(Number(cityData.vertical_building_density).toFixed(2))
      : 1.32;

  // 4. Ruang Terbuka Hijau: green_open_space_ratio
  const rthRatio =
    cityData.green_open_space_ratio != null
      ? Number(parseFloat(String(cityData.green_open_space_ratio)).toFixed(1))
      : 1.1;

  // 5. Ketercukupan Saluran Drainase: drainage_adequacy_ratio
  const drainageRatio =
    cityData.drainage_adequacy_ratio != null
      ? Number(parseFloat(String(cityData.drainage_adequacy_ratio)).toFixed(1))
      : 78.4;

  // 6. Saluran Air Limbah: waste_water_coverage
  const wasteWaterRatio =
    cityData.waste_water_coverage != null
      ? Number(parseFloat(String(cityData.waste_water_coverage)).toFixed(1))
      : 69.5;

  // 7. Akses Air Bersih: clean_water_access_ratio
  const cleanWaterRatio =
    cityData.clean_water_access_ratio != null
      ? Number(parseFloat(String(cityData.clean_water_access_ratio)).toFixed(1))
      : 96.6;

  // 8. Ketercukupan Hydrant: hydrant_adequacy_ratio
  const hydrantRatio =
    cityData.hydrant_adequacy_ratio != null
      ? Number(parseFloat(String(cityData.hydrant_adequacy_ratio)).toFixed(1))
      : 43.3;

  // 9. Jumlah Penduduk: population (format ribuan dalam float / jiwa)
  const popNumber = Number(cityData.population) || 201733;
  const popValue = Number((popNumber / 1000).toFixed(3)); // 201.733

  // 10. Kepadatan Penduduk: population_density
  const popDensityNumber =
    cityData.population_density != null
      ? parseFloat(String(cityData.population_density))
      : popNumber / area;
  const popDensityValue = Number((popDensityNumber / 1000).toFixed(3)); // 6.071

  return [
    {
      id: "rtlh",
      name: "Jumlah Rumah Tidak Layak Huni",
      data: {
        value: rtlhPct,
        initialValue: rtlhPct,
        satuan: "percentage",
        usingSpace: false,
        boldSatuan: true,
        mini: false,
      },
      initialValue: rtlhPct,
      description:
        unfitCount > 0
          ? `${unfitCount.toLocaleString("id-ID")} unit rumah tidak layak huni`
          : "Unit rumah tidak layak huni",
      srcIcon: "/icons/home.svg",
    },
    {
      id: "kepadatan_luas",
      name: "Kepadatan Luas Bangunan",
      data: {
        value: kdb,
        initialValue: kdb,
        satuan: "percentage",
        boldSatuan: true,
      },
      initialValue: kdb,
      description: `${unitsPerKm2} unit bangunan / km²`,
      srcIcon: "/icons/triple-home.svg",
    },
    {
      id: "kepadatan_vertikal",
      name: "Kepadatan Bangunan Vertikal",
      data: {
        value: verticalDensity,
        initialValue: verticalDensity,
      },
      initialValue: verticalDensity,
      description: "Unit bertingkat / km²",
      srcIcon: "/icons/building.svg",
    },
    {
      id: "rth",
      name: "Ruang Terbuka Hijau",
      data: {
        value: rthRatio,
        initialValue: rthRatio,
        satuan: "percentage",
        boldSatuan: true,
        usingSpace: false,
      },
      initialValue: rthRatio,
      description: cityData.total_green_space_area_sqm
        ? `Luas ${Number(cityData.total_green_space_area_sqm).toLocaleString("id-ID")} m² RTH`
        : "Persentase ruang terbuka hijau",
      srcIcon: "/icons/blues-home.svg",
    },
    {
      id: "drainase",
      name: "Ketercukupan Saluran Drainase",
      data: {
        value: drainageRatio,
        initialValue: drainageRatio,
        satuan: "percentage",
        usingSpace: false,
        boldSatuan: true,
      },
      initialValue: drainageRatio,
      description: "Kondisi jaringan drainase baik",
      srcIcon: "/icons/water.svg",
    },
    {
      id: "air_limbah",
      name: "Saluran Air Limbah",
      data: {
        value: wasteWaterRatio,
        initialValue: wasteWaterRatio,
        satuan: "percentage",
        boldSatuan: true,
        usingSpace: false,
      },
      initialValue: wasteWaterRatio,
      description: "Akses pengolahan limbah layak",
      srcIcon: "/icons/recycle.svg",
    },
    {
      id: "air_bersih",
      name: "Akses Air Bersih",
      data: {
        value: cleanWaterRatio,
        initialValue: cleanWaterRatio,
        satuan: "percentage",
        usingSpace: false,
        boldSatuan: true,
      },
      initialValue: cleanWaterRatio,
      description: "Cakupan layanan air minum perpipaan",
      srcIcon: "/icons/yellow-water.svg",
    },
    {
      id: "hydrant",
      name: "Ketercukupan Hydrant",
      data: {
        value: hydrantRatio,
        initialValue: hydrantRatio,
        satuan: "percentage",
        usingSpace: false,
        boldSatuan: true,
      },
      initialValue: hydrantRatio,
      description: "Titik hydrant aktif damkar",
      srcIcon: "/icons/hydrant.svg",
    },
    {
      id: "penduduk",
      name: "Jumlah Penduduk",
      data: {
        value: popValue,
        initialValue: popValue,
        satuan: "jiwa",
        usingSpace: true,
        mini: true,
      },
      initialValue: popValue,
      description: "Total jiwa penduduk terdata",
      srcIcon: "/icons/people-grup.svg",
    },
    {
      id: "kepadatan_penduduk",
      name: "Kepadatan Penduduk",
      data: {
        value: popDensityValue,
        initialValue: popDensityValue,
        satuan: "jiwa/km²",
        usingSpace: true,
        mini: true,
      },
      initialValue: popDensityValue,
      description: "Jiwa per km²",
      srcIcon: "/icons/people-home.svg",
    },
  ];
}

export const INFORMASI_PERUMAHAN_ITEMS: string[] = [
  "Informasi mengenai kondisi fisik dan kelayakan perumahan.",
  "Data ketersediaan sarana dan prasarana lingkungan.",
  "Panduan navigasi dan pemantauan titik lokasi pada peta.",
];


export const BUILDING_TYPE = [
  {
    id: 'rumah',
    label: 'Rumah',
    layer: 'bangunan',
    category: 'Hunian',
    icon: 'Home',
  },
  {
    id: 'rusun',
    label: 'Rumah Susun',
    layer: 'bangunan',
    category: 'Hunian',
    icon: 'Building',
  },
  {
    id: 'apartemen',
    label: 'Apartemen',
    layer: 'bangunan',
    category: 'Hunian',
    icon: 'Building2',
  },
  {
    id: 'tpa',
    label: 'TPA',
    layer: 'bangunan',
    category: 'Infrastruktur',
    icon: 'Trash2',
  },
  {
    id: 'pdam',
    label: 'PDAM',
    layer: 'bangunan',
    category: 'Infrastruktur',
    icon: 'Droplets',
  },
  {
    id: 'hydrant',
    label: 'Hydrant',
    layer: 'bangunan',
    category: 'Infrastruktur',
    icon: 'Flame',
  },
  {
    id: 'drainase',
    label: 'Drainase',
    layer: 'drainase',
    category: 'Infrastruktur',
    icon: 'Waves',
  },
  {
    id: 'ipal',
    label: 'IPAL',
    layer: 'drainase',
    category: 'Infrastruktur',
    icon: 'Recycle',
  },
];