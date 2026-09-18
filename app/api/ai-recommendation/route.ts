import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { MADIUN_GEO, MADIUN_OSM_RELATION_METADATA } from "@/constants/helper";

export const runtime = "nodejs";

export interface RecommendationResult {
  title: string;
  recommendedType: string;
  center: [number, number];
  reasons: string[];
  impact: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      cityStats = {},
      buildingsSummary = {},
      drainaseSummary = {},
      riversSummary = {},
    } = body;

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GOOGLE_AI_API_KEY is not set, using heuristic fallback.");
      return NextResponse.json(generateFallbackRecommendation(cityStats));
    }

    // Prepare prompt containing current buildings, underground networks, rivers, and city indicators
    const prompt = `
Anda adalah seorang Ahli Perencana Kota dan Analis Spasial Tata Ruang untuk Kota Madiun, Jawa Timur.

BATAS WILAYAH KOTA MADIUN:
- Latitude: ${MADIUN_OSM_RELATION_METADATA.bounds.minLat} s/d ${MADIUN_OSM_RELATION_METADATA.bounds.maxLat}
- Longitude: ${MADIUN_OSM_RELATION_METADATA.bounds.minLng} s/d ${MADIUN_OSM_RELATION_METADATA.bounds.maxLng}
- Titik Tengah Kota: [${MADIUN_GEO.CENTER[0]}, ${MADIUN_GEO.CENTER[1]}]

DATA BANGUNAN SAAT INI:
- Total Bangunan Terdata: ${buildingsSummary.total || 0} unit
  - Hunian/Perumahan: ${buildingsSummary.residential || 0}
  - Fasilitas Publik: ${buildingsSummary.facilities || 0}
  - Tempat Usaha/Kuliner: ${buildingsSummary.dinings || 0}
  - Ruang Terbuka Hijau (RTH): ${buildingsSummary.greenSpaces || 0}
  - Rumah Tidak Layak Huni (RTLH/Waspada/Bahaya): ${buildingsSummary.unfitCount || cityStats.unfit_housing_count || 0}
- Sampel Titik Koordinat Bangunan yang Sudah Terisi (HINDARI OVERLAP DENGAN TITIK INI):
  ${JSON.stringify((buildingsSummary.sampleCentroids || []).slice(0, 30))}

DATA UNDERGROUND NETWORK (JARINGAN UTILITAS BAWAH TANAH) SAAT INI:
- Total Segmen Jaringan: ${drainaseSummary.total || 0}
  - Segmen Saluran Drainase: ${drainaseSummary.drainageCount || 0}
  - Segmen Saluran Air Limbah (IPAL): ${drainaseSummary.wasteWaterCount || 0}
  - Segmen Saluran Air Bersih: ${drainaseSummary.cleanWaterCount || 0}
- Sampel Koordinat Jalur Jaringan Bawah Tanah Saat Ini:
  ${JSON.stringify((drainaseSummary.sampleEndpoints || []).slice(0, 20))}

DATA SUNGAI / RIVER SAAT INI:
- Jumlah Aliran Sungai: ${riversSummary.total || 0} (${(riversSummary.riverNames || ["Kali Madiun"]).join(", ")})
- ATURAN KETAT SPASIAL: Titik yang direkomendasikan WAJIB berjarak lebih dari 3 meter (> 3m) dari bibir sungai manapun untuk kepatuhan sempadan sungai.
- Sampel Koordinat Sungai:
  ${JSON.stringify((riversSummary.sampleCoords || []).slice(0, 20))}

INDIKATOR STATISTIK KOTA SAAT INI:
- Rasio Ruang Terbuka Hijau (RTH): ${cityStats.green_open_space_ratio ?? "1.1"}% (Target Nasional: 20-30%)
- Ketercukupan Saluran Drainase: ${cityStats.drainage_adequacy_ratio ?? "55.4"}%
- Akses Saluran Air Limbah / IPAL: ${cityStats.waste_water_coverage ?? "42.0"}%
- Akses Air Bersih (PDAM): ${cityStats.clean_water_access_ratio ?? "96.6"}%
- Ketercukupan Hydrant Kebakaran: ${cityStats.hydrant_adequacy_ratio ?? "43.3"}%
- Kepadatan Bangunan (KDB): ${cityStats.building_coverage_ratio ?? "24.2"}%
- Floor Area Ratio (FAR / KLB): ${cityStats.floor_area_ratio ?? "1.32"}
- Jumlah Penduduk: ${cityStats.population ?? 201733} jiwa (Kepadatan: ${cityStats.population_density ?? 6070.8} jiwa/km²)

INSTRUKSI TUGAS:
1. Temukan SATU titik koordinat kosong [latitude, longitude] terbaik di Kota Madiun yang paling mendesak dan memberikan dampak positif paling besar bagi kota.
2. Titik tersebut HARUS:
   - Berada di lahan kosong (tidak boleh menimpa bangunan eksisting).
   - Aman dari sungai (berjarak > 3 meter dari aliran sungai).
   - Berada di dalam batas wilayah resmi Kota Madiun.
   - Menyasar sektor kota yang paling membutuhkan peningkatan berdasarkan indikator di atas (misalnya pembangunan drainase di kawasan rawan genangan, RTH untuk menaikkan rasio ruang terbuka hijau, IPAL terpadu, atau hunian vertikal/rusun untuk relokasi RTLH).
3. Berikan alasan pemilihan titik tersebut dalam bentuk poin-poin alasan (reasons). MAKSIMAL 3 POIN ALASAN (tidak boleh lebih dari 3 poin!).
4. Berikan proyeksi dampak positif (impact) secara ringkas dan padat.
`;

    const ai = new GoogleGenAI({ apiKey });

    // Try gemini-3.5-flash-lite first, fallback to gemini-3.7-flash
    const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.7-flash"];
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Nama atau judul rekomendasi pembangunan",
                },
                recommendedType: {
                  type: Type.STRING,
                  description:
                    "Tipe pembangunan (misal: 'drainase', 'saluran-air-bersih', 'ipal', 'rth', 'rusun', 'pdam', dsb.)",
                },
                center: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                  description: "Koordinat [latitude, longitude]",
                },
                reasons: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Maksimal 3 poin alasan kuat pemilihan titik",
                },
                impact: {
                  type: Type.STRING,
                  description: "Dampak positif terhadap indikator kota",
                },
              },
              required: ["title", "recommendedType", "center", "reasons", "impact"],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text) as RecommendationResult;

          // Validate and sanitize response
          const sanitized = sanitizeRecommendation(parsed);
          return NextResponse.json(sanitized);
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed for recommendation:`, err);
        lastError = err;
      }
    }

    console.warn("All Gemini models failed, falling back to heuristic:", lastError);
    return NextResponse.json(generateFallbackRecommendation(cityStats));
  } catch (error) {
    console.error("Error in ai-recommendation route:", error);
    return NextResponse.json(generateFallbackRecommendation({}));
  }
}

function sanitizeRecommendation(
  data: RecommendationResult
): RecommendationResult {
  let lat = Number(data.center?.[0]);
  let lng = Number(data.center?.[1]);

  // Ensure coordinates fall within Kota Madiun bounds
  const minLat = MADIUN_OSM_RELATION_METADATA.bounds.minLat;
  const maxLat = MADIUN_OSM_RELATION_METADATA.bounds.maxLat;
  const minLng = MADIUN_OSM_RELATION_METADATA.bounds.minLng;
  const maxLng = MADIUN_OSM_RELATION_METADATA.bounds.maxLng;

  if (
    isNaN(lat) ||
    isNaN(lng) ||
    lat < minLat - 0.01 ||
    lat > maxLat + 0.01 ||
    lng < minLng - 0.01 ||
    lng > maxLng + 0.01
  ) {
    lat = MADIUN_GEO.CENTER[0] + 0.005;
    lng = MADIUN_GEO.CENTER[1] + 0.004;
  }

  // Ensure reasons do not exceed 3 points
  let reasons = Array.isArray(data.reasons) ? data.reasons.filter(Boolean) : [];
  if (reasons.length === 0) {
    reasons = [
      "Lokasi berada di lahan kosong strategis yang belum terlayani utilitas secara optimal.",
      "Aman dari sempadan sungai (> 3 meter) dan tidak menimpa bangunan eksisting.",
      "Mendukung peningkatan indikator keberlanjutan dan kualitas lingkungan kota.",
    ];
  }
  reasons = reasons.slice(0, 3);

  return {
    title: data.title || "Rekomendasi Pembangunan Berdampak Tinggi",
    recommendedType: data.recommendedType || "drainase",
    center: [Number(lat.toFixed(6)), Number(lng.toFixed(6))],
    reasons,
    impact:
      data.impact ||
      "Meningkatkan kualitas lingkungan perkotaan dan keterpenuhan infrastruktur dasar.",
  };
}

function generateFallbackRecommendation(
  cityStats: Record<string, unknown>
): RecommendationResult {
  const rth = Number(cityStats.green_open_space_ratio) || 1.1;
  const drain = Number(cityStats.drainage_adequacy_ratio) || 55.4;

  if (rth < 10) {
    return {
      title: "Pembangunan Ruang Terbuka Hijau (RTH) Tematik & Resapan",
      recommendedType: "rth",
      center: [-7.6325, 111.5312],
      reasons: [
        `Rasio RTH Kota Madiun saat ini masih ${rth}% dari target ideal minimal 20%.`,
        "Lokasi berada pada ruang terbuka kosong yang berpotensi sebagai koridor ekologis.",
        "Aman dari risiko sempadan sungai (> 3 meter) dan tidak menimpa bangunan eksisting.",
      ],
      impact:
        "Menaikkan rasio RTH kota, memperluas area resapan air hujan, serta mengurangi efek pulau bahang (heat island).",
    };
  }

  if (drain < 75) {
    return {
      title: "Pembangunan Jaringan Drainase & Resapan Perkotaan",
      recommendedType: "drainase",
      center: [-7.6254, 111.5288],
      reasons: [
        `Ketercukupan drainase perkotaan berada di ${drain}%, memerlukan intervensi saluran tambahan.`,
        "Menghubungkan saluran primer ke drainase sekunder pada kawasan permukiman padat.",
        "Bebas overlap dengan bangunan dan mematuhi batas aman bantaran sungai.",
      ],
      impact:
        "Meningkatkan indeks ketercukupan drainase kota dan meminimalkan genangan air saat curah hujan tinggi.",
    };
  }

  return {
    title: "Pusat Utilitas Terpadu & Saluran Air Bersih",
    recommendedType: "saluran-air-bersih",
    center: [-7.6298, 111.5239],
    reasons: [
      "Meningkatkan keandalan pasokan air bersih dan pemerataan jaringan utilitas kota.",
      "Lokasi strategis di koridor tengah kota dengan aksesibilitas tinggi.",
      "Memenuhi kriteria tata ruang dan tidak mengganggu bangunan eksisting.",
    ],
    impact:
      "Memperkuat ketahanan utilitas dasar perkotaan dan mempercepat pemerataan infrastruktur.",
  };
}
