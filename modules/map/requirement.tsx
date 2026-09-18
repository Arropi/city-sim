import { BookOpen, AlertCircle, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useMapContext } from "@/hooks/useMapContext";
import { isDrainaseType } from "@/constants/helper";

export default function RequirementPanel() {
  const {
    buildMode,
    selectedHouse,
    relocationStatus,
    newBuildingPoints,
    pembangunanStatus,
    selectedBuildType,
  } = useMapContext();

  // 1. Mode Relokasi
  if (buildMode === "relokasi") {
    const {
      hasTarget,
      isOverlap,
      overlappingBuildingName,
      isNearRiver,
      riverDistance,
      isNearTpa,
      tpaDistance,
    } = relocationStatus;

    if (!selectedHouse) {
      return (
        <div>
          <div className="flex gap-1 items-center font-medium text-neutral-900">
            <BookOpen className="size-4" /> <span>Standar Pembangunan</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Silakan pilih bangunan di peta terlebih dahulu untuk melihat standar relokasi.
          </p>
        </div>
      );
    }

    if (!hasTarget) {
      return (
        <div>
          <div className="flex gap-1 items-center font-medium text-neutral-900">
            <BookOpen className="size-4" /> <span>Standar Pembangunan</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Silakan pilih titik tujuan di area kosong pada peta untuk memeriksa standar relokasi.
          </p>
        </div>
      );
    }

    // Kumpulkan hanya kondisi yang terpenuhi / terpicu pada lokasi yang dipilih
    const triggeredItems: {
      id: string;
      title: string;
      message: string;
      type: "danger" | "warning";
    }[] = [];

    if (isOverlap) {
      triggeredItems.push({
        id: "overlap",
        title: "Ketersediaan Lahan (Bertumpukan)",
        message: `Tidak bisa: Bertumpukan (overlap) dengan ${overlappingBuildingName || "bangunan lain"}. Relokasi tidak dapat dilakukan.`,
        type: "danger",
      });
    }

    if (isNearRiver) {
      triggeredItems.push({
        id: "river",
        title: "Sempadan Sungai (Jarak Aman > 3 Meter)",
        message: `Peringatan: Berjarak ${riverDistance !== null && riverDistance !== undefined ? `${riverDistance.toFixed(1)} m` : "≤ 3 m"} (mendekati bibir sungai/kali ≤ 3 meter). Melanggar garis sempadan air sungai.`,
        type: "warning",
      });
    }

    if (isNearTpa) {
      triggeredItems.push({
        id: "tpa",
        title: "Keterjangkauan Sanitasi & Jarak TPA",
        message: `Peringatan: Lokasi sangat dekat dengan Tempat Pembuangan Akhir (TPA)${tpaDistance !== null && tpaDistance !== undefined ? ` (${tpaDistance.toFixed(0)} m)` : ""}. Rumah tidak mendapatkan akses air bersih atau pembuangan limbah akibat dampak pencemaran.`,
        type: "warning",
      });
    }

    return (
      <div>
        <div className="flex gap-1 items-center font-medium text-neutral-900">
          <BookOpen className="size-4" /> <span>Standar Pembangunan</span>
        </div>
        <ol className="list-decimal list-outside pl-5 space-y-2 text-sm text-muted-foreground mt-2">
          {triggeredItems.length > 0 ? (
            triggeredItems.map((item) => (
              <li key={item.id} className="leading-snug">
                <span className="font-semibold text-neutral-800">
                  {item.title}:
                </span>{" "}
                {item.type === "danger" ? (
                  <span className="text-red-600 font-medium inline-flex items-center gap-1">
                    <XCircle className="size-3.5 shrink-0 inline text-red-600" />
                    {item.message}
                  </span>
                ) : (
                  <span
                    className={
                      item.id === "tpa"
                        ? "text-purple-600 font-medium inline-flex items-center gap-1"
                        : "text-amber-600 font-medium inline-flex items-center gap-1"
                    }
                  >
                    {item.id === "tpa" ? (
                      <AlertCircle className="size-3.5 shrink-0 inline text-purple-600" />
                    ) : (
                      <AlertTriangle className="size-3.5 shrink-0 inline text-amber-600" />
                    )}
                    {item.message}
                  </span>
                )}
              </li>
            ))
          ) : (
            <li className="leading-snug text-emerald-700 list-none -ml-5">
              <span className="font-semibold text-emerald-800 inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0 inline text-emerald-600" />
                Semua Standar Terpenuhi
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lokasi bebas dari tumpukan bangunan lain, berjarak aman dari bibir sungai (&gt; 3 meter), dan aman dari radius pencemaran TPA.
              </p>
            </li>
          )}
        </ol>
      </div>
    );
  }

  // 2. Mode Pembangunan
  if (buildMode === "pembangunan") {
    const isDrainase = isDrainaseType(selectedBuildType);

    const minPoints = isDrainase ? 2 : 3;

    if (newBuildingPoints.length < minPoints) {
      return (
        <div>
          <div className="flex gap-1 items-center font-medium text-neutral-900">
            <BookOpen className="size-4" /> <span>Standar Pembangunan</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {isDrainase
              ? "Silakan tentukan 2 titik di peta (titik awal inlet dan titik akhir outlet) untuk melihat evaluasi standar jaringan."
              : "Silakan buat minimal 3 titik poligon di peta untuk melihat evaluasi standar pembangunan."}
          </p>
        </div>
      );
    }

    if (isDrainase) {
      return (
        <div>
          <div className="flex gap-1 items-center font-medium text-neutral-900">
            <BookOpen className="size-4" /> <span>Standar Pembangunan</span>
          </div>
          <ol className="list-decimal list-outside pl-5 space-y-2 text-sm text-muted-foreground mt-2">
            <li className="leading-snug text-emerald-700 list-none -ml-5">
              <span className="font-semibold text-emerald-800 inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0 inline text-emerald-600" />
                Standar Jalur Jaringan Terpenuhi
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Jalur utilitas bawah tanah (2 titik) valid, terhubung, dan siap dibangun untuk meningkatkan ketercukupan utilitas kota.
              </p>
            </li>
          </ol>
        </div>
      );
    }

    const {
      isOverlap,
      overlappingBuildingName,
      isNearRiver,
      riverDistance,
      isNearTpa,
      tpaDistance,
    } = pembangunanStatus;

    const triggeredItems: {
      id: string;
      title: string;
      message: string;
      type: "danger" | "warning";
    }[] = [];

    if (isOverlap) {
      triggeredItems.push({
        id: "overlap",
        title: "Ketersediaan Lahan (Bertumpukan)",
        message: `Tidak bisa: Poligon bertumpukan (overlap) dengan ${overlappingBuildingName || "bangunan lain"}. Pembangunan tidak dapat dilakukan.`,
        type: "danger",
      });
    }

    if (isNearRiver) {
      triggeredItems.push({
        id: "river",
        title: "Sempadan Sungai (Jarak Aman > 3 Meter)",
        message: `Peringatan: Berjarak ${riverDistance !== null && riverDistance !== undefined ? `${riverDistance.toFixed(1)} m` : "≤ 3 m"} (mendekati bibir sungai/kali ≤ 3 meter). Melanggar sempadan sempadan air sungai.`,
        type: "warning",
      });
    }

    if (isNearTpa) {
      triggeredItems.push({
        id: "tpa",
        title: "Keterjangkauan Sanitasi & Jarak TPA",
        message: `Peringatan: Lokasi sangat dekat dengan Tempat Pembuangan Akhir (TPA)${tpaDistance !== null && tpaDistance !== undefined ? ` (${tpaDistance.toFixed(0)} m)` : ""}. Bangunan tidak mendapatkan akses air bersih atau pembuangan limbah akibat dampak pencemaran.`,
        type: "warning",
      });
    }

    return (
      <div>
        <div className="flex gap-1 items-center font-medium text-neutral-900">
          <BookOpen className="size-4" /> <span>Standar Pembangunan</span>
        </div>
        <ol className="list-decimal list-outside pl-5 space-y-2 text-sm text-muted-foreground mt-2">
          {triggeredItems.length > 0 ? (
            triggeredItems.map((item) => (
              <li key={item.id} className="leading-snug">
                <span className="font-semibold text-neutral-800">
                  {item.title}:
                </span>{" "}
                {item.type === "danger" ? (
                  <span className="text-red-600 font-medium inline-flex items-center gap-1">
                    <XCircle className="size-3.5 shrink-0 inline text-red-600" />
                    {item.message}
                  </span>
                ) : (
                  <span
                    className={
                      item.id === "tpa"
                        ? "text-purple-600 font-medium inline-flex items-center gap-1"
                        : "text-amber-600 font-medium inline-flex items-center gap-1"
                    }
                  >
                    {item.id === "tpa" ? (
                      <AlertCircle className="size-3.5 shrink-0 inline text-purple-600" />
                    ) : (
                      <AlertTriangle className="size-3.5 shrink-0 inline text-amber-600" />
                    )}
                    {item.message}
                  </span>
                )}
              </li>
            ))
          ) : (
            <li className="leading-snug text-emerald-700 list-none -ml-5">
              <span className="font-semibold text-emerald-800 inline-flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0 inline text-emerald-600" />
                Semua Standar Terpenuhi
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Area pembangunan bebas dari tumpukan bangunan lain, berjarak aman dari bibir sungai (&gt; 3 meter), dan aman dari radius pencemaran TPA.
              </p>
            </li>
          )}
        </ol>
      </div>
    );
  }

  // 3. Keadaan default (belum melakukan mode relokasi ataupun pembangunan)
  return (
    <div>
      <div className="flex gap-1 items-center font-medium text-neutral-900">
        <BookOpen className="size-4" /> <span>Standar Pembangunan</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        Silakan pilih bangunan dan lihat standarnya.
      </p>
    </div>
  );
}
