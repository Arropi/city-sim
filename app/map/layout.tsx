"use client";

import { MapContextProvider } from "@/hooks/useMapContext";
import { PropsWithChildren } from "react";

export default function MapLayout({ children }: PropsWithChildren) {
    return (
        <MapContextProvider>
            {children}
        </MapContextProvider>
    )
}   