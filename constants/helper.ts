import { MapItems } from "@/types";

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
    name: "Jumlah RTLH",
    data: {
      value: 15,
      satuan: "percentage"
    },
    description: "Unit rumah tidak layak huni",
    icon: "Home",
  },
  {
    name: "Kepadatan Bangunan",
    data: {
      value: 216.007,
    },
    description: "Unit bangunan / km²",
    icon: "Building",
  },
  {
    name: "Kepadatan Bangunan Vertikal",
    data: {
      value: 3489.8,
    },
    description: "Unit bertingkat / km²",
    icon: "Building2",
  },
  {
    name: "Cakupan RTLH",
    data: {
      value: 18.4,
      satuan: "percentage"
    },
    description: "Persentase penanganan RTLH",
    icon: "Percent",
  },
  {
    name: "Drainase",
    data: {
      value: 86.5,
      satuan: "percentage"
    },
    description: "Kondisi jaringan drainase baik",
    icon: "Waves",
  },
  {
    name: "Pengelolaan Air Limbah",
    data: {
      value: 82.4,
      satuan: "percentage"
    },
    description: "Akses pengolahan limbah layak",
    icon: "Recycle",
  },
  {
    name: "Akses Air Bersih",
    data: {
      value: 96.8,
      satuan: "percentage"
    },
    description: "Cakupan layanan air minum perpipaan",
    icon: "Droplets",
  },
  {
    name: "Jumlah Hydrant",
    data: {
      value: 48,
      satuan: "unit"
    },
    description: "Titik hydrant aktif damkar",
    icon: "Flame",
  },
  {
    name: "Jumlah Penduduk",
    data: {
      value: 201.540,
      satuan: "jiwa"
    },
    description: "Total jiwa penduduk terdata",
    icon: "Users",
  },
  {
    name: "Kepadatan Penduduk",
    data: {
      value: 6.065,
      satuan: "jiwa/km²"
    },
    description: "Jiwa per km²",
    icon: "UserCheck",
  },
];

export const INFORMASI_PERUMAHAN_ITEMS: string[] = [
  "Informasi mengenai kondisi fisik dan kelayakan perumahan.",
  "Data ketersediaan sarana dan prasarana lingkungan.",
  "Panduan navigasi dan pemantauan titik lokasi pada peta.",
];