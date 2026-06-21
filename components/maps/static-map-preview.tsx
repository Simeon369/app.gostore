"use client";

import dynamic from "next/dynamic";
import { getDirectionsUrl } from "@/lib/geo";
import { MapPin, Navigation } from "lucide-react";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium">
      Loading map...
    </div>
  ),
});

interface StaticMapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
  showDirections?: boolean;
  className?: string;
}

export function StaticMapPreview({
  lat,
  lng,
  address,
  showDirections = true,
  className = "",
}: StaticMapPreviewProps) {
  const directionsUrl = getDirectionsUrl(lat, lng);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {address && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{address}</span>
        </div>
      )}
      <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-border bg-muted">
        <LeafletMap lat={lat} lng={lng} />
      </div>
      {showDirections && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
        >
          <Navigation className="w-3.5 h-3.5" />
          Get directions
        </a>
      )}
    </div>
  );
}

