'use client';

import { useState, useEffect } from "react";
import { SidebarView } from "./sidebar-view";
import { SidebarBuild } from "./sidebar-build";
import { useMapContext } from "@/hooks/useMapContext";
import type { CityGrid, CityDetail } from "@/app/map/[slugid]/actions";

export default function SidebarMap({
  title,
  subtitle,
  cityGrids,
  cityData,
}: {
  title: string;
  subtitle: string;
  cityGrids?: CityGrid[];
  cityData?: CityDetail | null;
}) {
  const { mode, setCityGrids, setCityData } = useMapContext();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (cityData) {
      setCityData(cityData);
    }
  }, [cityData, setCityData]);

  useEffect(() => {
    if (cityGrids && cityGrids.length > 0) {
      setCityGrids(cityGrids);
    }
  }, [cityGrids, setCityGrids]);

  return (
    <section className="absolute top-0 left-0 z-10 w-96 flex max-h-screen flex-col py-2 px-2 bg-white rounded-br-xl shadow-md border-r border-b border-neutral-200">
      {mode === "view" ? (
        <SidebarView
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          title={title}
          subtitle={subtitle}
        />
      ) : (
        <SidebarBuild
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          title={title}
        />
      )}
    </section>
  );
}
