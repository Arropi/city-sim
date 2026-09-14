'use client';

import { useState } from "react";
import { SidebarView } from "./sidebar-view";
import { SidebarBuild } from "./sidebar-build";
import { useMapContext } from "@/hooks/useMapContext";

export default function SidebarMap() {
  const {mode} = useMapContext();
  const [isExpanded, setIsExpanded] = useState(false);
  

  return (
    <section className="absolute top-0 left-0 z-10 w-96 flex max-h-screen flex-col py-2 px-2 bg-white rounded-br-xl shadow-md border-r border-b border-neutral-200">
      {mode === "view" ? (
        <SidebarView isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      ) : (
        <SidebarBuild isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      )}
    </section>
  );
}
