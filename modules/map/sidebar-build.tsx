"use client";

import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemMedia, ItemTitle } from "@/components/ui/item";
import { ArrowLeftIcon, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import RequirementPanel from "./requirement";
import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import BuildingMode from "./building-mode";
import { useMapContext } from "@/hooks/useMapContext";
import { calculatePolygonAreaM2 } from "@/lib/spatial-utils";
import { BUILDING_TYPE, isDrainaseType } from "@/constants/helper";

const ITEM_BG_COLORS = [
  "bg-[#34C7591A]",
  "bg-yellow-10",
  "bg-[#FF8D281A]",
  "bg-[#0088FF1A]",
  "bg-[#CB30E01A]",
  "bg-[#34C7591A]",
  "bg-[#FFCC001A]",
  "bg-[#FF8D281A]",
  "bg-[#0088FF1A]",
  "bg-[#CB30E01A]",
];

const RecommendationPanel = dynamic(() => import("./recommendation"), {
  ssr: false,
});

interface SidebarBuildProps {
  title: string
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SidebarBuild({
  title,
  isExpanded,
  setIsExpanded,
}: SidebarBuildProps) {
  const {
    buildMode,
    setBuildMode,
    selectedHouse,
    setSelectedHouse,
    renovateBuilding,
    relocationTarget,
    setRelocationTarget,
    relocationStatus,
    setRelocationStatus,
    relocateBuilding,
    selectedBuildType,
    buildingFloors,
    newBuildingPoints,
    resetNewBuildingPoints,
    removeLastBuildingPoint,
    createNewBuilding,
    pembangunanStatus,
  } = useMapContext();

  const currentBuildType = BUILDING_TYPE.find(
    (item) => item.id === selectedBuildType
  ) || {
    id: selectedBuildType,
    label: "Bangunan",
    category: "Hunian",
    layer: "bangunan",
  };

  const isRth = currentBuildType.id === "rth";
  const isDrainase = isDrainaseType(currentBuildType.id);
  const canHaveFloors = !isRth && !isDrainase;
  const areaM2 =
    newBuildingPoints.length >= 3
      ? Math.round(calculatePolygonAreaM2(newBuildingPoints))
      : 0;

  const handleConfirmRenovasi = () => {
    if (!selectedHouse) return;
    renovateBuilding(selectedHouse.id);
    setSelectedHouse(null);
  };

  const handleConfirmRelokasi = () => {
    if (!selectedHouse || !relocationTarget || !relocationStatus.canRelocate) return;
    relocateBuilding(selectedHouse.id, relocationTarget);
  };

  return (
    <>
      <Item onClick={()=> {setIsExpanded((prev) => !prev)}}>
        <ItemMedia>
          <Link href="/" aria-label="Kembali ke beranda">
            <ArrowLeftIcon className="size-4 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer" />
          </Link>
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-body-1! font-bold text-neutral-1000">{title}</ItemTitle>
        </ItemContent>
      </Item>

      <div className="flex flex-row gap-3">
        <Button
          variant={"yellow"}
          size={"sm"}
          onClick={() => {
            const next = buildMode === "renovasi" ? null : "renovasi";
            setBuildMode(next);
            setSelectedHouse(null);
            resetNewBuildingPoints();
          }}
          className={cn(
            "flex-1 box-shadow-custom box-shadow-x-2 box-shadow-y-4 box-shadow-blur-2 box-shadow-color-[#232323]/15 cursor-pointer transition-all",
            buildMode === "renovasi" && "ring-2 ring-tertiary-500 font-bold brightness-95"
          )}
        >
          Renovasi
        </Button>
        <Button
          size={"sm"}
          onClick={() => {
            const next = buildMode === "relokasi" ? null : "relokasi";
            setBuildMode(next);
            setSelectedHouse(null);
            resetNewBuildingPoints();
          }}
          className={cn(
            "flex-1 box-shadow-custom box-shadow-x-2 box-shadow-y-4 box-shadow-blur-2 box-shadow-color-[#232323]/15 cursor-pointer transition-all",
            buildMode === "relokasi" && "ring-2 ring-accent-500 font-bold brightness-95"
          )}
        >
          Relokasi
        </Button>
        <Button
          variant={"green"}
          size={"sm"}
          onClick={() => {
            const next = buildMode === "pembangunan" ? null : "pembangunan";
            setBuildMode(next);
            setSelectedHouse(null);
            resetNewBuildingPoints();
          }}
          className={cn(
            "flex-1 box-shadow-custom box-shadow-x-2 box-shadow-y-4 box-shadow-blur-2 box-shadow-color-[#232323]/15 cursor-pointer transition-all",
            buildMode === "pembangunan" && "ring-2 ring-primary-500 font-bold brightness-95"
          )}
        >
          Pembangunan
        </Button>
      </div>

      {buildMode === "renovasi" && (
        <div className="mt-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-tertiary-10 border border-tertiary-200 text-body-5 text-neutral-800">
          <div className="flex items-center gap-1.5 truncate">
            <span className="size-2 shrink-0 rounded-full bg-tertiary-400 animate-pulse" />
            <span className="truncate">
              {selectedHouse
                ? `Terpilih: ${selectedHouse.name || `Rumah #${selectedHouse.id}`}`
                : "Mode Renovasi: Klik rumah di peta"}
            </span>
          </div>
          {selectedHouse && (
            <button
              type="button"
              onClick={() => setSelectedHouse(null)}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 underline shrink-0 cursor-pointer ml-1"
            >
              Batal
            </button>
          )}
        </div>
      )}

      {buildMode === "pembangunan" && (
        <div className="mt-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-primary-10 border border-primary-200 text-body-5 text-neutral-800">
          <div className="flex items-center gap-1.5 truncate">
            <span className="size-2 shrink-0 rounded-full bg-primary-400 animate-pulse" />
            <span className="truncate">
              {isDrainase ? (
                newBuildingPoints.length === 0
                  ? `Mode Pembangunan: Tentukan 2 titik jalur ${currentBuildType.label} (titik awal & akhir)`
                  : newBuildingPoints.length === 1
                  ? `Titik dibuat: 1 dari 2 titik (Klik titik akhir di peta)`
                  : `Titik dibuat: 2 titik (Jalur jaringan siap dibangun)`
              ) : (
                newBuildingPoints.length === 0
                  ? `Mode Pembangunan: Klik di peta untuk membuat titik ${currentBuildType.label} (min. 3 titik)`
                  : `Titik dibuat: ${newBuildingPoints.length} titik${
                      newBuildingPoints.length >= 3
                        ? ` (Luas: ${areaM2} m²)`
                        : " (Butuh minimal 3 titik)"
                    }`
              )}
            </span>
          </div>
          {newBuildingPoints.length > 0 && (
            <button
              type="button"
              onClick={resetNewBuildingPoints}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 underline shrink-0 cursor-pointer ml-1"
            >
              Reset Titik
            </button>
          )}
        </div>
      )}

      {buildMode === "relokasi" && (
        <div className="mt-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-accent-10 border border-accent-200 text-body-5 text-neutral-800">
          <div className="flex items-center gap-1.5 truncate">
            <span className="size-2 shrink-0 rounded-full bg-accent-400 animate-pulse" />
            <span className="truncate">
              {!selectedHouse
                ? "Mode Relokasi: Klik rumah di peta yang ingin dipindahkan"
                : !relocationTarget
                ? `Terpilih: ${selectedHouse.name || `Rumah #${selectedHouse.id}`} (Klik area kosong di peta)`
                : relocationStatus.isOverlap
                ? "Lokasi tidak valid: Overlap dengan bangunan lain"
                : relocationStatus.isNearRiver
                ? "Peringatan: Berjarak ≤ 3m dari bibir sungai"
                : relocationStatus.isNearTpa
                ? "Lokasi dekat TPA (tanpa akses air/limbah)"
                : `Lokasi siap untuk ${selectedHouse.name || `Rumah #${selectedHouse.id}`}`}
            </span>
          </div>
          {selectedHouse && (
            <button
              type="button"
              onClick={() => {
                setSelectedHouse(null);
                setRelocationTarget(null);
                setRelocationStatus({
                  hasTarget: false,
                  isOverlap: false,
                  overlappingBuildingName: null,
                  isNearRiver: false,
                  riverDistance: null,
                  isNearTpa: false,
                  tpaDistance: null,
                  canRelocate: false,
                  notes: [],
                });
              }}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 underline shrink-0 cursor-pointer ml-1"
            >
              Batal
            </button>
          )}
        </div>
      )}

      {isExpanded && <BuildContent />}

      {/* Button konfirmasi di kanan bawah bertipe absolute / fixed */}
      {buildMode === "renovasi" && selectedHouse && (
        <div className="fixed bottom-8 right-24 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm p-2 pl-3.5 rounded-2xl border border-neutral-200 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex flex-col pr-1">
            <span className="text-body-5 font-medium text-neutral-500">Renovasi Rumah</span>
            <span className="text-body-3 font-bold text-neutral-900">
              {selectedHouse.name || `Rumah #${selectedHouse.id}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedHouse(null)}
              className="text-neutral-600 hover:text-neutral-900 border-neutral-200 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="green"
              size="sm"
              onClick={handleConfirmRenovasi}
              className="box-shadow-custom font-bold px-4 cursor-pointer"
            >
              <Check className="size-3.5 mr-1" />
              Konfirmasi
            </Button>
          </div>
        </div>
      )}

      {buildMode === "pembangunan" && newBuildingPoints.length > 0 && (
        <div className="fixed bottom-8 right-24 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm p-2 pl-3.5 rounded-2xl border border-neutral-200 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex flex-col pr-1">
            <span className="text-body-5 font-medium text-neutral-500">
              Pembangunan {currentBuildType.label}
              {canHaveFloors && ` • ${buildingFloors} Lantai`}
            </span>
            <span className="text-body-3 font-bold text-neutral-900">
              {isDrainase
                ? `${newBuildingPoints.length} / 2 Titik Jalur Utilitas`
                : newBuildingPoints.length >= 3
                ? `${areaM2} m² (${newBuildingPoints.length} Titik)`
                : `${newBuildingPoints.length} Titik (Minimal 3 Titik)`}
            </span>
            {pembangunanStatus.isOverlap ? (
              <span className="text-[11px] font-semibold text-red-600">
                Overlap bangunan ({pembangunanStatus.overlappingBuildingName || "lain"}): Tidak dapat dibangun
              </span>
            ) : newBuildingPoints.length < (isDrainase ? 2 : 3) ? (
              <span className="text-[11px] font-medium text-amber-600">
                {isDrainase
                  ? "Klik 1 titik lagi di peta sebagai titik akhir (outlet)"
                  : `Klik ${3 - newBuildingPoints.length} titik lagi di peta`}
              </span>
            ) : pembangunanStatus.isNearRiver ? (
              <span className="text-[11px] font-semibold text-amber-600">
                Peringatan: Berjarak ≤ 3 meter dari bibir sungai
              </span>
            ) : pembangunanStatus.isNearTpa ? (
              <span className="text-[11px] font-semibold text-purple-600">
                Catatan: Dekat TPA (Tanpa akses air bersih &amp; limbah)
              </span>
            ) : (
              <span className="text-[11px] font-medium text-emerald-600">
                {isDrainase ? "Jalur jaringan (2 titik) siap dibangun" : "Titik poligon siap dibangun"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {newBuildingPoints.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={removeLastBuildingPoint}
                className="text-neutral-600 hover:text-neutral-900 border-neutral-200 cursor-pointer"
              >
                Urungkan
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetNewBuildingPoints}
              className="text-neutral-600 hover:text-neutral-900 border-neutral-200 cursor-pointer"
            >
              Reset
            </Button>
            <Button
              variant={pembangunanStatus.canBuild ? "green" : "outline"}
              size="sm"
              disabled={!pembangunanStatus.canBuild}
              onClick={() => {
                createNewBuilding();
              }}
              className={cn(
                "box-shadow-custom font-bold px-4",
                pembangunanStatus.canBuild
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50 bg-neutral-200 text-neutral-500 border-neutral-300"
              )}
            >
              <Check className="size-3.5 mr-1" />
              Konfirmasi
            </Button>
          </div>
        </div>
      )}

      {buildMode === "relokasi" && selectedHouse && relocationTarget && (
        <div className="fixed bottom-8 right-24 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm p-2 pl-3.5 rounded-2xl border border-neutral-200 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex flex-col pr-1">
            <span className="text-body-5 font-medium text-neutral-500">Relokasi Rumah</span>
            <span className="text-body-3 font-bold text-neutral-900">
              {selectedHouse.name || `Rumah #${selectedHouse.id}`}
            </span>
            {relocationStatus.isOverlap ? (
              <span className="text-[11px] font-semibold text-red-600">
                Overlap bangunan ({relocationStatus.overlappingBuildingName || "lain"}): Tidak dapat dipindahkan
              </span>
            ) : relocationStatus.isNearRiver ? (
              <span className="text-[11px] font-semibold text-amber-600">
                Peringatan: Berjarak ≤ 3 meter dari bibir sungai
              </span>
            ) : relocationStatus.isNearTpa ? (
              <span className="text-[11px] font-semibold text-purple-600">
                Catatan: Dekat TPA (Tanpa akses air bersih &amp; limbah)
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-600">
                Lokasi kosong valid &amp; siap dipindahkan
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRelocationTarget(null);
                setRelocationStatus((prev) => ({
                  ...prev,
                  hasTarget: false,
                  isOverlap: false,
                  overlappingBuildingName: null,
                  canRelocate: false,
                }));
              }}
              className="text-neutral-600 hover:text-neutral-900 border-neutral-200 cursor-pointer"
            >
              Ganti Titik
            </Button>
            <Button
              variant={relocationStatus.canRelocate ? "green" : "outline"}
              size="sm"
              disabled={!relocationStatus.canRelocate}
              onClick={handleConfirmRelokasi}
              className={cn(
                "box-shadow-custom font-bold px-4",
                relocationStatus.canRelocate
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50 bg-neutral-200 text-neutral-500 border-neutral-300"
              )}
            >
              <Check className="size-3.5 mr-1" />
              Konfirmasi
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function BuildContent() {
  const { stats } = useMapContext();

  return (
    <div className="mt-2 flex flex-col gap-2 overflow-y-scroll overflow-x-hidden pr-1 ">
      <BuildingMode />
      <ItemGroup className="gap-2 h-full grid grid-cols-2 p-2">
        {stats.map((item_ringkasan, index) => {

          return (
            <Item
              key={index}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-neutral-50 transition-colors border-none box-shadow-custom lg:py-1"
            >
              <ItemHeader className="w-full flex items-center justify-between gap-2">
                <ItemTitle className="flex flex-1 min-w-0 flex-col items-start gap-0.5 line-clamp-none">
                  <span className="text-body-5 font-medium text-black">
                    {item_ringkasan.name}
                  </span>
                  <p className="text-body-1! font-bold text-black">
                    {item_ringkasan.data.value}
                    {item_ringkasan.data.satuan ? (
                      <>
                        {item_ringkasan.data.usingSpace ? " " : ""}
                        <span
                          className={cn(
                            item_ringkasan.data.boldSatuan
                              ? "font-bold"
                              : "font-normal",
                            item_ringkasan.data.mini && "text-body-1 font-normal"
                          )}
                        >
                          {item_ringkasan.data.satuan === "percentage"
                            ? "%"
                            : item_ringkasan.data.satuan}
                        </span>
                      </>
                    ) : (
                      ""
                    )}
                  </p>
                </ItemTitle>
                <ItemActions
                  className={cn(
                    "shrink-0 size-8 rounded-full flex items-center justify-center",
                    ITEM_BG_COLORS[index % ITEM_BG_COLORS.length]
                  )}
                >
                  <Image src={item_ringkasan.srcIcon} alt="icon" width={16} height={16} className="size-4 text-neutral-700" />
                </ItemActions>
              </ItemHeader>
              {item_ringkasan.description && (
                <ItemDescription className="text-body-5! font-light text-black">
                  {item_ringkasan.description}
                </ItemDescription>
              )}
            </Item>
          );
        })}
      </ItemGroup>
      <RequirementPanel />
      <RecommendationPanel />
    </div>
  );
}
