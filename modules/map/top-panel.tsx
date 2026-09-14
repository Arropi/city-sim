"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Rocket, Layers2Icon } from "lucide-react";
import { useMapContext, MapMode, MapLayer } from "@/hooks/useMapContext";
import Image from "next/image";
import PopupPanel from "./popup-panel";

const MODE_OPTIONS: { label: string; value: MapMode; icon: string }[] = [
  {
    label: "View Mode",
    value: "view",
    icon: "Eye",
  },
  {
    label: "Build Mode",
    value: "build",
    icon: "Rocket",
  }
];
const LAPISAN_OPTIONS: { label: string; value: MapLayer; icon: string }[] = [
  {
    label: "Lapisan Peta",
    value: "semua lapisan",
    icon: "Layers2Icon",
  },
  {
    label: "Area Bangunan",
    value: "bangunan",
    icon: "Layers2Icon",
  },
  {
    label: "Drainase",
    value: "drainase",
    icon: "Layers2Icon",
  },
];

const getIcon = (icon: string) => {
  const IconMap = {
    Eye,
    Rocket,
    Layers2Icon,
  };
  return IconMap[icon as keyof typeof IconMap];
};

export default function TopPanel() {
  const { mode, setMode, layer, setLayer } = useMapContext();
  const ModeIcon = getIcon(MODE_OPTIONS.find((item) => item.value === mode)?.icon || "Eye")
  const LayerIcon = getIcon(LAPISAN_OPTIONS.find((item)=> item.value == layer)?.icon || "Layers2Icon")
  return (
    <section className="absolute flex flex-row top-2 right-3 gap-2">
      <Select value={MODE_OPTIONS.find((item) => item.value === mode)?.label} onValueChange={(v) => { setMode(v as MapMode) }}>
        <SelectTrigger
          className={
            "bg-white box-shadow-custom border-none rounded-xl px-4 py-2.5"
          }
        >
          <ModeIcon className="size-4 text-red-200" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className={"bg-white"}>
            {MODE_OPTIONS.map((item) => {
              return (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select value={LAPISAN_OPTIONS.find((item)=> item.value == layer)?.label} onValueChange={(v) => setLayer(v as MapLayer)}>
        <SelectTrigger
          className={
            "bg-white box-shadow-custom border-none rounded-xl px-4 py-2.5"
          }
        >
          <LayerIcon className="size-4 text-tertiary-400" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup className={"bg-white"}>
            {LAPISAN_OPTIONS.map((item) => {
              return (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      <PopupPanel />
      <Button className={"bg-white box-shadow-custom border-none"}>
        <Image width={16} height={16} alt="Panduan" src={"/icons/notepad.svg"} className="size-4 text-accent-400"/>
        Panduan
      </Button>
    </section>
  );
}
