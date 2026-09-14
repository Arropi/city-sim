"use client";

import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { MAP_ITEMS } from "@/constants/helper";
import { ArrowLeftIcon } from "lucide-react";
import { getIcon } from "@/lib/utils";
import Link from "next/link";
import RequirementPanel from "./requirement";
import dynamic from "next/dynamic";

const RecommendationPanel = dynamic(() => import("./recommendation"), {
  ssr: false,
});

interface SidebarBuildProps {
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SidebarBuild({
  isExpanded,
  setIsExpanded,
}: SidebarBuildProps) {
  return (
    <>
      <Item onClick={()=> {setIsExpanded((prev) => !prev)}}>
        <ItemMedia>
          <Link href="/" aria-label="Kembali ke beranda">
            <ArrowLeftIcon className="size-4 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer" />
          </Link>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Perumahan Nasional hehe</ItemTitle>
        </ItemContent>
      </Item>
      <div className="flex flex-row gap-1">
        <Button variant={"yellow"} className={"flex-1"}>Revitalisasi</Button>
        <Button className={"flex-1"}>Relokasi</Button>
        <Button variant={"green"} className={"flex-1"}>Rekonstruksi</Button>
      </div>
      {isExpanded && <BuildContent />}
    </>
  );
}

function BuildContent() {
  return (
    <div className="mt-2 flex flex-col gap-2 overflow-y-scroll overflow-x-hidden pr-1 ">
      <ItemGroup className="gap-2 h-full grid grid-cols-2">
        {MAP_ITEMS.map((item_ringkasan, index) => {
          const IconComponent = getIcon(item_ringkasan.icon);

          return (
            <Item
              key={index}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-neutral-50 transition-colors"
            >
              <ItemActions >
                <IconComponent className="size-4 text-neutral-700" />
              </ItemActions>
              <ItemContent>
                <ItemTitle className="flex flex-col items-start gap-0.5 line-clamp-none w-full">
                  <span className="text-xs font-normal text-muted-foreground">
                    {item_ringkasan.name}
                  </span>
                  <span className="text-sm font-bold text-neutral-900">
                    {item_ringkasan.data.value}{item_ringkasan.data.satuan ? <span className={item_ringkasan.data.boldSatuan ? "font-bold" : "font-normal"}>{item_ringkasan.data.satuan}</span> : ""}
                  </span>
                </ItemTitle>
                {item_ringkasan.description && (
                  <ItemDescription className="text-xs text-muted-foreground">
                    {item_ringkasan.description}
                  </ItemDescription>
                )}
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
      <RequirementPanel />
      <RecommendationPanel />
    </div>
  );
}
