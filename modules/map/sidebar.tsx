import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ArrowBigLeft, ArrowLeftIcon, BadgeCheckIcon, ChevronRightIcon, MinusSquare } from "lucide-react";

export default function SidebarMap() {
  return (
    <section className="absolute w-96 py-2 px-2 bg-white rounded-br-xl">
      <Item>
        <ItemMedia>
          <ArrowLeftIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="">Kota Madiun</ItemTitle>
          <ItemDescription>Jawa Timur - Luas Wilayah 3233 km²</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant={"outline"} size={"icon"} className={"border-2 p-5 border-none box-shadow-custom"}>
            <MinusSquare className="size-10" />
          </Button>
        </ItemActions>
      </Item>
    </section>
  );
}
