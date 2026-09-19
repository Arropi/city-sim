import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, PlusSquare, MinusSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMapContext } from "@/hooks/useMapContext";

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

interface SidebarViewProps {
  title: string;
  subtitle: string;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

function ViewContent() {
  const { stats } = useMapContext();

  return (
    <div className="mt-2 flex flex-col gap-2 overflow-y-hidden overflow-x-hidden pr-1 ">
      <h1 className="text-base font-semibold text-neutral-900 px-2 pt-1">
        Ringkasan
      </h1>
      <ItemGroup className="gap-2 h-full overflow-y-scroll p-2">
        {stats.map((item_ringkasan, index) => {
          return (
            <Item
              key={index}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-neutral-50 transition-colors border-none box-shadow-custom lg:py-1"
            >
              <ItemMedia
                variant="icon"
                className={cn(
                  "my-auto !self-center group-has-data-[slot=item-description]/item:!self-center group-has-data-[slot=item-description]/item:!translate-y-0 shrink-0 size-10 rounded-full flex items-center justify-center",
                  ITEM_BG_COLORS[index % ITEM_BG_COLORS.length]
                )}
              >
                <Image
                  src={item_ringkasan.srcIcon}
                  alt="icon"
                  width={16}
                  height={16}
                  className="size-5 text-neutral-700"
                />
              </ItemMedia>
              <ItemContent className="gap-0">
                <ItemTitle className="flex flex-col items-start gap-0.5 line-clamp-none w-full">
                  <span className="text-body-4 font-semibold text-neutral-900 leading-none">
                    {item_ringkasan.name}
                  </span>
                  <h1 className="text-heading-7 font-bold text-neutral-1000">
                    {item_ringkasan.data.value}
                    {item_ringkasan.data.satuan ? (
                      <>
                        {item_ringkasan.data.usingSpace ? " " : ""}
                        <span
                          className={cn(
                            item_ringkasan.data.boldSatuan
                              ? "font-bold"
                              : "font-normal",
                            item_ringkasan.data.mini && "text-body-5 font-normal"
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
                  </h1>
                </ItemTitle>
                {item_ringkasan.description && (
                  <ItemDescription className="text-body-5 text-shadow-neutral-900 font-light">
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

export function SidebarView({ title, subtitle, isExpanded, setIsExpanded }: SidebarViewProps) {
  return (
    <>
      <Item>
        <ItemMedia>
          <Link href="/" aria-label="Kembali ke beranda">
            <ArrowLeftIcon className="size-4 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer" />
          </Link>
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="font-bold text-heading-7">{title || "Kota Madiun"}</ItemTitle>
          <ItemDescription className="text-body-4 font-normal">{subtitle || "Jawa Timur - Luas Wilayah 3233 km²"}</ItemDescription>
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
            {isExpanded ? (
              <MinusSquare className="size-4.5" />
            ) : (
              <PlusSquare className="size-4.5" />
            )}
          </Button>
        </ItemActions>
      </Item>

      {isExpanded && <ViewContent />}
    </>
  );
}
