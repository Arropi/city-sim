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
import { BUILDING_TYPE } from "@/constants/helper";
import { getIcon } from "@/lib/utils";

export default function BuildingMode() {
  return (
    <>
      <div className="flex justify-between items-center">
        <h1>Pilihan Pembangunan</h1>
        <Select defaultValue={"Hunian"}>
          <SelectTrigger
            className={
              "bg-white box-shadow-custom border-none rounded-xl px-4 py-2.5"
            }
          >
            <SelectValue className={"text-body-3 font-normal"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup className={"bg-white"}>
              <SelectItem value="Hunian">Hunian</SelectItem>
              <SelectItem value="Infrastruktur">Infrastruktur</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <ItemGroup className="w-full grid grid-cols-4 gap-2 mt-4">
        {BUILDING_TYPE.map((item_pembanguan) => {
          const Icon = getIcon(item_pembanguan.icon);
          return (
            <Item key={item_pembanguan.id} className="bg-white hover:bg-neutral-50 transition-colors border-none box-shadow-custom gap-1 lg:py-1.5">
              <ItemHeader className="flex items-center justify-center">
                <Icon />
              </ItemHeader>
              <ItemContent className="flex items-center justify-center">
                <ItemTitle className="text-center text-body-5 font-normal">{item_pembanguan.label}</ItemTitle>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </>
  );
}
