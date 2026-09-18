import { useEffect, useMemo } from "react";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUILDING_TYPE, isDrainaseType } from "@/constants/helper";
import { getIcon, cn } from "@/lib/utils";
import { useMapContext } from "@/hooks/useMapContext";

export default function BuildingMode() {
  const {
    layer,
    selectedBuildType,
    setSelectedBuildType,
    buildingFloors,
    setBuildingFloors,
  } = useMapContext();

  // Filter pilihan bangunan berdasarkan layer aktif
  const filteredBuildingTypes = useMemo(() => {
    if (layer === "bangunan") {
      return BUILDING_TYPE.filter((item) => item.layer === "bangunan");
    }
    if (layer === "drainase") {
      return BUILDING_TYPE.filter((item) => item.layer === "drainase");
    }
    return BUILDING_TYPE;
  }, [layer]);

  // Jaga agar selectedBuildType selalu selaras dengan filter layer aktif
  useEffect(() => {
    const isCurrentValid = filteredBuildingTypes.some(
      (item) => item.id === selectedBuildType
    );
    if (!isCurrentValid && filteredBuildingTypes.length > 0) {
      setSelectedBuildType(filteredBuildingTypes[0].id);
    }
  }, [filteredBuildingTypes, selectedBuildType, setSelectedBuildType]);

  const isRth = selectedBuildType === "rth";
  const isDrainase = isDrainaseType(selectedBuildType);

  // Tab select pilihan tingkat lantai tidak muncul ketika yang diklik adalah RTH dan seluruh type drainase
  const showFloorSelect = !isRth && !isDrainase;

  return (
    <>
      <div className="flex justify-between items-center min-h-[40px]">
        <h1 className="font-semibold text-neutral-900 text-sm">Pilihan Pembangunan</h1>
        {showFloorSelect && (
          <Select
            value={String(buildingFloors || 1)}
            onValueChange={(val) => setBuildingFloors(Number(val))}
          >
            <SelectTrigger
              className={
                "bg-white box-shadow-custom border-none rounded-xl px-3 py-1.5 h-8 text-xs font-medium cursor-pointer w-28"
              }
            >
              <SelectValue className="text-body-5 font-medium" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectGroup>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                  <SelectItem key={lvl} value={String(lvl)} className="cursor-pointer text-xs">
                    {lvl} Lantai
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      <ItemGroup className="w-full grid grid-cols-4 gap-2 mt-3">
        {filteredBuildingTypes.map((item_pembanguan) => {
          const Icon = getIcon(item_pembanguan.icon);
          const isSelected = selectedBuildType === item_pembanguan.id;

          return (
            <Item
              key={item_pembanguan.id}
              onClick={() => setSelectedBuildType(item_pembanguan.id)}
              className={cn(
                "bg-white hover:bg-neutral-50 transition-all border-none box-shadow-custom gap-1 lg:py-1.5 cursor-pointer select-none",
                isSelected &&
                  "ring-2 ring-primary-500 bg-primary-10/40 font-semibold brightness-95"
              )}
            >
              <ItemHeader className="flex items-center justify-center">
                <Icon className={cn("size-4", isSelected ? "text-primary-600" : "text-neutral-700")} />
              </ItemHeader>
              <ItemContent className="flex items-center justify-center">
                <ItemTitle
                  className={cn(
                    "text-center text-body-5 font-normal line-clamp-1",
                    isSelected && "font-semibold text-primary-700"
                  )}
                >
                  {item_pembanguan.label}
                </ItemTitle>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </>
  );
}
