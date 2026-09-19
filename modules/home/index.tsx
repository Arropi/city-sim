"use client";

import { useEffect, useMemo, useState } from "react";
import { Carousel, CarouselCardItem } from "@/components/carousel";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";
import { getCities, type CityDetail } from "@/app/map/[slugid]/actions";
import { formatDensity } from "@/lib/utils";
import {
  CITY_CENTERS,
  CITY_BOUNDS,
  CITY_COORDINATES,
  CENTER,
  buildMapCityHref,
  type CityCoordConfig,
} from "@/constants/helper";

export {
  CITY_CENTERS,
  CITY_BOUNDS,
  CITY_COORDINATES,
  CENTER,
  buildMapCityHref,
  type CityCoordConfig,
};

const CITY_IMAGES: Record<string, string> = {
  madiun:
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=60",
  kediri:
    "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&auto=format&fit=crop&q=60",
  mojokerto:
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop&q=60",
  pasuruan:
    "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=60",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=60";

const DUMMY_CITIES: CarouselCardItem[] = [
  {
    id: "madiun",
    title: "Kota Madiun",
    subtitle: "Kota Madiun, Jawa Timur",
    image: CITY_IMAGES.madiun,
    href: buildMapCityHref("madiun", CITY_CENTERS.madiun, CITY_BOUNDS.madiun),
    center: CITY_CENTERS.madiun,
    bounds: CITY_BOUNDS.madiun,
    rtlhPercentage: 30.3,
    density: "6.071k jiwa",
  },
  {
    id: "kediri",
    title: "Kota Kediri",
    subtitle: "Kota Kediri, Jawa Timur",
    image: CITY_IMAGES.kediri,
    href: buildMapCityHref("kediri", CITY_CENTERS.kediri, CITY_BOUNDS.kediri),
    center: CITY_CENTERS.kediri,
    bounds: CITY_BOUNDS.kediri,
    rtlhPercentage: 12.9,
    density: "4.295k jiwa",
  },
  {
    id: "mojokerto",
    title: "Kota Mojokerto",
    subtitle: "Kota Mojokerto, Jawa Timur",
    image: CITY_IMAGES.mojokerto,
    href: buildMapCityHref("mojokerto", CITY_CENTERS.mojokerto, CITY_BOUNDS.mojokerto),
    center: CITY_CENTERS.mojokerto,
    bounds: CITY_BOUNDS.mojokerto,
    rtlhPercentage: 109.1,
    density: "6.887k jiwa",
  },
  {
    id: "pasuruan",
    title: "Kota Pasuruan",
    subtitle: "Kota Pasuruan, Jawa Timur",
    image: CITY_IMAGES.pasuruan,
    href: buildMapCityHref("pasuruan", CITY_CENTERS.pasuruan, CITY_BOUNDS.pasuruan),
    center: CITY_CENTERS.pasuruan,
    bounds: CITY_BOUNDS.pasuruan,
    rtlhPercentage: 10.7,
    density: "5.297k jiwa",
  },
];

interface HomeProps {
  initialCities?: CityDetail[];
}

export default function Home({ initialCities }: HomeProps) {
  const [cities, setCities] = useState<CityDetail[]>(initialCities || []);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!initialCities || initialCities.length === 0) {
      getCities().then((data) => {
        if (data && data.length > 0) {
          setCities(data);
        }
      });
    }
  }, [initialCities]);

  const carouselItems: CarouselCardItem[] = useMemo(() => {
    if (!cities || cities.length === 0) {
      return DUMMY_CITIES;
    }

    return cities.map((city) => {
      const unfit = Number(city.unfit_housing_count ?? 0);
      const residentials = Number(
        city.residential_count ??
          city.residential_buildings_count ??
          city.building_residentials_count ??
          city.total_residential_buildings ??
          0
      );
      const rtlhPercentage =
        residentials > 0 ? Number(((unfit / residentials) * 100).toFixed(1)) : 0;

      const density = formatDensity(city.population_density);

      const coordConfig = CITY_COORDINATES[city.id.toLowerCase()];
      const center =
        (city.center as [number, number]) || coordConfig?.center;
      const bounds =
        (city.bounds as [[number, number], [number, number]]) || coordConfig?.bounds;
      const href = buildMapCityHref(city.id, center, bounds);

      return {
        id: city.id,
        title: city.name,
        subtitle:
          (city.provinsi as string) ||
          (city.province as string) ||
          "Jawa Timur",
        image:
          (city.image as string) ||
          CITY_IMAGES[city.id] ||
          DEFAULT_IMAGE,
        href,
        center,
        bounds,
        rtlhPercentage,
        density,
      };
    });
  }, [cities]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return carouselItems;
    const q = searchQuery.toLowerCase().trim();
    return carouselItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
      const matchId = String(item.id).toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchId;
    });
  }, [carouselItems, searchQuery]);

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col items-center justify-center relative px-4 py-2 sm:py-4 gap-2 sm:gap-3">
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
          Ayo, Coba Simulasikan Kotamu!
        </h1>
        <p className="text-body-3 sm:text-heading-7 font-normal text-neutral-600">
          Cari wilayah untuk melihat kondisi dan informasi pemukiman
        </p>
        <div className="relative w-full max-w-md mt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
          <Input
            placeholder="Cari Lah"
            className="w-full pl-10 h-9 sm:h-10 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      {filteredItems.length > 0 ? (
        <Carousel
          key={filteredItems.map((item) => item.id).join(",")}
          showIndicators={false}
          items={filteredItems}
          autoPlay={false}
          visibleCards={3}
          gap={16}
          imageAspectRatio="aspect-[16/7]"
        />
      ) : (
        <div className="relative z-10 w-full min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center text-center px-4">
          <p className="text-body-2 sm:text-body-1 font-medium text-neutral-600">
            Kota saat ini belum tersedia
          </p>
        </div>
      )}
    </div>
  );
}

