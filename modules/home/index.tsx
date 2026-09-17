import { Carousel, CarouselCardItem } from "@/components/carousel";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";

const DUMMY_CITIES: CarouselCardItem[] = [
  {
    id: "madiun",
    title: "Kecamatan Taman",
    subtitle: "Kota Madiun, Jawa Timur",
    image:
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=60",
    href: "/map/madiun",
    rtlhPercentage: 15,
    density: "6.065k jiwa",
  },
  {
    id: "kartoharjo",
    title: "Kecamatan Kartoharjo",
    subtitle: "Kota Madiun, Jawa Timur",
    image:
      "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&auto=format&fit=crop&q=60",
    href: "/map/madiun",
    rtlhPercentage: 8.5,
    density: "4.210k jiwa",
  },
  {
    id: "manguharjo",
    title: "Kecamatan Manguharjo",
    subtitle: "Kota Madiun, Jawa Timur",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop&q=60",
    href: "/map/madiun",
    rtlhPercentage: 12.3,
    density: "5.180k jiwa",
  },
];

export default function Home() {
  return (
    <div className="w-full h-full max-h-screen overflow-hidden flex flex-col items-center justify-center relative px-4 py-2 sm:py-4 gap-2 sm:gap-3">
      <div className="flex flex-col max-w-xl justify-center items-center h-fit text-center w-full">
        <Image
          src={"/heading.png"}
          alt="heading"
          width={400}
          height={120}
          priority
          className="w-56 sm:w-64 h-auto mb-1"
        />
        <h1 className="text-heading-6 sm:text-heading-5 font-bold text-neutral-900">
          Meh liat mana?
        </h1>
        <p className="text-body-3 sm:text-heading-7 font-normal text-neutral-600">
          Cari wilayah untuk melihat kondisi dan informasi perumahan
        </p>
        <div className="relative w-full max-w-md mt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
          <Input
            placeholder="Cari Lah"
            className="w-full pl-10 h-9 sm:h-10 text-sm"
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-fit pointer-events-none z-0">
        <Image
          src={"/bg-main.png"}
          alt="bg-main"
          width={1920}
          height={160}
          priority
          className="w-full h-auto  object-cover object-bottom opacity-60"
        />
      </div>
      <Carousel
        showIndicators={false}
        items={DUMMY_CITIES}
        autoPlay={false}
        visibleCards={3}
        gap={16}
        imageAspectRatio="aspect-[16/7]"
      />
    </div>
  );
}
