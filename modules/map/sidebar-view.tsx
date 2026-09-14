import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { MAP_ITEMS } from "@/constants/helper";
import { getIcon } from "@/lib/utils";
import { ArrowLeftIcon, PlusSquare, MinusSquare } from "lucide-react";
import Link from "next/link";

interface SidebarViewProps {
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}


function ViewContent() {
  return (
    <div className="mt-2 flex flex-col gap-2 overflow-y-hidden overflow-x-hidden pr-1 ">
      <h1 className="text-base font-semibold text-neutral-900 px-2 pt-1">Ringkasan</h1>
      <ItemGroup className="gap-2 h-full overflow-y-scroll">
        {MAP_ITEMS.map((item_ringkasan, index) => {
          const IconComponent = getIcon(item_ringkasan.icon);

          return (
            <Item
              key={index}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-neutral-50 transition-colors"
            >
              <ItemMedia variant="icon">
                <IconComponent className="size-4 text-neutral-700" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="flex flex-col items-start gap-0.5 line-clamp-none w-full">
                  <span className="text-xs font-normal text-muted-foreground">
                    {item_ringkasan.name}
                  </span>
                  <h1 className="text-sm font-bold text-neutral-900">
                    {item_ringkasan.data.value}{item_ringkasan.data.satuan ? <span className={item_ringkasan.data.boldSatuan ? "font-bold" : "font-normal"}>{item_ringkasan.data.satuan}</span> : ""}
                  </h1>
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
    </div>
  );
}

export function SidebarView({
  isExpanded,
  setIsExpanded,
}: SidebarViewProps) {
  return (
    <>
      <Item>
        <ItemMedia>
          <Link href="/" aria-label="Kembali ke beranda">
            <ArrowLeftIcon className="size-4 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer" />
          </Link>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Kota Madiun</ItemTitle>
          <ItemDescription>Jawa Timur - Luas Wilayah 3233 km²</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            variant="yellow"
            size="sm"
            className="box-shadow-custom box-shadow-x-2 box-shadow-y-4 box-shadow-blur-3 box-shadow-color-[#232323]/15"
            onClick={() => {
              setIsExpanded((prev: boolean) => !prev);
            }}
            aria-label={isExpanded ? "Tutup ringkasan" : "Buka ringkasan"}
          >
            {isExpanded ? <MinusSquare className="size-4.5" /> : <PlusSquare className="size-4.5" />}
          </Button>
        </ItemActions>
      </Item>

      {isExpanded && <ViewContent />}
    </>
  );
}