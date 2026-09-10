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